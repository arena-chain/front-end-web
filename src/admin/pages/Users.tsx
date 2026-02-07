import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Shield, User, Users as UsersIcon, Gavel, Crown } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';

export default function Users() {
    const [activeTab, setActiveTab] = useState<'players' | 'managers' | 'referees' | 'admins' | 'teams'>('players');

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">User Management</h1>
                    <p className="text-text-muted">Manage all users, teams, and administrative roles.</p>
                </div>
                <div className="flex gap-2">
                    <Button>Add New User</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
                <TabButton
                    active={activeTab === 'players'}
                    onClick={() => setActiveTab('players')}
                    icon={<User size={16} />}
                    label="Players"
                />
                <TabButton
                    active={activeTab === 'teams'}
                    onClick={() => setActiveTab('teams')}
                    icon={<UsersIcon size={16} />}
                    label="Teams"
                />
                <TabButton
                    active={activeTab === 'managers'}
                    onClick={() => setActiveTab('managers')}
                    icon={<Shield size={16} />}
                    label="Team Managers"
                />
                <TabButton
                    active={activeTab === 'referees'}
                    onClick={() => setActiveTab('referees')}
                    icon={<Gavel size={16} />}
                    label="Referees"
                />
                <TabButton
                    active={activeTab === 'admins'}
                    onClick={() => setActiveTab('admins')}
                    icon={<Crown size={16} />}
                    label="Admins"
                />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 bg-surface border border-white/5 p-4 rounded-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input className="pl-10 bg-black/20 border-white/5" placeholder="Search by name, email, or ID..." />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                </Button>
            </div>

            {/* Content Area */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">User / Team</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Status</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Role</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Joined</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Mock Data */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                                {activeTab === 'teams' ? 'T' : 'U'}{i}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">
                                                    {activeTab === 'teams' ? `Team Alpha ${i}` : `User Name ${i}`}
                                                </div>
                                                <div className="text-xs text-text-muted">
                                                    {activeTab === 'teams' ? 'Captain: PlayerOne' : 'user@example.com'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                            Active
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-text-muted capitalize">
                                        {activeTab.slice(0, -1)}
                                    </td>
                                    <td className="p-4 text-sm text-text-muted">
                                        Oct 24, 2025
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-text-muted">
                    <span>Showing 1-5 of 24 results</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(0,255,0,0.3)] scale-105'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
}
