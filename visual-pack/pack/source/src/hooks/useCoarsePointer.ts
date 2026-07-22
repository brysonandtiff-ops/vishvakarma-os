import { useEffect, useState } from 'react';

const COARSE_POINTER_QUERY = '(pointer: coarse)';

export function useCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(COARSE_POINTER_QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(COARSE_POINTER_QUERY);
    const onChange = () => setIsCoarse(mql.matches);
    mql.addEventListener('change', onChange);
    setIsCoarse(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isCoarse;
}
