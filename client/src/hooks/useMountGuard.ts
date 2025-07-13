import { useEffect, useState } from 'react';

export function useMountGuard(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);
  return mounted;
} 