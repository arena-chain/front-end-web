import React from 'react';
import { Button } from '../../components/ui/core';
import { Swords, Clock, Trophy } from 'lucide-react';

export default function PlayerDashboard() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Find Match Section */}
            <div className="bg-gradient-to-r from-primary/20 to-purple-900/20 border border-primary/20 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">
                        Ready to Compet?
                    </h1>
                    <p className="text-text-muted max-w-xl mb-8">
                        Join the queue now and prove your skills in ranked matches. Climb the operational leaderboard and earn rewards.
                    </p>
                    <div className="flex gap-4">
                        <Button size="lg" className="px-8 shadow-lg shadow-primary/20">
                            <Swords className="mr-2 h-5 w-5" />
                            Find Match
                        </Button>
                        <Button variant="outline" size="lg">
                            <Clock className="mr-2 h-5 w-5" />
                            Scheduled Scrims
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={<Trophy className="w-6 h-6 text-yellow-500" />}
                    label="Current Rank"
                    value="Diamond II"
                    subtext="Top 5%"
                />
                <StatCard
                    icon={<Swords className="w-6 h-6 text-primary" />}
                    label="Matches Won"
                    value="142"
                    subtext="Win Rate: 68%"
                />
                <StatCard
                    icon={<Clock className="w-6 h-6 text-blue-500" />}
                    label="Hours Played"
                    value="840h"
                    subtext="Last session: 2h ago"
                />
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext: string }) {
    return (
        <div className="bg-surface border border-white/5 rounded-xl p-6 hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/5 rounded-lg">
                    {icon}
                </div>
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{value}</div>
            <div className="text-sm text-text-muted">{subtext}</div>
        </div>
    );
}
