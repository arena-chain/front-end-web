import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, User as UserIcon, Users as UsersIcon, Gavel, Crown, Loader2, Ban, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import { userService, type User } from '../../services/userService';
import { toast } from 'sonner';

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'player' | 'team_manager' | 'referee' | 'admin'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockToggle = async (user: User) => {
        try {
            if (user.isActive) {
                await userService.blockUser(user._id);
                toast.success('User blocked successfully');
            } else {
                await userService.unblockUser(user._id);
                toast.success('User unblocked successfully');
            }
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await userService.deleteUser(id);
            toast.success('User deleted');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Deletion failed');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user._id.includes(searchQuery);

        const matchesTab = activeTab === 'all' || (user.role || 'player') === activeTab;

        const matchesStatus =
            statusFilter === 'all' ? true :
                statusFilter === 'active' ? user.isActive : !user.isActive;

        return matchesSearch && matchesTab && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">User Management</h1>
                    <p className="text-text-muted">Manage all users, roles, and account statuses.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchUsers} variant="outline" size="sm" className="gap-2">
                        Refresh List
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
                <TabButton
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    icon={<UsersIcon size={16} />}
                    label="All Users"
                />
                <TabButton
                    active={activeTab === 'player'}
                    onClick={() => setActiveTab('player')}
                    icon={<UserIcon size={16} />}
                    label="Players"
                />
                <TabButton
                    active={activeTab === 'team_manager'}
                    onClick={() => setActiveTab('team_manager')}
                    icon={<Shield size={16} />}
                    label="Managers"
                />
                <TabButton
                    active={activeTab === 'referee'}
                    onClick={() => setActiveTab('referee')}
                    icon={<Gavel size={16} />}
                    label="Referees"
                />
                <TabButton
                    active={activeTab === 'admin'}
                    onClick={() => setActiveTab('admin')}
                    icon={<Crown size={16} />}
                    label="Admins"
                />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 bg-surface border border-white/5 p-4 rounded-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        className="pl-10 bg-black/20 border-white/5"
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-text-muted" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    >
                        <option value="all">Tous les Statuts</option>
                        <option value="active">Actif</option>
                        <option value="blocked">Bloqué</option>
                    </select>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-bold uppercase tracking-widest">Loading Users...</p>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">User</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Status</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Role</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Joined</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <UserIcon className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white capitalize">
                                                        {user.nickname}
                                                    </div>
                                                    <div className="text-xs text-text-muted lowercase">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                user.isActive
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            )}>
                                                {user.isActive ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                                            {user.role}
                                        </td>
                                        <td className="p-4 text-xs text-text-muted">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleBlockToggle(user)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors",
                                                        user.isActive ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-green-500/10 text-green-400'
                                                    )}
                                                    title={user.isActive ? 'Block User' : 'Unblock User'}
                                                >
                                                    {user.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-2 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-20 text-text-muted">
                            <div className="mb-4 flex justify-center">
                                <Search className="w-12 h-12 opacity-20" />
                            </div>
                            <p className="font-bold uppercase tracking-widest text-sm">No users found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

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
