/**
 * Full Pipeline: Fetch tweets → Analyze calls → Save results
 * Usage: npx tsx src/scripts/analyze-user.ts <username>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { AnalysisService } from '../services/analysisService.js';
import dotenv from 'dotenv';

dotenv.config();

interface RawTweet {
    id: string;
    text: string;
    created_at: string;
    username: string;
    name?: string;
    retweets: number;
    likes: number;
    replies: number;
    views: number;
}

async function fetchTweets(username: string, count: number = 100): Promise<RawTweet[]> {
    console.log(`\n📥 Fetching tweets for @${username}...`);

    const scriptPath = path.join(process.cwd(), 'src/scripts/working_search.cjs');

    try {
        const output = execSync(`node ${scriptPath} ${username} ${count} --json`, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024,
        });

        const result = JSON.parse(output);

        if (result.success && Array.isArray(result.tweets)) {
            console.log(`✅ Fetched ${result.tweets.length} tweets`);
            return result.tweets;
        } else {
            console.error('❌ Tweet fetch failed:', result.error);
            return [];
        }
    } catch (error) {
        console.error('❌ Error executing tweet fetch:', error);
        return [];
    }
}

async function analyzeUser(username: string, preferredChain: string = 'solana') {
    console.log('\n🚀 Full Pipeline: Tweet Analysis');
    console.log('='.repeat(50));

    // Step 1: Fetch tweets
    const rawTweets = await fetchTweets(username, 100);

    if (rawTweets.length === 0) {
        console.error('❌ No tweets fetched, aborting...');
        return null;
    }

    // Step 2: Save raw tweets
    const tweetsDir = path.join(process.cwd(), 'data', 'tweets');
    if (!fs.existsSync(tweetsDir)) {
        fs.mkdirSync(tweetsDir, { recursive: true });
    }

    const tweetsFile = path.join(tweetsDir, `${username}_tweets.json`);
    fs.writeFileSync(tweetsFile, JSON.stringify({
        username,
        fetched_at: new Date().toISOString(),
        count: rawTweets.length,
        tweets: rawTweets
    }, null, 2));
    console.log(`💾 Saved raw tweets to ${tweetsFile}`);

    // Step 3: Format tweets for analysis (match TweetInput interface)
    const formattedTweets = rawTweets.map(t => ({
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        createdAt: t.created_at,
        username: t.username,
        author: { username: t.username },
        retweets: t.retweets,
        likes: t.likes,
    }));

    // Step 4: Run AI analysis
    console.log('\n🤖 Running AI call analysis...');
    const analyzer = new AnalysisService(preferredChain);
    const stats = await analyzer.analyzeTweets(formattedTweets, username);

    // Step 5: Save analysis results
    const analysisDir = path.join(process.cwd(), 'data', 'analysis');
    if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, { recursive: true });
    }

    const outputData = {
        ...stats,
        analyzed_at: new Date().toISOString(),
        tweet_count: rawTweets.length,
    };

    const analysisFile = path.join(analysisDir, `${username}_calls.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(outputData, null, 2));
    console.log(`💾 Saved analysis to ${analysisFile}`);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(50));
    console.log(`Influencer: @${stats.username}`);
    console.log(`Tweets Analyzed: ${stats.totalTweets}`);
    console.log(`Calls Detected: ${stats.totalCalls}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Avg ROI: ${stats.avgRoi.toFixed(2)}%`);

    if (stats.calls.length > 0) {
        console.log(`\n🏆 Top Calls:`);
        stats.calls
            .filter(c => c.roiPercent !== undefined)
            .sort((a, b) => (b.roiPercent || 0) - (a.roiPercent || 0))
            .slice(0, 5)
            .forEach((call, i) => {
                console.log(`  ${i + 1}. $${call.ticker}: ${call.roiPercent?.toFixed(1)}% ROI (${call.tweetDate})`);
            });
    }

    return stats;
}

// CLI Entry
const username = process.argv[2]?.replace('@', '') || 'icobeast';
const chain = process.argv[3] || 'solana';

analyzeUser(username, chain).then(() => {
    console.log('\n✅ Pipeline complete!');
}).catch(error => {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
});
