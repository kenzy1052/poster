import React, { useMemo } from 'react';
import { CanvasSize, Project } from '../types';
import { TEMPLATES, blankDesign } from '../utils/templates';
import { StaticDesign } from '../render/Render';
import { IcBack, IcPlus } from '../ui/icons';

const THUMB = 152;

export function TemplateScreen({
  canvas, onBack, onPick,
}: { canvas: CanvasSize; onBack: () => void; onPick: (templateId: string) => void }) {
  const built = useMemo(() => TEMPLATES.map((t) => ({ t, d: t.build(canvas) })), [canvas]);
  const scale = THUMB / canvas.width;
  const h = canvas.height * scale;

  const mock = (d: any): Project => ({
    id: 'p', name: 'p', templateId: 'p', canvas, background: d.background, elements: d.elements,
    profileMode: 'handle-only', handle: '@yourhandle', avatar: null, createdAt: 0, updatedAt: 0,
  });

  return (
    <div className="h-full bg-canvasbg flex flex-col">
      <header className="flex items-center gap-2 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-full grid place-items-center text-ink"><IcBack size={22} /></button>
        <span className="text-[13px] font-bold text-ink-3">Step 2 of 2</span>
      </header>

      <div className="px-5 pb-4 shrink-0">
        <h1 className="text-[26px] font-extrabold text-ink leading-tight">Pick a design</h1>
        <p className="text-[14px] text-ink-2 mt-1.5">Every word, colour and picture is yours to change.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-10 no-scrollbar">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <button
            onClick={() => onPick('blank')}
            className="rounded-2xl border-2 border-dashed border-line bg-surface/60 flex flex-col items-center justify-center gap-2 text-ink-3 active:border-brand"
            style={{ height: h }}
          >
            <IcPlus size={26} />
            <span className="text-[13px] font-bold text-ink">Blank</span>
          </button>

          {built.map(({ t, d }) => (
            <button key={t.id} onClick={() => onPick(t.id)} className="text-left">
              <div
                className="rounded-2xl overflow-hidden bg-surface border border-line"
                style={{ width: THUMB, height: h }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: canvas.width, height: canvas.height, pointerEvents: 'none' }}>
                  <StaticDesign project={mock(d)} />
                </div>
              </div>
              <div className="text-[12.5px] font-bold text-ink mt-1.5">{t.name}</div>
              <div className="text-[10.5px] text-ink-3">{t.tag}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
