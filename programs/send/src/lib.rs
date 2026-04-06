use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("W1AA3tfuCifNKeV9WKVwyasPwXu9o1H44NZCKZcSEND");

const FEE_WALLET: Pubkey = pubkey!("yyvY1cHtcQHbsPk4UYdHhjtoYQjYCX41RqF8U3dSEND");
const FEE_LAMPORTS: u64 = 500_000; // 0.0005 SOL

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