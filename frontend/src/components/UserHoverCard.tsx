'use client';

import { useState } from 'react';
import type { InfluencerStats } from '@/types';

interface UserHoverCardProps {
    user: InfluencerStats;
}

export function UserHoverCard({ user }: UserHoverCardProps) {
    return (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 shadow-2xl z-[9999] animate-in fade-in zoom-in duration-200" style={{ pointerEvents: 'auto' }}>
            <div className="flex items-center gap-3 mb-4">
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm">{user.username}</span>
                        <span className="text-green-500 text-[10px]">⚡</span>
                    </div>
                    <div className="text-gray-500 text-[10px]">59 SUBSCRIBERS</div>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[9px] font-bold tracking-tight">
                    TOP 5
                </span>
                <span className="px-2 py-0.5 bg-[#1a1a1a] text-gray-400 rounded text-[9px] font-bold tracking-tight">
                    SERIAL TRADER
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                    <div className="text-white font-bold text-xs">{(user.successRate || 0).toFixed(0)}%</div>
                    <div className="text-gray-500 text-[8px] uppercase font-bold tracking-tighter">Win Rate</div>
                </div>
                <div className="text-center">
                    <div className="text-white font-bold text-xs">{(user.avgRoi || 0).toFixed(0)}%</div>
                    <div className="text-gray-500 text-[8px] uppercase font-bold tracking-tighter">Avg. Return</div>
                </div>
                <div className="text-center">
                    <div className="text-white font-bold text-xs">{user.totalCalls || 0}</div>
                    <div className="text-gray-500 text-[8px] uppercase font-bold tracking-tighter">Trades</div>
                </div>
            </div>

            <button className="w-full py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                Follow
            </button>
        </div>
    );
}
