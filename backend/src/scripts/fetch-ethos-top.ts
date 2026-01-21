/**
 * Fetch top 500 Ethos users by score and save to JSON
 * Usage: npx tsx src/scripts/fetch-ethos-top.ts
 */

import fs from 'fs';

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
            given: { count: number };
            received: { count: number };
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

async function fetchTopUsers(maxUsers: number = 500): Promise<EthosUser[]> {
    console.log('🔍 Fetching top Ethos users...\n');

    const allUsers: EthosUser[] = [];
    const queries = ['crypto', 'eth', 'sol', 'defi', 'nft', 'web3'];
    const seenIds = new Set<number>();

    for (const query of queries) {
        if (allUsers.length >= maxUsers) break;

        console.log(`📋 Searching: "${query}"...`);
        let offset = 0;

        while (allUsers.length < maxUsers) {
            try {
                const { users, total } = await fetchUsersPage(query, offset);

                if (users.length === 0) break;

                // Add unique users, sorted by score
                for (const user of users) {
                    if (!seenIds.has(user.id) && user.score > 0) {
                        seenIds.add(user.id);
                        allUsers.push(user);
                    }
                }

                console.log(`   Offset ${offset}: Found ${users.length} users (total unique: ${allUsers.length})`);

                offset += 50;

                // Rate limiting
                await new Promise(r => setTimeout(r, 500));

                if (offset >= total) break;

            } catch (error) {
                console.error(`   Error at offset ${offset}:`, error);
                break;
            }
        }
    }

    // Sort by score descending and take top N
    allUsers.sort((a, b) => b.score - a.score);
    return allUsers.slice(0, maxUsers);
}

async function main() {
    try {
        const users = await fetchTopUsers(500);

        // Format for output
        const outputData = {
            fetched_at: new Date().toISOString(),
            total_users: users.length,
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                score: user.score,
                avatarUrl: user.avatarUrl,
                xpTotal: user.xpTotal,
                influenceFactor: user.influenceFactor,
                positiveReviews: user.stats?.review?.received?.positive || 0,
                negativeReviews: user.stats?.review?.received?.negative || 0,
                profileUrl: user.links?.profile
            }))
        };

        const filename = 'ethos_top_500.json';
        fs.writeFileSync(filename, JSON.stringify(outputData, null, 2));

        console.log(`\n✅ Saved ${users.length} users to ${filename}`);
        console.log(`\n🏆 Top 10 by score:`);
        users.slice(0, 10).forEach((user, i) => {
            console.log(`   ${i + 1}. @${user.username}: ${user.score} points`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
