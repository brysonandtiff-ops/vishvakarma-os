import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface VishToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'workstation';
    children: React.ReactNode;
}

export function VishToolbar({ orientation = 'horizontal', variant = 'default', children, className, ...props }: VishToolbarProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-1.5 p-1.5 rounded-[10px]',
                'bg-[rgba(6,18,33,0.8)] backdrop-blur-xl',
                'border border-vish-navy-600/50 shadow-md',
                orientation === 'vertical' ? 'flex-col' : 'flex-row',
                variant === 'workstation' && 'vish-toolbar-workstation',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export interface VishToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
    children: React.ReactNode;
}

export function VishToolButton({ active, children, className, ...props }: VishToolButtonProps) {
    return (
        <button
            className={cn(
                'relative flex items-center justify-center rounded-[8px] p-2 transition-all duration-200',
                'text-vish-text-300 hover:text-white hover:bg-vish-navy-700/50',
                active && [
                    'text-white bg-vish-blue-500 shadow-[0_0_12px_rgba(42,167,255,0.4)]',
                    'before:absolute before:inset-0 before:rounded-[8px] before:border before:border-vish-gold-500/50 before:pointer-events-none'
                ],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
