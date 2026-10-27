import React from 'react';
import { Plus, FileSpreadsheet, FileText } from 'lucide-react';
import { Translations } from '../../../context/LanguageContext';

interface ItemsHeaderProps {
  t: Translations;
  isAdminTier: boolean;
  hasCreatePermission: boolean;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onAddNewItem: () => void;
}

export const ItemsHeader: React.FC<ItemsHeaderProps> = ({
  t,
  isAdminTier,
  hasCreatePermission,
  onExportExcel,
  onExportCSV,
  onAddNewItem
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4A1755] via-[#A21CAF] to-[#C026D3] dark:from-[#E879F9] dark:via-[#D946EF] dark:to-[#A78BFA] tracking-tight">
          {t.lostAndFoundItems || 'Lost & Found Data Table'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.hotelSubtitle || 'Interactive hotel inventory database with live sorting, pagination, and multi-record controls'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          id="btn-export-excel"
          onClick={onExportExcel}
          className="flex items-center space-x-1.5 px-3.5 py-2 btn-primary-gradient text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
          <span>{t.exportExcel || 'Export Excel'}</span>
        </button>

        <button
          id="btn-export-csv"
          onClick={onExportCSV}
          className="flex items-center space-x-1.5 px-3.5 py-2 btn-primary-gradient text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-white" />
          <span>{t.exportCSV || 'CSV'}</span>
        </button>

        {hasCreatePermission && (
          <button
            id="btn-items-add-new"
            onClick={onAddNewItem}
            className="flex items-center space-x-1.5 px-4 py-2 btn-primary-gradient text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addItem || (isAdminTier ? 'Add New Item' : 'Submit Found Item')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
