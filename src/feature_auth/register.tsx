import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, Users, User, Binoculars, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService } from '../services/auth.service';
import { fetchPublicTeams, type TeamListItem } from '../services/teamsPublic.service';
import AuthValorantBackdrop from '../components/auth/AuthValorantBackdrop';
import {
    REGISTER_CROSSFADE_SECONDS,
    REGISTER_SLIDE_INTERVAL_MS,
    REGISTER_ZOOM_SECONDS,
} from '../components/auth/authBackdropTiming';
import registerValorantFallback from '../assets/register_valo.jpg';
import { cn } from '../lib/utils';

type UserRole = 'player' | 'team_manager' | 'scouter';

const selectClassName =
    'w-full px-4 py-3 bg-surface border-2 border-white/5 text-white text-sm outline-none transition-all focus:border-primary cursor-pointer appearance-none';

export default function Register() {
    const navigate = useNavigate();
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

    const googleBtn = (
        <button
            type="button"
            onClick={() => (window.location.href = `${AuthService.getApiUrl()}/auth/google`)}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/35 hover:bg-zinc-800/45 hover:border-white/15 text-white text-sm font-semibold transition-all"
        >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
        </button>
    );

    const steamBtn = (
        <button
            type="button"
            onClick={() => (window.location.href = `${AuthService.getApiUrl()}/auth/steam`)}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/35 hover:bg-[#15202b] hover:border-[#2a475e]/80 text-white text-sm font-semibold transition-all"
        >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
            </svg>
            Continue with Steam
        </button>
    );

    return (
        <div className="min-h-screen min-h-dvh bg-zinc-950 flex flex-col md:grid md:grid-cols-[minmax(0,55%)_minmax(0,45%)] md:grid-rows-1">
            {/* Valorant agents (valorant-api.com) — left 55% on desktop */}
            <section className="relative order-2 md:order-1 min-h-[200px] sm:min-h-[280px] md:min-h-screen min-w-0">
                <AuthValorantBackdrop
                    fallbackSrc={registerValorantFallback}
                    overlayStrength={0.38}
                    layout="showcase"
                    showcaseFormOn="right"
                    hideBrandPlate
                    rotateIntervalMs={REGISTER_SLIDE_INTERVAL_MS}
                    crossfadeSeconds={REGISTER_CROSSFADE_SECONDS}
                    zoomSeconds={REGISTER_ZOOM_SECONDS}
                />
                <span className="sr-only">Valorant agent artwork</span>
            </section>

            {/* Form column — right on desktop */}
            <section className="order-1 md:order-2 relative z-20 flex flex-col justify-center px-5 sm:px-8 lg:px-10 py-10 md:py-12 overflow-y-auto max-h-[100dvh] border-t border-white/[0.06] md:border-t-0 md:border-l md:border-white/[0.06] bg-gradient-to-b from-zinc-950 via-[#0a0a0a] to-zinc-950">
                <div className="w-full max-w-none">
                <Link to="/" className="inline-flex items-center gap-2 group w-fit mb-7 md:mb-10">
                    <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:text-primary transition-colors" />
                    <span className="text-zinc-500 text-sm group-hover:text-zinc-300 transition-colors">Back to Home</span>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 mb-7">
                    <div className="w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/30 shadow-[0_0_32px_rgba(0,255,0,0.1)] shrink-0">
                        <Gamepad2 className="w-7 h-7 sm:w-9 sm:h-9 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black uppercase tracking-tight text-white leading-[1.05]">
                            Join the <span className="text-primary">Arena</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2.5 max-w-md leading-relaxed">
                            Pick a role and sign up — or use Google or Steam in one click.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-7">
                    <div className="flex-1 min-w-0">{googleBtn}</div>
                    <div className="flex-1 min-w-0">{steamBtn}</div>
                </div>

                <div className="flex items-center gap-4 mb-7">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">Or email</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/25 backdrop-blur-xl p-5 sm:p-7 lg:p-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04] w-full">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Account type</p>
                <div className="flex w-full rounded-xl border border-white/[0.1] bg-black/20 p-1 gap-1 mb-8">
                    <RoleSegment selected={isPlayer} onClick={() => setSelectedRole('player')} icon={<User className="w-4 h-4 shrink-0" />} label="Player" />
                    <RoleSegment selected={isManager} onClick={() => setSelectedRole('team_manager')} icon={<Users className="w-4 h-4 shrink-0" />} label="Manager" />
                    <RoleSegment selected={isScouter} onClick={() => setSelectedRole('scouter')} icon={<Binoculars className="w-4 h-4 shrink-0" />} label="Scouter" />
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
                </div>

                <p className="text-zinc-500 text-sm mt-8 pb-2">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-semibold hover:underline underline-offset-2">Log in</Link>
                </p>
                </div>
            </section>
        </div>
    );
}

function RoleSegment({
    selected,
    onClick,
    icon,
    label,
}: {
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex flex-1 min-w-0 items-center justify-center gap-2 rounded-lg py-3 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                selected
                    ? 'bg-primary/20 text-white border border-primary/55 shadow-[0_0_20px_-6px_rgba(0,255,0,0.35)]'
                    : 'text-text-muted border border-transparent hover:bg-white/[0.06] hover:text-zinc-300',
            )}
        >
            <span className={selected ? 'text-primary' : 'text-zinc-500'}>{icon}</span>
            <span className="truncate">{label}</span>
        </button>
    );
}
