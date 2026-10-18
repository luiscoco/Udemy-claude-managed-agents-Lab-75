import { useEffect, useState } from 'react';
import { progressEvent, readLearningProgress } from './learning-progress';

export function useLearningProgress(ids: readonly number[]) {
  const read = () => readLearningProgress({ getItem: key => localStorage.getItem(key) }, ids);
  const [progress, setProgress] = useState(read);
  useEffect(() => {
    const refresh = () => setProgress(read());
    refresh(); window.addEventListener(progressEvent, refresh); window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(progressEvent, refresh); window.removeEventListener('storage', refresh); };
  }, [ids.join(',')]);
  return progress;
}
