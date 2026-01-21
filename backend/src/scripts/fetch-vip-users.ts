
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://api.ethos.network/api/v2';
const HEADERS = {
    'X-Ethos-Client': 'debias-app',
    'Content-Type': 'application/json'
};

const VIP_USERNAMES = [
    'CryptoKaleo',
    'Tradermayne',
    'CryptoCred',
    'HsakaTrades',
    'RookieXBT'
];

async function fetchUserByQuery(query: string): Promise<any> {
    const url = `${BASE_URL}/users/search?query=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) return null;
    const data = await response.json();
    return data.values && data.values.length > 0 ? data.values[0] : null;
}

async function main() {
    console.log('🔍 Fetching VIP users from Ethos...');

    const vipUsers = [];

    for (const username of VIP_USERNAMES) {
        console.log(`   Fetching ${username}...`);
        // Try searching by username directly
        const user = await fetchUserByQuery(username);

        if (user) {
            console.log(`   ✅ Found ${username} (Score: ${user.score})`);
            vipUsers.push(user);
        } else {
            console.error(`   ❌ Could not find ${username}`);
        }

        await new Promise(r => setTimeout(r, 500));
    }

    // Load existing leaderboard to merge or just create a separate file?
    // User wants these into the leaderboard. 
    // Let's create a dedicated vip_users.json that the API can merge.

    const outputDir = path.join(process.cwd(), 'data', 'ethos');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = path.join(outputDir, 'vip_users.json');
    fs.writeFileSync(filename, JSON.stringify({
        fetched_at: new Date().toISOString(),
        users: vipUsers
    }, null, 2));

    console.log(`\n✅ Saved ${vipUsers.length} VIP users to ${filename}`);
}

main();
