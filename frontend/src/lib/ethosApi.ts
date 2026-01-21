// Ethos Leaderboard User type matching the backend data
export interface EthosUser {
    rank: number;
    id: number;
    username: string;
    displayName: string;
    score: number;
    avatarUrl: string;
    xpTotal: number;
    influenceFactor: number;
    influencePercentile: number;
    positiveReviews: number;
    negativeReviews: number;
    neutralReviews: number;
    vouchCount: number;
    vouchAmount: string;
    profileUrl: string;
}

export interface LeaderboardData {
    fetched_at: string;
    total_users: number;
    users: EthosUser[];
}

export async function fetchLeaderboard(): Promise<LeaderboardData | null> {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return null;
    }
}
