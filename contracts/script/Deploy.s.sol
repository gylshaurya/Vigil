// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VigilVault} from "../src/VigilVault.sol";

/// @notice Deploys VigilVault with parameters read from the environment so
///         the same script targets a local Anvil demo chain or a public testnet.
///
/// Required env vars:
///   PRIVATE_KEY               deployer key (also becomes OWNER unless OWNER is set)
///   GUARDIAN                  address of the veto / second key
/// Optional env vars (sensible hackathon-demo defaults shown):
///   OWNER                     defaults to the deployer address
///   INSTANT_THRESHOLD_WEI     default 0.05 ether
///   DELAY_SECONDS             default 60
///   ROLLING_WINDOW_SECONDS    default 86400 (24h)
///   ROLLING_WINDOW_LIMIT_WEI  default 0.15 ether
///   FUND_WEI                  default 1 ether, deposited into the vault after deploy
contract DeployVigilVault is Script {
    function run() external returns (VigilVault vault) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address owner = vm.envOr("OWNER", deployer);
        address guardian = vm.envAddress("GUARDIAN");
        uint256 instantThreshold = vm.envOr("INSTANT_THRESHOLD_WEI", uint256(0.05 ether));
        uint256 delay = vm.envOr("DELAY_SECONDS", uint256(60));
        uint256 rollingWindowDuration = vm.envOr("ROLLING_WINDOW_SECONDS", uint256(86400));
        uint256 rollingWindowLimit = vm.envOr("ROLLING_WINDOW_LIMIT_WEI", uint256(0.15 ether));
        uint256 fund = vm.envOr("FUND_WEI", uint256(1 ether));

        vm.startBroadcast(deployerKey);

        vault = new VigilVault(owner, guardian, instantThreshold, delay, rollingWindowDuration, rollingWindowLimit);

        if (fund > 0) {
            (bool ok,) = address(vault).call{value: fund}("");
            require(ok, "funding failed");
        }

        vm.stopBroadcast();

        console.log("VigilVault deployed at:", address(vault));
        console.log("owner:", owner);
        console.log("guardian:", guardian);
        console.log("instantThreshold (wei):", instantThreshold);
        console.log("delay (seconds):", delay);
        console.log("rollingWindowDuration (seconds):", rollingWindowDuration);
        console.log("rollingWindowLimit (wei):", rollingWindowLimit);
        console.log("funded (wei):", fund);
    }
}
