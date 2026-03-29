import { TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Dashboard Overview</h1>
                <p className="text-text-muted">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Total Users" value="12,345" />
                <StatCard title="Active Tournaments" value="24" />
            </div>

            {/* Recent Activity & Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Large Chart Area - Placeholder */}
                <div className="lg:col-span-2 bg-surface border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Platform Activity</h3>
                        <Activity className="w-5 h-5 text-text-muted" />
                    </div>
                    <div className="h-64 flex items-center justify-center bg-black/20 rounded-lg border border-white/5 border-dashed">
                        {/* Placeholder graphic */}
                        <div className="text-text-muted flex flex-col items-center gap-2">
                            <TrendingUp className="w-8 h-8 opacity-20" />
                            <span className="text-sm">Activity Chart Component</span>
                        </div>
                    </div>
                </div>

                {/* Recent Items List */}
                <div className="bg-surface border border-white/5 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Registrations</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                    U{i}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">PlayerOne_{i}</div>
                                    <div className="text-xs text-text-muted">Registered 2 mins ago</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-surface border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,0,0.05)] group">
            <h3 className="text-text-muted text-sm font-medium uppercase tracking-wider">{title}</h3>
            <div className="text-3xl font-black text-white mt-1 group-hover:scale-105 transition-transform origin-left">{value}</div>
        </div>
    );
}
