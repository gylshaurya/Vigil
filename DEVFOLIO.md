# Devfolio submission content

Copy each section below into the matching field on Devfolio.

## Tagline

A circuit breaker for your wallet. Small transfers are instant, big ones wait and can be stopped, even the switch that turns this off.

## The problem it solves

Wallets are protected by a single private key. If that key leaks, gets phished, or is copied by malware, the funds behind it can be gone in one transaction. The usual fix, a multi signature wallet, is safe but needs several people online for every payment, which most users will not do for daily spending. Vigil solves the same problem without that cost. Small, normal payments still go through instantly. Anything large or unusual is held for a short delay and can be cancelled by a second key, so a stolen key on its own is not enough to empty the wallet.

## What can people use it for

* Everyday spending from a wallet you fully control, with no delay on small payments.
* Holding savings where a single leaked key becomes a scare instead of a loss.
* Giving a phone, a co founder, or a family member a key that can only cancel a bad transaction, never send one.
* A starting point for anyone who wants a small, readable example of a wallet with a built in policy engine.

## Challenges we ran into

The hardest part was not the delay itself, that part is well known. It was making sure the delay could not be switched off by whoever stole the key. Our first version let the owner call functions like disableGuard directly. The very first test we wrote for that path passed immediately, which was the warning sign, since it meant an attacker who stole the owner key could turn off protection in one transaction and then drain the wallet right after, making the whole system pointless.

The fix was to remove every direct path to those settings. Now setThreshold, setDelay, setGuardian, and disableGuard can only be called by the contract calling itself, which only happens after one of these changes has gone through the exact same propose, wait, and cancel process as a normal large transfer. We wrote a dedicated test for this, `test_disablingGuardIsItselfDelayedAndVetoable`, and used it to check every other setting too. Turning the protection off is now protected by the same protection.

## Tracks applied

**Self Sovereignty (main track).** Vigil is a self custodied smart account. You hold both keys, the contract holds the funds, and no third party ever has custody or approval power. It fits the track's own call for a smart account wallet with a real policy engine, built around the specific case of a compromised everyday key rather than general session keys or bundlers.

**Decentralized Coordination Layers.** The owner and guardian are a small two party protocol enforced entirely by the contract, with no backend and no central service coordinating them. Neither key alone can both move funds and silence the other, and the rules that govern that relationship can only change by going through the same rules, which is the kind of trustless coordination logic the track asks for.

**Censorship Resistance.** Once a queued action has cleared its delay and was not cancelled, `executeAction` can be called by anyone, not just the owner or a fixed relayer. No single party has to stay online or can be pressured into withholding a transfer that was already approved, so finishing a legitimate payment never depends on one gatekeeper.

## Technologies used

Solidity, Foundry (Forge, Anvil, Cast), OpenZeppelin, Next.js, React, TypeScript, Tailwind CSS, viem, Bash

## Platforms

- [x] Web
- [ ] iOS
- [ ] Android
- [ ] macOS
- [ ] Others
