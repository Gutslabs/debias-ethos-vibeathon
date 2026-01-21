import dotenv from 'dotenv';

dotenv.config();

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest';

export interface TokenPrice {
    symbol: string;
    name: string;
    current_price: number;
    market_cap: number | null;
    volume_24h: number | null;
    price_change_24h: number | null;
    last_updated: string;
}

export interface HistoricalPrice {
    date: Date;
    price: number;
    market_cap?: number;
    volume?: number;
}

export class PriceService {
    private coingeckoApiKey?: string;

    constructor() {
        this.coingeckoApiKey = process.env.COINGECKO_API_KEY;
    }

    /**
     * Get current price from CoinGecko
     */
    async getCurrentPrice(coingeckoId: string): Promise<TokenPrice | null> {
        try {
            const url = `${COINGECKO_BASE_URL}/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`;

            const response = await fetch(url, {
                headers: this.coingeckoApiKey
                    ? { 'x-cg-demo-api-key': this.coingeckoApiKey }
                    : {}
            });

            if (!response.ok) {
                console.error(`[PriceService] CoinGecko error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            return {
                symbol: data.symbol?.toUpperCase(),
                name: data.name,
                current_price: data.market_data?.current_price?.usd || 0,
                market_cap: data.market_data?.market_cap?.usd || null,
                volume_24h: data.market_data?.total_volume?.usd || null,
                price_change_24h: data.market_data?.price_change_percentage_24h || null,
                last_updated: data.last_updated,
            };
        } catch (error) {
            console.error('[PriceService] Error fetching current price:', error);
            return null;
        }
    }

    /**
     * Get historical price from CoinGecko
     * @param coingeckoId The CoinGecko ID of the token
     * @param date The date to get the price for (format: DD-MM-YYYY)
     */
    async getHistoricalPrice(coingeckoId: string, date: Date): Promise<HistoricalPrice | null> {
        try {
            // Format date as DD-MM-YYYY for CoinGecko API
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;

            const url = `${COINGECKO_BASE_URL}/coins/${coingeckoId}/history?date=${formattedDate}&localization=false`;

            const response = await fetch(url, {
                headers: this.coingeckoApiKey
                    ? { 'x-cg-demo-api-key': this.coingeckoApiKey }
                    : {}
            });

            if (!response.ok) {
                console.error(`[PriceService] CoinGecko historical error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (!data.market_data) {
                return null;
            }

            return {
                date,
                price: data.market_data.current_price?.usd || 0,
                market_cap: data.market_data.market_cap?.usd,
                volume: data.market_data.total_volume?.usd,
            };
        } catch (error) {
            console.error('[PriceService] Error fetching historical price:', error);
            return null;
        }
    }

    /**
     * Get price chart data from CoinGecko
     * @param coingeckoId The CoinGecko ID of the token
     * @param days Number of days of data (1, 7, 14, 30, 90, 180, 365, max)
     */
    async getPriceChart(coingeckoId: string, days: number | 'max' = 30): Promise<HistoricalPrice[]> {
        try {
            const url = `${COINGECKO_BASE_URL}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}`;

            const response = await fetch(url, {
                headers: this.coingeckoApiKey
                    ? { 'x-cg-demo-api-key': this.coingeckoApiKey }
                    : {}
            });

            if (!response.ok) {
                console.error(`[PriceService] CoinGecko chart error: ${response.status}`);
                return [];
            }

            const data = await response.json();

            return (data.prices || []).map((item: [number, number]) => ({
                date: new Date(item[0]),
                price: item[1],
            }));
        } catch (error) {
            console.error('[PriceService] Error fetching price chart:', error);
            return [];
        }
    }

    /**
     * Search for a token on CoinGecko
     */
    async searchToken(query: string): Promise<{ id: string; symbol: string; name: string }[]> {
        try {
            const url = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`;

            const response = await fetch(url, {
                headers: this.coingeckoApiKey
                    ? { 'x-cg-demo-api-key': this.coingeckoApiKey }
                    : {}
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json();

            return (data.coins || []).slice(0, 10).map((coin: any) => ({
                id: coin.id,
                symbol: coin.symbol?.toUpperCase(),
                name: coin.name,
            }));
        } catch (error) {
            console.error('[PriceService] Error searching token:', error);
            return [];
        }
    }

    /**
     * Get token price from DexScreener (for DEX tokens)
     */
    async getDexScreenerPrice(pairAddress: string): Promise<TokenPrice | null> {
        try {
            const url = `${DEXSCREENER_BASE_URL}/dex/pairs/ethereum/${pairAddress}`;

            const response = await fetch(url);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            const pair = data.pairs?.[0];

            if (!pair) {
                return null;
            }

            return {
                symbol: pair.baseToken?.symbol || '',
                name: pair.baseToken?.name || '',
                current_price: parseFloat(pair.priceUsd) || 0,
                market_cap: pair.fdv || null,
                volume_24h: pair.volume?.h24 || null,
                price_change_24h: pair.priceChange?.h24 || null,
                last_updated: new Date().toISOString(),
            };
        } catch (error) {
            console.error('[PriceService] Error fetching DexScreener price:', error);
            return null;
        }
    }

    /**
     * Search for a token on DexScreener
     */
    async searchDexScreener(query: string): Promise<any[]> {
        try {
            const url = `${DEXSCREENER_BASE_URL}/dex/search?q=${encodeURIComponent(query)}`;

            const response = await fetch(url);

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return data.pairs || [];
        } catch (error) {
            console.error('[PriceService] Error searching DexScreener:', error);
            return [];
        }
    }

    /**
     * Calculate price change percentage
     */
    calculatePriceChange(priceAtMention: number, currentPrice: number): number {
        if (priceAtMention === 0) return 0;
        return ((currentPrice - priceAtMention) / priceAtMention) * 100;
    }
}

// Singleton instance
let priceServiceInstance: PriceService | null = null;

export function getPriceService(): PriceService {
    if (!priceServiceInstance) {
        priceServiceInstance = new PriceService();
    }
    return priceServiceInstance;
}

export default PriceService;
