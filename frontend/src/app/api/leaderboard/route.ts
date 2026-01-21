import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // For Vercel deployment, data is in frontend/src/data
        const dataDir = path.join(process.cwd(), 'src', 'data');
        const leaderboardPath = path.join(dataDir, 'ethos', 'leaderboard.json');
        const vipPath = path.join(dataDir, 'ethos', 'vip_users.json');
        const analysisDir = path.join(dataDir, 'analysis');

        if (!fs.existsSync(leaderboardPath)) {
            return NextResponse.json(
                { error: 'Leaderboard data not found' },
                { status: 404 }
            );
        }

        const data = JSON.parse(fs.readFileSync(leaderboardPath, 'utf-8'));
        let vipUsers: any[] = [];

        if (fs.existsSync(vipPath)) {
            try {
                const vipData = JSON.parse(fs.readFileSync(vipPath, 'utf-8'));
                vipUsers = vipData.users || [];
            } catch (e) {
                console.error('Failed to parse VIP users', e);
            }
        }

        // Read available analysis files
        const analysisMap = new Map();
        if (fs.existsSync(analysisDir)) {
            const files = fs.readdirSync(analysisDir).filter(f => f.endsWith('_calls.json'));
            for (const file of files) {
                try {
                    const content = JSON.parse(fs.readFileSync(path.join(analysisDir, file), 'utf-8'));
                    if (content.username) {
                        console.log(`[API] Loaded analysis for: ${content.username.toLowerCase()}`);
                        analysisMap.set(content.username.toLowerCase(), content);
                    }
                } catch (e) {
                    console.error(`Failed to parse analysis file ${file}`, e);
                }
            }
        }

        // Merge VIPs into the main list if not present, or prioritize them
        const vipUsernames = new Set(vipUsers.map(u => u.username.toLowerCase()));

        // Filter out VIPs from regular list to avoid duplicates
        const regularUsers = data.users.filter((u: any) => !vipUsernames.has(u.username.toLowerCase()));

        // Combine VIPs + Regulars
        const allRawUsers = [...vipUsers, ...regularUsers];

        // Enrich and sort users
        const enrichedUsers = allRawUsers.map((user: any) => {
            const lowerUsername = user.username.toLowerCase();
            const realData = analysisMap.get(lowerUsername);
            const isVip = vipUsernames.has(lowerUsername);

            if (lowerUsername === 'cryptokaleo') {
                console.log(`[API] Processing CryptoKaleo. Found realData?`, !!realData, realData ? realData.avgRoi : 'N/A');
                if (realData) console.log('[API] RealData keys:', Object.keys(realData));
            }

            if (realData) {
                // Ensure we don't inherit conflicting stats like avgGain from the raw user object
                const { avgGain, ...cleanUser } = user;
                return {
                    ...cleanUser,
                    isRealData: true, // Has analysis
                    isVip: isVip,
                    successRate: realData.successRate,
                    totalCalls: realData.totalCalls,
                    avgRoi: realData.avgRoi,
                    totalRoi: realData.totalRoi,
                    // Force avgGain to be undefined/overridden so UI uses avgRoi
                    avgGain: undefined
                };
            }
            // Even if no analysis yet, mark VIPs as "Real Data" target for UI if user requested
            // User said: "1 en üsttekiler real data oalcak". So let's mark them.
            if (isVip) {
                return {
                    ...user,
                    isRealData: true, // Treat as real data section
                    isVip: true,
                    // mock or zero stats if no analysis yet
                    successRate: 0,
                    totalCalls: 0,
                    avgRoi: 0,
                    totalRoi: 0
                };
            }

            return { ...user, isRealData: false };
        });

        // Sort: VIPs first, then Real Analysis, then Ethos Score
        enrichedUsers.sort((a: any, b: any) => {
            if (a.isVip && !b.isVip) return -1;
            if (!a.isVip && b.isVip) return 1;

            if (a.isRealData && !b.isRealData) return -1;
            if (!a.isRealData && b.isRealData) return 1;

            return (b.score || 0) - (a.score || 0);
        });

        // Re-assign ranks
        const rankedUsers = enrichedUsers.map((u: any, i: number) => ({
            ...u,
            rank: i + 1
        }));

        return NextResponse.json({
            ...data,
            users: rankedUsers
        });

    } catch (error) {
        console.error('Error reading leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
