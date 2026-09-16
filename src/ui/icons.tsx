import React from 'react';

/**
 * A small hand-built icon set: consistent 24px grid, 2px rounded strokes, and
 * a soft "duotone" fill on the accent shapes so the app reads friendly rather
 * than like a developer dashboard.
 */

type P = { size?: number; className?: string; color?: string };

const S = ({ size = 24, className, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const IcSparkle = (p: P) => (
  <S {...p}>
    <path d="M12 3.5l1.7 4.4 4.4 1.7-4.4 1.7L12 15.7l-1.7-4.4L5.9 9.6l4.4-1.7z" fill="currentColor" fillOpacity={0.16} />
    <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="currentColor" fillOpacity={0.16} />
  </S>
);

export const IcPlus = (p: P) => (
  <S {...p}><path d="M12 5.5v13M5.5 12h13" /></S>
);

export const IcType = (p: P) => (
  <S {...p}>
    <path d="M4.5 7V5.5h15V7" />
    <path d="M12 5.8v12.7M9 18.5h6" />
  </S>
);

export const IcImage = (p: P) => (
  <S {...p}>
    <rect x="3.2" y="4.8" width="17.6" height="14.4" rx="3.4" fill="currentColor" fillOpacity={0.12} />
    <circle cx="9" cy="10" r="1.7" />
    <path d="M4 17.2l4.3-4a2 2 0 012.7 0l2.2 2 1.6-1.4a2 2 0 012.7.1L20.6 16" />
  </S>
);

export const IcShapes = (p: P) => (
  <S {...p}>
    <circle cx="8.2" cy="8.2" r="4.2" fill="currentColor" fillOpacity={0.14} />
    <rect x="11.6" y="11.6" width="8.6" height="8.6" rx="2.6" />
  </S>
);

export const IcAvatar = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="9" r="3.6" fill="currentColor" fillOpacity={0.14} />
    <path d="M4.8 20c.9-3.8 3.8-5.8 7.2-5.8s6.3 2 7.2 5.8" />
  </S>
);

export const IcAt = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.4" fill="currentColor" fillOpacity={0.14} />
    <path d="M15.4 8.6v4.6a2.4 2.4 0 004.8 0V12a8.2 8.2 0 10-3.3 6.6" />
  </S>
);

export const IcPalette = (p: P) => (
  <S {...p}>
    <path d="M12 3.6a8.4 8.4 0 000 16.8c1.3 0 1.9-.9 1.9-1.8 0-1.3-1-1.7-1-2.8 0-.8.7-1.4 1.6-1.4h1.6c2.4 0 4.3-1.9 4.3-4.5C20.4 6.4 16.7 3.6 12 3.6z" fill="currentColor" fillOpacity={0.12} />
    <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.8" cy="9.6" r="1.1" fill="currentColor" stroke="none" />
  </S>
);

export const IcWand = (p: P) => (
  <S {...p}>
    <path d="M5 19l9.2-9.2" />
    <path d="M13 6.2l4.8 4.8" />
    <path d="M16.6 3.4l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" fillOpacity={0.2} />
  </S>
);

export const IcLayers = (p: P) => (
  <S {...p}>
    <path d="M12 3.8l8 4.3-8 4.3-8-4.3z" fill="currentColor" fillOpacity={0.14} />
    <path d="M4.6 12.4L12 16.4l7.4-4" />
    <path d="M4.6 16.4L12 20.4l7.4-4" />
  </S>
);

export const IcUndo = (p: P) => (
  <S {...p}><path d="M8.4 8.2H14a5.4 5.4 0 110 10.8h-5" /><path d="M11.2 4.8L7.4 8.3l3.8 3.4" /></S>
);

export const IcRedo = (p: P) => (
  <S {...p}><path d="M15.6 8.2H10a5.4 5.4 0 100 10.8h5" /><path d="M12.8 4.8l3.8 3.5-3.8 3.4" /></S>
);

export const IcBack = (p: P) => (
  <S {...p}><path d="M14.5 5.5L8 12l6.5 6.5" /></S>
);

export const IcClose = (p: P) => (
  <S {...p}><path d="M6.6 6.6l10.8 10.8M17.4 6.6L6.6 17.4" /></S>
);

export const IcCheck = (p: P) => (
  <S {...p}><path d="M5 12.6l4.6 4.4L19 7.2" /></S>
);

export const IcTrash = (p: P) => (
  <S {...p}>
    <path d="M4.8 7h14.4" />
    <path d="M9.4 7V5.4A1.4 1.4 0 0110.8 4h2.4a1.4 1.4 0 011.4 1.4V7" />
    <path d="M6.6 7l.8 11.3A1.8 1.8 0 009.2 20h5.6a1.8 1.8 0 001.8-1.7L17.4 7" fill="currentColor" fillOpacity={0.1} />
  </S>
);

export const IcCopy = (p: P) => (
  <S {...p}>
    <rect x="8.4" y="8.4" width="11.2" height="11.2" rx="3" fill="currentColor" fillOpacity={0.12} />
    <path d="M15.6 5.6A2.2 2.2 0 0013.4 4H7.2A3.2 3.2 0 004 7.2v6.2c0 1 .6 1.8 1.6 2.2" />
  </S>
);

export const IcUp = (p: P) => (<S {...p}><path d="M12 19V5.6M6.4 11L12 5.4 17.6 11" /></S>);
export const IcDown = (p: P) => (<S {...p}><path d="M12 5v13.4M17.6 13L12 18.6 6.4 13" /></S>);

export const IcEye = (p: P) => (
  <S {...p}>
    <path d="M2.8 12S6 6.2 12 6.2 21.2 12 21.2 12 18 17.8 12 17.8 2.8 12 2.8 12z" fill="currentColor" fillOpacity={0.1} />
    <circle cx="12" cy="12" r="2.9" />
  </S>
);

export const IcEyeOff = (p: P) => (
  <S {...p}>
    <path d="M4 12s3.2-5.8 8-5.8c1.5 0 2.8.4 3.9 1M20 12s-3.2 5.8-8 5.8c-1.6 0-3-.4-4.1-1.1" />
    <path d="M5 5l14 14" />
  </S>
);

export const IcZoomIn = (p: P) => (
  <S {...p}><circle cx="10.8" cy="10.8" r="6.2" fill="currentColor" fillOpacity={0.1} /><path d="M10.8 8.4v4.8M8.4 10.8h4.8M15.6 15.6L20 20" /></S>
);

export const IcZoomOut = (p: P) => (
  <S {...p}><circle cx="10.8" cy="10.8" r="6.2" fill="currentColor" fillOpacity={0.1} /><path d="M8.4 10.8h4.8M15.6 15.6L20 20" /></S>
);

export const IcFit = (p: P) => (
  <S {...p}>
    <path d="M4 9V5.8A1.8 1.8 0 015.8 4H9M15 4h3.2A1.8 1.8 0 0120 5.8V9M20 15v3.2a1.8 1.8 0 01-1.8 1.8H15M9 20H5.8A1.8 1.8 0 014 18.2V15" />
  </S>
);

export const IcReset = (p: P) => (
  <S {...p}><path d="M4.6 12a7.4 7.4 0 1012.3-5.6" /><path d="M17.6 3.2v3.8h-3.8" /></S>
);

export const IcDownload = (p: P) => (
  <S {...p}><path d="M12 4v10.6M7.6 10.6L12 15l4.4-4.4" /><path d="M4.8 18.4h14.4" /></S>
);

export const IcShare = (p: P) => (
  <S {...p}>
    <path d="M12 4v11" /><path d="M8.2 7.4L12 3.8l3.8 3.6" />
    <path d="M6 12H5a1.8 1.8 0 00-1.8 1.8v4.6A1.8 1.8 0 005 20.2h14a1.8 1.8 0 001.8-1.8v-4.6A1.8 1.8 0 0019 12h-1" fill="currentColor" fillOpacity={0.1} />
  </S>
);

export const IcFolder = (p: P) => (
  <S {...p}>
    <path d="M3.4 7.6A2.2 2.2 0 015.6 5.4h3.1c.7 0 1.3.3 1.7.9l.8 1h7.2a2.2 2.2 0 012.2 2.2v7.9a2.2 2.2 0 01-2.2 2.2H5.6a2.2 2.2 0 01-2.2-2.2z" fill="currentColor" fillOpacity={0.12} />
  </S>
);

export const IcGrid = (p: P) => (
  <S {...p}>
    <rect x="4" y="4" width="7" height="7" rx="2.2" fill="currentColor" fillOpacity={0.14} />
    <rect x="13" y="4" width="7" height="7" rx="2.2" />
    <rect x="4" y="13" width="7" height="7" rx="2.2" />
    <rect x="13" y="13" width="7" height="7" rx="2.2" fill="currentColor" fillOpacity={0.14} />
  </S>
);

export const IcSwap = (p: P) => (
  <S {...p}><path d="M4.4 8.6h12.2M13.4 5.4l3.2 3.2-3.2 3.2" /><path d="M19.6 15.4H7.4M10.6 12.2l-3.2 3.2 3.2 3.2" /></S>
);

export const IcCrop = (p: P) => (
  <S {...p}><path d="M6.4 3v12.2a2 2 0 002 2H21" /><path d="M3 6.4h12.2a2 2 0 012 2V21" /></S>
);

export const IcBold = (p: P) => (
  <S {...p} ><path d="M7.6 4.8h5.2a3.6 3.6 0 010 7.2H7.6z" strokeWidth={2.2} /><path d="M7.6 12h6a3.6 3.6 0 010 7.2H7.6z" strokeWidth={2.2} /></S>
);

export const IcAlignLeft = (p: P) => (<S {...p}><path d="M4.4 6.6h15M4.4 12h9.6M4.4 17.4h12.6" /></S>);
export const IcAlignCenter = (p: P) => (<S {...p}><path d="M4.4 6.6h15M7.2 12h9.6M5.8 17.4h12.4" /></S>);
export const IcAlignRight = (p: P) => (<S {...p}><path d="M4.4 6.6h15M9.4 12h9.6M6.4 17.4h12.6" /></S>);

export const IcSize = (p: P) => (
  <S {...p}><path d="M4 16.5L8 6.8l4 9.7M5.4 13.6h5.2" /><path d="M14.6 16.5l2.6-6.6 2.8 6.6M15.6 14.4h3.6" /></S>
);

export const IcDroplet = (p: P) => (
  <S {...p}><path d="M12 3.6s5.6 5.6 5.6 9.4a5.6 5.6 0 11-11.2 0c0-3.8 5.6-9.4 5.6-9.4z" fill="currentColor" fillOpacity={0.14} /></S>
);

export const IcTap = (p: P) => (
  <S {...p}>
    <path d="M9 11V6.4a1.9 1.9 0 113.8 0V13" />
    <path d="M12.8 11.6a1.7 1.7 0 013.4 0v.9a1.7 1.7 0 013.2.8v2.4a4.9 4.9 0 01-4.9 4.9h-1.9a5 5 0 01-4.3-2.5L6 15.4a1.7 1.7 0 012.8-1.9l1 1.2" fill="currentColor" fillOpacity={0.1} />
  </S>
);
