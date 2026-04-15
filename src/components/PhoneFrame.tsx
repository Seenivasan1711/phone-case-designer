'use client';

interface FP { width: number; height: number }

/* ─── iPhone 15 / 14 ─────────────────────────────────────────────── */
function IPhoneFrame({ width, height, pro }: FP & { pro?: boolean }) {
  return (
    <svg width={width} height={height} viewBox="0 0 360 720" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      {/* Body */}
      <rect x="1.5" y="1.5" width="357" height="717" rx="42" ry="42"
        stroke={pro ? '#a09080' : '#3a3a3a'} strokeWidth="3" fill="none" opacity="0.75" />
      {/* Dynamic Island */}
      <rect x="143" y="15" width="74" height="25" rx="12.5"
        fill={pro ? '#2a1e18' : '#111'} />
      {/* Camera module */}
      <rect x="14" y="14" width="102" height="102" rx="24"
        fill={pro ? '#231d18' : '#111'} opacity="0.95" />
      {/* Main lens */}
      <circle cx="48" cy="48" r="20" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="48" cy="48" r="11" fill="#030303" />
      <circle cx="42" cy="42" r="3.5" fill="white" opacity="0.18" />
      {/* Tele lens */}
      <circle cx="84" cy="48" r="17" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="84" cy="48" r="9" fill="#030303" />
      {/* Ultra-wide */}
      <circle cx="66" cy="84" r="17" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="66" cy="84" r="9" fill="#030303" />
      {/* Flash */}
      <circle cx="98" cy="80" r="7" fill="#e8c200" opacity="0.75" />
      <circle cx="100" cy="97" r="4" fill="#666" opacity="0.6" />
      {/* Volume buttons */}
      <rect x="2" y="158" width="4" height="28" rx="2" fill="#666" />
      <rect x="2" y="196" width="4" height="50" rx="2" fill="#666" />
      {/* Power button */}
      <rect x="354" y="196" width="4" height="60" rx="2" fill="#666" />
    </svg>
  );
}

/* ─── Samsung Galaxy S24 / S23 ───────────────────────────────────── */
function SamsungFrame({ width, height, ultra }: FP & { ultra?: boolean }) {
  const vH = ultra ? 800 : 730;
  return (
    <svg width={width} height={height} viewBox={`0 0 360 ${vH}`} fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="357" height={vH - 3} rx="36" ry="36"
        stroke="#3a3a3a" strokeWidth="3" fill="none" opacity="0.75" />
      {/* Camera island */}
      <rect x="14" y="18" width="74" height={ultra ? 150 : 116} rx="20" fill="#111" opacity="0.95" />
      <circle cx="51" cy="52" r="19" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="51" cy="52" r="10" fill="#030303" />
      <circle cx="51" cy="90" r="16" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="51" cy="90" r="9" fill="#030303" />
      <circle cx="51" cy="124" r="13" fill="#080808" stroke="#555" strokeWidth="1.5" />
      <circle cx="51" cy="124" r="7" fill="#030303" />
      {ultra && (
        <>
          <circle cx="51" cy="154" r="12" fill="#080808" stroke="#555" strokeWidth="1.5" />
          <circle cx="51" cy="154" r="7" fill="#030303" />
        </>
      )}
      <circle cx="72" cy="48" r="6" fill="#e8c200" opacity="0.75" />
      {/* Punch-hole */}
      <circle cx="180" cy="28" r="9" fill="#111" />
      {/* Buttons */}
      <rect x="2" y="160" width="4" height="28" rx="2" fill="#666" />
      <rect x="2" y="196" width="4" height="50" rx="2" fill="#666" />
      <rect x="354" y="200" width="4" height="58" rx="2" fill="#666" />
    </svg>
  );
}

/* ─── Nothing Phone (2) ──────────────────────────────────────────── */
function NothingPhone2Frame({ width, height }: FP) {
  return (
    <svg width={width} height={height} viewBox="0 0 365 730" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      {/* Flat-sided body */}
      <rect x="1.5" y="1.5" width="362" height="727" rx="20" ry="20"
        stroke="#666" strokeWidth="3" fill="none" opacity="0.85" />

      {/* Camera section */}
      <rect x="14" y="14" width="130" height="82" rx="14" fill="#111" opacity="0.95" />
      {/* Main lens */}
      <circle cx="52" cy="55" r="23" fill="#080808" stroke="#333" strokeWidth="2" />
      <circle cx="52" cy="55" r="14" fill="#030303" />
      <circle cx="44" cy="47" r="4.5" fill="white" opacity="0.14" />
      {/* Ultra-wide */}
      <circle cx="103" cy="55" r="19" fill="#080808" stroke="#333" strokeWidth="2" />
      <circle cx="103" cy="55" r="11" fill="#030303" />
      {/* Flash */}
      <circle cx="126" cy="26" r="6.5" fill="#e8c200" opacity="0.8" />
      {/* Mic dot */}
      <rect x="18" y="24" width="9" height="9" rx="2" fill="#333" />

      {/* ── Glyph Interface ────────────────────────────────── */}
      {/* Big ring */}
      <circle cx="183" cy="475" r="104" stroke="rgba(255,255,255,0.22)" strokeWidth="3.5" fill="none" />
      <circle cx="183" cy="475" r="92" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" />

      {/* C-strip top arc */}
      <path d="M 183 371 A 104 104 0 0 1 287 475"
        stroke="rgba(255,255,255,0.28)" strokeWidth="7" fill="none" strokeLinecap="round" />

      {/* Battery bar (right vertical) */}
      <rect x="330" y="155" width="9" height="90" rx="4.5" fill="rgba(255,255,255,0.18)" />
      <rect x="330" y="255" width="9" height="40" rx="4.5" fill="rgba(255,255,255,0.1)" />

      {/* Small diagonal strip (left) */}
      <rect x="22" y="390" width="9" height="70" rx="4.5"
        fill="rgba(255,255,255,0.12)" transform="rotate(-8 22 390)" />

      {/* ── Buttons ──────────────────────────────────────── */}
      {/* Alert slider (Nothing signature) */}
      <rect x="362" y="230" width="4" height="44" rx="2" fill="#888" />
      {/* Volume */}
      <rect x="2" y="178" width="4" height="30" rx="2" fill="#777" />
      <rect x="2" y="218" width="4" height="52" rx="2" fill="#777" />
      {/* USB-C notch */}
      <rect x="152" y="723" width="60" height="5" rx="2.5" fill="#444" />
    </svg>
  );
}

/* ─── Google Pixel 8 ─────────────────────────────────────────────── */
function PixelFrame({ width, height }: FP) {
  return (
    <svg width={width} height={height} viewBox="0 0 360 720" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="357" height="717" rx="26" ry="26"
        stroke="#3a3a3a" strokeWidth="3" fill="none" opacity="0.75" />
      {/* Camera visor bar */}
      <rect x="0" y="58" width="358" height="84" rx="0" fill="#111" opacity="0.92" />
      <line x1="0" y1="58" x2="358" y2="58" stroke="#2a2a2a" strokeWidth="2" />
      <line x1="0" y1="142" x2="358" y2="142" stroke="#2a2a2a" strokeWidth="2" />
      {/* Lenses */}
      <circle cx="90" cy="100" r="23" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="90" cy="100" r="14" fill="#030303" />
      <circle cx="148" cy="100" r="19" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="148" cy="100" r="11" fill="#030303" />
      <circle cx="196" cy="100" r="16" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="196" cy="100" r="9" fill="#030303" />
      <circle cx="230" cy="95" r="9" fill="#e8c200" opacity="0.75" />
      {/* Punch-hole */}
      <circle cx="180" cy="28" r="8" fill="#111" />
      {/* Buttons */}
      <rect x="2" y="200" width="4" height="42" rx="2" fill="#666" />
      <rect x="354" y="178" width="4" height="64" rx="2" fill="#666" />
    </svg>
  );
}

/* ─── OnePlus 12 ─────────────────────────────────────────────────── */
function OnePlusFrame({ width, height }: FP) {
  return (
    <svg width={width} height={height} viewBox="0 0 370 740" fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width="367" height="737" rx="38" ry="38"
        stroke="#2a2a2a" strokeWidth="3" fill="none" opacity="0.75" />
      {/* Circular camera island */}
      <circle cx="78" cy="74" r="62" fill="#111" opacity="0.95" />
      <circle cx="78" cy="54" r="22" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="78" cy="54" r="13" fill="#030303" />
      <circle cx="53" cy="90" r="19" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="53" cy="90" r="11" fill="#030303" />
      <circle cx="104" cy="90" r="19" fill="#080808" stroke="#444" strokeWidth="2" />
      <circle cx="104" cy="90" r="11" fill="#030303" />
      <circle cx="122" cy="50" r="9" fill="#e8c200" opacity="0.75" />
      {/* Alert slider */}
      <rect x="367" y="160" width="4" height="52" rx="2" fill="#999" />
      {/* Power + vol */}
      <rect x="367" y="230" width="4" height="62" rx="2" fill="#666" />
      <rect x="2" y="198" width="4" height="32" rx="2" fill="#666" />
      <rect x="2" y="238" width="4" height="52" rx="2" fill="#666" />
    </svg>
  );
}

/* ─── Public API ─────────────────────────────────────────────────── */
export interface PhoneFrameProps { modelId: string; width: number; height: number }

export default function PhoneFrame({ modelId, width, height }: PhoneFrameProps) {
  const p = { width, height };
  if (modelId === 'iphone-15' || modelId === 'iphone-14') return <IPhoneFrame {...p} />;
  if (modelId === 'iphone-15-pro') return <IPhoneFrame {...p} pro />;
  if (modelId === 'samsung-s24' || modelId === 'samsung-s23') return <SamsungFrame {...p} />;
  if (modelId === 'samsung-s24-ultra') return <SamsungFrame {...p} ultra />;
  if (modelId === 'nothing-phone-2') return <NothingPhone2Frame {...p} />;
  if (modelId.startsWith('pixel')) return <PixelFrame {...p} />;
  if (modelId.startsWith('oneplus')) return <OnePlusFrame {...p} />;
  // Fallback
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none"
      className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      <rect x="1.5" y="1.5" width={width - 3} height={height - 3} rx="28" ry="28"
        stroke="#3a3a3a" strokeWidth="3" fill="none" opacity="0.7" />
    </svg>
  );
}
