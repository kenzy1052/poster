import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { Background, CanvasSize, CustomTemplate, DesignElement, Project, ProfileMode } from '../types';

type Snapshot = { background: Background; elements: DesignElement[] };

interface State {
  projects: Project[];
  customTemplates: CustomTemplate[];
  currentId: string | null;
  selectedId: string | null;
  /** Saved once, reused on every new design. */
  savedHandle: string;
  savedAvatar: string | null;
  savedProfileMode: ProfileMode;
  theme: 'light' | 'dark' | 'system';
  past: Snapshot[];
  future: Snapshot[];

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  create: (o: { templateId: string; canvas: CanvasSize; background: Background; elements: DesignElement[]; name: string }) => string;
  open: (id: string) => void;
  close: () => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  setThumb: (id: string, url: string) => void;

  saveCustomTemplate: (name: string, tag?: string) => string | null;
  deleteCustomTemplate: (id: string) => void;

  current: () => Project | undefined;
  snapshot: () => void;
  undo: () => void;
  redo: () => void;

  select: (id: string | null) => void;
  update: (id: string, patch: Partial<DesignElement>) => void;
  add: (el: DesignElement) => void;
  del: (id: string) => void;
  duplicate: (id: string) => void;
  reorder: (id: string, dir: 'front' | 'back' | 'up' | 'down') => void;
  /** Assigns a shared groupId to every id passed in, so they move together. */
  groupElements: (ids: string[]) => void;
  /** Clears groupId from every element that shares this element's group. */
  ungroupElements: (id: string) => void;
  copyElement: (id: string) => void;
  pasteElement: () => void;
  copyStyle: (id: string) => void;
  pasteStyle: (id: string) => void;
  clipboardElement: DesignElement | null;
  clipboardStyle: { type: string; style: any } | null;
  setBackground: (patch: Partial<Background>) => void;
  replaceDesign: (d: Snapshot) => void;

  setProfileMode: (m: ProfileMode) => void;
  setHandle: (h: string) => void;
  setAvatar: (src: string | null) => void;

  setProjectProfileMode: (m: ProfileMode) => void;
  setProjectHandle: (h: string) => void;
  setProjectAvatar: (src: string | null) => void;
}

const patchProjects = (ps: Project[], id: string | null, fn: (p: Project) => Project) =>
  id ? ps.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p)) : ps;

/** Visibility of identity elements follows the chosen profile mode. */
function applyProfile(els: DesignElement[], mode: ProfileMode, handle: string, avatar: string | null): DesignElement[] {
  return els.map((e) => {
    if (e.role === 'profile-picture' && e.type === 'image') {
      return { ...e, src: avatar, hidden: mode !== 'picture-and-handle' };
    }
    if (e.role === 'handle' && e.type === 'text') {
      return { ...e, text: handle || '@yourhandle', hidden: mode === 'none' };
    }
    return e;
  });
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      projects: [],
      customTemplates: [],
      currentId: null,
      selectedId: null,
      savedHandle: '',
      savedAvatar: null,
      savedProfileMode: 'handle-only',
      theme: 'light',
      past: [],
      future: [],
      clipboardElement: null,
      clipboardStyle: null,

      setTheme: (theme) => set({ theme }),

      saveCustomTemplate: (name: string, tag = 'Custom') => {
        const p = get().current();
        if (!p) return null;
        const newTemplate: CustomTemplate = {
          id: `custom-${uuid()}`,
          name: name.trim() || 'Custom Template',
          tag: tag.trim() || 'Custom',
          canvas: p.canvas,
          background: JSON.parse(JSON.stringify(p.background)),
          elements: JSON.parse(JSON.stringify(p.elements)),
          createdAt: Date.now(),
          thumbnail: p.thumbnail,
        };
        set((s) => ({ customTemplates: [newTemplate, ...s.customTemplates] }));
        return newTemplate.id;
      },

      deleteCustomTemplate: (id: string) => {
        set((s) => ({ customTemplates: s.customTemplates.filter((t) => t.id !== id) }));
      },

      create: ({ templateId, canvas, background, elements, name }) => {
        const id = uuid();
        const { savedHandle, savedAvatar, savedProfileMode } = get();
        const p: Project = {
          id, name, templateId, canvas, background,
          elements: applyProfile(elements, savedProfileMode, savedHandle, savedAvatar),
          profileMode: savedProfileMode,
          handle: savedHandle || '@yourhandle',
          avatar: savedAvatar,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        set((s) => ({ projects: [...s.projects, p], currentId: id, selectedId: null, past: [], future: [] }));
        return id;
      },

      open: (id) => set({ currentId: id, selectedId: null, past: [], future: [] }),
      close: () => set({ currentId: null, selectedId: null, past: [], future: [] }),
      remove: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id), currentId: s.currentId === id ? null : s.currentId })),
      rename: (id, name) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)) })),
      setThumb: (id, url) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, thumbnail: url } : p)) })),

      current: () => get().projects.find((p) => p.id === get().currentId),

      snapshot: () => {
        const p = get().current();
        if (!p) return;
        set((s) => ({ past: [...s.past, { background: p.background, elements: p.elements }].slice(-80), future: [] }));
      },

      undo: () => {
        const s = get(); const p = s.current();
        if (!p || !s.past.length) return;
        const prev = s.past[s.past.length - 1];
        set({
          projects: patchProjects(s.projects, s.currentId, (x) => ({ ...x, ...prev })),
          past: s.past.slice(0, -1),
          future: [{ background: p.background, elements: p.elements }, ...s.future],
          selectedId: null,
        });
      },

      redo: () => {
        const s = get(); const p = s.current();
        if (!p || !s.future.length) return;
        const next = s.future[0];
        set({
          projects: patchProjects(s.projects, s.currentId, (x) => ({ ...x, ...next })),
          past: [...s.past, { background: p.background, elements: p.elements }],
          future: s.future.slice(1),
          selectedId: null,
        });
      },

      select: (id) => set({ selectedId: id }),

      update: (id, patch) =>
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({
            ...p, elements: p.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as DesignElement) : e)),
          })),
        })),

      add: (el) => {
        get().snapshot();
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({ ...p, elements: [...p.elements, el] })),
          selectedId: el.id,
        }));
      },

      del: (id) => {
        get().snapshot();
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) })),
          selectedId: null,
        }));
      },

      duplicate: (id) => {
        get().snapshot();
        set((s) => {
          const p = s.current(); if (!p) return s;
          const src = p.elements.find((e) => e.id === id); if (!src) return s;
          const maxZ = Math.max(...p.elements.map((e) => e.z), 0);
          const copy = { ...src, id: uuid(), x: src.x + 24, y: src.y + 24, z: maxZ + 1 } as DesignElement;
          return {
            projects: patchProjects(s.projects, s.currentId, (x) => ({ ...x, elements: [...x.elements, copy] })),
            selectedId: copy.id,
          };
        });
      },

      reorder: (id, dir) => {
        get().snapshot();
        set((s) => {
          const p = s.current(); if (!p) return s;
          const els = [...p.elements].sort((a, b) => a.z - b.z);
          const i = els.findIndex((e) => e.id === id); if (i < 0) return s;
          if (dir === 'up' && i < els.length - 1) { const t = els[i].z; els[i] = { ...els[i], z: els[i + 1].z }; els[i + 1] = { ...els[i + 1], z: t }; }
          else if (dir === 'down' && i > 0) { const t = els[i].z; els[i] = { ...els[i], z: els[i - 1].z }; els[i - 1] = { ...els[i - 1], z: t }; }
          else if (dir === 'front') els[i] = { ...els[i], z: Math.max(...els.map((e) => e.z)) + 1 };
          else if (dir === 'back') els[i] = { ...els[i], z: Math.min(...els.map((e) => e.z)) - 1 };
          return { projects: patchProjects(s.projects, s.currentId, (x) => ({ ...x, elements: els })) };
        });
      },

      setBackground: (patch) =>
        set((s) => ({ projects: patchProjects(s.projects, s.currentId, (p) => ({ ...p, background: { ...p.background, ...patch } })) })),

      groupElements: (ids) => {
        if (ids.length < 2) return;
        get().snapshot();
        const gid = uuid();
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({
            ...p, elements: p.elements.map((e) => (ids.includes(e.id) ? { ...e, groupId: gid } : e)),
          })),
        }));
      },

      ungroupElements: (id) => {
        get().snapshot();
        set((s) => {
          const p = s.current(); if (!p) return s;
          const target = p.elements.find((e) => e.id === id);
          const gid = target?.groupId;
          if (!gid) return s;
          return {
            projects: patchProjects(s.projects, s.currentId, (x) => ({
              ...x, elements: x.elements.map((e) => (e.groupId === gid ? { ...e, groupId: undefined } : e)),
            })),
          };
        });
      },

      copyElement: (id) => {
        const p = get().current(); if (!p) return;
        const el = p.elements.find((e) => e.id === id); if (!el) return;
        set({ clipboardElement: JSON.parse(JSON.stringify(el)) });
      },

      pasteElement: () => {
        const ce = get().clipboardElement; if (!ce) return;
        get().snapshot();
        set((s) => {
          const p = s.current(); if (!p) return s;
          const maxZ = Math.max(...p.elements.map((e) => e.z), 0);
          const copy = { ...ce, id: uuid(), x: ce.x + 24, y: ce.y + 24, z: maxZ + 1, groupId: undefined } as DesignElement;
          return {
            projects: patchProjects(s.projects, s.currentId, (x) => ({ ...x, elements: [...x.elements, copy] })),
            selectedId: copy.id,
          };
        });
      },

      copyStyle: (id) => {
        const p = get().current(); if (!p) return;
        const el = p.elements.find((e) => e.id === id); if (!el) return;
        const { id: _id, type, x, y, width, height, rotation, z, name, role, groupId, hidden, locked, ...rest } = el as any;
        const style = { ...rest };
        if (type === 'text') delete style.text;
        if (type === 'image') delete style.src;
        set({ clipboardStyle: { type, style } });
      },

      pasteStyle: (id) => {
        const cs = get().clipboardStyle; if (!cs) return;
        const p = get().current(); if (!p) return;
        const el = p.elements.find((e) => e.id === id); if (!el || el.type !== cs.type) return;
        get().snapshot();
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (x) => ({
            ...x, elements: x.elements.map((e) => (e.id === id ? ({ ...e, ...cs.style } as DesignElement) : e)),
          })),
        }));
      },

      replaceDesign: (d) => {
        get().snapshot();
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({
            ...p, background: d.background,
            elements: applyProfile(d.elements, p.profileMode, p.handle, p.avatar),
          })),
          selectedId: null,
        }));
      },

      setProfileMode: (mode) =>
        set((s) => ({ savedProfileMode: mode })),
      
      setHandle: (h) =>
        set((s) => ({ savedHandle: h })),

      setAvatar: (src) =>
        set((s) => ({ savedAvatar: src })),

      setProjectProfileMode: (mode) => {
        get().snapshot();
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({
            ...p, profileMode: mode, elements: applyProfile(p.elements, mode, p.handle, p.avatar),
          })),
        }));
      },

      setProjectHandle: (h) =>
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({
            ...p, handle: h, elements: applyProfile(p.elements, p.profileMode, h, p.avatar),
          })),
        })),

      setProjectAvatar: (src) =>
        set((s) => ({
          projects: patchProjects(s.projects, s.currentId, (p) => ({
            ...p, avatar: src, elements: applyProfile(p.elements, p.profileMode, p.handle, src),
          })),
        })),
    }),
    {
      name: 'ig-post-studio',
      partialize: (s) => ({
        projects: s.projects,
        customTemplates: s.customTemplates,
        savedHandle: s.savedHandle,
        savedAvatar: s.savedAvatar,
        savedProfileMode: s.savedProfileMode,
      }),
    }
  )
);
