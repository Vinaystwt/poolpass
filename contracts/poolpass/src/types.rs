use soroban_sdk::{contracterror, contractevent, contracttype, Address, BytesN, String};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    Unauthorized = 1,
    InvalidProof = 2,
    RootMismatch = 3,
    EpochMismatch = 4,
    NullifierUsed = 5,
    AmountInvalid = 6,
    PaymentFailed = 7,
    NotInitialized = 8,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolInfo {
    pub issuer: Address,
    pub usdc_sac: Address,
    pub pool_token: Address,
    pub pool_name: String,
    pub merkle_root: BytesN<32>,
    pub merkle_depth: u32,
    pub epoch: u32,
    pub total_subscribed: i128,
    pub per_investor_cap_public: Option<i128>,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RootUpdated {
    pub root: BytesN<32>,
    pub leaf_count: u32,
    #[topic]
    pub epoch: u32,
    pub timestamp: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EpochAdvanced {
    #[topic]
    pub epoch: u32,
    pub timestamp: u64,
}
