"use client";

import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import type { NftAvatar } from '../../services/nftService';

export const TradingChart = ({ asset }: { asset: NftAvatar | null }) => {
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

        const basePrice = asset?.listPrice ?? asset?.price ?? 15;
        let currentPrice = basePrice * 0.8; // Start 20% lower

        // Mock initial data trending towards current price
        const mockData = Array.from({ length: 100 }, (_, i) => {
            const volatility = basePrice * 0.05;
            const open = currentPrice;
            const close = currentPrice + (Math.random() - 0.45) * volatility;
            const high = Math.max(open, close) + Math.random() * volatility * 0.5;
            const low = Math.min(open, close) - Math.random() * volatility * 0.5;
            
            // Trend towards basePrice
            if (i > 50 && currentPrice < basePrice) currentPrice += volatility * 0.1;
            else currentPrice = close;

            return {
                time: ((Date.now() / 1000) - (100 - i) * 3600) as UTCTimestamp,
                open,
                high,
                low,
                close,
            };
        });

        candlestickSeries.setData(mockData);

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [asset?._id]);

    return <div ref={chartContainerRef} className="w-full h-full" />;
};
