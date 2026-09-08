import { useEffect } from 'react';

let lockCount = 0;

export function useBodyScrollLock(lock = true) {
  useEffect(() => {
    if (!lock) return;

    if (lockCount === 0) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, [lock]);
}

export default useBodyScrollLock;
