import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DesignElement, Project } from '../types';
import { useStore } from '../store/useStore';
import { BackgroundView, ElementView } from '../render/Render';
import { IcCopy, IcSwap, IcTrash, IcUp } from '../ui/icons';

const MIN_Z = 0.4;
const MAX_Z = 4;
const SNAP = 14; // canvas px tolerance for centre/edge guides

type Gesture =
  | { kind: 'none' }
  | { kind: 'move'; id: string; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'resize'; id: string; handle: string; sx: number; sy: number; b: { x: number; y: number; w: number; h: number }; ratio: number }
  | { kind: 'rotate'; id: string; cx: number; cy: number; start: number; from: number }
  | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'pinch'; d0: number; z0: number; mx: number; my: number; ox: number; oy: number };

export interface CanvasHandle {
  zoomBy: (f: number) => void;
  fit: () => void;
  zoom: number;
  focusOn: (id: string) => void;
}

interface Props {
  project: Project;
  onRequestImage: (id: string) => void;
  onEditingChange?: (editing: boolean) => void;
  handleRef?: React.MutableRefObject<CanvasHandle | null>;
}

export function EditorCanvas({ project, onRequestImage, onEditingChange, handleRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const update = useStore((s) => s.update);
  const snapshot = useStore((s) => s.snapshot);
  const del = useStore((s) => s.del);
  const duplicate = useStore((s) => s.duplicate);
  const reorder = useStore((s) => s.reorder);

  const [fitScale, setFitScale] = useState(0.3);
  const [zoom, setZoom] = useState(1); // multiplier on top of fitScale
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});

  const gesture = useRef<Gesture>({ kind: 'none' });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const moved = useRef(false);

  const scale = fitScale * zoom;
  const els = useMemo(() => [...project.elements].sort((a, b) => a.z - b.z), [project.elements]);
  const selected = project.elements.find((e) => e.id === selectedId) || null;

  // ---- fit to screen -------------------------------------------------------
  const computeFit = useCallback(() => {
    const w = wrapRef.current;
    if (!w) return;
    const pad = 28;
    const s = Math.min((w.clientWidth - pad) / project.canvas.width, (w.clientHeight - pad) / project.canvas.height);
    setFitScale(s);
  }, [project.canvas]);

  useEffect(() => {
    computeFit();
    const ro = new ResizeObserver(computeFit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [computeFit]);

  const clampPan = useCallback((p: { x: number; y: number }, z: number) => {
    const w = wrapRef.current;
    if (!w) return p;
    const dispW = project.canvas.width * fitScale * z;
    const dispH = project.canvas.height * fitScale * z;
    const maxX = Math.max(0, (dispW - w.clientWidth) / 2 + 40);
    const maxY = Math.max(0, (dispH - w.clientHeight) / 2 + 40);
    return { x: Math.max(-maxX, Math.min(maxX, p.x)), y: Math.max(-maxY, Math.min(maxY, p.y)) };
  }, [project.canvas, fitScale]);

  const applyZoom = useCallback((next: number, p = pan) => {
    const z = Math.max(MIN_Z, Math.min(MAX_Z, next));
    setZoom(z);
    setPan(clampPan(p, z));
  }, [clampPan, pan]);

  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      zoom,
      zoomBy: (f) => applyZoom(zoom * f),
      fit: () => { setZoom(1); setPan({ x: 0, y: 0 }); },
      focusOn: (id) => {
        const el = project.elements.find((e) => e.id === id);
        const w = wrapRef.current;
        if (!el || !w) return;
        // Zoom so the element fills a comfortable share of the viewport, then centre it.
        const target = Math.max(1, Math.min(3, (w.clientWidth * 0.55) / (el.width * fitScale)));
        const cx = el.x + el.width / 2 - project.canvas.width / 2;
        const cy = el.y + el.height / 2 - project.canvas.height / 2;
        setZoom(target);
        setPan(clampPan({ x: -cx * fitScale * target, y: -cy * fitScale * target }, target));
        select(id);
      },
    };
  }, [handleRef, zoom, applyZoom, project.elements, fitScale, clampPan, select, project.canvas]);

  useEffect(() => { onEditingChange?.(!!editingId); }, [editingId, onEditingChange]);

  // ---- coordinate helpers --------------------------------------------------
  const toCanvas = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
  };

  // ---- gestures ------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        kind: 'pinch',
        d0: Math.hypot(a.x - b.x, a.y - b.y),
        z0: zoom,
        mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
        ox: pan.x, oy: pan.y,
      };
      return;
    }

    const target = e.target as HTMLElement;
    const handle = target.dataset.handle;
    if (handle && selected) {
      e.stopPropagation();
      snapshot();
      if (handle === 'rotate') {
        const r = (document.getElementById(`el-${selected.id}`) as HTMLElement).getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        gesture.current = {
          kind: 'rotate', id: selected.id, cx, cy,
          start: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
          from: selected.rotation,
        };
      } else {
        gesture.current = {
          kind: 'resize', id: selected.id, handle,
          sx: e.clientX, sy: e.clientY,
          b: { x: selected.x, y: selected.y, w: selected.width, h: selected.height },
          ratio: selected.width / selected.height,
        };
      }
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      return;
    }

    const hitId = target.closest('[data-el]')?.getAttribute('data-el') || null;
    if (hitId) {
      const el = project.elements.find((x) => x.id === hitId)!;
      if (editingId && editingId !== hitId) commitEdit();
      select(hitId);
      if (!el.locked && editingId !== hitId) {
        snapshot();
        gesture.current = { kind: 'move', id: hitId, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y };
      }
    } else {
      if (editingId) commitEdit();
      select(null);
      gesture.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
    }
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (g.kind === 'none') return;
    moved.current = true;

    if (g.kind === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom(g.z0 * (d / g.d0), { x: g.ox, y: g.oy });
      return;
    }

    if (g.kind === 'pan') {
      setPan(clampPan({ x: g.ox + (e.clientX - g.sx), y: g.oy + (e.clientY - g.sy) }, zoom));
      return;
    }

    if (g.kind === 'move') {
      const el = project.elements.find((x) => x.id === g.id)!;
      let nx = g.ox + (e.clientX - g.sx) / scale;
      let ny = g.oy + (e.clientY - g.sy) / scale;
      const next: { x?: number; y?: number } = {};
      const cw = project.canvas.width, ch = project.canvas.height;

      // Snap to canvas centre and to the standard margin.
      const cx = nx + el.width / 2, cy = ny + el.height / 2;
      if (Math.abs(cx - cw / 2) < SNAP) { nx = cw / 2 - el.width / 2; next.x = cw / 2; }
      if (Math.abs(cy - ch / 2) < SNAP) { ny = ch / 2 - el.height / 2; next.y = ch / 2; }
      const margin = Math.round(cw * 0.06);
      if (Math.abs(nx - margin) < SNAP) { nx = margin; next.x = margin; }
      if (Math.abs(nx + el.width - (cw - margin)) < SNAP) { nx = cw - margin - el.width; next.x = cw - margin; }

      setGuides(next);
      update(g.id, { x: Math.round(nx), y: Math.round(ny) });
      return;
    }

    if (g.kind === 'resize') {
      const dx = (e.clientX - g.sx) / scale;
      const dy = (e.clientY - g.sy) / scale;
      let { x, y, w, h } = g.b;
      if (g.handle.includes('e')) w = Math.max(28, g.b.w + dx);
      if (g.handle.includes('w')) { w = Math.max(28, g.b.w - dx); x = g.b.x + g.b.w - w; }
      if (g.handle.includes('s')) h = Math.max(28, g.b.h + dy);
      if (g.handle.includes('n')) { h = Math.max(28, g.b.h - dy); y = g.b.y + g.b.h - h; }
      // Corner handles keep the aspect ratio, which is what people expect
      // when scaling a photo or a logo.
      if (g.handle.length === 2) {
        const el = project.elements.find((q) => q.id === g.id)!;
        if (el.type === 'image' || el.type === 'decor') {
          h = w / g.ratio;
          if (g.handle.includes('n')) y = g.b.y + g.b.h - h;
        }
      }
      update(g.id, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) });
      return;
    }

    if (g.kind === 'rotate') {
      const now = (Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180) / Math.PI;
      let deg = Math.round(g.from + (now - g.start));
      if (Math.abs(deg % 45) < 4) deg = Math.round(deg / 45) * 45; // snap to 45°
      update(g.id, { rotation: deg });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;

    // A tap (no drag) on an already-selected text element starts editing —
    // the same "tap it and type" behaviour people expect from Canva.
    if (!moved.current && g.kind === 'move') {
      const el = project.elements.find((x) => x.id === g.id);
      if (el?.type === 'text' && selectedId === g.id) startEdit(g.id);
      if (el?.type === 'image' && selectedId === g.id) onRequestImage(g.id);
    }

    if (pointers.current.size === 0) gesture.current = { kind: 'none' };
    setGuides({});
  };

  // ---- inline text editing -------------------------------------------------
  const startEdit = (id: string) => {
    snapshot();
    setEditingId(id);
    requestAnimationFrame(() => {
      const node = editorRef.current;
      if (!node) return;
      node.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  const commitEdit = () => {
    const node = editorRef.current;
    if (node && editingId) update(editingId, { text: node.innerText.replace(/\n$/, '') } as any);
    setEditingId(null);
  };

  const editingEl = editingId ? project.elements.find((e) => e.id === editingId) : null;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden touch-none select-none bg-canvasbg"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(-50%,-50%) translate(${pan.x}px, ${pan.y}px)` }}
      >
        <div
          ref={stageRef}
          className="relative bg-white"
          style={{
            width: project.canvas.width * scale,
            height: project.canvas.height * scale,
            boxShadow: '0 8px 40px rgba(18,19,26,.14)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              width: project.canvas.width,
              height: project.canvas.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              overflow: 'hidden',
            }}
          >
            <BackgroundView bg={project.background} />

            {els.map((el) => {
              if (el.hidden) return null;
              const isEditing = editingId === el.id;
              return (
                <div
                  key={el.id}
                  id={`el-${el.id}`}
                  data-el={el.id}
                  style={{
                    position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
                    transform: `rotate(${el.rotation}deg)`, opacity: el.opacity, zIndex: el.z,
                    visibility: isEditing ? 'hidden' : 'visible',
                  }}
                >
                  <ElementView el={el} />
                </div>
              );
            })}

            {/* Live inline editor — sits exactly where the text lives, so the
                design updates under the user's finger as they type. */}
            {editingEl && editingEl.type === 'text' && (
              <div
                style={{
                  position: 'absolute', left: editingEl.x, top: editingEl.y,
                  width: editingEl.width, height: editingEl.height,
                  transform: `rotate(${editingEl.rotation}deg)`, zIndex: 9998,
                  display: 'flex',
                  alignItems: editingEl.vAlign === 'middle' ? 'center' : editingEl.vAlign === 'bottom' ? 'flex-end' : 'flex-start',
                  justifyContent: editingEl.align === 'center' ? 'center' : editingEl.align === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => update(editingEl.id, { text: (e.currentTarget as HTMLElement).innerText } as any)}
                  onBlur={commitEdit}
                  style={{
                    fontFamily: `"${editingEl.fontFamily}", sans-serif`,
                    fontSize: editingEl.fontSize,
                    fontWeight: editingEl.fontWeight,
                    fontStyle: editingEl.italic ? 'italic' : 'normal',
                    textAlign: editingEl.align,
                    color: editingEl.color,
                    lineHeight: editingEl.lineHeight,
                    letterSpacing: editingEl.letterSpacing,
                    textTransform: editingEl.uppercase ? 'uppercase' : 'none',
                    width: editingEl.highlight ? undefined : '100%',
                    maxWidth: '100%',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    outline: 'none',
                    caretColor: '#F02D63',
                    ...(editingEl.highlight
                      ? {
                          background: editingEl.highlight.color,
                          padding: `${editingEl.highlight.padY}px ${editingEl.highlight.padX}px`,
                          borderRadius: editingEl.highlight.radius,
                          display: 'inline-block',
                        }
                      : {}),
                  }}
                >
                  {editingEl.text}
                </div>
              </div>
            )}

            {guides.x !== undefined && (
              <div style={{ position: 'absolute', left: guides.x, top: 0, bottom: 0, width: 2 / scale, background: '#F02D63', zIndex: 9999 }} />
            )}
            {guides.y !== undefined && (
              <div style={{ position: 'absolute', top: guides.y, left: 0, right: 0, height: 2 / scale, background: '#F02D63', zIndex: 9999 }} />
            )}
          </div>

          {/* Selection chrome, drawn in screen space so handles stay finger-sized
              no matter how far the user has zoomed in. */}
          {selected && !editingId && (
            <Selection el={selected} scale={scale} onQuick={{ del, duplicate, reorder, replace: onRequestImage }} />
          )}
        </div>
      </div>

      {zoom !== 1 && (
        <div className="absolute left-3 bottom-3 rounded-full bg-ink/80 text-white text-[11px] font-semibold px-2.5 py-1">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}

function Selection({
  el, scale, onQuick,
}: {
  el: DesignElement; scale: number;
  onQuick: { del: (id: string) => void; duplicate: (id: string) => void; reorder: (id: string, d: 'front' | 'back' | 'up' | 'down') => void; replace: (id: string) => void };
}) {
  const box = { left: el.x * scale, top: el.y * scale, width: el.width * scale, height: el.height * scale };
  const handles = el.type === 'text' ? (['w', 'e', 'nw', 'ne', 'sw', 'se'] as const) : (['nw', 'ne', 'sw', 'se'] as const);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ ...box, transform: `rotate(${el.rotation}deg)`, zIndex: 10000 }}
    >
      <div className="absolute inset-0 border-2 border-brand rounded-[3px]" />

      {handles.map((h) => {
        const style: React.CSSProperties = { position: 'absolute', pointerEvents: 'auto', touchAction: 'none' };
        if (h.includes('n')) style.top = -9; else if (h.includes('s')) style.bottom = -9; else { style.top = '50%'; style.marginTop = -9; }
        if (h.includes('w')) style.left = -9; else if (h.includes('e')) style.right = -9; else { style.left = '50%'; style.marginLeft = -9; }
        const bar = h === 'w' || h === 'e';
        return (
          <div
            key={h}
            data-handle={h}
            style={{
              ...style,
              width: bar ? 10 : 18, height: bar ? 26 : 18,
              borderRadius: 999, background: '#fff',
              border: '2px solid #F02D63',
              boxShadow: '0 1px 4px rgba(18,19,26,.25)',
            }}
          />
        );
      })}

      <div
        data-handle="rotate"
        style={{
          position: 'absolute', bottom: -44, left: '50%', marginLeft: -14,
          width: 28, height: 28, borderRadius: 999, background: '#fff',
          border: '2px solid #F02D63', pointerEvents: 'auto', touchAction: 'none',
          display: 'grid', placeItems: 'center', boxShadow: '0 1px 4px rgba(18,19,26,.25)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F02D63" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.2" /><path d="M4 4.4v4h4" />
        </svg>
      </div>

      {/* Floating quick actions, always above the selection and never rotated
          with it so the buttons stay readable. */}
      <div
        style={{ position: 'absolute', top: -52, left: '50%', transform: `translateX(-50%) rotate(${-el.rotation}deg)`, pointerEvents: 'auto' }}
        className="flex items-center gap-1 rounded-full bg-ink text-white px-1.5 py-1 shadow-lg"
      >
        {el.type === 'image' && (
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onQuick.replace(el.id)} className="p-2 rounded-full active:bg-white/15"><IcSwap size={17} /></button>
        )}
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onQuick.duplicate(el.id)} className="p-2 rounded-full active:bg-white/15"><IcCopy size={17} /></button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onQuick.reorder(el.id, 'front')} className="p-2 rounded-full active:bg-white/15"><IcUp size={17} /></button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onQuick.del(el.id)} className="p-2 rounded-full active:bg-white/15 text-[#FF8E9E]"><IcTrash size={17} /></button>
      </div>
    </div>
  );
}
