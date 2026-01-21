/**
 * Analysis Service
 * Main pipeline: Process tweets → Detect calls → Lookup prices → Calculate ROI
 */

import fs from 'fs';
import path from 'path';
import { CallDetector, CallDetectionResult, TweetInput, getCallDetector } from './callDetector.js';
import { DexScreenerService, getDexScreenerService, DexPair } from './dexScreener.js';
import { CoinGeckoService, getHistoricalPriceService, TICKER_TO_COINGECKO } from './historicalPrice.js';
import { isTop100Ticker, normalizeTicker, filterTop100Tickers } from './top100Filter.js';

export interface CallAnalysis {
    tweetId: string;
    tweetText: string;
    tweetDate: string;
    username: string;
    ticker: string;
    chain: string;
    tokenAddress?: string;
    priceAtCall?: number;
    currentPrice?: number;
    roiPercent?: number;
    isSuccessful?: boolean;
    aiConfidence: number;
    aiReasoning?: string;
    chartData?: number[]; // Array of prices for the chart
}

export interface InfluencerStats {
    username: string;
    totalTweets: number;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    successRate: number;
    totalRoi: number;
    avgRoi: number;
    hypotheticalPnL: number; // If $100 per call
    calls: CallAnalysis[];
}

export class AnalysisService {
    private callDetector: CallDetector;
    private dexService: DexScreenerService;
    private historicalPrice: CoinGeckoService;
    private defaultChain: string;

    constructor(preferredChain: string = 'solana') {
        this.callDetector = getCallDetector();
        this.dexService = getDexScreenerService();
        this.historicalPrice = getHistoricalPriceService();
        this.defaultChain = preferredChain;
    }

    /**
     * Normalize ticker (JUPITER -> JUP, etc.)
     */
    private normalizeTicker(ticker: string): string {
        const clean = ticker.replace(/^\$/, '').toUpperCase();
        // Check if we have a mapping
        if (TICKER_TO_COINGECKO[clean]) {
            // Return the ticker that maps to the same coingecko ID
            return clean;
        }
        return clean;
    }

    /**
     * Analyze all tweets from a JSON file
     */
    async analyzeFromFile(filePath: string): Promise<InfluencerStats> {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const tweets: TweetInput[] = data.tweets.map((t: any) => ({
            id: t.id,
            text: t.text,
            created_at: t.created_at,
            username: t.username || data.username
        }));

        return this.analyzeTweets(tweets, data.username);
    }

    /**
     * Analyze tweets and generate stats
     */
    async analyzeTweets(tweets: TweetInput[], username: string): Promise<InfluencerStats> {
        console.log(`\n🔍 Analyzing ${tweets.length} tweets from @${username}...`);
        console.log(`📦 Using batch processing (20 tweets per API call)`);

        // Step 1: Analyze ALL tweets using batch processing (no pre-filter)
        const detectionResults = await this.callDetector.analyzeAllTweets(tweets, 20, (processed, total) => {
            console.log(`   Progress: ${processed}/${total} tweets`);
        });

        // Step 2: Process detected calls
        const calls: CallAnalysis[] = [];
        let callCount = 0;

        for (const tweet of tweets) {
            const detection = detectionResults.get(tweet.id);

            if (detection && detection.isCall && detection.tickers.length > 0) {
                // Filter to only top 100 coins
                const top100Tickers = filterTop100Tickers(detection.tickers);

                if (top100Tickers.length === 0) {
                    // Skip if no top 100 coins found
                    continue;
                }

                callCount++;
                console.log(`\n✅ Call #${callCount}: ${top100Tickers.join(', ')} (${detection.confidence}%)`);
                console.log(`   "${tweet.text.substring(0, 80)}..."`);

                // Process each top 100 ticker
                for (const ticker of top100Tickers) {
                    const normalizedTicker = normalizeTicker(ticker);
                    const analysis = await this.analyzeCall(tweet, normalizedTicker, detection);
                    calls.push(analysis);
                }
            }
        }

        // Step 3: Calculate stats
        const stats = this.calculateStats(username, tweets.length, calls);

        console.log(`\n📊 Analysis complete!`);
        console.log(`   Total calls: ${stats.totalCalls}`);
        console.log(`   Success rate: ${stats.successRate.toFixed(1)}%`);
        console.log(`   Hypothetical PnL: $${stats.hypotheticalPnL.toFixed(2)} (if $100/call)`);

        return stats;
    }

    /**
     * Analyze a single call - lookup price and calculate ROI
     */
    private async analyzeCall(tweet: TweetInput, ticker: string, detection: CallDetectionResult): Promise<CallAnalysis> {
        // Normalize ticker (JUPITER -> JUP)
        const normalizedTicker = this.normalizeTicker(ticker);

        const analysis: CallAnalysis = {
            tweetId: tweet.id,
            tweetText: tweet.text,
            tweetDate: tweet.created_at,
            username: tweet.username,
            ticker: normalizedTicker,
            chain: this.defaultChain,
            aiConfidence: detection.confidence,
            aiReasoning: detection.reasoning
        };

        // Parse tweet date
        const tweetDate = this.historicalPrice.parseTweetDate(tweet.created_at);

        // Get both historical and current price from CoinGecko
        const priceResult = await this.historicalPrice.getPriceComparison(normalizedTicker, tweetDate);

        if (priceResult.success && priceResult.price) {
            analysis.priceAtCall = priceResult.price;
            console.log(`    📅 Historical: $${priceResult.price.toFixed(6)} on ${priceResult.date}`);

            if (priceResult.currentPrice) {
                analysis.currentPrice = priceResult.currentPrice;

                // Calculate ROI
                analysis.roiPercent = ((analysis.currentPrice - analysis.priceAtCall) / analysis.priceAtCall) * 100;
                analysis.isSuccessful = analysis.roiPercent > 0;

                console.log(`    📈 Current: $${analysis.currentPrice.toFixed(6)} | ROI: ${analysis.roiPercent.toFixed(2)}%`);

                // Fetch chart data (sparkline)
                try {
                    const now = new Date();
                    const chartData = await this.historicalPrice.getHistoricalChart(normalizedTicker, tweetDate, now);
                    if (chartData.length > 0) {
                        analysis.chartData = chartData;
                        console.log(`    📊 Chart data: ${chartData.length} points`);
                    }
                } catch (e) {
                    console.error('    ⚠️  Failed to fetch chart data');
                }
            } else {
                console.log(`    ⚠️  No current price found for ${normalizedTicker}`);
            }
        } else {
            console.log(`    ⚠️  ${normalizedTicker}: Price data not found (${priceResult.error || 'Unknown error'})`);
        }

        // Rate limit for CoinGecko (free tier: 10-30 req/min)
        await new Promise(r => setTimeout(r, 2000));

        return analysis;
    }

    /**
     * Calculate aggregate stats
     */
    private calculateStats(username: string, totalTweets: number, calls: CallAnalysis[]): InfluencerStats {
        const validCalls = calls.filter(c => c.roiPercent !== undefined);
        const successfulCalls = validCalls.filter(c => c.isSuccessful === true);
        const failedCalls = validCalls.filter(c => c.isSuccessful === false);

        const totalRoi = validCalls.reduce((sum, c) => sum + (c.roiPercent || 0), 0);
        const avgRoi = validCalls.length > 0 ? totalRoi / validCalls.length : 0;

        // Hypothetical PnL: $100 per call
        const investmentPerCall = 100;
        const hypotheticalPnL = validCalls.reduce((sum, c) => {
            const roi = c.roiPercent || 0;
            return sum + (investmentPerCall * roi / 100);
        }, 0);

        return {
            username,
            totalTweets,
            totalCalls: calls.length,
            successfulCalls: successfulCalls.length,
            failedCalls: failedCalls.length,
            successRate: calls.length > 0 ? (successfulCalls.length / validCalls.length) * 100 : 0,
            totalRoi,
            avgRoi,
            hypotheticalPnL,
            calls
        };
    }

    /**
     * Save analysis results to file
     */
    saveResults(stats: InfluencerStats, outputPath: string): void {
        fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
        console.log(`\n💾 Results saved to ${outputPath}`);
    }
}

// Singleton
let analysisServiceInstance: AnalysisService | null = null;

export function getAnalysisService(chain?: string): AnalysisService {
    if (!analysisServiceInstance) {
        analysisServiceInstance = new AnalysisService(chain);
    }
    return analysisServiceInstance;
}

export default AnalysisService;
