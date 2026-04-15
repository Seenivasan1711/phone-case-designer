# Zooble — Custom Phone Case Designer · Progress Tracker

> **Company:** Zooble  
> **Product:** Custom phone case designer + e-commerce ordering  
> **Stack:** Next.js 14 · Fabric.js v5 · Three.js (R3F v8) · Zustand · Tailwind CSS  
> **Last updated:** 2026-04-15

---

## 🔴 Active Decision Log

### DECISION-001 — 3D Case Shape Approach (2026-04-15)
**Problem:** Current `PhoneCase3D.tsx` renders a thick flat slab that looks like a phone body/screen, not a phone case shell.  
**Root cause:** `caseD = 0.18` is too deep; `boxGeometry` has no taper; camera island is a raised bump instead of a cutout hole; material looks like a phone screen.  
**Decision:** Rebuild using `ExtrudeGeometry` (rounded-rectangle cross-section) with:
- Depth `0.07` (thin case shell)
- Visible thin side walls when rotated (the "lip" of a case)
- Camera cutout as a recessed dark oval — not a raised bump
- Back face texture = user's design, entire back surface
- Frame/side color = neutral off-white/grey plastic (not black like a phone body)
- Per-model camera position (Nothing Phone 2: top-left; generic: top-left)
**Status:** ✅ Decided → implementing now  
**File:** `src/components/PhoneCase3D.tsx`

---

## Legend
- ✅ Done & shipped
- 🔄 In progress / partially done
- ❌ Not started
- 🐛 Known bug / issue
- ⚠️ Needs attention

---

## Phase 1 — Foundation (✅ Complete)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Next.js 14 App Router scaffold | ✅ | `src/app/` structure |
| 1.2 | Tailwind CSS + Inter font | ✅ | `globals.css`, `layout.tsx` |
| 1.3 | Phone model data (`src/lib/phoneModels.ts`) | ✅ | 10 models across 5 brands |
| 1.4 | TypeScript types (`src/types/index.ts`) | ✅ | PhoneModel, CartItem, Order, CheckoutForm |
| 1.5 | Zustand cart store with localStorage persist | ✅ | `src/store/cartStore.ts` |
| 1.6 | Navbar with cart badge | ✅ | `src/components/Navbar.tsx` |
| 1.7 | Phone model selector homepage | ✅ | Brand filter + grid |
| 1.8 | Cart page | ✅ | `src/app/cart/page.tsx` |
| 1.9 | Checkout form + order API | ✅ | `src/app/checkout/page.tsx` + `/api/orders` (in-memory) |
| 1.10 | `.gitignore` | ✅ | Covers node_modules, .next, .env*, etc. |
| 1.11 | Security: Next.js upgraded to 14.2.30 | ✅ | Was on 14.2.0 with critical CVE |

---

## Phase 2 — V1 Editor (✅ Complete, kept for reference)

Route: `/design/[model]`  
Component: `src/components/DesignEditor.tsx`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Fabric.js canvas with SSR guard (`next/dynamic`) | ✅ | |
| 2.2 | React 18 Strict Mode double-init fix | ✅ | Guard: `if (fabricRef.current) return` |
| 2.3 | Image upload (react-dropzone) | ✅ | |
| 2.4 | Text tool with bold/italic | ✅ | |
| 2.5 | Sticker tool (emoji) | ✅ | |
| 2.6 | Background color presets + custom picker | ✅ | |
| 2.7 | Undo / Redo (JSON snapshot history) | ✅ | |
| 2.8 | Object lock / duplicate / layer order | ✅ | |
| 2.9 | Phone frame system (PNG + SVG fallback + gloss overlay) | ✅ | `src/components/PhoneFrame.tsx` |
| 2.10 | SVG frames: iPhone, Samsung, Nothing Phone 2, Pixel, OnePlus | ✅ | |
| 2.11 | PNG frame support (drop in `/public/frames/{model-id}.png`) | ✅ | Nothing Phone 2 PNG added |
| 2.12 | Multilingual fonts (8 language groups) | ✅ | Lazy Google Fonts loading |
| 2.13 | Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Arabic | ✅ | |
| 2.14 | Clean export (no canvas artifacts, selection cleared) | ✅ | |
| 2.15 | Download PNG at ~300 DPI (`multiplier: 4`) | ✅ | |
| 2.16 | Add to cart with design thumbnail | ✅ | |
| 2.17 | Dark bottom toolbar | ✅ | |
| 2.18 | Two-column desktop layout (dark phone stage left, controls right) | ✅ | |

---

## Phase 3 — V2 Editor (🔄 Active development)

Route: `/design-v2/[model]`  
Main entry: `src/app/design-v2/[model]/page.tsx`  
Layout override: `src/app/design-v2/layout.tsx` (bare — no global Navbar)  
Component: `src/components/DesignEditorV2.tsx`  
3D viewer: `src/components/PhoneCase3D.tsx`  
Templates: `src/data/templates.ts`

### 3.1 Core layout
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1.1 | Full-screen fixed layout (covers viewport) | ✅ | `fixed inset-0 z-[100]` |
| 3.1.2 | Top bar: logo, model name, 2D/3D toggle, Export PNG, Add to Cart | ✅ | |
| 3.1.3 | Zooble branding (gradient Z logo + wordmark) | ✅ | |
| 3.1.4 | Left icon strip (68px) with active indicator | ✅ | Edit / Templates / Text / Sticker / Save tabs |
| 3.1.5 | Left panel (300px) with tab content | ✅ | |
| 3.1.6 | Canvas stage (dot-grid gray background) | ✅ | |
| 3.1.7 | Right mini toolbar (Select, Pan, Undo, Redo) | ✅ | |
| 3.1.8 | Bottom zoom bar (−, %, +) with click-to-reset | ✅ | |
| 3.1.9 | Floating context toolbar above phone on selection | ✅ | Front/Back/Lock/Copy/Delete |

### 3.2 Canvas functionality
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.2.1 | Fabric.js canvas (same guards as V1) | ✅ | |
| 3.2.2 | Pan tool (hand cursor + relativePan) | ✅ | toolRef avoids stale closure |
| 3.2.3 | Scroll-wheel zoom (gentle 1.05× step) | ✅ | Fixed from 1.1× (was too aggressive) |
| 3.2.4 | Zoom buttons with canvas-center zoomToPoint | ✅ | |
| 3.2.5 | Objects placed at visible center (zoom/pan aware) | ✅ | `getVisibleCenter()` helper |
| 3.2.6 | Image upload resets zoom to 100% | ✅ | |
| 3.2.7 | Undo/Redo with all 3 events properly unbound | ✅ | Fixed cascading delete bug |
| 3.2.8 | Drag-anywhere drop zone with violet overlay | ✅ | |

### 3.3 Panel content
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.3.1 | Edit tab: Pacdora-style upload zone | ✅ | Stacked image icons, Upload button |
| 3.3.2 | Finish/Material selector (4 types, affects 3D render) | ✅ | Plastic Matt / Glossy / Silicone / Leather |
| 3.3.3 | Background quick-pick swatches | ✅ | |
| 3.3.4 | Templates tab: 12 templates, 3 categories | ✅ | Aesthetic, Minimal, Quotes |
| 3.3.5 | Template category filter pills | ✅ | |
| 3.3.6 | Text tab: multilingual font picker (8 languages) | ✅ | Same as V1 |
| 3.3.7 | Sticker tab: 20 emoji grid | ✅ | |
| 3.3.8 | Save tab: browser save + JSON export + JSON import | ✅ | |
| 3.3.9 | Saved designs list with thumbnail/load/delete | ✅ | localStorage, up to 20 designs |
| 3.3.10 | Confirm overwrite dialog on JSON load | ✅ | Shows when canvas has objects |

### 3.4 3D preview
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.4.1 | @react-three/fiber v8 + @react-three/drei v9 (React 18 compat) | ✅ | Was on v9 (React 19 only) — fixed |
| 3.4.2 | Procedural phone case geometry — proper CASE shell shape | 🔄 | Was a thick box (looked like phone body). Rebuilding as thin ExtrudeGeometry shell per DECISION-001 |
| 3.4.3 | Design texture mapped to back face | ✅ | Snapshot on 3D tab switch |
| 3.4.4 | Material roughness/metalness based on finish selection | ✅ | |
| 3.4.5 | Camera island + side buttons modelled | ✅ | |
| 3.4.6 | Idle sway animation + OrbitControls | ✅ | |
| 3.4.7 | 2D canvas stays mounted when in 3D view | ✅ | `display: none` not unmount |

### 3.5 Export & cart
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.5.1 | Export PNG (PRINT_MULTIPLIER ~4×, ~300 DPI) | ✅ | |
| 3.5.2 | Add to cart with thumbnail | ✅ | |
| 3.5.3 | Share button copies URL to clipboard | ✅ | Fixed — was only showing toast |

---

## Phase 4 — Polish & Enhancements (❌ Not started)

### 4.1 Nothing Phone 2 focus (next priority)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1.1 | Proper Nothing Phone 2 PNG frame cutout | 🔄 | Have one PNG but needs quality check |
| 4.1.2 | Nothing Phone 2 specific 3D .glb model | ❌ | Source from Sketchfab or create in Blender |
| 4.1.3 | Glyph Interface ring visual in editor | ❌ | Nothing's signature back design element |
| 4.1.4 | End-to-end flow test: design → cart → checkout | ❌ | |

### 4.2 Editor UX improvements
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.2.1 | Mobile responsive layout (V2 editor) | ❌ | Currently desktop-first |
| 4.2.2 | Touch support for canvas (pinch to zoom, drag to pan) | ❌ | Fabric.js touch events |
| 4.2.3 | Keyboard shortcuts (Delete key, Ctrl+Z, Ctrl+Y) | ❌ | |
| 4.2.4 | Right-click context menu on objects | ❌ | |
| 4.2.5 | Multi-select with Shift+click | ❌ | Fabric.js supports, just need to expose |
| 4.2.6 | Text editing directly on canvas (double-click) | ✅ | IText already supports this |
| 4.2.7 | Object alignment tools (center H/V, distribute) | ❌ | |
| 4.2.8 | Snap to grid / snap to canvas center | ❌ | |
| 4.2.9 | Image crop tool | ❌ | |
| 4.2.10 | Image filters (brightness, contrast, saturation) | ❌ | Fabric.js has built-in filters |
| 4.2.11 | Background image upload (not just colors) | ❌ | |
| 4.2.12 | Pattern backgrounds (stripes, polka dots, etc.) | ❌ | |

### 4.3 Templates
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.3.1 | More templates (target: 30+) | ❌ | Current: 12 |
| 4.3.2 | Festival/seasonal templates (Diwali, Holi, etc.) | ❌ | |
| 4.3.3 | Name personalization templates | ❌ | Pre-set "Your Name Here" text objects |
| 4.3.4 | Template preview at actual canvas size | ❌ | Currently CSS gradient approximation |

### 4.4 3D improvements
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.4.1 | Real .glb phone case models per device | ❌ | Pacdora-quality requires proper mesh |
| 4.4.2 | Real-time texture update as user edits (not just on tab switch) | ❌ | Poll `canvas.toDataURL` on `object:modified` |
| 4.4.3 | Multiple camera angles / rotation presets | ❌ | |
| 4.4.4 | Environment lighting presets (studio, outdoor, etc.) | ❌ | |
| 4.4.5 | Export 3D mockup as high-res PNG with background | ❌ | Screenshot the Three.js canvas |

### 4.5 Product expansion
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.5.1 | T-shirt product type (different canvas shape) | ❌ | Plan: `productType` field in PhoneModel → ProductModel |
| 4.5.2 | Mug product type | ❌ | |
| 4.5.3 | Product type switcher in design editor | ❌ | |
| 4.5.4 | Print area guides per product | ❌ | Safe zones, bleed margins |

---

## Phase 5 — Backend & Auth (❌ Not started)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Replace in-memory orders with database | ❌ | Supabase or PlanetScale (MySQL) recommended |
| 5.2 | User authentication (email + Google) | ❌ | Supabase Auth or NextAuth.js |
| 5.3 | Cloud design storage (save designs to account) | ❌ | Currently localStorage only |
| 5.4 | Design library per user | ❌ | |
| 5.5 | Razorpay payment integration | ❌ | Keys deferred — checkout is dummy for now |
| 5.6 | Order status tracking (pending → processing → shipped) | ❌ | |
| 5.7 | Email confirmation on order | ❌ | Resend or SendGrid |
| 5.8 | Admin dashboard (view/manage orders, designs) | ❌ | |
| 5.9 | Webhook from print vendor | ❌ | On-demand print integration TBD |

---

## Phase 6 — AI Features (❌ Planned, not urgent)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Remove background from uploaded photo | ❌ | Remove.bg API or Replicate |
| 6.2 | AI design generation from text prompt | ❌ | Stability AI / DALL-E |
| 6.3 | AI background replacement | ❌ | |
| 6.4 | Style transfer (make photo look like painting, etc.) | ❌ | |

---

## Known Bugs & Issues

| # | Issue | Severity | File | Notes |
|---|-------|----------|------|-------|
| B0 | **3D shape looks like a phone body/screen, not a phone case shell** | **Critical** | `PhoneCase3D.tsx` | Box is too thick (depth 0.18), camera island is a raised bump not a cutout, frame color is black. Fix: ExtrudeGeometry thin shell + proper camera recess. → **DECISION-001** |
| B1 | 3D texture only updates on tab switch, not live | Medium | `PhoneCase3D.tsx` | Need to call `toDataURL` on `object:modified` event |
| B2 | Pan tool doesn't restore object selectability after undo | Low | `DesignEditorV2.tsx` | Objects loaded from history snapshot may have `selectable: false` if pan was active |
| B3 | Template background objects are `selectable: false` but user can't tell | Low | `DesignEditorV2.tsx` | Should show visual affordance or make them selectable |
| B4 | Nothing Phone 2 PNG frame needs quality review | Medium | `public/frames/nothing-phone-2.png` | May have wrong aspect ratio or quality issues |
| B5 | V2 editor has no mobile layout | High | `DesignEditorV2.tsx` | Fixed desktop only. Sidebar overlaps on small screens |
| B6 | Scroll wheel zoom on canvas also scrolls the page in some browsers | Low | `DesignEditorV2.tsx` | `preventDefault` is called but may not catch all cases |
| B7 | Cart design images are base64 blobs — `localStorage` can hit 5MB limit | Medium | `cartStore.ts` | Large designs with uploaded photos will fail silently |
| B8 | Orders API is in-memory — restarts lose all orders | High | `api/orders/route.ts` | POC only — needs DB before any real use |
| B9 | Share URL copies `/design-v2/nothing-phone-2` — design state not included | Medium | `DesignEditorV2.tsx` | URL share is just the model page, not the actual design |

---

## Architecture Decisions & Notes

### Routing
```
/                          → homepage (model selector)
/design/[model]            → V1 editor (kept for reference, not linked from homepage)
/design-v2/[model]         → V2 editor (default, linked from homepage cards)
/cart                      → cart page
/checkout                  → checkout form + Razorpay stub
/api/orders                → POST (create) + GET (list) — in-memory
```

### Key files
| File | Purpose |
|------|---------|
| `src/components/DesignEditorV2.tsx` | Main V2 editor — Fabric.js canvas, all tools, panels, save/load |
| `src/components/DesignEditor.tsx` | V1 editor — preserved, not actively developed |
| `src/components/PhoneCase3D.tsx` | Three.js 3D case viewer (R3F v8) |
| `src/components/PhoneFrame.tsx` | PNG-first frame with SVG fallback + gloss overlay |
| `src/data/templates.ts` | 12 design templates (Aesthetic/Minimal/Quotes) |
| `src/lib/phoneModels.ts` | 10 phone model definitions |
| `src/store/cartStore.ts` | Zustand cart with localStorage persistence |
| `public/frames/` | PNG phone frame cutouts (drop `{model-id}.png` here) |

### Critical gotchas
1. **Fabric.js + React 18 Strict Mode** — double useEffect call. Guard: `if (fabricRef.current) return` inside async import callback.
2. **Fabric.js + CSS transforms** — never use `transform: scale()` on the canvas wrapper. Init canvas at display size and use `multiplier` for export.
3. **@react-three/fiber v9 requires React 19** — pin to v8 (`@react-three/fiber@8`, `@react-three/drei@9`).
4. **3D material arrays on drei primitives** — `RoundedBox` doesn't create face groups. Use separate `<mesh>` elements for per-face materials.
5. **Undo/Redo** — must unbind all three events (`object:added`, `object:modified`, `object:removed`) before `loadFromJSON`, otherwise removed objects trigger new history entries.
6. **Canvas stays mounted in 3D view** — use `display: none` not conditional rendering, otherwise Fabric loses its canvas reference.

### Package versions (pinned)
```json
"next": "^14.2.30",
"fabric": "^5.x",
"@react-three/fiber": "8.18.0",
"@react-three/drei": "9.122.0",
"three": "0.183.2",
"zustand": "^4.x",
"framer-motion": "^11.x"
```

---

## Next Session Priorities

1. **Nothing Phone 2 end-to-end** — verify the PNG frame looks correct, fix any aspect ratio issues, test full design → cart → checkout flow
2. **Fix B5 (mobile layout)** — the V2 editor is desktop-only; needs responsive breakpoints or a separate mobile editor view  
3. **Fix B1 (live 3D texture)** — subscribe to `canvas.on('object:modified')` and debounce `toDataURL` to keep 3D view in sync
4. **Fix B7 (cart storage limit)** — compress design images or store only the Fabric JSON + re-render thumbnail on cart page
5. **Keyboard shortcuts** — Delete, Ctrl+Z, Ctrl+Y, Escape to deselect
