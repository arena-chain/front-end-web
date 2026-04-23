import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Loader2, X } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-black hover:bg-primary-dark font-bold uppercase tracking-wider',
            secondary: 'bg-surface text-white hover:bg-gray-800 border border-white/10',
            outline: 'border-2 border-primary text-primary hover:bg-primary/10',
            ghost: 'bg-transparent text-white hover:bg-white/5',
            danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
        };

        const sizes = {
            sm: 'h-9 px-4 text-xs',
            md: 'h-11 px-6 text-sm',
            lg: 'h-14 px-8 text-base',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'relative inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none skew-x-[-10deg]', // Faceit style skew
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                <span className="skew-x-[10deg] flex items-center gap-2"> {/* Unskew content */}
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {children}
                </span>
            </button>
        );
    }
);
Button.displayName = "Button";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, rightElement, ...props }, ref) => {
        return (
            <div className="relative group">
                <input
                    ref={ref}
                    className={cn(
                        "w-full bg-surface border-2 border-white/5 px-4 py-3 text-white outline-none transition-all placeholder:text-text-muted focus:border-primary",
                        rightElement ? "pr-12" : null,
                        className
                    )}
                    {...props}
                />
                {rightElement ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                ) : null}
            </div>
        );
    }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <div className="relative group">
                {label && <label className="block text-sm font-medium text-text-muted mb-2">{label}</label>}
                <textarea
                    ref={ref}
                    className={cn(
                        "w-full bg-surface border-2 border-white/5 px-4 py-3 text-white outline-none transition-all placeholder:text-text-muted focus:border-primary resize-none",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, children, ...props }, ref) => {
        return (
            <div className="relative group">
                {label && <label className="block text-sm font-medium text-text-muted mb-2">{label}</label>}
                <select
                    ref={ref}
                    className={cn(
                        "w-full bg-surface border-2 border-white/5 px-4 py-3 text-white outline-none transition-all focus:border-primary appearance-none cursor-pointer",
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        );
    }
);
Select.displayName = "Select";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'primary', children, ...props }) => {
    const variants = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-white/5 text-text-muted border-white/10',
        success: 'bg-green-500/10 text-green-500 border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        danger: 'bg-red-500/10 text-red-500 border-red-500/20',
        info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** `reel` = narrow phone-style column (shorts / clips); `fullscreen` = edge-to-edge on small phones */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'reel' | 'fullscreen';
    hideDefaultHeader?: boolean;
    /**
     * When false, the modal body does not scroll (overflow hidden + flex column).
     * Use when children define a single inner scroll area (e.g. reel layout).
     */
    bodyScroll?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    hideDefaultHeader = false,
    bodyScroll = true,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]',
        reel: 'max-w-[min(340px,calc(100vw-1.5rem))]',
        fullscreen: 'max-w-none w-full h-full max-h-[100dvh] rounded-none border-0',
    };

    const isFullscreen = size === 'fullscreen';

    return createPortal(
        <div
            className={cn(
                'fixed inset-0 z-[100] flex items-center justify-center',
                isFullscreen ? 'p-0' : 'p-4',
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    'relative bg-surface border-2 border-white/10 shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200',
                    isFullscreen ? 'max-h-[100dvh] h-full border-0' : 'max-h-[90vh]',
                    size === 'reel' ? 'rounded-3xl' : isFullscreen ? 'rounded-none' : 'rounded-xl',
                    sizes[size],
                    !bodyScroll && 'flex flex-col min-h-0',
                )}
            >
                {/* Header */}
                {title && !hideDefaultHeader && (
                    <div
                        className={cn(
                            'flex items-center justify-between border-b border-white/5 bg-surface/50 shrink-0',
                            size === 'reel' ? 'px-3 py-2.5' : 'px-6 py-4',
                        )}
                    >
                        <h2
                            className={cn(
                                'font-black uppercase tracking-tighter text-white truncate pr-2',
                                size === 'reel' ? 'text-sm' : 'text-xl',
                            )}
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className={cn(
                                'text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5 shrink-0',
                                size === 'reel' ? 'p-1.5' : 'p-2',
                            )}
                        >
                            <X className={size === 'reel' ? 'w-4 h-4' : 'w-5 h-5'} />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div
                    className={cn(
                        bodyScroll
                            ? cn(
                                  'overflow-y-auto custom-scrollbar',
                                  isFullscreen
                                      ? 'max-h-[100dvh]'
                                      : 'max-h-[calc(90vh-80px)]',
                              )
                            : 'overflow-hidden flex flex-col flex-1 min-h-0',
                    )}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
