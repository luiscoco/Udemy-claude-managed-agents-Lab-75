import { useId, useRef, useState } from 'react';
import { exportLearningBackup, maxBackupBytes, parseLearningBackup, restoreLearningBackup, type LearningBackup } from '../lib/learning-backup';
import { notifyLearningProgress } from '../lib/learning-progress';

export function LearningBackupControls({ lessonIds, storageAvailable }: { lessonIds: readonly number[]; storageAvailable: boolean }) {
  const id = useId(), sequence = useRef(0);
  const [preview, setPreview] = useState<LearningBackup | null>(null), [status, setStatus] = useState('No backup selected.');
  const [reading, setReading] = useState(false);
  function download() {
    try {
      const backup = exportLearningBackup(localStorage, lessonIds);
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'managed-agents-learning-backup.json';
      document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Backup download prepared. It contains only learning checklists, tour positions, notes, bookmarks and knowledge-check answers.');
    } catch { setStatus('Backup could not be created. Check browser storage availability.'); }
  }
  return <details id="course-learning-backup" tabIndex={-1} className="learning-backup"><summary>Back up or restore my learning</summary>
    <p>Download your browser-local learning state, including personal notes. Keep the file private. This does not export API keys, exercise results, sessions or unrelated browser settings.</p>
    <button type="button" disabled={!storageAvailable || !lessonIds.length} onClick={download}>Download learning backup</button>
    <label htmlFor={`${id}-backup`}>Choose a learning backup to preview</label>
    <input id={`${id}-backup`} type="file" accept=".json,application/json" disabled={!storageAvailable} onChange={async event => {
      const file = event.target.files?.[0], token = ++sequence.current; event.target.value = ''; setPreview(null);
      if (!file) { setStatus('No backup selected.'); setReading(false); return; }
      if (file.size > maxBackupBytes) { setStatus('Backup exceeds the 2 MB limit.'); setReading(false); return; }
      setReading(true);
      try { const parsed = parseLearningBackup(await file.text(), lessonIds);
        if (token !== sequence.current) return;
        setPreview(parsed); setStatus('Backup validated. Review the summary before restoring.');
      } catch (error) { if (token === sequence.current) setStatus(error instanceof Error ? error.message : 'Invalid learning backup.'); }
      finally { if (token === sequence.current) setReading(false); }
    }} />
    {preview && <div className="backup-preview" aria-label="Learning backup preview">
      <h3>Restore preview</h3>
      <p>Lessons: {preview.lessons.length}. Complete checklists: {preview.lessons.filter(item => item.checklist.every(Boolean)).length}. Saved notes: {preview.lessons.filter(item => item.note.trim()).length}. Bookmarks: {preview.lessons.filter(item => item.bookmarked).length}.</p>
      <p>Backup version: {preview.version}. Restore replaces the included lessons' checklists, tour positions, notes and bookmarks. Version 2 also restores knowledge-check answers; version 1 keeps current knowledge answers. Other lessons stay unchanged. Download your current backup first to keep both versions.</p>
      <button type="button" onClick={() => {
        try { const count = restoreLearningBackup(localStorage, preview, lessonIds); setPreview(null); setStatus(`Restored learning state for ${count} ${count === 1 ? 'lesson' : 'lessons'}. No exercise or narration was started.`); }
        catch (error) { setStatus(error instanceof Error ? error.message : 'Restore could not complete.'); }
        finally { notifyLearningProgress(); }
      }}>Restore this backup</button>
      <button type="button" onClick={() => { sequence.current++; setPreview(null); setStatus('Restore cancelled. No learning state changed.'); }}>Cancel restore</button>
    </div>}
    <p role="status" aria-label="Learning backup status">{reading ? 'Reading and validating the backup locally.' : status}</p>
  </details>;
}
