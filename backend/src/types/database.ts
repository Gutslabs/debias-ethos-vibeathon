// Database Types for Debias

export interface Influencer {
    id: string;
    twitter_handle: string;
    display_name: string | null;
    profile_image_url: string | null;
    followers_count: number | null;
    total_tweets_analyzed: number;
    avg_token_performance: number | null;
    created_at: string;
    updated_at: string;
}

export interface Tweet {
    id: string;
    twitter_id: string;
    influencer_id: string;
    content: string;
    tweet_date: string;
    likes_count: number | null;
    retweets_count: number | null;
    replies_count: number | null;
    created_at: string;
}

export interface Token {
    id: string;
    symbol: string;
    name: string | null;
    coingecko_id: string | null;
    dexscreener_pair_address: string | null;
    chain: string | null;
    logo_url: string | null;
    created_at: string;
}

export interface TokenMention {
    id: string;
    tweet_id: string;
    token_id: string;
    influencer_id: string;
    mention_date: string;
    price_at_mention: number | null;
    current_price: number | null;
    price_change_percent: number | null;
    created_at: string;
    updated_at: string;
}

export interface PriceHistory {
    id: string;
    token_id: string;
    price: number;
    market_cap: number | null;
    volume_24h: number | null;
    recorded_at: string;
    created_at: string;
}

// API Response Types
export interface InfluencerWithStats extends Influencer {
    mentions_count: number;
    tokens_mentioned: Token[];
    best_call: TokenMention | null;
    worst_call: TokenMention | null;
}

export interface TokenPerformance {
    token: Token;
    mention_date: string;
    price_at_mention: number;
    current_price: number;
    price_change_percent: number;
    holding_period_days: number;
}
