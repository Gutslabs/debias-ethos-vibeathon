/**
 * Token Detector Service
 * Extracts cryptocurrency token mentions from tweet text
 */

export interface DetectedToken {
    symbol: string;
    type: 'cashtag' | 'contract' | 'phrase';
    chain?: 'ethereum' | 'solana' | 'bsc' | 'polygon' | 'unknown';
    raw: string;
}

// Common cashtag pattern ($SOL, $BTC, $PEPE)
const CASHTAG_REGEX = /\$([A-Z]{2,10})\b/gi;

// EVM contract address pattern
const EVM_CONTRACT_REGEX = /0x[a-fA-F0-9]{40}/g;

// Solana address pattern (base58, 32-44 characters)
const SOLANA_ADDRESS_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

// Common crypto-related phrases
const PHRASE_PATTERNS = [
    /\bbuy(?:ing)?\s+([A-Z]{2,10})\b/gi,
    /\blong(?:ing)?\s+([A-Z]{2,10})\b/gi,
    /\bbullish\s+(?:on\s+)?([A-Z]{2,10})\b/gi,
    /\baccumulat(?:e|ing)\s+([A-Z]{2,10})\b/gi,
    /\bhodl(?:ing)?\s+([A-Z]{2,10})\b/gi,
    /\bstacking\s+([A-Z]{2,10})\b/gi,
];

// Tokens to ignore (common words that might match)
const IGNORE_LIST = new Set([
    'THE', 'AND', 'FOR', 'NOT', 'BUT', 'YOU', 'ALL', 'CAN', 'HAD', 'HER',
    'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW',
    'ITS', 'LET', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO',
    'BOY', 'DID', 'ITS', 'SAY', 'SHE', 'TOO', 'USE', 'CEO', 'NFT', 'APY',
    'TVL', 'ATH', 'ATL', 'FUD', 'HODL', 'FOMO', 'DYOR', 'IMO', 'TBH', 'RN',
    'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', // Fiat currencies
    'API', 'SDK', 'DAO', 'DEX', 'DCA', 'AMM', 'GM', 'GN', 'RT', 'DM', 'IG',
    'TG', 'TW', 'FB', 'YT', 'ETF', 'IRS', 'SEC', 'CEO', 'CTO', 'COO',
]);

// Known major tokens for quick matching
const KNOWN_TOKENS: Record<string, { name: string; coingeckoId: string }> = {
    'BTC': { name: 'Bitcoin', coingeckoId: 'bitcoin' },
    'ETH': { name: 'Ethereum', coingeckoId: 'ethereum' },
    'SOL': { name: 'Solana', coingeckoId: 'solana' },
    'BNB': { name: 'BNB', coingeckoId: 'binancecoin' },
    'XRP': { name: 'XRP', coingeckoId: 'ripple' },
    'ADA': { name: 'Cardano', coingeckoId: 'cardano' },
    'DOGE': { name: 'Dogecoin', coingeckoId: 'dogecoin' },
    'AVAX': { name: 'Avalanche', coingeckoId: 'avalanche-2' },
    'DOT': { name: 'Polkadot', coingeckoId: 'polkadot' },
    'MATIC': { name: 'Polygon', coingeckoId: 'matic-network' },
    'LINK': { name: 'Chainlink', coingeckoId: 'chainlink' },
    'ATOM': { name: 'Cosmos', coingeckoId: 'cosmos' },
    'UNI': { name: 'Uniswap', coingeckoId: 'uniswap' },
    'LTC': { name: 'Litecoin', coingeckoId: 'litecoin' },
    'SHIB': { name: 'Shiba Inu', coingeckoId: 'shiba-inu' },
    'PEPE': { name: 'Pepe', coingeckoId: 'pepe' },
    'APE': { name: 'ApeCoin', coingeckoId: 'apecoin' },
    'ARB': { name: 'Arbitrum', coingeckoId: 'arbitrum' },
    'OP': { name: 'Optimism', coingeckoId: 'optimism' },
    'SUI': { name: 'Sui', coingeckoId: 'sui' },
    'APT': { name: 'Aptos', coingeckoId: 'aptos' },
    'INJ': { name: 'Injective', coingeckoId: 'injective-protocol' },
    'SEI': { name: 'Sei', coingeckoId: 'sei-network' },
    'TIA': { name: 'Celestia', coingeckoId: 'celestia' },
    'JUP': { name: 'Jupiter', coingeckoId: 'jupiter-exchange-solana' },
    'WIF': { name: 'dogwifhat', coingeckoId: 'dogwifcoin' },
    'BONK': { name: 'Bonk', coingeckoId: 'bonk' },
};

export class TokenDetector {
    /**
     * Detect all token mentions in a tweet
     */
    detectTokens(text: string): DetectedToken[] {
        const tokens: DetectedToken[] = [];
        const seen = new Set<string>();

        // 1. Detect cashtags ($SOL, $BTC)
        const cashtagMatches = text.matchAll(CASHTAG_REGEX);
        for (const match of cashtagMatches) {
            const symbol = match[1].toUpperCase();
            if (!IGNORE_LIST.has(symbol) && !seen.has(symbol)) {
                tokens.push({
                    symbol,
                    type: 'cashtag',
                    raw: match[0],
                });
                seen.add(symbol);
            }
        }

        // 2. Detect EVM contract addresses
        const evmMatches = text.matchAll(EVM_CONTRACT_REGEX);
        for (const match of evmMatches) {
            const address = match[0].toLowerCase();
            if (!seen.has(address)) {
                tokens.push({
                    symbol: address.slice(0, 10) + '...',
                    type: 'contract',
                    chain: 'ethereum',
                    raw: address,
                });
                seen.add(address);
            }
        }

        // 3. Detect phrase patterns (buy SOL, bullish on ETH)
        for (const pattern of PHRASE_PATTERNS) {
            const patternCopy = new RegExp(pattern.source, pattern.flags);
            const matches = text.matchAll(patternCopy);
            for (const match of matches) {
                const symbol = match[1].toUpperCase();
                if (!IGNORE_LIST.has(symbol) && !seen.has(symbol)) {
                    tokens.push({
                        symbol,
                        type: 'phrase',
                        raw: match[0],
                    });
                    seen.add(symbol);
                }
            }
        }

        return tokens;
    }

    /**
     * Check if a symbol is a known major token
     */
    isKnownToken(symbol: string): boolean {
        return symbol.toUpperCase() in KNOWN_TOKENS;
    }

    /**
     * Get token info if it's known
     */
    getKnownToken(symbol: string): { name: string; coingeckoId: string } | null {
        return KNOWN_TOKENS[symbol.toUpperCase()] || null;
    }

    /**
     * Get all known tokens
     */
    getAllKnownTokens(): Record<string, { name: string; coingeckoId: string }> {
        return { ...KNOWN_TOKENS };
    }

    /**
     * Filter out spam/scam tokens (basic heuristics)
     */
    filterSpam(tokens: DetectedToken[]): DetectedToken[] {
        return tokens.filter(token => {
            // Filter out very short or suspicious symbols
            if (token.symbol.length < 2) return false;

            // Filter out tokens with numbers in them (often scams)
            if (/\d/.test(token.symbol) && token.type === 'cashtag') return false;

            return true;
        });
    }

    /**
     * Extract tokens from multiple tweets efficiently
     */
    detectTokensFromTweets(tweets: { text: string; id: string; date?: Date }[]): Map<string, {
        symbol: string;
        mentions: Array<{ tweetId: string; date?: Date; raw: string }>;
        isKnown: boolean;
        coingeckoId?: string;
    }> {
        const tokenMap = new Map<string, {
            symbol: string;
            mentions: Array<{ tweetId: string; date?: Date; raw: string }>;
            isKnown: boolean;
            coingeckoId?: string;
        }>();

        for (const tweet of tweets) {
            const detected = this.detectTokens(tweet.text);
            const filtered = this.filterSpam(detected);

            for (const token of filtered) {
                const existing = tokenMap.get(token.symbol);
                const known = this.getKnownToken(token.symbol);

                if (existing) {
                    existing.mentions.push({
                        tweetId: tweet.id,
                        date: tweet.date,
                        raw: token.raw,
                    });
                } else {
                    tokenMap.set(token.symbol, {
                        symbol: token.symbol,
                        mentions: [{
                            tweetId: tweet.id,
                            date: tweet.date,
                            raw: token.raw,
                        }],
                        isKnown: !!known,
                        coingeckoId: known?.coingeckoId,
                    });
                }
            }
        }

        return tokenMap;
    }
}

// Singleton instance
let tokenDetectorInstance: TokenDetector | null = null;

export function getTokenDetector(): TokenDetector {
    if (!tokenDetectorInstance) {
        tokenDetectorInstance = new TokenDetector();
    }
    return tokenDetectorInstance;
}

export default TokenDetector;
