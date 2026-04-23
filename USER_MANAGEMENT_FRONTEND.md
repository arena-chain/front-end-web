# User Management Frontend Implementation

This guide provides the complete code to implement the User Management page in your React frontend. It connects to the backend endpoints we just created.

## 1. Create User Service

Create or update `src/services/userService.ts` to handle API calls.

```typescript
// src/services/userService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
    _id: string;
    email: string;
    nickname: string;
    isActive: boolean;
    createdAt: string;
    roles?: string[]; // Populated roles if available
}

export interface Profile {
    _id: string;
    userId: User;
    [key: string]: any;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const UserService = {
    // Get all users (generic)
    async getAllUsers(): Promise<User[]> {
        const response = await fetch(`${API_URL}/users`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    // Get profiles by role
    async getPlayers(): Promise<Profile[]> {
        const response = await fetch(`${API_URL}/player`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch players');
        return response.json();
    },

    async getTeamManagers(): Promise<Profile[]> {
        const response = await fetch(`${API_URL}/team-manager`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch team managers');
        return response.json();
    },

    async getReferees(): Promise<Profile[]> {
        const response = await fetch(`${API_URL}/referee`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch referees');
        return response.json();
    },

    async getAdmins(): Promise<Profile[]> {
        const response = await fetch(`${API_URL}/admin`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch admins');
        return response.json();
    },

    // Actions
    async blockUser(userId: string): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}/block`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to block user');
    },

    async unblockUser(userId: string): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}/unblock`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to unblock user');
    },

    async deleteUser(userId: string): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete user');
    }
};
```

## 2. Update User Management Page

Replace the content of `src/admin/pages/Users.tsx` with this full implementation.

```tsx
// src/admin/pages/Users.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Shield, User, Users as UsersIcon, Gavel, Crown, Ban, CheckCircle, Trash2, X } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import { UserService, Profile } from '../../services/userService';
import { AuthService } from '../../services/auth.service';
import { RegisterPlayerRequest, RegisterTeamManagerRequest, RegisterRefereeRequest, RegisterAdminRequest } from '../../models/auth.models';

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-white/10 rounded-xl w-full max-w-md p-6 relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
};

export default function Users() {
    const [activeTab, setActiveTab] = useState<'players' | 'managers' | 'referees' | 'admins' | 'teams'>('players');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nickname: '',
        role: 'player', // Default role base on active tab or selection
        // Role specific fields make sure to handle them
        organizationName: '',
        level: '',
        adminLevel: 1
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let data: Profile[] = [];
            switch (activeTab) {
                case 'players':
                    data = await UserService.getPlayers();
                    break;
                case 'managers':
                    data = await UserService.getTeamManagers();
                    break;
                case 'referees':
                    data = await UserService.getReferees();
                    break;
                case 'admins':
                    data = await UserService.getAdmins();
                    break;
                // Teams activeTab can be handled separately if you have a TeamService
                default:
                    data = [];
            }
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Update form role when tab changes
        let role = 'player';
        if (activeTab === 'managers') role = 'team-manager';
        if (activeTab === 'referees') role = 'referee';
        if (activeTab === 'admins') role = 'admin';
        setFormData(prev => ({ ...prev, role }));
        
        fetchUsers();
    }, [activeTab]);

    const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
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
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
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
            if (activeTab === 'players') {
                await AuthService.registerPlayer({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    isPro: false,
                    role: 'player'
                });
            } else if (activeTab === 'managers') {
                await AuthService.registerTeamManager({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    organizationName: formData.organizationName,
                    role: 'team-manager'
                });
            } else if (activeTab === 'referees') {
                await AuthService.registerReferee({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    level: 'Junior',
                    role: 'referee'
                });
            } else if (activeTab === 'admins') {
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
            setFormData({ email: '', password: '', nickname: '', role: 'player', organizationName: '', level: '', adminLevel: 1 }); // Reset form
            fetchUsers();
        } catch (error: any) {
            alert(error.message || 'Failed to create user');
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(user => 
        user.userId?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">User Management</h1>
                    <p className="text-text-muted">Manage all users, teams, and administrative roles.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsAddModalOpen(true)}>Add New User</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
                <TabButton active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={<User size={16} />} label="Players" />
                <TabButton active={activeTab === 'managers'} onClick={() => setActiveTab('managers')} icon={<Shield size={16} />} label="Team Managers" />
                <TabButton active={activeTab === 'referees'} onClick={() => setActiveTab('referees')} icon={<Gavel size={16} />} label="Referees" />
                <TabButton active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} icon={<Crown size={16} />} label="Admins" />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 bg-surface border border-white/5 p-4 rounded-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input 
                        className="pl-10 bg-black/20 border-white/5" 
                        placeholder="Search by name, email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">User</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Details</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Status</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-text-muted">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-text-muted">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((profile) => (
                                    <tr key={profile._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                                    {profile.userId?.nickname?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{profile.userId?.nickname}</div>
                                                    <div className="text-xs text-text-muted">{profile.userId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">
                                            {activeTab === 'players' && `Elo: ${profile.elo || 0}`}
                                            {activeTab === 'managers' && `Org: ${profile.organizationName || 'N/A'}`}
                                            {activeTab === 'referees' && `Level: ${profile.level || 'Junior'}`}
                                            {activeTab === 'admins' && `Level: ${profile.adminLevel || 1}`}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                                profile.userId?.isActive 
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                                {profile.userId?.isActive ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleBlockToggle(profile.userId._id, profile.userId.isActive)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        profile.userId?.isActive 
                                                        ? 'text-red-400 hover:bg-red-500/10' 
                                                        : 'text-green-400 hover:bg-green-500/10'
                                                    }`}
                                                    title={profile.userId?.isActive ? "Block User" : "Unblock User"}
                                                >
                                                    {profile.userId?.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(profile.userId._id)}
                                                    className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Add User Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Add New ${activeTab.slice(0, -1)}`}>
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                        <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Nickname</label>
                        <Input required value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
                        <Input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    
                    {activeTab === 'managers' && (
                         <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">Organization Name</label>
                            <Input required value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} />
                        </div>
                    )}
                    
                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1">Create User</Button>
                    </div>
                </form>
            </Modal>
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
```
