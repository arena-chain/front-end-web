import { useState } from 'react';
import {
    Save, Settings2, Gamepad2, Globe, Mail,
    AlertTriangle, CheckCircle2, Wrench, ChevronRight,
    Shield, Zap,
} from 'lucide-react';

const fieldClass =
    'w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-primary/60 focus:outline-none transition-colors';

const labelClass = 'block text-[10px] font-black uppercase tracking-[0.18em] text-white/40 mb-2';

const INTEGRATIONS = [
    {
        name: 'Riot Games API',
        description: 'Valorant, League of Legends & TFT match data',
        status: 'connected' as const,
        icon: '⚔️',
    },
    {
        name: 'Steam Web API',
        description: 'CS2, Dota 2 & Steam profile integration',
        status: 'connected' as const,
        icon: '🎮',
    },
    {
        name: 'Discord OAuth',
        description: 'Login with Discord & community sync',
        status: 'disconnected' as const,
        icon: '💬',
    },
];

export default function Settings() {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setSaved(false);
        setTimeout(() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1200);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70 mb-1">Admin Panel</p>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
                        Platform <span className="text-primary">Settings</span>
                    </h1>
                    <p className="text-text-muted text-sm mt-1.5">Configure global platform parameters and rules.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all self-start sm:self-end disabled:opacity-60
                        bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(57,255,20,0.2)]"
                >
                    {saving ? (
                        <Save className="w-4 h-4 animate-pulse" />
                    ) : saved ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            {/* ── General Configuration ──────────────────────────────────────── */}
            <section className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                        <Settings2 size={16} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">General Configuration</h2>
                        <p className="text-[11px] text-text-muted">Core platform identity and behaviour</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><Zap size={9} /> Platform Name</span>
                        </label>
                        <input className={fieldClass} defaultValue="Arena Chain" placeholder="Platform name" />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><Mail size={9} /> Support Email</span>
                        </label>
                        <input className={fieldClass} defaultValue="support@arenachain.gg" placeholder="email@example.com" type="email" />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><AlertTriangle size={9} /> Maintenance Mode</span>
                        </label>
                        <select className={fieldClass}>
                            <option value="disabled">Disabled</option>
                            <option value="enabled">Enabled</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><Globe size={9} /> Default Language</span>
                        </label>
                        <select className={fieldClass}>
                            <option>English (US)</option>
                            <option>French</option>
                            <option>Spanish</option>
                            <option>Arabic</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* ── Security ───────────────────────────────────────────────────── */}
            <section className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
                        <Shield size={16} className="text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Security</h2>
                        <p className="text-[11px] text-text-muted">Authentication and access control</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Session Timeout (minutes)</label>
                        <input className={fieldClass} defaultValue="60" type="number" min={5} />
                    </div>
                    <div>
                        <label className={labelClass}>Max Login Attempts</label>
                        <input className={fieldClass} defaultValue="5" type="number" min={1} />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <div>
                            <p className="text-sm font-bold text-white">Two-Factor Authentication (Admin)</p>
                            <p className="text-xs text-text-muted mt-0.5">Require 2FA for all admin accounts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-10 h-5 bg-white/10 peer-checked:bg-primary rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                    </div>
                </div>
            </section>

            {/* ── Game Integrations ──────────────────────────────────────────── */}
            <section className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20">
                        <Gamepad2 size={16} className="text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Game Integrations</h2>
                        <p className="text-[11px] text-text-muted">Third-party API connections</p>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {INTEGRATIONS.map(({ name, description, status, icon }) => (
                        <div key={name} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 text-xl flex-shrink-0">
                                {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white">{name}</p>
                                <p className="text-xs text-text-muted mt-0.5 truncate">{description}</p>
                            </div>
                            <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex-shrink-0 ${
                                status === 'connected'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-white/5 text-white/30 border border-white/10'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
                                {status}
                            </span>
                            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0">
                                <Wrench size={11} />
                                Configure
                                <ChevronRight size={11} className="opacity-40" />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Danger Zone ────────────────────────────────────────────────── */}
            <section className="bg-surface border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/10 bg-red-500/[0.03]">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
                        <AlertTriangle size={16} className="text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-red-400">Danger Zone</h2>
                        <p className="text-[11px] text-text-muted">Irreversible platform actions</p>
                    </div>
                </div>
                <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-white">Reset Platform Data</p>
                        <p className="text-xs text-text-muted mt-0.5">Wipes all cached stats and resets counters. Cannot be undone.</p>
                    </div>
                    <button className="flex-shrink-0 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest transition-all">
                        Reset Data
                    </button>
                </div>
            </section>
        </div>
    );
}
