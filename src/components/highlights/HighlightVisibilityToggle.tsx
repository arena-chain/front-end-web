import { cn } from '../../lib/utils';

export type HighlightVisibilityValue = 'public' | 'private';

type Props = {
    value: HighlightVisibilityValue;
    onChange: (v: HighlightVisibilityValue) => void;
    disabled?: boolean;
    isLoading?: boolean;
};

/**
 * Segmented control — Privé (default) vs Public (discovery feed). No skew: keeps borders crisp.
 */
export function HighlightVisibilityToggle({ value, onChange, disabled, isLoading }: Props) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Visibilité du clip
            </p>
            <div
                role="radiogroup"
                aria-label="Visibilité du clip"
                className="flex w-full rounded-xl border border-white/10 bg-[#080a0d] p-1 gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
                {(['private', 'public'] as const).map((opt) => {
                    const selected = value === opt;
                    return (
                        <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={disabled || isLoading}
                            onClick={() => {
                                if (!selected) onChange(opt);
                            }}
                            className={cn(
                                'flex-1 min-w-0 rounded-lg py-2.5 px-3 text-center transition-all duration-200',
                                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0e11]',
                                selected
                                    ? opt === 'public'
                                        ? 'bg-primary/20 text-primary ring-1 ring-primary/40 shadow-[0_0_16px_rgba(0,255,135,0.12)]'
                                        : 'bg-white/[0.14] text-white ring-1 ring-white/20'
                                    : 'text-white/38 bg-transparent hover:text-white/65 hover:bg-white/[0.06]',
                            )}
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.12em]">
                                {opt === 'private' ? 'Privé' : 'Public'}
                            </span>
                        </button>
                    );
                })}
            </div>
            {isLoading ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary/90">Enregistrement…</p>
            ) : null}
            <p className="text-[11px] text-white/45 leading-relaxed max-w-sm">
                {value === 'private' ? (
                    <>
                        <span className="text-white/60 font-semibold">Privé</span> — seul vous voyez ce clip sur votre
                        channel (réglage par défaut).
                    </>
                ) : (
                    <>
                        <span className="text-primary font-semibold">Public</span> — tout le monde peut le voir dans le
                        fil des highlights.
                    </>
                )}
            </p>
        </div>
    );
}
