import React from 'react';
import { Background, DesignElement, ImageAdjust, Project, TextElement } from '../types';
import { Decor } from '../ui/Decor';

export function rgba(hex: string, a: number) {
  let h = (hex || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${a})`;
}

const filt = (a: ImageAdjust) =>
  `blur(${a.blur}px) brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturate}%) grayscale(${a.grayscale}%)`;

function shadowStyle(el: DesignElement): React.CSSProperties {
  if (!el.shadow.enabled) return {};
  const c = rgba(el.shadow.color, el.shadow.opacity);
  if (el.type === 'text' || el.type === 'decor') {
    return { filter: `drop-shadow(${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur / 2}px ${c})` };
  }
  return { boxShadow: `${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px 0 ${c}` };
}

/** Auto-shrink long text so a user's words never spill outside the design. */
function useFit(
  textRef: React.RefObject<HTMLDivElement | null>,
  boxRef: React.RefObject<HTMLDivElement | null>,
  requested: number,
  on: boolean,
  deps: unknown[]
) {
  const [size, setSize] = React.useState(requested);
  React.useLayoutEffect(() => {
    if (!on) { setSize(requested); return; }
    const t = textRef.current, b = boxRef.current;
    if (!t || !b) return;
    let lo = 8, hi = requested, best = 8;
    for (let i = 0; i < 12 && lo <= hi; i++) {
      const mid = (lo + hi) / 2;
      t.style.fontSize = `${mid}px`;
      if (t.scrollHeight <= b.clientHeight + 1) { best = mid; lo = mid + 0.5; } else { hi = mid - 0.5; }
    }
    t.style.fontSize = '';
    setSize(Math.floor(best));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, requested, ...deps]);
  return on ? size : requested;
}

function TextView({ el }: { el: TextElement }) {
  const tRef = React.useRef<HTMLDivElement>(null);
  const bRef = React.useRef<HTMLDivElement>(null);
  const fs = useFit(tRef, bRef, el.fontSize, el.autoFit, [
    el.text, el.width, el.height, el.fontFamily, el.fontWeight, el.lineHeight, el.letterSpacing, el.uppercase,
  ]);
  const hl = el.highlight;
  return (
    <div
      ref={bRef}
      style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: el.vAlign === 'middle' ? 'center' : el.vAlign === 'bottom' ? 'flex-end' : 'flex-start',
        justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
        ...shadowStyle(el),
      }}
    >
      <div
        ref={tRef}
        style={{
          fontFamily: `"${el.fontFamily}", sans-serif`,
          fontSize: fs,
          fontWeight: el.fontWeight,
          fontStyle: el.italic ? 'italic' : 'normal',
          textAlign: el.align,
          color: el.color,
          lineHeight: el.lineHeight,
          letterSpacing: el.letterSpacing,
          textTransform: el.uppercase ? 'uppercase' : 'none',
          width: hl ? undefined : '100%',
          maxWidth: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...(hl
            ? { background: hl.color, padding: `${hl.padY}px ${hl.padX}px`, borderRadius: hl.radius, display: 'inline-block' }
            : {}),
        }}
      >
        {el.text}
      </div>
    </div>
  );
}

function Placeholder({ kind }: { kind: string }) {
  const bg = '#D7D9DE', fg = '#A8ACB5';
  if (kind === 'avatar') {
    return (
      <svg viewBox="0 0 48 48" width="100%" height="100%" style={{ display: 'block' }}>
        <rect width="48" height="48" fill={bg} />
        <circle cx="24" cy="19" r="8" fill={fg} />
        <path d="M6 46c1.5-10 9.5-15 18-15s16.5 5 18 15z" fill={fg} />
      </svg>
    );
  }
  if (kind === 'phone') {
    return (
      <svg viewBox="0 0 60 100" preserveAspectRatio="none" width="100%" height="100%" style={{ display: 'block' }}>
        <rect x="1" y="1" width="58" height="98" rx="10" fill="#1B1B1F" />
        <rect x="4" y="4" width="52" height="92" rx="8" fill={bg} />
        <rect x="22" y="6" width="16" height="4" rx="2" fill="#1B1B1F" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" preserveAspectRatio="none" width="100%" height="100%" style={{ display: 'block' }}>
      <rect width="48" height="48" fill={bg} />
      <circle cx="16" cy="17" r="4" fill={fg} />
      <path d="M4 40l12-13 8 9 6-6 14 15z" fill={fg} />
    </svg>
  );
}

export function ElementView({ el }: { el: DesignElement }) {
  if (el.type === 'text') return <TextView el={el} />;

  if (el.type === 'image') {
    return (
      <div
        style={{
          width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
          borderRadius: el.circle ? '50%' : el.radius,
          border: el.ring.width ? `${el.ring.width}px solid ${el.ring.color}` : 'none',
          ...shadowStyle(el),
        }}
      >
        {el.src ? (
          <img
            src={el.src}
            draggable={false}
            style={{
              width: '100%', height: '100%', objectFit: el.fit,
              objectPosition: `${50 + el.offsetX}% ${50 + el.offsetY}%`,
              transform: `scale(${el.zoom})`,
              filter: filt(el.adjust),
            }}
          />
        ) : (
          <Placeholder kind={el.placeholder} />
        )}
        {el.adjust.overlayOpacity > 0 && (
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: rgba(el.adjust.overlayColor, el.adjust.overlayOpacity) }} />
        )}
      </div>
    );
  }

  if (el.type === 'shape') {
    const radius = el.shape === 'circle' ? '50%' : el.shape === 'pill' ? 9999 : el.radius;
    return (
      <div
        style={{
          width: '100%',
          height: el.shape === 'line' ? Math.max(1, el.height) : '100%',
          background: rgba(el.fill, el.fillOpacity),
          borderRadius: radius,
          border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.strokeColor}` : 'none',
          ...shadowStyle(el),
        }}
      />
    );
  }

  return <div style={{ width: '100%', height: '100%', ...shadowStyle(el) }}><Decor el={el} /></div>;
}

export function BackgroundView({ bg }: { bg: Background }) {
  if (bg.kind === 'solid') {
    return <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: bg.color }} />;
  }
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', background: bg.color }}>
      {bg.image.src && (
        <img
          src={bg.image.src}
          draggable={false}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: `${50 + bg.image.offsetX}% ${50 + bg.image.offsetY}%`,
            transform: `scale(${bg.image.zoom})`,
            filter: filt(bg.adjust),
          }}
        />
      )}
      {bg.adjust.overlayOpacity > 0 && (
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: rgba(bg.adjust.overlayColor, bg.adjust.overlayOpacity) }} />
      )}
    </div>
  );
}

/** Non-interactive full-resolution render — thumbnails and export. */
export function StaticDesign({ project, innerRef }: { project: Project; innerRef?: React.Ref<HTMLDivElement> }) {
  const els = [...project.elements].sort((a, b) => a.z - b.z);
  return (
    <div ref={innerRef} style={{ width: project.canvas.width, height: project.canvas.height, position: 'relative', overflow: 'hidden' }}>
      <BackgroundView bg={project.background} />
      {els.map((el) =>
        el.hidden ? null : (
          <div
            key={el.id}
            style={{
              position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
              transform: `rotate(${el.rotation}deg)`, opacity: el.opacity, zIndex: el.z,
            }}
          >
            <ElementView el={el} />
          </div>
        )
      )}
    </div>
  );
}
