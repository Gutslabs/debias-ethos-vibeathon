/**
 * Fetch top 100 Ethos users by score for leaderboard
 * Uses multiple search queries and sorts by score
 * Usage: npx tsx src/scripts/fetch-ethos-leaderboard.ts
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://api.ethos.network/api/v2';
const HEADERS = {
    'X-Ethos-Client': 'debias-app',
    'Content-Type': 'application/json'
};

interface EthosUser {
    id: number;
    profileId: number | null;
    displayName: string;
    username: string;
    avatarUrl: string;
    score: number;
    status: string;
    xpTotal: number;
    influenceFactor: number;
    influenceFactorPercentile?: number;
    links: {
        profile: string;
        scoreBreakdown: string;
    };
    stats: {
        review: {
            received: {
                negative: number;
                neutral: number;
                positive: number;
            }
        };
        vouch: {
            given: { count: number; amountWeiTotal?: string };
            received: { count: number; amountWeiTotal?: string };
        };
    };
}

async function fetchUsersPage(query: string, offset: number = 0): Promise<{ users: EthosUser[]; total: number }> {
    const url = `${BASE_URL}/users/search?query=${encodeURIComponent(query)}&limit=50&offset=${offset}`;

    const response = await fetch(url, { headers: HEADERS });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        users: data.values || [],
        total: data.total || 0
    };
}

async function fetchTopUsers(targetCount: number = 100): Promise<EthosUser[]> {
    console.log('🔍 Fetching top Ethos users by score...\n');

    const allUsers: Map<number, EthosUser> = new Map();

    // Blocklist: Projects, protocols, blockchains - not individual traders
    const BLOCKED_USERNAMES = new Set([
        // Blockchains & L1s
        'solana', 'ethereum', 'bitcoin', 'polygon', 'avalanche', 'cosmos',
        'near', 'fantom', 'arbitrum', 'optimism', 'base', 'linea', 'scroll',
        // DeFi Protocols
        'uniswap', 'aave', 'compound', 'maker', 'curve', 'sushiswap',
        'pancakeswap', 'balancer', 'yearn', 'convex', 'lido', 'rocket_pool',
        'gmx', 'dydx', 'synthetix', '1inch', 'paraswap', 'jupiter',
        // Data/Analytics Platforms  
        'defillama', 'debank', 'debankdefi', 'dune', 'nansen', 'glassnode',
        'messari', 'tokenterminal', 'coingecko', 'coinmarketcap',
        // NFT Projects
        'cryptopunks', 'boredapeyc', 'bayc', 'azuki', 'doodles', 'moonbirds',
        'pudgypenguins', 'cryptokitties', 'artblocks', 'opensea',
        // Wallets & Infra
        'metamask', 'rainbow', 'phantom', 'rabby', 'zerion', 'zapper',
        'etherscan', 'polygonscan', 'arbiscan', 'basescan',
        // Exchanges
        'binance', 'coinbase', 'kraken', 'okx', 'bybit', 'kucoin',
        // Other known projects
        'chainlink', 'thegraph', 'ens', 'unstoppabledomains',
        'gitcoin', 'safe', 'gnosis', 'snapshot', 'tally',
    ]);

    // Check if username looks like a project (not a person)
    function isLikelyProject(user: EthosUser): boolean {
        const username = user.username.toLowerCase();
        const displayName = user.displayName.toLowerCase();

        // Check blocklist
        if (BLOCKED_USERNAMES.has(username)) return true;

        // Check for common project patterns
        if (displayName.includes('protocol') ||
            displayName.includes('network') ||
            displayName.includes('foundation') ||
            displayName.includes('labs') ||
            displayName.includes('official')) return true;

        return false;
    }

    // Search specifically for 'trader'
    const queries = ['trader'];

    for (const query of queries) {
        console.log(`📋 Searching: "${query}"...`);
        let offset = 0;
        let consecutiveEmpty = 0;

        while (consecutiveEmpty < 2) {
            try {
                const { users, total } = await fetchUsersPage(query, offset);

                if (users.length === 0) {
                    consecutiveEmpty++;
                    break;
                }
                consecutiveEmpty = 0;

                // Add unique users with score > 100, excluding projects
                for (const user of users) {
                    if (!allUsers.has(user.id) && user.score >= 100 && !isLikelyProject(user)) {
                        allUsers.set(user.id, user);
                    }
                }

                console.log(`   Offset ${offset}: Found ${users.length} users (total unique: ${allUsers.size})`);

                offset += 50;
                await new Promise(r => setTimeout(r, 300));
                if (offset >= total || offset >= 1000) break; // Fetch up to 1000

            } catch (error) {
                console.error(`   Error at offset ${offset}:`, error);
                break;
            }
        }
    }

    // Sort by score descending and return valid ones
    const sorted = Array.from(allUsers.values()).sort((a, b) => b.score - a.score);
    console.log(`\n📊 Total unique traders found: ${sorted.length}`);

    return sorted;
}

function formatVouchAmount(weiStr?: string): string {
    if (!weiStr) return '$0';
    const wei = BigInt(weiStr);
    const eth = Number(wei) / 1e18;
    const usd = eth * 3000;
    if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}K`;
    return `$${usd.toFixed(0)}`;
}

async function main() {
    try {
        const users = await fetchTopUsers(500); // Get up to 500 traders

        // Format for output
        const outputData = {
            fetched_at: new Date().toISOString(),
            total_users: users.length,
            users: users.map((user, index) => ({
                rank: index + 1,
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                score: user.score,
                avatarUrl: user.avatarUrl,
                xpTotal: user.xpTotal,
                influenceFactor: user.influenceFactor,
                profileUrl: user.links?.profile
            }))
        };

        const outputDir = path.join(process.cwd(), 'data', 'ethos');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filename = path.join(outputDir, 'traders.json');
        fs.writeFileSync(filename, JSON.stringify(outputData, null, 2));

        console.log(`\n✅ Saved ${users.length} users to ${filename}`);
        console.log(`\n🏆 Top 10 by score:`);
        users.slice(0, 10).forEach((user, i) => {
            const reviews = user.stats?.review?.received;
            const positive = reviews?.positive || 0;
            const total = positive + (reviews?.negative || 0);
            const posPercent = total > 0 ? Math.round((positive / total) * 100) : 0;
            console.log(`   ${i + 1}. @${user.username}: ${user.score} points (${posPercent}% positive, ${total} reviews)`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
