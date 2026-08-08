import React from 'react';
import { cn } from '@/lib/utils';
import { Box } from 'lucide-react'; // Fallback icon

interface VishEmptyStateProps {
  label: string;
  className?: string;
  icon?: React.ReactNode;
}

export function VishEmptyState({ label, className, icon }: VishEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 rounded-lg border border-primary/10',
        'bg-[#050507]/40 backdrop-blur-xl',
        className
      )}
    >
      <div className="relative mb-4">
        {/* Laser-etched glowing aura */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
        
        {/* SVG wireframe / icon wrapper */}
        <div className="relative text-primary/60 prana-glow">
          {icon ? (
            icon
          ) : (
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-80"
            >
              {/* Abstract blueprint wireframe */}
              <rect x="8" y="8" width="48" height="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M8 32H56" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
              <path d="M32 8V56" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
              <rect x="16" y="16" width="32" height="32" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1" />
              <circle cx="32" cy="32" r="2" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>
      <p className="font-mono text-sm tracking-wider text-muted-foreground uppercase opacity-80">
        {label}
      </p>
    </div>
  );
}
