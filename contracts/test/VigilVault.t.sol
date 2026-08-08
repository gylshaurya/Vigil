// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VigilVault} from "../src/VigilVault.sol";

contract Receiver {
    receive() external payable {}
}

contract VigilVaultTest is Test {
    VigilVault vault;

    address owner = makeAddr("owner");
    address guardian = makeAddr("guardian");
    address attacker = makeAddr("attacker");
    address recipient = makeAddr("recipient");

    uint256 constant THRESHOLD = 1 ether;
    uint256 constant DELAY = 60;
    uint256 constant WINDOW_DURATION = 1 days;
    uint256 constant WINDOW_LIMIT = 3 ether;

    function setUp() public {
        vault = new VigilVault(owner, guardian, THRESHOLD, DELAY, WINDOW_DURATION, WINDOW_LIMIT);
        vm.deal(address(vault), 100 ether);
    }

    /* ------------------------- instant path ------------------------- */

    function test_smallTransferExecutesInstantly() public {
        uint256 before = recipient.balance;
        vm.prank(owner);
        (uint256 id, bool instant) = vault.propose(recipient, 0.1 ether, "");
        assertTrue(instant);
        assertEq(id, 0);
        assertEq(recipient.balance, before + 0.1 ether);
    }

    function test_allowlistedRecipientBypassesThresholdEntirely() public {
        _allowlist(recipient);

        vm.prank(owner);
        (, bool instant) = vault.propose(recipient, 10 ether, "");
        assertTrue(instant);
        assertEq(recipient.balance, 10 ether);
    }

    /* ------------------------- queued path ------------------------- */

    function test_largeTransferIsQueuedNotSent() public {
        uint256 before = recipient.balance;
        vm.prank(owner);
        (uint256 id, bool instant) = vault.propose(recipient, 5 ether, "");
        assertFalse(instant);
        assertEq(recipient.balance, before);

        (,,, uint64 readyAt, bool executed,,) = vault.getAction(id);
        assertFalse(executed);
        assertEq(readyAt, block.timestamp + DELAY);
    }

    function test_queuedTransferExecutesAfterDelay() public {
        vm.prank(owner);
        (uint256 id,) = vault.propose(recipient, 5 ether, "");

        vm.expectRevert("VigilVault: still delayed");
        vault.executeAction(id);

        vm.warp(block.timestamp + DELAY);
        vault.executeAction(id);
        assertEq(recipient.balance, 5 ether);
    }

    function test_anyoneCanExecuteReadyAction() public {
        vm.prank(owner);
        (uint256 id,) = vault.propose(recipient, 5 ether, "");
        vm.warp(block.timestamp + DELAY);

        vm.prank(attacker); // a random keeper, not owner or guardian
        vault.executeAction(id);
        assertEq(recipient.balance, 5 ether);
    }

    /* --------------------------- the demo --------------------------- */

    /// @notice The core hackathon demo: attacker has the owner key and tries
    ///         to drain the vault. Small test send goes through instantly.
    ///         The full drain gets queued, the guardian sees it and vetoes it,
    ///         and the funds never move.
    function test_demo_attackerWithOwnerKeyCannotDrainPastGuardian() public {
        // `owner` here stands in for "attacker who has stolen the owner key" —
        // the vault only knows the key, not who is holding it.

        // 1. $10-equivalent test transfer lands instantly, wallet still "works".
        vm.prank(owner);
        (, bool smallInstant) = vault.propose(recipient, 0.01 ether, "");
        assertTrue(smallInstant);

        // 2. Attacker goes for everything.
        uint256 vaultBalanceBefore = address(vault).balance;
        vm.prank(owner);
        (uint256 drainId, bool drainInstant) = vault.propose(recipient, vaultBalanceBefore, "");
        assertFalse(drainInstant, "large drain must not be instant");

        // 3. Guardian (second key, e.g. on the owner's phone) vetoes it.
        vm.prank(guardian);
        vault.veto(drainId);

        // 4. Even after the delay elapses, the vetoed action cannot execute.
        vm.warp(block.timestamp + DELAY);
        vm.expectRevert("VigilVault: vetoed");
        vault.executeAction(drainId);

        assertEq(address(vault).balance, vaultBalanceBefore, "funds must remain safe");
    }

    function test_demo_attackerCannotDisableGuardWithoutDelay() public {
        // Again, `owner` stands in for an attacker holding the stolen owner key.
        vm.prank(owner);
        (uint256 id,) = vault.propose(address(vault), 0, abi.encodeCall(VigilVault.disableGuard, ()));

        // Config change must always be queued, even value = 0, data present.
        (,,,, bool executed,,) = vault.getAction(id);
        assertFalse(executed);
        assertEq(vault.instantThreshold(), THRESHOLD, "threshold unchanged before delay");

        vm.prank(guardian);
        vault.veto(id);

        vm.warp(block.timestamp + DELAY);
        vm.expectRevert("VigilVault: vetoed");
        vault.executeAction(id);

        assertEq(vault.instantThreshold(), THRESHOLD, "guard still on after veto");
    }

    /* ------------------------- veto semantics ------------------------- */

    function test_onlyGuardianCanVeto() public {
        vm.prank(owner);
        (uint256 id,) = vault.propose(recipient, 5 ether, "");

        vm.prank(attacker);
        vm.expectRevert("VigilVault: not guardian");
        vault.veto(id);
    }

    function test_cannotVetoAlreadyExecutedAction() public {
        vm.prank(owner);
        (uint256 id,) = vault.propose(recipient, 5 ether, "");
        vm.warp(block.timestamp + DELAY);
        vault.executeAction(id);

        vm.prank(guardian);
        vm.expectRevert("VigilVault: already executed");
        vault.veto(id);
    }

    /* --------------------- rolling window limit --------------------- */

    function test_rollingWindowBlocksSplitAttack() public {
        // Threshold is 1 ETH, window limit is 3 ETH over 1 day.
        vm.startPrank(owner);
        for (uint256 i = 0; i < 3; i++) {
            (, bool instant) = vault.propose(recipient, 1 ether, "");
            assertTrue(instant, "first three 1-ETH sends should be instant");
        }
        // A 4th "small" transfer would push cumulative spend to 4 ETH > 3 ETH limit.
        (uint256 id, bool instant4) = vault.propose(recipient, 1 ether, "");
        vm.stopPrank();

        assertFalse(instant4, "cumulative rolling-window spend must force a queue");
        assertEq(recipient.balance, 3 ether);

        (,,, uint64 readyAt,,,) = vault.getAction(id);
        assertGt(readyAt, 0);
    }

    function test_rollingWindowRecoversAfterDuration() public {
        vm.startPrank(owner);
        for (uint256 i = 0; i < 3; i++) {
            vault.propose(recipient, 1 ether, "");
        }
        vm.stopPrank();
        assertEq(vault.rollingWindowRemaining(), 0);

        vm.warp(block.timestamp + WINDOW_DURATION + 1);
        assertEq(vault.rollingWindowRemaining(), WINDOW_LIMIT);

        vm.prank(owner);
        (, bool instant) = vault.propose(recipient, 1 ether, "");
        assertTrue(instant);
    }

    /* ------------------- recursive governance safety ------------------- */

    function test_configChangeIsAlwaysQueuedRegardlessOfSize() public {
        vm.prank(owner);
        (uint256 id, bool instant) =
            vault.propose(address(vault), 0, abi.encodeCall(VigilVault.setDelay, (0)));
        assertFalse(instant, "self-config must never take the instant path");
        assertEq(vault.delay(), DELAY, "delay unchanged until executed");

        vm.warp(block.timestamp + DELAY);
        vault.executeAction(id);
        assertEq(vault.delay(), 0, "delay updated only after queue + wait");
    }

    function test_onlySelfCanCallConfigSetters() public {
        vm.prank(owner);
        vm.expectRevert("VigilVault: only via queued action");
        vault.setDelay(0);

        vm.prank(guardian);
        vm.expectRevert("VigilVault: only via queued action");
        vault.disableGuard();
    }

    function test_disablingGuardIsItselfDelayedAndVetoable() public {
        vm.prank(owner);
        (uint256 id,) = vault.propose(address(vault), 0, abi.encodeCall(VigilVault.disableGuard, ()));

        vm.prank(guardian);
        vault.veto(id);

        vm.warp(block.timestamp + DELAY);
        vm.expectRevert("VigilVault: vetoed");
        vault.executeAction(id);

        assertEq(vault.instantThreshold(), THRESHOLD);
        assertEq(vault.rollingWindowLimit(), WINDOW_LIMIT);
    }

    function test_disableGuardWhenNotVetoedMakesEverythingInstant() public {
        vm.prank(owner);
        (uint256 id,) = vault.propose(address(vault), 0, abi.encodeCall(VigilVault.disableGuard, ()));
        vm.warp(block.timestamp + DELAY);
        vault.executeAction(id);

        assertEq(vault.instantThreshold(), type(uint256).max);

        vm.prank(owner);
        (, bool instant) = vault.propose(recipient, 50 ether, "");
        assertTrue(instant, "after disabling, guard no longer protects");
    }

    /* ----------------------------- misc ----------------------------- */

    function test_arbitraryContractCallsAlwaysQueuedEvenIfZeroValue() public {
        Receiver r = new Receiver();
        vm.prank(owner);
        (, bool instant) = vault.propose(address(r), 0, hex"12345678");
        assertFalse(instant, "any calldata must force a queue, value alone cannot bypass it");
    }

    function test_onlyOwnerCanPropose() public {
        vm.prank(attacker);
        vm.expectRevert("VigilVault: not owner");
        vault.propose(recipient, 0.1 ether, "");
    }

    function test_depositEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit VigilVault.Deposited(address(this), 1 ether);
        (bool ok,) = address(vault).call{value: 1 ether}("");
        assertTrue(ok);
    }

    function _allowlist(address who) internal {
        vm.prank(owner);
        (uint256 id,) = vault.propose(address(vault), 0, abi.encodeCall(VigilVault.setAllowlisted, (who, true)));
        vm.warp(block.timestamp + DELAY);
        vault.executeAction(id);
    }
}
