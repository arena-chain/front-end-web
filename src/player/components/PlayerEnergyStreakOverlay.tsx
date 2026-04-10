type Strike = {
    x: number;
    y: number;
    delay: number;
    duration: number;
    length: number;
};

function seeded(seed: number) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
}

const rand = seeded(94731);
const STRIKES: Strike[] = Array.from({ length: 22 }, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const rowOffset = row % 2 === 0 ? 0 : 7.2;
    return {
        x: 10 + col * 15 + rowOffset + rand() * 2.2,
        y: 16 + row * 18 + rand() * 3,
        delay: rand() * 11,
        duration: 4.8 + rand() * 4.6,
        length: 42 + rand() * 22,
    };
});

export default function PlayerEnergyStreakOverlay() {
    return (
        <>
            <style>
                {`
                .player-energy-streak-overlay {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 1;
                    overflow: hidden;
                }

                .player-energy-streak-overlay__strike {
                    position: absolute;
                    height: 2px;
                    transform-origin: left center;
                    transform: rotate(128deg);
                    mix-blend-mode: screen;
                    border-radius: 999px;
                    background: linear-gradient(
                        90deg,
                        rgba(0, 255, 136, 0) 0%,
                        rgba(0, 255, 136, 0.07) 42%,
                        rgba(128, 255, 194, 0.15) 50%,
                        rgba(0, 255, 136, 0.06) 58%,
                        rgba(0, 255, 136, 0) 100%
                    );
                    filter: blur(0.25px);
                    opacity: 0;
                    will-change: opacity, transform;
                    animation-name: player-energy-strike;
                    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                    animation-iteration-count: infinite;
                }

                @keyframes player-energy-strike {
                    0%, 72%, 100% {
                        opacity: 0;
                        transform: rotate(128deg) translate3d(-6px, 0, 0) scaleX(0.92);
                    }
                    12% {
                        opacity: 0.075;
                        transform: rotate(128deg) translate3d(0, 0, 0) scaleX(1);
                    }
                    24% {
                        opacity: 0.025;
                        transform: rotate(128deg) translate3d(8px, 0, 0) scaleX(1.02);
                    }
                }
                `}
            </style>

            <div className="player-energy-streak-overlay" aria-hidden>
                {STRIKES.map((strike, index) => (
                    <span
                        key={`${strike.x}-${strike.y}-${index}`}
                        className="player-energy-streak-overlay__strike"
                        style={{
                            left: `${strike.x}%`,
                            top: `${strike.y}%`,
                            width: `${strike.length}px`,
                            animationDelay: `${strike.delay}s`,
                            animationDuration: `${strike.duration}s`,
                        }}
                    />
                ))}
            </div>
        </>
    );
}
