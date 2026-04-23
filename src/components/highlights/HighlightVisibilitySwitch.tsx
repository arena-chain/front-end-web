import { cn } from '../../lib/utils';
import type { HighlightVisibilityValue } from './HighlightVisibilityToggle';

type Props = {
    value: HighlightVisibilityValue;
    onChange: (v: HighlightVisibilityValue) => void;
    disabled?: boolean;
    isLoading?: boolean;
};

/**
 * Compact iOS-style switch: off = Privé, on = Public.
 */
export function HighlightVisibilitySwitch({ value, onChange, disabled, isLoading }: Props) {
    const isPublic = value === 'public';
    return (
        <div className="flex items-center gap-3">
            <span
                className={cn(
                    'text-[10px] font-black uppercase tracking-[0.14em] transition-colors',
                    !isPublic ? 'text-white' : 'text-white/35',
                )}
            >
                Privé
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                aria-label={isPublic ? 'Rendre le clip privé' : 'Rendre le clip public'}
                disabled={disabled || isLoading}
                onClick={() => onChange(isPublic ? 'private' : 'public')}
                className={cn(
                    'relative h-7 w-11 shrink-0 rounded-full border p-0.5 transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c0f]',
                    isPublic
                        ? 'border-primary/45 bg-primary/20 shadow-[0_0_18px_rgba(0,255,136,0.12)]'
                        : 'border-white/12 bg-[#0d1014]',
                    (disabled || isLoading) && 'opacity-50 pointer-events-none',
                )}
            >
                <span
                    className={cn(
                        'block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
                        isPublic && 'translate-x-4 bg-primary',
                    )}
                />
            </button>
            <span
                className={cn(
                    'text-[10px] font-black uppercase tracking-[0.14em] transition-colors',
                    isPublic ? 'text-primary' : 'text-white/35',
                )}
            >
                Public
            </span>
        </div>
    );
}
