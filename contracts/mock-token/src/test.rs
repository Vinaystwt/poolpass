extern crate std;

use soroban_sdk::{testutils::Address as _, Address, Env, MuxedAddress, String};

use crate::{Error, MockToken, MockTokenClient};

#[test]
fn admin_mints_and_holders_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(MockToken, ());
    let client = MockTokenClient::new(&env, &id);
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    client.initialize(
        &admin,
        &7,
        &String::from_str(&env, "Mock USDC"),
        &String::from_str(&env, "mUSDC"),
    );
    client.mint(&alice, &100);
    client.transfer(&alice, MuxedAddress::from(&bob), &40);
    assert_eq!(client.balance(&alice), 60);
    assert_eq!(client.balance(&bob), 40);
    assert_eq!(client.decimals(), 7);
    assert_eq!(client.name(), String::from_str(&env, "Mock USDC"));
    assert_eq!(client.symbol(), String::from_str(&env, "mUSDC"));
    assert_eq!(client.admin(), admin);
}

#[test]
fn rejects_wrong_admin_and_invalid_amounts() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(MockToken, ());
    let client = MockTokenClient::new(&env, &id);
    let admin = Address::generate(&env);
    let holder = Address::generate(&env);
    client.initialize(
        &admin,
        &7,
        &String::from_str(&env, "Pool Token"),
        &String::from_str(&env, "pPOOL"),
    );
    assert_eq!(
        client.try_set_admin(&Address::generate(&env), &holder),
        Err(Ok(Error::Unauthorized))
    );
    assert_eq!(client.try_mint(&holder, &0), Err(Ok(Error::InvalidAmount)));
    assert_eq!(
        client.try_transfer(&holder, MuxedAddress::from(&admin), &1),
        Err(Ok(Error::InsufficientBalance))
    );
}
