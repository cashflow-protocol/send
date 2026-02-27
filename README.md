# Send

Solana program (Anchor) with a single `withdraw` instruction that sends all SOL from the signer wallet to the destination wallet. It includes gas fee, and calculates all balances inside. Just add withdraw instruction as a last in your transaction.

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) v0.32.1+

## Build

```bash
anchor build
```

## Test

```bash
anchor test
```

## Deploy

```bash
# Devnet
anchor deploy --provider.cluster devnet

# Mainnet
anchor deploy --provider.cluster mainnet
```

## Usage

The `withdraw` instruction requires these accounts:

| Account         | Description                                              |
| --------------- | -------------------------------------------------------- |
| `signer`        | The wallet to withdraw from (must sign the transaction)          |
| `feeWallet`     | `yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND` (fixed) |
| `destination`   | The wallet that receives all remaining SOL               |
| `systemProgram` | System Program                                           |

### TypeScript example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

const FEE_WALLET = new PublicKey("yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND");

await program.methods
  .withdraw()
  .accounts({
    signer: wallet.publicKey,
    feeWallet: FEE_WALLET,
    destination: new PublicKey("DESTINATION_WALLET_ADDRESS"),
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Program ID

```
91KnrZkPWxKpuGoeT4bNi9wFprSjRQ5xGueUutAUFutQ
```
