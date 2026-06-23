#![no_std]

use soroban_poseidon::poseidon_hash;
use soroban_sdk::{contract, contractimpl, crypto::bn254::Bn254Fr, vec, Env, U256};

#[contract]
pub struct GatePoseidon;

#[contractimpl]
impl GatePoseidon {
    pub fn hash_two(env: Env, left: U256, right: U256) -> U256 {
        poseidon_hash::<3, Bn254Fr>(&env, &vec![&env, left, right])
    }
}

#[cfg(test)]
mod test;
