import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  Upload,
  Search,
  Sparkles,
  Zap,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  QrCode,
  ArrowRight,
  RefreshCw,
  Layers,
  Tag
} from 'lucide-react';
import jsQR from 'jsqr';
import { useApp } from '../../context/AppContext';
import { LostItem } from '../../types';
import { parseScannedQrData, playScanSound } from '../../lib/qrcode';
import { useClickOutside } from '../../hooks/useClickOutside';

type ScannerMode = 'camera' | 'upload' | 'manual';

export const QrScannerModal: React.FC = () => {
  const {
    isQrScannerOpen,
    setIsQrScannerOpen,
    items,
    openItemDetails,
    settings
  } = useApp();

  const handleClose = () => {
    stopCamera();
    setIsQrScannerOpen(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isQrScannerOpen,
    closeOnEsc: true
  });

  const [mode, setMode] = useState<ScannerMode>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedResult, setScannedResult] = useState<{
    code?: string;
    item?: LostItem;
    rawText?: string;
  } | null>(null);

  // Manual search state
  const [manualQuery, setManualQuery] = useState('');
  // Upload processing state
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Handle successful match
  const handleItemFound = useCallback(
    (matchedItem: LostItem, rawCode: string) => {
      playScanSound();
      setScannedResult({
        code: matchedItem.code,
        item: matchedItem,
        rawText: rawCode
      });
      stopCamera();

      // Automatically open item details after brief visual confirmation
      setTimeout(() => {
        setIsQrScannerOpen(false);
        openItemDetails(matchedItem);
      }, 550);
    },
    [openItemDetails, setIsQrScannerOpen, stopCamera]
  );

  // Match item from parsed QR data
  const processDecodedString = useCallback(
    (decodedText: string) => {
      const parsed = parseScannedQrData(decodedText);
      const targetCode = (parsed.code || '').toLowerCase().trim();
      const targetId = (parsed.id || '').toLowerCase().trim();

      const found = items.find(item => {
        const itemCode = (item.code || '').toLowerCase().trim();
        const itemId = (item.id || '').toLowerCase().trim();
        return (
          (targetCode && (itemCode === targetCode || itemCode.includes(targetCode))) ||
          (targetId && (itemId === targetId || itemId.includes(targetId))) ||
          item.itemName.toLowerCase() === targetCode
        );
      });

      if (found) {
        handleItemFound(found, decodedText);
      } else {
        // Item code parsed but not found in active state
        setScannedResult({
          code: parsed.code || decodedText,
          rawText: decodedText
        });
      }
    },
    [items, handleItemFound]
  );

  // Scan frame loop using hidden canvas
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          processDecodedString(code.data);
          return; // Stop loop if code found
        }
      }
    } catch {
      // Ignore scan frame error
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [processDecodedString]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScannedResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser or device.');
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);

        // Check torch capabilities
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
          setHasTorch(!!capabilities.torch);
        }

        // Start scanning loop
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const errorMsg = (err as Error)?.message || '';
      if (errorMsg.includes('Permission') || errorMsg.includes('denied') || errorMsg.includes('NotAllowedError')) {
        setCameraError('Camera permission denied. Please allow camera access in browser settings, or use Image Upload / Code Search.');
      } else if (errorMsg.includes('NotFound') || errorMsg.includes('DevicesNotFoundError')) {
        setCameraError('No camera found on this device. You can upload a photo of the QR code or search by Item Code.');
      } else {
        setCameraError('Could not start camera. Try uploading an image of the QR code or searching by Item Code.');
      }
      setIsCameraActive(false);
    }
  }, [facingMode, scanVideoFrame, stopCamera]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !isTorchOn;
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setIsTorchOn(nextTorch);
      } catch (e) {
        console.warn('Torch toggle not supported:', e);
      }
    }
  };

  // Flip camera between back & front
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Effect to manage camera lifecycle when modal or mode changes
  useEffect(() => {
    if (isQrScannerOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isQrScannerOpen, mode, facingMode, startCamera, stopCamera]);

  // Process image file for QR Code
  const handleImageUpload = (file: File) => {
    if (!file) return;
    setIsProcessingImage(true);
    setUploadError(null);
    setScannedResult(null);

    const reader = new FileReader();
    reader.onload = e => {
      if (typeof document === 'undefined') return;
      const img = document.createElement('img');
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setUploadError('Failed to process image canvas.');
            setIsProcessingImage(false);
            return;
          }

          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            processDecodedString(code.data);
          } else {
            setUploadError('No valid QR code detected in the uploaded image. Please ensure the QR code is clear and well-lit.');
          }
        } catch {
          setUploadError('Error analyzing image. Please try another image.');
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setUploadError('Failed to load image file.');
        setIsProcessingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Filtered items for manual search
  const manualFilteredItems = manualQuery.trim()
    ? items.filter(
        item =>
          item.code.toLowerCase().includes(manualQuery.toLowerCase()) ||
          item.itemName.toLowerCase().includes(manualQuery.toLowerCase()) ||
          item.locationFound.toLowerCase().includes(manualQuery.toLowerCase()) ||
          item.storeLocation.toLowerCase().includes(manualQuery.toLowerCase())
      )
    : items.slice(0, 5);

  if (!isQrScannerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Scan Item QR Tag
              </h2>
              <p className="text-[11px] text-slate-500">
                Point camera at the item tag or upload a photo
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              setIsQrScannerOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            title="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-4 py-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('camera');
              setScannedResult(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              mode === 'camera'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('upload');
              stopCamera();
              setScannedResult(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              mode === 'upload'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('manual');
              stopCamera();
              setScannedResult(null);
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tag Search</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* CAMERA MODE */}
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[320px] w-full rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Reticle Scanner Overlay */}
                {isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Darkened mask around viewfinder */}
                    <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl border-2 border-indigo-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                      {/* Corner Brackets */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                      {/* Animated Laser Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#818cf8] animate-pulse"
                           style={{
                             animation: 'qr-laser 2s infinite ease-in-out',
                             top: '50%'
                           }}
                      />
                    </div>
                  </div>
                )}

                {/* Camera Error Message */}
                {cameraError && (
                  <div className="absolute inset-4 flex flex-col items-center justify-center text-center p-4 bg-slate-900/90 text-white rounded-xl space-y-3 z-10">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <p className="text-xs text-slate-200 max-w-xs">{cameraError}</p>
                    <div className="flex flex-wrap gap-2 pt-1 justify-center">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
                      >
                        Upload Photo
                      </button>
                    </div>
                  </div>
                )}

                {/* Top Overlay Controls (Flashlight / Flip Camera) */}
                {isCameraActive && (
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/75 text-[10px] font-semibold text-white backdrop-blur-xs flex items-center space-x-1.5 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Scanning Active</span>
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {hasTorch && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`p-2 rounded-full backdrop-blur-xs transition-all ${
                            isTorchOn
                              ? 'bg-amber-400 text-slate-900 shadow-md'
                              : 'bg-slate-900/75 text-white border border-white/10'
                          }`}
                          title={isTorchOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="p-2 rounded-full bg-slate-900/75 text-white border border-white/10 hover:bg-slate-800 transition-all"
                        title="Switch Camera (Front/Back)"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-center text-slate-500">
                Align the item’s printed QR Code or label sticker within the frame box.
              </p>
            </div>
          )}

          {/* UPLOAD IMAGE MODE */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  {isProcessingImage ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isProcessingImage ? 'Analyzing QR Code...' : 'Click to Upload or Drag & Drop'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PNG, JPG, WEBP photos of item tags, stickers, or receipts
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* MANUAL CODE SEARCH MODE */}
          {mode === 'manual' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter code e.g. LF-2026-08-112 or keyword..."
                  value={manualQuery}
                  onChange={e => setManualQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {manualFilteredItems.map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleItemFound(item, item.code)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-600 group-hover:underline">
                        {item.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate max-w-[170px]">
                        {item.itemName}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                      {item.status}
                    </span>
                  </button>
                ))}

                {manualFilteredItems.length === 0 && (
                  <p className="text-xs text-center text-slate-400 py-4">
                    No items found matching &quot;{manualQuery}&quot;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SCANNED FEEDBACK BANNER (If matched or not found) */}
          {scannedResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between animate-fade-in ${
                scannedResult.item
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center space-x-2.5 text-xs">
                {scannedResult.item ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold">
                    {scannedResult.item
                      ? `Found: ${scannedResult.item.itemName}`
                      : `Code: ${scannedResult.code}`}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {scannedResult.item
                      ? `Status: ${scannedResult.item.status} • Location: ${scannedResult.item.storeLocation}`
                      : 'No inventory item currently matches this tag code.'}
                  </p>
                </div>
              </div>

              {scannedResult.item && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQrScannerOpen(false);
                    openItemDetails(scannedResult.item!);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shrink-0"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* DEMO / SAMPLE TEST ITEMS */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Test Items (1-Click Test Scan)
              </span>
              <span className="text-[10px] text-slate-400">Simulate physical scan</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {items.slice(0, 4).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemFound(item, item.code)}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left text-xs transition-all flex items-center justify-between"
                  title={`Test-scan ${item.code}`}
                >
                  <span className="font-mono text-[11px] font-bold text-indigo-600 truncate mr-1">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                    {item.itemName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Warwick Lost & Found QR Verification Protocol</span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setIsQrScannerOpen(false);
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
