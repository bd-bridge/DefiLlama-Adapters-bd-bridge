const sdk = require('@defillama/sdk');
const { getTokenAccountBalances } = require('../helper/solana');


const SOLANA_CONTRACT = '4bhMeAzoU3EenGxKXTo7nWjKVNqg1YTrN6rHLCasyvxs';
const SOLANA_TOKEN_MINT = '7dUKUopcNWW6CcU4eRxCHh1uiMh32zDrmGf6ufqhxann';
const BSC_OWNER = '0xac65072FC013442E14CCe3C8dc47e10dEe3E0683';
const BSC_TOKEN = '0xc748673057861a797275CD8A068AbB95A902e8de';


async function solanaTvl() {
    const balances = await getTokenAccountBalances([SOLANA_CONTRACT], { chain: 'solana' });
    const tokenBalance = balances[SOLANA_TOKEN_MINT] || "0";
    return { [`solana:${SOLANA_TOKEN_MINT}`]: tokenBalance };
}

async function bscTvl(timestamp, block, chainBlocks) {
    const balances = {};
    await sdk.util.sumTokens(
        balances,
        [[BSC_TOKEN, BSC_OWNER]],
        block,
        chainBlocks.bsc,
        "bsc"
    );
    return balances;
}


async function tvl(timestamp, block, chainBlocks) {
    const balances = {};

    const [bscBalances, solanaBalances] = await Promise.all([
        bscTvl(timestamp, block, chainBlocks),
        solanaTvl()
    ]);

    for (const [token, balance] of Object.entries(bscBalances)) {
        sdk.util.sumSingleBalance(balances, token, balance);
    }

    for (const [token, balance] of Object.entries(solanaBalances)) {
        sdk.util.sumSingleBalance(balances, token, balance);
    }

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
    tvl,
};
