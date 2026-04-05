import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, Users, User, Binoculars, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService } from '../services/auth.service';
import { fetchPublicTeams, type TeamListItem } from '../services/teamsPublic.service';

type UserRole = 'player' | 'team_manager' | 'scouter';

const REGISTER_BACKGROUNDS = [
    new URL('../assets/lol_register.jpg', import.meta.url).href,
    new URL('../assets/register_valo.jpg', import.meta.url).href,
    new URL('../assets/valorant_register.jpg', import.meta.url).href,
    new URL('../assets/valorant agent.jpeg', import.meta.url).href,
] as const;

function pickRandomBackground(): string {
    const i = Math.floor(Math.random() * REGISTER_BACKGROUNDS.length);
    return REGISTER_BACKGROUNDS[i];
}

const selectClassName =
    'w-full px-4 py-3 bg-surface border-2 border-white/5 text-white text-sm outline-none transition-all focus:border-primary cursor-pointer appearance-none';

export default function Register() {
    const navigate = useNavigate();
    const backgroundUrl = useMemo(() => pickRandomBackground(), []);
    const [selectedRole, setSelectedRole] = useState<UserRole>('player');
    const [loading, setLoading] = useState(false);
    const [teams, setTeams] = useState<TeamListItem[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [teamsError, setTeamsError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        region: 'EUROPE',
        organizationName: '',
        teamId: '',
        scouterLevel: 'REGIONAL',
        notes: '',
    });

    useEffect(() => {
        if (selectedRole !== 'team_manager') return;
        let cancelled = false;
        setTeamsLoading(true);
        setTeamsError(null);
        fetchPublicTeams()
            .then((list) => {
                if (cancelled) return;
                setTeams(list);
                setFormData((f) => ({
                    ...f,
                    teamId: f.teamId && list.some((t) => t._id === f.teamId) ? f.teamId : (list[0]?._id ?? ''),
                }));
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                setTeams([]);
                setTeamsError(e instanceof Error ? e.message : 'Could not load teams');
            })
            .finally(() => {
                if (!cancelled) setTeamsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedRole]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (selectedRole === 'team_manager') {
            if (!formData.teamId?.trim()) {
                toast.error('Select the team you are applying to manage.');
                return;
            }
            if (teams.length === 0 && !teamsLoading) {
                toast.error('No teams are available yet. An admin must create teams first.');
                return;
            }
        }

        setLoading(true);

        try {
            if (selectedRole === 'player') {
                await AuthService.registerPlayer({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    isPro: false,
                });
            } else if (selectedRole === 'team_manager') {
                await AuthService.registerTeamManager({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    organizationName: formData.organizationName,
                    teamId: formData.teamId.trim(),
                    region: formData.region,
                });
            } else if (selectedRole === 'scouter') {
                await AuthService.registerScouter({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    level: formData.scouterLevel as 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL',
                    notes: formData.notes || undefined,
                });
            }

            toast.success('Account created successfully! Please verify your email.');
            navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } catch (error: unknown) {
            console.error('Registration error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const isPlayer = selectedRole === 'player';
    const isManager = selectedRole === 'team_manager';
    const isScouter = selectedRole === 'scouter';

    return (
        <div className="min-h-screen bg-black flex overflow-hidden relative">
            {/* ── Background ── */}
            <div className="absolute inset-0 z-0">
                <img src={backgroundUrl} alt="" aria-hidden className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-black/60 pointer-events-none" aria-hidden />
            </div>

            {/* ══════════════════════════════════════════
                LEFT PANEL — Social login
            ══════════════════════════════════════════ */}
            <div className="hidden md:flex w-[42%] flex-col justify-center px-14 py-12 relative z-10 gap-10">
                <Link to="/" className="inline-flex items-center gap-2 group w-fit">
                    <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                    <span className="text-white/40 text-sm group-hover:text-white transition-colors">Back to Home</span>
                </Link>

                {/* Logo + title */}
                <div className="flex flex-col gap-5">
                    <div className="w-20 h-20 bg-primary/15 rounded-2xl flex items-center justify-center border border-primary/40 shadow-[0_0_48px_rgba(0,255,0,0.18)]">
                        <Gamepad2 className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
                            Join the<br /><span className="text-primary">Arena</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-3">Choose your role and create your account.</p>
                    </div>
                </div>

                {/* Social buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => (window.location.href = `${AuthService.getApiUrl()}/auth/google`)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white text-sm font-bold transition-all"
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <button
                        type="button"
                        onClick={() => (window.location.href = `${AuthService.getApiUrl()}/auth/steam`)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-[#1b2838] hover:border-[#2a475e] text-white text-sm font-bold transition-all"
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
                        </svg>
                        Continue with Steam
                    </button>
                </div>

                <p className="text-white/30 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
                </p>
            </div>

            {/* ── Vertical divider ── */}
            <div className="hidden md:block w-px bg-white/8 relative z-10 my-14 shrink-0" />

            {/* ══════════════════════════════════════════
                RIGHT PANEL — Registration form
            ══════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-12 relative z-10">

                {/* Mobile: back + logo */}
                <div className="md:hidden mb-8 flex flex-col items-center gap-4 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 group self-start">
                        <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                        <span className="text-white/40 text-sm group-hover:text-white transition-colors">Back to Home</span>
                    </Link>
                    <div className="w-14 h-14 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/40">
                        <Gamepad2 className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Join the Arena</h1>
                </div>

                {/* Role selector */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <RoleCard role="player" selected={isPlayer} onClick={() => setSelectedRole('player')} icon={<User className="w-6 h-6" />} label="Player" />
                    <RoleCard role="team_manager" selected={isManager} onClick={() => setSelectedRole('team_manager')} icon={<Users className="w-6 h-6" />} label="Manager" />
                    <RoleCard role="scouter" selected={isScouter} onClick={() => setSelectedRole('scouter')} icon={<Binoculars className="w-6 h-6" />} label="Scouter" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Username</label>
                            <Input name="nickname" value={formData.nickname} onChange={handleChange} placeholder="GamerTag123" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
                            <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="user@example.com" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Region</label>
                        <select name="region" value={formData.region} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange(e)} className={selectClassName} required>
                            <option value="EUROPE">EUROPE</option>
                            <option value="AFRICA">AFRIQUE</option>
                            <option value="ASIA">ASIE</option>
                            <option value="AMERICAS">AMÉRIQUES</option>
                            <option value="OCEANIA">OCÉANIE</option>
                        </select>
                    </div>

                    {selectedRole === 'team_manager' && (
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Team you apply to manage</label>
                                {teamsLoading ? (
                                    <div className="flex items-center gap-2 text-text-muted text-sm py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading teams…
                                    </div>
                                ) : teamsError ? (
                                    <p className="text-sm text-red-400/90">{teamsError}</p>
                                ) : teams.length === 0 ? (
                                    <p className="text-sm text-amber-400/90">No teams found. Ask an administrator to create teams first, then refresh.</p>
                                ) : (
                                    <select name="teamId" value={formData.teamId} onChange={handleChange} required className={selectClassName}>
                                        {teams.map((t) => (
                                            <option key={t._id} value={t._id}>{t.name}{t.isVerified ? ' ✓' : ''}</option>
                                        ))}
                                    </select>
                                )}
                                {teams.length > 0 && (
                                    <p className="text-[11px] text-text-muted">{teams.length} team{teams.length !== 1 ? 's' : ''} available. Pending until an admin approves.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Organization Name</label>
                                <Input name="organizationName" value={formData.organizationName} onChange={handleChange} placeholder="e.g. Cloud9, Team Liquid" required />
                            </div>
                        </div>
                    )}

                    {selectedRole === 'scouter' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Scouter Level</label>
                                <select name="scouterLevel" value={formData.scouterLevel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, scouterLevel: e.target.value })} className={selectClassName}>
                                    <option value="REGIONAL">Regional</option>
                                    <option value="NATIONAL">National</option>
                                    <option value="INTERNATIONAL">International</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Notes (optional)</label>
                                <Input name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g. Scouting for EU leagues" />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Password</label>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                rightElement={
                                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="p-1 text-text-muted hover:text-white transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Confirm Password</label>
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                rightElement={
                                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="p-1 text-text-muted hover:text-white transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                        </div>
                    </div>

                    <Button className="w-full" size="lg" isLoading={loading} disabled={selectedRole === 'team_manager' && (teamsLoading || teams.length === 0)}>
                        Create{' '}
                        {selectedRole === 'team_manager' ? 'Manager' : selectedRole === 'scouter' ? 'Scouter' : 'Player'}{' '}
                        Account
                    </Button>
                </form>

                {/* Mobile: social buttons */}
                <div className="md:hidden mt-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs text-white/30 uppercase tracking-wider font-bold">or</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <button type="button" onClick={() => (window.location.href = `${AuthService.getApiUrl()}/auth/google`)} className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>
                    <button type="button" onClick={() => (window.location.href = `${AuthService.getApiUrl()}/auth/steam`)} className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-[#1b2838] hover:border-[#2a475e] text-white text-sm font-bold transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z" />
                        </svg>
                        Continue with Steam
                    </button>
                    <p className="text-center text-white/30 text-sm pt-2">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function RoleCard({
    selected,
    onClick,
    icon,
    label,
}: {
    role: string;
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center p-5 rounded-xl border transition-all duration-300
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80
                ${
                    selected
                        ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                        : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10 hover:border-white/15'
                }
            `}
        >
            <div className={`mb-2 ${selected ? 'text-primary' : 'text-text-muted'}`}>{icon}</div>
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}
