'use client';

import React from 'react';

interface LimitationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LimitationsModal({ isOpen, onClose }: LimitationsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a] sticky top-0 bg-[#0A0A0A] z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Known Issues & Limitations
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 text-gray-400 text-sm leading-relaxed">

                    {/* Section 1: Data Source */}
                    <section>
                        <h3 className="text-white font-medium mb-2 text-base">Twitter / X Data</h3>
                        <p className="mb-2">
                            I'm using a custom scraping solution to fetch tweets since I don't have access to the Enterprise API. This has a few natural limits:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>History Limit:</strong> Tweets older than 2 years are generally not accessible.</li>
                            <li><strong>Volume Limit:</strong> I can fetch around 400-700 tweets per user in a single run.</li>
                        </ul>
                        <p className="mt-2 text-xs italic opacity-60">
                            *This would be instantly solved with the official X Enterprise API.
                        </p>
                    </section>

                    {/* Section 2: Price Data */}
                    <section>
                        <h3 className="text-white font-medium mb-2 text-base">Price Feeds</h3>
                        <p>
                            Historical prices come from CoinGecko's free tier. It's solid for major coins, but you might notice gaps:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>Low-cap tokens might have missing data.</li>
                            <li>Some charts might look empty if the token is too new or obscure.</li>
                        </ul>
                        <p className="mt-2 text-gray-500">
                            Many users are entering the Solana trenches or farming airdrops. Integrating DexScreener or Birdeye APIs would be the next logical step to cover those bases.
                        </p>
                    </section>

                    {/* Section 3: AI Analysis Flow */}
                    <section>
                        <h3 className="text-white font-medium mb-2 text-base">The Pipeline</h3>
                        <p>
                            Here's how the magic happens under the hood:
                        </p>
                        <div className="flex items-center gap-2 my-3 text-xs font-mono bg-[#141414] p-3 rounded border border-[#1a1a1a]">
                            <span>Fetch Tweets</span>
                            <span>→</span>
                            <span className="text-blue-400">Grok (LLM)</span>
                            <span>→</span>
                            <span className="text-green-500">Call Extraction</span>
                            <span>→</span>
                            <span>Price Match</span>
                        </div>
                        <p>
                            Grok reads the context to figure out if it's a genuine "call" or just noise. It's surprisingly good, but since it relies on specific tickers or clear sentiment, it might miss the nuances of a subtle "alpha leak."
                        </p>
                    </section>

                    {/* Section 4: Degen Calls */}
                    <section>
                        <h3 className="text-white font-medium mb-2 text-base">"Degen" Calls & Ticker Ambiguity</h3>
                        <p className="mb-2">
                            Tracking early-stage plays on Solana is tricky. Thousands of tokens with the same ticker (e.g., "$DOG") launch daily. Without a CA (Contract Address) in the tweet, it's tough to know exactly <em>which</em> coin is being talked about.
                        </p>
                        <div className="mt-4 p-3 bg-[#141414] rounded-lg border border-[#1a1a1a]">
                            <h4 className="text-white text-xs font-bold uppercase mb-1">Potential Improvement</h4>
                            <p className="text-xs">
                                Implementing volume and liquidity filters to automatically identify the "dominant" token for any given ticker symbol at the time of the tweet could solve this problem.
                            </p>
                        </div>
                    </section>

                    {/* Section 5: Airdrops */}
                    <section>
                        <h3 className="text-white font-medium mb-2 text-base">Airdrop Farming</h3>
                        <p className="mb-2">
                            Farming is a long game, not a quick trade. Success here isn't about percentage gain—it's about the final allocation value and time spent.
                        </p>
                        <div className="mt-4 p-3 bg-[#141414] rounded-lg border border-[#1a1a1a]">
                            <h4 className="text-white text-xs font-bold uppercase mb-1">Ideas for Growth</h4>
                            <ul className="list-disc pl-5 text-xs space-y-1">
                                <li>Monitoring public wallets of influencers to verify on-chain entries.</li>
                                <li>A community-verified valuation system for airdrop claims.</li>
                            </ul>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
