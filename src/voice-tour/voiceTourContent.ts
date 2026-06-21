export type VoiceTourChapter = {
  id: string;
  title: string;
  route: string;
  summary: string;
  narration: string;
  mp3Src: string;
  tutorialTrackId?: string;
};

export const VOICE_TOUR_CHAPTERS: VoiceTourChapter[] = [
  {
    id: 'welcome',
    title: 'Welcome to Vishvakarma.OS',
    route: '/',
    summary: 'Big picture: what the software is and where to begin.',
    narration:
      'Welcome to Vishvakarma.OS. This is your browser-native architecture workstation. You can start from the home screen, open projects, design in the editor, inspect in 3D, run optimization, and keep governance evidence for every serious decision.',
    mp3Src: '/audio/tours/whole-software/01-welcome.mp3',
    tutorialTrackId: 'whole-software-tour',
  },
  {
    id: 'auth',
    title: 'Secure sign-in',
    route: '/auth',
    summary: 'How users enter the workspace safely.',
    narration:
      'The sign-in screen is the secure gate into the workspace. Use email access, magic link, or Google SSO when configured. The official swan mark and auth copy stay protected so testing and sign-in contracts remain stable.',
    mp3Src: '/audio/tours/whole-software/02-auth.mp3',
  },
  {
    id: 'projects',
    title: 'Projects library',
    route: '/projects',
    summary: 'Where saved blueprints and drafts are managed.',
    narration:
      'The projects library is where saved blueprints live. Use it to reopen work, manage drafts, and keep designs organized before moving back into the editor for detailed drafting.',
    mp3Src: '/audio/tours/whole-software/03-projects.mp3',
  },
  {
    id: 'editor',
    title: 'Blueprint editor',
    route: '/editor',
    summary: 'The main design surface: tools, grid, demo, canvas, and 3D.',
    narration:
      'The editor is the main workstation. The Demo button loads a sample blueprint. The Grid button shows whether the drafting grid is on or off. The tool rail gives you walls, doors, windows, dimensions, rooms, furniture, MEP, landscape, and power tools.',
    mp3Src: '/audio/tours/whole-software/04-editor.mp3',
    tutorialTrackId: 'essentials',
  },
  {
    id: 'three-d',
    title: 'Live 3D and 3D Room',
    route: '/3d-room',
    summary: 'How designs become visual spatial previews.',
    narration:
      'The 3D tools turn plans into spatial understanding. In the editor, the 3D pane syncs live with the blueprint. The dedicated 3D Room page gives a focused preview space for staging, samples, and presentation checks.',
    mp3Src: '/audio/tours/whole-software/05-3d-room.mp3',
    tutorialTrackId: 'sacred-3d',
  },
  {
    id: 'optimization',
    title: 'Design optimization',
    route: '/optimization',
    summary: 'Run options, compare candidates, and promote winners.',
    narration:
      'Design Optimization helps compare design candidates against goals, budget, and constraints. It is decision support, not permit approval. Use it to compare directions before promoting a winning plan back into the editor.',
    mp3Src: '/audio/tours/whole-software/06-optimization.mp3',
    tutorialTrackId: 'design-optimization',
  },
  {
    id: 'governance',
    title: 'Governance OS',
    route: '/spec-center',
    summary: 'Specs, change control, releases, and audit trail.',
    narration:
      'Governance OS keeps the serious work traceable. Spec Center locks requirements. Change Requests control modifications. Releases track readiness. Audit Log records evidence so decisions are not lost.',
    mp3Src: '/audio/tours/whole-software/07-governance.mp3',
    tutorialTrackId: 'governance-os',
  },
  {
    id: 'profile',
    title: 'Profile and account',
    route: '/profile',
    summary: 'Account, plan, and workspace settings.',
    narration:
      'Profile holds account and workspace settings, including subscription and portal links when configured. Use it when a user needs to understand their access, account state, or billing path.',
    mp3Src: '/audio/tours/whole-software/08-profile.mp3',
  },
];

export const WHOLE_SOFTWARE_TOUR_ID = 'whole-software-tour';
export const OPEN_VOICE_TOUR_EVENT = 'vish:open-voice-tour';
