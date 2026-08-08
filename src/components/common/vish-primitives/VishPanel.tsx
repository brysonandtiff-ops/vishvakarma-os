import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface VishPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

/**
 * VishPanel: Base glassmorphic container for larger surfaces (sidebars, toolbars, dashboards).
 */
export function VishPanel({ children, className, ...props }: VishPanelProps) {
    return (
        <div
            className={cn(
                'bg-[rgba(5,5,7,0.85)]',
                'backdrop-blur-[40px] saturate-[180%]',
                'border border-[hsl(var(--primary)/0.15)]',
                'shadow-[0_24px_70px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.05)]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
