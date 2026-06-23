use hex_literal::hex;
use soroban_sdk::{
    testutils::{Address as _, Events as _, Ledger},
    vec, Address, Bytes, BytesN, Env, Event, String,
};

use crate::{Error, PoolPass, PoolPassClient, RootUpdated};

extern crate std;

fn leaves(env: &Env) -> soroban_sdk::Vec<BytesN<32>> {
    vec![
        env,
        BytesN::from_array(
            env,
            &hex!("249b7855f628bcee2a9fa38bdfbe315bac736dc66adf2b4930cb8dce208f5aeb"),
        ),
        BytesN::from_array(
            env,
            &hex!("11bff501cd171a8fd2fdf3665c9429858fc003f2d7db984ce1fd75361d95824f"),
        ),
        BytesN::from_array(
            env,
            &hex!("1c814ba7a009f485e23f9f2ae9b8bd4320d9dbc92a133dc27964c1e57d15a15a"),
        ),
        BytesN::from_array(
            env,
            &hex!("193155bb693201f9ce6b74eecae36d6ab7c24c0a92d36aeffa3bd62831934cf3"),
        ),
        BytesN::from_array(
            env,
            &hex!("05485aada189c224cfdfb31015aa6acdb9182f1425fbf4c89abca95623c90882"),
        ),
        BytesN::from_array(
            env,
            &hex!("024115d2823a446a4710b355a769fdc736e5eb1a50b7c5dfdf21fbd8edf1e213"),
        ),
        BytesN::from_array(
            env,
            &hex!("266ba8344d22697317a9a45e2bc8ffc8a96f803e3e723a541a6ca2c2871c45ba"),
        ),
        BytesN::from_array(
            env,
            &hex!("2068dbaca5ef6b85631f9cdd4f92a2906ec2674b9ce37c7e714fd6c75348ee98"),
        ),
    ]
}

struct Setup {
    env: Env,
    id: Address,
    issuer: Address,
    usdc: Address,
    pool_token: Address,
}

impl Setup {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_750_000_000);
        let id = env.register(PoolPass, ());
        Self {
            issuer: Address::generate(&env),
            usdc: Address::generate(&env),
            pool_token: Address::generate(&env),
            env,
            id,
        }
    }

    fn client(&self) -> PoolPassClient<'_> {
        PoolPassClient::new(&self.env, &self.id)
    }

    fn initialize(&self) {
        self.client().initialize(
            &self.issuer,
            &self.usdc,
            &self.pool_token,
            &Bytes::from_slice(&self.env, &[1, 2, 3]),
            &3,
            &String::from_str(&self.env, "Demo Credit Pool"),
        );
    }
}

#[test]
fn uninitialized_reads_are_decodable() {
    let setup = Setup::new();
    assert_eq!(
        setup.client().try_get_pool_info(),
        Err(Ok(Error::NotInitialized))
    );
}

#[test]
fn initialize_is_one_time_and_sets_pool_info() {
    let setup = Setup::new();
    setup.initialize();
    let info = setup.client().get_pool_info();
    assert_eq!(info.issuer, setup.issuer);
    assert_eq!(info.usdc_sac, setup.usdc);
    assert_eq!(info.pool_token, setup.pool_token);
    assert_eq!(info.epoch, 0);
    assert_eq!(info.merkle_depth, 3);
    assert_eq!(info.total_subscribed, 0);
    assert_eq!(
        setup.client().try_initialize(
            &setup.issuer,
            &setup.usdc,
            &setup.pool_token,
            &Bytes::new(&setup.env),
            &3,
            &String::from_str(&setup.env, "again")
        ),
        Err(Ok(Error::Unauthorized))
    );
}

#[test]
fn fixture_root_is_recomputed_with_native_poseidon() {
    let setup = Setup::new();
    setup.initialize();
    let root = setup
        .client()
        .update_accredited_set(&setup.issuer, &leaves(&setup.env));
    let expected = BytesN::from_array(
        &setup.env,
        &hex!("24fbc2a0b5c37685faca4d084b90fcfaf681eead239b47cf6418e2868183f5d9"),
    );
    assert_eq!(root, expected);
    let expected_event = RootUpdated {
        root,
        leaf_count: 8,
        epoch: 1,
        timestamp: 1_750_000_000,
    };
    assert_eq!(
        setup.env.events().all().filter_by_contract(&setup.id),
        std::vec![expected_event.to_xdr(&setup.env, &setup.id)]
    );
    let info = setup.client().get_pool_info();
    assert_eq!(info.merkle_root, expected);
    assert_eq!(info.epoch, 1);
}

#[test]
fn update_rejects_wrong_issuer_and_leaf_count() {
    let setup = Setup::new();
    setup.initialize();
    let stranger = Address::generate(&setup.env);
    assert_eq!(
        setup
            .client()
            .try_update_accredited_set(&stranger, &leaves(&setup.env)),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(
        setup.client().try_update_accredited_set(
            &setup.issuer,
            &vec![&setup.env, leaves(&setup.env).get_unchecked(0)]
        ),
        Err(Ok(Error::RootMismatch))
    );
}

#[test]
fn advance_epoch_is_issuer_only() {
    let setup = Setup::new();
    setup.initialize();
    assert_eq!(setup.client().advance_epoch(&setup.issuer), 1);
    assert_eq!(
        setup
            .client()
            .try_advance_epoch(&Address::generate(&setup.env)),
        Err(Ok(Error::Unauthorized))
    );
}
