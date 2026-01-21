/**
 * Fetch tweets using agent-twitter-client library
 * 
 * Set your cookies in environment variables:
 * - TWITTER_CT0
 * - TWITTER_AUTH_TOKEN
 */

import { Scraper, SearchMode } from 'agent-twitter-client';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Get cookies from environment variables
const CT0 = process.env.TWITTER_CT0 || '';
const AUTH_TOKEN = process.env.TWITTER_AUTH_TOKEN || '';

if (!CT0 || !AUTH_TOKEN) {
    console.error('❌ Missing TWITTER_CT0 or TWITTER_AUTH_TOKEN environment variables');
    console.error('Please set them in your .env file');
    process.exit(1);
}

const COOKIE_STRINGS = [
    `ct0=${CT0}; Max-Age=21600; Path=/; Domain=.twitter.com; Secure`,
    `auth_token=${AUTH_TOKEN}; Max-Age=157680000; Path=/; Domain=.twitter.com; Secure; HttpOnly; SameSite=None`
];

async function fetchTweetsWithLibrary(username: string, maxTweets: number = 1000) {
    console.log(`🚀 Fetching tweets for @${username} using agent-twitter-client...`);

    const scraper = new Scraper();

    try {
        // Set cookies with proper format
        await scraper.setCookies(COOKIE_STRINGS);

        // Check login
        const isLoggedIn = await scraper.isLoggedIn();
        console.log(`Logged in: ${isLoggedIn}`);

        if (!isLoggedIn) {
            console.error('❌ Not logged in - check your cookie values');
            return;
        }

        const allTweets: any[] = [];
        const query = `from:${username}`;

        console.log(`\nSearching: "${query}"`);
        console.log(`Max tweets: ${maxTweets}`);
        console.log('');

        // Use searchTweets generator
        const searchIterator = scraper.searchTweets(query, maxTweets, SearchMode.Latest);

        let count = 0;
        for await (const tweet of searchIterator) {
            allTweets.push({
                id: tweet.id,
                text: tweet.text,
                created_at: tweet.timeParsed?.toISOString(),
                username: tweet.username,
                likes: tweet.likes,
                retweets: tweet.retweets,
                replies: tweet.replies
            });

            count++;
            if (count % 50 === 0) {
                console.log(`  Fetched ${count} tweets...`);
            }

            if (count >= maxTweets) break;
        }

        console.log(`\n✅ Total fetched: ${allTweets.length} tweets`);

        // Save to file
        const filename = `${username}_search_tweets.json`;
        const outputData = {
            username,
            fetched_at: new Date().toISOString(),
            total_tweets: allTweets.length,
            tweets: allTweets
        };

        fs.writeFileSync(filename, JSON.stringify(outputData, null, 2));
        console.log(`📁 Saved to ${filename}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// CLI
const username = process.argv[2] || 'icobeast';
const maxTweets = parseInt(process.argv[3]) || 1000;

fetchTweetsWithLibrary(username, maxTweets);
