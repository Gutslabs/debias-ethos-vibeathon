/**
 * AI Call Detector Service using Vercel AI SDK with xAI Grok
 * Supports batch processing for cost efficiency
 */

import { generateText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import dotenv from 'dotenv';
dotenv.config();

export type CallType = 'spot_buy' | 'long' | 'ico_presale' | 'airdrop_farming' | 'commentary' | 'tax_strategy' | 'other';

export interface CallDetectionResult {
    isCall: boolean;
    callType: CallType;
    confidence: number;
    tickers: string[];
    sentiment: 'bullish' | 'bearish' | 'neutral';
    reasoning?: string;
}

export interface TweetInput {
    id: string;
    text: string;
    created_at: string;
    username: string;
}

interface BatchTweetResult {
    tweet_id: string;
    isCall: boolean;
    callType: CallType;
    confidence: number;
    tickers: string[];
    sentiment: 'bullish' | 'bearish' | 'neutral';
    reasoning?: string;
}

const SYSTEM_PROMPT = `You are a strict crypto trade analyzer. Your job is to detect ACTIVE TRADING CALLS for tokens that are already liquid and trading on exchanges.

Your goal is to filter out noise and only find clear "Buy Spot" or "Long" signals.

CRITICAL RULES FOR "isCall":
1. TARGET MUST BE TRADING: The token must be currently tradeable.
   - IGNORE ICOs, Presales, Whitelists, "TGE coming soon".
   - IGNORE Airdrop farming, "Opting in", "Claims", or "Points" programs.
   - IGNORE "Solstice flares", "Yield farming" strategies unless it's a direct buy of the underlying asset.

2. IGNORE HEDGING/TAXES:
   - IGNORE "Tax loss harvesting" (selling to buy back).
   - IGNORE "Delta neutral" strategies.

3. CLEAR INTENT:
   - Must be a recommendation to BUY or LONG an asset for profit.
   - "Bullish on the tech" without a trading angle is NOT a call.

Valid Call Examples:
- "Loading up more $SOL here." → callType: spot_buy
- "$ETH looking ready to breakout, long targeting 4k." → callType: long
- "Aping into $PEPE." → callType: spot_buy

Invalid Call Examples:
- "Solstice ICO is live, get your flares." → callType: ico_presale, isCall: false
- "Harvested my losses on MET." → callType: tax_strategy, isCall: false
- "Farming points on Jupiter." → callType: airdrop_farming, isCall: false
- "ETH tech is improving" → callType: commentary, isCall: false

For each tweet, respond with a JSON object.`;

const BATCH_PROMPT_TEMPLATE = `Analyze these tweets for crypto calls. For EACH tweet, determine if it's a REAL trading call.

IMPORTANT: "isCall" should be TRUE only if callType is 'spot_buy' or 'long'.
All other callTypes (ico_presale, airdrop_farming, tax_strategy, commentary, other) should have isCall: false.

Return a JSON array with one object per tweet in this exact format:
[
  {
    "tweet_id": "ID_FROM_TWEET",
    "isCall": true/false,
    "callType": "spot_buy/long/ico_presale/airdrop_farming/commentary/tax_strategy/other",
    "confidence": 0-100,
    "tickers": ["TICKER1"],
    "sentiment": "bullish/bearish/neutral",
    "reasoning": "First think step-by-step why this fits the category, then conclude."
  }
]

TWEETS TO ANALYZE:
`;

export class CallDetector {
    private xai: ReturnType<typeof createXai>;
    private model: string = 'grok-4-1-fast-non-reasoning';

    constructor() {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
            throw new Error('XAI_API_KEY not found in environment');
        }

        this.xai = createXai({ apiKey });
        console.log(`[CallDetector] Initialized with Grok model: ${this.model}`);
    }

    /**
     * Analyze a batch of tweets (up to 20) in a single API call
     */
    async analyzeBatch(tweets: TweetInput[]): Promise<Map<string, CallDetectionResult>> {
        const results = new Map<string, CallDetectionResult>();

        // Format tweets for batch analysis
        const tweetsText = tweets.map((t, i) =>
            `[Tweet ${i + 1}] ID: ${t.id}\n@${t.username} (${t.created_at}):\n"${t.text}"\n`
        ).join('\n---\n');

        const prompt = BATCH_PROMPT_TEMPLATE + tweetsText;

        try {
            const result = await generateText({
                model: this.xai(this.model),
                system: SYSTEM_PROMPT,
                prompt: prompt,
                temperature: 0.3,
                maxOutputTokens: 2000
            });

            const content = result.text || '';

            // Parse JSON array response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                // Sanitize JSON - replace single quotes with double quotes for string values
                let jsonStr = jsonMatch[0];
                // Fix common Grok JSON issues: single quotes in string values
                jsonStr = jsonStr.replace(/'([^']*)'(?=\s*[:,\]\}])/g, '"$1"');

                const batchResults: BatchTweetResult[] = JSON.parse(jsonStr);

                for (const item of batchResults) {
                    // Ensure isCall is only true for spot_buy or long
                    const validCallTypes: CallType[] = ['spot_buy', 'long'];
                    const isValidCall = validCallTypes.includes(item.callType) && item.isCall;

                    results.set(item.tweet_id, {
                        isCall: isValidCall,
                        callType: item.callType ?? 'other',
                        confidence: item.confidence ?? 0,
                        tickers: item.tickers ?? [],
                        sentiment: item.sentiment ?? 'neutral',
                        reasoning: item.reasoning
                    });
                }
            }

            // Fill in any missing tweets with defaults
            for (const tweet of tweets) {
                if (!results.has(tweet.id)) {
                    results.set(tweet.id, {
                        isCall: false,
                        callType: 'other',
                        confidence: 0,
                        tickers: [],
                        sentiment: 'neutral'
                    });
                }
            }

        } catch (error) {
            console.error(`[CallDetector] Batch error:`, error);
            // Return empty results for all tweets
            for (const tweet of tweets) {
                results.set(tweet.id, {
                    isCall: false,
                    callType: 'other',
                    confidence: 0,
                    tickers: [],
                    sentiment: 'neutral'
                });
            }
        }

        return results;
    }

    /**
     * Analyze all tweets in batches of specified size
     */
    async analyzeAllTweets(tweets: TweetInput[], batchSize: number = 20, onProgress?: (processed: number, total: number) => void): Promise<Map<string, CallDetectionResult>> {
        const allResults = new Map<string, CallDetectionResult>();

        for (let i = 0; i < tweets.length; i += batchSize) {
            const batch = tweets.slice(i, i + batchSize);
            console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tweets.length / batchSize)} (${batch.length} tweets)...`);

            const batchResults = await this.analyzeBatch(batch);

            // Merge results
            for (const [id, result] of batchResults) {
                allResults.set(id, result);
            }

            // Report progress
            const processed = Math.min(i + batchSize, tweets.length);
            if (onProgress) {
                onProgress(processed, tweets.length);
            }

            // Count calls in this batch
            const callsInBatch = Array.from(batchResults.values()).filter(r => r.isCall).length;
            console.log(`   ✅ Found ${callsInBatch} valid calls in this batch`);

            // Rate limiting between batches (1 second)
            if (i + batchSize < tweets.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        return allResults;
    }

    /**
     * Analyze a single tweet (kept for compatibility)
     */
    async analyzeTweet(tweet: TweetInput): Promise<CallDetectionResult> {
        const results = await this.analyzeBatch([tweet]);
        return results.get(tweet.id) || {
            isCall: false,
            callType: 'other',
            confidence: 0,
            tickers: [],
            sentiment: 'neutral'
        };
    }
}

// Singleton
let callDetectorInstance: CallDetector | null = null;

export function getCallDetector(): CallDetector {
    if (!callDetectorInstance) {
        callDetectorInstance = new CallDetector();
    }
    return callDetectorInstance;
}

export default CallDetector;
