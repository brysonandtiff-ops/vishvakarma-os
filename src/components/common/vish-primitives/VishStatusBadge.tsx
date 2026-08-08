import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type VishStatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface VishStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: VishStatusType;
    children: React.ReactNode;
}

export function VishStatusBadge({ status, children, className, ...props }: VishStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                {
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': status === 'success',
                    'bg-amber-500/10 text-amber-400 border-amber-500/20': status === 'warning',
                    'bg-rose-500/10 text-rose-400 border-rose-500/20': status === 'error',
                    'bg-vish-blue-500/10 text-vish-blue-400 border-vish-blue-500/20': status === 'info',
                    'bg-vish-navy-600/30 text-vish-text-300 border-vish-navy-600/50': status === 'neutral',
                },
                className
            )}
            {...props}
        >
            <span className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5',
                {
                    'bg-emerald-400': status === 'success',
                    'bg-amber-400': status === 'warning',
                    'bg-rose-400': status === 'error',
                    'bg-vish-blue-400': status === 'info',
                    'bg-vish-text-400': status === 'neutral',
                }
            )} />
            {children}
        </span>
    );
}
