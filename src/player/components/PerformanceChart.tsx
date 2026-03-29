import { useState } from 'react';
import { TrendingUp, Trophy } from 'lucide-react';

interface DataPoint {
    label: string;
    valorant: number;
    lol: number;
}

const MOCK_HISTORY: DataPoint[] = [
    { label: 'Jan', valorant: 1200, lol: 1100 },
    { label: 'Feb', valorant: 1350, lol: 1150 },
    { label: 'Mar', valorant: 1250, lol: 1300 },
    { label: 'Apr', valorant: 1400, lol: 1250 },
    { label: 'May', valorant: 1550, lol: 1400 },
    { label: 'Jun', valorant: 1500, lol: 1550 },
    { label: 'Jul', valorant: 1650, lol: 1500 },
    { label: 'Aug', valorant: 1800, lol: 1650 },
    { label: 'Sep', valorant: 1750, lol: 1800 },
    { label: 'Oct', valorant: 1950, lol: 1900 },
];

export function PerformanceChart() {
    // Interactive state tracking both index and specific series
    const [hovered, setHovered] = useState<{ index: number; series: 'valorant' | 'lol' } | null>(null);

    // Chart dimensions
    const width = 800;
    const height = 220;
    const padding = 20;

    const data = MOCK_HISTORY;

    // Calculate min/max across all datasets
    const allValues = data.flatMap(d => [d.valorant, d.lol]);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    // Add some buffer to the range
    const range = maxValue - minValue;
    const yMin = minValue - range * 0.1;
    const yMax = maxValue + range * 0.1;

    // Helper to scale values to coordinates
    const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
    const getY = (value: number) => height - padding - ((value - yMin) / (yMax - yMin)) * (height - 2 * padding);

    // Generate paths
    const generatePath = (key: keyof Pick<DataPoint, 'valorant' | 'lol'>) =>
        data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`).join(' ');

    const valorantPath = generatePath('valorant');
    const lolPath = generatePath('lol');

    const COLORS = {
        valorant: '#ff4655', // Valorant Red
        lol: '#c1a058'      // LoL Gold
    };

    // Opacity helper
    const getOpacity = (series: 'valorant' | 'lol') => {
        if (!hovered) return 0.9;
        return hovered.series === series ? 1 : 0.2;
    };

    return (
        <div className="bg-surface border border-white/5 rounded-xl p-5 h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-white mb-0.5 uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Performance History
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                        <div className={`flex items-center gap-1.5 transition-opacity duration-200 ${hovered && hovered.series !== 'valorant' ? 'opacity-30' : 'opacity-100'}`}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.valorant }} />
                            <span className="text-text-muted">Valorant (MMR)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 transition-opacity duration-200 ${hovered && hovered.series !== 'lol' ? 'opacity-30' : 'opacity-100'}`}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.lol }} />
                            <span className="text-text-muted">League of Legends (LP)</span>
                        </div>
                    </div>
                </div>
                {/* Optional Top Stat */}
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-text-muted uppercase font-bold">Total Wins</p>
                    <p className="text-xl font-black text-white flex items-center justify-end gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" /> 342
                    </p>
                </div>
            </div>

            {/* Chart Container */}
            <div className="w-full relative flex-1 min-h-0 flex items-end">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    className="w-full h-full"
                    style={{ overflow: 'visible' }}
                    onMouseLeave={() => setHovered(null)}
                >
                    {/* Definitions for Gradients/Filters */}
                    <defs>
                        <filter id="glow-valorant" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="glow-lol" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.33, 0.66, 1].map((tick) => {
                        const y = padding + tick * (height - 2 * padding);
                        return (
                            <line
                                key={tick}
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                stroke="#ffffff"
                                strokeOpacity="0.05"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Valorant Line */}
                    <path
                        d={valorantPath}
                        fill="none"
                        stroke={COLORS.valorant}
                        strokeWidth={hovered?.series === 'valorant' ? "4" : "2.5"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={hovered?.series === 'valorant' ? "url(#glow-valorant)" : undefined}
                        className="transition-all duration-300"
                        style={{ opacity: getOpacity('valorant') }}
                    />

                    {/* LoL Line */}
                    <path
                        d={lolPath}
                        fill="none"
                        stroke={COLORS.lol}
                        strokeWidth={hovered?.series === 'lol' ? "4" : "2.5"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={hovered?.series === 'lol' ? "url(#glow-lol)" : undefined}
                        className="transition-all duration-300"
                        style={{ opacity: getOpacity('lol') }}
                    />

                    {/* Interactive Hit Areas & Points */}
                    {data.map((d, i) => (
                        <g key={i}>
                            {/* Valorant Interaction Group */}
                            <g
                                onMouseEnter={() => setHovered({ index: i, series: 'valorant' })}
                                className="cursor-pointer"
                            >
                                {/* Invisible large hit circle */}
                                <circle cx={getX(i)} cy={getY(d.valorant)} r="24" fill="transparent" />

                                {/* Visible Point (only show when hovered or idle) */}
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.valorant)}
                                    r={hovered?.index === i && hovered?.series === 'valorant' ? 6 : 0}
                                    fill={COLORS.valorant}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="transition-all duration-200 pointer-events-none"
                                    style={{ opacity: getOpacity('valorant') }}
                                />
                            </g>

                            {/* LoL Interaction Group */}
                            <g
                                onMouseEnter={() => setHovered({ index: i, series: 'lol' })}
                                className="cursor-pointer"
                            >
                                {/* Invisible large hit circle */}
                                <circle cx={getX(i)} cy={getY(d.lol)} r="24" fill="transparent" />

                                {/* Visible Point */}
                                <circle
                                    cx={getX(i)}
                                    cy={getY(d.lol)}
                                    r={hovered?.index === i && hovered?.series === 'lol' ? 6 : 0}
                                    fill={COLORS.lol}
                                    stroke="white"
                                    strokeWidth="2"
                                    className="transition-all duration-200 pointer-events-none"
                                    style={{ opacity: getOpacity('lol') }}
                                />
                            </g>
                        </g>
                    ))}

                    {/* Single Tooltip based on active selection */}
                    {hovered && (
                        <g pointerEvents="none">
                            <foreignObject
                                x={Math.min(getX(hovered.index) + 10, width - 150)}
                                y={Math.min(getY(data[hovered.index][hovered.series]) - 60, height - 80)}
                                width="120"
                                height="60"
                            >
                                <div
                                    className="bg-surface/95 backdrop-blur border rounded-lg p-2.5 text-xs shadow-xl transition-all duration-200"
                                    style={{ borderColor: COLORS[hovered.series] }}
                                >
                                    <div className="font-bold text-white mb-1 border-b border-white/10 pb-1 flex justify-between">
                                        <span>{data[hovered.index].label}</span>
                                        <span className="text-text-muted uppercase text-[10px]">{hovered.series === 'valorant' ? 'VAL' : 'LOL'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-text-muted">{hovered.series === 'valorant' ? 'MMR' : 'LP'}</span>
                                        <span className="font-bold text-sm" style={{ color: COLORS[hovered.series] }}>
                                            {data[hovered.index][hovered.series]}
                                        </span>
                                    </div>
                                </div>
                            </foreignObject>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}
