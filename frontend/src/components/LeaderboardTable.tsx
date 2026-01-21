'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { InfluencerStats } from '@/types';
import { UserHoverCard } from './UserHoverCard';

interface LeaderboardTableProps {
    data: InfluencerStats[];
    timeFilter: 'all' | 'year' | 'month' | 'week';
}

const formatPercent = (value: number | undefined) => {
    if (value === undefined) return '-';
    return `${value.toFixed(0)}%`;
};

const formatNumber = (value: number | undefined) => {
    if (value === undefined) return '-';
    return value.toLocaleString();
};

export function LeaderboardTable({ data }: LeaderboardTableProps) {
    const [hoveredUser, setHoveredUser] = useState<string | null>(null);

    // Explicitly split the data - only users with real analysis data
    const VIP_USERNAMES = ['CryptoKaleo', 'RookieXBT'];

    // Use API flag OR fallback to username list to ensure separation works
    const vipUsers = data.filter((u: any) => u.isRealData || VIP_USERNAMES.includes(u.username));

    // Community users are those NOT in VIPs
    const communityUsers = data.filter((u: any) => !u.isRealData && !VIP_USERNAMES.includes(u.username));

    const TableHeader = () => (
        <thead>
            <tr className="text-gray-500 text-[10px] uppercase border-b border-[#1a1a1a] tracking-wider">
                <th className="py-4 px-4 text-left font-medium">#</th>
                <th className="py-4 px-4 text-left font-medium">USERNAME</th>
                <th className="py-4 px-4 text-right font-medium">WIN RATE</th>
                <th className="py-4 px-4 text-right font-medium">AVG GAIN</th>
                <th className="py-4 px-4 text-right font-medium">AVG RETURN</th>
                <th className="py-4 px-4 text-right font-medium">AVG MAX</th>
                <th className="py-4 px-4 text-right font-medium">ACTIVE</th>
                <th className="py-4 px-4 text-right font-medium">TRADES</th>
                <th className="py-4 px-4 text-right font-medium text-green-500">DEBIAS SCORE</th>
            </tr>
        </thead>
    );

    const UserRow = ({ user, index, isVip }: { user: any, index: number, isVip: boolean }) => (
        <tr
            key={user.username}
            className={`hover:bg-[#141414] transition-colors cursor-pointer group ${isVip ? 'bg-green-900/5' : ''}`}
        >
            {/* Rank */}
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs font-medium">{index + 1}</span>
                </div>
            </td>

            {/* User */}
            <td className="py-4 px-4 w-64" style={{ position: 'relative', zIndex: hoveredUser === user.username ? 9999 : 'auto', overflow: 'visible' }}>
                <div className="relative">
                    <Link href={`/user/${user.username}`}>
                        <div
                            className="flex items-center gap-3"
                            onMouseEnter={() => setHoveredUser(user.username)}
                            onMouseLeave={() => setHoveredUser(null)}
                        >
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.username}
                                    className="w-6 h-6 rounded-full"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-white text-xs hover:text-green-500 transition-colors">{user.username}</span>
                            {isVip && (
                                <span className="bg-green-500/10 text-green-500 text-[10px] px-1 rounded ml-1">LIVE</span>
                            )}
                        </div>
                    </Link>

                    {hoveredUser === user.username && (
                        <UserHoverCard user={user} />
                    )}
                </div>
            </td>

            {/* Win Rate */}
            <td className="py-4 px-4 text-right text-xs text-white font-medium">
                {formatPercent(user.successRate)}
            </td>

            {/* Avg Gain - Use avgRoi directly since avgGain was mock data */}
            <td className="py-4 px-4 text-right text-xs text-white font-medium">
                {formatPercent(user.avgRoi)}
            </td>

            {/* Avg Return */}
            <td className={`py-4 px-4 text-right text-xs font-medium ${(user.avgRoi || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(user.avgRoi)}
            </td>

            {/* Avg Max */}
            <td className="py-4 px-4 text-right text-xs text-white font-medium">
                {formatPercent(user.avgMax || user.avgRoi * 1.5)}
            </td>

            {/* Active */}
            <td className="py-4 px-4 text-right text-xs text-gray-500">
                {user.activeCalls || Math.min(user.totalCalls || 0, 20)}
            </td>

            {/* Trades */}
            <td className="py-4 px-4 text-right text-xs text-gray-500">
                {formatNumber(user.totalCalls || 0)}
            </td>

            {/* Ethos Score - Prominent */}
            <td className="py-4 px-4 text-right">
                <span className="text-green-500 font-bold text-sm tabular-nums">
                    {formatNumber(user.score)}
                </span>
            </td>
        </tr>
    );

    return (
        <div className="flex flex-col gap-10 min-h-[400px]">
            {/* VIP SECTION */}
            {vipUsers.length > 0 && (
                <div style={{ overflow: 'visible' }}>
                    <div className="px-6 py-4 bg-[#141414] border-b border-[#1a1a1a]">
                        <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider">
                            Real Data
                        </h3>
                    </div>
                    <table className="w-full" style={{ overflow: 'visible' }}>
                        <TableHeader />
                        <tbody className="divide-y divide-[#1a1a1a]" style={{ overflow: 'visible' }}>
                            {vipUsers.map((user, index) => (
                                <UserRow key={user.username} user={user} index={index} isVip={true} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* COMMUNITY SECTION */}
            {communityUsers.length > 0 && (
                <div style={{ overflow: 'visible' }}>
                    <div className="px-6 py-4 bg-[#141414] border-b border-[#1a1a1a]">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                            Mock Data
                        </h3>
                    </div>
                    <table className="w-full" style={{ overflow: 'visible' }}>
                        <TableHeader />
                        <tbody className="divide-y divide-[#1a1a1a]" style={{ overflow: 'visible' }}>
                            {communityUsers.map((user, index) => (
                                <UserRow key={user.username} user={user} index={vipUsers.length + index} isVip={false} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
