const fs = require('fs');
let content = fs.readFileSync('src/pages/EditorPage.tsx', 'utf8');

const importsToAdd = `import DraftRecoveryDialog from '@/components/editor/DraftRecoveryDialog';
import ExportFloorPlanDialog from '@/components/editor/ExportFloorPlanDialog';
import NewProjectDialog from '@/components/editor/NewProjectDialog';
import OnboardingPanel from '@/components/editor/OnboardingPanel';
import OpenProjectDialog from '@/components/editor/OpenProjectDialog';
import ProjectProofPanel from '@/components/editor/ProjectProofPanel';
import SaveModeBadge from '@/components/editor/SaveModeBadge';
import SaveStateBadge from '@/components/editor/SaveStateBadge';
import StatusBar from '@/components/editor/StatusBar';
import Viewport3DLoading from '@/components/editor/Viewport3DLoading';
import { useCloudSaveStatus } from '@/hooks/useCloudSaveStatus';`;

content = content.replace(/import \{\n  buildDraftPayload/, importsToAdd + '\nimport {\n  buildDraftPayload');
content = content.replace(/import type \{ LightingConfig, Opening, Project, ProjectManifest, ToolType, Wall \} from '@\/types';/, "import type { LightingConfig, Opening, Project, ProjectManifest, SaveState, ToolType, Wall } from '@/types';");

const startStr = "type SaveState = 'clean' | 'unsaved' | 'local-draft' | 'cloud-saved' | 'restored-draft';";
const endStr = "export default function EditorPage() {";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync('src/pages/EditorPage.tsx', content);
  console.log('Successfully updated EditorPage.tsx');
} else {
  console.error('Could not find start or end index for definitions removal.');
}
