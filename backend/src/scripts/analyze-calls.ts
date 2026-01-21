/**
 * Analyze crypto calls from tweets
 * Usage: npx tsx src/scripts/analyze-calls.ts [username]
 * Example: npx tsx src/scripts/analyze-calls.ts CryptoKaleo
 */

import path from 'path';
import fs from 'fs';
import { AnalysisService } from '../services/analysisService.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    // Get username from args or default to icobeast
    const username = process.argv[2] || 'icobeast';
    const tweetsFile = path.join(process.cwd(), `${username}tweets.json`);
    const outputDir = path.join(process.cwd(), 'data', 'analysis');
    const outputFile = path.join(outputDir, `${username}_calls.json`);

    console.log('🚀 Crypto Call Analyzer');
    console.log('========================\n');
    console.log(`📁 Input: ${tweetsFile}`);
    console.log(`📁 Output: ${outputFile}\n`);

    if (!fs.existsSync(tweetsFile)) {
        console.error(`❌ File not found: ${tweetsFile}`);
        process.exit(1);
    }

    // Create output dir
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const analyzer = new AnalysisService('solana');

    try {
        const stats = await analyzer.analyzeFromFile(tweetsFile);
        analyzer.saveResults(stats, outputFile);

        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 FINAL RESULTS');
        console.log('='.repeat(50));
        console.log(`\nInfluencer: @${stats.username}`);
        console.log(`Total Tweets Analyzed: ${stats.totalTweets}`);
        console.log(`Calls Detected: ${stats.totalCalls}`);
        console.log(`\n💹 Performance:`);
        console.log(`   Successful: ${stats.successfulCalls} (${stats.successRate.toFixed(1)}%)`);
        console.log(`   Failed: ${stats.failedCalls}`);
        console.log(`   Avg ROI: ${stats.avgRoi.toFixed(2)}%`);
        console.log(`\n💰 Hypothetical PnL (if $100 per call):`);
        console.log(`   ${stats.hypotheticalPnL >= 0 ? '✅ Profit' : '❌ Loss'}: $${Math.abs(stats.hypotheticalPnL).toFixed(2)}`);

        // Top calls
        const topCalls = stats.calls
            .filter(c => c.roiPercent !== undefined)
            .sort((a, b) => (b.roiPercent || 0) - (a.roiPercent || 0))
            .slice(0, 5);

        if (topCalls.length > 0) {
            console.log(`\n🏆 Top 5 Calls:`);
            topCalls.forEach((call, i) => {
                console.log(`   ${i + 1}. $${call.ticker}: ${call.roiPercent?.toFixed(1)}% ROI`);
            });
        }

        console.log(`\n✅ Results saved to: ${outputFile}`);

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    }
}

main();
