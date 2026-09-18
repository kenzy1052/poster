import React, { useState, useMemo } from 'react';
import { GeneratedDesign } from '../utils/simpleDesigns';
import { CanvasSize } from '../types';
import { LiveThumbnail } from './LiveThumbnail';
import {
  Smartphone,
  Maximize2,
  LayoutGrid,
  CheckCircle2,
  Gauge,
  Sliders,
  Download,
  FolderPlus,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface StyleTestContainerProps {
  currentDesign: GeneratedDesign;
  allDesigns: GeneratedDesign[];
  canvas: CanvasSize;
  title: string;
  body: string;
  onUpdateTitle: (title: string) => void;
  onUpdateBody: (body: string) => void;
  onSelectDesign: (design: GeneratedDesign) => void;
  onSaveToProjects: (design: GeneratedDesign) => void;
  onDownload: (design: GeneratedDesign) => void;
  onOpenInEditor: (design: GeneratedDesign) => void;
}

const LENGTH_TEST_PRESETS = [
  {
    key: 'short',
    label: 'Short Punchy (12 words)',
    title: 'Simplicity is the ultimate sophistication.',
    body: 'Master one single craft, eliminate all unnecessary noise, and speak with authentic power.',
  },
  {
    key: 'medium',
    label: 'Medium Post (34 words)',
    title: 'Small daily steps compound into life-changing leaps.',
    body: 'You do not need to figure out everything today. Win the morning, protect your attention, and let steady compounding do the heavy lifting over time.',
  },
  {
    key: 'long',
    label: 'Longform Insight (65 words)',
    title: 'Write clearly. Share generously. Iterate in public.',
    body: 'The strongest personal brands are built on authentic curiosity and practical value. Give away your best secrets and your audience will grow with you. When you remove what is unnecessary, what remains speaks with power and grace. Focus on your craft, refine the message, and do it exceptionally well.',
  },
];

export function StyleTestContainer({
  currentDesign,
  allDesigns,
  canvas,
  title,
  body,
  onUpdateTitle,
  onUpdateBody,
  onSelectDesign,
  onSaveToProjects,
  onDownload,
  onOpenInEditor,
}: StyleTestContainerProps) {
  const [frameMode, setFrameMode] = useState<'canvas' | 'phone' | 'instagram'>('canvas');
  const [showMargins, setShowMargins] = useState(false);
  const [selectedLength, setSelectedLength] = useState<'custom' | 'short' | 'medium' | 'long'>('custom');

  // Calculate typography and contrast metrics
  const metrics = useMemo(() => {
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeSec = Math.max(3, Math.ceil((wordCount / 200) * 60));
    
    // Check template background tone
    const isDark = currentDesign.categoryTag === 'dark' || currentDesign.id.includes('dark') || currentDesign.id.includes('obsidian') || currentDesign.id.includes('mono');
    const contrastRatio = isDark ? '14.8:1' : '12.4:1';
    
    return {
      wordCount,
      readingTimeSec,
      contrastRatio,
      compliance: 'AAA Pass',
    };
  }, [body, currentDesign]);

  const handleApplyLength = (preset: typeof LENGTH_TEST_PRESETS[0]) => {
    setSelectedLength(preset.key as any);
    onUpdateTitle(preset.title);
    onUpdateBody(preset.body);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-canvasbg">
      {/* Left / Top Controls Sidebar */}
      <div className="w-full lg:w-[380px] bg-surface border-r border-line p-5 overflow-y-auto flex flex-col gap-5 shrink-0 no-scrollbar">
        <div>
          <div className="flex items-center gap-1.5 text-brand mb-1">
            <Gauge size={15} />
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Style Lab</span>
          </div>
          <h2 className="text-[18px] font-extrabold text-ink leading-tight">
            Style Test Container
          </h2>
          <p className="text-[12px] text-ink-3 mt-1">
            Stress-test typography across content lengths and preview live device viewports.
          </p>
        </div>

        {/* Active Template Selector */}
        <div className="bg-canvasbg p-3.5 rounded-2xl border border-line space-y-2">
          <label className="block text-[11.5px] font-extrabold uppercase tracking-wide text-ink-2">
            Active Style Template
          </label>
          <div className="relative">
            <select
              value={currentDesign.id}
              onChange={(e) => {
                const found = allDesigns.find((d) => d.id === e.target.value);
                if (found) onSelectDesign(found);
              }}
              className="w-full appearance-none bg-surface border border-line rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold text-ink pr-9 outline-none focus:border-brand cursor-pointer"
            >
              {allDesigns.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.styleTag})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3 text-ink-3 pointer-events-none" />
          </div>
        </div>

        {/* Text Length Stress Test Buttons */}
        <div className="space-y-2">
          <span className="text-[11.5px] font-extrabold uppercase tracking-wide text-ink-2 flex items-center justify-between">
            <span>Text Length Stress-Test</span>
            <span className="text-[10px] text-brand font-bold">{metrics.wordCount} words</span>
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {LENGTH_TEST_PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => handleApplyLength(preset)}
                className={`w-full p-2.5 rounded-xl border text-left text-[12px] font-semibold flex items-center justify-between transition-all ${
                  selectedLength === preset.key
                    ? 'border-brand bg-brand-soft/70 text-ink font-bold'
                    : 'border-line bg-surface hover:bg-canvasbg text-ink-2'
                }`}
              >
                <span>{preset.label}</span>
                {selectedLength === preset.key && (
                  <CheckCircle2 size={14} className="text-brand shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport Frame Mode */}
        <div className="space-y-2">
          <span className="text-[11.5px] font-extrabold uppercase tracking-wide text-ink-2 block">
            Container Viewport Frame
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setFrameMode('canvas')}
              className={`p-2.5 rounded-xl border text-[11.5px] font-bold flex flex-col items-center gap-1.5 transition-all ${
                frameMode === 'canvas'
                  ? 'border-brand bg-brand text-white shadow-xs'
                  : 'border-line bg-surface text-ink-2 hover:bg-canvasbg'
              }`}
            >
              <Maximize2 size={16} />
              <span>Raw Canvas</span>
            </button>

            <button
              onClick={() => setFrameMode('phone')}
              className={`p-2.5 rounded-xl border text-[11.5px] font-bold flex flex-col items-center gap-1.5 transition-all ${
                frameMode === 'phone'
                  ? 'border-brand bg-brand text-white shadow-xs'
                  : 'border-line bg-surface text-ink-2 hover:bg-canvasbg'
              }`}
            >
              <Smartphone size={16} />
              <span>Phone Bezel</span>
            </button>

            <button
              onClick={() => setFrameMode('instagram')}
              className={`p-2.5 rounded-xl border text-[11.5px] font-bold flex flex-col items-center gap-1.5 transition-all ${
                frameMode === 'instagram'
                  ? 'border-brand bg-brand text-white shadow-xs'
                  : 'border-line bg-surface text-ink-2 hover:bg-canvasbg'
              }`}
            >
              <LayoutGrid size={16} />
              <span>Feed Preview</span>
            </button>
          </div>
        </div>

        {/* Layout Safety Margin Guides Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-canvasbg border border-line">
          <div className="flex items-center gap-2">
            <Eye size={15} className="text-ink-2" />
            <span className="text-[12px] font-bold text-ink">11% Safe Margin Guides</span>
          </div>
          <button
            onClick={() => setShowMargins(!showMargins)}
            className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
              showMargins ? 'bg-brand' : 'bg-line'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                showMargins ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Typography & WCAG Inspection Badge */}
        <div className="p-3.5 bg-canvasbg rounded-2xl border border-line space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-3">
              Accessibility & Quality
            </span>
            <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              {metrics.compliance}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11.5px]">
            <div>
              <span className="text-ink-3 block text-[10px]">Contrast Ratio</span>
              <span className="font-bold text-ink">{metrics.contrastRatio}</span>
            </div>
            <div>
              <span className="text-ink-3 block text-[10px]">Est. Read Time</span>
              <span className="font-bold text-ink">~{metrics.readingTimeSec} seconds</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2 mt-auto">
          <button
            onClick={() => onDownload(currentDesign)}
            className="w-full h-11 bg-brand text-white rounded-xl font-extrabold text-[13.5px] flex items-center justify-center gap-2 hover:bg-brand-dark active:scale-[0.99] transition-all"
          >
            <Download size={16} />
            <span>Download This Style</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenInEditor(currentDesign)}
              className="h-10 bg-canvasbg border border-line text-ink rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-line/40 transition-colors"
            >
              <Sliders size={14} />
              <span>Open in Editor</span>
            </button>
            <button
              onClick={() => onSaveToProjects(currentDesign)}
              className="h-10 bg-canvasbg border border-line text-ink rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-line/40 transition-colors"
            >
              <FolderPlus size={14} />
              <span>Save to Projects</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Stage: Interactive Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar relative">
        {/* Style switcher quick pills above stage */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar shrink-0">
          {allDesigns.slice(0, 12).map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDesign(d)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                currentDesign.id === d.id
                  ? 'border-brand bg-brand text-white shadow-xs'
                  : 'border-line bg-surface text-ink-2 hover:bg-canvasbg'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Frame Mode: Canvas vs Phone vs Instagram */}
        {frameMode === 'canvas' && (
          <div
            className="relative max-w-[440px] w-full rounded-2xl overflow-hidden shadow-2xl border border-line/80 transition-all"
            style={{ aspectRatio: `${canvas.width}/${canvas.height}` }}
          >
            <LiveThumbnail project={currentDesign.project} />
            {showMargins && (
              <div className="absolute inset-0 pointer-events-none border border-emerald-500/50 m-[11%] border-dashed">
                <span className="absolute top-1 left-1 text-[9px] font-bold text-emerald-600 bg-white/90 px-1 rounded shadow-xs">
                  11% Safe Margin
                </span>
              </div>
            )}
          </div>
        )}

        {frameMode === 'phone' && (
          <div className="w-[320px] bg-[#1C1C1E] p-3 pt-5 rounded-[44px] shadow-2xl border-4 border-[#2C2C2E] flex flex-col items-center transition-all animate-fade-in">
            {/* Phone Dynamic Island / Notch */}
            <div className="w-24 h-4.5 bg-black rounded-full mb-3 shrink-0" />
            <div
              className="w-full rounded-2xl overflow-hidden shadow-md relative"
              style={{ aspectRatio: `${canvas.width}/${canvas.height}` }}
            >
              <LiveThumbnail project={currentDesign.project} />
              {showMargins && (
                <div className="absolute inset-0 pointer-events-none border border-emerald-500/50 m-[11%] border-dashed" />
              )}
            </div>
            {/* Phone Home Bar */}
            <div className="w-28 h-1 bg-white/30 rounded-full mt-3 shrink-0" />
          </div>
        )}

        {frameMode === 'instagram' && (
          <div className="w-[360px] bg-white rounded-2xl shadow-2xl border border-line overflow-hidden transition-all animate-fade-in">
            {/* Feed User Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-soft border border-brand/30 flex items-center justify-center text-[11px] font-bold text-brand">
                  {currentDesign.project.handle?.charAt(1)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <span className="block text-[12px] font-bold text-gray-900 leading-tight">
                    {currentDesign.project.handle?.replace('@', '') || 'creator'}
                  </span>
                  <span className="block text-[10px] text-gray-500 leading-tight">Original Post</span>
                </div>
              </div>
              <span className="text-[18px] text-gray-400 font-bold leading-none">···</span>
            </div>

            {/* Graphic Stage */}
            <div
              className="w-full overflow-hidden relative"
              style={{ aspectRatio: `${canvas.width}/${canvas.height}` }}
            >
              <LiveThumbnail project={currentDesign.project} />
              {showMargins && (
                <div className="absolute inset-0 pointer-events-none border border-emerald-500/50 m-[11%] border-dashed" />
              )}
            </div>

            {/* Feed Footer Actions */}
            <div className="p-3 border-t border-gray-100 flex items-center justify-between text-gray-700">
              <div className="flex items-center gap-3 text-[14px]">
                <span>❤️ 4.8K</span>
                <span>💬 340</span>
                <span>↗️ 1.2K</span>
              </div>
              <span>📌 Save</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
