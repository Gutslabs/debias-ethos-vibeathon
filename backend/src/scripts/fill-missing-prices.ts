/**
 * Fill Missing Prices Script
 * 
 * Reads existing *_calls.json files and fills in missing priceAtCall values
 * by fetching historical prices from CoinGecko.
 */

import fs from 'fs';
import path from 'path';
import { CoinGeckoService } from '../services/historicalPrice.js';

const ANALYSIS_DIR = path.join(process.cwd(), 'data', 'analysis');

async function main() {
    console.log('🔍 Scanning for analysis files with missing prices...\n');

    if (!fs.existsSync(ANALYSIS_DIR)) {
        console.error('❌ Analysis directory not found:', ANALYSIS_DIR);
        process.exit(1);
    }

    const coinGecko = new CoinGeckoService();
    const files = fs.readdirSync(ANALYSIS_DIR).filter(f => f.endsWith('_calls.json'));

    console.log(`📁 Found ${files.length} analysis files\n`);

    let totalFixed = 0;
    let totalSkipped = 0;

    for (const file of files) {
        const filePath = path.join(ANALYSIS_DIR, file);
        console.log(`\n📄 Processing: ${file}`);

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const calls = data.calls || [];
            let fixedInFile = 0;
            let skippedInFile = 0;

            for (let i = 0; i < calls.length; i++) {
                const call = calls[i];

                // Check if priceAtCall is missing or invalid
                if (call.priceAtCall === undefined || call.priceAtCall === null || call.priceAtCall === 0) {
                    console.log(`   [${i + 1}/${calls.length}] Missing price for $${call.ticker} (${call.tweetDate})`);

                    // Parse tweet date
                    const tweetDate = new Date(call.tweetDate);
                    if (isNaN(tweetDate.getTime())) {
                        console.log(`      ⚠️ Invalid date, skipping`);
                        skippedInFile++;
                        continue;
                    }

                    // Fetch historical price
                    const result = await coinGecko.getHistoricalPrice(call.ticker, tweetDate);

                    if (result.success && result.price) {
                        call.priceAtCall = result.price;
                        console.log(`      ✅ Got price: $${result.price.toFixed(6)}`);
                        fixedInFile++;

                        // Also fetch current price if missing
                        if (!call.currentPrice) {
                            // Wait before current price request
                            await new Promise(r => setTimeout(r, 3000));
                            const currentPrice = await coinGecko.getCurrentPrice(call.ticker);
                            if (currentPrice !== null) {
                                call.currentPrice = currentPrice;

                                // Recalculate ROI
                                if (call.priceAtCall > 0) {
                                    call.roiPercent = ((call.currentPrice - call.priceAtCall) / call.priceAtCall) * 100;
                                    call.isSuccessful = call.roiPercent > 0;
                                }
                                console.log(`      📈 Current: $${currentPrice.toFixed(6)}, ROI: ${call.roiPercent?.toFixed(2)}%`);
                            }
                        }

                        // Rate limit delay - 30 req/min = 1 req per 2 sec, but we're safer with 5s
                        await new Promise(r => setTimeout(r, 5000));
                    } else if (result.error?.includes('401')) {
                        // 401 = rate limited or auth issue, wait longer and retry once
                        console.log(`      ⏳ 401 error, waiting 60s and retrying...`);
                        await new Promise(r => setTimeout(r, 60000));

                        const retryResult = await coinGecko.getHistoricalPrice(call.ticker, tweetDate);
                        if (retryResult.success && retryResult.price) {
                            call.priceAtCall = retryResult.price;
                            console.log(`      ✅ Retry success: $${retryResult.price.toFixed(6)}`);
                            fixedInFile++;
                        } else {
                            console.log(`      ❌ Retry failed: ${retryResult.error}`);
                            skippedInFile++;
                        }
                    } else {
                        console.log(`      ❌ Failed: ${result.error}`);
                        skippedInFile++;
                        // Still wait to avoid hammering API
                        await new Promise(r => setTimeout(r, 3000));
                    }
                }
            }

            // Recalculate aggregate stats if we fixed any
            if (fixedInFile > 0) {
                const validCalls = calls.filter((c: any) => c.priceAtCall && c.currentPrice);
                const successfulCalls = validCalls.filter((c: any) => c.roiPercent > 0);

                data.totalCalls = validCalls.length;
                data.successfulCalls = successfulCalls.length;
                data.failedCalls = validCalls.length - successfulCalls.length;
                data.successRate = validCalls.length > 0
                    ? (successfulCalls.length / validCalls.length) * 100
                    : 0;

                const totalRoi = validCalls.reduce((sum: number, c: any) => sum + (c.roiPercent || 0), 0);
                data.totalRoi = totalRoi;
                data.avgRoi = validCalls.length > 0 ? totalRoi / validCalls.length : 0;
                data.hypotheticalPnL = totalRoi;

                // Save updated file
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`\n   💾 Saved! Fixed ${fixedInFile} prices, skipped ${skippedInFile}`);
                console.log(`   📊 New stats: ${data.totalCalls} calls, ${data.successRate.toFixed(1)}% win rate, ${data.avgRoi.toFixed(2)}% avg ROI`);
            } else {
                console.log(`   ℹ️ No missing prices found (or all failed)`);
            }

            totalFixed += fixedInFile;
            totalSkipped += skippedInFile;

        } catch (error) {
            console.error(`   ❌ Error processing ${file}:`, error);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Done! Fixed ${totalFixed} prices, skipped ${totalSkipped}`);
}

main().catch(console.error);
