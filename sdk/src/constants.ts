import { address, type Address } from "@solana/kit";

/** Send program ID */
export const PROGRAM_ID: Address = address(
  "W1AA3tfuCifNKeV9WKVwyasPwXu9o1H44NZCKZcSEND"
);

/** Hardcoded fee wallet that receives 0.0005 SOL per withdraw */
export const FEE_WALLET: Address = address(
  "yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND"
);

/** Fee amount in lamports (0.0005 SOL) */
export const FEE_LAMPORTS = 500_000;
