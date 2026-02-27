import {
  type Address,
  type Instruction,
  AccountRole,
} from "@solana/kit";
import { SYSTEM_PROGRAM_ADDRESS } from "@solana-program/system";
import { PROGRAM_ID, FEE_WALLET } from "./constants";

/** Withdraw instruction discriminator (first 8 bytes of sha256("global:withdraw")) */
const WITHDRAW_DISCRIMINATOR = new Uint8Array([183, 18, 70, 156, 148, 109, 161, 34]);

/**
 * Create a withdraw instruction that sends 0.0005 SOL fee to the fee wallet
 * and all remaining SOL to the destination.
 *
 * @param signer      - The wallet to withdraw from (must sign the transaction).
 * @param destination - The wallet that receives all remaining SOL after the fee.
 * @returns An instruction to add to your transaction.
 */
export function createWithdrawInstruction(
  signer: Address,
  destination: Address
): Instruction {
  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: signer, role: AccountRole.WRITABLE_SIGNER },
      { address: FEE_WALLET, role: AccountRole.WRITABLE },
      { address: destination, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    ],
    data: WITHDRAW_DISCRIMINATOR,
  };
}
