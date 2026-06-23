#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, MuxedAddress,
    String,
};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND_TO: u32 = 518_400;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    Unauthorized = 1,
    InvalidAmount = 2,
    InsufficientBalance = 3,
    AlreadyInitialized = 4,
    NotInitialized = 5,
}

#[contracttype]
enum DataKey {
    Admin,
    Decimals,
    Name,
    Symbol,
    Balance(Address),
}

#[contractevent]
pub struct Minted {
    #[topic]
    pub to: Address,
    pub amount: i128,
}

#[contractevent]
pub struct Transferred {
    #[topic]
    pub from: Address,
    #[topic]
    pub to: Address,
    pub amount: i128,
    pub to_muxed_id: Option<u64>,
}

#[contract]
pub struct MockToken;

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn stored_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

fn require_admin(env: &Env, candidate: &Address) -> Result<(), Error> {
    if stored_admin(env)? != *candidate {
        return Err(Error::Unauthorized);
    }
    candidate.require_auth();
    Ok(())
}

fn balance_of(env: &Env, address: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(address.clone()))
        .unwrap_or(0)
}

fn set_balance(env: &Env, address: &Address, amount: i128) {
    let key = DataKey::Balance(address.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

#[contractimpl]
impl MockToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        decimals: u32,
        name: String,
        symbol: String,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        let storage = env.storage().instance();
        storage.set(&DataKey::Admin, &admin);
        storage.set(&DataKey::Decimals, &decimals);
        storage.set(&DataKey::Name, &name);
        storage.set(&DataKey::Symbol, &symbol);
        bump_instance(&env);
        Ok(())
    }

    pub fn set_admin(env: Env, current_admin: Address, new_admin: Address) -> Result<(), Error> {
        require_admin(&env, &current_admin)?;
        env.storage().instance().set(&DataKey::Admin, &new_admin);
        bump_instance(&env);
        Ok(())
    }

    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let configured_admin = stored_admin(&env)?;
        configured_admin.require_auth();
        let next = balance_of(&env, &to)
            .checked_add(amount)
            .ok_or(Error::InvalidAmount)?;
        set_balance(&env, &to, next);
        Minted { to, amount }.publish(&env);
        Ok(())
    }

    pub fn transfer(env: Env, from: Address, to: MuxedAddress, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        from.require_auth();
        let from_balance = balance_of(&env, &from);
        if from_balance < amount {
            return Err(Error::InsufficientBalance);
        }
        let recipient = to.address();
        let recipient_balance = balance_of(&env, &recipient)
            .checked_add(amount)
            .ok_or(Error::InvalidAmount)?;
        set_balance(&env, &from, from_balance - amount);
        set_balance(&env, &recipient, recipient_balance);
        Transferred {
            from,
            to: recipient,
            amount,
            to_muxed_id: to.id(),
        }
        .publish(&env);
        Ok(())
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        balance_of(&env, &id)
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        stored_admin(&env)
    }

    pub fn decimals(env: Env) -> Result<u32, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Decimals)
            .ok_or(Error::NotInitialized)
    }

    pub fn name(env: Env) -> Result<String, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Name)
            .ok_or(Error::NotInitialized)
    }

    pub fn symbol(env: Env) -> Result<String, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Symbol)
            .ok_or(Error::NotInitialized)
    }
}

#[cfg(test)]
mod test;
