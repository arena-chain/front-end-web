import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, Mail, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService } from '../services/auth.service';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setFormData(prev => ({ ...prev, email: emailParam }));
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await AuthService.resetPassword({
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.password
            });

            toast.success('Password reset successful! You can now log in.');
            navigate('/login');
        } catch (err: any) {
            console.error('Reset password error:', err);
            const errorMessage = err.message || 'Failed to reset password. Please check your code or try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden py-12 px-4 text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 text-white">
                <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[100%] bg-primary/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-900/10 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl relative z-10 animate-fade-in-up shadow-2xl shadow-primary/5">
                <div className="mb-8 text-center">
                    <Link to="/login" className="inline-flex items-center gap-2 mb-8 group">
                        <ArrowLeft className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                        <span className="text-text-muted text-sm group-hover:text-white transition-colors">Back to Login</span>
                    </Link>

                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/50">
                            <Gamepad2 className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">New Password</h1>
                    <p className="text-text-muted text-sm">Enter the code sent to your email and your new password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="player@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="pl-10"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Reset Code (OTP)</label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    name="otp"
                                    placeholder="Enter 6-digit code"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    required
                                    className="pl-10 tracking-[0.2em] font-mono"
                                    maxLength={6}
                                />
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">New Password</label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="pl-10"
                                    minLength={8}
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Confirm New Password</label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="pl-10"
                                    minLength={8}
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                        </div>
                    </div>

                    <Button className="w-full" size="lg" isLoading={loading}>
                        Reset Password
                    </Button>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                    <p className="text-text-muted text-sm">
                        Didn't receive a code?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-primary font-bold hover:text-primary-light transition-colors"
                        >
                            Resend Request
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
