import {
  type Address,
  type Instruction,
  AccountRole,
  getProgramDerivedAddress,
  getAddressEncoder,
  getUtf8Encoder,
} from "@solana/kit";
import { PROGRAM_ID, FEE_WALLET, SYSTEM_PROGRAM, SQUADS_V4_PROGRAM_ID } from "./constants";

/** Withdraw instruction discriminator (first 8 bytes of sha256("global:withdraw")) */
const WITHDRAW_DISCRIMINATOR = new Uint8Array([183, 18, 70, 156, 148, 109, 161, 34]);

/** Cover instruction discriminator (first 8 bytes of sha256("global:cover")) */
const COVER_DISCRIMINATOR = new Uint8Array([0xf3, 0x13, 0x4c, 0x78, 0xee, 0x7e, 0x6b, 0x8d]);

/** CoverFromSquad instruction discriminator (first 8 bytes of sha256("global:cover_from_squad")) */
const COVER_FROM_SQUAD_DISCRIMINATOR = new Uint8Array([182, 15, 157, 145, 193, 250, 228, 167]);

/**
 * Create a withdraw instruction that sends 0.0005 SOL fee to the fee wallet
 * and all remaining SOL to the destination.
 *
 * @param signer        - The wallet to withdraw from (must sign the transaction).
 * @param destination   - The wallet that receives remaining SOL after the fee.
 * @param leaveLamports - Lamports to leave on the signer wallet (default: 0).
 * @returns An instruction to add to your transaction.
 */
export function createWithdrawInstruction(
  signer: Address,
  destination: Address,
  leaveLamports: number | bigint = 0
): Instruction {
  const data = new Uint8Array(16); // 8 discriminator + 8 u64
  data.set(WITHDRAW_DISCRIMINATOR);
  new DataView(data.buffer).setBigUint64(8, BigInt(leaveLamports), true);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: signer, role: AccountRole.WRITABLE_SIGNER },
      { address: FEE_WALLET, role: AccountRole.WRITABLE },
      { address: destination, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM, role: AccountRole.READONLY },
    ],
    data,
  };
}

/**
 * Create a cover instruction that tops up a destination wallet to exactly
 * `targetLamports`. The source wallet sends SOL, and the signer (destination)
 * pays for gas.
 *
 * @param signer         - The destination wallet that pays for gas (must sign).
 * @param source         - The wallet sending SOL to cover (must sign).
 * @param destination    - The wallet to be topped up.
 * @param targetLamports - The exact lamport balance the destination should have after.
 * @returns An instruction to add to your transaction.
 */
export function createCoverInstruction(
  signer: Address,
  source: Address,
  destination: Address,
  targetLamports: number | bigint
): Instruction {
  const data = new Uint8Array(16); // 8 discriminator + 8 u64
  data.set(COVER_DISCRIMINATOR);
  new DataView(data.buffer).setBigUint64(8, BigInt(targetLamports), true);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: signer, role: AccountRole.WRITABLE_SIGNER },
      { address: source, role: AccountRole.WRITABLE_SIGNER },
      { address: FEE_WALLET, role: AccountRole.WRITABLE },
      { address: destination, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM, role: AccountRole.READONLY },
    ],
    data,
  };
}

/**
 * Create a cover instruction that tops up a destination wallet to exactly
 * `targetLamports` by paying from a Squads vault via spendingLimitUse.
 * The program calculates the difference on-chain and CPIs into Squads.
 *
 * @param member          - The Squad member authorising the spend (must sign).
 * @param multisigPda     - The Squads multisig PDA.
 * @param spendingLimitPda - The spending limit PDA that authorises this member.
 * @param destination     - The wallet to be topped up.
 * @param targetLamports  - The exact lamport balance the destination should have after.
 * @param vaultIndex      - Vault index within the multisig (default: 0).
 * @returns A promise that resolves to an instruction to add to your transaction.
 */
export async function createCoverFromSquadInstruction(
  member: Address,
  multisigPda: Address,
  spendingLimitPda: Address,
  destination: Address,
  targetLamports: number | bigint,
  vaultIndex: number = 0,
): Promise<Instruction> {
  const [vaultPda] = await getProgramDerivedAddress({
    programAddress: SQUADS_V4_PROGRAM_ID,
    seeds: [
      getUtf8Encoder().encode("multisig"),
      getAddressEncoder().encode(multisigPda),
      getUtf8Encoder().encode("vault"),
      new Uint8Array([vaultIndex]),
    ],
  });

  const data = new Uint8Array(16); // 8 discriminator + 8 target_lamports
  data.set(COVER_FROM_SQUAD_DISCRIMINATOR);
  new DataView(data.buffer).setBigUint64(8, BigInt(targetLamports), true);

  return {
    programAddress: PROGRAM_ID,
    accounts: [
      { address: member, role: AccountRole.WRITABLE_SIGNER },
      { address: multisigPda, role: AccountRole.READONLY },
      { address: spendingLimitPda, role: AccountRole.WRITABLE },
      { address: vaultPda, role: AccountRole.WRITABLE },
      { address: FEE_WALLET, role: AccountRole.WRITABLE },
      { address: destination, role: AccountRole.WRITABLE },
      { address: SQUADS_V4_PROGRAM_ID, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM, role: AccountRole.READONLY },
    ],
    data,
  };
}
