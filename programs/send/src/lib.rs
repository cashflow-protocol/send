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
