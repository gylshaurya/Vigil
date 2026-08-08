// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/// @title VigilVault
/// @notice A circuit-breaker smart contract wallet. Small, routine transfers execute
///         instantly. Anything large, unrecognized, or that touches the vault's own
///         policy is queued behind a time delay and can be vetoed by a second key.
///         Changing or disabling the policy is itself a queued, vetoable action, so
///         a compromised hot key can never simply switch the guard off.
contract VigilVault is ReentrancyGuard {
    /* -------------------------------------------------------------------- */
    /*                                 Types                                */
    /* -------------------------------------------------------------------- */

    struct Action {
        address target;
        uint256 value;
        bytes data;
        uint64 readyAt;
        bool executed;
        bool vetoed;
        address proposer;
    }

    struct WindowEntry {
        uint64 timestamp;
        uint192 amount;
    }

    /* -------------------------------------------------------------------- */
    /*                                 State                                */
    /* -------------------------------------------------------------------- */

    address public owner; // hot key — proposes transfers, signs day to day
    address public guardian; // cold / second-device key — can only veto, never spend

    uint256 public instantThreshold; // max value eligible for the instant path
    uint256 public delay; // seconds a queued action must wait before execution
    uint256 public rollingWindowDuration; // width of the rolling spend window
    uint256 public rollingWindowLimit; // max cumulative instant spend inside the window

    mapping(address => bool) public allowlisted; // trusted recipients: instant, no cap

    mapping(uint256 => Action) public actions;
    uint256 public actionCount;

    uint256 private constant WINDOW_SLOTS = 128;
    WindowEntry[WINDOW_SLOTS] private window;
    uint256 private windowCursor;

    /* -------------------------------------------------------------------- */
    /*                                 Events                               */
    /* -------------------------------------------------------------------- */

    event Deposited(address indexed from, uint256 amount);
    event InstantExecuted(address indexed target, uint256 value, bytes data, string reason);
    event ActionQueued(
        uint256 indexed id, address indexed target, uint256 value, bytes data, uint64 readyAt, address proposer
    );
    event ActionVetoed(uint256 indexed id, address indexed guardian);
    event ActionExecuted(uint256 indexed id);
    event GuardDisabled();
    event GuardReenabled(uint256 instantThreshold, uint256 rollingWindowLimit);
    event AllowlistUpdated(address indexed account, bool allowed);
    event OwnerUpdated(address indexed newOwner);
    event GuardianUpdated(address indexed newGuardian);
    event DelayUpdated(uint256 newDelay);
    event RollingWindowUpdated(uint256 newDuration, uint256 newLimit);

    /* -------------------------------------------------------------------- */
    /*                               Modifiers                              */
    /* -------------------------------------------------------------------- */

    modifier onlyOwner() {
        require(msg.sender == owner, "VigilVault: not owner");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian, "VigilVault: not guardian");
        _;
    }

    /// @dev Config-changing functions may only be invoked by the vault calling
    ///      itself, which only happens via a queued + delayed + vetoable Action.
    ///      This is what makes disabling the guard itself subject to the guard.
    modifier onlySelf() {
        require(msg.sender == address(this), "VigilVault: only via queued action");
        _;
    }

    /* -------------------------------------------------------------------- */
    /*                              Constructor                             */
    /* -------------------------------------------------------------------- */

    constructor(
        address _owner,
        address _guardian,
        uint256 _instantThreshold,
        uint256 _delay,
        uint256 _rollingWindowDuration,
        uint256 _rollingWindowLimit
    ) {
        require(_owner != address(0) && _guardian != address(0), "VigilVault: zero address");
        require(_owner != _guardian, "VigilVault: owner cannot be guardian");

        owner = _owner;
        guardian = _guardian;
        instantThreshold = _instantThreshold;
        delay = _delay;
        rollingWindowDuration = _rollingWindowDuration;
        rollingWindowLimit = _rollingWindowLimit;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /* -------------------------------------------------------------------- */
    /*                          Owner-facing entry point                    */
    /* -------------------------------------------------------------------- */

    /// @notice Propose a transaction from the vault. Plain ETH sends (no calldata)
    ///         below the instant threshold and inside the rolling window execute
    ///         immediately, as do sends to allowlisted recipients. Everything else —
    ///         large transfers, contract calls, and any change to the vault's own
    ///         policy (target == address(this)) — is queued behind `delay` and can
    ///         be vetoed by the guardian before it executes.
    function propose(address target, uint256 value, bytes calldata data)
        external
        onlyOwner
        returns (uint256 actionId, bool executedInstantly)
    {
        require(target != address(0), "VigilVault: zero target");

        bool isSelfConfig = (target == address(this));
        bool isPlainSend = (data.length == 0 && !isSelfConfig);

        if (isPlainSend && allowlisted[target]) {
            _execute(target, value, data);
            emit InstantExecuted(target, value, data, "allowlisted");
            return (0, true);
        }

        if (isPlainSend && value <= instantThreshold) {
            uint256 spent = _rollingWindowSpent();
            if (spent + value <= rollingWindowLimit) {
                _recordWindowSpend(value);
                _execute(target, value, data);
                emit InstantExecuted(target, value, data, "within-threshold");
                return (0, true);
            }
        }

        actionId = _queue(target, value, data);
        return (actionId, false);
    }

    /// @notice Anyone may execute a queued action once its delay has elapsed and it
    ///         has not been vetoed — this lets keepers/relayers finish the job even
    ///         if the owner's device is offline, without granting any new power.
    function executeAction(uint256 id) external nonReentrant {
        Action storage a = actions[id];
        require(a.proposer != address(0), "VigilVault: unknown action");
        require(!a.executed, "VigilVault: already executed");
        require(!a.vetoed, "VigilVault: vetoed");
        require(block.timestamp >= a.readyAt, "VigilVault: still delayed");

        a.executed = true;
        _execute(a.target, a.value, a.data);
        emit ActionExecuted(id);
    }

    /// @notice The guardian key can cancel any queued action before it executes.
    ///         The guardian can never move funds — only stop them from moving.
    function veto(uint256 id) external onlyGuardian {
        Action storage a = actions[id];
        require(a.proposer != address(0), "VigilVault: unknown action");
        require(!a.executed, "VigilVault: already executed");
        require(!a.vetoed, "VigilVault: already vetoed");

        a.vetoed = true;
        emit ActionVetoed(id, msg.sender);
    }

    /* -------------------------------------------------------------------- */
    /*                 Self-only config (reachable only via propose)        */
    /* -------------------------------------------------------------------- */

    function setInstantThreshold(uint256 newThreshold) external onlySelf {
        instantThreshold = newThreshold;
    }

    function setDelay(uint256 newDelay) external onlySelf {
        delay = newDelay;
        emit DelayUpdated(newDelay);
    }

    function setRollingWindow(uint256 newDuration, uint256 newLimit) external onlySelf {
        rollingWindowDuration = newDuration;
        rollingWindowLimit = newLimit;
        emit RollingWindowUpdated(newDuration, newLimit);
    }

    function setAllowlisted(address account, bool allowed) external onlySelf {
        allowlisted[account] = allowed;
        emit AllowlistUpdated(account, allowed);
    }

    function setOwner(address newOwner) external onlySelf {
        require(newOwner != address(0) && newOwner != guardian, "VigilVault: invalid owner");
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    function setGuardian(address newGuardian) external onlySelf {
        require(newGuardian != address(0) && newGuardian != owner, "VigilVault: invalid guardian");
        guardian = newGuardian;
        emit GuardianUpdated(newGuardian);
    }

    /// @notice Turns the circuit breaker off: every future send becomes instant.
    ///         Reachable only through the normal queue, so an attacker with the
    ///         hot key who tries to disable protection first still has to wait
    ///         out the delay — and can still be vetoed — before the guard drops.
    function disableGuard() external onlySelf {
        instantThreshold = type(uint256).max;
        rollingWindowLimit = type(uint256).max;
        emit GuardDisabled();
    }

    function reenableGuard(uint256 newThreshold, uint256 newRollingWindowLimit) external onlySelf {
        instantThreshold = newThreshold;
        rollingWindowLimit = newRollingWindowLimit;
        emit GuardReenabled(newThreshold, newRollingWindowLimit);
    }

    /* -------------------------------------------------------------------- */
    /*                                 Views                                */
    /* -------------------------------------------------------------------- */

    function rollingWindowSpent() external view returns (uint256) {
        return _rollingWindowSpent();
    }

    function rollingWindowRemaining() external view returns (uint256) {
        uint256 spent = _rollingWindowSpent();
        if (spent >= rollingWindowLimit) return 0;
        return rollingWindowLimit - spent;
    }

    function getAction(uint256 id)
        external
        view
        returns (
            address target,
            uint256 value,
            bytes memory data,
            uint64 readyAt,
            bool executed,
            bool vetoed,
            address proposer
        )
    {
        Action storage a = actions[id];
        return (a.target, a.value, a.data, a.readyAt, a.executed, a.vetoed, a.proposer);
    }

    /* -------------------------------------------------------------------- */
    /*                                Internal                              */
    /* -------------------------------------------------------------------- */

    function _queue(address target, uint256 value, bytes calldata data) internal returns (uint256 id) {
        id = ++actionCount;
        uint64 readyAt = uint64(block.timestamp + delay);
        actions[id] = Action({
            target: target,
            value: value,
            data: data,
            readyAt: readyAt,
            executed: false,
            vetoed: false,
            proposer: msg.sender
        });
        emit ActionQueued(id, target, value, data, readyAt, msg.sender);
    }

    function _execute(address target, uint256 value, bytes memory data) internal {
        require(address(this).balance >= value, "VigilVault: insufficient balance");
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        if (!ok) {
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
    }

    function _rollingWindowSpent() internal view returns (uint256 total) {
        uint256 cutoff = block.timestamp > rollingWindowDuration ? block.timestamp - rollingWindowDuration : 0;
        for (uint256 i = 0; i < WINDOW_SLOTS; i++) {
            WindowEntry storage e = window[i];
            if (e.timestamp >= cutoff && e.timestamp != 0) {
                total += e.amount;
            }
        }
    }

    function _recordWindowSpend(uint256 amount) internal {
        window[windowCursor % WINDOW_SLOTS] = WindowEntry({timestamp: uint64(block.timestamp), amount: uint192(amount)});
        windowCursor++;
    }
}
