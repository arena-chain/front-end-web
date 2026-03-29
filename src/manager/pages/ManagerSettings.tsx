import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, User, Building2, Mail, Save, Check, Key, LogOut, Camera, Phone, FileText, Shield, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { teamManagerService, type TeamData } from '../../services/teamManagerService';

interface StoredUser { _id?: string; id?: string; nickname?: string; email?: string; organizationName?: string; avatar?: string; }

export default function ManagerSettings() {
    const navigate = useNavigate();

    const stored: StoredUser = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); }
        catch { return {}; }
    })();

    // ── Profile state ──────────────────────────────────────────────────────────
    const [profile, setProfile] = useState({
        firstName:        '',
        lastName:         '',
        organizationName: stored.organizationName || '',
        phoneNumber:      '',
        description:      '',
    });
    const [nickname]                = useState(stored.nickname || '');
    const [email]                   = useState(stored.email || '');
    const [avatar, setAvatar]       = useState<string>(stored.avatar || '');
    const [profileSaved,  setProfileSaved]  = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const avatarRef = useRef<HTMLInputElement>(null);

    // ── Team state ─────────────────────────────────────────────────────────────
    const [team, setTeam]           = useState<TeamData | null>(null);
    const [teamForm, setTeamForm]   = useState({ name: '', organizationName: '', description: '', type: 'amateur' as 'amateur' | 'pro', logo: '' });
    const [teamSaved,  setTeamSaved]  = useState(false);
    const [teamSaving, setTeamSaving] = useState(false);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const logoRef = useRef<HTMLInputElement>(null);

    // ── Load from backend on mount ─────────────────────────────────────────────
    useEffect(() => {
        teamManagerService.getMyProfile()
            .then(data => {
                setProfile({
                    firstName:        data.firstName        || '',
                    lastName:         data.lastName         || '',
                    organizationName: data.organizationName || stored.organizationName || '',
                    phoneNumber:      data.phoneNumber      || '',
                    description:      data.description      || '',
                });
                // sync orgName into localStorage
                const updated = { ...stored, organizationName: data.organizationName || stored.organizationName };
                localStorage.setItem('user', JSON.stringify(updated));
            })
            .catch(() => {})
            .finally(() => setLoadingProfile(false));

        teamManagerService.getMyTeam()
            .then(t => {
                setTeam(t);
                if (t) setTeamForm({ name: t.name || '', organizationName: t.organizationName || '', description: t.description || '', type: (t.type as 'amateur' | 'pro') || 'amateur', logo: t.logo || '' });
            })
            .catch(() => setTeam(null))
            .finally(() => setLoadingTeam(false));
    }, []);

    // ── Avatar handler (local base64 only) ────────────────────────────────────
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const b64 = ev.target?.result as string;
            setAvatar(b64);
            localStorage.setItem('user', JSON.stringify({ ...stored, avatar: b64 }));
        };
        reader.readAsDataURL(file);
    };

    // ── Logo handler (base64 → sent to backend) ───────────────────────────────
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setTeamForm(f => ({ ...f, logo: ev.target?.result as string }));
        reader.readAsDataURL(file);
    };

    // ── Save profile ───────────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        setProfileSaving(true);
        // Optimistic localStorage update
        localStorage.setItem('user', JSON.stringify({ ...stored, organizationName: profile.organizationName, avatar }));
        try {
            await teamManagerService.updateMyProfile(profile);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2500);
            toast.success('Profile saved successfully');
        } catch (err) {
            console.error('Profile save failed (kept locally):', err);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2500);
            toast.success('Profile saved locally');
        } finally {
            setProfileSaving(false);
        }
    };

    // ── Save / create team ────────────────────────────────────────────────────
    const handleSaveTeam = async () => {
        setTeamSaving(true);
        try {
            if (team) {
                const updated = await teamManagerService.updateTeam({ name: teamForm.name, organizationName: teamForm.organizationName, description: teamForm.description, logo: teamForm.logo || undefined });
                setTeam(updated);
            } else {
                if (!teamForm.name.trim()) { toast.error('Team name is required'); setTeamSaving(false); return; }
                const payload = { name: teamForm.name, organizationName: teamForm.organizationName || profile.organizationName, description: teamForm.description, type: teamForm.type || undefined, logo: teamForm.logo || undefined };
                console.log('[createTeam] payload:', payload);
                const created = await teamManagerService.createTeam(payload);
                setTeam(created);
            }
            setTeamSaved(true);
            setTimeout(() => setTeamSaved(false), 2500);
            toast.success(team ? 'Team updated successfully' : 'Team created successfully');
        } catch (err: unknown) {
            const data = (err as { response?: { data?: { message?: unknown } } })?.response?.data;
            console.error('[saveTeam] error:', data);
            const raw = data?.message;
            const msg = Array.isArray(raw) ? raw.join('\n') : (typeof raw === 'string' ? raw : 'Failed to save team');
            toast.error(msg);
        } finally {
            setTeamSaving(false);
        }
    };

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };

    const inputCls = 'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors';
    const roLabel  = 'w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-text-muted cursor-not-allowed';

    return (
        <div className="space-y-6 w-full">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Settings className="w-6 h-6 text-text-muted" /> Settings
                    </h1>
                    <p className="text-text-muted text-sm mt-1">Manage your profile, team identity, and account</p>
                </div>
                <div className="flex items-center gap-2">
                    {(loadingProfile || loadingTeam) && (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing…
                        </span>
                    )}
                </div>
            </div>

            {/* ── Two-column: Profile + Team ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">

                {/* ── LEFT: My Profile ── */}
                <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {/* Card header */}
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <h2 className="text-white font-black text-sm uppercase tracking-widest">My Profile</h2>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col gap-6 flex-1">
                        {/* Avatar hero row */}
                        <div className="flex items-center gap-5 p-4 rounded-xl" style={{ background: 'rgba(0,255,0,0.04)', border: '1px solid rgba(0,255,0,0.08)' }}>
                            <div className="relative group shrink-0">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center cursor-pointer"
                                    style={{ background: 'rgba(0,255,0,0.08)', borderColor: 'rgba(0,255,0,0.25)' }}
                                    onClick={() => avatarRef.current?.click()}>
                                    {avatar
                                        ? <img src={avatar} className="w-full h-full object-cover" alt="avatar" />
                                        : <span className="text-3xl font-black" style={{ color: '#00ff00' }}>{(nickname || 'M').charAt(0).toUpperCase()}</span>}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                <button onClick={() => avatarRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                                    style={{ background: '#00ff00', color: '#000' }}>
                                    <Camera className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div>
                                <p className="text-white font-black text-lg leading-tight">{nickname || 'Manager'}</p>
                                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile.organizationName || 'No organization set'}</p>
                                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full mt-2 inline-block"
                                    style={{ background: 'rgba(0,255,0,0.1)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }}>
                                    Team Manager
                                </span>
                            </div>
                        </div>

                        {/* Form fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field icon={<User className="w-4 h-4" />} label="Username">
                                <input value={nickname} readOnly className={roLabel} />
                            </Field>
                            <Field icon={<Mail className="w-4 h-4" />} label="Email">
                                <input value={email} readOnly className={roLabel} />
                            </Field>
                            <Field icon={<User className="w-4 h-4" />} label="First Name">
                                <input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} className={inputCls} placeholder="Khalil" />
                            </Field>
                            <Field icon={<User className="w-4 h-4" />} label="Last Name">
                                <input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} className={inputCls} placeholder="Mouscou" />
                            </Field>
                            <Field icon={<Building2 className="w-4 h-4" />} label="Organization">
                                <input value={profile.organizationName} onChange={e => setProfile(p => ({ ...p, organizationName: e.target.value }))} className={inputCls} placeholder="Elite Gaming Org" />
                            </Field>
                            <Field icon={<Phone className="w-4 h-4" />} label="Phone">
                                <input value={profile.phoneNumber} onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))} className={inputCls} placeholder="+21612345678" />
                            </Field>
                            <div className="col-span-2">
                                <Field icon={<FileText className="w-4 h-4" />} label="Bio / Description">
                                    <textarea value={profile.description} onChange={e => setProfile(p => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Head coach and team manager…" />
                                </Field>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <SaveBtn saving={profileSaving} saved={profileSaved} onClick={handleSaveProfile} />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Team Identity ── */}
                <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {/* Card header */}
                    <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <h2 className="text-white font-black text-sm uppercase tracking-widest">
                                {team ? 'Team Identity' : 'Create Team'}
                            </h2>
                            {team?.isVerified && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(0,255,0,0.1)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.2)' }}>
                                    VERIFIED
                                </span>
                            )}
                        </div>
                        {!team && !loadingTeam && (
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Not created yet</span>
                        )}
                    </div>

                    <div className="p-6 flex flex-col gap-6 flex-1">
                        {/* Logo hero row */}
                        <div className="flex items-center gap-5 p-4 rounded-xl" style={{ background: 'rgba(59,158,255,0.04)', border: '1px solid rgba(59,158,255,0.1)' }}>
                            <div className="relative group shrink-0">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center cursor-pointer text-2xl font-black"
                                    style={{ background: 'rgba(59,158,255,0.08)', borderColor: 'rgba(59,158,255,0.25)' }}
                                    onClick={() => logoRef.current?.click()}>
                                    {teamForm.logo
                                        ? <img src={teamForm.logo} className="w-full h-full object-cover" alt="logo" />
                                        : <span style={{ color: '#3b9eff' }}>{teamForm.name.charAt(0).toUpperCase() || '?'}</span>}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                <button onClick={() => logoRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                                    style={{ background: '#3b9eff', color: '#000' }}>
                                    <Camera className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div>
                                <p className="text-white font-black text-lg leading-tight">{teamForm.name || 'Team Name'}</p>
                                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {team ? `${team.members?.length ?? 0} member${(team.members?.length ?? 0) !== 1 ? 's' : ''}` : 'No team yet'}
                                </p>
                                {teamForm.type && (
                                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full mt-2 inline-block"
                                        style={{ background: 'rgba(59,158,255,0.1)', color: '#3b9eff', border: '1px solid rgba(59,158,255,0.2)' }}>
                                        {teamForm.type}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Form fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field icon={<Shield className="w-4 h-4" />} label="Team Name *">
                                <input value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Phoenix Squad" />
                            </Field>
                            <Field icon={<Building2 className="w-4 h-4" />} label="Organization">
                                <input value={teamForm.organizationName} onChange={e => setTeamForm(f => ({ ...f, organizationName: e.target.value }))} className={inputCls} placeholder="Elite Gaming Org" />
                            </Field>
                            {!team ? (
                                <Field icon={<Shield className="w-4 h-4" />} label="Team Type">
                                    <select value={teamForm.type} onChange={e => setTeamForm(f => ({ ...f, type: e.target.value as 'amateur' | 'pro' }))} className={inputCls}>
                                        <option value="amateur">Amateur</option>
                                        <option value="pro">Professional</option>
                                    </select>
                                </Field>
                            ) : (
                                <Field icon={<Shield className="w-4 h-4" />} label="Type">
                                    <input value={teamForm.type} readOnly className={roLabel} />
                                </Field>
                            )}
                            <div />
                            <div className="col-span-2">
                                <Field icon={<FileText className="w-4 h-4" />} label="Team Description">
                                    <textarea value={teamForm.description} onChange={e => setTeamForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Our competitive team…" />
                                </Field>
                            </div>
                        </div>

                        <div className="mt-auto">
                        <button onClick={handleSaveTeam} disabled={teamSaving}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                                ${teamSaved ? 'bg-emerald-500 text-white' : 'hover:opacity-90'}
                                ${teamSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                            style={!teamSaved ? { background: '#3b9eff', color: '#000' } : {}}>
                            {teamSaving ? 'Saving…' : teamSaved
                                ? <><Check className="w-4 h-4" /> Saved!</>
                                : team
                                    ? <><Save className="w-4 h-4" /> Update Team</>
                                    : <><Plus className="w-4 h-4" /> Create Team</>}
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom: Account ── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                        <Key className="w-4 h-4 text-text-muted" /> Account
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <Key className="w-4 h-4 text-text-muted" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold">Password</p>
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Change your account password</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/forgot-password')}
                            className="text-xs font-black px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                            Change →
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                <LogOut className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold">Sign Out</p>
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Log out of your account</p>
                            </div>
                        </div>
                        <button onClick={handleLogout}
                            className="text-xs font-black px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            Log Out →
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}

function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
                ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-black hover:bg-primary-light'}
                ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {saving ? 'Saving…' : saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
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
