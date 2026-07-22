import { CircleHelp } from 'lucide-react';
import { openTutorialHub } from './TutorialProvider';

type TutorialHelpButtonProps = {
  className?: string;
  label?: string;
  variant?: 'icon' | 'sidebar';
};

export default function TutorialHelpButton({
  className = '',
  label = 'Tutorials',
  variant = 'icon',
}: TutorialHelpButtonProps) {
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={() => openTutorialHub()}
        className={`flex h-10 w-full items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-2.5 text-xs font-medium text-ws-text transition-colors hover:bg-primary/10 ${className}`}
        data-tutorial="help-button"
        aria-label="Open tutorials"
      >
        <CircleHelp className="h-4 w-4 shrink-0 text-primary" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openTutorialHub()}
      aria-label="Open tutorials"
      data-tutorial="help-button"
      className={`vish-editor-icon-btn touch-target flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-transparent text-ws-text-dim transition-colors hover:border-ws-border hover:bg-ws-hover hover:text-primary ${className}`}
    >
      <CircleHelp className="h-4 w-4" />
    </button>
  );
}
