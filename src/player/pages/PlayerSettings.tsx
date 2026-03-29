import { useState, useEffect } from 'react';
import { 
    User, Lock, Bell, Globe, Shield, 
    Smartphone, Mail, Save, 
    RefreshCw, CheckCircle2, 
    Monitor, Gamepad2
} from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const TABS = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Connections', icon: Gamepad2 },
];

export default function PlayerSettings() {
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        nickname: '',
        email: '',
        region: 'EUROPE',
        language: 'en',
        steamId: null as string | null,
        googleId: null as string | null
    });

    // 2FA State
    const [twoFactor, setTwoFactor] = useState({
        enabled: false,
        qrCode: '',
        secret: '',
        modalOpen: false,
        code: '',
        loading: false
    });

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [resettingPassword, setResettingPassword] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState({
        emails: true,
        matches: true,
        newsletter: false,
        tournaments: true
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile({
                nickname: res.data.nickname || '',
                email: res.data.email || '',
                region: res.data.region || 'EUROPE',
                language: 'en',
                steamId: res.data.steamId || null,
                googleId: res.data.googleId || null
            });
            setTwoFactor(prev => ({ ...prev, enabled: res.data.isTwoFactorEnabled || false }));
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAccount = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/auth/profile`, {
                nickname: profile.nickname,
                region: profile.region
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Account settings updated successfully');
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleOpen2FAModal = async () => {
        if (twoFactor.enabled) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${API_URL}/auth/2fa/disable`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTwoFactor({ ...twoFactor, enabled: false });
                toast.success('Two-factor authentication disabled');
            } catch (error) {
                toast.error('Failed to disable 2FA');
            }
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/auth/2fa/generate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTwoFactor({
                ...twoFactor,
                qrCode: res.data.qrCode,
                secret: res.data.secret,
                modalOpen: true,
                code: ''
            });
        } catch (error) {
            toast.error('Failed to initialize 2FA. Please try again.');
        }
    };

    const handleVerify2FA = async () => {
        setTwoFactor(prev => ({ ...prev, loading: true }));
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/2fa/turn-on`, {
                token: twoFactor.code
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTwoFactor(prev => ({ ...prev, enabled: true, modalOpen: false, loading: false, code: '' }));
            toast.success('Pulse-Gate Secured! 2FA is now active.');
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid verification code.');
            setTwoFactor(prev => ({ ...prev, loading: false }));
        }
    };

    const handleResetPassword = async () => {
        if (!passwords.newPassword || passwords.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setResettingPassword(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/auth/update-password`, {
                newPassword: passwords.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Access keys rotated successfully.');
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error: unknown) {
            toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update access keys.');
        } finally {
            setResettingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Settings</h1>
                <p className="text-text-muted">Manage your account preferences and security protocols.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
                                activeTab === tab.id 
                                    ? "bg-primary text-black shadow-[0_0_15px_rgba(59,245,39,0.2)]" 
                                    : "text-text-muted hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-6">
                    {activeTab === 'account' && (
                        <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden animate-fade-in">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-black uppercase text-white tracking-widest">General Information</h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Nickname</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                            <Input 
                                                value={profile.nickname}
                                                onChange={(e) => setProfile({...profile, nickname: e.target.value})}
                                                className="pl-10 bg-black/40 border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                            <Input 
                                                disabled
                                                value={profile.email}
                                                className="pl-10 bg-black/20 border-white/5 opacity-50 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Region</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50 pointer-events-none" />
                                            <select 
                                                value={profile.region}
                                                onChange={(e) => setProfile({...profile, region: e.target.value})}
                                                className="w-full pl-10 h-12 bg-black/40 border-2 border-white/10 rounded-xl text-white text-sm focus:border-primary focus:outline-none appearance-none font-bold"
                                            >
                                                <option value="EUROPE">Europe</option>
                                                <option value="AFRICA">Africa</option>
                                                <option value="ASIA">Asia</option>
                                                <option value="AMERICAS">Americas</option>
                                                <option value="OCEANIA">Oceania</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Interface Language</label>
                                        <select 
                                            value={profile.language}
                                            onChange={(e) => setProfile({...profile, language: e.target.value})}
                                            className="w-full h-12 bg-black/40 border-2 border-white/10 rounded-xl text-white text-sm focus:border-primary focus:outline-none appearance-none p-3 font-bold"
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="fr">French</option>
                                            <option value="es">Spanish</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <Button 
                                        disabled={saving}
                                        onClick={handleSaveAccount}
                                        className="gap-2 bg-primary text-black font-black uppercase px-8"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Secure Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden animate-fade-in">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-black uppercase text-white tracking-widest">Pulse Firewall</h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                            <Lock size={16} className="text-primary" />
                                            Update Password
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">New Password</label>
                                                    <Input 
                                                        type="password" 
                                                        placeholder="••••••••" 
                                                        className="bg-black/40 border-white/10"
                                                        value={passwords.newPassword}
                                                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Confirm New Password</label>
                                                    <Input 
                                                        type="password" 
                                                        placeholder="••••••••" 
                                                        className="bg-black/40 border-white/10"
                                                        value={passwords.confirmPassword}
                                                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="border-primary/20 text-primary hover:bg-primary/10"
                                            onClick={handleResetPassword}
                                            disabled={resettingPassword || !passwords.newPassword}
                                        >
                                            {resettingPassword ? <RefreshCw className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                                            Reset Access Keys
                                        </Button>
                                    </div>

                                    <div className="pt-8 border-t border-white/5">
                                        <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                                    <Smartphone className="text-primary w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">Two-Factor Authentication</div>
                                                    <div className="text-xs text-text-muted">Add an extra layer of security to your account.</div>
                                                </div>
                                            </div>
                                            <Button 
                                                size="sm"
                                                onClick={handleOpen2FAModal}
                                                className={twoFactor.enabled ? "bg-red-500/20 text-red-500 border-red-500/20" : "bg-primary text-black"}
                                            >
                                                {twoFactor.enabled ? "Disable" : "Enable"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden animate-fade-in">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-black uppercase text-white tracking-widest">Frequency Settings</h3>
                            </div>
                            <div className="p-8 space-y-4">
                                <NotificationToggle 
                                    title="System Emails"
                                    desc="Receive account activity logs and security alerts."
                                    active={notifications.emails}
                                    onToggle={() => setNotifications({...notifications, emails: !notifications.emails})}
                                />
                                <NotificationToggle 
                                    title="Match Ready Alerts"
                                    desc="In-browser push notifications when your match is starting."
                                    active={notifications.matches}
                                    onToggle={() => setNotifications({...notifications, matches: !notifications.matches})}
                                />
                                <NotificationToggle 
                                    title="Tournament Updates"
                                    desc="Stay tuned with bracket updates and prize payouts."
                                    active={notifications.tournaments}
                                    onToggle={() => setNotifications({...notifications, tournaments: !notifications.tournaments})}
                                />
                                <NotificationToggle 
                                    title="Intelligence Hub Newsletter"
                                    desc="Weekly summary of gaming news and patch notes."
                                    active={notifications.newsletter}
                                    onToggle={() => setNotifications({...notifications, newsletter: !notifications.newsletter})}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden animate-fade-in">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="text-lg font-black uppercase text-white tracking-widest">Neural Links</h3>
                            </div>
                            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <IntegrationCard 
                                    icon={<Monitor className="w-6 h-6" />}
                                    name="Steam"
                                    status={profile.steamId ? "Connected" : "Disconnected"}
                                    color={profile.steamId ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/5 text-text-muted border-white/10"}
                                    onClick={() => !profile.steamId && (window.location.href = `${API_URL}/auth/steam`)}
                                />
                                <IntegrationCard 
                                    icon={<Globe className="w-6 h-6" />}
                                    name="Google"
                                    status={profile.googleId ? "Connected" : "Disconnected"}
                                    color={profile.googleId ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-white/5 text-text-muted border-white/10"}
                                    onClick={() => !profile.googleId && (window.location.href = `${API_URL}/auth/google`)}
                                />
                                {/* Only Steam is currently implemented in the nexus backend */}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2FA Setup Modal */}
            {twoFactor.modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                        <div className="text-center space-y-2">
                            <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Secure Your Pulse</h3>
                            <p className="text-sm text-text-muted">Scan the QR code below using your authenticator app (Google Authenticator, Authy, etc.).</p>
                        </div>

                        {twoFactor.qrCode && (
                            <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto border-4 border-primary/20">
                                <img src={twoFactor.qrCode} alt="2FA QR Code" className="w-full h-full" />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2 text-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Verification Code</label>
                                <Input 
                                    value={twoFactor.code}
                                    onChange={(e) => setTwoFactor({...twoFactor, code: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                                    placeholder="000000"
                                    className="text-center text-2xl font-black tracking-[0.5em] h-16 bg-black/40 border-white/10"
                                />
                            </div>
                            
                            <div className="flex gap-4">
                                <Button 
                                    variant="ghost" 
                                    className="flex-1 text-text-muted hover:text-white"
                                    onClick={() => setTwoFactor({...twoFactor, modalOpen: false, code: ''})}
                                >
                                    Abort
                                </Button>
                                <Button 
                                    className="flex-1 bg-primary text-black font-black uppercase"
                                    onClick={handleVerify2FA}
                                    disabled={twoFactor.loading || twoFactor.code.length !== 6}
                                >
                                    {twoFactor.loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify & Enable"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NotificationToggle({ title, desc, active, onToggle }: { title: string, desc: string, active: boolean, onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between p-6 hover:bg-white/[0.02] rounded-2xl border border-white/5 transition-colors">
            <div>
                <div className="font-bold text-white text-sm uppercase tracking-wide">{title}</div>
                <div className="text-xs text-text-muted mt-1">{desc}</div>
            </div>
            <button 
                onClick={onToggle}
                className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    active ? "bg-primary shadow-[0_0_10px_rgba(59,245,39,0.4)]" : "bg-white/10"
                )}
            >
                <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow",
                    active ? "left-7" : "left-1"
                )} />
            </button>
        </div>
    );
}

function IntegrationCard({ icon, name, status, color, onClick }: { icon: React.ReactNode, name: string, status: string, color: string, onClick?: () => void }) {
    return (
        <div 
            onClick={onClick}
            className={cn("p-6 rounded-2xl border flex items-center justify-between group cursor-pointer h-full transition-all hover:scale-[1.02]", color)}
        >
            <div className="flex items-center gap-4">
                <div className="group-hover:scale-110 transition-transform">{icon}</div>
                <div className="font-black uppercase tracking-widest text-sm">{name}</div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                {status === 'Connected' ? (
                    <><CheckCircle2 size={12} className="animate-pulse" /> Linked</>
                ) : (
                    'Link Account'
                )}
            </div>
        </div>
    );
}

function cn(...classes: unknown[]) {
    return classes.filter(Boolean).join(' ');
}
