extern crate std;

use soroban_sdk::{bytesn, Env, U256};

use crate::{GatePoseidon, GatePoseidonClient};

#[test]
fn hash_two_matches_circomlib() {
    let env = Env::default();
    let contract_id = env.register(GatePoseidon, ());
    let client = GatePoseidonClient::new(&env, &contract_id);

    let actual = client.hash_two(&U256::from_u32(&env, 1), &U256::from_u32(&env, 2));
    let expected = U256::from_be_bytes(
        &env,
        &bytesn!(
            &env,
            0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a
        )
        .into(),
    );

    assert_eq!(actual, expected);
}
