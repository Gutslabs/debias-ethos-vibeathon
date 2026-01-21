/**
 * Historical Price Service using CoinGecko Pro API
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

// Ticker to CoinGecko ID mapping for common tokens
const TICKER_TO_COINGECKO: Record<string, string> = {
    // Major tokens
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'MATIC': 'polygon',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',

    // Solana ecosystem
    'JUP': 'jupiter-exchange-solana',
    'JUPITER': 'jupiter-exchange-solana',
    'RAY': 'raydium',
    'ORCA': 'orca',
    'BONK': 'bonk',
    'WIF': 'dogwifcoin',
    'PYTH': 'pyth-network',
    'JTO': 'jito-governance-token',
    'RENDER': 'render-token',
    'HNT': 'helium',
    'MOBILE': 'helium-mobile',
    'W': 'wormhole',
    'MET': 'meteora',
    'METEORA': 'meteora',

    // Memecoins
    'PEPE': 'pepe',
    'SHIB': 'shiba-inu',
    'FLOKI': 'floki',
    'POPCAT': 'popcat',
    'MOODENG': 'moo-deng',
    'GOAT': 'goatseus-maximus',
    'PNUT': 'peanut-the-squirrel',
    'ACT': 'act-i-the-ai-prophecy',
    'FARTCOIN': 'fartcoin',
    'FART': 'fartcoin',
    'TRUMP': 'official-trump',
    'MELANIA': 'official-melania-meme',
    'AI16Z': 'ai16z',
    'ZEREBRO': 'zerebro',
    'VIRTUAL': 'virtual-protocol',
    'AIXBT': 'aixbt',

    // DeFi
    'AAVE': 'aave',
    'MKR': 'maker',
    'CRV': 'curve-dao-token',
    'SNX': 'synthetix-network-token',
    'COMP': 'compound-governance-token',
    'SUSHI': 'sushi',
    'YFI': 'yearn-finance',
    '1INCH': '1inch',
    'GMX': 'gmx',
    'DYDX': 'dydx',
    'LDO': 'lido-dao',

    // L2s
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'STRK': 'starknet',
    'ZK': 'zksync',

    // AI tokens
    'FET': 'artificial-superintelligence-alliance',
    'TAO': 'bittensor',
    'RNDR': 'render-token',

    // Others
    'SUI': 'sui',
    'SEI': 'sei-network',
    'TIA': 'celestia',
    'INJ': 'injective-protocol',
    'HYPE': 'hyperliquid',
};

export interface HistoricalPriceResult {
    success: boolean;
    price?: number;
    currentPrice?: number;
    date?: string;
    coinId?: string;
    error?: string;
}

export class CoinGeckoService {
    private baseUrl: string;
    private apiKey: string | null;
    private cache = new Map<string, number>();
    private cacheFile: string;

    constructor() {
        this.apiKey = process.env.COINGECKO_API_KEY || null;
        // Demo API uses same base URL as free, just with API key header
        this.baseUrl = 'https://api.coingecko.com/api/v3';

        // Persistent disk cache
        this.cacheFile = path.join(process.cwd(), 'data', 'price_cache.json');

        // Load cache from disk if exists
        if (fs.existsSync(this.cacheFile)) {
            try {
                const cached = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
                Object.entries(cached).forEach(([k, v]) => this.cache.set(k, v as number));
                console.log(`[CoinGecko] Loaded ${this.cache.size} cached prices from disk`);
            } catch (e) {
                console.error('[CoinGecko] Failed to load cache:', e);
            }
        }

        console.log(`[CoinGecko] Initialized with ${this.apiKey ? 'Demo API Key' : 'Free API'}`);
    }

    /**
     * Save cache to disk
     */
    private saveCache(): void {
        const dir = path.dirname(this.cacheFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const obj: Record<string, number> = {};
        this.cache.forEach((v, k) => obj[k] = v);
        fs.writeFileSync(this.cacheFile, JSON.stringify(obj, null, 2));
    }

    /**
     * Get headers with API key if available
     */
    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Accept': 'application/json'
        };
        if (this.apiKey) {
            // Demo API uses x-cg-demo-api-key header
            headers['x-cg-demo-api-key'] = this.apiKey;
        }
        return headers;
    }

    /**
     * Get CoinGecko ID for a ticker
     */
    getCoinGeckoId(ticker: string): string | null {
        const cleanTicker = ticker.replace(/^\$/, '').toUpperCase();
        return TICKER_TO_COINGECKO[cleanTicker] || null;
    }

    /**
     * Get current price for a coin
     */
    async getCurrentPrice(ticker: string): Promise<number | null> {
        const coinId = this.getCoinGeckoId(ticker);
        if (!coinId) return null;

        try {
            const url = `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd`;
            const response = await fetch(url, { headers: this.getHeaders() });

            if (!response.ok) return null;

            const data = await response.json();
            return data[coinId]?.usd || null;
        } catch (error) {
            console.error(`[CoinGecko] Current price error:`, error);
            return null;
        }
    }

    /**
     * Get historical price at a specific date with retry logic
     */
    async getHistoricalPrice(ticker: string, date: Date, retries = 3): Promise<HistoricalPriceResult> {
        const coinId = this.getCoinGeckoId(ticker);

        if (!coinId) {
            return { success: false, error: `Unknown ticker: ${ticker}` };
        }

        // Format date as dd-mm-yyyy for CoinGecko
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        // Check cache
        const cacheKey = `${coinId}-${dateStr}`;
        if (this.cache.has(cacheKey)) {
            return {
                success: true,
                price: this.cache.get(cacheKey)!,
                date: dateStr,
                coinId
            };
        }

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const url = `${this.baseUrl}/coins/${coinId}/history?date=${dateStr}`;
                const response = await fetch(url, { headers: this.getHeaders() });

                if (!response.ok) {
                    if (response.status === 429) {
                        // Rate limited - wait with exponential backoff and retry
                        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                        console.log(`[CoinGecko] Rate limited. Attempt ${attempt}/${retries}. Waiting ${waitTime}ms...`);
                        await new Promise(r => setTimeout(r, waitTime));
                        continue;
                    }
                    return { success: false, error: `API error: ${response.status}` };
                }

                const data = await response.json();
                const price = data.market_data?.current_price?.usd;

                if (price === undefined) {
                    return { success: false, error: 'No price data for this date' };
                }

                // Cache the result and save to disk
                this.cache.set(cacheKey, price);
                this.saveCache();

                return {
                    success: true,
                    price,
                    date: dateStr,
                    coinId
                };
            } catch (error) {
                console.error(`[CoinGecko] Historical price error (attempt ${attempt}/${retries}):`, error);
                if (attempt === retries) {
                    return { success: false, error: String(error) };
                }
                // Wait before retry
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
        return { success: false, error: 'Max retries exceeded' };
    }

    /**
     * Get historical chart data (prices) for a range
     * Returns array of prices
     */
    async getHistoricalChart(ticker: string, fromDate: Date, toDate: Date): Promise<number[]> {
        const coinId = this.getCoinGeckoId(ticker);
        if (!coinId) return [];

        try {
            const from = Math.floor(fromDate.getTime() / 1000);
            const to = Math.floor(toDate.getTime() / 1000);
            const url = `${this.baseUrl}/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) return [];

            const data = await response.json();
            if (!data.prices || !Array.isArray(data.prices)) return [];

            // data.prices is [[timestamp, price], ...]
            // Initial sampling: Take up to 50 points to keep payload small
            const prices = data.prices.map((p: any) => p[1]);

            if (prices.length <= 50) return prices;

            // Downsample
            const step = Math.ceil(prices.length / 50);
            return prices.filter((_: any, i: number) => i % step === 0);
        } catch (error) {
            console.error('[CoinGecko] Chart fetch error:', error);
            return [];
        }
    }

    /**
     * Get both historical and current price in one call
     */
    async getPriceComparison(ticker: string, historicalDate: Date): Promise<HistoricalPriceResult> {
        const historical = await this.getHistoricalPrice(ticker, historicalDate);

        if (!historical.success) {
            return historical;
        }

        const currentPrice = await this.getCurrentPrice(ticker);

        return {
            ...historical,
            currentPrice: currentPrice || undefined
        };
    }

    /**
     * Parse tweet date string to Date object
     */
    parseTweetDate(tweetDate: string): Date {
        // Twitter format: "Wed Oct 22 12:19:30 +0000 2025"
        return new Date(tweetDate);
    }
}

// Singleton
let coinGeckoInstance: CoinGeckoService | null = null;

export function getCoinGeckoService(): CoinGeckoService {
    if (!coinGeckoInstance) {
        coinGeckoInstance = new CoinGeckoService();
    }
    return coinGeckoInstance;
}

// Backward compatibility
export const HistoricalPriceService = CoinGeckoService;
export const getHistoricalPriceService = getCoinGeckoService;

export { TICKER_TO_COINGECKO };
export default CoinGeckoService;
