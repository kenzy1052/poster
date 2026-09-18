import React from 'react';
import { Background, DesignElement, ImageAdjust, Project, ShapeElement, TextElement } from '../types';
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
  const style: React.CSSProperties = {};
  if (el.shadow.enabled) {
    const c = rgba(el.shadow.color, el.shadow.opacity);
    if (el.type === 'text' || el.type === 'decor') {
      style.filter = `drop-shadow(${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur / 2}px ${c})`;
    } else {
      style.boxShadow = `${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px 0 ${c}`;
    }
  }
  // Whole-layer blur — available on any element type (text/shape included,
  // not just photos, which already had their own Adjust-panel blur).
  const blurPx = (el as { blur?: number }).blur || 0;
  if (blurPx > 0) {
    style.filter = style.filter ? `${style.filter} blur(${blurPx}px)` : `blur(${blurPx}px)`;
  }
  return style;
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
  const scriptPos = el.scriptPosition || 'normal';
  const effect = el.textEffect;

  const textStyle: React.CSSProperties = {
    fontFamily: `"${el.fontFamily}", sans-serif`,
    fontSize: scriptPos === 'normal' ? fs : fs * 0.68,
    fontWeight: el.fontWeight,
    fontStyle: el.italic ? 'italic' : 'normal',
    textAlign: el.align,
    color: el.color,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    textTransform: el.uppercase ? 'uppercase' : 'none',
    fontKerning: el.kerning === false ? 'none' : 'normal',
    textDecorationLine: el.underline && el.strikethrough ? 'underline line-through' : el.underline ? 'underline' : el.strikethrough ? 'line-through' : 'none',
    verticalAlign: scriptPos === 'super' ? 'super' : scriptPos === 'sub' ? 'sub' : 'baseline',
    width: hl ? undefined : '100%',
    maxWidth: '100%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    position: 'relative',
    WebkitTextStrokeWidth: effect?.kind === 'outline' ? `${effect.thickness}px` : undefined,
    WebkitTextStrokeColor: effect?.kind === 'outline' ? effect.color : undefined,
    paintOrder: effect?.kind === 'outline' ? 'stroke fill' : undefined,
    textShadow: effect?.kind === 'neon'
      ? `0 0 ${effect.thickness}px ${effect.color}, 0 0 ${effect.thickness * 2}px ${effect.color}, 0 0 ${effect.thickness * 4}px ${effect.color}`
      : undefined,
    ...(hl
      ? { background: hl.color, padding: `${hl.padY}px ${hl.padX}px`, borderRadius: hl.radius, display: 'inline-block' }
      : {}),
  };

  const lines = el.text.split('\n');
  const content =
    el.list && el.list !== 'none' ? (
      el.list === 'bullet' ? (
        <ul style={{ margin: 0, paddingInlineStart: '1.1em' }}>
          {lines.map((ln, i) => <li key={i}>{ln}</li>)}
        </ul>
      ) : (
        <ol style={{ margin: 0, paddingInlineStart: '1.3em' }}>
          {lines.map((ln, i) => <li key={i}>{ln}</li>)}
        </ol>
      )
    ) : (
      el.text
    );

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
      {effect?.kind === 'echo' && (
        <div
          aria-hidden
          style={{ ...textStyle, WebkitTextStroke: undefined, position: 'absolute', color: effect.color, transform: `translate(${effect.thickness}px, ${effect.thickness}px)`, zIndex: -1 }}
        >
          {content}
        </div>
      )}
      <div ref={tRef} style={textStyle}>
        {content}
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

export function ShapeView({ el }: { el: ShapeElement }) {
  const w = Math.max(1, el.width);
  const h = Math.max(1, el.height);
  const sw = Math.max(0, el.strokeWidth || 0);
  const strokeOpacity = el.strokeOpacity !== undefined ? el.strokeOpacity : 1;
  const strokeColor = sw > 0 ? rgba(el.strokeColor || '#12131A', strokeOpacity) : 'none';
  const fillOpacity = el.fillOpacity !== undefined ? el.fillOpacity : 1;
  const fillColor = rgba(el.fill || '#12131A', fillOpacity);
  const strokeDash = el.strokeStyle === 'dashed' ? `${Math.max(6, sw * 2)} ${Math.max(4, sw * 1.5)}` : undefined;

  const hasImage = !!el.imageFill && el.imageFill.src;
  const fillId = `fill-${el.id}`;
  const actualFill = hasImage ? `url(#${fillId})` : fillColor;

  const renderDefs = () => {
    if (!hasImage) return null;
    const img = el.imageFill!;
    const zoom = Math.max(1, img.zoom || 1);
    // Cover-fit the image at this zoom level using pure SVG geometry (no CSS
    // transform on an <image> inside a <pattern> — transform-origin on SVG
    // children of a pattern resolves inconsistently across browsers, which
    // is what made panning/zooming behave unpredictably here before).
    const bw = w * zoom;
    const bh = h * zoom;
    const baseX = (w - bw) / 2;
    const baseY = (h - bh) / 2;
    const maxPanX = Math.max(0, (bw - w) / 2);
    const maxPanY = Math.max(0, (bh - h) / 2);
    const panX = ((img.offsetX || 0) / 50) * maxPanX;
    const panY = ((img.offsetY || 0) / 50) * maxPanY;
    return (
      <defs>
        <pattern id={fillId} patternUnits="userSpaceOnUse" width={w} height={h}>
          <image
            href={img.src}
            x={baseX - panX}
            y={baseY - panY}
            width={bw}
            height={bh}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
    );
  };

  const innerW = Math.max(1, w - sw);
  const innerH = Math.max(1, h - sw);
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(1, innerW / 2);
  const ry = Math.max(1, innerH / 2);

  if (el.shape === 'circle') {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', ...shadowStyle(el) }}>
        {renderDefs()}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={actualFill}
          stroke={strokeColor}
          strokeWidth={sw}
          strokeDasharray={strokeDash}
        />
      </svg>
    );
  }

  if (el.shape === 'pill') {
    const pillR = Math.min(innerW, innerH) / 2;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', ...shadowStyle(el) }}>
        {renderDefs()}
        <rect
          x={sw / 2}
          y={sw / 2}
          width={innerW}
          height={innerH}
          rx={pillR}
          ry={pillR}
          fill={actualFill}
          stroke={strokeColor}
          strokeWidth={sw}
          strokeDasharray={strokeDash}
        />
      </svg>
    );
  }

  if (el.shape === 'line') {
    const lineH = Math.max(sw, 2);
    return (
      <svg width={w} height={lineH} viewBox={`0 0 ${w} ${lineH}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', ...shadowStyle(el) }}>
        <line
          x1={0}
          y1={lineH / 2}
          x2={w}
          y2={lineH / 2}
          stroke={strokeColor !== 'none' ? strokeColor : fillColor}
          strokeWidth={lineH}
          strokeDasharray={strokeDash}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (
    el.shape === 'triangle' ||
    el.shape === 'pentagon' ||
    el.shape === 'hexagon' ||
    el.shape === 'octagon' ||
    el.shape === 'star' ||
    el.shape === 'polygon'
  ) {
    let points: string;
    if (el.shape === 'star') {
      const pts: string[] = [];
      const numPoints = 5;
      for (let i = 0; i < numPoints * 2; i++) {
        const isOuter = i % 2 === 0;
        const curRx = isOuter ? rx : rx * 0.42;
        const curRy = isOuter ? ry : ry * 0.42;
        const angle = -Math.PI / 2 + (i * Math.PI) / numPoints;
        pts.push(`${cx + curRx * Math.cos(angle)},${cy + curRy * Math.sin(angle)}`);
      }
      points = pts.join(' ');
    } else {
      const sides =
        el.shape === 'triangle'
          ? 3
          : el.shape === 'pentagon'
          ? 5
          : el.shape === 'hexagon'
          ? 6
          : el.shape === 'octagon'
          ? 8
          : Math.max(3, el.sides || 5);

      const pts: string[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        pts.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
      }
      points = pts.join(' ');
    }

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', ...shadowStyle(el) }}>
        {renderDefs()}
        <polygon
          points={points}
          fill={actualFill}
          stroke={strokeColor}
          strokeWidth={sw}
          strokeDasharray={strokeDash}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Default: Rectangle with corner radius
  const maxR = Math.min(innerW, innerH) / 2;
  const radius = Math.min(maxR, Math.max(0, el.radius || 0));

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible', ...shadowStyle(el) }}>
      {renderDefs()}
      <rect
        x={sw / 2}
        y={sw / 2}
        width={innerW}
        height={innerH}
        rx={radius}
        ry={radius}
        fill={actualFill}
        stroke={strokeColor}
        strokeWidth={sw}
        strokeDasharray={strokeDash}
      />
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
    return <ShapeView el={el} />;
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
