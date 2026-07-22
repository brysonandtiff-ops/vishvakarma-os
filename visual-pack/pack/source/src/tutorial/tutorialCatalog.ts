import type { LucideIcon } from 'lucide-react';
import {
  Box,
  Cloud,
  Compass,
  FileOutput,
  FileText,
  FolderOpen,
  GitPullRequest,
  History,
  Package,
  PenLine,
  Route,
  Sparkles,
} from 'lucide-react';
import type { TutorialTrack } from './types';

export const TUTORIAL_TRACKS: TutorialTrack[] = [
  {
    id: 'essentials',
    title: 'Essentials',
    description: 'Draw, preview in 3D, and understand Project Proof in one quick pass.',
    estMinutes: 4,
    style: 'hybrid',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Vishvakarma.OS',
        body: 'You will draw in 2D, preview in 3D, and keep proof visible while you work. This tour takes about four minutes.',
        placement: 'center',
      },
      {
        id: 'tool-rail',
        title: 'Your drafting tools',
        body: 'The tool rail on the left holds every drafting tool. Base tools work in every workspace mode.',
        target: 'tool-rail',
        placement: 'right',
      },
      {
        id: 'select-wall',
        title: 'Select the Wall tool',
        body: 'Tap Wall or press W. Then tap two points on the canvas to draw your first wall segment.',
        target: 'tool-wall',
        placement: 'right',
        gate: 'tool:wall',
        optionalAction: 'Press W on keyboard',
      },
      {
        id: 'draw-wall',
        title: 'Draw a wall',
        body: 'Tap a start corner on the canvas, then tap an end point. Walls snap to the grid when snap is on.',
        target: 'blueprint-canvas',
        placement: 'top',
        gate: 'geometry:wall',
        optionalAction: 'Draw at least one wall segment',
      },
      {
        id: 'place-opening',
        title: 'Add a door or window',
        body: 'Select Door (D) or Window (N), then tap a wall to place an opening. Openings snap onto walls automatically.',
        target: 'tool-door',
        placement: 'right',
        gate: 'geometry:opening',
        optionalAction: 'Place at least one opening',
      },
      {
        id: 'toggle-3d',
        title: 'Open live 3D preview',
        body: 'Every 2D edit syncs to the 3D chamber instantly — no re-export step.',
        target: 'toggle-3d',
        placement: 'bottom',
        gate: 'view:3d',
      },
      {
        id: 'project-proof',
        title: 'Project Proof',
        body: 'The proof strip shows save mode, structure counts, compliance status, and export readiness at a glance.',
        target: 'project-proof',
        placement: 'bottom',
      },
      {
        id: 'save-project',
        title: 'Save your work',
        body: 'Open Project actions and tap Save. Cloud save requires sign-in; otherwise projects stay as local drafts in this browser.',
        target: 'project-actions',
        placement: 'bottom',
      },
      {
        id: 'complete',
        title: 'You are ready to draft',
        body: 'Open the Tutorials hub anytime from Help in the top bar or workspace sidebar to explore advanced workflows.',
        placement: 'center',
      },
    ],
  },
  {
    id: 'first-floor-plan',
    title: 'Your First Floor Plan',
    description: 'Load a sample or start blank, then close a room with walls, doors, and windows.',
    estMinutes: 5,
    style: 'hands-on',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'start',
        title: 'Start a project',
        body: 'Load the demo blueprint for a guided example, or start blank and draw from scratch.',
        target: 'project-actions',
        placement: 'bottom',
      },
      {
        id: 'wall-tool',
        title: 'Draw enclosing walls',
        body: 'Use Wall (W) to tap corners and form a closed rectangle. Repeat until all four sides are drawn.',
        target: 'tool-wall',
        placement: 'right',
        gate: 'tool:wall',
      },
      {
        id: 'walls-done',
        title: 'Complete the room shell',
        body: 'Draw enough walls to enclose at least one room. The status bar shows your wall count.',
        target: 'blueprint-canvas',
        placement: 'top',
        gate: 'geometry:wall',
      },
      {
        id: 'door',
        title: 'Place a door',
        body: 'Select Door (D) and tap a wall segment. Drag handles later to resize in the properties panel.',
        target: 'tool-door',
        placement: 'right',
        gate: 'geometry:opening',
      },
      {
        id: 'window',
        title: 'Place a window',
        body: 'Select Window (N) and tap another wall. Windows and doors both count as openings.',
        target: 'tool-window',
        placement: 'right',
      },
      {
        id: 'verify-3d',
        title: 'Verify in 3D',
        body: 'Toggle 3D and orbit to confirm walls, door, and window render correctly.',
        target: 'toggle-3d',
        placement: 'bottom',
        gate: 'view:3d',
      },
    ],
  },
  {
    id: 'sacred-3d',
    title: 'Sacred 3D View',
    description: 'Orbit the live chamber, inspect openings, and scrub the solar timeline.',
    estMinutes: 3,
    style: 'hybrid',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'open-3d',
        title: 'Open the 3D pane',
        body: 'The 3D preview shares geometry with your 2D plan in real time.',
        target: 'toggle-3d',
        placement: 'bottom',
        gate: 'view:3d',
      },
      {
        id: 'viewport',
        title: 'Orbit and inspect',
        body: 'Drag to orbit, scroll to zoom. Confirm door swings and window placements match your plan.',
        target: 'viewport-3d',
        placement: 'left',
      },
      {
        id: 'solar',
        title: 'Solar timeline',
        body: 'Scrub time-of-day in the Properties panel to preview sun angle and lighting on façades.',
        target: 'solar-timeline',
        placement: 'left',
      },
      {
        id: 'walk-mode',
        title: 'Walk mode (optional)',
        body: 'Switch workspace mode to Walk for first-person navigation inside the model.',
        target: 'mode-walk',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'labels-export',
    title: 'Labels & Export',
    description: 'Annotate rooms and export a client-ready package.',
    estMinutes: 4,
    style: 'spotlight',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'label-tool',
        title: 'Add room labels',
        body: 'Select Label (T) and tap a room center. Double-click a label on canvas to rename it.',
        target: 'tool-text',
        placement: 'right',
      },
      {
        id: 'dimension-tool',
        title: 'Add dimensions',
        body: 'Select Dimension (Shift+M) and tap two points. Press Shift+D to toggle dimension visibility.',
        target: 'tool-dimension',
        placement: 'right',
      },
      {
        id: 'open-export',
        title: 'Open Export Package',
        body: 'Project actions → Export opens the full deliverable dialog with PDF, PNG, JSON, SVG, and DXF.',
        target: 'project-actions',
        placement: 'bottom',
        gate: 'dialog:export-open',
        gateHint: 'Open Export from Project actions to continue',
      },
      {
        id: 'export-formats',
        title: 'Choose your format',
        body: 'PDF is recommended for client review. JSON preserves the full manifest for round-trip import.',
        target: 'export-dialog',
        placement: 'center',
      },
    ],
  },
  {
    id: 'materials-interior',
    title: 'Materials & Interior',
    description: 'Style walls and place furniture in Interior workspace mode.',
    estMinutes: 4,
    style: 'hybrid',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'interior-mode',
        title: 'Switch to Interior mode',
        body: 'Interior mode unlocks furniture tools and material styling workflows.',
        target: 'mode-interior',
        placement: 'bottom',
        gate: 'mode:interior',
      },
      {
        id: 'materials',
        title: 'Wall materials',
        body: 'Select a wall, then pick wood, concrete, or brick presets in the Materials section.',
        target: 'materials-panel',
        placement: 'left',
      },
      {
        id: 'furniture',
        title: 'Place furniture',
        body: 'Press F or select Furniture, then tap the plan to place sofas, chairs, and fixtures.',
        target: 'tool-furniture',
        placement: 'right',
      },
      {
        id: 'verify-3d',
        title: 'Confirm in 3D',
        body: 'Toggle 3D to verify materials and furniture boxes render on the live model.',
        target: 'toggle-3d',
        placement: 'bottom',
        gate: 'view:3d',
      },
    ],
  },
  {
    id: 'cloud-save',
    title: 'Cloud Save & Local Draft',
    description: 'Understand save badges, cloud sync, and local draft recovery.',
    estMinutes: 3,
    style: 'spotlight',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'proof-badge',
        title: 'Save mode at a glance',
        body: 'Project Proof shows whether you are on Supabase cloud save or a local draft in this browser.',
        target: 'project-proof',
        placement: 'bottom',
      },
      {
        id: 'save',
        title: 'Save your project',
        body: 'Use Project actions → Save. Sign in at Profile when cloud save is configured.',
        target: 'project-actions',
        placement: 'bottom',
      },
      {
        id: 'profile',
        title: 'Account & billing',
        body: 'Profile holds your subscription, Stripe portal link, and account settings.',
        target: 'nav-profile',
        route: '/profile',
        placement: 'right',
      },
    ],
  },
  {
    id: 'vastu-harmony',
    title: 'Vastu Harmony',
    description: 'Orient north and review the eight-sector Vastu overlay.',
    estMinutes: 3,
    style: 'spotlight',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'draft-mode',
        title: 'Draft workspace mode',
        body: 'Vastu tools are available in Draft mode on the tool rail.',
        target: 'mode-draft',
        placement: 'bottom',
        gate: 'mode:draft',
      },
      {
        id: 'vastu-tool',
        title: 'Vastu compass tool',
        body: 'Select the Vastu tool to place and adjust the directional overlay on your plan.',
        target: 'tool-vastu',
        placement: 'right',
      },
      {
        id: 'north',
        title: 'North orientation',
        body: 'Use the compass widget on the canvas to set true north for accurate sector alignment.',
        target: 'locale-compass',
        placement: 'top',
      },
      {
        id: 'vastu-panel',
        title: 'Harmony readout',
        body: 'The Vastu panel summarizes sector balance and advisory notes for your layout.',
        target: 'vastu-panel',
        placement: 'left',
      },
    ],
  },
  {
    id: 'india-locale-nbc',
    title: 'India Locale & NBC',
    description: 'Set India jurisdiction and review NBC pre-check results.',
    estMinutes: 3,
    style: 'spotlight',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'locale',
        title: 'Locale control',
        body: 'Tap the globe on the canvas to switch between India and Australia jurisdictions.',
        target: 'editor-locale',
        placement: 'top',
      },
      {
        id: 'region',
        title: 'Metro region',
        body: 'Pick a cost region for INR estimates. This also tunes compliance defaults.',
        target: 'editor-region',
        placement: 'top',
      },
      {
        id: 'compliance',
        title: 'NBC pre-check',
        body: 'The compliance panel runs advisory NBC India checks. Resolve failures before export when blocked.',
        target: 'compliance-panel',
        placement: 'left',
      },
    ],
  },
  {
    id: 'mep-routing',
    title: 'MEP Routing',
    description: 'Place MEP symbols and review routing in MEP workspace mode.',
    estMinutes: 3,
    style: 'spotlight',
    defaultRoute: '/editor',
    steps: [
      {
        id: 'mep-mode',
        title: 'MEP workspace mode',
        body: 'Switch to MEP mode to unlock mechanical, electrical, and plumbing symbol tools.',
        target: 'mode-mep',
        placement: 'bottom',
        gate: 'mode:mep',
      },
      {
        id: 'mep-tool',
        title: 'Place MEP symbols',
        body: 'Select the MEP tool and tap the plan to drop fixtures. Inspect routing hints in the panel.',
        target: 'tool-mep',
        placement: 'right',
      },
      {
        id: 'mep-3d',
        title: 'Inspect in 3D',
        body: 'Open 3D to verify symbol placement relative to walls and rooms.',
        target: 'toggle-3d',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'projects-library',
    title: 'Projects Library',
    description: 'Search, duplicate, archive, and reopen saved blueprints.',
    estMinutes: 3,
    style: 'spotlight',
    defaultRoute: '/projects',
    steps: [
      {
        id: 'nav',
        title: 'Open Projects',
        body: 'The workspace sidebar lists every saved blueprint. Projects opens your full library.',
        target: 'nav-projects',
        route: '/projects',
        placement: 'right',
      },
      {
        id: 'search',
        title: 'Search projects',
        body: 'Filter by name to find plans quickly in large libraries.',
        target: 'projects-search',
        placement: 'bottom',
      },
      {
        id: 'create',
        title: 'Create from editor',
        body: 'New projects are created in the editor. Save there, then return here to manage them.',
        target: 'projects-new',
        placement: 'bottom',
      },
      {
        id: 'card-actions',
        title: 'Duplicate and archive',
        body: 'Use the card menu to duplicate a plan or archive old work without deleting geometry.',
        target: 'projects-grid',
        placement: 'center',
      },
    ],
  },
  {
    id: 'design-optimization',
    title: 'Design Optimization',
    description: 'Run scored design candidates from goals and budget constraints.',
    estMinutes: 4,
    style: 'spotlight',
    defaultRoute: '/optimization',
    steps: [
      {
        id: 'nav',
        title: 'Optimization dashboard',
        body: 'Design Optimization scores layout candidates against your goals — decision-support, not permit approval.',
        target: 'nav-optimization',
        route: '/optimization',
        placement: 'right',
      },
      {
        id: 'intake',
        title: 'Set constraints',
        body: 'Enter prompt, budget, bedroom count, and parcel size to shape the batch request.',
        target: 'optimization-intake',
        placement: 'bottom',
      },
      {
        id: 'run',
        title: 'Generate candidates',
        body: 'Run the batch to receive scored alternatives. Promote a winner to a new editor project.',
        target: 'optimization-run',
        placement: 'bottom',
      },
      {
        id: 'history',
        title: 'Batch history',
        body: 'Prior runs stay in history so you can compare scores and reopen reports.',
        target: 'optimization-history',
        placement: 'top',
      },
    ],
  },
  {
    id: 'governance-os',
    title: 'Governance OS',
    description: 'Tour spec locks, change requests, releases, and audit trail.',
    estMinutes: 5,
    style: 'spotlight',
    defaultRoute: '/spec-center',
    steps: [
      {
        id: 'spec-center',
        title: 'Spec Center',
        body: 'Locked specifications carry SHA-256 hashes so every change is traceable.',
        target: 'nav-spec-center',
        route: '/spec-center',
        placement: 'right',
      },
      {
        id: 'spec-hash',
        title: 'Verify spec integrity',
        body: 'Each locked spec shows its hash. Tampering breaks verification immediately.',
        target: 'spec-center-header',
        placement: 'bottom',
      },
      {
        id: 'change-requests',
        title: 'Change Requests',
        body: 'Proposed changes flow through a governed CR workflow before release.',
        target: 'nav-change-requests',
        route: '/change-requests',
        placement: 'right',
      },
      {
        id: 'releases',
        title: 'Release Center',
        body: 'The 13-gate release pipeline tracks stop-ship conditions before shipping.',
        target: 'nav-releases',
        route: '/releases',
        placement: 'right',
      },
      {
        id: 'audit',
        title: 'Audit Log',
        body: 'Every governance event — project created, spec updated, CR approved — lands in the audit timeline.',
        target: 'nav-audit',
        route: '/audit',
        placement: 'right',
      },
    ],
  },
];

export const TUTORIAL_TRACK_MAP = Object.fromEntries(
  TUTORIAL_TRACKS.map((track) => [track.id, track]),
) as Record<string, TutorialTrack>;

export type TutorialGuideCard = {
  trackId: string;
  title: string;
  icon: LucideIcon;
  steps: readonly string[];
  editorHint: string;
};

export const TUTORIAL_GUIDE_CARDS: TutorialGuideCard[] = [
  {
    trackId: 'first-floor-plan',
    title: 'Your First Floor Plan',
    steps: ['Load sample project', 'Draw walls (W)', 'Place door and window', 'Toggle 3D view'],
    icon: PenLine,
    editorHint: 'Start with Wall (W) and sample project',
  },
  {
    trackId: 'sacred-3d',
    title: 'Sacred 3D View Walkthrough',
    steps: ['Draw enclosed room', 'Open 3D panel', 'Orbit and inspect openings', 'Adjust solar timeline'],
    icon: Box,
    editorHint: 'Press 3 or tap the 3D toggle',
  },
  {
    trackId: 'labels-export',
    title: 'Export Package',
    steps: ['Open Export dialog', 'Choose PDF or PNG', 'Download manifest JSON', 'Verify round-trip import'],
    icon: FileOutput,
    editorHint: 'Open Export from the editor menu',
  },
  {
    trackId: 'cloud-save',
    title: 'Cloud Save & Local Draft',
    steps: ['Check save badge', 'Save project', 'Reload browser', 'Recover local draft if needed'],
    icon: Cloud,
    editorHint: 'Save badge shows cloud vs local draft',
  },
  {
    trackId: 'vastu-harmony',
    title: 'Vastu Harmony Overview',
    steps: ['Switch to Draft mode', 'Select Vastu tool', 'Adjust north orientation', 'Review 8-sector overlay'],
    icon: Compass,
    editorHint: 'Switch to Draft mode and select Vastu tool',
  },
  {
    trackId: 'india-locale-nbc',
    title: 'India Locale & NBC',
    steps: ['Open locale pill (IN/AU)', 'Select India + metro', 'Review NBC compliance panel', 'Load Vastu 2BHK sample'],
    icon: Compass,
    editorHint: 'Use the globe locale control on the canvas',
  },
  {
    trackId: 'mep-routing',
    title: 'MEP & Routing Analysis',
    steps: ['Switch to MEP mode', 'Place symbols on plan', 'Review routing panel', 'Inspect fixtures in 3D'],
    icon: Route,
    editorHint: 'Switch to MEP workspace mode',
  },
];

export const FEATURES_ESSENTIALS_TRACK_ID = 'essentials';

export function getTutorialTrack(id: string): TutorialTrack | undefined {
  return TUTORIAL_TRACK_MAP[id];
}

export function getTrackStepIndex(track: TutorialTrack, stepId: string): number {
  return track.steps.findIndex((step) => step.id === stepId);
}

export function getTrackProgressPercent(track: TutorialTrack, stepIndex: number, completed: boolean): number {
  if (completed) return 100;
  if (track.steps.length === 0) return 0;
  return Math.round((stepIndex / track.steps.length) * 100);
}

/** Map legacy marketing titles to track ids for deep links. */
export const TUTORIAL_TITLE_TO_ID: Record<string, string> = {
  'Your First Floor Plan': 'first-floor-plan',
  'Sacred 3D View Walkthrough': 'sacred-3d',
  'Export Package': 'labels-export',
  'Cloud Save & Local Draft': 'cloud-save',
  'Vastu Harmony Overview': 'vastu-harmony',
  'India Locale & NBC': 'india-locale-nbc',
  'MEP & Routing Analysis': 'mep-routing',
};

export const GOVERNANCE_NAV_ICONS = {
  spec: FileText,
  cr: GitPullRequest,
  releases: Package,
  audit: History,
  projects: FolderOpen,
  optimization: Sparkles,
} as const;
