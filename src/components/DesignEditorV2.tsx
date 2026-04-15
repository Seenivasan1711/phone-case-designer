'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { PhoneModel } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import PhoneFrame from './PhoneFrame';
import {
  ImagePlus, Type, Smile, Palette, MousePointer2, Hand,
  RotateCcw, RotateCw, Download, ShoppingCart,
  ChevronUp, ChevronDown, Copy, Lock, Unlock, Trash2,
  X, Minus, Plus, Bold, Italic, ChevronDown as ChevDown,
  Share2, ArrowLeft, ZoomIn, Upload,
} from 'lucide-react';

// ─── Scale & Export ───────────────────────────────────────────────────────────
const SCALE            = 0.78;
const EXPORT_MULTIPLIER = 3;
const PRINT_MULTIPLIER  = Math.ceil(3 / SCALE);

// ─── Types ────────────────────────────────────────────────────────────────────
type Tool = 'select' | 'hand';
type Tab  = 'edit' | 'text' | 'sticker' | 'bg';

// ─── Fonts ───────────────────────────────────────────────────────────────────
interface FontEntry { name: string; google?: string }

const FONT_GROUPS: { lang: string; emoji: string; fonts: FontEntry[] }[] = [
  {
    lang: 'English', emoji: '🇬🇧',
    fonts: [
      { name: 'Arial' }, { name: 'Georgia' }, { name: 'Impact' },
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
      { name: 'Noto Sans Telugu',  google: 'Noto+Sans+Telugu' },
      { name: 'Baloo Tammudu 2',   google: 'Baloo+Tammudu+2' },
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
  if (!entry.google) return;
  const id = `gfont-${entry.google}`;
  if (document.getElementById(id)) return;
  await new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${entry.google}&display=swap`;
    link.onload = () => resolve(); link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  await document.fonts.ready;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STICKERS = ['⭐', '❤️', '🔥', '✨', '🎨', '🌈', '🦋', '🎯', '💎', '🌸',
                  '😎', '🎵', '🏆', '👑', '🎉', '🍀', '🌺', '🦁', '🐉', '⚡'];

const BG_PRESETS = [
  '#ffffff', '#000000', '#1a1a2e', '#f8fafc',
  '#fee2e2', '#fef9c3', '#dcfce7', '#dbeafe',
  '#f3e8ff', '#fce7f3', '#ffedd5', '#ecfdf5',
];

const MATERIALS = [
  { id: 'plastic-matt',  label: 'Plastic Matt' },
  { id: 'glossy',        label: 'Glossy' },
  { id: 'silicone',      label: 'Silicone Soft' },
  { id: 'leather',       label: 'Leather Look' },
];

// ─── Main component ───────────────────────────────────────────────────────────
interface Props { model: PhoneModel }

export default function DesignEditorV2({ model }: Props) {
  const W = Math.round(model.canvasWidth  * SCALE);
  const H = Math.round(model.canvasHeight * SCALE);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasElRef  = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyRef   = useRef<any[]>([]);
  const historyIdx   = useRef(-1);
  const toolRef      = useRef<Tool>('select');   // stale-closure-safe tool ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricMod    = useRef<any>(null);        // cached fabric module for zoom

  // UI state
  const [activeTab,  setActiveTab]  = useState<Tab>('edit');
  const [tool,       setTool]       = useState<Tool>('select');
  const [zoom,       setZoom]       = useState(1);
  const [material,   setMaterial]   = useState('plastic-matt');
  const [selected,   setSelected]   = useState(false);
  const [locked,     setLocked]     = useState(false);
  const [bgColor,    setBgColor]    = useState('#ffffff');
  const [fontGroupOpen, setFontGroupOpen] = useState<string | null>(null);
  const [addedToCart, setAddedToCart]  = useState(false);
  const [fontLoading, setFontLoading]  = useState(false);
  const [panelOpen,  setPanelOpen]  = useState(true); // left panel visible

  // Text state
  const [textInput,  setTextInput]  = useState('Your Text');
  const [textColor,  setTextColor]  = useState('#1a1a1a');
  const [fontSize,   setFontSize]   = useState(26);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold,     setIsBold]     = useState(false);
  const [isItalic,   setIsItalic]   = useState(false);

  const addItem = useCartStore(s => s.addItem);

  // Keep toolRef in sync
  useEffect(() => { toolRef.current = tool; }, [tool]);

  // ── History ──────────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const json = JSON.stringify(c.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
    historyRef.current.push(json);
    historyIdx.current = historyRef.current.length - 1;
  }, []);

  // ── Canvas init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let canvas: any;

    import('fabric').then(({ fabric }) => {
      if (!canvasElRef.current || fabricRef.current) return;
      fabricMod.current = fabric;

      canvas = new fabric.Canvas(canvasElRef.current, {
        width: W, height: H,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        enableRetinaScaling: true,
      });

      // Selection events
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

      // History
      canvas.on('object:added',    saveHistory);
      canvas.on('object:modified', saveHistory);
      canvas.on('object:removed',  saveHistory);

      // ── Pan with mouse ──────────────────────────────────────────────────────
      let isDragging = false;
      let lastX = 0, lastY = 0;

      canvas.on('mouse:down', (opt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (toolRef.current !== 'hand') return;
        isDragging = true;
        canvas.setCursor('grabbing');
        lastX = opt.e.clientX; lastY = opt.e.clientY;
      });
      canvas.on('mouse:move', (opt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!isDragging || toolRef.current !== 'hand') return;
        const dx = opt.e.clientX - lastX;
        const dy = opt.e.clientY - lastY;
        canvas.relativePan(new fabric.Point(dx, dy));
        lastX = opt.e.clientX; lastY = opt.e.clientY;
      });
      canvas.on('mouse:up', () => {
        isDragging = false;
        if (toolRef.current === 'hand') canvas.setCursor('grab');
      });

      // ── Scroll-wheel zoom ───────────────────────────────────────────────────
      canvas.on('mouse:wheel', (opt: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const delta = opt.e.deltaY;
        let z = canvas.getZoom();
        z = delta > 0 ? z / 1.1 : z * 1.1;
        z = Math.min(Math.max(z, 0.3), 4);
        canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), z);
        setZoom(z);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      fabricRef.current = canvas;
      saveHistory();
    });

    return () => { canvas?.dispose(); fabricRef.current = null; };
  }, [model, W, H, saveHistory]);

  // ── Background color sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setBackgroundColor(bgColor, () => fabricRef.current.renderAll());
  }, [bgColor]);

  // ── Tool mode sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    const c = fabricRef.current; if (!c) return;
    if (tool === 'hand') {
      c.defaultCursor = 'grab';
      c.hoverCursor   = 'grab';
      c.selection = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c.getObjects().forEach((o: any) => { o.selectable = false; o.evented = false; });
    } else {
      c.defaultCursor = 'default';
      c.hoverCursor   = 'move';
      c.selection = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c.getObjects().forEach((o: any) => { o.selectable = true; o.evented = true; });
    }
    c.renderAll();
  }, [tool]);

  // ── Zoom controls ──────────────────────────────────────────────────────────
  const adjustZoom = useCallback((factor: number) => {
    const c = fabricRef.current;
    const fab = fabricMod.current;
    if (!c || !fab) return;
    const newZoom = Math.min(Math.max(c.getZoom() * factor, 0.3), 4);
    c.zoomToPoint(new fab.Point(W / 2, H / 2), newZoom);
    setZoom(newZoom);
  }, [W, H]);

  const resetZoom = useCallback(() => {
    const c = fabricRef.current;
    const fab = fabricMod.current;
    if (!c || !fab) return;
    c.zoomToPoint(new fab.Point(W / 2, H / 2), 1);
    setZoom(1);
  }, [W, H]);

  // ── Add text ──────────────────────────────────────────────────────────────
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
      fabricRef.current?.requestRenderAll();
    });
  }, [textInput, fontSize, textColor, fontFamily, isBold, isItalic, W, H]);

  const handleFontSelect = useCallback(async (entry: FontEntry) => {
    setFontFamily(entry.name);
    setFontGroupOpen(null);
    await loadGoogleFont(entry);
    fabricRef.current?.requestRenderAll();
  }, []);

  // ── Add sticker ────────────────────────────────────────────────────────────
  const addSticker = useCallback((emoji: string) => {
    import('fabric').then(({ fabric }) => {
      const t = new fabric.Text(emoji, {
        left: W / 2 - 20, top: H / 2 - 20, fontSize: 48,
      });
      fabricRef.current?.add(t);
      fabricRef.current?.setActiveObject(t);
      fabricRef.current?.renderAll();
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

  const { getRootProps, getInputProps, open: openFile, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1, noClick: true, noKeyboard: true,
  });

  // ── Object actions ─────────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.getActiveObjects().forEach((o: any) => c.remove(o));
    c.discardActiveObject(); c.renderAll();
  }, []);

  const duplicateSelected = useCallback(() => {
    const c = fabricRef.current;
    const obj = c?.getActiveObject(); if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.clone((cloned: any) => {
      cloned.set({ left: obj.left! + 20, top: obj.top! + 20 });
      c.add(cloned); c.setActiveObject(cloned); c.renderAll();
    });
  }, []);

  const toggleLock = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject(); if (!obj) return;
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
  const exportCanvas = useCallback((multiplier: number) => {
    const c = fabricRef.current; if (!c) return null;
    const active = c.getActiveObject();
    c.discardActiveObject(); c.renderAll();
    const dataUrl = c.toDataURL({ format: 'png', multiplier, enableRetinaScaling: true });
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

  const containerRadius =
    model.id === 'nothing-phone-2' ? 15 :
    model.id.startsWith('pixel')   ? 20 :
    model.id.startsWith('oneplus') ? 30 : 32;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#e5e5e5' }}>

      {/* ════════════════════════════════════════════════════════════
          TOP BAR
      ════════════════════════════════════════════════════════════ */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        {/* Left: back + branding */}
        <div className="flex items-center gap-3">
          <Link href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Models</span>
          </Link>
          <span className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">CC</span>
            </div>
            <span className="font-semibold text-sm text-gray-800 hidden md:inline">CaseCanvas</span>
          </div>
          <span className="h-5 w-px bg-gray-200 hidden md:block" />
          <span className="text-sm font-medium text-gray-600 hidden md:inline">{model.displayName}</span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={downloadDesign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
          <button onClick={exportAndAddToCart}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
              addedToCart
                ? 'bg-green-500 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}>
            <ShoppingCart className="w-4 h-4" />
            {addedToCart ? '✓ Added!' : `Add to Cart — ${formatPrice(model.price)}`}
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          BODY
      ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left icon nav ──────────────────────────────────────── */}
        <nav className="w-[72px] bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 shrink-0 z-10">
          <NavTab id="edit"    icon={<ImagePlus className="w-5 h-5" />}  label="Edit"    active={activeTab==='edit'}    panelOpen={panelOpen} onClick={(t) => { setActiveTab(t); setPanelOpen(activeTab === t ? !panelOpen : true); }} />
          <NavTab id="text"    icon={<Type      className="w-5 h-5" />}  label="Text"    active={activeTab==='text'}    panelOpen={panelOpen} onClick={(t) => { setActiveTab(t); setPanelOpen(activeTab === t ? !panelOpen : true); }} />
          <NavTab id="sticker" icon={<Smile     className="w-5 h-5" />}  label="Sticker" active={activeTab==='sticker'} panelOpen={panelOpen} onClick={(t) => { setActiveTab(t); setPanelOpen(activeTab === t ? !panelOpen : true); }} />
          <NavTab id="bg"      icon={<Palette   className="w-5 h-5" />}  label="BG"      active={activeTab==='bg'}      panelOpen={panelOpen} onClick={(t) => { setActiveTab(t); setPanelOpen(activeTab === t ? !panelOpen : true); }} />
        </nav>

        {/* ── Left expandable panel ──────────────────────────────── */}
        {panelOpen && (
          <aside className="w-[300px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0 z-10 shadow-md">

            {/* Edit / Upload panel */}
            {activeTab === 'edit' && (
              <div className="p-5 space-y-5">
                <h2 className="font-semibold text-gray-900 text-sm">Upload images</h2>

                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  onClick={openFile}
                  className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-10 px-4 ${
                    isDragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-purple-300 bg-purple-50/60 hover:bg-purple-50 hover:border-purple-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {/* Multi-image icon */}
                  <div className="flex items-end gap-1">
                    <div className="w-10 h-12 rounded-lg bg-purple-200/70 border-2 border-purple-300 -rotate-6 flex items-center justify-center">
                      <ImagePlus className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="w-12 h-14 rounded-lg bg-purple-400/30 border-2 border-purple-400 rotate-3 flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openFile(); }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-md shadow-purple-200">
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                  <p className="text-purple-500 text-xs font-medium">
                    {model.canvasWidth} × {model.canvasHeight} px
                  </p>
                </div>

                {/* Material selector */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom material</p>
                  <div className="space-y-1.5">
                    {MATERIALS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMaterial(m.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          material === m.id
                            ? 'border-purple-400 bg-purple-50 text-purple-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {m.label}
                        {material === m.id
                          ? <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center"><span className="text-white text-[8px] font-black">✓</span></div>
                          : <ChevDown className="w-4 h-4 text-gray-400" />
                        }
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model info */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Model ID: <span className="font-mono">{model.id}</span></span>
                </div>
              </div>
            )}

            {/* Text panel */}
            {activeTab === 'text' && (
              <div className="p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">Add Text</h2>

                <div className="space-y-4">
                  {/* Text input */}
                  <input
                    type="text" value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="Type your text…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    style={{ fontFamily, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal' }}
                  />

                  {/* Font picker */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Font</p>
                    <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                      {FONT_GROUPS.map(group => (
                        <div key={group.lang}>
                          <button
                            onClick={() => setFontGroupOpen(fontGroupOpen === group.lang ? null : group.lang)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <span>{group.emoji} {group.lang}</span>
                            <ChevDown className={`w-3 h-3 transition-transform ${fontGroupOpen === group.lang ? 'rotate-180' : ''}`} />
                          </button>
                          {fontGroupOpen === group.lang && (
                            <div className="ml-2 space-y-0.5">
                              {group.fonts.map(f => (
                                <button key={f.name} onClick={() => handleFontSelect(f)}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                                    fontFamily === f.name ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                  style={{ fontFamily: f.name }}>
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

                  {/* Size + color */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Size</p>
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1.5">
                        <button onClick={() => setFontSize(Math.max(8, fontSize - 2))}
                          className="p-1 text-gray-500 hover:text-purple-600"><Minus className="w-3 h-3" /></button>
                        <span className="flex-1 text-center text-sm font-semibold">{fontSize}</span>
                        <button onClick={() => setFontSize(Math.min(96, fontSize + 2))}
                          className="p-1 text-gray-500 hover:text-purple-600"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</p>
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

                  <button onClick={addText} disabled={fontLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    {fontLoading
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Loading font…</>
                      : <><Type className="w-4 h-4" /> Add Text to Design</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Sticker panel */}
            {activeTab === 'sticker' && (
              <div className="p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">Stickers</h2>
                <div className="grid grid-cols-5 gap-2">
                  {STICKERS.map(s => (
                    <button key={s} onClick={() => addSticker(s)}
                      className="text-3xl leading-none py-2 rounded-xl hover:bg-gray-100 transition-colors active:scale-90 border border-transparent hover:border-gray-200">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background panel */}
            {activeTab === 'bg' && (
              <div className="p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">Background Color</h2>
                <div className="flex flex-wrap gap-2.5">
                  {BG_PRESETS.map(c => (
                    <button key={c} onClick={() => setBgColor(c)}
                      className={`w-10 h-10 rounded-full border-[3px] transition-all ${bgColor === c ? 'border-purple-500 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <label className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-purple-400 transition-colors text-xs text-gray-400 font-bold">
                    +<input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="sr-only" />
                  </label>
                </div>
              </div>
            )}

          </aside>
        )}

        {/* ── Canvas stage ───────────────────────────────────────── */}
        <main className="flex-1 relative overflow-hidden flex items-center justify-center min-w-0">
          {/* Drag-anywhere drop overlay */}
          <div {...getRootProps()} className="absolute inset-0 z-0 pointer-events-none">
            <input {...getInputProps()} />
          </div>

          {/* Drag-active visual */}
          {isDragActive && (
            <div className="absolute inset-0 z-20 bg-purple-500/20 border-4 border-dashed border-purple-400 rounded-none flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-xl text-center">
                <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="font-semibold text-purple-700">Drop to upload</p>
              </div>
            </div>
          )}

          {/* Floating context toolbar — appears above phone when object selected */}
          {selected && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 px-3 py-2">
              <V2CtxBtn icon={<ChevronUp   className="w-4 h-4" />} label="Front"  onClick={() => fabricRef.current?.bringForward(fabricRef.current.getActiveObject())} />
              <V2CtxBtn icon={<ChevronDown className="w-4 h-4" />} label="Back"   onClick={() => fabricRef.current?.sendBackwards(fabricRef.current.getActiveObject())} />
              <div className="w-px h-8 bg-gray-100 mx-1" />
              <V2CtxBtn icon={locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                label={locked ? 'Unlock' : 'Lock'} onClick={toggleLock} active={locked} />
              <V2CtxBtn icon={<Copy  className="w-4 h-4" />} label="Copy"   onClick={duplicateSelected} />
              <div className="w-px h-8 bg-gray-100 mx-1" />
              <V2CtxBtn icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={deleteSelected} danger />
            </div>
          )}

          {/* Phone + canvas */}
          <div
            className="relative bg-white"
            style={{
              width: W, height: H,
              borderRadius: containerRadius,
              boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 12px 40px rgba(0,0,0,0.18), 0 30px 80px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}
          >
            <canvas ref={canvasElRef} className="absolute inset-0" />
            <PhoneFrame modelId={model.id} width={W} height={H} />
          </div>

          {/* Bottom zoom bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
                          bg-white rounded-2xl shadow-lg shadow-black/10 border border-gray-200
                          flex items-center divide-x divide-gray-200">
            <button onClick={() => adjustZoom(1 / 1.25)}
              className="px-3.5 py-2.5 text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-l-2xl transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={resetZoom}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors min-w-[56px] text-center">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => adjustZoom(1.25)}
              className="px-3.5 py-2.5 text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-r-2xl transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

        </main>

        {/* ── Right mini toolbar ─────────────────────────────────── */}
        <aside className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-3 gap-1 shrink-0 z-10">
          <RightBtn
            icon={<MousePointer2 className="w-4 h-4" />}
            label="Select" active={tool === 'select'}
            onClick={() => setTool('select')}
          />
          <RightBtn
            icon={<Hand className="w-4 h-4" />}
            label="Pan" active={tool === 'hand'}
            onClick={() => setTool('hand')}
          />
          <div className="w-6 h-px bg-gray-200 my-1" />
          <RightBtn icon={<RotateCcw className="w-4 h-4" />} label="Undo" onClick={undo} />
          <RightBtn icon={<RotateCw  className="w-4 h-4" />} label="Redo" onClick={redo} />
        </aside>

      </div>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function NavTab({
  id, icon, label, active, panelOpen, onClick,
}: {
  id: Tab; icon: React.ReactNode; label: string;
  active: boolean; panelOpen: boolean;
  onClick: (id: Tab) => void;
}) {
  const isOpen = active && panelOpen;
  return (
    <button
      onClick={() => onClick(id)}
      title={label}
      className={`flex flex-col items-center gap-1 w-full py-3 text-[10px] font-semibold transition-all ${
        isOpen
          ? 'text-purple-600 bg-purple-50'
          : 'text-gray-500 hover:text-purple-600 hover:bg-gray-50'
      }`}
    >
      <span className={`p-1.5 rounded-xl transition-colors ${isOpen ? 'bg-purple-100' : ''}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function RightBtn({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode; label: string;
  active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
        active
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {icon}
    </button>
  );
}

function V2CtxBtn({
  icon, label, onClick, danger, active,
}: {
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
