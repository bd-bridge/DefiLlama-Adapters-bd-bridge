const sdk = require('@defillama/sdk');
const { getConnection, decodeAccount } = require('../helper/solana');
const { PublicKey } = require('@solana/web3.js');
const { sumTokens } = require('../helper/unwrapLPs');


const SOLANA_CONTRACT = '4bhMeAzoU3EenGxKXTo7nWjKVNqg1YTrN6rHLCasyvxs';
const SOLANA_TOKEN_MINT = '7dUKUopcNWW6CcU4eRxCHh1uiMh32zDrmGf6ufqhxann';
const BSC_OWNER = '0xac65072FC013442E14CCe3C8dc47e10dEe3E0683';
const BSC_TOKEN = '0xc748673057861a797275CD8A068AbB95A902e8de';


/**
 * Minimal function to fetch the balance of a Solana token account.
 * It uses getConnection() and decodeAccount() from the helper.
 */
async function fetchTokenAccountBalance(tokenAccount, chain = 'solana') {
    if (typeof tokenAccount === 'string') tokenAccount = new PublicKey(tokenAccount);
    const connection = getConnection(chain);
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    if (!accountInfo) throw new Error(`Account info not found for ${tokenAccount.toString()}`);
    // Decode the account as a 'tokenAccount'
    const decoded = decodeAccount('tokenAccount', accountInfo);
    return decoded.amount.toString();
}


async function solanaTvl() {
    const tokenBalance = await fetchTokenAccountBalance(SOLANA_CONTRACT, 'solana');
    return { [`solana:${SOLANA_TOKEN_MINT}`]: tokenBalance };
}

async function bscTvl(timestamp, block, chainBlocks) {
    const balances = {};
    await sumTokens(balances, [[BSC_TOKEN, BSC_OWNER]], chainBlocks.bsc, "bsc");
    return balances;
}

module.exports = {
    methodology:
        'TVL is calculated by summing the balance of the designated token on its Solana treasury token account and on the BSC treasury contract.',
    misrepresentedTokens: false,
    solana: {
        tvl: solanaTvl,
    },
    bsc: {
        tvl: bscTvl,
    },
};