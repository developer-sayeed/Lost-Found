import React, { useState, useEffect } from 'react';
import { BuilderElement, CanvasSettings, SavedCertificateTemplate } from './types';
import { saveCustomTemplate, updateCustomTemplate } from './prebuiltTemplates';
import { X, Bookmark, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements?: BuilderElement[];
  settings?: CanvasSettings;
  currentElements?: BuilderElement[];
  currentSettings?: CanvasSettings;
  activeTemplateId?: string | null;
  activeTemplateName?: string | null;
  isCustom?: boolean;
  onTemplateSaved?: (savedTemplate?: SavedCertificateTemplate) => void;
  onSaved?: (savedTemplate?: SavedCertificateTemplate) => void;
}

export const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
  isOpen,
  onClose,
  elements: propsElements,
  settings: propsSettings,
  currentElements,
  currentSettings,
  activeTemplateId,
  activeTemplateName,
  isCustom = true,
  onTemplateSaved,
  onSaved
}) => {
  const elements = currentElements || propsElements || [];
  const settings = currentSettings || propsSettings || ({} as CanvasSettings);

  const [mode, setMode] = useState<'update' | 'new'>(activeTemplateId ? 'update' : 'new');
  const [name, setName] = useState(activeTemplateName || '');
  const [category, setCategory] = useState('Hospitality & 5-Star');
  const [description, setDescription] = useState('');
  const [badgeText, setBadgeText] = useState('CUSTOM');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTemplateName) {
      setName(activeTemplateName);
    }
    if (activeTemplateId) {
      setMode('update');
    } else {
      setMode('new');
    }
  }, [activeTemplateId, activeTemplateName, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage('Please enter a template name');
      return;
    }

    try {
      let saved: SavedCertificateTemplate | undefined;
      if (mode === 'update' && activeTemplateId) {
        // Update existing template
        saved = (await updateCustomTemplate(activeTemplateId, {
          name: name.trim(),
          category,
          description: description.trim() || `Updated custom certificate template with ${elements.length} design widgets.`,
          thumbnailBadge: badgeText.trim().toUpperCase() || 'UPDATED',
          settings,
          elements
        })) || undefined;
      } else {
        // Save as new template
        saved = await saveCustomTemplate({
          name: name.trim(),
          category,
          description: description.trim() || `Custom certificate layout with ${elements.length} design widgets.`,
          thumbnailBadge: badgeText.trim().toUpperCase() || 'CUSTOM',
          settings,
          elements
        });
      }

      if (onTemplateSaved) onTemplateSaved(saved);
      if (onSaved) onSaved(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save custom template');
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              {mode === 'update' ? <RefreshCw className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {mode === 'update' ? 'Update Certificate Template' : 'Save as Reusable Template'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'update'
                  ? 'Permanently save changes to the active template'
                  : 'Save this layout to load anytime with 1 click'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector (if template was already active) */}
        {activeTemplateId && (
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex gap-2">
            <button
              type="button"
              onClick={() => setMode('update')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'update'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Existing</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mode === 'new'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 shadow-xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save As New</span>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Template Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Executive Staff Honor Award"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
            >
              <option value="Hospitality & 5-Star">Hospitality & 5-Star</option>
              <option value="Leadership & VIP">Leadership & VIP</option>
              <option value="Safety & Security">Safety & Security</option>
              <option value="Milestone & Loyalty">Milestone & Loyalty</option>
              <option value="Departmental Excellence">Departmental Excellence</option>
              <option value="Custom Favorites">Custom Favorites</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Badge Ribbon Label</label>
            <input
              type="text"
              maxLength={14}
              placeholder="e.g. VIP GOLD, FAVORITE"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief description of this template layout..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Includes: <strong className="text-white">{elements.length} design widgets</strong></span>
            <span>Border: <strong className="text-amber-400 capitalize">{settings.borderStyle?.replace('_', ' ')}</strong></span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md transition text-xs text-white ${
                mode === 'update'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400'
              }`}
            >
              {mode === 'update' ? <RefreshCw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              <span>{mode === 'update' ? 'Update & Overwrite Template' : 'Save New Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
