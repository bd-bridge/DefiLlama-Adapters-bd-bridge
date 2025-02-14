const sdk = require('@defillama/sdk');  // DeFi Llama SDK for TVL calculations
const { getConnection, decodeAccount } = require('../helper/solana');  // Solana helper functions
const { PublicKey } = require('@solana/web3.js');  // Solana web3 library
const { sumTokens } = require('../helper/unwrapLPs');  // Helper to sum token balances

// Contract and token addresses for both Solana and BSC chains
const SOLANA_CONTRACT = '4bhMeAzoU3EenGxKXTo7nWjKVNqg1YTrN6rHLCasyvxs';  // Solana treasury account
const SOLANA_TOKEN_MINT = '7dUKUopcNWW6CcU4eRxCHh1uiMh32zDrmGf6ufqhxann';  // Token mint address on Solana
const BSC_OWNER = '0xac65072FC013442E14CCe3C8dc47e10dEe3E0683';  // BSC treasury address
const BSC_TOKEN = '0xc748673057861a797275CD8A068AbB95A902e8de';  // Token contract on BSC

/**
 * Fetches the balance of a token account on Solana
 * @param {string|PublicKey} tokenAccount - The token account to check
 * @param {string} chain - The blockchain (defaults to 'solana')
 * @returns {Promise<string>} The account balance as a string
 */
async function fetchTokenAccountBalance(tokenAccount, chain = 'solana') {
    // Convert string address to PublicKey if necessary
    if (typeof tokenAccount === 'string') tokenAccount = new PublicKey(tokenAccount);

    // Get connection and fetch account info
    const connection = getConnection(chain);
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    if (!accountInfo) throw new Error(`Account info not found for ${tokenAccount.toString()}`);

    // Decode the account data and return the amount
    const decoded = decodeAccount('tokenAccount', accountInfo);
    return decoded.amount.toString();
}

/**
 * Calculates TVL for Solana chain
 * @returns {Promise<Object>} Balance object with token amounts
 */
async function solanaTvl() {
    const tokenBalance = await fetchTokenAccountBalance(SOLANA_CONTRACT, 'solana');
    return { [`solana:${SOLANA_TOKEN_MINT}`]: tokenBalance };
}

/**
 * Calculates TVL for BSC chain
 * @param {number} timestamp - Current timestamp
 * @param {number} block - Block number
 * @param {Object} chainBlocks - Block numbers for different chains
 * @returns {Promise<Object>} Balance object with token amounts
 */
async function bscTvl(timestamp, block, chainBlocks) {
    const balances = {};
    await sumTokens(balances, [[BSC_TOKEN, BSC_OWNER]], chainBlocks.bsc, "bsc");
    return balances;
}

// Export the TVL calculation functions and metadata
module.exports = {
    methodology: 'TVL is calculated by summing the balance of the designated token on its Solana treasury token account and on the BSC treasury contract.',
    misrepresentedTokens: false,
    solana: {
        tvl: solanaTvl,
    },
    bsc: {
        tvl: bscTvl,
    },
};