'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { PhoneModel } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import PhoneFrame from './PhoneFrame';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/templates';
import {
  ImagePlus, Type, Smile, Palette, MousePointer2, Hand,
  RotateCcw, RotateCw, Download, ShoppingCart,
  ChevronUp, ChevronDown, Copy, Lock, Unlock, Trash2,
  X, Minus, Plus, Bold, Italic, Upload, Share2, ArrowLeft,
  Layers, Box, BookImage, Save, FolderOpen, RefreshCw,
} from 'lucide-react';

// Three.js viewer is browser-only
const PhoneCase3D = dynamic(() => import('./PhoneCase3D'), { ssr: false });

// ─── Scale & Export ───────────────────────────────────────────────────────────
const SCALE             = 0.78;
const EXPORT_MULTIPLIER = 3;
const PRINT_MULTIPLIER  = Math.ceil(3 / SCALE);
const LS_KEY            = 'zooble-saved-designs';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tool   = 'select' | 'hand';
type Tab    = 'edit' | 'templates' | 'text' | 'sticker' | 'layers' | 'preview3d';
type View   = '2d' | '3d';

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
  { lang: 'Hindi (हिन्दी)',    emoji: '🇮🇳', fonts: [{ name: 'Noto Sans Devanagari', google: 'Noto+Sans+Devanagari' }, { name: 'Hind', google: 'Hind' }, { name: 'Baloo 2', google: 'Baloo+2' }, { name: 'Poppins', google: 'Poppins' }] },
  { lang: 'Tamil (தமிழ்)',    emoji: '🇮🇳', fonts: [{ name: 'Noto Sans Tamil', google: 'Noto+Sans+Tamil' }, { name: 'Catamaran', google: 'Catamaran' }] },
  { lang: 'Telugu (తెలుగు)', emoji: '🇮🇳', fonts: [{ name: 'Noto Sans Telugu', google: 'Noto+Sans+Telugu' }] },
  { lang: 'Bengali (বাংলা)',  emoji: '🇮🇳', fonts: [{ name: 'Noto Sans Bengali', google: 'Noto+Sans+Bengali' }, { name: 'Hind Siliguri', google: 'Hind+Siliguri' }] },
  { lang: 'Kannada (ಕನ್ನಡ)',  emoji: '🇮🇳', fonts: [{ name: 'Noto Sans Kannada', google: 'Noto+Sans+Kannada' }] },
  { lang: 'Malayalam (മലയാളം)', emoji: '🇮🇳', fonts: [{ name: 'Noto Sans Malayalam', google: 'Noto+Sans+Malayalam' }] },
  { lang: 'Arabic (عربي)',    emoji: '🌍', fonts: [{ name: 'Noto Sans Arabic', google: 'Noto+Sans+Arabic' }, { name: 'Cairo', google: 'Cairo' }] },
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
const STICKERS = ['⭐','❤️','🔥','✨','🎨','🌈','🦋','🎯','💎','🌸','😎','🎵','🏆','👑','🎉','🍀','🌺','🦁','🐉','⚡'];
const MATERIALS = [
  { id: 'plastic-matt', label: 'Plastic Matt',   sub: 'Matte finish' },
  { id: 'glossy',       label: 'Glossy',         sub: 'Mirror shine' },
  { id: 'silicone',     label: 'Silicone Soft',  sub: 'Grippy feel'  },
  { id: 'leather',      label: 'Leather Look',   sub: 'Premium texture' },
];

// ─── Saved design type ────────────────────────────────────────────────────────
interface SavedDesign {
  id: string;
  modelId: string;
  name: string;
  thumbnail: string;
  json: string;
  savedAt: number;
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props { model: PhoneModel }

export default function DesignEditorV2({ model }: Props) {
  const W = Math.round(model.canvasWidth  * SCALE);
  const H = Math.round(model.canvasHeight * SCALE);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyRef  = useRef<any[]>([]);
  const historyIdx  = useRef(-1);
  const toolRef     = useRef<Tool>('select');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricMod   = useRef<any>(null);

  // UI
  const [activeTab,    setActiveTab]    = useState<Tab>('edit');
  const [panelOpen,    setPanelOpen]    = useState(true);
  const [tool,         setTool]         = useState<Tool>('select');
  const [view,         setView]         = useState<View>('2d');
  const [zoom,         setZoom]         = useState(1);
  const [material,     setMaterial]     = useState('plastic-matt');
  const [selected,     setSelected]     = useState(false);
  const [locked,       setLocked]       = useState(false);
  const [bgColor,      setBgColor]      = useState('#ffffff');
  const [addedToCart,  setAddedToCart]  = useState(false);
  const [fontGroupOpen,setFontGroupOpen]= useState<string|null>(null);
  const [fontLoading,  setFontLoading]  = useState(false);
  const [designDataUrl,setDesignDataUrl]= useState<string|null>(null);
  const [templateCat,  setTemplateCat]  = useState<string>('all');
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [saveNameDlg,  setSaveNameDlg]  = useState(false);
  const [saveName,     setSaveName]     = useState('');
  const [shareToast,   setShareToast]   = useState(false);
  const [pendingJson,  setPendingJson]  = useState<string | null>(null);
  const [confirmLoadOpen, setConfirmLoadOpen] = useState(false);

  // Text
  const [textInput,  setTextInput]  = useState('Your Text');
  const [textColor,  setTextColor]  = useState('#1a1a1a');
  const [fontSize,   setFontSize]   = useState(26);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold,     setIsBold]     = useState(false);
  const [isItalic,   setIsItalic]   = useState(false);

  const addItem = useCartStore(s => s.addItem);

  // Sync toolRef
  useEffect(() => { toolRef.current = tool; }, [tool]);

  // Load saved designs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSavedDesigns(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

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

      canvas.on('selection:created', () => { setSelected(true); setLocked(!!(canvas.getActiveObject() as any)?.lockMovementX); });
      canvas.on('selection:updated', () => { setSelected(true); setLocked(!!(canvas.getActiveObject() as any)?.lockMovementX); });
      canvas.on('selection:cleared',  () => { setSelected(false); setLocked(false); });
      canvas.on('object:added',    saveHistory);
      canvas.on('object:modified', saveHistory);
      canvas.on('object:removed',  saveHistory);

      // Pan
      let isDragging = false, lastX = 0, lastY = 0;
      canvas.on('mouse:down', (opt: any) => { // eslint-disable-line
        if (toolRef.current !== 'hand') return;
        isDragging = true; canvas.setCursor('grabbing');
        lastX = opt.e.clientX; lastY = opt.e.clientY;
      });
      canvas.on('mouse:move', (opt: any) => { // eslint-disable-line
        if (!isDragging || toolRef.current !== 'hand') return;
        canvas.relativePan(new fabric.Point(opt.e.clientX - lastX, opt.e.clientY - lastY));
        lastX = opt.e.clientX; lastY = opt.e.clientY;
      });
      canvas.on('mouse:up', () => { isDragging = false; if (toolRef.current === 'hand') canvas.setCursor('grab'); });

      // Scroll zoom — gentle factor, only when Ctrl/Cmd held (like Figma)
      // or always-on with a very gentle step so it doesn't jump to 400%
      canvas.on('mouse:wheel', (opt: any) => { // eslint-disable-line
        const factor = opt.e.deltaY > 0 ? 0.95 : 1.05; // very gentle
        let z = canvas.getZoom() * factor;
        z = Math.min(Math.max(z, 0.5), 3);
        canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), z);
        setZoom(z);
        opt.e.preventDefault(); opt.e.stopPropagation();
      });

      fabricRef.current = canvas;
      saveHistory();
    });
    return () => { canvas?.dispose(); fabricRef.current = null; };
  }, [model, W, H, saveHistory]);

  // Sync background
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setBackgroundColor(bgColor, () => fabricRef.current.renderAll());
  }, [bgColor]);

  // Sync tool mode
  useEffect(() => {
    const c = fabricRef.current; if (!c) return;
    if (tool === 'hand') {
      c.defaultCursor = 'grab'; c.hoverCursor = 'grab'; c.selection = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c.getObjects().forEach((o: any) => { o.selectable = false; o.evented = false; });
    } else {
      c.defaultCursor = 'default'; c.hoverCursor = 'move'; c.selection = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c.getObjects().forEach((o: any) => { o.selectable = true; o.evented = true; });
    }
    c.renderAll();
  }, [tool]);

  // Refresh 3D texture when switching to 3D view
  useEffect(() => {
    if (view !== '3d') return;
    const c = fabricRef.current; if (!c) return;
    const url = c.toDataURL({ format: 'png', multiplier: 2 });
    setDesignDataUrl(url);
  }, [view]);

  // ── Zoom ─────────────────────────────────────────────────────────────────────
  const adjustZoom = useCallback((factor: number) => {
    const c = fabricRef.current; const fab = fabricMod.current;
    if (!c || !fab) return;
    const newZ = Math.min(Math.max(c.getZoom() * factor, 0.3), 4);
    c.zoomToPoint(new fab.Point(W / 2, H / 2), newZ);
    setZoom(newZ);
  }, [W, H]);

  const resetZoom = useCallback(() => {
    const c = fabricRef.current; const fab = fabricMod.current;
    if (!c || !fab) return;
    c.zoomToPoint(new fab.Point(W / 2, H / 2), 1);
    setZoom(1);
  }, [W, H]);

  // ── Export ────────────────────────────────────────────────────────────────────
  const exportCanvas = useCallback((multiplier: number) => {
    const c = fabricRef.current; if (!c) return null;
    const active = c.getActiveObject();
    c.discardActiveObject(); c.renderAll();
    const url = c.toDataURL({ format: 'png', multiplier, enableRetinaScaling: true });
    if (active) { c.setActiveObject(active); c.renderAll(); }
    return url;
  }, []);

  const exportAndAddToCart = useCallback(() => {
    const designImage = exportCanvas(EXPORT_MULTIPLIER);
    if (!designImage) return;
    addItem({ phoneModel: model, designImage, designJSON: JSON.stringify(fabricRef.current?.toJSON() ?? {}), quantity: 1, unitPrice: model.price });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }, [model, addItem, exportCanvas]);

  const downloadDesign = useCallback(() => {
    const url = exportCanvas(PRINT_MULTIPLIER);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `${model.id}-design.png`; a.click();
  }, [model, exportCanvas]);

  // ── Save to localStorage ──────────────────────────────────────────────────────
  const saveToLocal = useCallback((name: string) => {
    const c = fabricRef.current; if (!c) return;
    const thumbnail = c.toDataURL({ format: 'png', multiplier: 0.5 });
    const json = JSON.stringify(c.toJSON());
    const design: SavedDesign = {
      id: Date.now().toString(),
      modelId: model.id,
      name: name || `Design ${Date.now()}`,
      thumbnail, json,
      savedAt: Date.now(),
    };
    const existing = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; } })();
    const updated = [design, ...existing].slice(0, 20);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setSavedDesigns(updated);
  }, [model.id]);

  const exportDesignJSON = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const json = JSON.stringify({ modelId: model.id, canvas: c.toJSON() }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${model.id}-design.json`; a.click();
  }, [model.id]);

  const loadDesignJSON = useCallback((json: string, confirmed = false) => {
    const c = fabricRef.current; if (!c) return;
    const hasObjects = c.getObjects().length > 0;
    if (hasObjects && !confirmed) {
      // Ask user before overwriting — store pending load and show confirm dialog
      setPendingJson(json);
      setConfirmLoadOpen(true);
      return;
    }
    try {
      const parsed = JSON.parse(json);
      const canvasJson = parsed.canvas ?? parsed;
      c.loadFromJSON(canvasJson, () => { c.renderAll(); saveHistory(); });
    } catch { /* ignore bad json */ }
  }, [saveHistory]);

  const loadSavedDesign = useCallback((design: SavedDesign) => {
    loadDesignJSON(design.json);
  }, [loadDesignJSON]);

  const deleteSavedDesign = useCallback((id: string) => {
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }, [savedDesigns]);

  // ── Apply template ─────────────────────────────────────────────────────────
  const applyTemplate = useCallback((templateId: string) => {
    const tpl = TEMPLATES.find(t => t.id === templateId); if (!tpl) return;
    const c = fabricRef.current; if (!c) return;
    import('fabric').then(({ fabric }) => {
      const { bgColor: bg, objects } = tpl.build(W, H);
      c.clear();
      c.setBackgroundColor(bg, () => {});
      setBgColor(bg);

      objects.forEach(obj => {
        if (obj.type === 'rect') {
          const r = new fabric.Rect({
            left: obj.left ?? 0, top: obj.top ?? 0,
            width: obj.width ?? 100, height: obj.height ?? 100,
            fill: obj.fill ?? 'transparent',
            rx: obj.rx ?? 0, ry: obj.rx ?? 0,
            stroke: obj.stroke, strokeWidth: obj.strokeWidth,
            opacity: obj.opacity ?? 1,
            selectable: false, evented: false,
          });
          c.add(r);
        } else if (obj.type === 'circle') {
          const circ = new fabric.Ellipse({
            left: obj.left ?? 0, top: obj.top ?? 0,
            rx: (obj.width ?? 100) / 2, ry: (obj.height ?? 100) / 2,
            fill: obj.fill ?? '#fff',
            stroke: obj.stroke, strokeWidth: obj.strokeWidth,
            opacity: obj.opacity ?? 1,
            selectable: false, evented: false,
          });
          c.add(circ);
        } else if (obj.type === 'text') {
          const txt = new fabric.Text(obj.text ?? '', {
            left: obj.left ?? 0, top: obj.top ?? 0,
            fontFamily: obj.fontFamily ?? 'Arial',
            fontSize: obj.fontSize ?? 20,
            fill: obj.fill ?? '#000',
            opacity: obj.opacity ?? 1,
            selectable: true, evented: true,
          });
          c.add(txt);
        }
      });

      c.renderAll();
      saveHistory();
    });
  }, [W, H, saveHistory]);

  // ── Visible canvas center (accounts for zoom/pan) ────────────────────────
  const getVisibleCenter = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return { x: W / 2, y: H / 2 };
    const vpt = c.viewportTransform ?? [1,0,0,1,0,0];
    const z = c.getZoom();
    return { x: (W / 2 - vpt[4]) / z, y: (H / 2 - vpt[5]) / z };
  }, [W, H]);

  // ── Add text ──────────────────────────────────────────────────────────────
  const addText = useCallback(async () => {
    const entry = ALL_FONTS.find(f => f.name === fontFamily) ?? { name: fontFamily };
    setFontLoading(true);
    await loadGoogleFont(entry);
    setFontLoading(false);
    import('fabric').then(({ fabric }) => {
      const { x, y } = getVisibleCenter();
      const text = new fabric.IText(textInput || 'Your Text', {
        left: x - 60, top: y - 15,
        fontSize, fill: textColor, fontFamily,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle:  isItalic ? 'italic' : 'normal',
        editable: true,
      });
      fabricRef.current?.add(text);
      fabricRef.current?.setActiveObject(text);
      fabricRef.current?.requestRenderAll();
    });
  }, [textInput, fontSize, textColor, fontFamily, isBold, isItalic, getVisibleCenter]);

  const handleFontSelect = useCallback(async (entry: FontEntry) => {
    setFontFamily(entry.name);
    setFontGroupOpen(null);
    await loadGoogleFont(entry);
    fabricRef.current?.requestRenderAll();
  }, []);

  // ── Add sticker ────────────────────────────────────────────────────────────
  const addSticker = useCallback((emoji: string) => {
    import('fabric').then(({ fabric }) => {
      const { x, y } = getVisibleCenter();
      const t = new fabric.Text(emoji, { left: x - 24, top: y - 24, fontSize: 48 });
      fabricRef.current?.add(t);
      fabricRef.current?.setActiveObject(t);
      fabricRef.current?.renderAll();
    });
  }, [getVisibleCenter]);

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
          img.set({ left: W / 2 - (img.width! * img.scaleX!) / 2, top: H / 2 - (img.height! * img.scaleY!) / 2 });
          const c = fabricRef.current; if (!c) return;
          // Always reset zoom to 1 when adding an image so it's fully visible
          const fab2 = fabricMod.current;
          if (fab2 && c.getZoom() !== 1) {
            c.zoomToPoint(new fab2.Point(W / 2, H / 2), 1);
            setZoom(1);
          }
          c.add(img);
          c.setActiveObject(img);
          c.renderAll();
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
    obj.set({ lockMovementX: now, lockMovementY: now, lockScalingX: now, lockScalingY: now, lockRotation: now, hasControls: !now });
    fabricRef.current.renderAll(); setLocked(now);
  }, [locked]);

  // Restore a history snapshot without triggering new history entries
  const restoreSnapshot = useCallback((json: string) => {
    const c = fabricRef.current; if (!c) return;
    // Temporarily suppress all history-triggering events
    c.off('object:added');
    c.off('object:modified');
    c.off('object:removed');
    c.loadFromJSON(json, () => {
      c.renderAll();
      // Re-attach after restoration
      c.on('object:added',    saveHistory);
      c.on('object:modified', saveHistory);
      c.on('object:removed',  saveHistory);
    });
  }, [saveHistory]);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    restoreSnapshot(historyRef.current[historyIdx.current]);
  }, [restoreSnapshot]);

  const redo = useCallback(() => {
    if (historyIdx.current >= historyRef.current.length - 1) return;
    historyIdx.current += 1;
    restoreSnapshot(historyRef.current[historyIdx.current]);
  }, [restoreSnapshot]);

  const containerRadius = model.id === 'nothing-phone-2' ? 15 : model.id.startsWith('pixel') ? 20 : model.id.startsWith('oneplus') ? 30 : 32;

  // Filtered templates
  const filteredTemplates = templateCat === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === templateCat);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#f0f0f0]">

      {/* ════ TOP BAR ════════════════════════════════════════════════════════ */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <span className="h-5 w-px bg-gray-200" />
          {/* Zooble wordmark */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-black tracking-tight">Z</span>
            </div>
            <span className="font-bold text-sm text-gray-900 hidden sm:inline tracking-tight">Zooble</span>
          </div>
          <span className="h-5 w-px bg-gray-200 hidden md:block" />
          <span className="text-sm text-gray-500 hidden md:inline">{model.displayName}</span>
        </div>

        {/* Center: 2D / 3D toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setView('2d')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === '2d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            2D Edit
          </button>
          <button onClick={() => { setView('3d'); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === '3d' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Box className="w-3.5 h-3.5" /> 3D Preview
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button onClick={() => {
              navigator.clipboard.writeText(window.location.href).catch(() => {});
              setShareToast(true);
              setTimeout(() => setShareToast(false), 2000);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
            <Share2 className="w-4 h-4" />
          </button>
          {/* Download */}
          <button onClick={downloadDesign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
          {/* Add to cart */}
          <button onClick={exportAndAddToCart}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${addedToCart ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90 text-white shadow-md shadow-purple-200'}`}>
            <ShoppingCart className="w-4 h-4" />
            {addedToCart ? '✓ Added!' : `Add to Cart — ${formatPrice(model.price)}`}
          </button>
        </div>
      </header>

      {/* ════ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left icon strip ── */}
        <nav className="w-[68px] bg-white border-r border-gray-200 flex flex-col items-center py-2 gap-0.5 shrink-0 z-10">
          {([
            { id: 'edit',      icon: <ImagePlus className="w-5 h-5" />,   label: 'Edit'      },
            { id: 'templates', icon: <BookImage  className="w-5 h-5" />,  label: 'Templates' },
            { id: 'text',      icon: <Type       className="w-5 h-5" />,  label: 'Text'      },
            { id: 'sticker',   icon: <Smile      className="w-5 h-5" />,  label: 'Sticker'   },
            { id: 'layers',    icon: <Layers     className="w-5 h-5" />,  label: 'Save'      },
          ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(({ id, icon, label }) => {
            const isActive = activeTab === id && panelOpen;
            return (
              <button key={id} onClick={() => { setActiveTab(id); setPanelOpen(activeTab === id ? !panelOpen : true); }}
                className={`relative w-full flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-all ${isActive ? 'text-violet-600' : 'text-gray-400 hover:text-gray-700'}`}>
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-violet-600 rounded-r-full" />}
                <span className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* ── Left panel ── */}
        {panelOpen && (
          <aside className="w-[300px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0 z-10 shadow-lg">

            {/* EDIT */}
            {activeTab === 'edit' && (
              <div className="p-5 space-y-5">
                <h2 className="font-semibold text-gray-900">Upload Image</h2>
                <div {...getRootProps()} onClick={openFile}
                  className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-10 px-4 ${isDragActive ? 'border-violet-500 bg-violet-50' : 'border-violet-300 bg-violet-50/40 hover:bg-violet-50 hover:border-violet-400'}`}>
                  <input {...getInputProps()} />
                  <div className="flex items-end gap-1">
                    <div className="w-10 h-12 rounded-lg bg-violet-200/60 border-2 border-violet-300 -rotate-6 flex items-center justify-center">
                      <ImagePlus className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="w-12 h-14 rounded-lg bg-violet-400/25 border-2 border-violet-400 rotate-3 flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-violet-600" />
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openFile(); }}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-md shadow-violet-200">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <p className="text-violet-500 text-xs font-medium">{model.canvasWidth} × {model.canvasHeight} px</p>
                </div>

                {/* Material */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Finish / Material</p>
                  <div className="space-y-1.5">
                    {MATERIALS.map(m => (
                      <button key={m.id} onClick={() => setMaterial(m.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${material === m.id ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}>
                        <div className="text-left">
                          <p className="font-medium">{m.label}</p>
                          <p className="text-xs text-gray-400">{m.sub}</p>
                        </div>
                        {material === m.id
                          ? <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shrink-0"><span className="text-white text-[9px] font-black">✓</span></div>
                          : <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BG color quick pick */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Background</p>
                  <div className="flex flex-wrap gap-2">
                    {['#ffffff','#000000','#1a1a2e','#f8fafc','#fee2e2','#fef9c3','#dcfce7','#dbeafe','#f3e8ff','#fce7f3'].map(c => (
                      <button key={c} onClick={() => setBgColor(c)}
                        className={`w-9 h-9 rounded-full border-[3px] transition-all ${bgColor === c ? 'border-violet-500 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                    <label className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-violet-400 text-xs text-gray-400 font-bold">
                      +<input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="sr-only" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Templates</h2>
                {/* Category tabs */}
                <div className="flex gap-1 flex-wrap">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setTemplateCat(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${templateCat === cat.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
                {/* Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {filteredTemplates.map(tpl => (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl.id)}
                      className="group relative rounded-2xl overflow-hidden border-2 border-transparent hover:border-violet-400 transition-all aspect-[9/16] shadow-sm">
                      <div className="absolute inset-0" style={{ background: tpl.preview }} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-[11px] font-semibold">{tpl.name}</p>
                        <p className="text-white/60 text-[9px] capitalize">{tpl.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEXT */}
            {activeTab === 'text' && (
              <div className="p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Add Text</h2>
                <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                  placeholder="Type your text…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  style={{ fontFamily, fontWeight: isBold ? 'bold' : 'normal', fontStyle: isItalic ? 'italic' : 'normal' }} />

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Font</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {FONT_GROUPS.map(group => (
                      <div key={group.lang}>
                        <button onClick={() => setFontGroupOpen(fontGroupOpen === group.lang ? null : group.lang)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                          <span>{group.emoji} {group.lang}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${fontGroupOpen === group.lang ? 'rotate-180' : ''}`} />
                        </button>
                        {fontGroupOpen === group.lang && (
                          <div className="ml-2 space-y-0.5">
                            {group.fonts.map(f => (
                              <button key={f.name} onClick={() => handleFontSelect(f)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${fontFamily === f.name ? 'bg-violet-100 text-violet-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                                style={{ fontFamily: f.name }}>
                                {f.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Size</p>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1.5">
                      <button onClick={() => setFontSize(Math.max(8, fontSize - 2))} className="p-1 text-gray-500 hover:text-violet-600"><Minus className="w-3 h-3" /></button>
                      <span className="flex-1 text-center text-sm font-semibold">{fontSize}</span>
                      <button onClick={() => setFontSize(Math.min(96, fontSize + 2))} className="p-1 text-gray-500 hover:text-violet-600"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Color</p>
                    <label className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 cursor-pointer hover:border-violet-300 transition-colors">
                      <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: textColor }} />
                      <span className="text-sm text-gray-600">Pick</span>
                      <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="sr-only" />
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setIsBold(!isBold)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border ${isBold ? 'bg-violet-100 text-violet-700 border-violet-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <Bold className="w-4 h-4 mx-auto" />
                  </button>
                  <button onClick={() => setIsItalic(!isItalic)}
                    className={`flex-1 py-2 rounded-xl text-sm italic border ${isItalic ? 'bg-violet-100 text-violet-700 border-violet-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <Italic className="w-4 h-4 mx-auto" />
                  </button>
                </div>

                <button onClick={addText} disabled={fontLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  {fontLoading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Loading…</> : <><Type className="w-4 h-4" />Add Text</>}
                </button>
              </div>
            )}

            {/* STICKER */}
            {activeTab === 'sticker' && (
              <div className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Stickers</h2>
                <div className="grid grid-cols-5 gap-2">
                  {STICKERS.map(s => (
                    <button key={s} onClick={() => addSticker(s)}
                      className="text-3xl leading-none py-2 rounded-xl hover:bg-gray-100 active:scale-90 transition-all border border-transparent hover:border-gray-200">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SAVE / LOAD */}
            {activeTab === 'layers' && (
              <div className="p-5 space-y-5">
                <h2 className="font-semibold text-gray-900">Save & Load</h2>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSaveNameDlg(true)}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold transition-colors">
                    <Save className="w-5 h-5" /> Save to Browser
                  </button>
                  <button onClick={exportDesignJSON}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors">
                    <Download className="w-5 h-5" /> Export JSON
                  </button>
                  <label className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer col-span-2">
                    <FolderOpen className="w-5 h-5" /> Load JSON File
                    <input type="file" accept=".json" className="sr-only" onChange={e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      f.text().then(loadDesignJSON);
                    }} />
                  </label>
                </div>

                {/* Saved designs */}
                {savedDesigns.filter(d => d.modelId === model.id).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Saved Designs</p>
                    <div className="space-y-2">
                      {savedDesigns.filter(d => d.modelId === model.id).map(d => (
                        <div key={d.id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={d.thumbnail} alt={d.name} className="w-12 h-16 rounded-lg object-cover shrink-0 border border-gray-200" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                            <p className="text-xs text-gray-400">{new Date(d.savedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => loadSavedDesign(d)} className="p-1.5 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors" title="Load">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteSavedDesign(d.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </aside>
        )}

        {/* ════ CANVAS STAGE ═════════════════════════════════════════════════ */}
        <main className="flex-1 relative overflow-hidden flex items-center justify-center min-w-0 bg-[#e5e5e5]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}>

          {/* Drag overlay */}
          <div {...getRootProps()} className="absolute inset-0 z-0 pointer-events-none"><input {...getInputProps()} /></div>
          {isDragActive && (
            <div className="absolute inset-0 z-20 bg-violet-500/15 border-4 border-dashed border-violet-400 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-2xl px-8 py-5 shadow-xl text-center">
                <Upload className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                <p className="font-bold text-violet-700">Drop to upload</p>
              </div>
            </div>
          )}

          {/* Context toolbar */}
          {selected && view === '2d' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2">
              <V2Ctx icon={<ChevronUp   className="w-4 h-4" />} label="Front"  onClick={() => fabricRef.current?.bringForward(fabricRef.current.getActiveObject())} />
              <V2Ctx icon={<ChevronDown className="w-4 h-4" />} label="Back"   onClick={() => fabricRef.current?.sendBackwards(fabricRef.current.getActiveObject())} />
              <div className="w-px h-8 bg-gray-100 mx-1" />
              <V2Ctx icon={locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />} label={locked ? 'Unlock' : 'Lock'} onClick={toggleLock} active={locked} />
              <V2Ctx icon={<Copy  className="w-4 h-4" />} label="Copy"   onClick={duplicateSelected} />
              <div className="w-px h-8 bg-gray-100 mx-1" />
              <V2Ctx icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={deleteSelected} danger />
            </div>
          )}

          {/* ── 2D Canvas — always in DOM so Fabric keeps its state ── */}
          <div
            className="relative bg-white"
            style={{
              width: W, height: H,
              borderRadius: containerRadius,
              boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.16), 0 28px 70px rgba(0,0,0,0.10)',
              overflow: 'hidden',
              display: view === '2d' ? 'block' : 'none',
            }}>
            <canvas ref={canvasElRef} className="absolute inset-0" />
            <PhoneFrame modelId={model.id} width={W} height={H} />
          </div>

          {/* ── 3D Preview ── */}
          {view === '3d' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-full h-full">
                <PhoneCase3D
                  designDataUrl={designDataUrl}
                  materialType={material}
                  canvasWidth={W}
                  canvasHeight={H}
                />
              </div>
              <p className="absolute bottom-20 text-xs text-gray-400 pointer-events-none select-none">
                Drag to rotate · Scroll to zoom
              </p>
            </div>
          )}

          {/* Bottom zoom bar (2D only) */}
          {view === '2d' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center divide-x divide-gray-200">
              <button onClick={() => adjustZoom(1 / 1.2)} className="px-3.5 py-2.5 text-gray-600 hover:text-violet-600 hover:bg-gray-50 rounded-l-2xl transition-colors"><Minus className="w-4 h-4" /></button>
              <button onClick={resetZoom} title="Click to reset to 100%" className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-violet-600 transition-colors min-w-[60px] text-center">{Math.round(zoom * 100)}%</button>
              <button onClick={() => adjustZoom(1.2)} className="px-3.5 py-2.5 text-gray-600 hover:text-violet-600 hover:bg-gray-50 rounded-r-2xl transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          )}

        </main>

        {/* ── Right mini toolbar ── */}
        <aside className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-3 gap-1 shrink-0 z-10">
          <RightBtn icon={<MousePointer2 className="w-4 h-4" />} label="Select" active={tool==='select'} onClick={() => setTool('select')} />
          <RightBtn icon={<Hand         className="w-4 h-4" />} label="Pan"    active={tool==='hand'}   onClick={() => setTool('hand')} />
          <div className="w-6 h-px bg-gray-200 my-1" />
          <RightBtn icon={<RotateCcw className="w-4 h-4" />} label="Undo" onClick={undo} />
          <RightBtn icon={<RotateCw  className="w-4 h-4" />} label="Redo" onClick={redo} />
        </aside>
      </div>

      {/* ── Save dialog ── */}
      {saveNameDlg && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Save Design</h3>
              <button onClick={() => setSaveNameDlg(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <input autoFocus type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
              placeholder={`My ${model.displayName} design`}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-300"
              onKeyDown={e => { if (e.key === 'Enter') { saveToLocal(saveName); setSaveNameDlg(false); setSaveName(''); } }}
            />
            <div className="flex gap-2">
              <button onClick={() => setSaveNameDlg(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => { saveToLocal(saveName); setSaveNameDlg(false); setSaveName(''); }}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm overwrite dialog ── */}
      {confirmLoadOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-amber-600 text-lg">⚠️</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Replace current design?</h3>
                <p className="text-gray-500 text-xs mt-1">Loading this file will clear your current canvas. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmLoadOpen(false); setPendingJson(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                Keep Current
              </button>
              <button onClick={() => {
                  setConfirmLoadOpen(false);
                  if (pendingJson) { loadDesignJSON(pendingJson, true); setPendingJson(null); }
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors">
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <span className="text-green-400">✓</span> Link copied to clipboard!
        </div>
      )}
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function RightBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}>
      {icon}
    </button>
  );
}

function V2Ctx({ icon, label, onClick, danger, active }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl text-[10px] font-semibold transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : active ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:bg-gray-100'}`}>
      {icon}{label}
    </button>
  );
}
