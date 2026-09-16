import React from 'react';
import { CANVAS_SIZES, CanvasSize } from '../types';
import { IcBack } from '../ui/icons';

export function SizeScreen({ onBack, onPick }: { onBack: () => void; onPick: (s: CanvasSize) => void }) {
  return (
    <div className="h-full bg-canvasbg flex flex-col">
      <header className="flex items-center gap-2 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-full grid place-items-center text-ink"><IcBack size={22} /></button>
        <span className="text-[13px] font-bold text-ink-3">Step 1 of 2</span>
      </header>

      <div className="px-5 pb-5">
        <h1 className="text-[26px] font-extrabold text-ink leading-tight">What shape is your post?</h1>
        <p className="text-[14px] text-ink-2 mt-1.5">Portrait takes up more room in the feed.</p>
      </div>

      <div className="px-5 space-y-3">
        {CANVAS_SIZES.map((s) => (
          <button
            key={s.key}
            onClick={() => onPick(s)}
            className="w-full bg-surface rounded-3xl p-4 flex items-center gap-4 text-left active:bg-line/40"
          >
            <span className="w-24 h-28 grid place-items-center shrink-0">
              <span className="bg-brand rounded-xl block" style={{ width: 62, height: (62 * s.height) / s.width }} />
            </span>
            <span>
              <span className="block text-[17px] font-bold text-ink">{s.label}</span>
              <span className="block text-[12.5px] text-ink-3 mt-0.5">{s.note}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
