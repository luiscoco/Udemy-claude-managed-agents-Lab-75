import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Home } from './Home';
import { lessons as implementedLessons } from './lessons/registry';
import type { LessonRecord } from './lessons/registry';
import { numericOrder, readRoute, routeHref, searchLessons, topicGroups } from './lessons/navigation';

const themeKey = 'managed-agents-theme';
function initialTheme(): 'light' | 'dark' {
  try { const saved = localStorage.getItem(themeKey); if (saved === 'light' || saved === 'dark') return saved; } catch { /* Storage may be unavailable. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function App({ lessons = implementedLessons }: { lessons?: readonly LessonRecord[] } = {}) {
  const [route, setRoute] = useState(() => readRoute(window.location.search, lessons));
  const [theme, setTheme] = useState(initialTheme);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<'topic' | 'number'>('topic');
  const [openTopics, setOpenTopics] = useState<string[]>(route.lesson ? [route.lesson.topic] : []);
  const drawer = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const focusMainOnClose = useRef(false);
  const ordered = numericOrder(lessons);
  const selected = lessons.find(({ id }) => id === route.lesson?.id);
  const visible = searchLessons(ordered, search);
  const topics = [...topicGroups, ...new Set(lessons.map(({ topic }) => topic).filter((topic) => !topicGroups.some((group) => group === topic)))];
  const startLesson = lessons.find(({ id }) => id === 1);
  const position = ordered.findIndex(({ id }) => id === selected?.id);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(themeKey, theme); } catch { /* Theme still works without persistence. */ }
  }, [theme]);
  useEffect(() => {
    if (route.invalid) window.history.replaceState(null, '', routeHref());
    if (route.lesson) setOpenTopics((current) => [...new Set([...current, route.lesson!.topic])]);
    document.title = `${route.lesson?.title ?? 'Home'} · Claude Managed Agents Learning`;
  }, [route]);
  useEffect(() => {
    const onPop = () => {
      setRoute(readRoute(window.location.search, lessons));
      focusMainOnClose.current = drawer.current?.open ?? false;
      drawer.current?.close();
      main.current?.focus();
    };
    const wide = window.matchMedia('(min-width: 900px)');
    const onResize = () => { if (wide.matches) drawer.current?.close(); };
    window.addEventListener('popstate', onPop);
    wide.addEventListener('change', onResize);
    return () => { window.removeEventListener('popstate', onPop); wide.removeEventListener('change', onResize); };
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>, id?: number) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const href = routeHref(id);
    if (href !== `${location.pathname}${location.search}${location.hash}`) history.pushState(null, '', href);
    setRoute(readRoute(window.location.search, lessons));
    focusMainOnClose.current = drawer.current?.open ?? false;
    drawer.current?.close();
    requestAnimationFrame(() => { main.current?.focus(); window.scrollTo({ top: 0 }); });
  }

  function navigation(prefix: string) {
    const lessonLinks = (items: typeof visible) => items.map((lesson) => <a key={lesson.id} className="lesson-link"
      href={routeHref(lesson.id)} aria-current={selected?.id === lesson.id ? 'page' : undefined}
      onClick={(event) => navigate(event, lesson.id)}><span className="lesson-number">{String(lesson.id).padStart(2, '0')}</span><span>{lesson.title}</span></a>);
    return <nav aria-label="Course navigation">
      <a className="home-link" href={routeHref()} aria-current={!selected ? 'page' : undefined} onClick={(event) => navigate(event)}>Home <span aria-hidden="true">↗</span></a>
      <label htmlFor={`${prefix}-search`}>Find a lesson</label>
      <input id={`${prefix}-search`} type="search" value={search} aria-describedby={`${prefix}-search-help`} placeholder="Number, topic, or objective" onChange={(event) => setSearch(event.target.value)} />
      <p className="muted" id={`${prefix}-search-help`}>Search by number, topic, or objective.</p>
      <div className="order-switch" role="group" aria-label="Navigation order">
        <button aria-pressed={order === 'topic'} onClick={() => setOrder('topic')}>By topic</button>
        <button aria-pressed={order === 'number'} onClick={() => setOrder('number')}>Lesson order</button>
      </div>
      <p className="nav-count" role="status">{search.trim() ? `${visible.length} matching · ` : ''}{lessons.length} implemented {lessons.length === 1 ? 'lesson' : 'lessons'}</p>
      {visible.length === 0 && <p>{lessons.length === 0 ? 'No lessons are implemented yet.' : 'No lessons match. Try another number, topic, or objective.'}</p>}
      {order === 'number' ? lessonLinks(visible) : topics.filter((topic) => visible.some((lesson) => lesson.topic === topic)).map((topic) => <details className="topic" key={topic} open={search.trim().length > 0 || openTopics.includes(topic)}
        onToggle={(event) => { if (search.trim()) return; const open = event.currentTarget.open; setOpenTopics((current) => open ? [...new Set([...current, topic])] : current.filter((item) => item !== topic)); }}>
        <summary>{topic}</summary>{lessonLinks(visible.filter((lesson) => lesson.topic === topic))}
      </details>)}
      <p className="nav-note">Built one lab at a time.<br />New lessons appear when implemented.</p>
    </nav>;
  }

  const Component = selected?.component;
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar">
      <a className="brand" href={routeHref()} onClick={(event) => navigate(event)}><span className="brand-mark" aria-hidden="true">a/</span><span>Claude Managed Agents<span className="brand-subtitle">LEARNING LAB</span></span></a>
      <div className="header-actions"><button className="theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? '◐ Dark' : '◑ Light'}</button>
        <button className="menu-button" ref={menuButton} aria-haspopup="dialog" aria-controls="course-drawer" onClick={() => drawer.current?.showModal()}>Menu</button></div>
    </header>
    <aside className="sidebar" aria-label="Course sidebar">{navigation('desktop')}</aside>
    <dialog id="course-drawer" className="drawer" ref={drawer} aria-labelledby="drawer-heading"
      onClose={() => { (focusMainOnClose.current ? main.current : menuButton.current)?.focus(); focusMainOnClose.current = false; }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), summary')]
          .filter((element) => element.getClientRects().length > 0 && (element.tagName === 'SUMMARY' || !element.closest('details:not([open])')));
        const first = controls[0]; const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) drawer.current?.close(); }}>
      <div className="drawer-header"><h2 id="drawer-heading">Course navigation</h2><button autoFocus onClick={() => drawer.current?.close()}>Close</button></div>{navigation('mobile')}
    </dialog>
    <main id="main" ref={main} tabIndex={-1}>
      {selected && Component ? <><p className="eyebrow">{selected.topic} / LAB {String(selected.id).padStart(2, '0')}</p><h1>{selected.title}</h1><p className="lead">{selected.objective}</p>
        <Component key={selected.id} />
        <nav className="lesson-pagination" aria-label="Previous and next lessons">
          {ordered[position - 1] ? <a href={routeHref(ordered[position - 1]!.id)} onClick={(event) => navigate(event, ordered[position - 1]!.id)}>← {ordered[position - 1]!.title}</a> : <span>First implemented lesson</span>}
          {ordered[position + 1] ? <a href={routeHref(ordered[position + 1]!.id)} onClick={(event) => navigate(event, ordered[position + 1]!.id)}>{ordered[position + 1]!.title} →</a> : <span>You’re at the latest implemented lesson.</span>}
        </nav>
      </> : <Home invalid={route.invalid} lessonCount={lessons.length} startHref={startLesson ? routeHref(1) : undefined} onStart={(event) => navigate(event, 1)} />}
      <footer>Claude Managed Agents Learning · Managed Agents foundation</footer>
    </main>
  </div>;
}
