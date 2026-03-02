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

### TypeScript SDK

```bash
npm install @heymike/send
```

```typescript
import { createWithdrawInstruction } from "@heymike/send";
import { address } from "@solana/kit";

// Send all SOL to destination
const ix = createWithdrawInstruction(
  address("SIGNER_ADDRESS"),
  address("DESTINATION_ADDRESS")
);

// Keep 0.01 SOL on the signer wallet
const ix = createWithdrawInstruction(
  address("SIGNER_ADDRESS"),
  address("DESTINATION_ADDRESS"),
  10_000_000 // lamports to leave on signer
);
```

## Program ID

```
W1AA3tfuCifNKeV9WKVwyasPwXu9o1H44NZCKZcSEND
```
