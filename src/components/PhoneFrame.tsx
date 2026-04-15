'use client';

import { useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   PHONE FRAME SYSTEM
   ─────────────────────────────────────────────────────────────────────────
   Load order per model:
     1. /public/frames/{model-id}.png   ← drop your real cutout PNGs here
     2. SVG fallback (coded below)      ← used if PNG 404s or hasn't been added yet

   PNG spec for /public/frames/:
     • Transparent hole where the design canvas shows through
     • Opaque phone body (frame, camera module, buttons)
     • Recommended: 800px wide, matching aspect ratio of canvasWidth:canvasHeight
     • Format: PNG-24 with alpha
     • Naming: exactly matches model.id  e.g. nothing-phone-2.png

   Gloss overlay is always applied on top of whichever frame renders.
   ──────────────────────────────────────────────────────────────────────── */

interface FP { width: number; height: number }

// ── Gloss overlay ────────────────────────────────────────────────────────
// A single reusable layer that simulates phone-case surface sheen.
// Two gradients composited: top-left highlight + edge depth vignette.
function GlossOverlay({ borderRadius = 20 }: { borderRadius?: number }) {
  return (
    <>
      {/* Top-left specular highlight */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          zIndex: 30,
          borderRadius,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, transparent 58%)',
        }}
      />
      {/* Edge depth vignette */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          zIndex: 31,
          borderRadius,
          boxShadow:
            'inset 0 0 18px rgba(0,0,0,0.13), inset 0 2px 6px rgba(255,255,255,0.14)',
        }}
      />
    </>
  );
}

// ── SVG fallbacks (used when no PNG exists yet) ──────────────────────────

function IPhoneFrame({ width, height, pro }: FP & { pro?: boolean }) {
  return (
    <svg width={width} height={height} viewBox="0 0 360 720" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="357" height="717" rx="42" ry="42"
        stroke={pro ? '#a09080' : '#3a3a3a'} strokeWidth="3" fill="none" opacity="0.75" />
      <rect x="143" y="15" width="74" height="25" rx="12.5" fill={pro ? '#2a1e18' : '#111'} />
      <rect x="14" y="14" width="102" height="102" rx="24" fill={pro ? '#231d18' : '#111'} opacity="0.95" />
      <circle cx="48" cy="48" r="20" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="48" cy="48" r="11" fill="#030303" />
      <circle cx="42" cy="42" r="3.5" fill="white" opacity="0.18" />
      <circle cx="84" cy="48" r="17" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="84" cy="48" r="9"  fill="#030303" />
      <circle cx="66" cy="84" r="17" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="66" cy="84" r="9"  fill="#030303" />
      <circle cx="98" cy="80" r="7"  fill="#e8c200" opacity="0.75" />
      <circle cx="100" cy="97" r="4" fill="#666" opacity="0.6" />
      <rect x="2"   y="158" width="4" height="28" rx="2" fill="#666" />
      <rect x="2"   y="196" width="4" height="50" rx="2" fill="#666" />
      <rect x="354" y="196" width="4" height="60" rx="2" fill="#666" />
    </svg>
  );
}

function SamsungFrame({ width, height, ultra }: FP & { ultra?: boolean }) {
  const vH = ultra ? 800 : 730;
  return (
    <svg width={width} height={height} viewBox={`0 0 360 ${vH}`} fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="357" height={vH - 3} rx="36" ry="36"
        stroke="#3a3a3a" strokeWidth="3" fill="none" opacity="0.75" />
      <rect x="14" y="18" width="74" height={ultra ? 150 : 116} rx="20" fill="#111" opacity="0.95" />
      <circle cx="51" cy="52"  r="19" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="51" cy="52"  r="10" fill="#030303" />
      <circle cx="51" cy="90"  r="16" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="51" cy="90"  r="9"  fill="#030303" />
      <circle cx="51" cy="124" r="13" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="51" cy="124" r="7"  fill="#030303" />
      {ultra && <>
        <circle cx="51" cy="154" r="12" fill="#080808" stroke="#555" strokeWidth="1.5" />
        <circle cx="51" cy="154" r="7"  fill="#030303" />
      </>}
      <circle cx="72" cy="48" r="6" fill="#e8c200" opacity="0.75" />
      <circle cx="180" cy="28" r="9" fill="#111" />
      <rect x="2"   y="160" width="4" height="28" rx="2" fill="#666" />
      <rect x="2"   y="196" width="4" height="50" rx="2" fill="#666" />
      <rect x="354" y="200" width="4" height="58" rx="2" fill="#666" />
    </svg>
  );
}

function NothingPhone2Frame({ width, height }: FP) {
  return (
    <svg width={width} height={height} viewBox="0 0 365 730" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="362" height="727" rx="20" ry="20"
        stroke="#666" strokeWidth="3" fill="none" opacity="0.85" />
      <rect x="14" y="14" width="130" height="82" rx="14" fill="#111" opacity="0.95" />
      <circle cx="52"  cy="55" r="23" fill="#080808" stroke="#333" strokeWidth="2" />
      <circle cx="52"  cy="55" r="14" fill="#030303" />
      <circle cx="44"  cy="47" r="4.5" fill="white" opacity="0.14" />
      <circle cx="103" cy="55" r="19" fill="#080808" stroke="#333" strokeWidth="2" />
      <circle cx="103" cy="55" r="11" fill="#030303" />
      <circle cx="126" cy="26" r="6.5" fill="#e8c200" opacity="0.8" />
      <rect x="18" y="24" width="9" height="9" rx="2" fill="#333" />
      {/* Glyph ring */}
      <circle cx="183" cy="475" r="104" stroke="rgba(255,255,255,0.22)" strokeWidth="3.5" fill="none" />
      <circle cx="183" cy="475" r="92"  stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" />
      <path d="M 183 371 A 104 104 0 0 1 287 475"
        stroke="rgba(255,255,255,0.28)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="330" y="155" width="9" height="90" rx="4.5" fill="rgba(255,255,255,0.18)" />
      <rect x="330" y="255" width="9" height="40" rx="4.5" fill="rgba(255,255,255,0.1)" />
      <rect x="22"  y="390" width="9" height="70" rx="4.5"
        fill="rgba(255,255,255,0.12)" transform="rotate(-8 22 390)" />
      <rect x="362" y="230" width="4" height="44" rx="2" fill="#888" />
      <rect x="2"   y="178" width="4" height="30" rx="2" fill="#777" />
      <rect x="2"   y="218" width="4" height="52" rx="2" fill="#777" />
      <rect x="152" y="723" width="60" height="5" rx="2.5" fill="#444" />
    </svg>
  );
}

function PixelFrame({ width, height }: FP) {
  return (
    <svg width={width} height={height} viewBox="0 0 360 720" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="357" height="717" rx="26" ry="26"
        stroke="#3a3a3a" strokeWidth="3" fill="none" opacity="0.75" />
      <rect x="0" y="58" width="358" height="84" fill="#111" opacity="0.92" />
      <line x1="0" y1="58" x2="358" y2="58" stroke="#2a2a2a" strokeWidth="2" />
      <line x1="0" y1="142" x2="358" y2="142" stroke="#2a2a2a" strokeWidth="2" />
      <circle cx="90"  cy="100" r="23" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="90"  cy="100" r="14" fill="#030303" />
      <circle cx="148" cy="100" r="19" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="148" cy="100" r="11" fill="#030303" />
      <circle cx="196" cy="100" r="16" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="196" cy="100" r="9"  fill="#030303" />
      <circle cx="230" cy="95"  r="9"  fill="#e8c200" opacity="0.75" />
      <circle cx="180" cy="28"  r="8"  fill="#111" />
      <rect x="2"   y="200" width="4" height="42" rx="2" fill="#666" />
      <rect x="354" y="178" width="4" height="64" rx="2" fill="#666" />
    </svg>
  );
}

function OnePlusFrame({ width, height }: FP) {
  return (
    <svg width={width} height={height} viewBox="0 0 370 740" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="367" height="737" rx="38" ry="38"
        stroke="#2a2a2a" strokeWidth="3" fill="none" opacity="0.75" />
      <circle cx="78" cy="74" r="62" fill="#111" opacity="0.95" />
      <circle cx="78" cy="54" r="22" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="78" cy="54" r="13" fill="#030303" />
      <circle cx="53" cy="90" r="19" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="53" cy="90" r="11" fill="#030303" />
      <circle cx="104" cy="90" r="19" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="104" cy="90" r="11" fill="#030303" />
      <circle cx="122" cy="50" r="9"  fill="#e8c200" opacity="0.75" />
      <rect x="367" y="160" width="4" height="52" rx="2" fill="#999" />
      <rect x="367" y="230" width="4" height="62" rx="2" fill="#666" />
      <rect x="2"   y="198" width="4" height="32" rx="2" fill="#666" />
      <rect x="2"   y="238" width="4" height="52" rx="2" fill="#666" />
    </svg>
  );
}

// Returns the right SVG component for a model id
function SvgFallback({ modelId, width, height }: { modelId: string; width: number; height: number }) {
  const p = { width, height };
  if (modelId === 'iphone-15' || modelId === 'iphone-14') return <IPhoneFrame {...p} />;
  if (modelId === 'iphone-15-pro')    return <IPhoneFrame {...p} pro />;
  if (modelId === 'samsung-s24' || modelId === 'samsung-s23') return <SamsungFrame {...p} />;
  if (modelId === 'samsung-s24-ultra') return <SamsungFrame {...p} ultra />;
  if (modelId === 'nothing-phone-2')  return <NothingPhone2Frame {...p} />;
  if (modelId.startsWith('pixel'))    return <PixelFrame {...p} />;
  if (modelId.startsWith('oneplus'))  return <OnePlusFrame {...p} />;
  // Generic rounded rect
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width={width - 3} height={height - 3} rx="28" ry="28"
        stroke="#3a3a3a" strokeWidth="3" fill="none" opacity="0.7" />
    </svg>
  );
}

// ── Public API ────────────────────────────────────────────────────────────
export interface PhoneFrameProps { modelId: string; width: number; height: number }

export default function PhoneFrame({ modelId, width, height }: PhoneFrameProps) {
  // Start optimistic — assume PNG exists. onError flips to SVG.
  const [pngFailed, setPngFailed] = useState(false);

  // Corner radius used for the gloss shape — matches each phone family
  const glassRadius =
    modelId === 'nothing-phone-2' ? 18 :
    modelId.startsWith('pixel')   ? 24 :
    modelId.startsWith('oneplus') ? 36 : 40;

  return (
    <>
      {/* ── Frame layer: PNG or SVG ── */}
      {pngFailed ? (
        <SvgFallback modelId={modelId} width={width} height={height} />
      ) : (
        <img
          src={`/frames/${modelId}.png`}
          alt=""
          width={width}
          height={height}
          onError={() => setPngFailed(true)}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{ zIndex: 10 }}
          draggable={false}
        />
      )}

      {/* ── Gloss overlay (always on top of whichever frame rendered) ── */}
      <GlossOverlay borderRadius={glassRadius} />
    </>
  );
}
