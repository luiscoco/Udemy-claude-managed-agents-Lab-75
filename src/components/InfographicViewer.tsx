import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { InfographicRegion } from '../../shared/learning-infographics';

export function InfographicViewer({ image, width, height, title, regions, selected, onSelect, follow, onFollow }: {
  image: string; width: number; height: number; title: string; regions: InfographicRegion[]; selected: number;
  onSelect: (index: number) => void; follow: boolean; onFollow: (value: boolean) => void;
}) {
  const id = useId(), viewport = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState<number | 'fit'>('fit'), [pan, setPan] = useState(true), [markers, setMarkers] = useState(true);
  const drag = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null);
  const fit = bounds.width && bounds.height ? Math.min(bounds.width / width, bounds.height / height, 1) : 1;
  const scale = zoom === 'fit' ? fit : zoom, region = regions[selected]!;
  useLayoutEffect(() => {
    const element = viewport.current!;
    const update = () => setBounds({ width: element.clientWidth, height: element.clientHeight });
    update(); const observer = new ResizeObserver(update); observer.observe(element); return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || !bounds.width || !bounds.height) return;
    if (follow) {
      const desired = Math.min((bounds.width - 30) / (width * region.box.width / 100), (bounds.height - 30) / (height * region.box.height / 100), 1.5);
      if (Math.abs(desired - scale) > 0.001) { setZoom(desired); return; }
      element.scrollTo({ left: width * scale * (region.box.x + region.box.width / 2) / 100 - bounds.width / 2,
        top: height * scale * (region.box.y + region.box.height / 2) / 100 - bounds.height / 2, behavior: 'instant' });
    } else if (zoom === 'fit') element.scrollTo(0, 0);
  }, [selected, follow, bounds, scale, width, height, region, zoom]);
  function change(value: number | 'fit') { onFollow(false); setZoom(value === 'fit' ? value : Math.max(0.1, Math.min(3, value))); }
  function stopPan() {
    const current = drag.current; drag.current = null;
    if (current && viewport.current?.hasPointerCapture(current.pointer)) viewport.current.releasePointerCapture(current.pointer);
  }
  return <div className="infographic-viewer">
    <div className="infographic-toolbar" role="group" aria-label="Infographic zoom controls">
      <button type="button" aria-label="Zoom out" onClick={() => change(scale - 0.1)} disabled={scale <= 0.1}>−</button>
      <label htmlFor={id}>Zoom</label><input id={id} type="range" min="10" max="300" value={Math.round(scale * 100)} onChange={event => change(Number(event.target.value) / 100)} aria-valuetext={`${Math.round(scale * 100)} percent`} />
      <output htmlFor={id}>{Math.round(scale * 100)}%</output>
      <button type="button" aria-label="Zoom in" onClick={() => change(scale + 0.1)} disabled={scale >= 3}>+</button>
      <button type="button" onClick={() => change('fit')}>Fit image</button><button type="button" onClick={() => change(1)}>100%</button>
      <button type="button" aria-pressed={pan} onClick={() => { stopPan(); setPan(value => !value); }}>Pan with mouse</button>
      <button type="button" aria-pressed={markers} onClick={() => setMarkers(value => !value)}>Numbered study links</button>
    </div>
    <p className="muted infographic-help" id={`${id}-help`}>Drag to pan, or use the scrollbars. On touch screens, swipe. Focus the image area and use + / − to zoom or 0 to fit. Select a numbered link to study that region.</p>
    <div ref={viewport} className={`infographic-viewport${pan ? ' pan-enabled' : ''}`} role="region" aria-label={`${title} image viewer`} aria-describedby={`${id}-help`} tabIndex={0}
      onPointerDown={event => {
        if (!pan || event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary || (event.target as Element).closest('button')) return;
        const element = event.currentTarget, rect = element.getBoundingClientRect();
        if (event.clientX - rect.left >= element.clientWidth || event.clientY - rect.top >= element.clientHeight) return;
        event.preventDefault(); onFollow(false); element.focus({ preventScroll: true });
        drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop };
        element.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => { const current = drag.current; if (!current || current.pointer !== event.pointerId) return;
        event.currentTarget.scrollLeft = current.left - (event.clientX - current.x); event.currentTarget.scrollTop = current.top - (event.clientY - current.y); }}
      onPointerUp={stopPan} onPointerCancel={stopPan} onLostPointerCapture={stopPan}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === '+' || event.key === '=') { event.preventDefault(); change(scale + 0.1); }
        else if (event.key === '-') { event.preventDefault(); change(scale - 0.1); }
        else if (event.key === '0') { event.preventDefault(); change('fit'); }
      }}>
      <div className="infographic-canvas" style={{ width: Math.round(width * scale), height: Math.round(height * scale) }}>
        <img src={image} width={width} height={height} alt={`${title}. Six numbered teaching regions; a complete text version follows the viewer.`} draggable={false} />
        <div className="infographic-region-highlight" data-visual-region={region.id} aria-hidden="true" style={{ left: `${region.box.x}%`, top: `${region.box.y}%`, width: `${region.box.width}%`, height: `${region.box.height}%` }} />
        {markers && regions.map((item, index) => <button type="button" key={item.id} className="infographic-marker" aria-label={`Study region ${index + 1}: ${item.title}`} aria-pressed={selected === index}
          style={{ left: `${item.box.x + 0.7}%`, top: `${item.box.y + 0.7}%` }} onClick={() => onSelect(index)}>{index + 1}</button>)}
      </div>
    </div>
  </div>;
}
