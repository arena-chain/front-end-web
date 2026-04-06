import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import lolLoginFallback from '../assets/lol.jpg';
import AuthLeagueBackdrop from '../components/auth/AuthLeagueBackdrop';
import { AuthService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { normalizeAuthUser } from '../lib/parseAuthUser';

export default function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            toast.success('Logged in with Google!');
            void AuthService.fetchProfile()
                .then((u) => {
                    setUser(u);
                    const r = u.role;
                    if (r === 'admin') navigate('/admin');
                    else if (r === 'team_manager') navigate('/manager');
                    else if (r === 'referee') navigate('/referee');
                    else if (r === 'scouter') navigate('/scouter');
                    else navigate('/player');
                })
                .catch(() => navigate('/player'));
        }
    }, [searchParams, navigate, setUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Static Admin Bypass (for development convenience)
        // Only bypass if password is NOT provided. If password is provided, try real login.
        if (email === 'admin@admin.com' && !password) {
            const devUser = normalizeAuthUser({ nickname: 'Admin (Dev)', role: 'admin', id: 'dev', email });
            localStorage.setItem('user', JSON.stringify(devUser));
            localStorage.setItem('token', 'bypass_token_dev_only');
            setUser(devUser);
            navigate('/admin');
            return;
        }

        try {
            const response = await AuthService.login({ email, password });
            setUser(response.user);

            toast.success('Login successful! Welcome back.');

            const role = response.user.role;
            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'team_manager') {
                navigate('/manager');
            } else if (role === 'referee') {
                navigate('/referee');
            } else if (role === 'scouter') {
                navigate('/scouter');
            } else {
                navigate('/player'); // Default for players and uncertain roles
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
        <div className="min-h-screen min-h-dvh bg-zinc-950 flex flex-col md:grid md:grid-cols-[minmax(0,45%)_minmax(0,55%)] md:grid-rows-1 overflow-hidden">
            {/* Form — left 45% */}
            <section className="relative z-20 flex flex-col justify-center px-5 sm:px-8 lg:px-10 py-10 md:py-12 overflow-y-auto max-h-[100dvh] md:border-r md:border-white/[0.06] bg-gradient-to-b from-zinc-950 via-[#0a0a0a] to-zinc-950">
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
                                Welcome <span className="text-primary">Back</span>
                            </h1>
                            <p className="text-zinc-500 text-sm mt-2.5 max-w-md leading-relaxed">
                                Sign in with Google or Steam — or use your email below.
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
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Sign in</p>

                        {error && (
                            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Email or Username</label>
                                <Input
                                    type="text"
                                    placeholder="player@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center gap-2 ml-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Password</label>
                                    <Link to="/forgot-password" className="text-[10px] sm:text-xs font-semibold text-primary hover:underline underline-offset-2 shrink-0">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="p-1 text-text-muted hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                            </div>

                            <Button className="w-full uppercase font-black tracking-wide" size="lg" isLoading={loading}>
                                Log in
                            </Button>
                        </form>
                    </div>

                    <p className="text-zinc-500 text-sm mt-8 pb-2">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline underline-offset-2">
                            Register now
                        </Link>
                    </p>
                </div>
            </section>

            {/* LoL splash (Data Dragon) — right 55% */}
            <section className="relative min-h-[200px] sm:min-h-[280px] md:min-h-screen min-w-0 border-t border-white/[0.06] md:border-t-0">
                <AuthLeagueBackdrop fallbackSrc={lolLoginFallback} objectFocus="right" />
            </section>
        </div>
    );
}


