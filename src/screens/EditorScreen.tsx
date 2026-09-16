import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { EditorCanvas, CanvasHandle } from '../editor/EditorCanvas';
import { ContextBar, AddSheet } from '../editor/ContextBar';
import { QuickEdit, ProfileSheet } from '../editor/QuickEdit';
import { getTemplate, blankDesign } from '../utils/templates';
import {
  IcBack, IcUndo, IcRedo, IcReset, IcWand, IcPlus, IcAvatar, IcZoomIn, IcZoomOut, IcFit, IcTap,
} from '../ui/icons';

export function EditorScreen({ onBack, onPreview }: { onBack: () => void; onPreview: () => void }) {
  const project = useStore((s) => s.projects.find((p) => p.id === s.currentId));
  const selectedId = useStore((s) => s.selectedId);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const replaceDesign = useStore((s) => s.replaceDesign);
  const update = useStore((s) => s.update);
  const snapshot = useStore((s) => s.snapshot);

  const canvasRef = useRef<CanvasHandle | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingImage = useRef<string | null>(null);

  const [sheet, setSheet] = useState<null | 'quick' | 'add' | 'profile'>(null);
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [hint, setHint] = useState(true);

  if (!project) return null;
  const selected = project.elements.find((e) => e.id === selectedId) || null;

  const requestImage = (id: string) => {
    pendingImage.current = id;
    fileRef.current?.click();
  };

  const onFile = (f: File) => {
    const id = pendingImage.current;
    if (!id) return;
    const r = new FileReader();
    r.onload = () => { snapshot(); update(id, { src: r.result as string } as any); };
    r.readAsDataURL(f);
  };

  const reset = () => {
    const d = project.templateId === 'blank'
      ? blankDesign(project.canvas)
      : getTemplate(project.templateId)?.build(project.canvas);
    if (d) replaceDesign({ background: d.background, elements: d.elements });
    setConfirmReset(false);
  };

  return (
    <div className="flex flex-col h-full bg-canvasbg">
      <header className="flex items-center gap-1 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-surface border-b border-line shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-full grid place-items-center text-ink"><IcBack size={22} /></button>
        <button onClick={undo} disabled={!canUndo} className={`w-10 h-10 rounded-full grid place-items-center ${canUndo ? 'text-ink' : 'text-line'}`}><IcUndo size={20} /></button>
        <button onClick={redo} disabled={!canRedo} className={`w-10 h-10 rounded-full grid place-items-center ${canRedo ? 'text-ink' : 'text-line'}`}><IcRedo size={20} /></button>
        <button onClick={() => setConfirmReset(true)} className="w-10 h-10 rounded-full grid place-items-center text-ink-2"><IcReset size={19} /></button>
        <div className="flex-1" />
        <button onClick={onPreview} className="h-10 px-5 rounded-full bg-brand text-white text-[14px] font-bold active:bg-brand-dark">
          Done
        </button>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <EditorCanvas
          project={project}
          handleRef={canvasRef}
          onRequestImage={requestImage}
          onEditingChange={setEditing}
        />

        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5 rounded-2xl bg-surface/95 p-1 shadow-md border border-line">
          <button onClick={() => canvasRef.current?.zoomBy(1.35)} className="w-10 h-10 rounded-xl grid place-items-center text-ink active:bg-canvasbg"><IcZoomIn size={20} /></button>
          <button onClick={() => canvasRef.current?.zoomBy(1 / 1.35)} className="w-10 h-10 rounded-xl grid place-items-center text-ink active:bg-canvasbg"><IcZoomOut size={20} /></button>
          <button onClick={() => canvasRef.current?.fit()} className="w-10 h-10 rounded-xl grid place-items-center text-ink active:bg-canvasbg"><IcFit size={19} /></button>
        </div>

        {hint && !selected && !editing && (
          <button
            onClick={() => setHint(false)}
            className="absolute left-1/2 -translate-x-1/2 top-3 flex items-center gap-2 rounded-full bg-ink/85 text-white text-[12px] font-semibold px-3.5 py-2"
          >
            <IcTap size={15} /> Tap anything on the design to change it
          </button>
        )}
      </div>

      {selected && !editing ? (
        <ContextBar el={selected} />
      ) : !editing ? (
        <div className="bg-surface border-t border-line flex px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Tab icon={<IcWand size={22} />} label="Quick Edit" accent onClick={() => setSheet('quick')} />
          <Tab icon={<IcAvatar size={22} />} label="Profile" onClick={() => setSheet('profile')} />
          <Tab icon={<IcPlus size={22} />} label="Add" onClick={() => setSheet('add')} />
        </div>
      ) : (
        <div className="bg-surface border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-[12px] font-semibold text-ink-3">
          Typing — tap anywhere outside to finish
        </div>
      )}

      {sheet === 'quick' && (
        <QuickEdit
          project={project}
          onClose={() => setSheet(null)}
          onFocus={(id) => canvasRef.current?.focusOn(id)}
          onEditText={(id) => canvasRef.current?.focusOn(id)}
          onReplaceImage={requestImage}
        />
      )}
      {sheet === 'profile' && <ProfileSheet project={project} onClose={() => setSheet(null)} />}
      {sheet === 'add' && <AddSheet project={project} onClose={() => setSheet(null)} />}

      {confirmReset && (
        <div className="fixed inset-0 z-50 grid place-items-center p-8 bg-ink/40" onClick={() => setConfirmReset(false)}>
          <div className="bg-surface rounded-3xl p-5 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-ink">Start this template over?</h3>
            <p className="text-[13px] text-ink-2 mt-1 mb-4">Your edits to this design will be cleared.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="flex-1 h-12 rounded-2xl bg-canvasbg text-[14px] font-bold text-ink">Cancel</button>
              <button onClick={reset} className="flex-1 h-12 rounded-2xl bg-brand text-white text-[14px] font-bold">Start over</button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ''; }}
      />
    </div>
  );
}

function Tab({ icon, label, onClick, accent }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1 py-1.5 ${accent ? 'text-brand' : 'text-ink-2'}`}>
      {icon}
      <span className="text-[10.5px] font-semibold">{label}</span>
    </button>
  );
}
