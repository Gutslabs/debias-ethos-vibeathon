/**
 * Twitter Service - Wrapper around working twitter_helper.cjs
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the working twitter_helper.cjs script
const TWITTER_HELPER_PATH = path.join(__dirname, '..', 'scripts', 'twitter_helper.cjs');

export interface TwitterUser {
    id: string;
    name: string;
    screen_name: string;
    description: string;
    profile_image_url_https: string;
    followers_count: number;
}

export interface TwitterTweet {
    id: string;
    text: string;
    created_at: string;
    username: string;
    name: string;
    retweets: number;
    likes: number;
    replies: number;
    views: number;
}

export class TwitterService {
    private isAuthenticated: boolean = false;

    constructor() { }

    /**
     * Initialize the Twitter service
     */
    async initialize(): Promise<void> {
        const status = this.isLoggedIn();
        this.isAuthenticated = status.isLoggedIn;

        if (this.isAuthenticated) {
            console.log('[TwitterService] Successfully authenticated');
        } else {
            console.warn('[TwitterService] Not authenticated - cookies may be expired');
        }
    }

    /**
     * Execute twitter_helper.cjs command
     */
    private executeHelper(command: string, args: string[] = []): any {
        const argsStr = args.map(a => `"${a}"`).join(' ');
        const cmd = `node "${TWITTER_HELPER_PATH}" ${command} ${argsStr}`;

        try {
            const output = execSync(cmd, {
                encoding: 'utf8',
                maxBuffer: 50 * 1024 * 1024,
                cwd: path.dirname(TWITTER_HELPER_PATH)
            });
            return JSON.parse(output);
        } catch (e: any) {
            console.error('[TwitterService] Helper execution failed:', e.message);
            return { success: false, error: e.message };
        }
    }

    /**
     * Check if logged in
     */
    isLoggedIn(): { success: boolean; isLoggedIn: boolean } {
        const result = this.executeHelper('isLoggedIn');
        return {
            success: result.success ?? false,
            isLoggedIn: result.isLoggedIn ?? false
        };
    }

    /**
     * Get user profile info
     */
    getProfile(screenName: string): TwitterUser | null {
        const result = this.executeHelper('getUserInfo', [screenName]);

        if (result.success && result.user) {
            return result.user;
        }
        return null;
    }

    /**
     * Get tweets from a user
     */
    getTweets(screenName: string, maxTweets: number = 100, verbose: boolean = false): {
        success: boolean;
        tweets?: TwitterTweet[];
        error?: string
    } {
        const result = this.executeHelper('searchTweets', [`from:${screenName}`, String(maxTweets)]);

        if (result.success) {
            return {
                success: true,
                tweets: result.tweets || []
            };
        }

        return {
            success: false,
            error: result.error || 'Unknown error'
        };
    }

    /**
     * Check if service is ready
     */
    isReady(): boolean {
        return this.isAuthenticated;
    }
}

// Singleton instance
let twitterServiceInstance: TwitterService | null = null;

export async function getTwitterService(): Promise<TwitterService> {
    if (!twitterServiceInstance) {
        twitterServiceInstance = new TwitterService();
        await twitterServiceInstance.initialize();
    }
    return twitterServiceInstance;
}

export default TwitterService;
