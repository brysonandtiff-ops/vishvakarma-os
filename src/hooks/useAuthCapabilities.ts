import { useEffect, useState } from 'react';
import defaultManifest from '../../public/auth-capabilities.json';
import {
  fetchAuthCapabilitiesManifest,
  getBuildTimeAuthWinner,
  resolveAuthWinner,
  type AuthCapabilitiesManifest,
} from '@/backend/authCapabilities';

export function useAuthCapabilities() {
  const [manifest, setManifest] = useState<AuthCapabilitiesManifest | null>(
    defaultManifest as AuthCapabilitiesManifest
  );
  const [loading, setLoading] = useState(true);
  const buildTimeWinner = getBuildTimeAuthWinner();
  const winner = resolveAuthWinner(manifest, buildTimeWinner);

  useEffect(() => {
    let mounted = true;

    void fetchAuthCapabilitiesManifest()
      .then((nextManifest) => {
        if (mounted && nextManifest) {
          setManifest(nextManifest);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    loading,
    manifest,
    winner,
  };
}
