import React from 'react';
import { Button } from '../../components/ui/core';
import { Swords, Clock, Trophy } from 'lucide-react';
import { PerformanceChart } from '../components/PerformanceChart';

export default function PlayerDashboard() {
    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-100px)] animate-fade-in-up">
            {/* Find Match Section */}
            <div className="bg-gradient-to-r from-primary/20 to-purple-900/20 border border-primary/20 rounded-xl p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
                            Ready to Compete?
                        </h1>
                        <p className="text-sm text-text-muted max-w-xl mb-4">
                            Join the queue now and prove your skills in ranked matches.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-wider px-8 py-6 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all transform hover:scale-105 border-none"
                        >
                            <Swords className="mr-2 h-5 w-5" />
                            Find Match
                        </Button>
                        <Button
                            variant="outline"
                            className="border-white/10 hover:border-white/30 hover:bg-white/5 text-white font-bold uppercase tracking-wider px-8 py-6"
                        >
                            <Clock className="mr-2 h-5 w-5" />
                            Scrims
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4 shrink-0">
                <StatCard
                    icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                    label="Current Rank"
                    value="Diamond II"
                    subtext="Top 5%"
                />
                <StatCard
                    icon={<Swords className="w-5 h-5 text-primary" />}
                    label="Matches Won"
                    value="142"
                    subtext="Win Rate: 68%"
                />
                <StatCard
                    icon={<Clock className="w-5 h-5 text-blue-500" />}
                    label="Hours Played"
                    value="840h"
                    subtext="Last session: 2h ago"
                />
            </div>

            {/* Performance Chart */}
            <div className="flex-1 min-h-0">
                <PerformanceChart />
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext: string }) {
    return (
        <div className="bg-surface border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-white/5 rounded-lg">
                    {icon}
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-black text-white mb-0.5">{value}</div>
            <div className="text-xs text-text-muted">{subtext}</div>
        </div>
    );
}
