"use client";

import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';

export const TradingChart = ({ assetId }: { assetId: string }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#16171D' },
                textColor: '#8E919C',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 136, 0.03)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.05)',
            },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#00FF88',
            downColor: '#FF4D4D',
            borderVisible: false,
            wickUpColor: '#00FF88',
            wickDownColor: '#FF4D4D',
        });

        // Mock initial data
        const mockData = Array.from({ length: 100 }, (_, i) => ({
            time: ((Date.now() / 1000) - (100 - i) * 3600) as UTCTimestamp,
            open: 10 + Math.random() * 5,
            high: 16 + Math.random() * 2,
            low: 8 + Math.random() * 2,
            close: 12 + Math.random() * 4,
        }));

        candlestickSeries.setData(mockData);

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [assetId]);

    return <div ref={chartContainerRef} className="w-full h-full" />;
};
