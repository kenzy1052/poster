import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Crop, Check } from 'lucide-react';
import { DesignElement, Project, TextElement } from '../types';
import { useStore } from '../store/useStore';
import { BackgroundView, ElementView } from '../render/Render';
import { IcCopy, IcSwap, IcTrash, IcUp } from '../ui/icons';
import { measureTextBox } from '../utils/measureText';

import { renderToJpeg } from '../utils/exporter';

const MIN_Z = 0.4;
const MAX_Z = 4;
const SNAP = 14; // canvas px tolerance for centre/edge guides

type Gesture =
  | { kind: 'none' }
  | { kind: 'move'; id: string; sx: number; sy: number; ox: number; oy: number; siblings: { id: string; ox: number; oy: number }[] }
  | { kind: 'resize'; id: string; handle: string; sx: number; sy: number; b: { x: number; y: number; w: number; h: number }; ratio: number }
  | { kind: 'rotate'; id: string; cx: number; cy: number; start: number; from: number }
  | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
  | { kind: 'pinch'; d0: number; z0: number; mx: number; my: number; ox: number; oy: number };

export interface CanvasHandle {
  zoomBy: (f: number) => void;
  fit: () => void;
  zoom: number;
  focusOn: (id: string) => void;
  startEditText: (id: string) => void;
  commitEdit: () => void;
  getThumbnail: () => Promise<string | null>;
}

interface Props {
  project: Project;
  onRequestImage: (id: string) => void;
  onCropImage?: (id: string) => void;
  onEditingChange?: (editing: boolean) => void;
  handleRef?: React.MutableRefObject<CanvasHandle | null>;
}

export function EditorCanvas({
  project,
  onRequestImage,
  onCropImage,
  onEditingChange,
  handleRef,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

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
  const [editText, setEditText] = useState('');
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

  // ---- inline text editing methods -----------------------------------------
  const startEdit = useCallback((id: string) => {
    const el = project.elements.find((x) => x.id === id);
    if (!el || el.type !== 'text') return;
    snapshot();
    setEditText((el as TextElement).text);
    setEditingId(id);
    // Re-fit the box height to the current text at the current width before
    // showing the editor, so edit mode never opens on a stale/oversized box
    // (that stale extra height is what read as a blank phantom second line).
    const t = el as TextElement;
    const fit = measureTextBox(t, { maxWidth: t.width });
    if (Math.abs(fit.height - t.height) > 1) {
      update(id, { height: fit.height } as any);
    }
  }, [project.elements, snapshot, update]);

  const commitEdit = useCallback(() => {
    if (editingId && textareaRef.current) {
      const el = project.elements.find((e) => e.id === editingId) as TextElement;
      const cleanText = editText.trim();
      if (el && cleanText) {
        const fit = measureTextBox({ ...el, text: cleanText });
        update(editingId, { text: cleanText, width: fit.width, height: fit.height, autoFit: false } as any);
      } else if (el && !cleanText) {
        // If empty, reset
        update(editingId, { text: 'Text', autoFit: false } as any);
      }
    }
    setEditingId(null);
  }, [editingId, editText, update, project]);

  useEffect(() => {
    if (editingId && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      // Place the caret at the end (Canva-style) rather than selecting
      // everything — lets you just backspace and keep typing.
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    }
  }, [editingId]);

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
        const target = Math.max(1, Math.min(3, (w.clientWidth * 0.55) / (el.width * fitScale)));
        const cx = el.x + el.width / 2 - project.canvas.width / 2;
        const cy = el.y + el.height / 2 - project.canvas.height / 2;
        setZoom(target);
        setPan(clampPan({ x: -cx * fitScale * target, y: -cy * fitScale * target }, target));
        select(id);
      },
      startEditText: (id) => startEdit(id),
      commitEdit: () => commitEdit(),
      getThumbnail: async () => {
        if (!stageRef.current) return null;
        // Temporarily clear scaling for the export
        const node = stageRef.current.firstElementChild as HTMLElement;
        if (!node) return null;
        const oldTransform = node.style.transform;
        node.style.transform = 'scale(1)';
        try {
          const url = await renderToJpeg(node, project.canvas.width, project.canvas.height);
          return url;
        } finally {
          node.style.transform = oldTransform;
        }
      },
    };
  }, [handleRef, zoom, applyZoom, project.elements, fitScale, clampPan, select, project.canvas, startEdit, commitEdit]);

  useEffect(() => { onEditingChange?.(!!editingId); }, [editingId, onEditingChange]);

  // ---- gestures ------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as Element;
    if (target.tagName && target.tagName.toLowerCase() === 'textarea') return;

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

    // Use closest() rather than reading target.dataset directly — the move
    // and rotate knobs contain an icon, so a tap that lands on the icon
    // itself (not the bare div) was missing the handle and falling through
    // to "tapped empty space", which deselected the layer.
    const handle = target.closest('[data-handle]')?.getAttribute('data-handle') || undefined;
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
      } else if (handle === 'move') {
        const siblings = selected.groupId
          ? project.elements.filter((x) => x.groupId === selected.groupId && x.id !== selected.id).map((x) => ({ id: x.id, ox: x.x, oy: x.y }))
          : [];
        gesture.current = { kind: 'move', id: selected.id, sx: e.clientX, sy: e.clientY, ox: selected.x, oy: selected.y, siblings };
      } else {
        gesture.current = {
          kind: 'resize', id: selected.id, handle,
          sx: e.clientX, sy: e.clientY,
          b: { x: selected.x, y: selected.y, w: selected.width, h: selected.height },
          ratio: selected.width / Math.max(1, selected.height),
        };
      }
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      return;
    }

    const hitId = target.closest('[data-el]')?.getAttribute('data-el') || null;
    if (hitId) {
      const el = project.elements.find((x) => x.id === hitId);
      if (editingId && editingId !== hitId) commitEdit();
      select(hitId);
      if (el && !el.locked && editingId !== hitId) {
        snapshot();
        const siblings = el.groupId
          ? project.elements.filter((x) => x.groupId === el.groupId && x.id !== el.id).map((x) => ({ id: x.id, ox: x.x, oy: x.y }))
          : [];
        gesture.current = { kind: 'move', id: hitId, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, siblings };
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
      if (!el) return;
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
      if (g.siblings.length) {
        const dx = nx - g.ox, dy = ny - g.oy;
        for (const sib of g.siblings) update(sib.id, { x: Math.round(sib.ox + dx), y: Math.round(sib.oy + dy) });
      }
      return;
    }

    if (g.kind === 'resize') {
      const dx = (e.clientX - g.sx) / scale;
      const dy = (e.clientY - g.sy) / scale;
      let { x, y, w, h } = g.b;

      if (g.handle.includes('e')) w = Math.max(16, g.b.w + dx);
      if (g.handle.includes('w')) { w = Math.max(16, g.b.w - dx); x = g.b.x + g.b.w - w; }
      if (g.handle.includes('s')) h = Math.max(16, g.b.h + dy);
      if (g.handle.includes('n')) { h = Math.max(16, g.b.h - dy); y = g.b.y + g.b.h - h; }

      const el = project.elements.find((q) => q.id === g.id);
      const isRatioLocked = el?.lockAspectRatio || (g.handle.length === 2 && (el?.type === 'image' || el?.type === 'decor'));

      if (isRatioLocked && g.ratio) {
        if (g.handle === 'e' || g.handle === 'w') {
          h = Math.max(16, Math.round(w / g.ratio));
          y = g.b.y + (g.b.h - h) / 2;
        } else if (g.handle === 'n' || g.handle === 's') {
          w = Math.max(16, Math.round(h * g.ratio));
          x = g.b.x + (g.b.w - w) / 2;
        } else {
          // Corner handles
          h = Math.max(16, Math.round(w / g.ratio));
          if (g.handle.includes('n')) y = g.b.y + g.b.h - h;
        }
      }

      if (el?.type === 'text') {
        const fit = measureTextBox({ ...(el as TextElement) }, { maxWidth: Math.round(w) });
        h = fit.height;
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

    // Single tap vs Double tap:
    // Single tap purely selects layer (moves/sizes).
    // Double tap enters edit mode for text, or crop mode for image!
    if (!moved.current && g.kind === 'move') {
      const now = Date.now();
      const isDoubleTap = false; // User requested to disable double tap completely
      lastTapRef.current = { id: g.id, time: now };

      if (isDoubleTap) {
        const el = project.elements.find((x) => x.id === g.id);
        if (el?.type === 'text') {
          startEdit(g.id);
        } else if (el?.type === 'image') {
          if (onCropImage) onCropImage(g.id);
          else onRequestImage(g.id);
        }
      }
    }

    if (pointers.current.size === 0) gesture.current = { kind: 'none' };
    setGuides({});
  };

  const editingEl = editingId ? (project.elements.find((e) => e.id === editingId) as TextElement | undefined) : null;

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
              // Thin/small elements (a divider line, a small icon) get an
              // invisible hit-slop so they're easy to grab by touch instead
              // of needing a pixel-perfect tap inside a tiny box.
              const MIN_TOUCH = 34;
              const slopX = Math.max(0, (MIN_TOUCH / scale - el.width) / 2);
              const slopY = Math.max(0, (MIN_TOUCH / scale - el.height) / 2);
              return (
                <div
                  key={el.id}
                  id={`el-${el.id}`}
                  data-el={el.id}
                  style={{
                    position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
                    transform: `rotate(${el.rotation}deg)`, opacity: el.opacity, zIndex: el.z,
                    visibility: isEditing ? 'hidden' : 'visible',
                    pointerEvents: 'auto',
                    cursor: 'move',
                  }}
                >
                  {(slopX > 0 || slopY > 0) && (
                    <div
                      data-el={el.id}
                      style={{
                        position: 'absolute',
                        top: -slopY, bottom: -slopY, left: -slopX, right: -slopX,
                        pointerEvents: 'auto',
                      }}
                    />
                  )}
                  <ElementView el={el} />
                </div>
              );
            })}

            {/* Solid, forward-typing inline textarea that eliminates the backwards text bug */}
            {editingEl && editingEl.type === 'text' && (
              <div
                style={{
                  position: 'absolute',
                  left: editingEl.x,
                  top: editingEl.y,
                  width: editingEl.width,
                  minHeight: editingEl.height,
                  height: 'auto',
                  transform: `rotate(${editingEl.rotation}deg)`,
                  zIndex: 9998,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: editingEl.vAlign === 'middle' ? 'center' : editingEl.vAlign === 'bottom' ? 'flex-end' : 'flex-start',
                  justifyContent: editingEl.align === 'center' ? 'center' : editingEl.align === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                <div className="relative w-full h-full">
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => {
                      setEditText(e.target.value);
                      const fit = measureTextBox({ ...editingEl, text: e.target.value }, { maxWidth: editingEl.width });
                      update(editingEl.id, { text: e.target.value, height: fit.height, autoFit: false } as any);
                    }}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') commitEdit();
                      // Enter inserts a new line, like Canva — the checkmark
                      // below (or tapping away) is what finishes editing.
                      e.stopPropagation();
                    }}
                    autoFocus
                    spellCheck={false}
                    style={{
                      width: '100%',
                      minHeight: editingEl.height,
                      overflow: 'hidden',
                      resize: 'none',
                      background: editingEl.highlight ? editingEl.highlight.color : 'rgba(255,255,255,0.85)',
                      border: '2px solid #F02D63',
                      borderRadius: 6,
                      fontFamily: `"${editingEl.fontFamily}", sans-serif`,
                      fontSize: `${editingEl.fontSize}px`,
                      fontWeight: editingEl.fontWeight,
                      fontStyle: editingEl.italic ? 'italic' : 'normal',
                      textAlign: editingEl.align,
                      color: editingEl.color,
                      lineHeight: editingEl.lineHeight,
                      letterSpacing: `${editingEl.letterSpacing}px`,
                      textTransform: editingEl.uppercase ? 'uppercase' : 'none',
                      textDecorationLine: editingEl.underline && editingEl.strikethrough ? 'underline line-through' : editingEl.underline ? 'underline' : editingEl.strikethrough ? 'line-through' : 'none',
                      padding: editingEl.highlight ? `${editingEl.highlight.padY}px ${editingEl.highlight.padX}px` : '0px',
                      margin: 0,
                      outline: 'none',
                      caretColor: '#F02D63',
                      boxShadow: '0 4px 20px rgba(240,45,99,0.25)',
                    }}
                  />
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

          {/* Selection chrome with 8 handles and persistent border */}
          {selected && !editingId && (
            <Selection
              el={selected}
              scale={scale}
              onStartEdit={() => startEdit(selected.id)}
              onCrop={() => onCropImage?.(selected.id)}
              onQuick={{ del, duplicate, reorder, replace: onRequestImage }}
            />
          )}
        </div>
      </div>

      {zoom !== 1 && (
        <div
          className="absolute left-3 bottom-3 rounded-full bg-ink/80 text-white text-[11px] font-semibold px-2.5 py-1 backdrop-blur-sm"
          style={{ pointerEvents: 'none' }}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}

function Selection({
  el,
  scale,
  onStartEdit,
  onCrop,
  onQuick,
}: {
  el: DesignElement;
  scale: number;
  onStartEdit: () => void;
  onCrop: () => void;
  onQuick: {
    del: (id: string) => void;
    duplicate: (id: string) => void;
    reorder: (id: string, d: 'front' | 'back' | 'up' | 'down') => void;
    replace: (id: string) => void;
  };
}) {
  const box = { left: el.x * scale, top: el.y * scale, width: el.width * scale, height: el.height * scale };
  // Full 8-handle set for rich Photoshop/Canva style resizing
  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

  return (
    <div
      data-selection-id={el.id}
      className="absolute"
      style={{ ...box, transform: `rotate(${el.rotation}deg)`, zIndex: 10000, pointerEvents: 'none' }}
    >
      {/* Selection outline border with data-el so clicking border maintains selection and allows dragging */}
      <div
        data-el={el.id}
        className="absolute inset-0 border-2 border-brand rounded-[3px]"
        style={{ pointerEvents: 'auto', cursor: 'move' }}
      />

      {/* 8 Resizing handles */}
      {handles.map((h) => {
        const isCorner = h.length === 2;
        const style: React.CSSProperties = { position: 'absolute', pointerEvents: 'auto', touchAction: 'none' };
        if (h.includes('n')) style.top = -10;
        else if (h.includes('s')) style.bottom = -10;
        else { style.top = '50%'; style.marginTop = -10; }

        if (h.includes('w')) style.left = -10;
        else if (h.includes('e')) style.right = -10;
        else { style.left = '50%'; style.marginLeft = -10; }

        const isEW = h === 'w' || h === 'e';
        const isNS = h === 'n' || h === 's';

        return (
          <div
            key={h}
            data-handle={h}
            style={{
              ...style,
              width: isCorner ? 26 : isEW ? 14 : 28,
              height: isCorner ? 26 : isEW ? 28 : 14,
              borderRadius: 999,
              background: '#fff',
              border: '2px solid #F02D63',
              boxShadow: '0 2px 5px rgba(18,19,26,.3)',
              cursor: isCorner ? `${h}-resize` : isEW ? 'ew-resize' : 'ns-resize',
            }}
          />
        );
      })}

      {/* Rotation Knob */}
      <div
        data-handle="rotate"
        style={{
          position: 'absolute', bottom: -44, left: '50%', marginLeft: -14,
          width: 28, height: 28, borderRadius: 999, background: '#fff',
          border: '2px solid #F02D63', pointerEvents: 'auto', touchAction: 'none',
          display: 'grid', placeItems: 'center', boxShadow: '0 2px 5px rgba(18,19,26,.3)',
          cursor: 'grab',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F02D63" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.2" /><path d="M4 4.4v4h4" />
        </svg>
      </div>

      {/* Move Knob (Crosshair) */}
      <div
        data-handle="move"
        style={{
          position: 'absolute', bottom: -44, left: '50%', marginLeft: 18,
          width: 28, height: 28, borderRadius: 999, background: '#fff',
          border: '2px solid #F02D63', pointerEvents: 'auto', touchAction: 'none',
          display: 'grid', placeItems: 'center', boxShadow: '0 2px 5px rgba(18,19,26,.3)',
          cursor: 'move',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F02D63" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line>
        </svg>
      </div>

      {/* Floating Quick Action Bar */}
      <div
        style={{
          position: 'absolute',
          top: -54,
          left: '50%',
          transform: `translateX(-50%) rotate(${-el.rotation}deg)`,
          pointerEvents: 'auto',
        }}
        className="flex items-center gap-1 rounded-full bg-ink text-white px-2 py-1 shadow-xl border border-white/10 backdrop-blur-md"
      >
        {el.type === 'text' && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onStartEdit}
            className="px-2.5 py-1 rounded-full bg-brand text-white text-[12px] font-bold flex items-center gap-1 active:bg-brand-dark"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
        )}

        {el.type === 'image' && (
          <>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onCrop}
              className="px-2.5 py-1 rounded-full bg-brand text-white text-[12px] font-bold flex items-center gap-1 active:bg-brand-dark"
            >
              <Crop size={13} />
              <span>Crop</span>
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onQuick.replace(el.id)}
              className="p-1.5 rounded-full active:bg-white/15 text-white/90"
              title="Replace image"
            >
              <IcSwap size={16} />
            </button>
          </>
        )}

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onQuick.duplicate(el.id)}
          className="p-1.5 rounded-full active:bg-white/15 text-white/90"
          title="Duplicate"
        >
          <IcCopy size={16} />
        </button>

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onQuick.del(el.id)}
          className="p-1.5 rounded-full active:bg-white/15 text-[#FF8E9E]"
          title="Delete"
        >
          <IcTrash size={16} />
        </button>

        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            // Trigger more menu
            const ev = new CustomEvent('open-more-menu', { detail: { id: el.id } });
            window.dispatchEvent(ev);
          }}
          className="p-1.5 rounded-full active:bg-white/15 text-white/90"
          title="More options"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
