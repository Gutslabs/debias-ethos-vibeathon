'use client';

import { useState, useEffect } from 'react';
import { LeaderboardTable } from '@/components';
import { LimitationsModal } from '@/components/LimitationsModal';
import { fetchLeaderboard, type EthosUser } from '@/lib/ethosApi';
import type { TimeFilter, InfluencerStats } from '@/types';

// Map Debias user to InfluencerStats format
// IMPORTANT: Preserve real analysis data from API if present
function mapToInfluencerStats(user: EthosUser): InfluencerStats {
  // Check if this user has real analysis data (from backend enrichment)
  const hasRealData = (user as any).isRealData && (user as any).totalCalls > 0;

  if (hasRealData) {
    // Use the real analyzed data from API
    return {
      username: user.username,
      avatarUrl: user.avatarUrl,
      successRate: (user as any).successRate || 0,
      avgRoi: (user as any).avgRoi || 0,
      totalCalls: (user as any).totalCalls || 0,
      totalRoi: (user as any).totalRoi || 0,
      score: user.score,
      rankChange: 0,
      avgGain: (user as any).avgRoi || 0, // Use avgRoi for avgGain too
      avgMax: Math.abs((user as any).avgRoi || 0) * 1.5,
      activeCalls: Math.min((user as any).totalCalls || 0, 20),
      isRealData: true,
      isVip: (user as any).isVip || false,
    };
  }

  // Fallback for users without real analysis data
  const totalReviews = user.positiveReviews + user.negativeReviews;
  const successRate = totalReviews > 0
    ? (user.positiveReviews / totalReviews) * 100
    : 0;

  return {
    username: user.username,
    avatarUrl: user.avatarUrl,
    successRate,
    avgRoi: user.influenceFactor, // Using influence factor as a proxy for avg ROI
    totalCalls: totalReviews,
    totalRoi: user.xpTotal / 1000, // XP as proxy for total ROI
    score: user.score,
    rankChange: 0,
    avgGain: user.influenceFactor,
    avgMax: user.influencePercentile,
    activeCalls: user.vouchCount,
    isRealData: false,
    isVip: (user as any).isVip || false,
  };
}

export default function Home() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<InfluencerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string>('');
  const [isLimitationsOpen, setIsLimitationsOpen] = useState(false);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      const data = await fetchLeaderboard();
      if (data) {
        setUsers(data.users.map(mapToInfluencerStats));
        setFetchedAt(data.fetched_at);
      }
      setLoading(false);
    }
    loadLeaderboard();
  }, []);

  const filteredData = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Leaderboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLimitationsOpen(true)}
            className="text-xs text-yellow-500/80 hover:text-yellow-500 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Limitations & Issues
          </button>
          {fetchedAt && (
            <span className="text-xs text-gray-600">
              Updated: {new Date(fetchedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Constraints Modal */}
      <LimitationsModal
        isOpen={isLimitationsOpen}
        onClose={() => setIsLimitationsOpen(false)}
      />

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        {/* Time Filters */}
        <div className="flex items-center gap-0.5 bg-[#141414] rounded-lg p-1">
          {(['all', 'year', 'month', 'week'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${timeFilter === filter
                ? 'bg-[#1f1f1f] text-white'
                : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Only */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 py-1.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a] w-52"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">⌘ F</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-[#141414] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading leaderboard...</div>
          </div>
        ) : (
          <LeaderboardTable data={filteredData} timeFilter={timeFilter} />
        )}
      </div>
    </div>
  );
}
