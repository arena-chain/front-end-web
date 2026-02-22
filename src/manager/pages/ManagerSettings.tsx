import { useState } from 'react';
import { Settings, User, Building2, Mail, Globe, Save, Check, Key, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoredUser {
    nickname?: string;
    email?: string;
    organizationName?: string;
    role?: string;
    region?: string;
    avatar?: string;
}

export default function ManagerSettings() {
    const navigate = useNavigate();

    const stored: StoredUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    const [form, setForm] = useState({
        nickname:         stored.nickname         || '',
        email:            stored.email            || '',
        organizationName: stored.organizationName || '',
        region:           stored.region           || 'EUROPE',
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        const updated = { ...stored, ...form };
        localStorage.setItem('user', JSON.stringify(updated));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                    <Settings className="w-6 h-6 text-text-muted" /> Settings
                </h1>
                <p className="text-text-muted text-sm mt-1">Manage your profile and preferences</p>
            </div>

            {/* Profile section */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white font-bold text-sm uppercase tracking-widest">Profile</h2>
                </div>
                <div className="p-5 space-y-4">
                    {/* Avatar placeholder */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-2xl font-black text-primary">
                                {form.nickname.charAt(0).toUpperCase() || 'M'}
                            </span>
                        </div>
                        <div>
                            <p className="text-white font-bold">{form.nickname || 'Manager'}</p>
                            <p className="text-text-muted text-sm">{form.organizationName || 'No organization'}</p>
                            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                                Team Manager
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field icon={<User className="w-4 h-4" />} label="Username">
                            <input value={form.nickname}
                                onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
                        </Field>
                        <Field icon={<Mail className="w-4 h-4" />} label="Email">
                            <input value={form.email} readOnly
                                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-text-muted cursor-not-allowed" />
                        </Field>
                        <Field icon={<Building2 className="w-4 h-4" />} label="Organization Name">
                            <input value={form.organizationName}
                                onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50" />
                        </Field>
                        <Field icon={<Globe className="w-4 h-4" />} label="Region">
                            <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50">
                                {['EUROPE', 'AFRICA', 'ASIA', 'AMERICAS', 'OCEANIA'].map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <button onClick={handleSave}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${saved
                            ? 'bg-emerald-500 text-white'
                            : 'bg-primary text-black hover:bg-primary-light'}`}>
                        {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Account section */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="text-white font-bold text-sm uppercase tracking-widest">Account</h2>
                </div>
                <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Key className="w-5 h-5 text-text-muted" />
                            <div>
                                <p className="text-white text-sm font-medium">Password</p>
                                <p className="text-text-muted text-xs">Change your account password</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/forgot-password')}
                            className="text-xs font-bold text-primary hover:text-primary-light transition-colors">
                            Change →
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5 text-red-400" />
                            <div>
                                <p className="text-white text-sm font-medium">Sign Out</p>
                                <p className="text-text-muted text-xs">Log out of your account</p>
                            </div>
                        </div>
                        <button onClick={handleLogout}
                            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
                            Log Out →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-muted mb-1.5">
                {icon}{label}
            </label>
            {children}
        </div>
    );
}
