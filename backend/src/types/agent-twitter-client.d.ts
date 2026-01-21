declare module 'agent-twitter-client' {
    export interface Profile {
        name?: string;
        username?: string;
        followersCount?: number;
        followingCount?: number;
        biography?: string;
        avatar?: string;
        banner?: string;
        isPrivate?: boolean;
        isVerified?: boolean;
        location?: string;
        joined?: Date;
        website?: string;
    }

    export interface Tweet {
        id?: string;
        text?: string;
        username?: string;
        timeParsed?: Date;
        timestamp?: number;
        likes?: number;
        retweets?: number;
        replies?: number;
        isRetweet?: boolean;
        isReply?: boolean;
        isQuoted?: boolean;
        photos?: string[];
        videos?: string[];
        urls?: string[];
        hashtags?: string[];
        mentions?: string[];
    }

    export enum SearchMode {
        Top = 0,
        Latest = 1,
        Photos = 2,
        Videos = 3,
        Users = 4
    }

    export class Scraper {
        constructor(options?: Partial<ScraperOptions>);
        login(
            username: string,
            password: string,
            email?: string,
            twoFactorSecret?: string,
            appKey?: string,
            appSecret?: string,
            accessToken?: string,
            accessSecret?: string
        ): Promise<void>;
        logout(): Promise<void>;
        isLoggedIn(): Promise<boolean>;
        getCookies(): Promise<any[]>;
        setCookies(cookies: (string | any)[]): Promise<void>;
        getProfile(username: string): Promise<Profile>;
        getUserIdByScreenName(screenName: string): Promise<string>;
        getTweets(user: string, maxTweets?: number): AsyncGenerator<Tweet>;
        getTweetsAndReplies(user: string, maxTweets?: number): AsyncGenerator<Tweet>;
        getLatestTweet(user: string, includeRetweets?: boolean, max?: number): Promise<Tweet | null | void>;
        getTweet(id: string): Promise<Tweet | null>;
        searchTweets(query: string, maxTweets: number, searchMode?: SearchMode): AsyncGenerator<Tweet>;
    }

    export interface ScraperOptions {
        fetch: typeof fetch;
        transform: Partial<FetchTransformOptions>;
    }

    export interface FetchTransformOptions {
        request?: (input: RequestInfo, init?: RequestInit) => { input: RequestInfo; init?: RequestInit };
        response?: (response: Response) => Response | Promise<Response>;
    }
}
