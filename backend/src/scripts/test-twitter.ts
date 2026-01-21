/**
 * Test script for Twitter client
 * Usage: npm run test:twitter
 */

import { TwitterService } from '../services/twitterService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testTwitter() {
    console.log('🐦 Testing Twitter Service...\n');

    const twitter = new TwitterService();

    try {
        // Initialize
        console.log('1️⃣ Initializing Twitter service...');
        await twitter.initialize();
        console.log('✅ Twitter service initialized\n');

        // Test getting a profile (this works!)
        console.log('2️⃣ Testing profile fetch (icobeast)...');
        const profile = twitter.getProfile('icobeast');
        if (profile) {
            console.log('✅ Profile fetched:');
            console.log(`   Name: ${profile.name}`);
            console.log(`   Username: @${profile.screen_name}`);
            console.log(`   Followers: ${profile.followers_count?.toLocaleString()}`);
            console.log(`   Bio: ${profile.description?.substring(0, 50)}...`);
        } else {
            console.log('❌ Profile not found - cookies may be expired');
            return;
        }
        console.log('');

        // Test getting tweets
        console.log('3️⃣ Fetching tweets from @icobeast (limit 10)...');
        const result = twitter.getTweets('icobeast', 10, true);

        if (result.success && result.tweets) {
            console.log(`✅ Fetched ${result.tweets.length} tweets`);
            result.tweets.slice(0, 3).forEach((tweet, i) => {
                console.log(`   ${i + 1}. ${tweet.text?.substring(0, 80)}...`);
                console.log(`      ❤️ ${tweet.likes} | 🔄 ${tweet.retweets} | 💬 ${tweet.replies}`);
            });
        } else {
            console.log(`❌ Failed: ${result.error}`);
        }
        console.log('');

        console.log('🎉 All Twitter tests completed!');

    } catch (error) {
        console.error('❌ Twitter test failed:', error);
        process.exit(1);
    }
}

testTwitter();
