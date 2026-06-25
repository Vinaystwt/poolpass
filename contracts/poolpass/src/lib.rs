#![no_std]

mod groth16;
mod poseidon;
mod storage;
mod types;

use soroban_sdk::{
    contract, contractimpl, vec, Address, Bytes, BytesN, Env, IntoVal, MuxedAddress, String,
    Symbol, Vec,
};

pub use types::{EpochAdvanced, Error, PoolInfo, RootUpdated, Subscribed};

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
        per_investor_cap_public: Option<i128>,
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
            &per_investor_cap_public,
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

    pub fn subscribe(
        env: Env,
        investor: Address,
        amount: i128,
        proof: Bytes,
        public_inputs: Vec<BytesN<32>>,
    ) -> Result<BytesN<32>, Error> {
        if amount <= 0 || public_inputs.len() != 4 {
            return Err(Error::AmountInvalid);
        }
        investor.require_auth();

        let vk = storage::groth16_vk(&env)?;
        if !groth16::verify(&env, &vk, &proof, &public_inputs) {
            return Err(Error::InvalidProof);
        }

        let proof_root = public_inputs.get_unchecked(0);
        if proof_root != storage::merkle_root(&env)? {
            return Err(Error::RootMismatch);
        }
        let proof_amount = signal_u64(&public_inputs.get_unchecked(1))? as i128;
        if proof_amount != amount {
            return Err(Error::AmountInvalid);
        }
        let proof_epoch = signal_u32(&public_inputs.get_unchecked(3))?;
        if proof_epoch != storage::epoch(&env)? {
            return Err(Error::EpochMismatch);
        }

        let nullifier = public_inputs.get_unchecked(2);
        if storage::is_nullifier_used(&env, &nullifier) {
            return Err(Error::NullifierUsed);
        }
        storage::mark_nullifier(&env, &nullifier);
        let commitment =
            poseidon::subscription_commitment(&env, &nullifier, proof_amount as u64, proof_epoch);
        storage::mark_commitment(&env, &commitment);

        let usdc = storage::usdc_sac(&env)?;
        let pool_token = storage::pool_token(&env)?;
        let recipient = MuxedAddress::from(env.current_contract_address());
        let transfer = env.try_invoke_contract::<(), soroban_sdk::Error>(
            &usdc,
            &Symbol::new(&env, "transfer"),
            vec![
                &env,
                investor.clone().into_val(&env),
                recipient.into_val(&env),
                amount.into_val(&env),
            ],
        );
        if !matches!(transfer, Ok(Ok(()))) {
            return Err(Error::PaymentFailed);
        }
        let mint = env.try_invoke_contract::<(), soroban_sdk::Error>(
            &pool_token,
            &Symbol::new(&env, "mint"),
            vec![&env, investor.clone().into_val(&env), amount.into_val(&env)],
        );
        if !matches!(mint, Ok(Ok(()))) {
            return Err(Error::PaymentFailed);
        }

        storage::add_subscribed(&env, amount)?;
        Subscribed {
            investor,
            amount,
            nullifier,
            commitment: commitment.clone(),
            epoch: proof_epoch,
            timestamp: env.ledger().timestamp(),
        }
        .publish(&env);
        Ok(commitment)
    }
}

fn signal_u64(signal: &BytesN<32>) -> Result<u64, Error> {
    for index in 0..24u32 {
        if signal.get_unchecked(index) != 0 {
            return Err(Error::AmountInvalid);
        }
    }
    let mut value = 0u64;
    for index in 24..32u32 {
        value = (value << 8) | signal.get_unchecked(index) as u64;
    }
    Ok(value)
}

fn signal_u32(signal: &BytesN<32>) -> Result<u32, Error> {
    for index in 0..28u32 {
        if signal.get_unchecked(index) != 0 {
            return Err(Error::EpochMismatch);
        }
    }
    let mut value = 0u32;
    for index in 28..32u32 {
        value = (value << 8) | signal.get_unchecked(index) as u32;
    }
    Ok(value)
}

#[cfg(test)]
mod test;
#[cfg(test)]
mod test_fixtures;
