'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsPanel, CallCard } from '@/components';
import type { InfluencerStats, CallAnalysis } from '@/types';

interface PageProps {
    params: Promise<{ username: string }>;
}

interface UserAnalysis extends InfluencerStats {
    analyzed_at?: string;
}

export default function UserProfilePage({ params }: PageProps) {
    const { username } = use(params);
    const [userData, setUserData] = useState<UserAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'recents' | 'profitable' | 'loses'>('recents');

    useEffect(() => {
        async function fetchUserData() {
            setLoading(true);
            try {
                const response = await fetch(`/api/user/${username}/calls`);
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
            setLoading(false);
        }
        fetchUserData();
    }, [username]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 inline-block">
                    ← Back to Leaderboard
                </Link>
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Loading user data...</div>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 inline-block">
                    ← Back to Leaderboard
                </Link>
                <div className="text-center py-20">
                    <h1 className="text-xl font-bold mb-2 text-white">No analysis found</h1>
                    <p className="text-gray-500">No call analysis available for @{username}</p>
                </div>
            </div>
        );
    }

    // Sort calls based on filter
    const sortedCalls = [...(userData.calls || [])].sort((a, b) => {
        if (filter === 'profitable') {
            return (b.roiPercent || 0) - (a.roiPercent || 0);
        }
        if (filter === 'loses') {
            return (a.roiPercent || 0) - (b.roiPercent || 0);
        }
        // Default: recents (by date descending)
        return new Date(b.tweetDate).getTime() - new Date(a.tweetDate).getTime();
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Back Link */}
            <Link href="/" className="text-gray-500 hover:text-white text-sm mb-8 inline-block">
                ← Back to Leaderboard
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile & Calls */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Header */}
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        {/* Avatar */}
                        {userData.avatarUrl ? (
                            <img
                                src={userData.avatarUrl}
                                alt={username}
                                className="w-20 h-20 rounded-full border-2 border-[#1a1a1a]"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center text-white text-2xl font-bold">
                                {username.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-white">@{username}</h1>
                                {/* Ethos Score Badge */}
                                {(userData as any).ethosScore && (
                                    <div className="group flex items-center gap-2 bg-[#0A0A0A] border border-green-500/30 rounded-lg px-3 py-1.5 shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-sm hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:border-green-500/50 transition-all duration-300">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-green-500 blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                            <svg className="w-4 h-4 text-green-400 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-green-400 font-bold text-sm tracking-tight font-mono">{(userData as any).ethosScore.toLocaleString()}</span>
                                            <span className="text-green-500/50 text-[10px] font-bold tracking-widest uppercase">DEBIAS SCORE</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mb-3">
                                {userData.totalCalls} trades analyzed • {userData.successRate.toFixed(0)}% win rate
                            </p>
                            <div className="flex gap-2">
                                {userData.successRate >= 60 && (
                                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-[10px] font-medium tracking-tight">
                                        HIGH WIN RATE
                                    </span>
                                )}
                                {userData.avgRoi > 50 && (
                                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-[10px] font-medium tracking-tight">
                                        +{userData.avgRoi.toFixed(0)}% AVG
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                            <div className="text-gray-500 text-xs mb-1">Total Calls</div>
                            <div className="text-white text-xl font-bold">{userData.totalCalls}</div>
                        </div>
                        <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                            <div className="text-gray-500 text-xs mb-1">Win Rate</div>
                            <div className="text-green-500 text-xl font-bold">{userData.successRate.toFixed(1)}%</div>
                        </div>
                        <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                            <div className="text-gray-500 text-xs mb-1">Avg ROI</div>
                            <div className={`text-xl font-bold ${userData.avgRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {userData.avgRoi >= 0 ? '+' : ''}{userData.avgRoi.toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-[#141414] rounded-xl p-4 border border-[#1a1a1a]">
                            <div className="text-gray-500 text-xs mb-1">Total ROI</div>
                            <div className={`text-xl font-bold ${userData.totalRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {userData.totalRoi >= 0 ? '+' : ''}{userData.totalRoi.toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-col gap-6">
                        <div className="flex gap-8 border-b border-[#1a1a1a]">
                            <button className="pb-3 border-b-2 border-white text-white text-sm font-medium">
                                Trades ({userData.calls?.length || 0})
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFilter('recents')}
                                className={`px-3 py-1 rounded text-xs ${filter === 'recents' ? 'bg-[#141414] text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Recents
                            </button>
                            <button
                                onClick={() => setFilter('profitable')}
                                className={`px-3 py-1 rounded text-xs ${filter === 'profitable' ? 'bg-[#141414] text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Most Profitable
                            </button>
                            <button
                                onClick={() => setFilter('loses')}
                                className={`px-3 py-1 rounded text-xs ${filter === 'loses' ? 'bg-[#141414] text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Biggest Losses
                            </button>
                        </div>

                        {/* Calls List */}
                        <div className="space-y-4">
                            {sortedCalls.length > 0 ? (
                                sortedCalls.map((call, idx) => (
                                    <CallCard key={`${call.tweetId}-${idx}`} call={call} />
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    No trades found
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats */}
                <div className="lg:col-span-1">
                    <StatsPanel user={userData} />
                </div>
            </div>
        </div>
    );
}
