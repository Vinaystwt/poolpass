use soroban_sdk::{contracttype, Address, Bytes, BytesN, Env, String};

use crate::{Error, PoolInfo};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND_TO: u32 = 518_400;

#[contracttype]
enum DataKey {
    Issuer,
    UsdcSac,
    PoolToken,
    Groth16Vk,
    MerkleRoot,
    MerkleDepth,
    Epoch,
    TotalSubscribed,
    PoolName,
    PerInvestorCapPublic,
    Nullifier(BytesN<32>),
    Commitment(BytesN<32>),
}

fn bump(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Issuer)
}

pub fn initialize(
    env: &Env,
    issuer: &Address,
    usdc_sac: &Address,
    pool_token: &Address,
    groth16_vk: &Bytes,
    merkle_depth: u32,
    pool_name: &String,
    per_investor_cap_public: &Option<i128>,
) {
    let storage = env.storage().instance();
    storage.set(&DataKey::Issuer, issuer);
    storage.set(&DataKey::UsdcSac, usdc_sac);
    storage.set(&DataKey::PoolToken, pool_token);
    storage.set(&DataKey::Groth16Vk, groth16_vk);
    storage.set(&DataKey::MerkleRoot, &BytesN::from_array(env, &[0; 32]));
    storage.set(&DataKey::MerkleDepth, &merkle_depth);
    storage.set(&DataKey::Epoch, &0u32);
    storage.set(&DataKey::TotalSubscribed, &0i128);
    storage.set(&DataKey::PoolName, pool_name);
    storage.set(&DataKey::PerInvestorCapPublic, per_investor_cap_public);
    bump(env);
}

fn get<T>(env: &Env, key: &DataKey) -> Result<T, Error>
where
    T: soroban_sdk::TryFromVal<Env, soroban_sdk::Val>,
{
    env.storage()
        .instance()
        .get(key)
        .ok_or(Error::NotInitialized)
}

pub fn require_issuer(env: &Env, candidate: &Address) -> Result<(), Error> {
    let issuer: Address = get(env, &DataKey::Issuer)?;
    if issuer != *candidate {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

pub fn merkle_depth(env: &Env) -> Result<u32, Error> {
    get(env, &DataKey::MerkleDepth)
}

pub fn epoch(env: &Env) -> Result<u32, Error> {
    get(env, &DataKey::Epoch)
}

pub fn merkle_root(env: &Env) -> Result<BytesN<32>, Error> {
    get(env, &DataKey::MerkleRoot)
}

pub fn groth16_vk(env: &Env) -> Result<Bytes, Error> {
    get(env, &DataKey::Groth16Vk)
}

pub fn usdc_sac(env: &Env) -> Result<Address, Error> {
    get(env, &DataKey::UsdcSac)
}

pub fn pool_token(env: &Env) -> Result<Address, Error> {
    get(env, &DataKey::PoolToken)
}

pub fn is_nullifier_used(env: &Env, nullifier: &BytesN<32>) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::Nullifier(nullifier.clone()))
        .unwrap_or(false)
}

pub fn mark_nullifier(env: &Env, nullifier: &BytesN<32>) {
    let key = DataKey::Nullifier(nullifier.clone());
    env.storage().persistent().set(&key, &true);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn mark_commitment(env: &Env, commitment: &BytesN<32>) {
    let key = DataKey::Commitment(commitment.clone());
    env.storage().persistent().set(&key, &true);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn add_subscribed(env: &Env, amount: i128) -> Result<(), Error> {
    let current: i128 = get(env, &DataKey::TotalSubscribed)?;
    let next = current.checked_add(amount).ok_or(Error::AmountInvalid)?;
    env.storage()
        .instance()
        .set(&DataKey::TotalSubscribed, &next);
    bump(env);
    Ok(())
}

pub fn set_root_and_epoch(env: &Env, root: &BytesN<32>, epoch: u32) {
    env.storage().instance().set(&DataKey::MerkleRoot, root);
    set_epoch(env, epoch);
}

pub fn set_epoch(env: &Env, epoch: u32) {
    env.storage().instance().set(&DataKey::Epoch, &epoch);
    bump(env);
}

pub fn pool_info(env: &Env) -> Result<PoolInfo, Error> {
    if !is_initialized(env) {
        return Err(Error::NotInitialized);
    }
    bump(env);
    Ok(PoolInfo {
        issuer: get(env, &DataKey::Issuer)?,
        usdc_sac: get(env, &DataKey::UsdcSac)?,
        pool_token: get(env, &DataKey::PoolToken)?,
        pool_name: get(env, &DataKey::PoolName)?,
        merkle_root: get(env, &DataKey::MerkleRoot)?,
        merkle_depth: get(env, &DataKey::MerkleDepth)?,
        epoch: get(env, &DataKey::Epoch)?,
        total_subscribed: get(env, &DataKey::TotalSubscribed)?,
        per_investor_cap_public: get(env, &DataKey::PerInvestorCapPublic)?,
    })
}
