import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface EditorSidebarConfig {
  onNewProject: () => void;
  onOpenProject: () => void;
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  onLoadSample: () => void;
  onAIDesigner: () => void;
  onToggle3D: () => void;
  onToggleGrid: () => void;
  show3DView: boolean;
  gridVisible: boolean;
  savingProject?: boolean;
}

interface EditorSidebarContextValue {
  config: EditorSidebarConfig | null;
  setConfig: (config: EditorSidebarConfig | null) => void;
}

const EditorSidebarContext = createContext<EditorSidebarContextValue>({
  config: null,
  setConfig: () => {},
});

export function EditorSidebarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<EditorSidebarConfig | null>(null);
  const value = useMemo(() => ({ config, setConfig }), [config]);

  return (
    <EditorSidebarContext.Provider value={value}>
      {children}
    </EditorSidebarContext.Provider>
  );
}

export function useEditorSidebarConfig() {
  return useContext(EditorSidebarContext).config;
}

export function useRegisterEditorSidebar(config: EditorSidebarConfig | null) {
  const { setConfig } = useContext(EditorSidebarContext);

  useEffect(() => {
    setConfig(config);
    return () => setConfig(null);
  }, [config, setConfig]);
}
