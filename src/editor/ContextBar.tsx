import React, { useState } from 'react';
import { DesignElement, ImageElement, ShapeElement, TextElement } from '../types';
import { useStore } from '../store/useStore';
import { ColorPicker, Seg, Sheet, Slider, UploadButton } from './kit';
import {
  IcAlignCenter, IcAlignLeft, IcAlignRight, IcBold, IcCrop, IcDroplet,
  IcImage, IcLayers, IcPalette, IcShapes, IcSize, IcSwap, IcType,
} from '../ui/icons';
import { image, shape, text } from '../utils/factory';

const FONTS = [
  'Plus Jakarta Sans', 'Poppins', 'Inter', 'Montserrat', 'Space Grotesk',
  'Playfair Display', 'Cormorant Garamond', 'Lora',
  'Oswald', 'Anton', 'Bebas Neue', 'Archivo Black',
  'Caveat', 'Dancing Script', 'JetBrains Mono',
];

type Panel = null | 'font' | 'size' | 'colour' | 'fill' | 'photo' | 'crop' | 'opacity' | 'layer';

/** Only the controls that make sense for the selected object, never more. */
export function ContextBar({ el }: { el: DesignElement }) {
  const update = useStore((s) => s.update);
  const snapshot = useStore((s) => s.snapshot);
  const reorder = useStore((s) => s.reorder);
  const [panel, setPanel] = useState<Panel>(null);

  const set = (patch: any) => update(el.id, patch);
  const setWith = (patch: any) => { snapshot(); update(el.id, patch); };

  const tools: { key: Panel; icon: React.ReactNode; label: string }[] =
    el.type === 'text'
      ? [
          { key: 'font', icon: <IcType size={21} />, label: 'Font' },
          { key: 'size', icon: <IcSize size={21} />, label: 'Size' },
          { key: 'colour', icon: <IcPalette size={21} />, label: 'Colour' },
          { key: 'opacity', icon: <IcDroplet size={21} />, label: 'Fade' },
          { key: 'layer', icon: <IcLayers size={21} />, label: 'Layer' },
        ]
      : el.type === 'image'
      ? [
          { key: 'photo', icon: <IcSwap size={21} />, label: 'Replace' },
          { key: 'crop', icon: <IcCrop size={21} />, label: 'Crop' },
          { key: 'opacity', icon: <IcDroplet size={21} />, label: 'Fade' },
          { key: 'layer', icon: <IcLayers size={21} />, label: 'Layer' },
        ]
      : [
          { key: 'fill', icon: <IcPalette size={21} />, label: 'Colour' },
          { key: 'opacity', icon: <IcDroplet size={21} />, label: 'Fade' },
          { key: 'layer', icon: <IcLayers size={21} />, label: 'Layer' },
        ];

  const t = el as TextElement;

  return (
    <>
      <div className="bg-surface border-t border-line">
        {el.type === 'text' && (
          <div className="flex items-center gap-1 px-3 pt-2.5">
            <button
              onClick={() => setWith({ fontWeight: t.fontWeight >= 700 ? 400 : 800 })}
              className={`h-10 w-10 rounded-xl grid place-items-center ${t.fontWeight >= 700 ? 'bg-ink text-white' : 'bg-canvasbg text-ink-2'}`}
            >
              <IcBold size={18} />
            </button>
            <button
              onClick={() => setWith({ italic: !t.italic })}
              className={`h-10 w-10 rounded-xl grid place-items-center text-[17px] italic font-serif ${t.italic ? 'bg-ink text-white' : 'bg-canvasbg text-ink-2'}`}
            >
              I
            </button>
            <div className="flex-1" />
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setWith({ align: a })}
                className={`h-10 w-10 rounded-xl grid place-items-center ${t.align === a ? 'bg-ink text-white' : 'bg-canvasbg text-ink-2'}`}
              >
                {a === 'left' ? <IcAlignLeft size={18} /> : a === 'center' ? <IcAlignCenter size={18} /> : <IcAlignRight size={18} />}
              </button>
            ))}
          </div>
        )}

        <div className="flex px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => setPanel(tool.key)}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 text-ink-2 active:text-brand"
            >
              {tool.icon}
              <span className="text-[10.5px] font-semibold">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {panel === 'font' && (
        <Sheet title="Font" onClose={() => setPanel(null)}>
          <div className="grid grid-cols-1 gap-1.5 pb-2">
            {FONTS.map((f) => (
              <button
                key={f}
                onClick={() => setWith({ fontFamily: f })}
                className={`h-14 rounded-2xl px-4 text-left text-[19px] ${t.fontFamily === f ? 'bg-brand-soft ring-2 ring-brand text-ink' : 'bg-canvasbg text-ink'}`}
                style={{ fontFamily: `"${f}", sans-serif` }}
              >
                {f}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {panel === 'size' && (
        <Sheet title="Text size & spacing" onClose={() => setPanel(null)}>
          <Slider label="Size" value={t.fontSize} min={12} max={220} onChange={(v) => set({ fontSize: v })} />
          <Slider label="Line spacing" value={t.lineHeight} min={0.8} max={2.2} step={0.05} onChange={(v) => set({ lineHeight: v })} />
          <Slider label="Letter spacing" value={t.letterSpacing} min={-4} max={24} step={0.5} onChange={(v) => set({ letterSpacing: v })} />
          <div className="py-2">
            <div className="text-[12px] font-semibold text-ink-3 mb-2">Capitals</div>
            <Seg
              value={t.uppercase ? 'on' : 'off'}
              onChange={(v) => setWith({ uppercase: v === 'on' })}
              options={[{ value: 'off', label: 'Aa' }, { value: 'on', label: 'AA' }]}
            />
          </div>
          <div className="py-2">
            <div className="text-[12px] font-semibold text-ink-3 mb-2">If the text is too long</div>
            <Seg
              value={t.autoFit ? 'fit' : 'keep'}
              onChange={(v) => setWith({ autoFit: v === 'fit' })}
              options={[{ value: 'fit', label: 'Shrink to fit' }, { value: 'keep', label: 'Keep size' }]}
            />
          </div>
        </Sheet>
      )}

      {panel === 'colour' && (
        <Sheet title="Text colour" onClose={() => setPanel(null)}>
          <ColorPicker value={t.color} onChange={(c) => setWith({ color: c })} />
          <div className="mt-5">
            <div className="text-[12px] font-semibold text-ink-3 mb-2">Highlight behind text</div>
            <Seg
              value={t.highlight ? 'on' : 'off'}
              onChange={(v) => setWith({ highlight: v === 'on' ? { color: '#D4FF3F', padX: 18, padY: 8, radius: 6 } : undefined })}
              options={[{ value: 'off', label: 'None' }, { value: 'on', label: 'Highlight' }]}
            />
            {t.highlight && (
              <div className="mt-3">
                <ColorPicker value={t.highlight.color} onChange={(c) => set({ highlight: { ...t.highlight!, color: c } })} />
              </div>
            )}
          </div>
        </Sheet>
      )}

      {panel === 'fill' && (
        <Sheet title="Colour" onClose={() => setPanel(null)}>
          <ColorPicker
            value={el.type === 'shape' ? (el as ShapeElement).fill : (el as any).color}
            onChange={(c) => setWith(el.type === 'shape' ? { fill: c } : { color: c })}
          />
        </Sheet>
      )}

      {panel === 'photo' && (
        <Sheet title="Picture" onClose={() => setPanel(null)}>
          <UploadButton
            label={(el as ImageElement).src ? 'Replace picture' : 'Upload a picture'}
            onFile={(src) => { snapshot(); set({ src }); setPanel(null); }}
          />
          {(el as ImageElement).src && (
            <button onClick={() => setWith({ src: null })} className="mt-2 w-full h-12 rounded-2xl bg-canvasbg text-[14px] font-bold text-ink-2">
              Remove picture
            </button>
          )}
          <div className="mt-5">
            <div className="text-[12px] font-semibold text-ink-3 mb-2">Shape</div>
            <Seg
              value={(el as ImageElement).circle ? 'circle' : (el as ImageElement).radius > 0 ? 'round' : 'square'}
              onChange={(v) => setWith(v === 'circle' ? { circle: true } : { circle: false, radius: v === 'round' ? 40 : 0 })}
              options={[{ value: 'square', label: 'Square' }, { value: 'round', label: 'Rounded' }, { value: 'circle', label: 'Circle' }]}
            />
          </div>
        </Sheet>
      )}

      {panel === 'crop' && (
        <Sheet title="Position inside the frame" onClose={() => setPanel(null)}>
          <Slider label="Zoom" value={(el as ImageElement).zoom} min={1} max={2.6} step={0.02} onChange={(v) => set({ zoom: v })} />
          <Slider label="Move sideways" value={(el as ImageElement).offsetX} min={-50} max={50} onChange={(v) => set({ offsetX: v })} />
          <Slider label="Move up / down" value={(el as ImageElement).offsetY} min={-50} max={50} onChange={(v) => set({ offsetY: v })} />
          <div className="py-2">
            <Seg
              value={(el as ImageElement).fit}
              onChange={(v) => setWith({ fit: v })}
              options={[{ value: 'cover', label: 'Fill frame' }, { value: 'contain', label: 'Fit whole photo' }]}
            />
          </div>
        </Sheet>
      )}

      {panel === 'opacity' && (
        <Sheet title="Transparency" onClose={() => setPanel(null)}>
          <Slider label="Opacity" value={el.opacity} min={0.05} max={1} step={0.01} onChange={(v) => set({ opacity: v })} />
          <Slider label="Rotation" value={el.rotation} min={-180} max={180} onChange={(v) => set({ rotation: v })} suffix="°" />
        </Sheet>
      )}

      {panel === 'layer' && (
        <Sheet title="Arrange" onClose={() => setPanel(null)}>
          <div className="grid grid-cols-2 gap-2 pb-2">
            {([['front', 'Bring to front'], ['up', 'Forward'], ['down', 'Backward'], ['back', 'Send to back']] as const).map(([d, l]) => (
              <button key={d} onClick={() => reorder(el.id, d)} className="h-14 rounded-2xl bg-canvasbg text-[13px] font-bold text-ink">
                {l}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}

/** Add new elements — kept deliberately short so it doesn't feel like a toolbox. */
export function AddSheet({ project, onClose }: { project: any; onClose: () => void }) {
  const add = useStore((s) => s.add);
  const c = project.canvas;
  const maxZ = Math.max(...project.elements.map((e: DesignElement) => e.z), 0) + 1;
  const cx = c.width / 2, cy = c.height / 2;

  const items = [
    {
      icon: <IcType size={22} />, label: 'Heading',
      make: () => text('headline', { x: cx - c.width * 0.4, y: cy - 60, width: c.width * 0.8, height: 140, text: 'Your heading', fontFamily: 'Poppins', fontSize: Math.round(c.width / 16), fontWeight: 700, align: 'center', z: maxZ }),
    },
    {
      icon: <IcType size={18} />, label: 'Body text',
      make: () => text('body', { x: cx - c.width * 0.35, y: cy - 40, width: c.width * 0.7, height: 120, text: 'Write something here', fontSize: Math.round(c.width / 32), align: 'center', z: maxZ }),
    },
    {
      icon: <IcImage size={22} />, label: 'Picture',
      make: () => image('photo', { x: cx - c.width * 0.22, y: cy - c.width * 0.22, width: c.width * 0.44, height: c.width * 0.44, radius: 24, z: maxZ }),
    },
    {
      icon: <IcShapes size={22} />, label: 'Shape',
      make: () => shape({ x: cx - 140, y: cy - 140, width: 280, height: 280, fill: '#F02D63', radius: 32, z: maxZ }),
    },
  ];

  return (
    <Sheet title="Add to your design" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2.5 pb-2">
        {items.map((i) => (
          <button
            key={i.label}
            onClick={() => { add(i.make() as DesignElement); onClose(); }}
            className="h-28 rounded-2xl bg-canvasbg active:bg-line flex flex-col items-center justify-center gap-2 text-ink"
          >
            <span className="w-12 h-12 rounded-2xl bg-surface grid place-items-center">{i.icon}</span>
            <span className="text-[13px] font-bold">{i.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
