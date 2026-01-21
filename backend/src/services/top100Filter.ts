/**
 * Top 100 Market Cap Coins Filter
 * Used to filter out unknown/small tokens and focus on established coins
 */

// Top 100 coins by market cap (as of Jan 2026)
// Update periodically or fetch dynamically from CoinGecko
export const TOP_100_TICKERS: Set<string> = new Set([
    // Top 10
    'BTC', 'BITCOIN',
    'ETH', 'ETHEREUM',
    'XRP', 'RIPPLE',
    'USDT', 'TETHER',
    'SOL', 'SOLANA',
    'BNB',
    'DOGE', 'DOGECOIN',
    'USDC',
    'ADA', 'CARDANO',
    'TRX', 'TRON',

    // 11-25
    'AVAX', 'AVALANCHE',
    'LINK', 'CHAINLINK',
    'XLM', 'STELLAR',
    'TON', 'TONCOIN',
    'SHIB',
    'SUI',
    'HBAR',
    'DOT', 'POLKADOT',
    'BCH',
    'LTC', 'LITECOIN',
    'HYPE', 'HYPERLIQUID',
    'UNI', 'UNISWAP',
    'PEPE',
    'NEAR',
    'LEO',

    // 26-50
    'APT', 'APTOS',
    'AAVE',
    'XMR', 'MONERO',
    'ICP',
    'ETC',
    'POL', 'MATIC', 'POLYGON',
    'RENDER',
    'TAO',
    'VET', 'VECHAIN',
    'MNT', 'MANTLE',
    'CRO', 'CRONOS',
    'FIL', 'FILECOIN',
    'ARB', 'ARBITRUM',
    'KAS', 'KASPA',
    'ATOM', 'COSMOS',
    'OP', 'OPTIMISM',
    'FTM', 'FANTOM',
    'WIF',
    'INJ', 'INJECTIVE',
    'IMX', 'IMMUTABLE',
    'BONK',
    'GRT', 'THEGRAPH',
    'THETA',
    'SEI',

    // 51-75
    'ALGO', 'ALGORAND',
    'JUP', 'JUPITER',
    'RUNE', 'THORCHAIN',
    'PYTH',
    'FLOKI',
    'LDO',
    'TIA', 'CELESTIA',
    'RAY', 'RAYDIUM',
    'FET', 'FETCHAI',
    'ONDO',
    'GALA',
    'JASMY',
    'FLOW',
    'SAND', 'SANDBOX',
    'BEAM',
    'MOVE',
    'PENDLE',
    'XTZ', 'TEZOS',
    'AXS', 'AXIE',
    'EOS',
    'CORE',
    'MANA', 'DECENTRALAND',
    'ENS',
    'QNT', 'QUANT',

    // 76-100
    'STRK', 'STARKNET',
    'KAIA',
    'ZEC', 'ZCASH',
    'XEC',
    'NEO',
    'DYDX',
    'IOTA',
    'CFX', 'CONFLUX',
    'BTT',
    'AIOZ',
    'VIRTUAL',
    'AERO',
    'W', 'WORMHOLE',
    'MET', 'METEORA',  // Solana DeFi
    'JTO', 'JITO',
    'HNT', 'HELIUM',
    'BLUR',
    'CAKE', 'PANCAKESWAP',
    'CKB',
    'SUPER',
    'FARTCOIN',  // Meme
    'POPCAT',
    'GOAT',
    'PNUT',
    'ACT',
    'MOODENG',
    'AI16Z',
    'ZEREBRO',
    'GRIFFAIN',
]);

/**
 * Check if a ticker is in the top 100
 */
export function isTop100Ticker(ticker: string): boolean {
    const clean = ticker.replace(/^\$/, '').toUpperCase();
    return TOP_100_TICKERS.has(clean);
}

/**
 * Filter an array of tickers to only include top 100
 */
export function filterTop100Tickers(tickers: string[]): string[] {
    return tickers.filter(t => isTop100Ticker(t));
}

/**
 * Normalize common aliases to standard ticker
 */
export function normalizeTicker(ticker: string): string {
    const aliases: Record<string, string> = {
        'BITCOIN': 'BTC',
        'ETHEREUM': 'ETH',
        'SOLANA': 'SOL',
        'RIPPLE': 'XRP',
        'CARDANO': 'ADA',
        'DOGECOIN': 'DOGE',
        'AVALANCHE': 'AVAX',
        'CHAINLINK': 'LINK',
        'POLKADOT': 'DOT',
        'LITECOIN': 'LTC',
        'MONERO': 'XMR',
        'POLYGON': 'MATIC',
        'ARBITRUM': 'ARB',
        'OPTIMISM': 'OP',
        'UNISWAP': 'UNI',
        'COSMOS': 'ATOM',
        'JUPITER': 'JUP',
        'METEORA': 'MET',
        'HYPERLIQUID': 'HYPE',
        'STARKNET': 'STRK',
        'ZCASH': 'ZEC',
        'TONCOIN': 'TON',
    };

    const clean = ticker.replace(/^\$/, '').toUpperCase();
    return aliases[clean] || clean;
}

export default TOP_100_TICKERS;
