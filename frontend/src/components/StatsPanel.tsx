'use client';

import type { InfluencerStats } from '@/types';

interface StatsPanelProps {
    user: InfluencerStats;
}

export function StatsPanel({ user }: StatsPanelProps) {
    const avgWin = user.avgRoi > 0 ? user.avgRoi * 1.5 : 20;
    const avgLoss = Math.abs(user.avgRoi - avgWin) / 2 || 15;

    return (
        <div className="space-y-4">
            {/* Radar Chart */}
            <div className="bg-[#141414] rounded-xl p-6 border border-[#1a1a1a]">
                <div className="text-xs text-gray-500 mb-8 uppercase tracking-wider font-medium">Total Trades</div>
                <div className="relative w-full aspect-square flex items-center justify-center">
                    <div className="relative w-56 h-56">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Pentagonal Background Grid */}
                            <polygon
                                points="50,10 88,38 74,82 26,82 12,38"
                                fill="none"
                                stroke="#1f1f1f"
                                strokeWidth="0.5"
                            />
                            <polygon
                                points="50,30 69,44 62,66 38,66 31,44"
                                fill="none"
                                stroke="#1f1f1f"
                                strokeWidth="0.5"
                            />
                            {/* Radial lines */}
                            <line x1="50" y1="50" x2="50" y2="10" stroke="#1f1f1f" strokeWidth="0.5" />
                            <line x1="50" y1="50" x2="88" y2="38" stroke="#1f1f1f" strokeWidth="0.5" />
                            <line x1="50" y1="50" x2="74" y2="82" stroke="#1f1f1f" strokeWidth="0.5" />
                            <line x1="50" y1="50" x2="26" y2="82" stroke="#1f1f1f" strokeWidth="0.5" />
                            <line x1="50" y1="50" x2="12" y2="38" stroke="#1f1f1f" strokeWidth="0.5" />

                            {/* Data polygon */}
                            <polygon
                                points="50,20 82,40 68,75 32,75 18,40"
                                fill="rgba(34, 197, 94, 0.15)"
                                stroke="#22c55e"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* Labels aligned with pentagon vertices */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-medium whitespace-nowrap">AVG RETURN</div>
                        <div className="absolute top-[20%] -right-4 text-[10px] text-gray-500 font-medium whitespace-nowrap">RISK REWARD</div>
                        <div className="absolute bottom-[5%] right-0 text-[10px] text-gray-500 font-medium whitespace-nowrap">AVG DRAWDOWN</div>
                        <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-medium whitespace-nowrap">WIN RATE</div>
                        <div className="absolute bottom-[5%] left-0 text-[10px] text-gray-500 font-medium whitespace-nowrap text-left">CONSISTENCY</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                    <div className="text-[10px] text-gray-500 mb-1 uppercase font-medium">Avg. Win</div>
                    <div className="text-xl font-bold text-green-500">{avgWin.toFixed(2)}%</div>
                </div>
                <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                    <div className="text-[10px] text-gray-500 mb-1 uppercase font-medium">Avg. Loss</div>
                    <div className="text-xl font-bold text-white">{avgLoss.toFixed(2)}%</div>
                </div>
            </div>

            {/* Avg Return Progress */}
            <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                <div className="text-[10px] text-gray-500 mb-1 uppercase font-medium">Avg. Return</div>
                <div className="text-xl font-bold text-white mb-2">{user.avgRoi.toFixed(2)}%</div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-all duration-500"
                        style={{ width: `${Math.min(Math.max(user.avgRoi, 0), 100)}%` }}
                    />
                </div>
            </div>

            {/* Win Rate Progress */}
            <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                <div className="text-[10px] text-gray-500 mb-1 uppercase font-medium">Win Rate</div>
                <div className="text-xl font-bold text-white mb-2">{user.successRate.toFixed(2)}%</div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-all duration-500"
                        style={{ width: `${user.successRate}%` }}
                    />
                </div>
            </div>

            {/* Total Trades Progress */}
            <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                <div className="flex justify-between items-center mb-1">
                    <div>
                        <div className="text-[10px] text-gray-500 uppercase font-medium">Total Trades</div>
                        <div className="text-xl font-bold text-white">{user.totalCalls}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-[#1f1f1f] text-gray-400 text-[10px] rounded uppercase font-semibold">
                        Serial Trader
                    </span>
                </div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mt-2">
                    <div
                        className="h-full bg-gray-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(user.totalCalls / 3, 100)}%` }}
                    />
                </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                    <div className="text-[10px] text-gray-500 mb-1 uppercase font-medium">Break Even Rate</div>
                    <div className="text-lg font-bold text-white">50.94%</div>
                </div>
                <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                    <div className="text-[10px] text-gray-500 mb-1 uppercase font-medium">Sum Gain</div>
                    <div className="text-lg font-bold text-green-500">{user.totalRoi.toFixed(2)}%</div>
                </div>
            </div>
        </div>
    );
}
