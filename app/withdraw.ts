import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import fs from "fs";
import idl from "../target/idl/send.json";
import type { Send } from "../target/types/send";

const PROGRAM_ID = new PublicKey("W1AA3tfuCifNKeV9WKVwyasPwXu9o1H44NZCKZcSEND");
const FEE_WALLET = new PublicKey("yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND");

async function withdraw(destinationAddress: string) {
  // Load wallet keypair from file
  const keypairPath = process.env.KEYPAIR_PATH || "~/.config/solana/id.json";
  const resolvedPath = keypairPath.replace("~", process.env.HOME!);
  const secret = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  const signer = Keypair.fromSecretKey(Uint8Array.from(secret));

  // Connect to cluster
  const rpcUrl = process.env.RPC_URL || clusterApiUrl("mainnet-beta");
  const connection = new Connection(rpcUrl, "confirmed");

  // Set up Anchor provider and program
  const wallet = new anchor.Wallet(signer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new anchor.Program<Send>(idl as Send, provider);

  const destination = new PublicKey(destinationAddress);
  const balance = await connection.getBalance(signer.publicKey);

  console.log(`Signer:      ${signer.publicKey.toBase58()}`);
  console.log(`Balance:     ${balance / 1e9} SOL`);
  console.log(`Destination: ${destination.toBase58()}`);
  console.log(`Fee:         0.0005 SOL -> ${FEE_WALLET.toBase58()}`);
  console.log();

  const tx = await program.methods
    .withdraw(new anchor.BN(0))
    .accounts({
      signer: signer.publicKey,
      destination,
    })
    .rpc();

  console.log(`Done! TX: ${tx}`);
}

// Usage: npx ts-node app/withdraw.ts <DESTINATION_WALLET>
const destination = process.argv[2];
if (!destination) {
  console.error("Usage: npx ts-node app/withdraw.ts <DESTINATION_WALLET>");
  process.exit(1);
}

withdraw(destination).catch(console.error);
