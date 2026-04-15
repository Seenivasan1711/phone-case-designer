'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhoneModel } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import PhoneFrame from './PhoneFrame';
import {
  ImagePlus, Type, Trash2, RotateCcw, RotateCw, ShoppingCart,
  Download, Bold, Italic, ChevronUp, ChevronDown, Copy,
  Lock, Unlock, X, Minus, Plus, Smile,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// SCALE: canvas lives at this fraction of full print size.
// Export multiplier restores print resolution.
// ─────────────────────────────────────────────────────────────────────────────
const SCALE            = 0.75;
const EXPORT_MULTIPLIER = 3;          // for cart preview
const PRINT_MULTIPLIER  = Math.ceil(3 / SCALE); // for download (~300 DPI)

// ─────────────────────────────────────────────────────────────────────────────
// FONTS — organised by script/language
// Google fonts are loaded lazily when selected
// ─────────────────────────────────────────────────────────────────────────────
interface FontEntry { name: string; google?: string }

const FONT_GROUPS: { lang: string; emoji: string; fonts: FontEntry[] }[] = [
  {
    lang: 'English', emoji: '🇬🇧',
    fonts: [
      { name: 'Arial' },
      { name: 'Georgia' },
      { name: 'Impact' },
      { name: 'Roboto',           google: 'Roboto' },
      { name: 'Playfair Display', google: 'Playfair+Display' },
      { name: 'Oswald',           google: 'Oswald' },
      { name: 'Pacifico',         google: 'Pacifico' },
      { name: 'Dancing Script',   google: 'Dancing+Script' },
      { name: 'Lobster',          google: 'Lobster' },
      { name: 'Bebas Neue',       google: 'Bebas+Neue' },
    ],
  },
  {
    lang: 'Hindi (हिन्दी)', emoji: '🇮🇳',
    fonts: [
      { name: 'Noto Sans Devanagari',  google: 'Noto+Sans+Devanagari' },
      { name: 'Hind',                  google: 'Hind' },
      { name: 'Baloo 2',               google: 'Baloo+2' },
      { name: 'Tiro Devanagari Hindi', google: 'Tiro+Devanagari+Hindi' },
      { name: 'Poppins',               google: 'Poppins' },
    ],
  },
  {
    lang: 'Tamil (தமிழ்)', emoji: '🇮🇳',
    fonts: [
      { name: 'Noto Sans Tamil', google: 'Noto+Sans+Tamil' },
      { name: 'Catamaran',       google: 'Catamaran' },
      { name: 'Mukta Malar',     google: 'Mukta+Malar' },
    ],
  },
  {
    lang: 'Telugu (తెలుగు)', emoji: '🇮🇳',
    fonts: [
      { name: 'Noto Sans Telugu',    google: 'Noto+Sans+Telugu' },
      { name: 'Baloo Tammudu 2',     google: 'Baloo+Tammudu+2' },
    ],
  },
  {
    lang: 'Bengali (বাংলা)', emoji: '🇮🇳',
    fonts: [
      { name: 'Noto Sans Bengali', google: 'Noto+Sans+Bengali' },
      { name: 'Hind Siliguri',     google: 'Hind+Siliguri' },
    ],
  },
  {
    lang: 'Kannada (ಕನ್ನಡ)', emoji: '🇮🇳',
    fonts: [
      { name: 'Noto Sans Kannada', google: 'Noto+Sans+Kannada' },
      { name: 'Baloo Tamma 2',     google: 'Baloo+Tamma+2' },
    ],
  },
  {
    lang: 'Malayalam (മലയാളം)', emoji: '🇮🇳',
    fonts: [
      { name: 'Noto Sans Malayalam', google: 'Noto+Sans+Malayalam' },
      { name: 'Baloo Chettan 2',     google: 'Baloo+Chettan+2' },
    ],
  },
  {
    lang: 'Arabic (عربي)', emoji: '🌍',
    fonts: [
      { name: 'Noto Sans Arabic', google: 'Noto+Sans+Arabic' },
      { name: 'Cairo',            google: 'Cairo' },
    ],
  },
];

const ALL_FONTS = FONT_GROUPS.flatMap(g => g.fonts);

async function loadGoogleFont(entry: FontEntry): Promise<void> {
  if (!entry.google) return; // system font, always available
  const id = `gfont-${entry.google}`;
  if (document.getElementById(id)) return;
  await new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${entry.google}&display=swap`;
    link.onload  = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  // wait for browser to finish parsing the new @font-face rules
  await document.fonts.ready;
}

// ─────────────────────────────────────────────────────────────────────────────
const STICKERS = ['⭐', '❤️', '🔥', '✨', '🎨', '🌈', '🦋', '🎯', '💎', '🌸',
                  '😎', '🎵', '🏆', '👑', '🎉', '🍀', '🌺', '🦁', '🐉', '⚡'];

const BG_PRESETS = [
  '#ffffff', '#000000', '#1a1a2e', '#f8fafc',
  '#fee2e2', '#fef9c3', '#dcfce7', '#dbeafe',
  '#f3e8ff', '#fce7f3', '#ffedd5', '#ecfdf5',
];

// ─────────────────────────────────────────────────────────────────────────────

interface Props { model: PhoneModel }

export default function DesignEditor({ model }: Props) {
  const W = Math.round(model.canvasWidth  * SCALE);
  const H = Math.round(model.canvasHeight * SCALE);

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyRef  = useRef<any[]>([]);
  const historyIdx  = useRef(-1);

  // UI panels
  const [panel, setPanel]               = useState<null|'text'|'sticker'|'bg'>(null);
  const [fontGroupOpen, setFontGroupOpen] = useState<string|null>(null);

  // Selection state
  const [selected, setSelected]         = useState(false);
  const [locked, setLocked]             = useState(false);
  const [addedToCart, setAddedToCart]   = useState(false);
  const [bgColor, setBgColor]           = useState('#ffffff');
  const [fontLoading, setFontLoading]   = useState(false);

  // Text config
  const [textInput, setTextInput]       = useState('Your Text');
  const [textColor, setTextColor]       = useState('#1a1a1a');
  const [fontSize, setFontSize]         = useState(26);
  const [fontFamily, setFontFamily]     = useState('Arial');
  const [isBold, setIsBold]             = useState(false);
  const [isItalic, setIsItalic]         = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  // ── History ────────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
    historyRef.current.push(json);
    historyIdx.current = historyRef.current.length - 1;
  }, []);

  // ── Canvas init ────────────────────────────────────────────────────────────
  useEffect(() => {
    let canvas: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    import('fabric').then(({ fabric }) => {
      if (!canvasElRef.current || fabricRef.current) return;

      canvas = new fabric.Canvas(canvasElRef.current, {
        width: W, height: H,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        // Crisp rendering for export
        enableRetinaScaling: true,
      });

      // ⚠️ NO dashed border rect here — the phone frame overlay handles
      // visual boundaries. A canvas rect causes artefacts in exports.

      canvas.on('object:added',    saveHistory);
      canvas.on('object:modified', saveHistory);
      canvas.on('object:removed',  saveHistory);
      canvas.on('selection:created', () => {
        setSelected(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLocked(!!(canvas.getActiveObject() as any)?.lockMovementX);
      });
      canvas.on('selection:updated', () => {
        setSelected(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLocked(!!(canvas.getActiveObject() as any)?.lockMovementX);
      });
      canvas.on('selection:cleared', () => { setSelected(false); setLocked(false); });

      fabricRef.current = canvas;
      saveHistory();
    });

    return () => { canvas?.dispose(); fabricRef.current = null; };
  }, [model, W, H, saveHistory]);

  // ── Bg color sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setBackgroundColor(bgColor, () => fabricRef.current.renderAll());
  }, [bgColor]);

  // ── Add text (with lazy font load) ────────────────────────────────────────
  const addText = useCallback(async () => {
    const entry = ALL_FONTS.find(f => f.name === fontFamily) ?? { name: fontFamily };
    setFontLoading(true);
    await loadGoogleFont(entry);
    setFontLoading(false);

    import('fabric').then(({ fabric }) => {
      const text = new fabric.IText(textInput || 'Your Text', {
        left: W / 2 - 60, top: H / 2 - 15,
        fontSize, fill: textColor, fontFamily,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle:  isItalic ? 'italic' : 'normal',
        editable: true,
      });
      fabricRef.current?.add(text);
      fabricRef.current?.setActiveObject(text);
      fabricRef.current?.requestRenderAll(); // re-render after font load
      setPanel(null);
    });
  }, [textInput, fontSize, textColor, fontFamily, isBold, isItalic, W, H]);

  // ── Font selection (lazy load preview) ───────────────────────────────────
  const handleFontSelect = useCallback(async (entry: FontEntry) => {
    setFontFamily(entry.name);
    setFontGroupOpen(null);
    await loadGoogleFont(entry); // preload so preview renders correctly
    fabricRef.current?.requestRenderAll();
  }, []);

  // ── Add sticker ────────────────────────────────────────────────────────────
  const addSticker = useCallback((emoji: string) => {
    import('fabric').then(({ fabric }) => {
      const t = new fabric.Text(emoji, {
        left: W / 2 - 20, top: H / 2 - 20, fontSize: 40,
      });
      fabricRef.current?.add(t);
      fabricRef.current?.setActiveObject(t);
      fabricRef.current?.renderAll();
      setPanel(null);
    });
  }, [W, H]);

  // ── Image upload ───────────────────────────────────────────────────────────
  const onDrop = useCallback((files: File[]) => {
    const file = files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      import('fabric').then(({ fabric }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fabric.Image.fromURL(url, (img: any) => {
          const maxW = W * 0.9, maxH = H * 0.85;
          if (img.width! > maxW) img.scaleToWidth(maxW);
          if (img.height! * img.scaleY! > maxH) img.scaleToHeight(maxH);
          img.set({
            left: W / 2 - (img.width!  * img.scaleX!) / 2,
            top:  H / 2 - (img.height! * img.scaleY!) / 2,
          });
          fabricRef.current?.add(img);
          fabricRef.current?.setActiveObject(img);
          fabricRef.current?.renderAll();
        }, { crossOrigin: 'anonymous' });
      });
    };
    reader.readAsDataURL(file);
  }, [W, H]);

  const { getRootProps, getInputProps, open: openFile } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1, noClick: true, noKeyboard: true,
  });

  // ── Context toolbar actions ────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.getActiveObjects().forEach((o: any) => c.remove(o));
    c.discardActiveObject(); c.renderAll();
  }, []);

  const duplicateSelected = useCallback(() => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.clone((cloned: any) => {
      cloned.set({ left: obj.left! + 20, top: obj.top! + 20 });
      c.add(cloned); c.setActiveObject(cloned); c.renderAll();
    });
  }, []);

  const toggleLock = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    const now = !locked;
    obj.set({ lockMovementX: now, lockMovementY: now,
               lockScalingX: now,  lockScalingY: now,
               lockRotation: now,  hasControls: !now });
    fabricRef.current.renderAll(); setLocked(now);
  }, [locked]);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    const c = fabricRef.current; if (!c) return;
    c.off('object:added'); c.off('object:modified');
    c.loadFromJSON(historyRef.current[historyIdx.current], () => {
      c.renderAll();
      c.on('object:added', saveHistory);
      c.on('object:modified', saveHistory);
    });
  }, [saveHistory]);

  const redo = useCallback(() => {
    if (historyIdx.current >= historyRef.current.length - 1) return;
    historyIdx.current += 1;
    const c = fabricRef.current; if (!c) return;
    c.off('object:added'); c.off('object:modified');
    c.loadFromJSON(historyRef.current[historyIdx.current], () => {
      c.renderAll();
      c.on('object:added', saveHistory);
      c.on('object:modified', saveHistory);
    });
  }, [saveHistory]);

  // ── Export ─────────────────────────────────────────────────────────────────
  // Clean export: no overlays, high-DPI via multiplier
  const exportCanvas = useCallback((multiplier: number) => {
    const c = fabricRef.current;
    if (!c) return null;
    // Temporarily disable selection handles
    const active = c.getActiveObject();
    c.discardActiveObject();
    c.renderAll();
    const dataUrl = c.toDataURL({
      format: 'png',
      multiplier,
      enableRetinaScaling: true,
    });
    if (active) { c.setActiveObject(active); c.renderAll(); }
    return dataUrl;
  }, []);

  const exportAndAddToCart = useCallback(() => {
    const designImage = exportCanvas(EXPORT_MULTIPLIER);
    if (!designImage) return;
    const designJSON = JSON.stringify(fabricRef.current?.toJSON() ?? {});
    addItem({ phoneModel: model, designImage, designJSON, quantity: 1, unitPrice: model.price });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }, [model, addItem, exportCanvas]);

  const downloadDesign = useCallback(() => {
    const url = exportCanvas(PRINT_MULTIPLIER);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `${model.id}-design.png`; a.click();
  }, [model, exportCanvas]);

  // Radius matches phone shape for container clipping
  const containerRadius =
    model.id === 'nothing-phone-2' ? 15 :
    model.id.startsWith('pixel')   ? 20 :
    model.id.startsWith('oneplus') ? 30 : 32;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="select-none lg:grid lg:grid-cols-[1fr_310px] lg:gap-6 lg:items-start pb-10">

      {/* ══════════════════════════════════════════════════════════════
          LEFT — dark phone stage
      ══════════════════════════════════════════════════════════════ */}
      <div
        {...getRootProps()}
        className="relative flex flex-col items-center justify-center gap-4 rounded-3xl py-10 px-4 mb-6 lg:mb-0 lg:sticky lg:top-8 cursor-default"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #1a1228 0%, #0b0b0f 70%)',
          minHeight: H + 80,
        }}
      >
        <input {...getInputProps()} />

        {/* Subtle grid dots background */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Drag hint */}
        <p className="relative text-white/25 text-[10px] tracking-[0.2em] uppercase font-medium select-none">
          Drop image anywhere
        </p>

        {/* Phone canvas */}
        <div
          className="relative bg-white"
          style={{
            width: W, height: H,
            borderRadius: containerRadius,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 30px rgba(0,0,0,0.5), 0 24px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Canvas (z-0) */}
          <canvas ref={canvasElRef} className="absolute inset-0" />

          {/* Phone frame PNG/SVG + gloss (z-10+) */}
          <PhoneFrame modelId={model.id} width={W} height={H} />
        </div>

        {/* Print spec */}
        <p className="relative text-white/20 text-[10px] tracking-wide select-none">
          {model.canvasWidth} × {model.canvasHeight} px &nbsp;·&nbsp; {PRINT_MULTIPLIER}× export &nbsp;·&nbsp; 300 DPI
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RIGHT — controls sidebar
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3">

        {/* Model info card */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div>
            <p className="font-bold text-gray-900 leading-tight">{model.displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5">Custom printed hard case</p>
          </div>
          <p className="text-purple-600 font-bold text-lg">{formatPrice(model.price)}</p>
        </div>

        {/* Context toolbar — visible when object selected */}
        {selected && (
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl px-3 py-2 shadow-md">
            <CtxBtn icon={<ChevronUp   className="w-4 h-4" />} label="Front"  onClick={() => fabricRef.current?.bringForward(fabricRef.current.getActiveObject())} />
            <CtxBtn icon={<ChevronDown className="w-4 h-4" />} label="Back"   onClick={() => fabricRef.current?.sendBackwards(fabricRef.current.getActiveObject())} />
            <div className="w-px h-8 bg-gray-100 mx-1" />
            <CtxBtn icon={locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              label={locked ? 'Unlock' : 'Lock'} onClick={toggleLock} active={locked} />
            <CtxBtn icon={<Copy  className="w-4 h-4" />} label="Copy"   onClick={duplicateSelected} />
            <div className="w-px h-8 bg-gray-100 mx-1" />
            <CtxBtn icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={deleteSelected} danger />
          </div>
        )}

        {/* Text panel */}
        {panel === 'text' && (
          <TextPanel
            textInput={textInput}      setTextInput={setTextInput}
            textColor={textColor}      setTextColor={setTextColor}
            fontSize={fontSize}        setFontSize={setFontSize}
            fontFamily={fontFamily}
            isBold={isBold}            setIsBold={setIsBold}
            isItalic={isItalic}        setIsItalic={setIsItalic}
            fontLoading={fontLoading}
            fontGroupOpen={fontGroupOpen} setFontGroupOpen={setFontGroupOpen}
            onFontSelect={handleFontSelect}
            onAdd={addText}
            onClose={() => setPanel(null)}
          />
        )}

        {/* Sticker panel */}
        {panel === 'sticker' && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-4">
            <PanelHeader title="Stickers" onClose={() => setPanel(null)} />
            <div className="grid grid-cols-5 gap-2 mt-2">
              {STICKERS.map(s => (
                <button key={s} onClick={() => addSticker(s)}
                  className="text-3xl leading-none py-1.5 rounded-xl hover:bg-gray-50 transition-colors active:scale-90">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Background panel */}
        {panel === 'bg' && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-4">
            <PanelHeader title="Background Color" onClose={() => setPanel(null)} />
            <div className="flex flex-wrap gap-2.5 mt-3">
              {BG_PRESETS.map(c => (
                <button key={c} onClick={() => { setBgColor(c); setPanel(null); }}
                  className={`w-10 h-10 rounded-full border-[3px] transition-all ${bgColor === c ? 'border-purple-500 scale-110 shadow-md' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <label className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-purple-400 transition-colors text-xs text-gray-400 font-bold">
                +<input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); }} className="sr-only" />
              </label>
            </div>
          </div>
        )}

        {/* Dark toolbar — add / undo / redo */}
        <div className="bg-[#111] rounded-2xl p-2 space-y-1">
          {/* Add tools row */}
          <div className="flex gap-1">
            <DarkToolBtn
              icon={<ImagePlus className="w-4 h-4" />} label="Image"
              onClick={openFile} accent
            />
            <DarkToolBtn
              icon={<Type className="w-4 h-4" />} label="Text"
              onClick={() => setPanel(panel === 'text' ? null : 'text')}
              accent active={panel === 'text'}
            />
            <DarkToolBtn
              icon={<Smile className="w-4 h-4" />} label="Sticker"
              onClick={() => setPanel(panel === 'sticker' ? null : 'sticker')}
              active={panel === 'sticker'}
            />
            <DarkToolBtn
              icon={<div className="w-4 h-4 rounded-full border-2 border-white/40" style={{ backgroundColor: bgColor }} />}
              label="BG"
              onClick={() => setPanel(panel === 'bg' ? null : 'bg')}
              active={panel === 'bg'}
            />
          </div>
          {/* History row */}
          <div className="flex gap-1 pt-0.5 border-t border-white/10">
            <DarkToolBtn icon={<RotateCcw className="w-4 h-4" />} label="Undo" onClick={undo} />
            <DarkToolBtn icon={<RotateCw  className="w-4 h-4" />} label="Redo" onClick={redo} />
          </div>
        </div>

        {/* Action buttons row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Add to cart */}
          <button onClick={exportAndAddToCart}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg col-span-2 ${
              addedToCart
                ? 'bg-green-500 text-white shadow-green-200'
                : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white shadow-purple-200'
            }`}>
            <ShoppingCart className="w-5 h-5" />
            {addedToCart ? '✓ Added to Cart!' : `Add to Cart — ${formatPrice(model.price)}`}
          </button>

          {/* Download / Export */}
          <button onClick={downloadDesign}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white border border-white/10 transition-all col-span-2">
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>

        {/* Quick tips */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tips</p>
          {[
            'Drag to move · pinch to resize',
            'Double-click text to edit in place',
            'Drop an image file onto the phone',
          ].map(tip => (
            <p key={tip} className="text-xs text-gray-400 flex items-start gap-1.5">
              <span className="text-purple-400 mt-0.5">›</span> {tip}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text Panel — full multilingual font picker
// ─────────────────────────────────────────────────────────────────────────────
function TextPanel({
  textInput, setTextInput, textColor, setTextColor,
  fontSize, setFontSize, fontFamily,
  isBold, setIsBold, isItalic, setIsItalic,
  fontLoading, fontGroupOpen, setFontGroupOpen,
  onFontSelect, onAdd, onClose,
}: {
  textInput: string; setTextInput: (v: string) => void;
  textColor: string; setTextColor: (v: string) => void;
  fontSize: number;  setFontSize:  (v: number) => void;
  fontFamily: string;
  isBold: boolean;   setIsBold:    (v: boolean) => void;
  isItalic: boolean; setIsItalic:  (v: boolean) => void;
  fontLoading: boolean;
  fontGroupOpen: string | null; setFontGroupOpen: (v: string | null) => void;
  onFontSelect: (e: FontEntry) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <div className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-800">Add Text</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Text input */}
        <input
          type="text" value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder="Type your text…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          style={{ fontFamily, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal' }}
        />

        {/* Font selector — grouped by language */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Font</p>
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {FONT_GROUPS.map(group => (
              <div key={group.lang}>
                {/* Group header */}
                <button
                  onClick={() => setFontGroupOpen(fontGroupOpen === group.lang ? null : group.lang)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <span>{group.emoji} {group.lang}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${fontGroupOpen === group.lang ? 'rotate-180' : ''}`} />
                </button>
                {/* Fonts in group */}
                {fontGroupOpen === group.lang && (
                  <div className="ml-2 space-y-0.5">
                    {group.fonts.map(f => (
                      <button
                        key={f.name}
                        onClick={() => onFontSelect(f)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                          fontFamily === f.name ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        style={{ fontFamily: f.name }}
                      >
                        {f.name}
                        <span className="ml-2 text-xs text-gray-400" style={{ fontFamily: f.name }}>
                          {group.lang.includes('हिन्दी') ? 'नमस्ते' :
                           group.lang.includes('தமிழ்') ? 'வணக்கம்' :
                           group.lang.includes('తెలుగు') ? 'నమస్కారం' :
                           group.lang.includes('বাংলা') ? 'হ্যালো' :
                           group.lang.includes('ಕನ್ನಡ') ? 'ನಮಸ್ಕಾರ' :
                           group.lang.includes('മലയാളം') ? 'നമസ്കാരം' :
                           group.lang.includes('عربي') ? 'مرحبا' : 'Abc'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Size + color + style */}
        <div className="grid grid-cols-2 gap-3">
          {/* Size */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Size</p>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1">
              <button onClick={() => setFontSize(Math.max(8, fontSize - 2))}
                className="p-1 text-gray-500 hover:text-purple-600"><Minus className="w-3 h-3" /></button>
              <span className="flex-1 text-center text-sm font-semibold">{fontSize}</span>
              <button onClick={() => setFontSize(Math.min(96, fontSize + 2))}
                className="p-1 text-gray-500 hover:text-purple-600"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
          {/* Color */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Color</p>
            <label className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 cursor-pointer hover:border-purple-300 transition-colors">
              <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: textColor }} />
              <span className="text-sm text-gray-600">Pick</span>
              <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="sr-only" />
            </label>
          </div>
        </div>

        {/* Bold / Italic */}
        <div className="flex gap-2">
          <button onClick={() => setIsBold(!isBold)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors border ${isBold ? 'bg-purple-100 text-purple-700 border-purple-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Bold className="w-4 h-4 mx-auto" />
          </button>
          <button onClick={() => setIsItalic(!isItalic)}
            className={`flex-1 py-2 rounded-xl text-sm italic transition-colors border ${isItalic ? 'bg-purple-100 text-purple-700 border-purple-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Italic className="w-4 h-4 mx-auto" />
          </button>
        </div>

        {/* Add button */}
        <button onClick={onAdd} disabled={fontLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
          {fontLoading ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Loading font…</>
          ) : (
            <><Type className="w-4 h-4" /> Add Text to Design</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="font-semibold text-gray-800 text-sm">{title}</p>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function CtxBtn({ icon, label, onClick, danger, active }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  danger?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
        danger  ? 'text-red-500 hover:bg-red-50' :
        active  ? 'bg-purple-100 text-purple-700' :
                  'text-gray-600 hover:bg-gray-100'
      }`}>
      {icon}{label}
    </button>
  );
}

function DarkToolBtn({ icon, label, onClick, accent, active }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  accent?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
        active  ? 'bg-purple-500 text-white' :
        accent  ? 'bg-white/15 text-white hover:bg-white/25' :
                  'text-white/70 hover:text-white hover:bg-white/10'
      }`}>
      {icon}{label}
    </button>
  );
}
