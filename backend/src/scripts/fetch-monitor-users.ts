/**
 * Fetch and analyze list of monitored users
 * Usage: npx tsx src/scripts/fetch-monitor-users.ts
 */

import { execSync } from 'child_process';
import path from 'path';

const MONITORED_USERS = [
    // 'CryptoKaleo', // Running separately
    // 'icobeast',    // Running separately
    'blknoiz06', // Ansem
    'HsakaTrades',
    'TheFlowHorse',
    'Pentosh1',
    'Cobie',
    'trader1sz',
    'SecretsOfCrypto',
    'DegenSpartan'
];

async function main() {
    console.log('🚀 Starting batch fetch & analysis for monitored users...');
    console.log(`📋 Users: ${MONITORED_USERS.join(', ')}\n`);

    for (const username of MONITORED_USERS) {
        try {
            console.log(`\n==================================================`);
            console.log(`👤 Processing @${username}...`);
            console.log(`==================================================`);

            // Step 1: Fetch tweets
            // Limit to 200 tweets for speed, or partial fetch
            console.log(`📥 Fetching tweets...`);
            try {
                // Use the helper script directly
                execSync(`node src/scripts/twitter_helper.cjs fullTimeline ${username} 200`, {
                    stdio: 'inherit',
                    cwd: process.cwd()
                });
            } catch (e) {
                console.error(`❌ Failed to fetch tweets for ${username}. Continuing...`);
                continue;
            }

            // Step 2: Analyze tweets
            console.log(`\n🤖 Analyzing tweets...`);
            try {
                execSync(`npx tsx src/scripts/analyze-calls.ts ${username}`, {
                    stdio: 'inherit',
                    cwd: process.cwd(),
                    env: { ...process.env } // Pass env vars (API keys)
                });
            } catch (e) {
                console.error(`❌ Analysis failed for ${username}. Continuing...`);
                continue;
            }

            console.log(`✅ Completed @${username}`);

        } catch (error) {
            console.error(`⚠️  Unexpected error processing ${username}:`, error);
        }
    }

    console.log('\n✨ Batch processing complete!');
}

main();
