import { Save } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';

export default function Settings() {
    return (
        <div className="max-w-4xl space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Platform Settings</h1>
                    <p className="text-text-muted">Configure global platform parameters and rules.</p>
                </div>
                <Button className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                </Button>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-surface border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5">General Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Platform Name</label>
                            <Input defaultValue="Arena Chain" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Support Email</label>
                            <Input defaultValue="support@arenachain.gg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Maintenance Mode</label>
                            <select className="w-full bg-surface border-2 border-white/5 px-4 py-3 text-white outline-none focus:border-primary rounded-none">
                                <option>Disabled</option>
                                <option>Enabled</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Default Language</label>
                            <select className="w-full bg-surface border-2 border-white/5 px-4 py-3 text-white outline-none focus:border-primary rounded-none">
                                <option>English (US)</option>
                                <option>French</option>
                                <option>Spanish</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Game Integrations */}
                <div className="bg-surface border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5">Game Integrations</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                            <div>
                                <div className="font-bold text-white">Riot Games API</div>
                                <div className="text-sm text-text-muted">Status: Connected</div>
                            </div>
                            <Button variant="outline" size="sm">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                            <div>
                                <div className="font-bold text-white">Steam Web API</div>
                                <div className="text-sm text-text-muted">Status: Connected</div>
                            </div>
                            <Button variant="outline" size="sm">Configure</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
