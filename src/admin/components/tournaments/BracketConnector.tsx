import React from 'react';

interface BracketConnectorProps {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    thickness?: number;
    glow?: boolean;
}

const BracketConnector: React.FC<BracketConnectorProps> = ({
    startX,
    startY,
    endX,
    endY,
    color = '#00ff88',
    thickness = 2,
    glow = true
}) => {
    // Calculate the horizontal midpoint for the elbow
    const midX = startX + (endX - startX) / 2;

    // Create an orthogonal path (L-shape/Step shape)
    const pathData = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;

    return (
        <g>
            {/* Glow effect */}
            {glow && (
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={thickness + 4}
                    strokeOpacity={0.15}
                    className="blur-sm"
                />
            )}

            {/* Main Path */}
            <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 opacity-30"
            />
        </g>
    );
};

export default BracketConnector;
