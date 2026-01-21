import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params;

        const analysisPath = path.join(
            process.cwd(),
            '..',
            'backend',
            'data',
            'analysis',
            `${username}_calls.json`
        );

        if (!fs.existsSync(analysisPath)) {
            return NextResponse.json(
                { error: 'User analysis not found' },
                { status: 404 }
            );
        }

        const data = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

        // Try to enrich with avatar and score from leaderboard or VIP users
        try {
            const leaderboardPath = path.join(
                process.cwd(),
                '..',
                'backend',
                'data',
                'ethos',
                'leaderboard.json'
            );

            const vipPath = path.join(
                process.cwd(),
                '..',
                'backend',
                'data',
                'ethos',
                'vip_users.json'
            );

            let foundUser = null;

            // Check leaderboard first
            if (fs.existsSync(leaderboardPath)) {
                const leaderboard = JSON.parse(fs.readFileSync(leaderboardPath, 'utf-8'));
                foundUser = leaderboard.users.find((u: any) =>
                    u.username.toLowerCase() === username.toLowerCase()
                );
            }

            // If not found, check VIP users
            if (!foundUser && fs.existsSync(vipPath)) {
                const vipData = JSON.parse(fs.readFileSync(vipPath, 'utf-8'));
                foundUser = (vipData.users || []).find((u: any) =>
                    u.username.toLowerCase() === username.toLowerCase()
                );
            }

            if (foundUser) {
                if (foundUser.avatarUrl) {
                    data.avatarUrl = foundUser.avatarUrl;
                }
                if (foundUser.score) {
                    data.ethosScore = foundUser.score;
                }
            }
        } catch (e) {
            console.error('Failed to enrich user data:', e);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading user analysis:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}
