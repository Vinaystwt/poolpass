use soroban_poseidon::poseidon_hash;
use soroban_sdk::{crypto::bn254::Bn254Fr, vec, Bytes, BytesN, Env, Vec, U256};

use crate::Error;

fn as_field(env: &Env, bytes: &BytesN<32>) -> U256 {
    let dynamic: Bytes = bytes.into();
    U256::from_be_bytes(env, &dynamic)
}

fn as_bytes(value: &U256) -> BytesN<32> {
    value.to_be_bytes().try_into().unwrap()
}

pub fn subscription_commitment(
    env: &Env,
    nullifier: &BytesN<32>,
    amount: u64,
    epoch: u32,
) -> BytesN<32> {
    let hash = poseidon_hash::<4, Bn254Fr>(
        env,
        &vec![
            env,
            as_field(env, nullifier),
            U256::from_u128(env, amount as u128),
            U256::from_u32(env, epoch),
        ],
    );
    as_bytes(&hash)
}

pub fn recompute_root(env: &Env, leaves: Vec<BytesN<32>>, depth: u32) -> Result<BytesN<32>, Error> {
    let expected = 1u32.checked_shl(depth).ok_or(Error::RootMismatch)?;
    if leaves.len() != expected {
        return Err(Error::RootMismatch);
    }

    let mut level = leaves;
    for _ in 0..depth {
        let mut next = Vec::new(env);
        for index in 0..(level.len() / 2) {
            let left = as_field(env, &level.get_unchecked(index * 2));
            let right = as_field(env, &level.get_unchecked(index * 2 + 1));
            let hash = poseidon_hash::<3, Bn254Fr>(env, &vec![env, left, right]);
            next.push_back(as_bytes(&hash));
        }
        level = next;
    }
    Ok(level.get_unchecked(0))
}
