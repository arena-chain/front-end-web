import { useState, useEffect } from 'react';

interface CountdownTimerProps {
    expiresAt: string; // ISO date string
    onExpire?: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = new Date(expiresAt).getTime() - new Date().getTime();

        if (difference <= 0) {
            return { minutes: 0, seconds: 0, total: 0 };
        }

        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return { minutes, seconds, total: difference };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.total <= 0) {
                clearInterval(timer);
                onExpire?.();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt, onExpire]);

    const percentage = (timeLeft.total / (15 * 60 * 1000)) * 100; // 15 minutes = 900000ms
    const isWarning = timeLeft.minutes < 5;
    const isUrgent = timeLeft.minutes < 1;

    const getColor = () => {
        if (isUrgent) return 'text-red-400';
        if (isWarning) return 'text-yellow-400';
        return 'text-primary';
    };

    const getGlowColor = () => {
        if (isUrgent) return 'shadow-[0_0_30px_rgba(255,68,68,0.5)]';
        if (isWarning) return 'shadow-[0_0_30px_rgba(255,170,0,0.5)]';
        return 'shadow-[0_0_30px_rgba(0,255,136,0.5)]';
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Circular Progress */}
            <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="none"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                        className={`transition-all duration-1000 ${getColor()}`}
                    />
                </svg>

                {/* Time Display */}
                <div className={`absolute inset-0 flex items-center justify-center ${isUrgent ? 'animate-pulse' : ''}`}>
                    <div className={`text-center ${getColor()}`}>
                        <div className={`text-3xl font-black tabular-nums ${getGlowColor()}`}>
                            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Messages */}
            <div className="text-center">
                {isUrgent ? (
                    <p className="text-sm font-bold text-red-400 animate-pulse">
                        ⚠️ Hurry! Reservation expiring soon!
                    </p>
                ) : isWarning ? (
                    <p className="text-sm font-medium text-yellow-400">
                        ⏰ Less than 5 minutes remaining
                    </p>
                ) : (
                    <p className="text-sm text-text-muted">
                        Time remaining to complete payment
                    </p>
                )}
            </div>
        </div>
    );
}
