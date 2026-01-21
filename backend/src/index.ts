import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getTwitterService } from './services/twitterService.js';
import { getPriceService } from './services/priceService.js';
import { getTokenDetector } from './services/tokenDetector.js';

// Enable strict type checking bypass for express params
type Params = Record<string, string>;
type Query = Record<string, string | undefined>;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req: Request, res: Response) => {
    const twitter = await getTwitterService();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            twitter: twitter.isReady() ? 'ok' : 'not_authenticated',
            price: 'ok'
        }
    });
});

// ==================== Twitter Routes ====================

// Check login status
app.get('/api/twitter/status', async (req: Request, res: Response) => {
    try {
        const twitter = await getTwitterService();
        const status = twitter.isLoggedIn();
        res.json(status);
    } catch (error) {
        console.error('Error checking status:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

// Get Twitter profile
app.get('/api/twitter/profile/:username', async (req: Request, res: Response) => {
    try {
        const twitter = await getTwitterService();
        const profile = twitter.getProfile(req.params.username as string);

        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get user tweets
app.get('/api/twitter/tweets/:username', async (req: Request, res: Response) => {
    try {
        const twitter = await getTwitterService();
        const maxTweets = parseInt(req.query.limit as string) || 50;
        const result = twitter.getTweets(req.params.username as string, maxTweets, true);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({
            count: result.tweets?.length || 0,
            tweets: result.tweets
        });
    } catch (error) {
        console.error('Error fetching tweets:', error);
        res.status(500).json({ error: 'Failed to fetch tweets' });
    }
});

// ==================== Price Routes ====================

// Get current price
app.get('/api/price/:coingeckoId', async (req: Request, res: Response) => {
    try {
        const priceService = getPriceService();
        const price = await priceService.getCurrentPrice(req.params.coingeckoId as string);

        if (!price) {
            return res.status(404).json({ error: 'Token not found' });
        }

        res.json(price);
    } catch (error) {
        console.error('Error fetching price:', error);
        res.status(500).json({ error: 'Failed to fetch price' });
    }
});

// Get historical price
app.get('/api/price/:coingeckoId/history', async (req: Request, res: Response) => {
    try {
        const priceService = getPriceService();
        const date = new Date(req.query.date as string);

        if (isNaN(date.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        const price = await priceService.getHistoricalPrice(req.params.coingeckoId as string, date);

        if (!price) {
            return res.status(404).json({ error: 'Historical price not found' });
        }

        res.json(price);
    } catch (error) {
        console.error('Error fetching historical price:', error);
        res.status(500).json({ error: 'Failed to fetch historical price' });
    }
});

// Get price chart
app.get('/api/price/:coingeckoId/chart', async (req: Request, res: Response) => {
    try {
        const priceService = getPriceService();
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const chart = await priceService.getPriceChart(req.params.coingeckoId as string, days);
        res.json(chart);
    } catch (error) {
        console.error('Error fetching price chart:', error);
        res.status(500).json({ error: 'Failed to fetch price chart' });
    }
});

// Search tokens
app.get('/api/tokens/search', async (req: Request, res: Response) => {
    try {
        const priceService = getPriceService();
        const query = req.query.q as string;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        const results = await priceService.searchToken(query);
        res.json(results);
    } catch (error) {
        console.error('Error searching tokens:', error);
        res.status(500).json({ error: 'Failed to search tokens' });
    }
});

// ==================== Token Detection Routes ====================

// Detect tokens in text
app.post('/api/detect/tokens', (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text field required' });
        }

        const detector = getTokenDetector();
        const tokens = detector.detectTokens(text);
        const filtered = detector.filterSpam(tokens);

        res.json({
            raw: tokens,
            filtered
        });
    } catch (error) {
        console.error('Error detecting tokens:', error);
        res.status(500).json({ error: 'Failed to detect tokens' });
    }
});

// Get known tokens list
app.get('/api/detect/known-tokens', (req: Request, res: Response) => {
    const detector = getTokenDetector();
    res.json(detector.getAllKnownTokens());
});

// ==================== Analysis Routes ====================

// Analyze influencer tweets (main endpoint)
app.post('/api/analyze/influencer', async (req: Request, res: Response) => {
    try {
        const { username, maxTweets = 100 } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username required' });
        }

        const twitter = await getTwitterService();
        const priceService = getPriceService();
        const detector = getTokenDetector();

        // 1. Fetch tweets
        console.log(`[Analysis] Fetching tweets for @${username}...`);
        const tweetsResult = twitter.getTweets(username, maxTweets, true);

        if (!tweetsResult.success || !tweetsResult.tweets) {
            return res.status(400).json({ error: tweetsResult.error || 'Failed to fetch tweets' });
        }

        const tweets = tweetsResult.tweets;

        // 2. Detect tokens
        console.log(`[Analysis] Detecting tokens in ${tweets.length} tweets...`);
        const tweetData = tweets.map(t => ({
            text: t.text || '',
            id: t.id || '',
            date: new Date(t.created_at)
        }));
        const tokenMap = detector.detectTokensFromTweets(tweetData);

        // 3. Get current prices for known tokens
        console.log(`[Analysis] Fetching prices for ${tokenMap.size} tokens...`);
        const tokenResults: any[] = [];

        for (const [symbol, data] of tokenMap) {
            if (data.coingeckoId) {
                const currentPrice = await priceService.getCurrentPrice(data.coingeckoId);
                tokenResults.push({
                    ...data,
                    currentPrice: currentPrice?.current_price || null,
                    priceData: currentPrice
                });

                // Rate limiting for CoinGecko
                await new Promise(r => setTimeout(r, 250));
            } else {
                tokenResults.push(data);
            }
        }

        res.json({
            username,
            tweetsAnalyzed: tweets.length,
            tokensFound: tokenResults.length,
            tokens: tokenResults
        });
    } catch (error) {
        console.error('Error analyzing influencer:', error);
        res.status(500).json({ error: 'Failed to analyze influencer' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Debias Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
