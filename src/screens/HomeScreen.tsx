import React from 'react';
import { useStore } from '../store/useStore';
import { IcPlus, IcSparkle, IcFolder, IcAt } from '../ui/icons';
import { LiveThumbnail } from '../components/LiveThumbnail';

export function HomeScreen({ onCreate, onDesigns, onProfile }: { onCreate: () => void; onDesigns: () => void; onProfile: () => void }) {
  const projects = useStore((s) => s.projects);
  const open = useStore((s) => s.open);
  const handle = useStore((s) => s.savedHandle);
  const recent = [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  return (
    <div className="h-full overflow-y-auto bg-canvasbg no-scrollbar">
      <div className="px-5 pt-[max(1.75rem,env(safe-area-inset-top))] pb-5">
        <div className="flex items-center gap-1.5 text-brand">
          <IcSparkle size={17} />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Post Studio</span>
        </div>
        <h1 className="text-[30px] leading-[1.12] font-extrabold text-ink mt-1.5">Make a post<br />people stop for.</h1>
        <p className="text-[14px] text-ink-2 mt-2">16 designs. Tap anything to change it.</p>
      </div>

      <div className="px-5">
        <button
          onClick={onCreate}
          className="w-full bg-brand text-white rounded-[26px] p-5 flex items-center gap-4 text-left active:bg-brand-dark transition-colors"
        >
          <span className="w-14 h-14 rounded-3xl bg-white/20 grid place-items-center shrink-0"><IcPlus size={28} /></span>
          <span>
            <span className="block text-[18px] font-extrabold">Create post</span>
            <span className="block text-[13px] text-white/80">Pick a size, then a design</span>
          </span>
        </button>
      </div>

      <div className="px-5 mt-3 grid grid-cols-2 gap-3">
        <button onClick={onDesigns} className="bg-surface rounded-3xl p-4 text-left active:bg-line/50">
          <span className="w-10 h-10 rounded-2xl bg-canvasbg grid place-items-center text-ink mb-2.5"><IcFolder size={20} /></span>
          <span className="block text-[14px] font-bold text-ink">My designs</span>
          <span className="block text-[12px] text-ink-3">{projects.length} saved</span>
        </button>
        <button onClick={onProfile} className="bg-surface rounded-3xl p-4 text-left active:bg-line/50">
          <span className="w-10 h-10 rounded-2xl bg-canvasbg grid place-items-center text-ink mb-2.5"><IcAt size={20} /></span>
          <span className="block text-[14px] font-bold text-ink">Settings</span>
          <span className="block text-[12px] text-ink-3 truncate">{handle || 'Set your handle'}</span>
        </button>
      </div>

      {recent.length > 0 && (
        <div className="px-5 mt-7 pb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-ink">Pick up where you left off</h2>
            <button onClick={onDesigns} className="text-[13px] font-bold text-brand">All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recent.map((p) => (
              <button key={p.id} onClick={() => open(p.id)} className="text-left">
                <div
                  className="rounded-2xl overflow-hidden bg-surface border border-line"
                  style={{ aspectRatio: `${p.canvas.width}/${p.canvas.height}` }}
                >
                  <LiveThumbnail project={p} />
                </div>
                <div className="text-[12px] font-semibold text-ink truncate mt-1.5">{p.name}</div>
                <div className="text-[10.5px] text-ink-3">{p.canvas.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
