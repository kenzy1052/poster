import React from 'react';
import { DecorElement } from '../types';

/**
 * Decorative vectors drawn on a 100×100 viewBox and stretched to the element
 * box, so they stay crisp at export size and remain recolourable/resizable
 * like any other element.
 */
export function Decor({ el }: { el: DecorElement }) {
  const c = el.color;
  const c2 = el.color2;
  const sw = el.strokeWidth;
  const common = { width: '100%', height: '100%', style: { display: 'block' as const }, xmlns: 'http://www.w3.org/2000/svg' };

  switch (el.kind) {
    case 'blob':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <path
            d="M18 26c6-14 26-18 34-8 6 8 2 16 8 20 7 5 20 1 26 10 7 10-2 24-14 28-14 5-24-4-34-2-12 2-22 12-30 4C0 70 6 56 12 48c5-7 2-14 6-22z"
            fill={c}
          />
        </svg>
      );

    case 'quote-open':
    case 'quote-close': {
      const flip = el.kind === 'quote-close';
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <g transform={flip ? 'rotate(180 50 50)' : undefined} fill={c}>
            <path d="M8 62c0-26 14-42 32-48l6 13c-11 5-18 13-19 23h15v36H8z" />
            <path d="M54 62c0-26 14-42 32-48l6 13c-11 5-18 13-19 23h15v36H54z" />
          </g>
        </svg>
      );
    }

    case 'quote-slab':
      // Heavy geometric quote marks, as in the "FACT" reference.
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <g fill={c}>
            <path d="M4 6h38v40l-16 22H8l14-22H4z" />
            <path d="M56 6h40v40l-16 22H60l14-22H56z" />
          </g>
        </svg>
      );

    case 'squiggle':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <path
            d="M2 62C10 20 34 4 46 16c11 11-6 30-18 22C14 29 30 6 62 12c22 4 30 20 36 28"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </svg>
      );

    case 'dashed-curve':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <path
            d="M96 10C60 6 8 18 6 44c-1 22 40 30 62 32"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${sw * 1.6} ${sw * 2.4}`}
          />
          <circle cx="96" cy="10" r={sw * 1.8} fill={c} />
          <circle cx="24" cy="70" r={sw * 1.8} fill={c2} />
        </svg>
      );

    case 'arrow-right':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <path d="M4 50h88M74 32l18 18-18 18" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'arrow-circle':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <circle cx="50" cy="50" r="46" fill={c2} />
          <path d="M30 50h40M56 36l14 14-14 14" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'grid': {
      const lines = [];
      for (let i = 1; i < 10; i++) {
        lines.push(<line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke={c} strokeWidth={sw} />);
        lines.push(<line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke={c} strokeWidth={sw} />);
      }
      return <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>{lines}</svg>;
    }

    case 'stripes': {
      // Organic vertical bands, like the zebra-ish backdrop in the reference.
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <rect width="100" height="100" fill={c2} />
          <g fill={c}>
            <path d="M0 0h16c-4 18 6 26 2 42S4 76 8 100H0z" />
            <path d="M26 0h14c-6 16 4 24 0 40s-10 24-6 60H22c-4-32 6-44 8-60s-4-24-4-40z" />
            <path d="M52 0h18c-8 14 2 26-2 42s-8 26-4 58H48c-4-30 6-44 8-58s-6-28-4-42z" />
            <path d="M82 0h18v100h-14c-4-28 4-42 4-56s-8-28-8-44z" />
          </g>
        </svg>
      );
    }

    case 'ring':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <circle cx="50" cy="50" r={50 - sw / 2} fill="none" stroke={c} strokeWidth={sw} />
        </svg>
      );

    case 'ring-quarter':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d={`M50 ${sw / 2} A ${50 - sw / 2} ${50 - sw / 2} 0 0 1 ${100 - sw / 2} 50`} fill="none" stroke={c} strokeWidth={sw} />
        </svg>
      );

    case 'badge-round-text': {
      const text = (el.label || 'REBUILDING · BRANDS · ').toUpperCase();
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <circle cx="50" cy="50" r="50" fill={c2} />
          <defs>
            <path id={`arc-${el.id}`} d="M50 12 A38 38 0 1 1 49.9 12" fill="none" />
          </defs>
          <text fontSize="9" fontWeight="700" fill={c} letterSpacing="1.2" fontFamily="Space Grotesk, sans-serif">
            <textPath href={`#arc-${el.id}`}>{text}</textPath>
          </text>
          <circle cx="50" cy="50" r="12" fill={c} />
        </svg>
      );
    }

    case 'bell':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d="M50 12c-13 0-22 9-22 22 0 18-6 22-9 27-2 3 0 7 4 7h54c4 0 6-4 4-7-3-5-9-9-9-27 0-13-9-22-22-22z" fill={c} />
          <path d="M40 74a10 10 0 0020 0z" fill={c} />
          <circle cx="76" cy="22" r="18" fill={c2} />
          <text x="76" y="28" fontSize="20" fontWeight="700" textAnchor="middle" fill="#fff" fontFamily="Plus Jakarta Sans, sans-serif">1</text>
        </svg>
      );

    case 'heart-bubble':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <rect x="4" y="8" width="92" height="66" rx="16" fill={c} />
          <path d="M34 74l14 18 8-18z" fill={c} />
          <path d="M42 30c-5 0-9 4-9 9 0 11 15 17 17 18 2-1 17-7 17-18 0-5-4-9-9-9-3 0-6 2-8 4-2-2-5-4-8-4z" fill={c2} />
        </svg>
      );

    case 'pause-dot':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <circle cx="50" cy="50" r="50" fill={c} />
          <rect x="36" y="32" width="9" height="36" rx="3" fill={c2} />
          <rect x="55" y="32" width="9" height="36" rx="3" fill={c2} />
        </svg>
      );

    case 'comment-dot':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d="M50 14c-21 0-38 13-38 29 0 9 5 17 14 23-1 6-4 11-8 15 9-1 17-4 23-9 3 .5 6 .8 9 .8 21 0 38-13 38-29S71 14 50 14z" fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
        </svg>
      );

    case 'corner-frame':
      // Large rounded outline that runs off two edges, as in the "DID YOU KNOW" ref.
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <path d="M0 4h72a24 24 0 0124 24v72" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          <path d="M0 4v68a24 24 0 0024 24h76" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" opacity="0" />
        </svg>
      );

    case 'underline-swash':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <path d="M2 62c22-14 52-20 96-16" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );

    case 'pointing-hand':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d="M8 46c0-5 4-8 9-8h20V26c0-6 5-10 11-10s11 4 11 10v10h9c8 0 14 6 14 13v14c0 11-9 20-21 20H36c-8 0-15-4-19-11L6 56c-2-4 0-8 4-9 3-1 6 0 8 3l4 6z" fill={c} />
          <path d="M37 40h30" stroke={c2} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'hanging-sign':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" {...common}>
          <path d="M14 2L28 26M86 2L72 26" stroke={c2} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <rect x="6" y="24" width="88" height="56" rx="12" fill={c} />
          <rect x="12" y="30" width="76" height="44" rx="8" fill="none" stroke={c2} strokeWidth={sw * 0.8} strokeDasharray="5 4" />
        </svg>
      );

    default:
      return null;
  }
}
