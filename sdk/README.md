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
  address("SIGNER_ADDRESS"),      // wallet to withdraw from (must sign)
  address("DESTINATION_ADDRESS")  // wallet that receives remaining SOL
);

// add to your transaction and send however you prefer
```

## Exports

```typescript
import { createWithdrawInstruction, PROGRAM_ID } from "@heymike/send";
```

| Export                     | Value                                           |
| -------------------------- | ----------------------------------------------- |
| `createWithdrawInstruction`| Returns an `Instruction`                        |
| `PROGRAM_ID`               | `W1AA3tfuCifNKeV9WKVwyasPwXu9o1H44NZCKZcSEND`  |
