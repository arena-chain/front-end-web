import React, { useState } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, AlertCircle } from 'lucide-react';
import { AuthService } from '../services/auth.service';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Static Admin Bypass (for development convenience)
        if (email === 'admin@admin.com') {
            navigate('/admin');
            return;
        }

        try {
            const response = await AuthService.login({ email, password });

            // Save token and user info
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));

            toast.success('Login successful! Welcome back.');

            const role = response.user.role;
            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'team-manager') {
                navigate('/manager');
            } else if (role === 'referee') {
                navigate('/referee');
            } else {
                navigate('/player'); // Default for players and uncertain roles
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.message || 'Invalid credentials. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[100%] bg-primary/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-900/10 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl relative z-10 animate-fade-in-up shadow-2xl shadow-primary/5">
                <div className="mb-8 text-center">
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
                    <p className="text-text-muted text-sm">Enter your credentials to access the arena.</p>
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
                            <a href="#" className="text-xs text-primary hover:text-primary-light transition-colors">Forgot Password?</a>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button className="w-full" size="lg" isLoading={loading}>Log In</Button>
                </form>

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
