import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function VishInspector({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex flex-col w-72 h-full overflow-y-auto',
                'bg-[rgba(5,5,7,0.85)] backdrop-blur-[40px] saturate-[180%]',
                'border-l border-[hsl(var(--primary)/0.15)] shadow-[0_24px_70px_rgba(0,0,0,0.28)]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function VishInspectorSection({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex flex-col border-b border-vish-navy-600/50', className)} {...props}>
            {children}
        </div>
    );
}

export function VishInspectorHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-vish-text-400', className)} {...props}>
            {children}
        </div>
    );
}

export function VishInspectorContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('px-4 pb-4 flex flex-col gap-3', className)} {...props}>
            {children}
        </div>
    );
}

export function VishInspectorRow({ label, children, className }: { label: string, children: React.ReactNode, className?: string }) {
    return (
        <div className={cn('flex items-center justify-between text-sm', className)}>
            <span className="text-vish-text-300">{label}</span>
            <div className="text-vish-text-100">{children}</div>
        </div>
    );
}
