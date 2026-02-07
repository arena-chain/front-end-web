import { Plus, Hash, Users, MoreVertical } from 'lucide-react';
import { Button } from '../../components/ui/core';

export default function Channels() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Channel Management</h1>
                    <p className="text-text-muted">Manage chat channels, community groups, and announcements.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Channel
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { name: 'General', type: 'Public', members: 12543, active: true },
                    { name: 'Tournaments', type: 'Public', members: 8902, active: true },
                    { name: 'Support', type: 'Private', members: 54, active: true },
                    { name: 'Announcements', type: 'Public (Read Only)', members: 15321, active: true },
                    { name: 'Team Recruiting', type: 'Public', members: 3421, active: true },
                    { name: 'Admin Chat', type: 'Private', members: 12, active: true },
                ].map((channel, i) => (
                    <div key={i} className="bg-surface border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-lg text-white group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                <Hash className="w-6 h-6" />
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-muted hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">{channel.name}</h3>
                        <div className="text-sm text-text-muted mb-6">{channel.type}</div>

                        <div className="flex items-center justify-between text-sm text-text-muted pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {channel.members.toLocaleString()} members
                            </div>
                            {channel.active && (
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Active
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
