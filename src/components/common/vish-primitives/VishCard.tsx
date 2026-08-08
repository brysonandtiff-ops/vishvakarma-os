import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface VishCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /** If true, applies hover animations and a subtle glow */
    interactive?: boolean;
}

/**
 * VishCard: A cinematic project/data card matching the Vishvakarma.OS premium aesthetic.
 * Features a very dark translucent surface, subtle blue border, inner highlights, and layered shadows.
 */
export function VishCard({ children, className, interactive = false, ...props }: VishCardProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-[14px]',
                'bg-[rgba(5,5,7,0.85)]',
                'backdrop-blur-[40px] saturate-[180%]',
                'border border-[hsl(var(--primary)/0.15)]',
                'shadow-[0_24px_70px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.05)]',
                'transition-all duration-300 ease-out',
                interactive && 'hover:border-[hsl(var(--primary)/0.3)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.4),0_0_15px_hsl(var(--primary)/0.2),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:scale-[1.01]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function VishCardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('px-5 py-4 border-b border-[rgba(42,167,255,0.1)]', className)} {...props}>
            {children}
        </div>
    );
}

export function VishCardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn('text-lg font-semibold tracking-tight text-[#F4F7FA]', className)} {...props}>
            {children}
        </h3>
    );
}

export function VishCardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-5', className)} {...props}>
            {children}
        </div>
    );
}
