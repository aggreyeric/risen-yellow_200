//! # Risen Crowdfunding Contract
//!
//! A minimal but correct Soroban crowdfunding contract used by the
//! Risen "Yellow Belt" (Level 2) frontend challenge.
//!
//! - `initialize` configures the campaign (admin, beneficiary, payment token,
//!   funding goal, deadline).
//! - `donate` accepts a real XLM (native SAC) payment from a donor, forwards it
//!   to the campaign beneficiary, records the donor and emits an event.
//! - `get_total_raised` / `get_donor_count` are read entry-points used by the
//!   frontend to render live progress.
//!
//! All state lives in instance + persistent storage. The contract emits
//! `donate` / `initialize` events that the frontend polls.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    token::Client as TokenClient, Address, Env, Symbol,
};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

/// Top-level campaign configuration + live counters (kept in instance storage).
const CAMPAIGN_KEY: Symbol = symbol_short!("CAMPAIGN");

/// Per-donor ledger entry: total amount a given address has donated.
#[contracttype]
pub enum DataKey {
    Donor(Address),
}

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Campaign {
    /// Address permitted to reconfigure the campaign.
    pub admin: Address,
    /// Beneficiary that receives every donation immediately.
    pub recipient: Address,
    /// Payment token (the native XLM SAC address on the target network).
    pub token: Address,
    /// Funding goal, in the token's smallest unit (stroops for XLM).
    pub goal: i128,
    /// Optional absolute ledger timestamp after which donations are rejected.
    /// A value of `0` means "no deadline".
    pub deadline: u64,
    /// Total amount raised so far.
    pub total_raised: i128,
    /// Number of unique donors.
    pub donor_count: u32,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error {
    /// Campaign has already been initialized.
    AlreadyInitialized = 1,
    /// Campaign has not been initialized yet.
    NotInitialized = 2,
    /// Caller is not the campaign admin.
    Unauthorized = 3,
    /// Donation amount must be strictly positive.
    InvalidAmount = 4,
    /// Campaign deadline has passed.
    CampaignEnded = 5,
    /// Arithmetic overflow while accumulating totals.
    Overflow = 6,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EventTopic {
    Initialize,
    Donate,
}

/// One donation event emitted on every successful `donate` call. The frontend
/// watches the resulting transaction effects to update the UI in real-time.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DonationEvent {
    pub donor: Address,
    pub amount: i128,
    pub total_raised: i128,
    pub donor_count: u32,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct Crowdfund;

#[contractimpl]
impl Crowdfund {
    /// Initialize the campaign. Callable exactly once, right after deploy.
    pub fn initialize(
        env: Env,
        admin: Address,
        recipient: Address,
        token: Address,
        goal: i128,
        deadline: u64,
    ) -> Result<(), Error> {
        let storage = env.storage().instance();
        if storage.has(&CAMPAIGN_KEY) {
            return Err(Error::AlreadyInitialized);
        }
        if goal <= 0 {
            return Err(Error::InvalidAmount);
        }

        let campaign = Campaign {
            admin,
            recipient,
            token,
            goal,
            deadline,
            total_raised: 0,
            donor_count: 0,
        };
        storage.set(&CAMPAIGN_KEY, &campaign);
        // Bump the lifetime of the instance entry so reads stay alive.
        storage.extend_ttl(100, 100);

        env.events().publish(
            (EventTopic::Initialize, campaign.recipient.clone()),
            campaign.goal,
        );
        Ok(())
    }

    /// Donate `amount` of the configured payment token to the campaign.
    ///
    /// The donor must authorize this call (`require_auth`). The token (native
    /// XLM SAC) is transferred from the donor directly to the recipient, the
    /// running totals are updated, and a `Donate` event is emitted.
    pub fn donate(env: Env, donor: Address, amount: i128) -> Result<(), Error> {
        donor.require_auth();

        let storage = env.storage().instance();
        let mut campaign: Campaign = storage
            .get(&CAMPAIGN_KEY)
            .ok_or(Error::NotInitialized)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if campaign.deadline != 0 && env.ledger().timestamp() > campaign.deadline {
            return Err(Error::CampaignEnded);
        }

        // Move the payment token: donor -> recipient, via the configured SAC.
        let token = TokenClient::new(&env, &campaign.token);
        token.transfer(&donor, &campaign.recipient, &amount);

        // Track total raised.
        campaign.total_raised = campaign
            .total_raised
            .checked_add(amount)
            .ok_or(Error::Overflow)?;

        // Track unique donors via persistent storage.
        let persistent = env.storage().persistent();
        let donor_key = DataKey::Donor(donor.clone());
        let already_donated = persistent.get(&donor_key).unwrap_or(0i128);
        if already_donated == 0 {
            campaign.donor_count = campaign
                .donor_count
                .checked_add(1)
                .ok_or(Error::Overflow)?;
        }
        persistent.set(&donor_key, &(already_donated + amount));
        persistent.extend_ttl(&donor_key, 100, 100);

        storage.set(&CAMPAIGN_KEY, &campaign);
        storage.extend_ttl(100, 100);

        env.events().publish(
            (EventTopic::Donate, donor.clone()),
            DonationEvent {
                donor,
                amount,
                total_raised: campaign.total_raised,
                donor_count: campaign.donor_count,
            },
        );
        Ok(())
    }

    // -- read helpers -------------------------------------------------------

    /// Total amount raised so far, in the token's smallest unit.
    pub fn get_total_raised(env: Env) -> i128 {
        Self::get_campaign(env).total_raised
    }

    /// Number of unique donors.
    pub fn get_donor_count(env: Env) -> u32 {
        Self::get_campaign(env).donor_count
    }

    /// Full campaign snapshot for the frontend.
    pub fn get_campaign(env: Env) -> Campaign {
        let storage = env.storage().instance();
        storage
            .get(&CAMPAIGN_KEY)
            .unwrap_or_else(|| Campaign {
                admin: env.current_contract_address(),
                recipient: env.current_contract_address(),
                token: env.current_contract_address(),
                goal: 0,
                deadline: 0,
                total_raised: 0,
                donor_count: 0,
            })
    }

    /// Amount a specific donor has contributed in total.
    pub fn get_donation(env: Env, donor: Address) -> i128 {
        let persistent = env.storage().persistent();
        persistent.get(&DataKey::Donor(donor)).unwrap_or(0)
    }

    /// Convenience view: has the funding goal been reached?
    pub fn is_goal_reached(env: Env) -> bool {
        let campaign = Self::get_campaign(env);
        campaign.total_raised >= campaign.goal
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as AddressTestutils, Ledger};

    fn make_token(env: &Env) -> Address {
        soroban_sdk::testutils::token::Token::register(env, Address::generate(env));
        let token = Address::generate(env);
        soroban_sdk::testutils::token::Token::register(env, &token);
        token
    }

    #[test]
    fn initialize_then_donate_updates_totals() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_ledger_sequence(10);

        let admin = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token = make_token(&env);
        let donor = Address::generate(&env);
        let goal = 1_000_000_000i128; // 100 XLM

        let contract_id = env.register(Crowdfund, ());
        let client = CrowdfundClient::new(&env, &contract_id);

        client.initialize(&admin, &recipient, &token, &goal, &0);

        assert_eq!(client.get_total_raised(), 0);
        assert_eq!(client.get_donor_count(), 0);

        // Mint some balance to the donor on the mock token.
        soroban_sdk::testutils::token::Token::mint(
            &env,
            &token,
            &admin,
            &donor,
            &5_000_000i128,
        );

        client.donate(&donor, &5_000_000i128);

        assert_eq!(client.get_total_raised(), 5_000_000);
        assert_eq!(client.get_donor_count(), 1);
        assert_eq!(client.get_donation(&donor), 5_000_000);
    }

    #[test]
    fn double_initialize_errors() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token = make_token(&env);

        let contract_id = env.register(Crowdfund, ());
        let client = CrowdfundClient::new(&env, &contract_id);

        client.initialize(&admin, &recipient, &token, &1_000i128, &0);
        let res = client.try_initialize(&admin, &recipient, &token, &1_000i128, &0);
        assert!(res.is_err());
    }

    #[test]
    fn zero_amount_donate_errors() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token = make_token(&env);
        let donor = Address::generate(&env);

        let contract_id = env.register(Crowdfund, ());
        let client = CrowdfundClient::new(&env, &contract_id);
        client.initialize(&admin, &recipient, &token, &1_000i128, &0);

        let res = client.try_donate(&donor, &0i128);
        assert!(res.is_err());
    }
}
