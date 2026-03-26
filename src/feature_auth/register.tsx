import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui/core';
import { Gamepad2, ArrowLeft, Users, Shield, User, Binoculars } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService } from '../services/auth.service';

type UserRole = 'player' | 'team_manager' | 'referee' | 'scouter';

export default function Register() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<UserRole>('player');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        region: 'EUROPE',
        // Role specific fields
        organizationName: '',
        level: '',
        scouterLevel: 'REGIONAL',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            if (selectedRole === 'player') {
                // @ts-ignore
                await AuthService.registerPlayer({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    isPro: false // Default
                });
            } else if (selectedRole === 'team_manager') {
                await AuthService.registerTeamManager({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    organizationName: formData.organizationName
                });
            } else if (selectedRole === 'referee') {
                await AuthService.registerReferee({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    level: formData.level || 'Junior'
                });
            } else if (selectedRole === 'scouter') {
                await AuthService.registerScouter({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname,
                    level: formData.scouterLevel as 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL',
                    notes: formData.notes || undefined
                });
            }

            toast.success("Account created successfully! Please verify your email.");
            navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden py-12">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute bottom-[-50%] left-[-20%] w-[100%] h-[100%] bg-primary/10 rounded-full blur-[150px]" />
                <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-900/10 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-2xl bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl relative z-10 animate-fade-in-up shadow-2xl shadow-primary/5">
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

                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Join the Arena</h1>
                    <p className="text-text-muted text-sm">Choose your role and start your journey.</p>
                </div>

                {/* Role Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <RoleCard
                        role="player"
                        selected={selectedRole === 'player'}
                        onClick={() => setSelectedRole('player')}
                        icon={<User className="w-6 h-6" />}
                        label="Player"
                    />
                    <RoleCard
                        role="team_manager"
                        selected={selectedRole === 'team_manager'}
                        onClick={() => setSelectedRole('team_manager')}
                        icon={<Users className="w-6 h-6" />}
                        label="Manager"
                    />
                    <RoleCard
                        role="referee"
                        selected={selectedRole === 'referee'}
                        onClick={() => setSelectedRole('referee')}
                        icon={<Shield className="w-6 h-6" />}
                        label="Referee"
                    />
                    <RoleCard
                        role="scouter"
                        selected={selectedRole === 'scouter'}
                        onClick={() => setSelectedRole('scouter')}
                        icon={<Binoculars className="w-6 h-6" />}
                        label="Scouter"
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Username</label>
                            <Input
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleChange}
                                placeholder="GamerTag123"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Email Address</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="user@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Region</label>
                        <select
                            name="region"
                            value={formData.region}
                            onChange={(e: any) => handleChange(e)}
                            className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all duration-200 text-white text-sm appearance-none cursor-pointer"
                            required
                        >
                            <option value="EUROPE">EUROPE</option>
                            <option value="AFRICA">AFRIQUE</option>
                            <option value="ASIA">ASIE</option>
                            <option value="AMERICAS">AMÉRIQUES</option>
                            <option value="OCEANIA">OCÉANIE</option>
                        </select>
                    </div>

                    {/* Dynamic Fields based on Role */}
                    {selectedRole === 'team_manager' && (
                        <div className="space-y-2 animate-fade-in-up">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Organization Name</label>
                            <Input
                                name="organizationName"
                                value={formData.organizationName}
                                onChange={handleChange}
                                placeholder="e.g. Cloud9, Team Liquid"
                                required
                            />
                        </div>
                    )}

                    {selectedRole === 'referee' && (
                        <div className="space-y-2 animate-fade-in-up">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Certification Level</label>
                            <Input
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                placeholder="e.g. Junior, Senior, Expert"
                            />
                        </div>
                    )}

                    {selectedRole === 'scouter' && (
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Scouter Level</label>
                                <select
                                    name="scouterLevel"
                                    value={formData.scouterLevel}
                                    onChange={(e: any) => setFormData({ ...formData, scouterLevel: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all duration-200 text-white text-sm appearance-none cursor-pointer"
                                >
                                    <option value="REGIONAL">Regional</option>
                                    <option value="NATIONAL">National</option>
                                    <option value="INTERNATIONAL">International</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Notes (optional)</label>
                                <Input
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="e.g. Scouting for EU leagues"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Password</label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Confirm Password</label>
                            <Input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button className="w-full" size="lg" isLoading={loading}>
                            Create {selectedRole === 'team_manager' ? 'Manager' : selectedRole === 'scouter' ? 'Scouter' : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
                        </Button>
                    </div>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                    <p className="text-text-muted text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-bold hover:text-primary-light transition-colors">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function RoleCard({ selected, onClick, icon, label }: { role: string, selected: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300
                ${selected
                    ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                    : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:border-white/10'
                }
            `}
        >
            <div className={`mb-2 ${selected ? 'text-primary' : 'text-text-muted'}`}>
                {icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}
