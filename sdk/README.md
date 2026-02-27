# @heymike/send

TypeScript SDK for the Send Solana program.

Send Solana program (Anchor) with a single `withdraw` instruction that sends all SOL from the signer wallet to the destination wallet. It includes gas fee, and calculates all balances inside. Just add withdraw instruction as a last in your transaction.

## Install

```bash
npm install @heymike/send
```

Peer dependency: `@solana/kit`

## Usage

```typescript
import { createWithdrawInstruction } from "@heymike/send";
import { address } from "@solana/kit";

const ix = createWithdrawInstruction(
  address("SIGNER_ADDRESS"),      // wallet to drain (must sign)
  address("DESTINATION_ADDRESS")  // wallet that receives remaining SOL
);

// add to your transaction and send however you prefer
```

## Exports

```typescript
import { createWithdrawInstruction, PROGRAM_ID, FEE_WALLET, FEE_LAMPORTS } from "@heymike/send";
```

| Export                     | Value                                           |
| -------------------------- | ----------------------------------------------- |
| `createWithdrawInstruction`| Returns an `IInstruction`                        |
| `PROGRAM_ID`               | `W1AA3tfuCifNKeV9WKVwyasPwXu9o1H44NZCKZcSEND`  |
| `FEE_WALLET`               | `yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND`  |
| `FEE_LAMPORTS`             | `500_000` (0.0005 SOL)                           |
