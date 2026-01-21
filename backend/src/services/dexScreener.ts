/**
 * DexScreener Service
 * Search tokens and get prices from DexScreener API
 */

export interface DexPair {
    chainId: string;
    dexId: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
    };
    liquidity?: {
        usd: number;
    };
    fdv?: number;
    marketCap?: number;
}

export interface TokenSearchResult {
    success: boolean;
    pair?: DexPair;
    error?: string;
}

export class DexScreenerService {
    private baseUrl = 'https://api.dexscreener.com/latest';

    /**
     * Search for a token by ticker on a specific chain
     */
    async searchByTicker(ticker: string, chain: string = 'solana'): Promise<TokenSearchResult> {
        try {
            // Clean ticker (remove $ if present)
            const cleanTicker = ticker.replace(/^\$/, '').toUpperCase();

            // Search DexScreener
            const response = await fetch(`${this.baseUrl}/dex/search?q=${cleanTicker}`);

            if (!response.ok) {
                return { success: false, error: `API error: ${response.status}` };
            }

            const data = await response.json();
            const pairs: DexPair[] = data.pairs || [];

            if (pairs.length === 0) {
                return { success: false, error: 'No pairs found' };
            }

            // Filter by chain and find best pair (highest volume/liquidity)
            const chainPairs = pairs.filter(p =>
                p.chainId.toLowerCase() === chain.toLowerCase() &&
                p.baseToken.symbol.toUpperCase() === cleanTicker
            );

            if (chainPairs.length === 0) {
                // Try any chain if specific chain not found
                const anyChainPairs = pairs.filter(p =>
                    p.baseToken.symbol.toUpperCase() === cleanTicker
                );

                if (anyChainPairs.length === 0) {
                    return { success: false, error: `Token ${cleanTicker} not found` };
                }

                // Return highest volume pair
                const bestPair = anyChainPairs.reduce((best, current) =>
                    (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
                );

                return { success: true, pair: bestPair };
            }

            // Return highest volume pair on target chain
            const bestPair = chainPairs.reduce((best, current) =>
                (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
            );

            return { success: true, pair: bestPair };
        } catch (error) {
            console.error('[DexScreener] Search error:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Get current price for a pair
     */
    async getPrice(pairAddress: string, chain: string = 'solana'): Promise<number | null> {
        try {
            const response = await fetch(`${this.baseUrl}/dex/pairs/${chain}/${pairAddress}`);

            if (!response.ok) return null;

            const data = await response.json();
            return parseFloat(data.pair?.priceUsd || '0');
        } catch (error) {
            console.error('[DexScreener] Price error:', error);
            return null;
        }
    }

    /**
     * Get token info by address
     */
    async getTokenByAddress(address: string, chain: string = 'solana'): Promise<TokenSearchResult> {
        try {
            const response = await fetch(`${this.baseUrl}/dex/tokens/${address}`);

            if (!response.ok) {
                return { success: false, error: `API error: ${response.status}` };
            }

            const data = await response.json();
            const pairs: DexPair[] = data.pairs || [];

            if (pairs.length === 0) {
                return { success: false, error: 'No pairs found for token' };
            }

            // Return highest volume pair
            const bestPair = pairs
                .filter(p => p.chainId.toLowerCase() === chain.toLowerCase())
                .reduce((best, current) =>
                    (current.volume?.h24 || 0) > (best.volume?.h24 || 0) ? current : best
                    , pairs[0]);

            return { success: true, pair: bestPair };
        } catch (error) {
            console.error('[DexScreener] Token lookup error:', error);
            return { success: false, error: String(error) };
        }
    }
}

// Singleton
let dexServiceInstance: DexScreenerService | null = null;

export function getDexScreenerService(): DexScreenerService {
    if (!dexServiceInstance) {
        dexServiceInstance = new DexScreenerService();
    }
    return dexServiceInstance;
}

export default DexScreenerService;
