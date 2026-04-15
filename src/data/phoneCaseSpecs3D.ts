/**
 * Declarative 3D specs for phone case camera modules.
 *
 * Coordinate convention (all values are FRACTIONS, not pixels):
 *   x / cx   — fraction of caseW from left edge   (0 = left,  1 = right)
 *   y / cy   — fraction of caseH from top  edge   (0 = top,   1 = bottom)
 *   width    — fraction of caseW
 *   height   — fraction of caseH
 *   r        — lens radius as fraction of caseW
 *
 * THREE world conversion (origin = centre of case):
 *   worldX = (fracX - 0.5) * caseW
 *   worldY = (0.5 - fracY) * caseH   ← Y is flipped
 *   worldR = fracR * caseW
 */

// ─── Camera module shapes ──────────────────────────────────────────────────────
export type CameraShape =
  | 'square-island'      // Apple iPhone — rounded square raised platform
  | 'horizontal-bar'     // Google Pixel — wide pill spanning near full width
  | 'column'             // Samsung — NO island; individual floating lens circles
  | 'circular-island'    // OnePlus Hasselblad — large circle housing lenses
  | 'square-with-glyphs' // Nothing Phone — square island + LED glyph lines

// ─── Lens descriptor ──────────────────────────────────────────────────────────
export interface LensSpec {
  /** Centre x as fraction of caseW from left (0–1) */
  x: number;
  /** Centre y as fraction of caseH from top  (0–1) */
  y: number;
  /** Radius as fraction of caseW */
  r: number;
}

// ─── LED glyph line (Nothing Phone) ──────────────────────────────────────────
export interface GlyphLine {
  x1: number; y1: number; // start (fractions of case W, H)
  x2: number; y2: number; // end
  /** Line half-width as fraction of caseW */
  w: number;
}

// ─── Camera module spec ───────────────────────────────────────────────────────
export interface CameraModuleSpec {
  shape: CameraShape;
  /** Bounding-box centre as fractions of caseW/caseH from top-left */
  cx: number;
  cy: number;
  /** Module dimensions as fractions of caseW / caseH */
  width: number;
  height: number;
  lenses: LensSpec[];
}

// ─── Full per-model 3D spec ───────────────────────────────────────────────────
export interface PhoneCaseSpec3D {
  camera: CameraModuleSpec;
  glyphs?: GlyphLine[];
}

// ─── Per-model specs ──────────────────────────────────────────────────────────
export const PHONE_CASE_SPECS: Record<string, PhoneCaseSpec3D> = {

  // ── Apple ─────────────────────────────────────────────────────────────────

  'iphone-15': {
    camera: {
      shape: 'square-island',
      cx: 0.275, cy: 0.115,
      width: 0.42, height: 0.215,
      lenses: [
        { x: 0.182, y: 0.080, r: 0.075 }, // wide
        { x: 0.372, y: 0.150, r: 0.068 }, // ultrawide
      ],
    },
  },

  'iphone-15-pro': {
    camera: {
      shape: 'square-island',
      cx: 0.285, cy: 0.125,
      width: 0.45, height: 0.255,
      lenses: [
        { x: 0.175, y: 0.074, r: 0.073 }, // wide
        { x: 0.38,  y: 0.074, r: 0.065 }, // telephoto
        { x: 0.175, y: 0.175, r: 0.065 }, // ultrawide
        // LIDAR dot (smaller, bottom-right of island)
        { x: 0.38,  y: 0.175, r: 0.030 },
      ],
    },
  },

  'iphone-14': {
    camera: {
      shape: 'square-island',
      cx: 0.275, cy: 0.115,
      width: 0.42, height: 0.215,
      lenses: [
        { x: 0.182, y: 0.080, r: 0.075 },
        { x: 0.372, y: 0.150, r: 0.068 },
      ],
    },
  },

  // ── Samsung ───────────────────────────────────────────────────────────────
  // Samsung uses individual floating circles — NO island box.
  // The 'column' shape renders only the lens rings, no platform.

  'samsung-s24': {
    camera: {
      shape: 'column',
      cx: 0.50, cy: 0.145,    // bounding box centre (not rendered)
      width: 0.20, height: 0.25,
      lenses: [
        { x: 0.50, y: 0.062, r: 0.080 }, // main 50MP
        { x: 0.50, y: 0.146, r: 0.072 }, // ultrawide 12MP
        { x: 0.50, y: 0.220, r: 0.063 }, // telephoto 10MP
      ],
    },
  },

  'samsung-s24-ultra': {
    camera: {
      shape: 'column',
      cx: 0.50, cy: 0.175,
      width: 0.20, height: 0.30,
      lenses: [
        { x: 0.50, y: 0.055, r: 0.080 }, // main 200MP
        { x: 0.50, y: 0.126, r: 0.071 }, // ultrawide
        { x: 0.50, y: 0.193, r: 0.064 }, // telephoto 3×
        { x: 0.50, y: 0.255, r: 0.057 }, // telephoto 5×
      ],
    },
  },

  'samsung-s23': {
    camera: {
      shape: 'column',
      cx: 0.50, cy: 0.135,
      width: 0.20, height: 0.24,
      lenses: [
        { x: 0.50, y: 0.060, r: 0.080 },
        { x: 0.50, y: 0.138, r: 0.072 },
        { x: 0.50, y: 0.208, r: 0.063 },
      ],
    },
  },

  // ── Google Pixel ──────────────────────────────────────────────────────────
  // Wide horizontal pill bar spanning ~84% of case width.

  'pixel-8': {
    camera: {
      shape: 'horizontal-bar',
      cx: 0.50, cy: 0.09,
      width: 0.84, height: 0.107,
      lenses: [
        { x: 0.255, y: 0.090, r: 0.070 }, // main 50MP
        { x: 0.455, y: 0.090, r: 0.064 }, // ultrawide 12MP
      ],
    },
  },

  'pixel-8-pro': {
    camera: {
      shape: 'horizontal-bar',
      cx: 0.50, cy: 0.09,
      width: 0.84, height: 0.107,
      lenses: [
        { x: 0.230, y: 0.090, r: 0.070 }, // main 50MP
        { x: 0.420, y: 0.090, r: 0.064 }, // ultrawide 48MP
        { x: 0.615, y: 0.090, r: 0.058 }, // telephoto 48MP
      ],
    },
  },

  // ── OnePlus ───────────────────────────────────────────────────────────────
  // Hasselblad large circular island.

  'oneplus-12': {
    camera: {
      shape: 'circular-island',
      cx: 0.255, cy: 0.175,
      width: 0.43, height: 0.43, // square bbox → circle = width/2 radius
      lenses: [
        { x: 0.165, y: 0.105, r: 0.082 }, // main 50MP
        { x: 0.345, y: 0.105, r: 0.070 }, // ultrawide 48MP
        { x: 0.165, y: 0.240, r: 0.062 }, // telephoto 64MP
      ],
    },
  },

  // ── Nothing Phone ─────────────────────────────────────────────────────────
  // Square island + signature LED Glyph lines on the transparent back.

  'nothing-phone-2': {
    camera: {
      shape: 'square-with-glyphs',
      cx: 0.265, cy: 0.108,
      width: 0.41, height: 0.185,
      lenses: [
        { x: 0.175, y: 0.082, r: 0.072 }, // main 50MP
        { x: 0.355, y: 0.082, r: 0.068 }, // ultrawide 50MP
      ],
    },
    // LED Glyph strips (simplified — visible as thin raised lines)
    glyphs: [
      // Vertical strip, right side
      { x1: 0.820, y1: 0.18, x2: 0.820, y2: 0.60, w: 0.012 },
      // Short top-right arc/bar near camera
      { x1: 0.570, y1: 0.038, x2: 0.900, y2: 0.038, w: 0.010 },
      // Small diagonal strip
      { x1: 0.820, y1: 0.60, x2: 0.820, y2: 0.72, w: 0.009 },
    ],
  },
};

export const DEFAULT_SPEC: PhoneCaseSpec3D = {
  camera: {
    shape: 'square-island',
    cx: 0.275, cy: 0.115,
    width: 0.42, height: 0.215,
    lenses: [
      { x: 0.182, y: 0.080, r: 0.075 },
      { x: 0.372, y: 0.150, r: 0.068 },
    ],
  },
};
