import { useId } from 'react';

const HEX_D = 'M34.641 0 L69.282 20 L69.282 60 L34.641 80 L0 60 L0 20 Z';

export default function PlayerAmbientBackground() {
    const uid = useId().replace(/:/g, '');
    const gridPattern = `player-hex-grid-${uid}`;
    const glowPattern = `player-hex-glow-${uid}`;
    const gridMask = `hex-mask-grid-${uid}`;
    const glowMask = `hex-mask-glow-${uid}`;
    const rainbowGrad = `rainbow-grad-${uid}`;

    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <div className="absolute inset-0 bg-[#030604]" />

            {/* Background radiant glow - also animate the hue rotate so it matches the vibe */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse at 32% 64%, rgba(0,255,136,0.11) 0%, rgba(0,255,136,0.03) 24%, rgba(0,255,136,0) 56%), radial-gradient(ellipse at 68% 30%, rgba(0,255,136,0.08) 0%, rgba(0,255,136,0.02) 22%, rgba(0,255,136,0) 52%)',
                    animation: 'player-ambient-glow 8.5s ease-in-out infinite, player-hex-rgb-surface 4s linear infinite',
                }}
            />

            {/* Base Hexagon Grid Layer */}
            <svg 
                className="absolute inset-0 h-full w-full opacity-[0.25] mix-blend-screen" 
                preserveAspectRatio="xMidYMid slice"
                style={{ animation: 'player-hex-rgb-surface 4s linear infinite' }}
            >
                <defs>
                    <linearGradient id={rainbowGrad} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff0000" />
                        <stop offset="17%" stopColor="#ff00ff" />
                        <stop offset="33%" stopColor="#0000ff" />
                        <stop offset="50%" stopColor="#00ffff" />
                        <stop offset="67%" stopColor="#00ff00" />
                        <stop offset="83%" stopColor="#ffff00" />
                        <stop offset="100%" stopColor="#ff0000" />
                    </linearGradient>

                    <pattern id={gridPattern} width="69.282" height="120" patternUnits="userSpaceOnUse">
                        <rect width="69.282" height="120" fill="transparent" />
                        <path
                            d={HEX_D}
                            fill="none"
                            stroke="white"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                            style={{ animation: 'player-hex-line-breathe 5.6s ease-in-out infinite' }}
                        />
                        <g transform="translate(34.641 60)">
                            <path
                                d={HEX_D}
                                fill="none"
                                stroke="white"
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                                style={{ animation: 'player-hex-line-breathe 5.6s ease-in-out 0.35s infinite' }}
                            />
                        </g>
                    </pattern>

                    <mask id={gridMask}>
                        <rect width="100%" height="100%" fill={`url(#${gridPattern})`} />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${rainbowGrad})`} mask={`url(#${gridMask})`} />
            </svg>

            {/* Glowing Hexagon Layer */}
            <svg
                className="absolute inset-0 h-full w-full opacity-[0.35] mix-blend-screen"
                preserveAspectRatio="xMidYMid slice"
                style={{ animation: 'player-hex-breathe 5.8s ease-in-out infinite, player-hex-rgb-surface 4s linear infinite' }}
            >
                <defs>
                    <pattern id={glowPattern} width="69.282" height="120" patternUnits="userSpaceOnUse">
                        <rect width="69.282" height="120" fill="transparent" />
                        <path
                            d={HEX_D}
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            style={{ animation: 'player-hex-line-breathe-strong 5.6s ease-in-out infinite' }}
                        />
                        <g transform="translate(34.641 60)">
                            <path
                                d={HEX_D}
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                style={{ animation: 'player-hex-line-breathe-strong 5.6s ease-in-out 0.35s infinite' }}
                            />
                        </g>
                    </pattern>

                    <mask id={glowMask}>
                        <rect width="100%" height="100%" fill={`url(#${glowPattern})`} />
                    </mask>
                    
                    <filter id={`hex-soft-${uid}`} x="-12%" y="-12%" width="124%" height="124%">
                        <feGaussianBlur stdDeviation="1.5" />
                    </filter>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${rainbowGrad})`} mask={`url(#${glowMask})`} filter={`url(#hex-soft-${uid})`} />
            </svg>

            {/* Dark vignette to focus UI items */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_78%_at_50%_45%,transparent_30%,rgba(0,0,0,0.58)_100%)]" />
        </div>
    );
}
