#![no_std]

mod poseidon;
mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Bytes, BytesN, Env, String, Vec};

pub use types::{EpochAdvanced, Error, PoolInfo, RootUpdated};

#[contract]
pub struct PoolPass;

#[contractimpl]
impl PoolPass {
    pub fn initialize(
        env: Env,
        issuer: Address,
        usdc_sac: Address,
        pool_token: Address,
        groth16_vk: Bytes,
        merkle_depth: u32,
        pool_name: String,
    ) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::Unauthorized);
        }
        if merkle_depth == 0 || merkle_depth > 16 {
            return Err(Error::RootMismatch);
        }
        issuer.require_auth();
        storage::initialize(
            &env,
            &issuer,
            &usdc_sac,
            &pool_token,
            &groth16_vk,
            merkle_depth,
            &pool_name,
        );
        Ok(())
    }

    pub fn update_accredited_set(
        env: Env,
        issuer: Address,
        leaf_hashes: Vec<BytesN<32>>,
    ) -> Result<BytesN<32>, Error> {
        storage::require_issuer(&env, &issuer)?;
        issuer.require_auth();
        let depth = storage::merkle_depth(&env)?;
        let root = poseidon::recompute_root(&env, leaf_hashes.clone(), depth)?;
        let epoch = storage::epoch(&env)? + 1;
        storage::set_root_and_epoch(&env, &root, epoch);
        RootUpdated {
            root: root.clone(),
            leaf_count: leaf_hashes.len(),
            epoch,
            timestamp: env.ledger().timestamp(),
        }
        .publish(&env);
        Ok(root)
    }

    pub fn get_pool_info(env: Env) -> Result<PoolInfo, Error> {
        storage::pool_info(&env)
    }

    pub fn advance_epoch(env: Env, issuer: Address) -> Result<u32, Error> {
        storage::require_issuer(&env, &issuer)?;
        issuer.require_auth();
        let epoch = storage::epoch(&env)? + 1;
        storage::set_epoch(&env, epoch);
        EpochAdvanced {
            epoch,
            timestamp: env.ledger().timestamp(),
        }
        .publish(&env);
        Ok(epoch)
    }
}

#[cfg(test)]
mod test;
