export interface Template {
  id: string;
  name: string;
  category: 'aesthetic' | 'minimal' | 'quotes';
  thumbnail: string; // color preview
  bgColor: string;
  objects: TemplateObject[];
}

export interface TemplateObject {
  type: 'text' | 'rect' | 'circle' | 'gradient';
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rx?: number;
  opacity?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
  stroke?: string;
  strokeWidth?: number;
  gradient?: {
    type: 'linear' | 'radial';
    colorStops: { offset: number; color: string }[];
    coords?: { x1: number; y1: number; x2: number; y2: number };
  };
}

// Templates are defined as functions so they scale to any canvas size
export type TemplateFactory = (W: number, H: number) => Pick<Template, 'bgColor' | 'objects'>;

export const TEMPLATES: {
  id: string;
  name: string;
  category: Template['category'];
  thumbnail: string;
  preview: string;          // gradient/color for card
  build: TemplateFactory;
}[] = [

  // ── AESTHETIC ──────────────────────────────────────────────────────────────

  {
    id: 'aurora',
    name: 'Aurora',
    category: 'aesthetic',
    thumbnail: '#a78bfa',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    build: (W, H) => ({
      bgColor: '#0d0d1a',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#0d0d1a' },
        { type: 'circle', left: -W * 0.2, top: H * 0.05, width: W * 0.9, height: W * 0.9, fill: '#7c3aed', opacity: 0.45 },
        { type: 'circle', left: W * 0.3, top: H * 0.35, width: W * 0.85, height: W * 0.85, fill: '#db2777', opacity: 0.35 },
        { type: 'circle', left: W * 0.05, top: H * 0.55, width: W * 0.7, height: W * 0.7, fill: '#2563eb', opacity: 0.3 },
        { type: 'text', text: 'ZOOBLE', left: W / 2 - 40, top: H - 80, fontFamily: 'Arial', fontSize: 13, fill: 'rgba(255,255,255,0.18)' },
      ],
    }),
  },

  {
    id: 'sakura',
    name: 'Sakura',
    category: 'aesthetic',
    thumbnail: '#fda4af',
    preview: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)',
    build: (W, H) => ({
      bgColor: '#fff0f4',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#fff0f4' },
        { type: 'circle', left: W * 0.55, top: -H * 0.08, width: W * 0.7, height: W * 0.7, fill: '#fbcfe8', opacity: 0.7 },
        { type: 'circle', left: -W * 0.1, top: H * 0.6, width: W * 0.5, height: W * 0.5, fill: '#f9a8d4', opacity: 0.5 },
        { type: 'text', text: '✿ ✿ ✿', left: W / 2 - 30, top: H / 2 - 20, fontFamily: 'Georgia', fontSize: 28, fill: '#e879a0', opacity: 0.6 },
        { type: 'text', text: '桜', left: W / 2 - 24, top: H * 0.65, fontFamily: 'Georgia', fontSize: 48, fill: '#db2777', opacity: 0.15 },
      ],
    }),
  },

  {
    id: 'midnight',
    name: 'Midnight',
    category: 'aesthetic',
    thumbnail: '#1e1b4b',
    preview: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    build: (W, H) => ({
      bgColor: '#0a0a18',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#0a0a18' },
        { type: 'text', text: '★', left: W * 0.15, top: H * 0.1, fontFamily: 'Arial', fontSize: 10, fill: '#ffffff', opacity: 0.7 },
        { type: 'text', text: '★', left: W * 0.6,  top: H * 0.06, fontFamily: 'Arial', fontSize: 7, fill: '#a5b4fc', opacity: 0.8 },
        { type: 'text', text: '★', left: W * 0.8,  top: H * 0.2, fontFamily: 'Arial', fontSize: 12, fill: '#ffffff', opacity: 0.5 },
        { type: 'text', text: '★', left: W * 0.3,  top: H * 0.3, fontFamily: 'Arial', fontSize: 6, fill: '#c4b5fd', opacity: 0.6 },
        { type: 'text', text: '★', left: W * 0.7,  top: H * 0.45, fontFamily: 'Arial', fontSize: 9, fill: '#ffffff', opacity: 0.4 },
        { type: 'text', text: '★', left: W * 0.2,  top: H * 0.55, fontFamily: 'Arial', fontSize: 11, fill: '#a5b4fc', opacity: 0.5 },
        { type: 'text', text: '★', left: W * 0.5,  top: H * 0.7, fontFamily: 'Arial', fontSize: 8, fill: '#ffffff', opacity: 0.6 },
        { type: 'circle', left: W / 2 - W * 0.35, top: H * 0.75, width: W * 0.7, height: W * 0.7, fill: '#4338ca', opacity: 0.18 },
      ],
    }),
  },

  {
    id: 'forest',
    name: 'Forest',
    category: 'aesthetic',
    thumbnail: '#166534',
    preview: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    build: (W, H) => ({
      bgColor: '#0f1f0f',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#0f1f0f' },
        { type: 'circle', left: -W * 0.2, top: H * 0.6, width: W * 0.8, height: W * 0.8, fill: '#14532d', opacity: 0.7 },
        { type: 'circle', left: W * 0.4,  top: -H * 0.05, width: W * 0.6, height: W * 0.6, fill: '#166534', opacity: 0.5 },
        { type: 'text', text: '🌿', left: W / 2 - 20, top: H / 2 - 20, fontFamily: 'Arial', fontSize: 42, opacity: 0.5 },
      ],
    }),
  },

  // ── MINIMAL ────────────────────────────────────────────────────────────────

  {
    id: 'pure-white',
    name: 'Pure White',
    category: 'minimal',
    thumbnail: '#f8fafc',
    preview: '#f8fafc',
    build: (_W, _H) => ({ bgColor: '#f8fafc', objects: [] }),
  },

  {
    id: 'charcoal',
    name: 'Charcoal',
    category: 'minimal',
    thumbnail: '#1c1c1e',
    preview: '#1c1c1e',
    build: (_W, _H) => ({ bgColor: '#1c1c1e', objects: [] }),
  },

  {
    id: 'linen',
    name: 'Linen',
    category: 'minimal',
    thumbnail: '#faf7f2',
    preview: 'linear-gradient(135deg, #faf7f2 0%, #f5efe6 100%)',
    build: (W, H) => ({
      bgColor: '#faf7f2',
      objects: [
        { type: 'rect', left: W * 0.05, top: H * 0.05, width: W * 0.9, height: H * 0.9, fill: 'transparent', stroke: '#e2d9cc', strokeWidth: 1, rx: 12, opacity: 0.8 },
      ],
    }),
  },

  {
    id: 'grid',
    name: 'Grid',
    category: 'minimal',
    thumbnail: '#f1f5f9',
    preview: 'repeating-linear-gradient(0deg,transparent,transparent 19px,#ddd 19px,#ddd 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,#ddd 19px,#ddd 20px)',
    build: (W, H) => ({
      bgColor: '#f8fafc',
      objects: Array.from({ length: Math.ceil(W / 30) + 1 }, (_, i) => ({
        type: 'rect' as const,
        left: i * 30,
        top: 0,
        width: 1,
        height: H,
        fill: '#cbd5e1',
        opacity: 0.5,
      })).concat(
        Array.from({ length: Math.ceil(H / 30) + 1 }, (_, i) => ({
          type: 'rect' as const,
          left: 0,
          top: i * 30,
          width: W,
          height: 1,
          fill: '#cbd5e1',
          opacity: 0.5,
        }))
      ),
    }),
  },

  {
    id: 'sage',
    name: 'Sage',
    category: 'minimal',
    thumbnail: '#84a98c',
    preview: 'linear-gradient(135deg, #cad2c5 0%, #84a98c 100%)',
    build: (W, H) => ({
      bgColor: '#cad2c5',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#cad2c5' },
        { type: 'rect', left: W * 0.08, top: H * 0.08, width: W * 0.84, height: H * 0.84, fill: 'transparent', stroke: '#84a98c', strokeWidth: 1.5, rx: 8, opacity: 0.6 },
      ],
    }),
  },

  // ── QUOTES ─────────────────────────────────────────────────────────────────

  {
    id: 'good-vibes',
    name: 'Good Vibes',
    category: 'quotes',
    thumbnail: '#fbbf24',
    preview: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    build: (W, H) => ({
      bgColor: '#fffbeb',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#fffbeb' },
        { type: 'text', text: 'GOOD', left: W / 2 - 58, top: H * 0.32, fontFamily: 'Impact', fontSize: 44, fill: '#92400e' },
        { type: 'text', text: 'VIBES', left: W / 2 - 60, top: H * 0.32 + 50, fontFamily: 'Impact', fontSize: 44, fill: '#d97706' },
        { type: 'text', text: 'ONLY ✨', left: W / 2 - 54, top: H * 0.32 + 100, fontFamily: 'Impact', fontSize: 36, fill: '#fbbf24' },
        { type: 'rect', left: W * 0.12, top: H * 0.29, width: W * 0.76, height: 2, fill: '#d97706', opacity: 0.4 },
        { type: 'rect', left: W * 0.12, top: H * 0.32 + 140, width: W * 0.76, height: 2, fill: '#d97706', opacity: 0.4 },
      ],
    }),
  },

  {
    id: 'be-kind',
    name: 'Be Kind',
    category: 'quotes',
    thumbnail: '#ec4899',
    preview: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    build: (W, H) => ({
      bgColor: '#fce7f3',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#fce7f3' },
        { type: 'text', text: '"be kind', left: W / 2 - 64, top: H * 0.28, fontFamily: 'Georgia', fontSize: 30, fill: '#be185d' },
        { type: 'text', text: 'to your', left: W / 2 - 50, top: H * 0.28 + 42, fontFamily: 'Georgia', fontSize: 30, fill: '#db2777' },
        { type: 'text', text: 'mind"', left: W / 2 - 38, top: H * 0.28 + 84, fontFamily: 'Georgia', fontSize: 30, fill: '#be185d' },
        { type: 'text', text: '— anonymous', left: W / 2 - 68, top: H * 0.28 + 128, fontFamily: 'Georgia', fontSize: 14, fill: '#f9a8d4' },
        { type: 'text', text: '♡', left: W / 2 - 12, top: H * 0.65, fontFamily: 'Arial', fontSize: 28, fill: '#f472b6', opacity: 0.5 },
      ],
    }),
  },

  {
    id: 'hustle',
    name: 'Hustle',
    category: 'quotes',
    thumbnail: '#111827',
    preview: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
    build: (W, H) => ({
      bgColor: '#0a0a0a',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#0a0a0a' },
        { type: 'text', text: 'WORK', left: W / 2 - 60, top: H * 0.25, fontFamily: 'Impact', fontSize: 52, fill: '#ffffff' },
        { type: 'text', text: 'HARD', left: W / 2 - 56, top: H * 0.25 + 62, fontFamily: 'Impact', fontSize: 52, fill: '#a3a3a3' },
        { type: 'text', text: 'IN SILENCE', left: W / 2 - 74, top: H * 0.25 + 124, fontFamily: 'Impact', fontSize: 30, fill: '#525252' },
        { type: 'text', text: 'LET SUCCESS', left: W / 2 - 90, top: H * 0.25 + 162, fontFamily: 'Impact', fontSize: 28, fill: '#525252' },
        { type: 'text', text: 'MAKE NOISE', left: W / 2 - 82, top: H * 0.25 + 198, fontFamily: 'Impact', fontSize: 28, fill: '#7c3aed' },
      ],
    }),
  },

  {
    id: 'breathe',
    name: 'Breathe',
    category: 'quotes',
    thumbnail: '#67e8f9',
    preview: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)',
    build: (W, H) => ({
      bgColor: '#ecfeff',
      objects: [
        { type: 'rect', left: 0, top: 0, width: W, height: H, fill: '#ecfeff' },
        { type: 'text', text: 'breathe.', left: W / 2 - 62, top: H / 2 - 24, fontFamily: 'Georgia', fontSize: 36, fill: '#0891b2' },
        { type: 'text', text: 'you got this', left: W / 2 - 72, top: H / 2 + 24, fontFamily: 'Georgia', fontSize: 18, fill: '#67e8f9' },
        { type: 'circle', left: W / 2 - W * 0.38, top: H * 0.08, width: W * 0.76, height: W * 0.76, fill: 'transparent', stroke: '#a5f3fc', strokeWidth: 1.5, opacity: 0.6 },
      ],
    }),
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'aesthetic', label: 'Aesthetic' },
  { id: 'minimal',   label: 'Minimal' },
  { id: 'quotes',    label: 'Quotes' },
] as const;
