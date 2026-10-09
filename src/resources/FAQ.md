# FAQ \- Safenet Aegis Staking Interface

## About this Interface

**Who operates this interface?**

This interface is developed, operated, and maintained by **Altoros LLC (dba Protofire DAO)** ("Protofire"), an independent operator. It is **not** operated by the Safe Ecosystem Foundation or Safe Labs. Protofire is one of several independent operators supported by a grant from the Safe Ecosystem Foundation to strengthen the resilience and decentralisation of Safenet Aegis staking infrastructure. See our Imprint for full details.

**What is Safenet Aegis?**

Safenet Aegis is a transaction security network in the Safe ecosystem: a validator-based network that enforces transaction security guarantees on-chain. SAFE token holders can support the network by staking tokens to validators. Safenet Aegis succeeds the Safenet Beta phase, which ended on October 5, 2026.

**Is this interface custodial?**

No. The interface is **non-custodial**. Protofire never holds, controls, or has access to your tokens, private keys, or recovery phrases. All actions are transactions that you sign and broadcast from your own wallet, and your staked tokens are held by the publicly deployed Safenet staking smart contracts \- not by Protofire.

**Is the interface open source?**

Yes. The full source code is published under the **MIT license** at [https://github.com/protofire/safenet-staking-ui](https://github.com/protofire/safenet-staking-ui). Anyone can inspect, fork, or run it.

**What happens if this interface goes offline?**

Your funds are unaffected. The staking contracts are public and permissionless — you can always interact with them directly on-chain or through any other interface. This interface is one access point, not a gatekeeper.

## Staking

**What is staking?**

Staking means locking SAFE tokens in the Safenet staking contract and delegating them to a validator. Staked tokens back the validator's participation in the network.

**How do I stake?**

Connect a Web3 wallet, choose a validator, and enter an amount. The interface will guide you through the required transactions — typically an **approval** (allowing the staking contract to move your SAFE) followed by the **stake** transaction. On networks that support it, these may be combined into a single transaction.

**What is a validator, and how do I choose one?**

Validators are independent third parties that perform transaction checks in Safenet Aegis. The interface displays publicly available validator information, but **Protofire does not operate, endorse, or recommend any validator**. Choosing a validator is your decision alone \- do your own research.

**Can I stake any amount?**

Any amount of SAFE your wallet holds, subject to protocol rules and gas costs. Note that very small stakes may generate rewards smaller than the gas cost of claiming them.

## Unstaking and withdrawals

**How do I unstake?**

Unstaking is a **multi-step process** enforced by the protocol:

1. **Initiate withdrawal** — you submit a transaction that moves your chosen amount into a withdrawal queue.  
2. **Cooldown** — a protocol-enforced waiting period (the *withdrawal delay*) applies. The interface shows a countdown for each pending withdrawal.  
3. **Claim withdrawal** — once the cooldown has passed, you submit a final transaction to return the tokens to your wallet. Multiple matured withdrawals can be claimed together.

**How long is the withdrawal cooldown?**

The cooldown is a parameter of the staking contract, shown in the interface before you stake and while withdrawals are pending. **Protofire cannot shorten, waive, or modify it** — it is enforced on-chain by the protocol.

**Do I earn rewards during the cooldown?**

Tokens in the withdrawal queue are no longer actively staked. Their treatment is determined by protocol rules, not by this interface.

## Rewards

**How are rewards calculated?**

Reward amounts are determined by the Safenet Aegis protocol and published periodically (per **epoch**) by the Safe ecosystem as signed data files (**Merkle proofs**). This interface reads and displays that data; **Protofire does not calculate, fund, or control rewards**.

**How do I claim rewards?**

Open the rewards section and submit the claim transaction. The claim uses a cryptographic proof (Merkle proof) that matches your wallet address against the current on-chain rewards root. Amounts are **cumulative** — the contract tracks what you've already claimed and pays out the difference.

**Why is my claim button disabled?**

Usually because the published rewards data and the on-chain state are temporarily out of sync (for example, right after a new epoch is published). This is a safety feature — it prevents claims against inconsistent data. It normally resolves once both sides are updated. Your rewards are not lost.

**Are rewards guaranteed? What's the APR?**

**No rewards are guaranteed.** Any figures displayed are estimates derived from protocol data and may change or be zero. Nothing in this interface is a promise of yield, and past rewards do not predict future rewards.

## Wallets, fees, and safety

**Which wallets can I use?**

Any Web3-compatible wallet supported by the connection dialog (browser extension wallets, hardware wallets, and mobile wallets via WalletConnect).

**What fees do I pay?**

Protofire does not charge fees for using this interface. You pay only the blockchain **network (gas) fees** for each transaction, which go to the network, not to us.

**Is staking risky?**

Yes \- all blockchain interactions carry risk, including smart contract bugs, token price volatility, protocol changes, and user error (transactions are irreversible). Safenet Aegis is provided "as is". Only stake what you can afford to lock up and potentially lose. See our Terms of Use for a full risk statement.

**Is this financial advice?**

No. Nothing on this interface is legal, financial, investment, or tax advice. Staking may also have tax consequences in your jurisdiction — consult your own advisers.

**How do I avoid phishing?**

Always verify you are on the correct URL ([safenet-staking.protofire.io](https://safenet-staking.protofire.io)), bookmark it, and never enter your recovery phrase anywhere. Protofire will never ask for your private keys or seed phrase.

## Support

**Something isn't working — where do I get help?**

Contact [safenet-staking-support@protofire.io](mailto:safenet-staking-support@protofire.io). Please include your wallet address (never your keys\!), the network, and a description or screenshot of the issue. We aim to respond promptly, but support is provided on a best-effort basis and no response time is guaranteed.

**Where can I learn more about Safenet?**

See the official Safenet documentation (docs.safefoundation.org/safenet) and the Safe Foundation forum.