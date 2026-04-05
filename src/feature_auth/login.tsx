import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import loginCover from '../assets/0x0.webp';
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

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
            {/* Background Image Wrapper */}
            <div className="absolute inset-0 z-0">
                <img src={loginCover} alt="Login Background" className="w-full h-full object-cover object-center" />
            </div>

            <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-primary/20 p-10 rounded-3xl relative z-10 shadow-[0_0_50px_rgba(0,255,0,0.05)] transition-all duration-700 hover:shadow-[0_0_80px_rgba(0,255,0,0.1)] hover:border-primary/40 group overflow-hidden" 
                 style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                
                {/* Animated inner border glow */}
                <div className="absolute inset-0 z-0 pointer-events-none rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" style={{ background: 'radial-gradient(circle at 50% -20%, rgba(0,255,0,0.15), transparent 70%)' }}></div>
                </div>

                <div className="relative z-10 mb-8 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
                        <ArrowLeft className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                        <span className="text-text-muted text-sm group-hover:text-white transition-colors">Back to Home</span>
                    </Link>

                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/50">
                            <Gamepad2 className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Welcome Back</h1>
                    <p className="text-text-muted text-sm mb-2">Enter your credentials to access the arena.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Password</label>
                            <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-light transition-colors">Forgot Password?</Link>
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

                    <Button className="w-full" size="lg" isLoading={loading}>Log In</Button>
                </form>

                <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">OR</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5"
                        onClick={() => window.location.href = `${AuthService.getApiUrl()}/auth/google`}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full border-white/10 hover:bg-[#1b2838] hover:text-white transition-all group"
                        onClick={() => window.location.href = `${AuthService.getApiUrl()}/auth/steam`}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-text-muted group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.627-5.373-12-12-12zm0 18.28c-3.465 0-6.273-2.808-6.273-6.273 0-3.465 2.808-6.273 6.273-6.273 3.465 0 6.273 2.808 6.273 6.273S15.465 18.577 12 18.577zm0-10.455c-2.31 0-4.182 1.872-4.182 4.182 0 2.31 1.872 4.182 4.182 4.182 2.31 0 4.182-1.872 4.182-4.182 0-2.31-1.872-4.182-4.182-4.182z" />
                            </svg>
                            Continue with Steam
                        </div>
                    </Button>
                </div>

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                    <p className="text-text-muted text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary font-bold hover:text-primary-light transition-colors">
                            Register Now
                        </Link>
                    </p>
                </div>
             </div>
         </div>
     );
 }


