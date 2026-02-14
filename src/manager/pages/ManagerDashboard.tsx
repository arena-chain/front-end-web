import { Users, Trophy, TrendingUp } from 'lucide-react';

export default function ManagerDashboard() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Team Overview</h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={<Users className="w-6 h-6 text-primary" />}
                    label="Active Roster"
                    value="5 Players"
                    subtext="2 Substitutes"
                />
                <StatCard
                    icon={<Trophy className="w-6 h-6 text-yellow-500" />}
                    label="Tournament Wins"
                    value="12"
                    subtext="Season 3"
                />
                <StatCard
                    icon={<TrendingUp className="w-6 h-6 text-green-500" />}
                    label="Team Ranking"
                    value="#4 Global"
                    subtext="+2 this week"
                />
            </div>

            {/* Recent Activity or Roster Preview could go here */}
            <div className="bg-surface border border-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Upcoming Schedule</h2>
                <p className="text-text-muted">No upcoming matches scheduled.</p>
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
