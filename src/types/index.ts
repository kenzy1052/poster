// ---------------------------------------------------------------------------
// Core model. Every template is a list of these elements — never a flat image.
// ---------------------------------------------------------------------------

export type CanvasKey = 'square' | 'portrait';

export interface CanvasSize {
  key: CanvasKey;
  label: string;
  note: string;
  width: number;
  height: number;
}

/** 1:1 = 1080×1080. Portrait = 4in × 4.8in at 270ppi = 1080×1296. */
export const CANVAS_SIZES: CanvasSize[] = [
  { key: 'square', label: 'Square', note: '1:1 · 1080 × 1080', width: 1080, height: 1080 },
  { key: 'portrait', label: 'Portrait', note: '4 × 4.8 in · 1080 × 1296', width: 1080, height: 1296 },
];

export type ElementType = 'text' | 'image' | 'shape' | 'decor';

/**
 * Semantic role. Drives the Quick Edit menu, profile modes, and friendly
 * labels — the user never sees "element 3", they see "Headline".
 */
export type ElementRole =
  | 'headline'
  | 'subhead'
  | 'body'
  | 'kicker'
  | 'caption'
  | 'cta'
  | 'handle'
  | 'profile-picture'
  | 'photo'
  | 'decor'
  | 'panel';

export interface ShadowStyle {
  enabled: boolean;
  color: string;
  opacity: number;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export const noShadow = (): ShadowStyle => ({
  enabled: false, color: '#000000', opacity: 0.25, blur: 24, offsetX: 0, offsetY: 10,
});

export interface ImageAdjust {
  blur: number;
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  overlayColor: string;
  overlayOpacity: number;
}

export const defaultAdjust = (): ImageAdjust => ({
  blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0,
  overlayColor: '#000000', overlayOpacity: 0,
});

export interface BaseElement {
  id: string;
  type: ElementType;
  role: ElementRole;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
  hidden: boolean;
  locked: boolean;
  opacity: number;
  shadow: ShadowStyle;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  vAlign: 'top' | 'middle' | 'bottom';
  color: string;
  lineHeight: number;
  letterSpacing: number;
  uppercase: boolean;
  autoFit: boolean;
  /** Optional highlight block behind the text (the marker-pen look). */
  highlight?: { color: string; padX: number; padY: number; radius: number };
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string | null;
  /** Shown inside the empty placeholder so the slot reads as intentional. */
  placeholder: 'photo' | 'avatar' | 'product' | 'phone';
  fit: 'cover' | 'contain';
  zoom: number;
  offsetX: number;
  offsetY: number;
  radius: number;
  circle: boolean;
  ring: { width: number; color: string };
  adjust: ImageAdjust;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: 'rect' | 'circle' | 'pill' | 'line';
  fill: string;
  fillOpacity: number;
  radius: number;
  strokeColor: string;
  strokeWidth: number;
}

/** Preset vector ornaments — the blobs, curves and quote marks in the refs. */
export type DecorKind =
  | 'blob'
  | 'quote-open'
  | 'quote-close'
  | 'quote-slab'
  | 'squiggle'
  | 'dashed-curve'
  | 'arrow-right'
  | 'arrow-circle'
  | 'grid'
  | 'stripes'
  | 'ring'
  | 'ring-quarter'
  | 'badge-round-text'
  | 'bell'
  | 'heart-bubble'
  | 'pause-dot'
  | 'comment-dot'
  | 'corner-frame'
  | 'underline-swash'
  | 'pointing-hand'
  | 'hanging-sign';

export interface DecorElement extends BaseElement {
  type: 'decor';
  kind: DecorKind;
  color: string;
  color2: string;
  strokeWidth: number;
  label?: string;
}

export type DesignElement = TextElement | ImageElement | ShapeElement | DecorElement;

export type BackgroundKind = 'solid' | 'image';

export interface Background {
  kind: BackgroundKind;
  color: string;
  image: { src: string | null; zoom: number; offsetX: number; offsetY: number };
  adjust: ImageAdjust;
}

export const solidBg = (color: string): Background => ({
  kind: 'solid',
  color,
  image: { src: null, zoom: 1, offsetX: 0, offsetY: 0 },
  adjust: defaultAdjust(),
});

/** How the creator's identity shows up on the artwork. */
export type ProfileMode = 'picture-and-handle' | 'handle-only' | 'none';

export interface Project {
  id: string;
  name: string;
  templateId: string;
  canvas: CanvasSize;
  background: Background;
  elements: DesignElement[];
  profileMode: ProfileMode;
  handle: string;
  avatar: string | null;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface Template {
  id: string;
  name: string;
  tag: string;
  build: (canvas: CanvasSize) => {
    background: Background;
    elements: DesignElement[];
    /** Where the handle/avatar live in this particular layout. */
    profile: { x: number; y: number; align: 'left' | 'center' | 'right'; onDark: boolean };
  };
}
