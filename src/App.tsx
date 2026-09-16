import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { CANVAS_SIZES, CanvasSize, Project } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { SizeScreen } from './screens/SizeScreen';
import { TemplateScreen } from './screens/TemplateScreen';
import { EditorScreen } from './screens/EditorScreen';
import { PreviewScreen } from './screens/PreviewScreen';
import { DesignsScreen } from './screens/DesignsScreen';
import { ProfileSheet } from './editor/QuickEdit';
import { TEMPLATES, getTemplate, blankDesign } from './utils/templates';

type Screen = 'home' | 'size' | 'template' | 'editor' | 'preview' | 'designs';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [canvas, setCanvas] = useState<CanvasSize>(CANVAS_SIZES[0]);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentId = useStore((s) => s.currentId);
  const project = useStore((s) => s.projects.find((p) => p.id === s.currentId));
  const create = useStore((s) => s.create);
  const close = useStore((s) => s.close);

  useEffect(() => {
    if (currentId && (screen === 'home' || screen === 'designs')) setScreen('editor');
  }, [currentId]);

  const start = (templateId: string) => {
    const d = templateId === 'blank' ? blankDesign(canvas) : getTemplate(templateId)?.build(canvas);
    if (!d) return;
    create({
      templateId, canvas, background: d.background, elements: d.elements,
      name: templateId === 'blank' ? 'Blank design' : TEMPLATES.find((t) => t.id === templateId)!.name,
    });
    setScreen('editor');
  };

  return (
    <div className="h-[100dvh] w-full max-w-[520px] mx-auto bg-canvasbg overflow-hidden">
      {screen === 'home' && (
        <HomeScreen
          onCreate={() => setScreen('size')}
          onDesigns={() => setScreen('designs')}
          onProfile={() => setProfileOpen(true)}
        />
      )}
      {screen === 'size' && <SizeScreen onBack={() => setScreen('home')} onPick={(s) => { setCanvas(s); setScreen('template'); }} />}
      {screen === 'template' && <TemplateScreen canvas={canvas} onBack={() => setScreen('size')} onPick={start} />}
      {screen === 'editor' && <EditorScreen onBack={() => { close(); setScreen('home'); }} onPreview={() => setScreen('preview')} />}
      {screen === 'preview' && <PreviewScreen onBack={() => setScreen('editor')} />}
      {screen === 'designs' && <DesignsScreen onBack={() => setScreen('home')} />}

      {profileOpen && (
        <ProfileSheet
          project={project || placeholderProject(canvas)}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}

/** Lets the handle be set from Home before any design exists. */
function placeholderProject(canvas: CanvasSize): Project {
  const s = useStore.getState();
  return {
    id: 'draft', name: 'draft', templateId: 'blank', canvas,
    background: { kind: 'solid', color: '#fff', image: { src: null, zoom: 1, offsetX: 0, offsetY: 0 }, adjust: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, overlayColor: '#000', overlayOpacity: 0 } },
    elements: [], profileMode: s.savedProfileMode, handle: s.savedHandle || '@yourhandle', avatar: s.savedAvatar,
    createdAt: 0, updatedAt: 0,
  };
}
