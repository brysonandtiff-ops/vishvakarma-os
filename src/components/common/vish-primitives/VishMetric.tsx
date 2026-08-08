import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface VishMetricProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

export function VishMetric({ label, value, subValue, trend, trendValue, className, ...props }: VishMetricProps) {
    return (
        <div className={cn('flex flex-col gap-1', className)} {...props}>
            <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-vish-text-400">
                {label}
            </span>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-vish-text-100">
                    {value}
                </span>
                {subValue && (
                    <span className="text-sm font-medium text-vish-text-300">
                        {subValue}
                    </span>
                )}
            </div>
            {trendValue && (
                <span className={cn(
                    "text-xs font-medium",
                    trend === 'up' ? "text-emerald-400" : trend === 'down' ? "text-rose-400" : "text-vish-text-300"
                )}>
                    {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
                    {trendValue}
                </span>
            )}
        </div>
    );
}
