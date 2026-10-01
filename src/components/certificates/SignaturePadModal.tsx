import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Check,
  PenTool,
  Upload,
  Sparkles,
  Trash2,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Feather
} from 'lucide-react';
import { toast } from 'react-toastify';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string) => void;
  currentSignature?: string;
  signatoryTitle?: string;
  signatoryName?: string;
}

interface Point {
  x: number;
  y: number;
}

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

const PEN_COLORS = [
  { label: 'Executive Navy', value: '#0b1b2d', colorClass: 'bg-[#0b1b2d]' },
  { label: 'Royal Blue', value: '#1d4ed8', colorClass: 'bg-blue-700' },
  { label: 'Luxury Gold', value: '#9a7016', colorClass: 'bg-amber-600' },
  { label: 'Fountain Black', value: '#000000', colorClass: 'bg-black' }
];

const PEN_WIDTHS = [
  { label: 'Fine', value: 1.8 },
  { label: 'Medium', value: 2.8 },
  { label: 'Broad', value: 4.2 }
];

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  currentSignature,
  signatoryTitle = 'General Manager',
  signatoryName = 'Dr. Faisal Al-Ghamdi'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<'draw' | 'upload' | 'preset'>('draw');
  const [penColor, setPenColor] = useState<string>('#0b1b2d');
  const [penWidth, setPenWidth] = useState<number>(2.8);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(Boolean(currentSignature));
  const [previewDataUrl, setPreviewDataUrl] = useState<string>(currentSignature || '');

  // Synchronize state when modal opens or currentSignature prop updates
  useEffect(() => {
    if (isOpen) {
      setPreviewDataUrl(currentSignature || '');
      setHasSignature(Boolean(currentSignature));
      setStrokes([]);
      setCurrentStroke(null);
    }
  }, [isOpen, currentSignature]);

  // Setup canvas high-DPI scaling once when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    // Give modal time to mount
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redrawAllStrokes(strokes, ctx);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const redrawAllStrokes = (strokesToDraw: Stroke[], context?: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = context || canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Draw baseline guideline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, rect.height - 35);
    ctx.lineTo(rect.width - 30, rect.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw all completed strokes
    strokesToDraw.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }

      if (stroke.points.length > 1) {
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    });

    ctx.restore();
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentStroke([coords]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const newStroke = [...currentStroke, coords];
    setCurrentStroke(newStroke);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const p1 = currentStroke[currentStroke.length - 1];
    const p2 = coords;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);

    if (currentStroke.length >= 1) {
      const updated = [
        ...strokes,
        {
          points: currentStroke,
          color: penColor,
          width: penWidth
        }
      ];
      setStrokes(updated);
      setHasSignature(true);
      updateDataUrl(updated);
    }
    setCurrentStroke(null);
  };

  const updateDataUrl = (currentStrokes: Stroke[]): string => {
    const canvas = canvasRef.current;
    if (!canvas || currentStrokes.length === 0) {
      setPreviewDataUrl('');
      return '';
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Render cleanly to an off-screen canvas without the dashed guide line
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(rect.width * dpr, 400);
    offscreen.height = Math.max(rect.height * dpr, 160);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.scale(dpr, dpr);

    currentStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        ctx.fillStyle = stroke.color;
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    });

    const dataUrl = offscreen.toDataURL('image/png');
    setPreviewDataUrl(dataUrl);
    return dataUrl;
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setHasSignature(false);
    setPreviewDataUrl('');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redrawAllStrokes([], ctx);
      }
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawAllStrokes(newStrokes);
    updateDataUrl(newStrokes);
    if (newStrokes.length === 0) {
      setHasSignature(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image (PNG, JPG, or SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setPreviewDataUrl(res);
        setHasSignature(true);
        toast.success('Signature image loaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (presetSvg: string) => {
    setPreviewDataUrl(presetSvg);
    setHasSignature(true);
    toast.success('Executive signature preset applied!');
  };

  const handleSave = () => {
    let finalDataUrl = previewDataUrl;
    if (!finalDataUrl && strokes.length > 0) {
      finalDataUrl = updateDataUrl(strokes);
    }
    if (!finalDataUrl) {
      toast.error('Please draw or upload a signature before saving.');
      return;
    }
    onSaveSignature(finalDataUrl);
    toast.success('Signature embedded into certificate!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Executive Signature Canvas</h3>
              <p className="text-[11px] text-slate-300">
                Draw or embed official signature for <span className="text-amber-300 font-semibold">{signatoryTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              mode === 'draw'
                ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Draw Signature</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('preset')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              mode === 'preset'
                ? 'bg-white text-amber-700 border-t-2 border-amber-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Presets</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {mode === 'draw' && (
            <div className="space-y-3">
              {/* Pen Color & Width Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                {/* Colors */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Ink:</span>
                  {PEN_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setPenColor(col.value)}
                      title={col.label}
                      className={`w-6 h-6 rounded-full ${col.colorClass} border-2 transition-transform cursor-pointer ${
                        penColor === col.value
                          ? 'border-amber-500 scale-110 shadow-xs'
                          : 'border-transparent hover:scale-105 opacity-80'
                      }`}
                    />
                  ))}
                </div>

                {/* Pen Widths */}
                <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Stroke:</span>
                  {PEN_WIDTHS.map((pw) => (
                    <button
                      key={pw.label}
                      type="button"
                      onClick={() => setPenWidth(pw.value)}
                      className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                        penWidth === pw.value
                          ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      {pw.label}
                    </button>
                  ))}
                </div>

                {/* Actions: Undo / Clear */}
                <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={strokes.length === 0}
                    className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
                    title="Undo Stroke"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={strokes.length === 0}
                    className="p-1.5 rounded text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Drawing Canvas */}
              <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 block touch-none"
                  style={{ width: '100%', height: '176px' }}
                />
                <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-slate-400 font-medium select-none">
                  Sign above dashed line
                </div>
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-all flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Click to Upload Signature File
                </div>
                <p className="text-[11px] text-slate-500">
                  Supports PNG (recommended transparent), JPG, or SVG
                </p>
              </div>
            </div>
          )}

          {mode === 'preset' && (
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-700 block">
                Select an Official Cursive Executive Flourish:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Preset 1: General Manager */}
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset(
                      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70"><path d="M 20 45 Q 40 10, 60 40 T 90 25 T 130 50 Q 150 20, 180 35 T 220 30 M 40 50 Q 90 62, 190 48" fill="none" stroke="%230b1b2d" stroke-width="2.6" stroke-linecap="round"/><circle cx="215" cy="46" r="2.5" fill="%230b1b2d"/></svg>`
                    )
                  }
                  className="p-3 border border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900">Executive Flourish</div>
                  <div className="text-[10px] text-slate-500 mb-2">Classic cursive signature</div>
                  <div className="h-10 flex items-center justify-center bg-white rounded border border-slate-100 p-1">
                    <span className="font-serif italic text-base text-slate-900 tracking-wider">
                      F. Al-Ghamdi ~
                    </span>
                  </div>
                </button>

                {/* Preset 2: Executive Housekeeper */}
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset(
                      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70"><path d="M 25 35 Q 45 15, 65 35 T 105 30 T 145 45 Q 170 15, 195 38 T 215 32 M 35 48 C 70 58, 120 54, 205 45" fill="none" stroke="%239a7016" stroke-width="2.6" stroke-linecap="round"/></svg>`
                    )
                  }
                  className="p-3 border border-slate-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900">Royal Gold Seal Script</div>
                  <div className="text-[10px] text-slate-500 mb-2">Warm amber executive stroke</div>
                  <div className="h-10 flex items-center justify-center bg-white rounded border border-slate-100 p-1">
                    <span className="font-serif italic text-base text-amber-700 tracking-wider">
                      Executive Mgr ~
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Real-time Certificate Embedded Preview */}
          {previewDataUrl && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Certificate Signature Line Simulation:</span>
              </span>

              {/* Simulation of certificate signature block */}
              <div className="p-4 bg-white rounded-lg border border-slate-200 text-center max-w-xs mx-auto shadow-2xs">
                <div className="h-14 flex items-end justify-center mb-1">
                  <img
                    src={previewDataUrl}
                    alt="Signature preview"
                    className="max-h-12 max-w-[180px] object-contain"
                  />
                </div>
                <div className="w-full h-[1.5px] bg-slate-800 mb-1" />
                <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                  {signatoryTitle}
                </div>
                {signatoryName && (
                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                    {signatoryName}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {previewDataUrl && (
              <button
                type="button"
                onClick={() => {
                  setPreviewDataUrl('');
                  setHasSignature(false);
                  setStrokes([]);
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!previewDataUrl}
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Embed Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
