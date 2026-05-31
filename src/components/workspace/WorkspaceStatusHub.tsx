import { useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Activity, HardDrive, Target } from 'lucide-react';

interface WorkspaceStatusHubProps {
  collapsed: boolean;
}

/**
 * Workspace Status Hub — Unified reporting for auth mode, data posture, 
 * navigation context, and system health.
 */
export function WorkspaceStatusHub({ collapsed }: WorkspaceStatusHubProps) {
  const location = useLocation();
  const { mode, user } = useAuth();

  const routeLabel = location.pathname === '/editor'
    ? 'Editor'
    : location.pathname.slice(1).replace(/-/g, ' ');
    
  const authStatus = user ? 'Authenticated' : 'Anonymous';
  
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-5 py-5 border-t border-ws-border/60 text-ws-text-faint">
        <ShieldCheck className="h-4 w-4 text-success/80" />
        <Activity className="h-4 w-4 text-ws-active/80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="vish-status-hub space-y-4 border-t border-ws-border/60 p-4">
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-ws-text-faint/80">
        <span>System Status</span>
        <Activity className="h-2.5 w-2.5 animate-pulse text-success" />
      </div>
      
      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5 text-[10px] font-medium text-ws-text-dim">
          <ShieldCheck className="h-3.5 w-3.5 text-success/80" />
          <span className="truncate">{authStatus} · {mode}</span>
        </div>
        
        <div className="flex items-center gap-2.5 text-[10px] text-ws-text-dim">
          <HardDrive className="h-3.5 w-3.5 text-ws-text-faint" />
          <span className="truncate capitalize">{routeLabel} Center</span>
        </div>

        <div className="flex items-center gap-2.5 text-[10px] text-ws-text-dim">
          <Target className="h-3.5 w-3.5 text-ws-active/80" />
          <span className="truncate font-mono">v1.0.0-RC1 · Release Ready</span>
        </div>
      </div>
    </div>
  );
}
