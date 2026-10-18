import { useEffect, useState } from 'react';
import { findLearningPath, learningPathKey } from '../lessons/learning-paths';
import { notifyLearningProgress, progressEvent } from './learning-progress';

export function useLearningPath() {
  const read = () => { try { return findLearningPath(localStorage.getItem(learningPathKey))?.id ?? null; } catch { return null; } };
  const [pathId, setPathId] = useState<string | null>(read), [status, setStatus] = useState('');
  useEffect(() => {
    const refresh = () => { try { setPathId(findLearningPath(localStorage.getItem(learningPathKey))?.id ?? null); } catch { /* Keep the in-memory selection when storage is unavailable. */ } };
    window.addEventListener('storage', refresh); window.addEventListener(progressEvent, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(progressEvent, refresh); };
  }, []);
  function select(id: string | null) {
    const selected = findLearningPath(id)?.id ?? null;
    setPathId(selected);
    try { if (selected) localStorage.setItem(learningPathKey, selected); else localStorage.removeItem(learningPathKey);
      setStatus(selected ? 'Learning path saved in this browser.' : 'Learning path cleared. Explore the full course freely.'); notifyLearningProgress();
    } catch { setStatus('Path selected for this page, but browser storage could not save it.'); }
  }
  return { pathId, select, status };
}
