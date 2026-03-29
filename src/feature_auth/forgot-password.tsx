import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService } from '../services/auth.service';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await AuthService.forgotPassword(email);
            setSubmitted(true);
            toast.success('Reset code sent to your email!');

            // Navigate to reset password page after a brief delay
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (err: unknown) {
            console.error('Forgot password error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to send reset code. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden px-4">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
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

                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Reset Password</h1>
                    <p className="text-text-muted text-sm">Enter your email to receive a reset code.</p>
                </div>

                {submitted ? (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/50 animate-bounce">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">Check your email</h2>
                            <p className="text-text-muted">We've sent a 6-digit code to <span className="text-white font-medium">{email}</span></p>
                        </div>
                        <p className="text-xs text-text-muted italic">Redirecting you to the verification page...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="player@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                        </div>

                        <Button className="w-full" size="lg" isLoading={loading}>
                            Send Reset Code
                        </Button>
                    </form>
                )}

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                    <p className="text-text-muted text-sm">
                        Remember your password?{' '}
                        <Link to="/login" className="text-primary font-bold hover:text-primary-light transition-colors">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
