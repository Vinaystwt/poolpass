#![no_std]

use soroban_sdk::{
    contract, contractimpl,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    vec, Bytes, BytesN, Env, TryFromVal, Vec,
};

const G1_SIZE: u32 = 64;
const G2_SIZE: u32 = 128;
const PROOF_SIZE: u32 = G1_SIZE + G2_SIZE + G1_SIZE;
const VK_FIXED_SIZE: u32 = G1_SIZE + G2_SIZE * 3 + 4;

#[contract]
pub struct GateGroth16;

fn bytesn<const N: usize>(env: &Env, source: &Bytes, start: u32) -> BytesN<N> {
    let end = start + N as u32;
    BytesN::<N>::try_from_val(env, source.slice(start..end).as_val()).unwrap()
}

fn g1(env: &Env, source: &Bytes, start: u32) -> Bn254G1Affine {
    Bn254G1Affine::from_bytes(bytesn::<64>(env, source, start))
}

fn g2(env: &Env, source: &Bytes, start: u32) -> Bn254G2Affine {
    Bn254G2Affine::from_bytes(bytesn::<128>(env, source, start))
}

fn read_u32_be(source: &Bytes, start: u32) -> u32 {
    ((source.get_unchecked(start) as u32) << 24)
        | ((source.get_unchecked(start + 1) as u32) << 16)
        | ((source.get_unchecked(start + 2) as u32) << 8)
        | source.get_unchecked(start + 3) as u32
}

#[contractimpl]
impl GateGroth16 {
    pub fn verify(env: Env, vk: Bytes, proof: Bytes, public_inputs: Vec<BytesN<32>>) -> bool {
        if proof.len() != PROOF_SIZE || vk.len() < VK_FIXED_SIZE {
            return false;
        }

        let ic_len = read_u32_be(&vk, VK_FIXED_SIZE - 4);
        if ic_len == 0
            || public_inputs.len() + 1 != ic_len
            || vk.len() != VK_FIXED_SIZE + ic_len * G1_SIZE
        {
            return false;
        }

        let bn254 = env.crypto().bn254();
        let alpha = g1(&env, &vk, 0);
        let beta = g2(&env, &vk, G1_SIZE);
        let gamma = g2(&env, &vk, G1_SIZE + G2_SIZE);
        let delta = g2(&env, &vk, G1_SIZE + G2_SIZE * 2);

        let mut vk_x = g1(&env, &vk, VK_FIXED_SIZE);
        for index in 0..public_inputs.len() {
            let signal = Bn254Fr::from_bytes(public_inputs.get_unchecked(index));
            let ic = g1(&env, &vk, VK_FIXED_SIZE + (index + 1) * G1_SIZE);
            vk_x = bn254.g1_add(&vk_x, &bn254.g1_mul(&ic, &signal));
        }

        let proof_a = g1(&env, &proof, 0);
        let proof_b = g2(&env, &proof, G1_SIZE);
        let proof_c = g1(&env, &proof, G1_SIZE + G2_SIZE);

        bn254.pairing_check(
            vec![&env, -proof_a, alpha, vk_x, proof_c],
            vec![&env, proof_b, beta, gamma, delta],
        )
    }
}

#[cfg(test)]
mod test;
