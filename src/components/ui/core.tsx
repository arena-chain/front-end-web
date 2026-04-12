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
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    hideDefaultHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', hideDefaultHeader = false }) => {
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
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={cn(
                'relative bg-surface border-2 border-white/10 rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200',
                sizes[size]
            )}>
                {/* Header */}
                {title && !hideDefaultHeader && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface/50">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
