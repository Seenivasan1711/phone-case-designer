'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhoneModel } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import PhoneFrame from './PhoneFrame';
import {
  ImagePlus, Type, Trash2, RotateCcw, RotateCw, ShoppingCart,
  Download, Bold, Italic, ChevronUp, ChevronDown, Copy, Lock,
  Unlock, X, Minus, Plus,
} from 'lucide-react';

const SCALE = 0.65;
const EXPORT_MULTIPLIER = Math.ceil(1 / SCALE) + 1;
const PRINT_MULTIPLIER  = Math.ceil(3 / SCALE);

const FONT_FAMILIES = ['Arial', 'Georgia', 'Courier New', 'Impact', 'Verdana', 'Comic Sans MS'];
const STICKERS = ['⭐', '❤️', '🔥', '✨', '🎨', '🌈', '🦋', '🎯', '💎', '🌸'];
const BG_PRESETS = [
  '#ffffff', '#000000', '#f8fafc', '#fee2e2', '#fef9c3',
  '#dcfce7', '#dbeafe', '#f3e8ff', '#fce7f3', '#ffedd5',
];

interface Props { model: PhoneModel }

export default function DesignEditor({ model }: Props) {
  const W = Math.round(model.canvasWidth  * SCALE);
  const H = Math.round(model.canvasHeight * SCALE);

  const canvasElRef   = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef     = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyRef    = useRef<any[]>([]);
  const historyIdx    = useRef(-1);

  // UI state
  const [panel, setPanel]           = useState<null | 'text' | 'sticker' | 'bg'>( null);
  const [selected, setSelected]     = useState(false);
  const [locked, setLocked]         = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [bgColor, setBgColor]       = useState('#ffffff');

  // Text tool state
  const [textInput, setTextInput]   = useState('Your Text');
  const [textColor, setTextColor]   = useState('#1a1a1a');
  const [fontSize, setFontSize]     = useState(26);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold]         = useState(false);
  const [isItalic, setIsItalic]     = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  // ── History ─────────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const json = JSON.stringify(c.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
    historyRef.current.push(json);
    historyIdx.current = historyRef.current.length - 1;
  }, []);

  // ── Init canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    let canvas: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    import('fabric').then(({ fabric }) => {
      if (!canvasElRef.current || fabricRef.current) return;

      canvas = new fabric.Canvas(canvasElRef.current, {
        width: W, height: H,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });

      // Decorative dashed boundary
      const border = new fabric.Rect({
        left: 0, top: 0, width: W, height: H, rx: 18, ry: 18,
        fill: 'transparent', stroke: '#7c3aed', strokeWidth: 2,
        strokeDashArray: [6, 3], selectable: false, evented: false,
        excludeFromExport: true,
      });
      canvas.add(border);

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

    return () => {
      canvas?.dispose();
      fabricRef.current = null;
    };
  }, [model, W, H, saveHistory]);

  // ── Sync bg color ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.setBackgroundColor(bgColor, () => fabricRef.current.renderAll());
  }, [bgColor]);

  // ── Add text ─────────────────────────────────────────────────────────────
  const addText = useCallback(() => {
    import('fabric').then(({ fabric }) => {
      const text = new fabric.IText(textInput || 'Your Text', {
        left: W / 2 - 60, top: H / 2 - 15,
        fontSize, fill: textColor, fontFamily,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
        editable: true,
      });
      fabricRef.current?.add(text);
      fabricRef.current?.setActiveObject(text);
      fabricRef.current?.renderAll();
      setPanel(null);
    });
  }, [textInput, fontSize, textColor, fontFamily, isBold, isItalic, W, H]);

  // ── Add sticker ──────────────────────────────────────────────────────────
  const addSticker = useCallback((emoji: string) => {
    import('fabric').then(({ fabric }) => {
      const t = new fabric.Text(emoji, {
        left: W / 2 - 20, top: H / 2 - 20, fontSize: 36,
      });
      fabricRef.current?.add(t);
      fabricRef.current?.setActiveObject(t);
      fabricRef.current?.renderAll();
      setPanel(null);
    });
  }, [W, H]);

  // ── Image upload ──────────────────────────────────────────────────────────
  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      import('fabric').then(({ fabric }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fabric.Image.fromURL(url, (img: any) => {
          const maxW = W * 0.85;
          const maxH = H * 0.75;
          if (img.width! > maxW) img.scaleToWidth(maxW);
          if (img.height! * img.scaleY! > maxH) img.scaleToHeight(maxH);
          img.set({
            left: W / 2 - (img.width! * img.scaleX!) / 2,
            top:  H / 2 - (img.height! * img.scaleY!) / 2,
          });
          fabricRef.current?.add(img);
          fabricRef.current?.setActiveObject(img);
          fabricRef.current?.renderAll();
        });
      });
    };
    reader.readAsDataURL(file);
  }, [W, H]);

  const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1, noClick: true, noKeyboard: true,
  });

  // ── Context-menu actions ─────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
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
    const nowLocked = !locked;
    obj.set({
      lockMovementX: nowLocked, lockMovementY: nowLocked,
      lockScalingX:  nowLocked, lockScalingY:  nowLocked,
      lockRotation:  nowLocked, hasControls:   !nowLocked,
    });
    fabricRef.current.renderAll();
    setLocked(nowLocked);
  }, [locked]);

  const bringForward = useCallback(() => {
    fabricRef.current?.bringForward(fabricRef.current.getActiveObject());
  }, []);
  const sendBackward = useCallback(() => {
    fabricRef.current?.sendBackwards(fabricRef.current.getActiveObject());
  }, []);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    const c = fabricRef.current;
    if (!c) return;
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
    const c = fabricRef.current;
    if (!c) return;
    c.off('object:added'); c.off('object:modified');
    c.loadFromJSON(historyRef.current[historyIdx.current], () => {
      c.renderAll();
      c.on('object:added', saveHistory);
      c.on('object:modified', saveHistory);
    });
  }, [saveHistory]);

  // ── Export ───────────────────────────────────────────────────────────────
  const exportAndAddToCart = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dec = c.getObjects().filter((o: any) => o.excludeFromExport);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dec.forEach((o: any) => o.set('visible', false));
    c.renderAll();
    const designImage = c.toDataURL({ format: 'png', multiplier: EXPORT_MULTIPLIER });
    const designJSON  = JSON.stringify(c.toJSON(['excludeFromExport']));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dec.forEach((o: any) => o.set('visible', true));
    c.renderAll();
    addItem({ phoneModel: model, designImage, designJSON, quantity: 1, unitPrice: model.price });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }, [model, addItem]);

  const downloadDesign = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const url = c.toDataURL({ format: 'png', multiplier: PRINT_MULTIPLIER });
    const a = document.createElement('a');
    a.href = url; a.download = `${model.id}-design.png`; a.click();
  }, [model]);

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-4 pb-8">

      {/* ── Canvas + phone frame overlay ── */}
      <div className="relative" style={{ width: W, height: H }}>
        {/* Dropzone wrapper around canvas */}
        <div {...getRootProps()} className="absolute inset-0">
          <input {...getInputProps()} />
          <canvas ref={canvasElRef} />
        </div>

        {/* Phone frame SVG – sits on top, pointer-events: none */}
        <PhoneFrame modelId={model.id} width={W} height={H} />
      </div>

      {/* ── Context toolbar (visible when object selected) ── */}
      {selected && (
        <div className="flex flex-wrap items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg w-full max-w-md">
          <CtxBtn icon={<ChevronUp className="w-4 h-4" />}  label="Forward"   onClick={bringForward} />
          <CtxBtn icon={<ChevronDown className="w-4 h-4" />} label="Backward" onClick={sendBackward} />
          <CtxBtn
            icon={locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            label={locked ? 'Unlock' : 'Lock'}
            onClick={toggleLock}
            active={locked}
          />
          <CtxBtn icon={<Copy className="w-4 h-4" />}   label="Duplicate" onClick={duplicateSelected} />
          <CtxBtn icon={<Trash2 className="w-4 h-4" />} label="Delete"    onClick={deleteSelected} danger />
        </div>
      )}

      {/* ── Slide-up text panel ── */}
      {panel === 'text' && (
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-700 text-sm">Text Options</p>
            <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text" value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your text…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="grid grid-cols-2 gap-2">
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
              className="border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
              {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2">
              <button onClick={() => setFontSize(s => Math.max(8, s - 2))}
                className="p-1 text-gray-500 hover:text-purple-600"><Minus className="w-3 h-3" /></button>
              <span className="flex-1 text-center text-sm font-medium">{fontSize}</span>
              <button onClick={() => setFontSize(s => Math.min(80, s + 2))}
                className="p-1 text-gray-500 hover:text-purple-600"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500">Color</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border-0" />
            <button onClick={() => setIsBold(!isBold)}
              className={`p-1.5 rounded-lg ${isBold ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Bold className="w-4 h-4" />
            </button>
            <button onClick={() => setIsItalic(!isItalic)}
              className={`p-1.5 rounded-lg ${isItalic ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Italic className="w-4 h-4" />
            </button>
          </div>
          <button onClick={addText}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Add Text to Design
          </button>
        </div>
      )}

      {/* ── Sticker panel ── */}
      {panel === 'sticker' && (
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-700 text-sm">Add Sticker</p>
            <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {STICKERS.map((s) => (
              <button key={s} onClick={() => addSticker(s)}
                className="text-3xl hover:scale-125 transition-transform py-1">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Background panel ── */}
      {panel === 'bg' && (
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-700 text-sm">Background Color</p>
            <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {BG_PRESETS.map((c) => (
              <button key={c} onClick={() => { setBgColor(c); setPanel(null); }}
                className={`w-9 h-9 rounded-full border-2 transition-all ${bgColor === c ? 'border-purple-500 scale-110' : 'border-gray-200'}`}
                style={{ backgroundColor: c }} />
            ))}
            <input type="color" value={bgColor}
              onChange={(e) => { setBgColor(e.target.value); setPanel(null); }}
              className="w-9 h-9 rounded-full cursor-pointer border-0" title="Custom" />
          </div>
        </div>
      )}

      {/* ── Main bottom toolbar ── */}
      <div className="w-full max-w-md space-y-3">
        {/* Row 1: tools */}
        <div className="flex items-center justify-center gap-2">
          <ToolBtn onClick={undo}    icon={<RotateCcw className="w-4 h-4" />} label="Undo" />
          <ToolBtn onClick={redo}    icon={<RotateCw  className="w-4 h-4" />} label="Redo" />

          <ToolBtn
            onClick={openFilePicker}
            icon={<ImagePlus className="w-4 h-4" />}
            label="Add Image"
            accent
          />
          <ToolBtn
            onClick={() => setPanel(panel === 'text' ? null : 'text')}
            icon={<Type className="w-4 h-4" />}
            label="Add Text"
            accent
            active={panel === 'text'}
          />
          <ToolBtn
            onClick={() => setPanel(panel === 'sticker' ? null : 'sticker')}
            icon={<span className="text-base leading-none">✨</span>}
            label="Stickers"
            active={panel === 'sticker'}
          />
          <ToolBtn
            onClick={() => setPanel(panel === 'bg' ? null : 'bg')}
            icon={<div className="w-4 h-4 rounded-full border-2 border-gray-400" style={{ backgroundColor: bgColor }} />}
            label="BG"
            active={panel === 'bg'}
          />
          <ToolBtn onClick={downloadDesign} icon={<Download className="w-4 h-4" />} label="Save" />
        </div>

        {/* Row 2: Add to cart */}
        <button onClick={exportAndAddToCart}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-bold transition-all shadow-md ${
            addedToCart
              ? 'bg-green-500 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
          }`}>
          <ShoppingCart className="w-5 h-5" />
          {addedToCart ? 'Added to Cart!' : `Add to Cart — ${formatPrice(model.price)}`}
        </button>

        <p className="text-center text-xs text-gray-400">
          {model.canvasWidth} × {model.canvasHeight} px · {PRINT_MULTIPLIER}× export for 300 DPI print
        </p>
      </div>
    </div>
  );
}

/* ─── Helper button components ────────────────────────────────────── */
function CtxBtn({ icon, label, onClick, danger, active }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  danger?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
        danger  ? 'text-red-500 hover:bg-red-50' :
        active  ? 'bg-purple-100 text-purple-700' :
                  'text-gray-600 hover:bg-gray-100'
      }`}>
      {icon}{label}
    </button>
  );
}

function ToolBtn({ icon, label, onClick, accent, active }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  accent?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
        active  ? 'bg-purple-100 text-purple-700 border-purple-200' :
        accent  ? 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-600' :
                  'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
      }`}>
      {icon}{label}
    </button>
  );
}
