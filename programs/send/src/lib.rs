use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::instruction::{Instruction, AccountMeta};

declare_id!("W1AA3tfuCifNKeV9WKVwyasPwXu9o1H44NZCKZcSEND");

const FEE_WALLET: Pubkey = pubkey!("yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND");
const FEE_LAMPORTS: u64 = 500_000; // 0.0005 SOL
const SQUADS_V4_PROGRAM_ID: Pubkey = pubkey!("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

/// First 8 bytes of sha256("global:spending_limit_use")
const SPENDING_LIMIT_USE_DISCRIMINATOR: [u8; 8] = [16, 57, 130, 127, 193, 20, 155, 134];

#[program]
pub mod send {
    use super::*;

    pub fn withdraw(ctx: Context<Withdraw>, leave_lamports: u64) -> Result<()> {
        let signer = &ctx.accounts.signer;

        // Transfer 0.0005 SOL fee to fee wallet
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: signer.to_account_info(),
                    to: ctx.accounts.fee_wallet.to_account_info(),
                },
            ),
            FEE_LAMPORTS,
        )?;

        // Transfer remaining SOL (minus leave_lamports) to destination
        let balance = signer.to_account_info().lamports();
        if balance > leave_lamports {
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: signer.to_account_info(),
                        to: ctx.accounts.destination.to_account_info(),
                    },
                ),
                balance - leave_lamports,
            )?;
        }

        Ok(())
    }

    pub fn cover(ctx: Context<Cover>, target_lamports: u64) -> Result<()> {
        let destination_balance = ctx.accounts.destination.to_account_info().lamports();

        if destination_balance >= target_lamports {
            msg!("Destination already has {} lamports, target is {}", destination_balance, target_lamports);
            return Ok(());
        }

        let amount = target_lamports - destination_balance;

        // Transfer fee to fee wallet
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.fee_wallet.to_account_info(),
                },
            ),
            FEE_LAMPORTS,
        )?;

        // Transfer SOL so destination ends up with exactly target_lamports
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn cover_from_squad(ctx: Context<CoverFromSquad>, target_lamports: u64) -> Result<()> {
        let destination_balance = ctx.accounts.destination.to_account_info().lamports();

        if destination_balance >= target_lamports {
            msg!("Destination already has {} lamports, target is {}", destination_balance, target_lamports);
            return Ok(());
        }

        let amount = target_lamports - destination_balance;

        // Build spending_limit_use instruction data: discriminator + amount(u64) + decimals(u8) + memo(None)
        let mut data = Vec::with_capacity(18);
        data.extend_from_slice(&SPENDING_LIMIT_USE_DISCRIMINATOR);
        data.extend_from_slice(&amount.to_le_bytes());
        data.push(9); // decimals = 9 (native SOL)
        data.push(0); // memo = None

        let ix = Instruction {
            program_id: SQUADS_V4_PROGRAM_ID,
            accounts: vec![
                AccountMeta::new_readonly(ctx.accounts.multisig.key(), false),
                AccountMeta::new_readonly(ctx.accounts.member.key(), true),
                AccountMeta::new(ctx.accounts.spending_limit.key(), false),
                AccountMeta::new(ctx.accounts.vault.key(), false),
                AccountMeta::new(ctx.accounts.destination.key(), false),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
            ],
            data,
        };

        invoke(
            &ix,
            &[
                ctx.accounts.multisig.to_account_info(),
                ctx.accounts.member.to_account_info(),
                ctx.accounts.spending_limit.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.destination.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Hardcoded fee wallet, validated by address constraint
    #[account(mut, address = FEE_WALLET)]
    pub fee_wallet: AccountInfo<'info>,

    /// CHECK: Destination wallet to receive remaining SOL
    #[account(mut)]
    pub destination: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cover<'info> {
    /// Destination wallet pays for gas
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Source wallet that sends SOL to cover the destination
    #[account(mut)]
    pub source: Signer<'info>,

    /// CHECK: Hardcoded fee wallet, validated by address constraint
    #[account(mut, address = FEE_WALLET)]
    pub fee_wallet: AccountInfo<'info>,

    /// CHECK: Destination wallet to be topped up to target_lamports
    #[account(mut)]
    pub destination: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CoverFromSquad<'info> {
    /// Squad member authorising the spend
    #[account(mut)]
    pub member: Signer<'info>,

    /// CHECK: Squads multisig PDA
    pub multisig: AccountInfo<'info>,

    /// CHECK: Spending limit PDA that authorises this member
    #[account(mut)]
    pub spending_limit: AccountInfo<'info>,

    /// CHECK: Squad vault PDA that holds the SOL
    #[account(mut)]
    pub vault: AccountInfo<'info>,

    /// CHECK: Hardcoded fee wallet, validated by address constraint
    #[account(mut, address = FEE_WALLET)]
    pub fee_wallet: AccountInfo<'info>,

    /// CHECK: Destination wallet to be topped up to target_lamports
    #[account(mut)]
    pub destination: AccountInfo<'info>,

    /// CHECK: Squads V4 program for CPI
    #[account(address = SQUADS_V4_PROGRAM_ID)]
    pub squads_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}