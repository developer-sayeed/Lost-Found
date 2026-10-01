import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Info,
  Lock,
  Layers,
  Search,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CategoryConfig } from '../types';
import { DEFAULT_ITEM_CATEGORIES } from '../lib/constants';
import { useClickOutside } from '../hooks/useClickOutside';

const COLOR_PRESETS = [
  { hex: '#ef4444', label: 'Red (Urgent / Medicine)' },
  { hex: '#f97316', label: 'Orange (Perishable / Food)' },
  { hex: '#6366f1', label: 'Indigo (Apparel / Textiles)' },
  { hex: '#8b5cf6', label: 'Purple (Personal Goods)' },
  { hex: '#0284c7', label: 'Sky Blue (Tech / Gadgets)' },
  { hex: '#059669', label: 'Emerald (Documents / ID)' },
  { hex: '#d97706', label: 'Amber (Jewelry / Valuables)' },
  { hex: '#64748b', label: 'Slate (Keys / Miscellaneous)' },
  { hex: '#0f172a', label: 'Navy (Formal)' }
];

export const CategorySettings: React.FC = () => {
  const { settings, updateSettings, items } = useApp();
  const { user } = useAuth();

  const categories: CategoryConfig[] = (settings.categories && settings.categories.length > 0)
    ? settings.categories
    : DEFAULT_ITEM_CATEGORIES;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);
  const [formName, setFormName] = useState('');
  const [formRetentionDays, setFormRetentionDays] = useState<number>(30);
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Delete Confirmation state
  const [deletingCategory, setDeletingCategory] = useState<CategoryConfig | null>(null);

  // Reset confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const categoryModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isSaving) setIsModalOpen(false);
  }, { active: isModalOpen, closeOnEsc: true });

  const deleteCategoryModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isSaving) setDeletingCategory(null);
  }, { active: !!deletingCategory, closeOnEsc: true });

  const resetModalRef = useClickOutside<HTMLDivElement>(() => {
    if (!isSaving) setIsResetConfirmOpen(false);
  }, { active: isResetConfirmOpen, closeOnEsc: true });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormRetentionDays(30);
    setFormDescription('');
    setFormColor('#6366f1');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: CategoryConfig) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormRetentionDays(cat.retentionDays);
    setFormDescription(cat.description || '');
    setFormColor(cat.color || '#6366f1');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Category name is required.');
      return;
    }
    if (formRetentionDays <= 0) {
      setFormError('Retention period must be at least 1 day.');
      return;
    }

    // Check duplicate name
    const isDuplicate = categories.some(
      c => (c.name || '').toLowerCase() === cleanName.toLowerCase() && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      setFormError(`A category named "${cleanName}" already exists.`);
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      let updatedList: CategoryConfig[];
      if (editingCategory) {
        // Update
        updatedList = categories.map(c =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: cleanName,
                retentionDays: Number(formRetentionDays),
                description: formDescription.trim(),
                color: formColor
              }
            : c
        );
      } else {
        // Create new
        const newCat: CategoryConfig = {
          id: `cat-${Date.now()}`,
          name: cleanName,
          retentionDays: Number(formRetentionDays),
          description: formDescription.trim(),
          color: formColor,
          isDefault: false,
          createdAt: new Date().toISOString()
        };
        updatedList = [...categories, newCat];
      }

      await updateSettings({
        ...settings,
        categories: updatedList
      });

      setIsModalOpen(false);
      showToast(
        editingCategory
          ? `Category "${cleanName}" updated with ${formRetentionDays} days retention policy.`
          : `New category "${cleanName}" added with ${formRetentionDays} days retention policy.`
      );
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Category
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    if (categories.length <= 1) {
      setFormError('At least one item category must remain configured in the system.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedList = categories.filter(c => c.id !== deletingCategory.id);
      await updateSettings({
        ...settings,
        categories: updatedList
      });

      const deletedName = deletingCategory.name;
      setDeletingCategory(null);
      showToast(`Category "${deletedName}" has been removed.`);
    } catch (err: any) {
      alert('Failed to delete category: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Restore Default Categories
  const handleRestoreDefaults = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        ...settings,
        categories: DEFAULT_ITEM_CATEGORIES
      });
      setIsResetConfirmOpen(false);
      showToast('Restored standard hotel categories & retention policies.');
    } catch (err: any) {
      alert('Failed to restore defaults: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      `${c.retentionDays || ''}`.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Item Categories & Retention Policies
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {categories.length} Categories
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Add, edit, or remove item categories. Each category enforces a strict, dynamic retention period (in days). 
                When staff registers a found item, the retention period is automatically populated from this policy and locked against arbitrary modification.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Restore standard hotel categories"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Search & Info Strip */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search category name or days..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Retention days automatically lock on item entry for compliance</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(cat => {
          // Count how many items currently registered under this category
          const catNameLower = (cat.name || '').toLowerCase().trim();
          const matchingItemCount = items.filter(
            i => catNameLower && i.category?.toLowerCase().trim() === catNameLower
          ).length;

          return (
            <div
              key={cat.id || cat.name}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all p-5 flex flex-col justify-between space-y-4 relative group"
            >
              {/* Category Top Banner */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                      style={{ backgroundColor: cat.color || '#6366f1' }}
                    />
                    <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                      {cat.name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title={`Edit ${cat.name} Category`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={`Delete ${cat.name} Category`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                  {cat.description || 'Standard hotel retention policy applies.'}
                </p>
              </div>

              {/* Retention Policy Badge & Stats */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold font-mono flex items-center space-x-1 shadow-2xs">
                    <Clock className="w-3 h-3 text-indigo-300" />
                    <span>{cat.retentionDays} {cat.retentionDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Retention</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {matchingItemCount} {matchingItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Tags className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No categories found matching &quot;{searchQuery}&quot;</p>
          <p className="text-xs text-slate-400">Try clearing the search query or create a new category.</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT CATEGORY MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              setIsModalOpen(false);
            }
          }}
        >
          <div
            ref={categoryModalRef}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure name, retention period (days), and visual badge
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medicine, Electronics, Clothing, Eyeglasses"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                />
              </div>

              {/* Retention Days */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Retention Period (Days) *
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    Auto-locks on Item Add
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    required
                    value={formRetentionDays}
                    onChange={e => setFormRetentionDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    {formRetentionDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Items stored in this category will keep this retention window before becoming eligible for disposal or dispatch.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Handling Guidelines
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prescription pills and medical supplies. Safely discarded after 7 days."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 resize-none"
                />
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormColor(preset.hex)}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center border-2 ${
                        formColor === preset.hex ? 'scale-110 border-slate-900 ring-2 ring-indigo-500/30' : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.label}
                    >
                      {formColor === preset.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Live Preview in Item Dropdown
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: formColor }}
                  />
                  <span className="text-xs font-bold text-slate-900">
                    {formName || 'Category Name'}
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    ({formRetentionDays} {formRetentionDays === 1 ? 'Day' : 'Days'} Retention)
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center space-x-1.5"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              setDeletingCategory(null);
            }
          }}
        >
          <div
            ref={deleteCategoryModalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 animate-scale-up"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Delete Category &quot;{deletingCategory.name}&quot;?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove this category from the hotel system? Existing logged items will retain their current data, but staff won&apos;t be able to select this category for new items.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                {isSaving ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESTORE DEFAULTS CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              setIsResetConfirmOpen(false);
            }
          }}
        >
          <div
            ref={resetModalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4 animate-scale-up"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Restore Standard Categories?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will reset your item categories list to the hotel defaults (Medicine: 7 days, Clothing: 30 days, Electronics: 90 days, Documents: 180 days, Jewelry: 365 days, Foods: 3 days, etc.).
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleRestoreDefaults}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                {isSaving ? 'Restoring...' : 'Yes, Restore Defaults'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
