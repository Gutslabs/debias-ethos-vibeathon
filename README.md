# Debias

**Built for the Ethos Vibeathon 🏆**

A tool to track and analyze crypto influencer calls on Twitter/X. It scrapes tweets, uses AI (Grok) to identify actual "calls" vs. noise, then matches them with historical price data to calculate real performance metrics.

---

## What It Does

1. **Fetches Tweets** — Uses [ai16z's agent-twitter-client](https://github.com/ai16z/agent-twitter-client) library to grab up to ~700 tweets per user (limited to ~2 years of history).
2. **AI Call Detection** — Grok (xAI) reads each tweet to determine if it's a genuine bullish call with a specific ticker.
3. **Price Matching** — Pulls historical price data from CoinGecko to calculate entry prices at the time of the tweet.
4. **Performance Stats** — Win rate, avg ROI, total ROI, and a "Debias Score" to rank influencers.

---

## The Pipeline

```
Fetch Tweets → Grok (LLM) → Call Extraction → Price Match → Stats
```

---

## Known Limitations

This is a hackathon project. Here's what you should know:

### Twitter Data
- I'm using [ai16z's agent-twitter-client](https://github.com/ai16z/agent-twitter-client) (not the Enterprise API), so:
  - **~2 year history limit**
  - **~400-700 tweets per user** max per run
  - Older tweets may be missing

### Price Data
- CoinGecko free tier is solid for major coins, but:
  - Low-cap tokens might have gaps
  - Some charts may look empty for obscure/new tokens
- **DexScreener/Birdeye integration** would be the next step for Solana coverage

### "Degen" Calls & Ticker Ambiguity
- On Solana, thousands of tokens share the same ticker (e.g., "$DOG")
- Without a contract address in the tweet, it's hard to know *which* token was called
- **Potential fix:** Volume/liquidity filters to auto-identify the "dominant" token

### Airdrop Farming
- Airdrop success isn't price action—it's farming time + allocation value
- Hard to measure without on-chain wallet tracking
- **Potential fix:** Community-verified valuations, influencer wallet monitoring

---

## Tech Stack

- **Frontend:** Next.js 15, React, TailwindCSS
- **Backend:** Node.js, TypeScript, Express
- **AI:** Grok (xAI) via Vercel AI SDK
- **Data:** CoinGecko API, [ai16z/agent-twitter-client](https://github.com/ai16z/agent-twitter-client)
- **Database:** Supabase (PostgreSQL)

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase account (for DB)
- CoinGecko API key (free tier works)
- xAI API key (for Grok)
- Twitter account credentials (for scraper)

### Install

```bash
# Clone the repo
git clone https://github.com/Gutslabs/debias-vibeathon-ethos-.git
cd debias-vibeathon-ethos-

# Backend
cd backend
cp .env.example .env
# Fill in your API keys in .env
npm install

# Frontend
cd ../frontend
npm install
```

### Run

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev
```

---

## Project Structure

```
debias/
├── backend/           # API server, scraper, AI processing
│   ├── src/
│   │   ├── scripts/   # Tweet fetching, analysis scripts
│   │   └── services/  # Price fetching, call detection
│   └── .env.example
├── frontend/          # Next.js web app
│   └── src/
│       ├── app/       # Pages (leaderboard, user profiles)
│       └── components/ # UI components
└── agent-twitter-client/  # Twitter scraper library
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `TWITTER_USERNAME` | Twitter account username |
| `TWITTER_PASSWORD` | Twitter account password |
| `TWITTER_EMAIL` | Twitter account email |
| `COINGECKO_API_KEY` | CoinGecko API key |
| `XAI_API_KEY` | xAI (Grok) API key |

---

## License

MIT

---

## Author

Built solo by [@Gutslab](https://x.com/Gutslab)

GitHub: [Gutslabs](https://github.com/Gutslabs)
