// Types for the leaderboard and user data

export interface InfluencerStats {
    username: string;
    avatarUrl?: string;
    totalTweets?: number;
    totalCalls: number;
    successfulCalls?: number;
    failedCalls?: number;
    successRate: number;
    totalRoi: number;
    avgRoi: number;
    hypotheticalPnL?: number;
    calls?: CallAnalysis[];
    // Computed fields for leaderboard
    score?: number;
    rank?: number;
    rankChange?: number;
    avgGain?: number;
    avgMax?: number;
    activeCalls?: number;
    badges?: string[];
    avatar?: string;
    // Real data tracking
    isRealData?: boolean;
    isVip?: boolean;
}

export interface CallAnalysis {
    tweetId: string;
    tweetText: string;
    tweetDate: string;
    username: string;
    ticker: string;
    chain: string;
    tokenAddress?: string;
    priceAtCall?: number;
    currentPrice?: number;
    roiPercent?: number;
    isSuccessful?: boolean;
    aiConfidence: number;
    aiReasoning?: string;
    chartData?: number[];
    callType?: 'spot_buy' | 'long' | 'ico_presale' | 'airdrop_farming' | 'commentary' | 'tax_strategy' | 'other';
}

export type TimeFilter = 'all' | 'year' | 'month' | 'week';
