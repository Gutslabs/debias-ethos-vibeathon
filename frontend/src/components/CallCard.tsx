'use client';

import type { CallAnalysis } from '@/types';

interface CallCardProps {
    call: CallAnalysis;
}

export function CallCard({ call }: CallCardProps) {
    const isPositive = (call.roiPercent ?? 0) >= 0;
    const roi = call.roiPercent ?? 0;

    // Format date nicely
    // Format date nicely
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit'
            });

            return `${formattedDate} (${diffDays} days ago)`;
        } catch {
            return dateStr;
        }
    };

    // Format price
    const formatPrice = (price?: number) => {
        if (!price) return '-';
        if (price < 0.01) return `$${price.toFixed(6)}`;
        if (price < 1) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(2)}`;
    };

    // Truncate tweet text
    const truncateText = (text: string, maxLen: number = 120) => {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '...';
    };

    // Generate chart path for mini sparkline
    const chartPoints = (call.chartData && call.chartData.length > 2)
        ? call.chartData
        : Array.from({ length: 20 }, (_, i) => {
            const base = call.priceAtCall || 100;
            const current = call.currentPrice || base;
            const progress = i / 19;
            const noise = (Math.random() - 0.5) * 0.03 * base;
            return base + (current - base) * progress + noise;
        });

    const minY = Math.min(...chartPoints);
    const maxY = Math.max(...chartPoints);
    const range = maxY - minY || 1;

    const svgPath = chartPoints
        .map((y, i) => {
            const x = (i / (chartPoints.length - 1)) * 100;
            const normalizedY = 30 - ((y - minY) / range) * 25;
            return `${i === 0 ? 'M' : 'L'} ${x} ${normalizedY}`;
        })
        .join(' ');

    return (
        <div className="bg-[#141414] rounded-xl p-5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
            {/* Header: Ticker + ROI + Chart */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-white text-sm font-bold">
                        {call.ticker.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">${call.ticker}</span>
                            <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{roi.toFixed(1)}%
                            </span>
                        </div>
                        <div className="text-gray-500 text-xs">
                            {formatDate(call.tweetDate)}
                        </div>
                    </div>
                </div>

                {/* Mini Chart */}
                <div className="w-24 h-8">
                    <svg viewBox="0 0 100 35" className="w-full h-full">
                        <path
                            d={svgPath}
                            fill="none"
                            stroke={isPositive ? '#22c55e' : '#ef4444'}
                            strokeWidth="1.5"
                        />
                    </svg>
                </div>
            </div>

            {/* Tweet Text */}
            <div className="mb-4">
                <p className="text-gray-400 text-sm leading-relaxed">
                    {truncateText(call.tweetText)}
                </p>
            </div>

            {/* Price Info */}
            <div className="grid grid-cols-2 gap-4 mb-3 py-3 border-t border-b border-[#1a1a1a]">
                <div>
                    <div className="text-gray-600 text-[10px] uppercase font-medium mb-1">Price at Call</div>
                    <div className="text-white text-sm font-medium">{formatPrice(call.priceAtCall)}</div>
                </div>
                <div>
                    <div className="text-gray-600 text-[10px] uppercase font-medium mb-1">Current Price</div>
                    <div className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPrice(call.currentPrice)}
                    </div>
                </div>
            </div>

            {/* Footer: Link to tweet */}
            <div className="flex items-center justify-between">
                <a
                    href={`https://twitter.com/${call.username}/status/${call.tweetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 text-xs hover:text-green-500 transition-colors"
                >
                    View Tweet →
                </a>
                <div className="text-gray-600 text-xs">
                    {call.chain?.toUpperCase() || 'CRYPTO'}
                </div>
            </div>
        </div>
    );
}
