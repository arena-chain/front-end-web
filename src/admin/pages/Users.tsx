import React, { useState, useEffect } from 'react';
import {
    Search, Shield, Gavel, Crown, Ban, CheckCircle, Trash2, Filter,
    Users as UsersIcon, User as UserIcon, FileText,
} from 'lucide-react';
import { Button, Input, Modal } from '../../components/ui/core';
import { UserService, type Profile, type ReportedPlayerRow, type User } from '../../services/userService';
import { AuthService } from '../../services/auth.service';

type AdminTab = 'all' | 'player' | 'team_manager' | 'referee' | 'admin' | 'reports' | 'blocked';

function normalizeApiRole(r: string | undefined): string {
    if (!r) return 'player';
    if (r === 'team-manager') return 'team_manager';
    return r;
}

function mapUserToProfileRow(u: User): Profile {
    return {
        _id: u._id,
        userId: u,
        createdAt: u.createdAt,
        role: u.role,
    };
}

function resolveUser(profile: Record<string, unknown>): {
    _id: string;
    nickname: string;
    email: string;
    isActive: boolean;
    role?: string;
    region?: string;
    country?: string;
    avatar?: string;
} | null {
    const uid = profile.userId as User | undefined;
    if (uid && uid._id) {
        return {
            _id: uid._id,
            nickname: uid.nickname ?? '',
            email: uid.email ?? '',
            isActive: !!uid.isActive,
            role: uid.role,
            region: uid.region,
            country: uid.country,
            avatar: uid.avatar,
        };
    }
    if (profile._id && profile.email) {
        return {
            _id: String(profile._id),
            nickname: String(profile.nickname ?? ''),
            email: String(profile.email),
            isActive: profile.isActive !== false,
            role: profile.role as string | undefined,
            region: profile.region as string | undefined,
            country: profile.country as string | undefined,
            avatar: profile.avatar as string | undefined,
        };
    }
    return null;
}

export default function Users() {
    const [activeTab, setActiveTab] = useState<AdminTab>('all');
    const [users, setUsers] = useState<(Profile | ReportedPlayerRow)[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nickname: '',
        role: 'player',
        organizationName: '',
        level: '',
        adminLevel: 1,
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let data: (Profile | ReportedPlayerRow)[] = [];
            switch (activeTab) {
                case 'reports':
                    data = await UserService.getReportedPlayers();
                    break;
                case 'blocked':
                    data = await UserService.getBlockedUsers();
                    break;
                case 'all': {
                    const all = await UserService.getAllUsers();
                    data = all.map(mapUserToProfileRow);
                    break;
                }
                case 'player':
                    data = await UserService.getPlayers();
                    break;
                case 'team_manager':
                    data = await UserService.getTeamManagers();
                    break;
                case 'referee':
                case 'admin': {
                    const all = await UserService.getAllUsers();
                    const wanted = activeTab;
                    data = all
                        .filter(u => normalizeApiRole(u.role) === wanted)
                        .map(mapUserToProfileRow);
                    break;
                }
                default:
                    data = [];
            }
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab !== 'reports' && activeTab !== 'blocked') {
            let role = 'player';
            if (activeTab === 'team_manager') role = 'team-manager';
            if (activeTab === 'referee') role = 'referee';
            if (activeTab === 'admin') role = 'admin';
            setFormData(prev => ({ ...prev, role }));
        }
        fetchUsers();
    }, [activeTab]);

    const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
        if (currentStatus) {
            if (!confirm('Block this user? They will not be able to sign in until unblocked.')) return;
        }
        try {
            if (currentStatus) {
                await UserService.blockUser(userId);
            } else {
                await UserService.unblockUser(userId);
            }
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error('Action failed:', error);
            alert('Failed to update user status');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Delete this user permanently? This cannot be undone.')) return;
        try {
            await UserService.deleteUser(userId);
            fetchUsers();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete user');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeTab === 'player' || activeTab === 'all') {
                await AuthService.registerPlayer({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    isPro: false,
                    role: 'player',
                });
            } else if (activeTab === 'team_manager') {
                await AuthService.registerTeamManager({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    organizationName: formData.organizationName,
                    role: 'team-manager'
                });
            } else if (activeTab === 'referee') {
                await AuthService.registerReferee({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    level: 'Junior',
                    role: 'referee',
                });
            } else if (activeTab === 'admin') {
                await AuthService.registerAdmin({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    adminLevel: 1,
                    permissions: [],
                    role: 'admin'
                });
            }

            setIsAddModalOpen(false);
            setFormData({
                email: '',
                password: '',
                nickname: '',
                role: 'player',
                organizationName: '',
                level: '',
                adminLevel: 1,
            });
            fetchUsers();
        } catch (error: unknown) {
            alert(error instanceof Error ? error.message : 'Failed to create user');
        }
    };

    const filteredUsers = users.filter(row => {
        const ru = resolveUser(row as Record<string, unknown>);
        if (!ru) return false;

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            ru.nickname.toLowerCase().includes(q) ||
            ru.email.toLowerCase().includes(q) ||
            ru._id.toLowerCase().includes(q);

        const matchesStatus =
            activeTab === 'blocked' || activeTab === 'reports'
                ? true
                : statusFilter === 'all'
                  ? true
                  : statusFilter === 'active'
                    ? ru.isActive
                    : !ru.isActive;

        return matchesSearch && matchesStatus;
    });

    const showAddUser = activeTab !== 'reports' && activeTab !== 'blocked';
    const isReportsTab = activeTab === 'reports';

    const addModalTitle =
        activeTab === 'all'
            ? 'Add New User'
            : activeTab === 'team_manager'
              ? 'Add New Manager'
              : activeTab === 'referee'
                ? 'Add New Referee'
                : activeTab === 'admin'
                  ? 'Add New Admin'
                  : 'Add New Player';

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">User Management</h1>
                    <p className="text-text-muted">
                        Admin roster from <span className="text-white/80 font-mono text-xs">GET /api/users</span> — block,
                        unblock, filter by role, and review reported or blocked accounts.
                    </p>
                </div>
                <div className="flex gap-2">
                    {showAddUser && <Button onClick={() => setIsAddModalOpen(true)}>Add New User</Button>}
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
                <TabButton
                    active={activeTab === 'reports'}
                    onClick={() => setActiveTab('reports')}
                    icon={<FileText size={16} />}
                    label="Reports"
                />
                <TabButton
                    active={activeTab === 'blocked'}
                    onClick={() => setActiveTab('blocked')}
                    icon={<Ban size={16} />}
                    label="Blocked Users"
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
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                {activeTab !== 'blocked' && activeTab !== 'reports' && (
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-text-muted" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
                            className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                )}
            </div>

            {isReportsTab && (
                <p className="text-xs text-text-muted -mt-2">
                    Loads from <span className="font-mono text-white/70">GET /api/users/reported</span> (or{' '}
                    <span className="font-mono text-white/70">/api/users/reports</span>) when your backend exposes it. If
                    the route is missing, the list stays empty.
                </p>
            )}
            {activeTab === 'blocked' && (
                <p className="text-xs text-text-muted -mt-2">
                    Users with <span className="text-white/80">isActive: false</span> from the same admin{' '}
                    <span className="font-mono text-white/70">GET /api/users</span> roster.
                </p>
            )}

            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[860px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">User</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Role</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                                    {isReportsTab ? 'Report summary' : 'Region / Country'}
                                </th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Status</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Joined</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted">
                                        Loading users…
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-text-muted">
                                        {isReportsTab
                                            ? 'No reported users returned by the API.'
                                            : 'No users match this view.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers
                                    .map(row => ({
                                        row,
                                        ru: resolveUser(row as Record<string, unknown>),
                                    }))
                                    .filter(
                                        (x): x is {
                                            row: Profile | ReportedPlayerRow;
                                            ru: NonNullable<ReturnType<typeof resolveUser>>;
                                        } => x.ru !== null,
                                    )
                                    .map(({ row, ru }) => {
                                    const rep = row as ReportedPlayerRow;
                                    const reportLine =
                                        rep.reportCount != null
                                            ? `${rep.reportCount} report${rep.reportCount === 1 ? '' : 's'}`
                                            : null;
                                    const reason = rep.lastReason?.trim();
                                    const joined =
                                        (row as Profile).createdAt ||
                                        rep.createdAt ||
                                        rep.lastReportAt ||
                                        undefined;

                                    return (
                                        <tr
                                            key={row._id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                                                        {ru.avatar ? (
                                                            <img src={ru.avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <UserIcon className="w-5 h-5 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-white capitalize truncate">
                                                            {ru.nickname || '—'}
                                                        </div>
                                                        <div className="text-xs text-text-muted lowercase truncate">
                                                            {ru.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {(ru.role || '—').replace(/_/g, ' ')}
                                            </td>
                                            <td className="p-4 text-xs text-text-muted max-w-[240px]">
                                                {isReportsTab ? (
                                                    <div className="space-y-1">
                                                        {reportLine && (
                                                            <span className="text-primary font-bold">{reportLine}</span>
                                                        )}
                                                        {reason && (
                                                            <div className="text-white/50 line-clamp-2" title={reason}>
                                                                {reason}
                                                            </div>
                                                        )}
                                                        {!reportLine && !reason && (
                                                            <span className="text-white/30">—</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span>
                                                        {[ru.region, ru.country].filter(Boolean).join(' · ') || '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                                        ru.isActive
                                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}
                                                >
                                                    {ru.isActive ? 'Active' : 'Blocked'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-text-muted whitespace-nowrap">
                                                {joined
                                                    ? new Date(joined).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleBlockToggle(ru._id, ru.isActive)}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            ru.isActive
                                                                ? 'text-red-400 hover:bg-red-500/10'
                                                                : 'text-green-400 hover:bg-green-500/10'
                                                        }`}
                                                        title={ru.isActive ? 'Block user' : 'Unblock user'}
                                                    >
                                                        {ru.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(ru._id)}
                                                        className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                    })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={addModalTitle}>
                <form onSubmit={handleAddUser} className="space-y-4 p-6">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                        <Input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Nickname</label>
                        <Input
                            required
                            value={formData.nickname}
                            onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
                        <Input
                            required
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {activeTab === 'team_manager' && (
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">Organization Name</label>
                            <Input
                                required
                                value={formData.organizationName}
                                onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create user</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                    active
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
