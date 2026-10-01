import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Certificate, CertificateColors } from '../../../types';
import { BuilderElement, CanvasSettings, BuilderElementType, SavedCertificateTemplate } from './types';
import { buildElementsFromCert, getInitialCanvasSettings } from './defaultElements';
import { createNewElement } from './elementCatalog';
import { ElementorSidebar } from './ElementorSidebar';
import { ElementorCanvas } from './ElementorCanvas';
import { ElementorTemplateLibraryModal } from './ElementorTemplateLibraryModal';
import { SaveAsTemplateModal } from './SaveAsTemplateModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { AssetLibraryModal } from './AssetLibraryModal';
import { HOTEL_STAFF_CERTIFICATE_PRESETS } from '../certificatePresets';
import { downloadCertificatePdf, downloadCertificatePng, printCertificate } from '../CertificateActions';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  Save,
  Printer,
  FileDown,
  Image as ImageIcon,
  X,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  Bookmark,
  FolderPlus,
  Layers,
  Keyboard,
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  RefreshCw,
  PanelLeft,
  Maximize,
  Award
} from 'lucide-react';
import {
  saveCustomTemplate,
  updateCustomTemplate,
  syncTemplatesWithBackend
} from './prebuiltTemplates';

interface ElementorCertificateBuilderProps {
  initialCertificate?: Partial<Certificate>;
  initialTemplate?: SavedCertificateTemplate | null;
  onSave: (updatedCert: Partial<Certificate>) => void;
  onTemplateSaved?: (savedTemplate: SavedCertificateTemplate) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const ElementorCertificateBuilder: React.FC<ElementorCertificateBuilderProps> = ({
  initialCertificate = {},
  initialTemplate = null,
  onSave,
  onTemplateSaved,
  onClose,
  isEmbedded = false
}) => {
  // Initialize elements from initialTemplate if provided, or from initialCertificate
  const [elements, setElements] = useState<BuilderElement[]>(() => {
    if (initialTemplate && Array.isArray(initialTemplate.elements) && initialTemplate.elements.length > 0) {
      return initialTemplate.elements;
    }
    if (initialCertificate && Array.isArray(initialCertificate.elements) && initialCertificate.elements.length > 0) {
      return initialCertificate.elements;
    }
    return buildElementsFromCert(initialCertificate || {});
  });

  const [settings, setSettings] = useState<CanvasSettings>(() => {
    if (initialTemplate && initialTemplate.settings) {
      return initialTemplate.settings;
    }
    return getInitialCanvasSettings(initialCertificate || {});
  });

  // Active template tracking for seamless updates
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    () => initialTemplate?.id || (initialCertificate?.customTemplateId as string) || null
  );
  const [activeTemplateName, setActiveTemplateName] = useState<string>(
    () => initialTemplate?.name || initialCertificate?.title || 'Custom Certificate Template'
  );
  const [isCustomTemplate, setIsCustomTemplate] = useState<boolean>(
    () => (initialTemplate ? Boolean(initialTemplate.isCustom) : true)
  );
  const [isTemplateSaving, setIsTemplateSaving] = useState<boolean>(false);
  const [liveStaffPreview, setLiveStaffPreview] = useState<boolean>(false);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.9);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!isEmbedded);

  // Responsive sidebar drawer state (hidden on mobile by default)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Calculate Auto-fit Zoom based on current viewport
  const calculateFitZoom = useCallback(() => {
    if (typeof window === 'undefined') return 0.85;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const isMobile = screenW < 1024;
    const availW = isMobile ? screenW - 32 : screenW - 360;
    const availH = screenH - 120;
    const targetW = settings.orientation === 'portrait' ? 700 : 1000;
    const targetH = settings.orientation === 'portrait' ? 1000 : 700;
    const scale = Math.min(availW / targetW, availH / targetH) * 0.95;
    return Math.max(0.25, Math.min(1.2, Math.round(scale * 100) / 100));
  }, [settings.orientation]);

  // Set initial auto-fit on load if small screen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      setZoomLevel(calculateFitZoom());
    }
  }, [calculateFitZoom]);

  // Window resize listener to auto-adjust
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchronize custom templates from server on mount
  useEffect(() => {
    syncTemplatesWithBackend().catch((e) => console.warn('Sync templates error:', e));
  }, []);

  // Modals
  const [showTemplateLibrary, setShowTemplateLibrary] = useState<boolean>(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState<boolean>(false);

  // Clipboard & Keyboard Shortcuts Feedback Toast
  const [clipboard, setClipboard] = useState<BuilderElement | null>(null);
  const [shortcutToast, setShortcutToast] = useState<{ message: string; sub?: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showShortcutFeedback = (message: string, sub?: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setShortcutToast({ message, sub });
    toastTimerRef.current = setTimeout(() => {
      setShortcutToast(null);
    }, 1800);
  };

  // Undo / Redo history initialized immediately
  const [history, setHistory] = useState<Array<{ elements: BuilderElement[]; settings: CanvasSettings }>>(() => [
    { elements, settings }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Keep fresh mutable refs to avoid stale closures in keyboard event listeners
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const selectedIdRef = useRef(selectedElementId);
  selectedIdRef.current = selectedElementId;
  const clipboardRef = useRef(clipboard);
  clipboardRef.current = clipboard;
  const historyIndexRef = useRef(historyIndex);
  historyIndexRef.current = historyIndex;
  const historyRef = useRef(history);
  historyRef.current = history;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Initialize history with initial state if empty
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ elements, settings }]);
      setHistoryIndex(0);
    }
  }, []);

  // Save snapshot to history
  const pushHistory = (newElements: BuilderElement[], newSettings: CanvasSettings) => {
    if (!Array.isArray(newElements)) return;
    setHistory((prev) => {
      const validIndex = Math.max(0, Math.min(historyIndex, prev.length - 1));
      const sliced = prev.slice(0, validIndex + 1);
      return [...sliced, { elements: newElements, settings: newSettings }];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;
      const snapshot = historyRef.current[newIndex];
      if (snapshot && Array.isArray(snapshot.elements)) {
        setHistoryIndex(newIndex);
        setElements(snapshot.elements);
        if (snapshot.settings) setSettings(snapshot.settings);
        showShortcutFeedback('↩️ Undo Action', 'Ctrl + Z');
      }
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1;
      const snapshot = historyRef.current[newIndex];
      if (snapshot && Array.isArray(snapshot.elements)) {
        setHistoryIndex(newIndex);
        setElements(snapshot.elements);
        if (snapshot.settings) setSettings(snapshot.settings);
        showShortcutFeedback('↪️ Redo Action', 'Ctrl + Y');
      }
    }
  };

  const handleCopy = (id?: string) => {
    const targetId = id || selectedIdRef.current;
    if (!targetId) return;
    const target = elementsRef.current.find((el) => el.id === targetId);
    if (!target) return;

    setClipboard({ ...target });
    showShortcutFeedback(`📋 Copied: ${target.name}`, 'Ctrl + C');
  };

  const handleCut = (id?: string) => {
    const targetId = id || selectedIdRef.current;
    if (!targetId) return;
    const target = elementsRef.current.find((el) => el.id === targetId);
    if (!target) return;

    if (target.isLocked) {
      showShortcutFeedback(`🔒 ${target.name} is locked`, 'Cannot cut locked elements');
      return;
    }

    setClipboard({ ...target });
    handleDeleteElement(targetId);
    showShortcutFeedback(`✂️ Cut: ${target.name}`, 'Ctrl + X');
  };

  const handlePaste = () => {
    const currentClip = clipboardRef.current;
    if (!currentClip) {
      showShortcutFeedback('Clipboard is empty', 'Copy (Ctrl+C) or Cut (Ctrl+X) first');
      return;
    }

    const newId = `${currentClip.type}_${Date.now()}`;
    const pastedElement: BuilderElement = {
      ...currentClip,
      id: newId,
      name: currentClip.name.includes('(Copy)') ? currentClip.name : `${currentClip.name} (Copy)`,
      x: Math.min(94, Math.max(6, (currentClip.x ?? 50) + 3)),
      y: Math.min(94, Math.max(6, (currentClip.y ?? 50) + 3)),
      zIndex: (currentClip.zIndex ?? 20) + 1
    };

    const nextElements = [...elementsRef.current, pastedElement];
    setElements(nextElements);
    setSelectedElementId(newId);
    pushHistory(nextElements, settingsRef.current);

    // Stagger subsequent pastes
    setClipboard(pastedElement);
    showShortcutFeedback(`📋 Pasted: ${pastedElement.name}`, 'Ctrl + V');
  };

  const handleUpdateElement = (id: string, updates: Partial<BuilderElement>) => {
    const nextElements = elements.map((elem) => (elem.id === id ? { ...elem, ...updates } : elem));
    setElements(nextElements);
    pushHistory(nextElements, settings);
  };

  const handleDeleteElement = (id: string) => {
    const target = elementsRef.current.find((elem) => elem.id === id);
    if (target?.isLocked) {
      showShortcutFeedback(`🔒 ${target.name} is locked`, 'Unlock element before deleting');
      return;
    }

    const nextElements = elementsRef.current.filter((elem) => elem.id !== id);
    setElements(nextElements);
    setSelectedElementId(null);
    pushHistory(nextElements, settingsRef.current);
    if (target) {
      showShortcutFeedback(`🗑️ Deleted: ${target.name}`, 'Delete / Backspace');
    }
  };

  const handleDuplicateElement = (id: string) => {
    const target = elementsRef.current.find((el) => el.id === id);
    if (!target) return;
    const duplicated: BuilderElement = {
      ...target,
      id: `${target.type}_${Date.now()}`,
      name: `${target.name} (Copy)`,
      x: Math.min(95, target.x + 3),
      y: Math.min(95, target.y + 3),
      zIndex: (target.zIndex ?? 20) + 1
    };
    const nextElements = [...elementsRef.current, duplicated];
    setElements(nextElements);
    setSelectedElementId(duplicated.id);
    pushHistory(nextElements, settingsRef.current);
    showShortcutFeedback(`✨ Duplicated: ${target.name}`, 'Ctrl + D');
  };

  // Comprehensive Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Never intercept when user is typing in form inputs, textareas, or contenteditables
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // 2. If any modal is active, let Escape close modal
      if (showTemplateLibrary || showSaveAsTemplate || showShortcutsModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowTemplateLibrary(false);
          setShowSaveAsTemplate(false);
          setShowShortcutsModal(false);
        }
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const currentSelectedId = selectedIdRef.current;
      const currentElements = elementsRef.current;

      // 3. Undo: Ctrl/Cmd + Z (without Shift)
      if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // 4. Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (
        isCtrlOrCmd &&
        (e.key === 'y' || e.key === 'Y' || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // 5. Cut: Ctrl/Cmd + X
      if (isCtrlOrCmd && (e.key === 'x' || e.key === 'X')) {
        if (currentSelectedId) {
          e.preventDefault();
          handleCut(currentSelectedId);
        }
        return;
      }

      // 6. Copy: Ctrl/Cmd + C
      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        const selection = window.getSelection()?.toString();
        if (!selection && currentSelectedId) {
          e.preventDefault();
          handleCopy(currentSelectedId);
        }
        return;
      }

      // 7. Paste: Ctrl/Cmd + V
      if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        if (clipboardRef.current) {
          e.preventDefault();
          handlePaste();
        } else {
          showShortcutFeedback('Clipboard is empty', 'Copy (Ctrl+C) first');
        }
        return;
      }

      // 8. Duplicate: Ctrl/Cmd + D
      if (isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) {
        if (currentSelectedId) {
          e.preventDefault();
          handleDuplicateElement(currentSelectedId);
        }
        return;
      }

      // 9. Delete / Backspace: Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentSelectedId) {
          e.preventDefault();
          handleDeleteElement(currentSelectedId);
        }
        return;
      }

      // 10. Escape: Deselect current element
      if (e.key === 'Escape') {
        if (currentSelectedId) {
          e.preventDefault();
          setSelectedElementId(null);
          showShortcutFeedback('Deselected element', 'Esc');
        }
        return;
      }

      // 11. Arrow keys: Nudge selected element position
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (currentSelectedId) {
          const target = currentElements.find((el) => el.id === currentSelectedId);
          if (target && !target.isLocked) {
            e.preventDefault();
            const step = e.shiftKey ? 2 : 0.5;
            let nextX = target.x;
            let nextY = target.y;
            if (e.key === 'ArrowUp') nextY = Math.max(0, nextY - step);
            if (e.key === 'ArrowDown') nextY = Math.min(100, nextY + step);
            if (e.key === 'ArrowLeft') nextX = Math.max(0, nextX - step);
            if (e.key === 'ArrowRight') nextX = Math.min(100, nextX + step);

            const updated = currentElements.map((el) =>
              el.id === currentSelectedId ? { ...el, x: nextX, y: nextY } : el
            );
            setElements(updated);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Commit arrow key nudges to undo history once on release
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedIdRef.current) {
          pushHistory(elementsRef.current, settingsRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showTemplateLibrary, showSaveAsTemplate, showShortcutsModal]);

  const handleAddElement = (type: BuilderElementType) => {
    const newElement = createNewElement(type, elements, settings);
    const nextElements = [...elements, newElement];
    setElements(nextElements);
    setSelectedElementId(newElement.id);
    pushHistory(nextElements, settings);
  };

  const handleReorderElements = (newElements: BuilderElement[]) => {
    setElements(newElements);
    pushHistory(newElements, settings);
  };

  const handleDragEnd = () => {
    pushHistory(elements, settings);
  };

  const handleApplyTemplate = (template?: SavedCertificateTemplate | null) => {
    if (!template) return;
    const templateElements = Array.isArray(template.elements) ? template.elements : [];
    if (templateElements.length === 0) {
      showShortcutFeedback('Empty template', 'Template has no widgets');
      return;
    }

    // Generate fresh element IDs to avoid collisions
    const clonedElements: BuilderElement[] = templateElements.map((el, idx) => ({
      ...el,
      id: `${el.type}_${Date.now()}_${idx}`
    }));

    setElements(clonedElements);
    if (template.settings) {
      setSettings(template.settings);
    }
    setActiveTemplateId(template.id || null);
    setActiveTemplateName(template.name || 'Custom Certificate Template');
    setIsCustomTemplate(Boolean(template.isCustom));
    setSelectedElementId(null);
    pushHistory(clonedElements, template.settings || settings);
    showShortcutFeedback('Loaded Template', template.name || 'Template');
  };

  const handleUpdateActiveTemplate = async () => {
    if (!activeTemplateId || !isCustomTemplate) {
      setShowSaveAsTemplate(true);
      return;
    }

    try {
      setIsTemplateSaving(true);
      const updated = await updateCustomTemplate(activeTemplateId, {
        name: activeTemplateName,
        elements,
        settings,
        updatedAt: new Date().toISOString()
      });

      if (updated) {
        showShortcutFeedback('Template Updated Successfully!', `Saved "${updated.name}"`);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        if (onTemplateSaved) onTemplateSaved(updated);
      }
    } catch (err) {
      console.error('Failed to update template:', err);
      showShortcutFeedback('Update failed', 'Could not save template');
    } finally {
      setIsTemplateSaving(false);
    }
  };

  const handleUpdateSettings = (updates: Partial<CanvasSettings>) => {
    const nextSettings = { ...settings, ...updates };
    setSettings(nextSettings);
    pushHistory(elements, nextSettings);
  };

  // Quick Preset Loader
  const handleLoadPreset = (presetId: string) => {
    const preset = HOTEL_STAFF_CERTIFICATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const nextSettings: CanvasSettings = {
      ...settings,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      borderColor: preset.colors.border || preset.accentColor,
      backgroundColor: preset.colors.background || '#ffffff',
      borderStyle: preset.borderStyle
    };

    const nextElements = elements.map((elem) => {
      if (elem.type === 'certificate_title') {
        return { ...elem, content: preset.defaultTitle, textColor: preset.primaryColor };
      }
      if (elem.type === 'citation') {
        return { ...elem, content: preset.defaultCitation };
      }
      if (elem.type === 'signatory_left') {
        return { ...elem, content: preset.signatoryLeftTitle, subContent: preset.signatoryLeftName };
      }
      if (elem.type === 'signatory_right') {
        return { ...elem, content: preset.signatoryRightTitle, subContent: preset.signatoryRightName };
      }
      if (elem.type === 'badge_seal') {
        return {
          ...elem,
          content: preset.badgeText,
          subContent: preset.badgeSubtext,
          meta: { ...elem.meta, badgeStyle: preset.badgeStyle }
        };
      }
      return elem;
    });

    setSettings(nextSettings);
    setElements(nextElements);
    pushHistory(nextElements, nextSettings);
  };

  // Central Asset Library Handlers
  const handleAddAssetElement = (asset: {
    type: 'custom_image' | 'asset_icon';
    content?: string;
    imageUrl?: string;
    iconName?: string;
    name: string;
  }) => {
    const baseNew = createNewElement(asset.type, elements, settings);
    const newElement: BuilderElement = {
      ...baseNew,
      name: asset.name,
      content: asset.content || (asset.type === 'custom_image' ? asset.name : (asset.iconName || 'Award')),
      imageUrl: asset.imageUrl,
      iconName: asset.iconName,
      x: 50,
      y: 50,
      width: asset.type === 'custom_image' ? 120 : 64,
      height: asset.type === 'custom_image' ? 120 : 64,
    };
    const nextElements = [...elements, newElement];
    setElements(nextElements);
    setSelectedElementId(newElement.id);
    pushHistory(nextElements, settings);
    setShowAssetLibrary(false);
    showShortcutFeedback('Asset Added', asset.name);
  };

  const handleReplaceElementAsset = (elementId: string, updates: Partial<BuilderElement>) => {
    const nextElements = elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el));
    setElements(nextElements);
    pushHistory(nextElements, settings);
    setShowAssetLibrary(false);
    showShortcutFeedback('Asset Updated');
  };

  const handleSetBackground = (imageUrl: string) => {
    const nextSettings: CanvasSettings = { ...settings, backgroundImage: imageUrl, backgroundImageUrl: imageUrl };
    setSettings(nextSettings);
    pushHistory(elements, nextSettings);
    setShowAssetLibrary(false);
    showShortcutFeedback('Background Applied');
  };

  // Grid / Container Slot Assignment Handlers
  const handleAssignElementToSlot = (elementId: string, containerId: string, slotIndex: number) => {
    const nextElements = elements.map((el) => {
      if (el.id === elementId) {
        return {
          ...el,
          containerId,
          columnSlotIndex: slotIndex,
        };
      }
      return el;
    });
    setElements(nextElements);
    pushHistory(nextElements, settings);
    showShortcutFeedback('Element Slotted into Container');
  };

  const handleRemoveElementFromContainer = (elementId: string) => {
    const nextElements = elements.map((el) => {
      if (el.id === elementId) {
        const { containerId, columnSlotIndex, ...rest } = el;
        return {
          ...rest,
          containerId: undefined,
          columnSlotIndex: undefined,
          x: 50,
          y: 50
        };
      }
      return el;
    });
    setElements(nextElements);
    pushHistory(nextElements, settings);
    showShortcutFeedback('Element Removed from Container');
  };

  // Convert elements and settings back into a Certificate object and save
  const handleSaveCertificate = () => {
    const titleEl = elements.find((el) => el.type === 'certificate_title');
    const presentationEl = elements.find((el) => el.type === 'presentation_text');
    const recipientEl = elements.find((el) => el.type === 'recipient_name');
    const metaEl = elements.find((el) => el.type === 'recipient_meta');
    const citationEl = elements.find((el) => el.type === 'citation');
    const badgeEl = elements.find((el) => el.type === 'badge_seal');
    const headerEl = elements.find((el) => el.type === 'hotel_header');
    const sign1El = elements.find((el) => el.type === 'signatory_left');
    const sign2El = elements.find((el) => el.type === 'signatory_right');
    const sign3El = elements.find((el) => el.type === 'signatory_center');

    // Build layoutCoordinates mapping with both element IDs and block keys
    const layoutCoordinates: Record<string, { x: number; y: number; isVisible?: boolean }> = {};
    elements.forEach((el) => {
      layoutCoordinates[el.id] = { x: el.x, y: el.y, isVisible: el.isVisible };
      layoutCoordinates[el.type] = { x: el.x, y: el.y, isVisible: el.isVisible };
    });
    if (headerEl) layoutCoordinates['hotel_header'] = { x: headerEl.x, y: headerEl.y, isVisible: headerEl.isVisible };
    if (titleEl) layoutCoordinates['title_block'] = { x: titleEl.x, y: titleEl.y, isVisible: titleEl.isVisible };
    if (recipientEl) layoutCoordinates['recipient_block'] = { x: recipientEl.x, y: recipientEl.y, isVisible: recipientEl.isVisible };
    if (citationEl) layoutCoordinates['citation_block'] = { x: citationEl.x, y: citationEl.y, isVisible: citationEl.isVisible };
    if (badgeEl) layoutCoordinates['badge_block'] = { x: badgeEl.x, y: badgeEl.y, isVisible: badgeEl.isVisible };

    const customColors: CertificateColors = {
      primary: settings.primaryColor,
      primaryColor: settings.primaryColor,
      accent: settings.accentColor,
      accentColor: settings.accentColor,
      border: settings.borderColor,
      borderColor: settings.borderColor,
      background: settings.backgroundColor,
      backgroundColor: settings.backgroundColor,
      text: settings.textColor,
      textColor: settings.textColor
    };

    const updatedCert: Partial<Certificate> = {
      ...initialCertificate,
      title: titleEl?.content || initialCertificate.title || 'EMPLOYEE OF THE MONTH',
      presentationText: presentationEl?.content || initialCertificate.presentationText,
      recipientName: recipientEl?.content || initialCertificate.recipientName || '{{staff_name}}',
      recipientPosition: metaEl?.content || initialCertificate.recipientPosition || '{{staff_position}}',
      recipientDepartment: metaEl?.subContent || initialCertificate.recipientDepartment || '{{staff_department}}',
      citationText: citationEl?.content || initialCertificate.citationText || '{{citation_paragraph}}',
      hotelName: headerEl?.content || initialCertificate.hotelName || '',
      hotelSubtitle: headerEl?.subContent || initialCertificate.hotelSubtitle,
      customTemplateId: activeTemplateId || undefined,
      customTemplateName: activeTemplateName || undefined,
      borderStyle: settings.borderStyle,
      badgeStyle: badgeEl?.meta?.badgeStyle || initialCertificate.badgeStyle,
      badgeText: badgeEl?.content || initialCertificate.badgeText,
      badgeSubtext: badgeEl?.subContent || initialCertificate.badgeSubtext,
      signatory1Title: sign1El?.content || initialCertificate.signatory1Title,
      signatory1Name: sign1El?.subContent || initialCertificate.signatory1Name,
      signatory2Title: sign2El?.content || initialCertificate.signatory2Title,
      signatory2Name: sign2El?.subContent || initialCertificate.signatory2Name,
      showSignatory3: Boolean(sign3El && sign3El.isVisible),
      signatory3Title: sign3El?.content,
      signatory3Name: sign3El?.subContent,
      customColors,
      layoutCoordinates
    };

    onSave(updatedCert);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[60]' : 'relative w-full h-full'} flex flex-col bg-slate-950 text-white overflow-hidden select-none`}>
      {/* Top Certificate Builder Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
        {/* Left: Brand & Presets */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`lg:hidden p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border ${
              isSidebarOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
            }`}
            title="Toggle Certificate Tools Panel"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="hidden xs:inline">{isSidebarOpen ? 'Close' : 'Tools'}</span>
          </button>

          <div className="flex items-center gap-2 pr-2.5 border-r border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              <Award className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-100 hidden sm:inline">Certificate Builder</span>
          </div>

          {/* Active Template Badge */}
          {activeTemplateName && (
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Template:</span>
              <span className="text-amber-300 font-bold max-w-[130px] truncate" title={activeTemplateName}>
                {activeTemplateName}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider font-semibold ${
                  isCustomTemplate
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                }`}
              >
                {isCustomTemplate ? 'Custom' : 'Preset'}
              </span>
            </div>
          )}

          {/* Template Library Button */}
          <button
            type="button"
            onClick={() => setShowTemplateLibrary(true)}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            title="Browse pre-built and saved certificate templates"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Direct Update Template Button (One-click save/overwrite) */}
          <button
            type="button"
            onClick={handleUpdateActiveTemplate}
            disabled={isTemplateSaving}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs border border-emerald-400/40"
            title={
              activeTemplateId && isCustomTemplate
                ? `Update and overwrite template "${activeTemplateName}"`
                : 'Save as template'
            }
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTemplateSaving ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{activeTemplateId && isCustomTemplate ? 'Update Template' : 'Save Template'}</span>
          </button>

          {/* Save As New Template Button */}
          <button
            type="button"
            onClick={() => setShowSaveAsTemplate(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold hidden xl:flex items-center gap-1.5 transition border border-slate-700"
            title="Save current layout as a new template or duplicate"
          >
            <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
            <span>Save As...</span>
          </button>

          {/* Central Asset Library Button */}
          <button
            type="button"
            onClick={() => setShowAssetLibrary(true)}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            title="Open Central Asset Library (Icons, Logos, Seals, Ribbons & Custom Uploads)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden md:inline">Asset Gallery</span>
          </button>

          {/* Live Staff Data Preview Toggle */}
          <button
            type="button"
            onClick={() => setLiveStaffPreview(!liveStaffPreview)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold hidden md:flex items-center gap-1.5 transition border ${
              liveStaffPreview
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle between {{staff_name}} tags view and live staff data preview"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{liveStaffPreview ? 'Staff Data: ON' : 'Staff Data: OFF'}</span>
          </button>

          {/* Quick Preset Selector */}
          <div className="hidden 2xl:flex items-center gap-2">
            <select
              onChange={(e) => handleLoadPreset(e.target.value)}
              defaultValue=""
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-hidden"
            >
              <option value="" disabled>Quick Preset...</option>
              {HOTEL_STAFF_CERTIFICATE_PRESETS.slice(0, 10).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Stage Tools (Undo, Redo, Cut, Copy, Paste, Delete, Zoom, Fit, Grid, Preview, Shortcuts) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5 hidden sm:block" />
          <button
            type="button"
            onClick={() => handleCopy()}
            disabled={!selectedElementId}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition hidden sm:inline-block"
            title="Copy Element (Ctrl+C)"
          >
            <Copy className="w-4 h-4 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={() => handleCut()}
            disabled={!selectedElementId}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition hidden sm:inline-block"
            title="Cut Element (Ctrl+X)"
          >
            <Scissors className="w-4 h-4 text-rose-400" />
          </button>
          <button
            type="button"
            onClick={handlePaste}
            disabled={!clipboard}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition hidden sm:inline-block"
            title="Paste Element (Ctrl+V)"
          >
            <Clipboard className="w-4 h-4 text-purple-400" />
          </button>
          <button
            type="button"
            onClick={() => selectedElementId && handleDeleteElement(selectedElementId)}
            disabled={!selectedElementId}
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition"
            title="Delete Element (Delete / Backspace)"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.1))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1 text-slate-400">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {/* Responsive Fit to Screen Button */}
          <button
            type="button"
            onClick={() => {
              const fit = calculateFitZoom();
              setZoomLevel(fit);
              showShortcutFeedback('Auto-Fit Canvas', `${Math.round(fit * 100)}%`);
            }}
            className="px-1.5 py-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 transition text-[11px] font-bold flex items-center gap-1"
            title="Auto-Fit Certificate to Screen"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Fit</span>
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition hidden sm:inline-block ${showGrid ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            title="Toggle Alignment Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewMode(!previewMode);
              setSelectedElementId(null);
            }}
            className={`p-1.5 rounded transition ${previewMode ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            title="Preview Mode"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 hover:bg-sky-600/30 rounded text-sky-400 hover:text-sky-300 transition hidden md:inline-block"
            title="Keyboard Shortcuts (শর্টকাট কীসমূহ)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Export & Save */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              await downloadCertificatePdf('generator-certificate-container', `${initialCertificate.recipientName || 'Certificate'}.pdf`);
              setIsExporting(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={async () => {
              setIsExporting(true);
              await downloadCertificatePng('generator-certificate-container', `${initialCertificate.recipientName || 'Certificate'}.png`);
              setIsExporting(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          <button
            type="button"
            onClick={() => printCertificate('generator-certificate-container')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleSaveCertificate}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-lg transition ${
              saveSuccess ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white'
            }`}
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Saved!' : 'Save Certificate'}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Canvas'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
              title="Close Builder"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace: Left Sidebar + Central Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop when sidebar is open */}
        {isSidebarOpen && !previewMode && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container: Docked on lg+, slide-over drawer on mobile/tablet */}
        {!previewMode && (
          <div
            className={`transition-transform duration-200 z-40 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            } fixed lg:relative inset-y-14 lg:inset-y-0 left-0 h-[calc(100%-3.5rem)] lg:h-full shrink-0 shadow-2xl lg:shadow-none`}
          >
            <ElementorSidebar
              elements={elements}
              settings={settings}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onAddElement={handleAddElement}
              onUpdateSettings={handleUpdateSettings}
              onReorderElements={handleReorderElements}
              onOpenTemplates={() => setShowTemplateLibrary(true)}
              onOpenAssetLibrary={() => setShowAssetLibrary(true)}
              onAssignElementToSlot={handleAssignElementToSlot}
              onRemoveElementFromContainer={handleRemoveElementFromContainer}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        <ElementorCanvas
          elements={elements}
          settings={settings}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onCopyElement={handleCopy}
          onCutElement={handleCut}
          onDragEnd={handleDragEnd}
          zoomLevel={zoomLevel}
          showGrid={showGrid}
          previewMode={previewMode}
          liveStaffPreview={liveStaffPreview}
          sampleStaffData={{
            name: initialCertificate?.recipientName,
            position: initialCertificate?.recipientPosition,
            department: initialCertificate?.recipientDepartment,
            citation: initialCertificate?.citationText
          }}
        />
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {/* Floating Shortcut Action Toast */}
      {shortcutToast && (
        <div className="fixed bottom-6 right-6 z-[80] pointer-events-none animate-fade-in">
          <div className="bg-slate-900/95 border border-sky-500/40 text-white px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-100">{shortcutToast.message}</div>
              {shortcutToast.sub && (
                <div className="text-[10px] text-sky-300 font-mono mt-0.5">{shortcutToast.sub}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <ElementorTemplateLibraryModal
          isOpen={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
          onApplyTemplate={handleApplyTemplate}
          currentElements={elements}
          currentSettings={settings}
          onOpenSaveModal={() => {
            setShowTemplateLibrary(false);
            setShowSaveAsTemplate(true);
          }}
        />
      )}

      {/* Save Current Layout as Template Modal */}
      {showSaveAsTemplate && (
        <SaveAsTemplateModal
          isOpen={showSaveAsTemplate}
          onClose={() => setShowSaveAsTemplate(false)}
          currentElements={elements}
          currentSettings={settings}
          activeTemplateId={activeTemplateId}
          activeTemplateName={activeTemplateName}
          isCustom={isCustomTemplate}
          onSaved={(savedTpl) => {
            if (savedTpl) {
              setActiveTemplateId(savedTpl.id);
              setActiveTemplateName(savedTpl.name);
              setIsCustomTemplate(true);
              setSaveSuccess(true);
              showShortcutFeedback('Template Saved!', `Template "${savedTpl.name}" is active`);
              setTimeout(() => setSaveSuccess(false), 2000);
              if (onTemplateSaved) onTemplateSaved(savedTpl);
            }
          }}
        />
      )}

      {/* Central Asset Library Modal */}
      {showAssetLibrary && (
        <AssetLibraryModal
          isOpen={showAssetLibrary}
          onClose={() => setShowAssetLibrary(false)}
          selectedElement={selectedElement}
          settings={settings}
          onAddAssetElement={handleAddAssetElement}
          onReplaceElementAsset={handleReplaceElementAsset}
          onSetBackground={handleSetBackground}
        />
      )}
    </div>
  );
};
