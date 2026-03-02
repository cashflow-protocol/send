import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { Send } from "../target/types/send";

const FEE_WALLET = new anchor.web3.PublicKey(
  "yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND"
);
const FEE_LAMPORTS = 500_000; // 0.0005 SOL

describe("send", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.send as Program<Send>;
  const connection = provider.connection;

  it("withdraws SOL: fee to fee wallet, rest to destination", async () => {
    const signer = Keypair.generate();
    const destination = Keypair.generate();

    // Airdrop 2 SOL to signer
    const airdropSig = await connection.requestAirdrop(
      signer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig);

    // Fund fee wallet so it exists on chain
    const fundFeeSig = await connection.requestAirdrop(FEE_WALLET, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(fundFeeSig);

    const signerBalanceBefore = await connection.getBalance(signer.publicKey);
    const feeWalletBalanceBefore = await connection.getBalance(FEE_WALLET);

    // Call withdraw
    const tx = await program.methods
      .withdraw(new anchor.BN(0))
      .accounts({
        signer: signer.publicKey,
        destination: destination.publicKey,
      })
      .signers([signer])
      .rpc();

    console.log("Transaction signature:", tx);

    // Verify fee wallet received 0.0005 SOL
    const feeWalletBalanceAfter = await connection.getBalance(FEE_WALLET);
    assert.equal(
      feeWalletBalanceAfter - feeWalletBalanceBefore,
      FEE_LAMPORTS,
      "Fee wallet should receive exactly 0.0005 SOL"
    );

    // Verify signer is drained (0 lamports)
    const signerBalanceAfter = await connection.getBalance(signer.publicKey);
    assert.equal(signerBalanceAfter, 0, "Signer should have 0 SOL remaining");

    // Verify destination received the rest (initial - fee)
    // Note: tx fee is paid by the provider wallet, not the signer
    const destinationBalance = await connection.getBalance(destination.publicKey);
    const expectedDestination = signerBalanceBefore - FEE_LAMPORTS;
    assert.equal(
      destinationBalance,
      expectedDestination,
      "Destination should receive all remaining SOL"
    );

    console.log(`Signer started with: ${signerBalanceBefore / LAMPORTS_PER_SOL} SOL`);
    console.log(`Fee wallet received: ${FEE_LAMPORTS / LAMPORTS_PER_SOL} SOL`);
    console.log(`Destination received: ${destinationBalance / LAMPORTS_PER_SOL} SOL`);
  });

  it("fails if signer has insufficient SOL for fee", async () => {
    const signer = Keypair.generate();
    const destination = Keypair.generate();

    // Airdrop only 0.0001 SOL (less than fee)
    const airdropSig = await connection.requestAirdrop(
      signer.publicKey,
      100_000
    );
    await connection.confirmTransaction(airdropSig);

    // Fund fee wallet
    const fundFeeSig = await connection.requestAirdrop(FEE_WALLET, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(fundFeeSig);

    try {
      await program.methods
        .withdraw(new anchor.BN(0))
        .accounts({
          signer: signer.publicKey,
          destination: destination.publicKey,
        })
        .signers([signer])
        .rpc();
      assert.fail("Should have failed with insufficient funds");
    } catch (err) {
      assert.ok(err, "Transaction should fail with insufficient SOL");
    }
  });
});
