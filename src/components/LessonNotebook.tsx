import { useId, useState } from 'react';
import { bookmarkKey, noteKey, notifyLearningProgress } from '../lib/learning-progress';

export function LessonNotebook({ lessonId }: { lessonId: number }) {
  const id = useId();
  const [note, setNote] = useState(() => { try { return (localStorage.getItem(noteKey(lessonId)) ?? '').slice(0, 4000); } catch { return ''; } });
  const [bookmarked, setBookmarked] = useState(() => { try { return localStorage.getItem(bookmarkKey(lessonId)) === '1'; } catch { return false; } });
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('Notes stay in this browser. Use Home to download a backup.');
  function save() {
    try { if (note) localStorage.setItem(noteKey(lessonId), note); else localStorage.removeItem(noteKey(lessonId));
      setDirty(false); setStatus('Note saved in this browser.'); notifyLearningProgress();
    } catch { setStatus('Browser storage could not save this note. Copy your text before leaving.'); }
  }
  return <details id={`lesson-notebook-${lessonId}`} tabIndex={-1} className="lesson-notebook"><summary>My lesson notebook{bookmarked ? ' / bookmarked' : ''}</summary>
    <p>Write what you observed, a question to revisit or your next experiment. Notes are plain text and never sent to a provider. Avoid storing passwords or API keys.</p>
    <label htmlFor={`${id}-note`}>Notes for Lab {String(lessonId).padStart(2, '0')}</label>
    <textarea id={`${id}-note`} rows={6} maxLength={4000} value={note} onChange={event => { setNote(event.target.value); setDirty(true); setStatus('Unsaved changes. Choose Save note before leaving.'); }} />
    <p>{note.length} / 4000 characters. {dirty ? 'Unsaved note changes.' : 'Saved notes are included in learning backups.'}</p><button type="button" onClick={save}>Save note</button>
    <label className="guide-checkpoint"><input type="checkbox" checked={bookmarked} onChange={event => {
      const next = event.target.checked;
      try { if (next) localStorage.setItem(bookmarkKey(lessonId), '1'); else localStorage.removeItem(bookmarkKey(lessonId));
        setBookmarked(next); setStatus(next ? 'Lesson bookmarked for review.' : 'Bookmark removed.'); notifyLearningProgress();
      } catch { setStatus('Browser storage could not update the bookmark.'); }
    }} />Bookmark this lesson for review</label>
    <p role="status" aria-label="Notebook status">{status}</p>
  </details>;
}
