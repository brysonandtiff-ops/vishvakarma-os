import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveSupabaseSessionForApi } from '@/backend/supabase/supabaseAuthGateway';
import { getCastSessionManager } from '@/cast/CastSessionManager';
import type { CastChronoState, CastIntentEvent, CastLensState } from '@/cast/types';
import type { ProjectManifest } from '@/types';

export function useCastSession() {
  const manager = useMemo(() => getCastSessionManager(), []);
  const [live, setLive] = useState(manager.isLive());
  const [shareUrl, setShareUrl] = useState<string | null>(manager.getShareUrl());
  const [viewerCount, setViewerCount] = useState(manager.getViewerCount());
  const [lenses, setLenses] = useState<CastLensState>(manager.getLenses());
  const [chrono, setChrono] = useState<CastChronoState>(manager.getChrono());
  const [intents, setIntents] = useState<CastIntentEvent[]>(manager.getIntents());
  const [intentRelayEnabled, setIntentRelayEnabledState] = useState(manager.isIntentRelayEnabled());
  const [role, setRole] = useState(manager.getRole());

  useEffect(() => {
    const unsubLive = manager.subscribeBroadcastState(() => {
      setLive(manager.isLive());
      setShareUrl(manager.getShareUrl());
      setLenses(manager.getLenses());
      setChrono(manager.getChrono());
      setIntentRelayEnabledState(manager.isIntentRelayEnabled());
      setRole(manager.getRole());
    });
    const unsubViewers = manager.subscribeViewerCount(setViewerCount);
    const unsubIntents = manager.subscribeIntents(setIntents);
    return () => {
      unsubLive();
      unsubViewers();
      unsubIntents();
    };
  }, [manager]);

  const startCast = useCallback(
    async (options: {
      projectId: string;
      userId: string;
      userName: string;
      manifest: ProjectManifest;
      onManifestChange?: (manifest: ProjectManifest, isRemote: boolean) => void;
    }) => {
      const result = await manager.startPresenter({
        ...options,
        getIdToken: async () => {
          const session = await resolveSupabaseSessionForApi();
          return session.idToken;
        },
      });
      setShareUrl(result.shareUrl);
      setLive(true);
      return result;
    },
    [manager]
  );

  const stopCast = useCallback(async () => {
    await manager.stop();
    setLive(false);
    setShareUrl(null);
    setViewerCount(0);
  }, [manager]);

  return {
    manager,
    live,
    shareUrl,
    viewerCount,
    lenses,
    chrono,
    intents,
    intentRelayEnabled,
    role,
    startCast,
    stopCast,
    setLenses: manager.setLenses.bind(manager),
    setChrono: manager.setChrono.bind(manager),
    setIntentRelayEnabled: manager.setIntentRelayEnabled.bind(manager),
    updatePresenterLighting: manager.updatePresenterLighting.bind(manager),
    updatePresenterViewport: manager.updatePresenterViewport.bind(manager),
  };
}

export function useCastViewer(options: {
  token: string;
  viewerName: string;
  onManifestChange?: (manifest: ProjectManifest, isRemote: boolean) => void;
}) {
  const manager = useMemo(() => getCastSessionManager(), []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lenses, setLenses] = useState<CastLensState>(manager.getLenses());
  const [chrono, setChrono] = useState<CastChronoState>(manager.getChrono());
  const [intents, setIntents] = useState<CastIntentEvent[]>(manager.getIntents());
  const [projectName, setProjectName] = useState('Live cast');
  const [followPresenter, setFollowPresenter] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void manager
      .joinViewer({
        token: options.token,
        viewerName: options.viewerName,
        onManifestChange: options.onManifestChange,
      })
      .then((payload) => {
        if (cancelled) return;
        setProjectName(payload.projectName);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to join cast');
      });

    const unsubBroadcast = manager.subscribeBroadcastState(() => {
      setLenses(manager.getLenses());
      setChrono(manager.getChrono());
    });
    const unsubIntents = manager.subscribeIntents(setIntents);

    return () => {
      cancelled = true;
      unsubBroadcast();
      unsubIntents();
      void manager.stop();
    };
  }, [manager, options.token, options.viewerName, options.onManifestChange]);

  const toggleFollow = useCallback(
    (value: boolean) => {
      setFollowPresenter(value);
      manager.setFollowPresenter(value);
    },
    [manager]
  );

  return {
    ready,
    error,
    projectName,
    lenses,
    chrono,
    intents,
    followPresenter,
    toggleFollow,
    manager,
  };
}
