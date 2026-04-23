import React from 'react';

export function StudioSelect({ label, icon, value, options, onChange }: {
    label: string;
    icon: React.ReactNode;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="min-w-0">
            <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
                {icon}
                {label}
            </label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="studio-select box-border w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
            >
                {options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
        </div>
    );
}

export function StudioSlider({ label, value, onChange }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white font-bold">{label}</span>
                <span className="text-xs text-primary font-black">{value}</span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={e => onChange(+e.target.value)}
                className="w-full accent-primary"
            />
        </div>
    );
}

export function ColorPicker({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="min-w-0">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</label>
            <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="box-border h-11 w-full min-w-0 cursor-pointer rounded-xl border border-white/10 bg-black/30 px-1 py-1"
            />
        </div>
    );
}
