import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  HelpCircle,
  PlusCircle,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
  Check,
  Cloud,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LostItem, ItemCategory } from '../types';

export const DataImportExportSettings: React.FC = () => {
  const { items, importItems, setActiveTab } = useApp();
  const { user } = useAuth();

  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [inputFormat, setInputFormat] = useState<'csv' | 'json'>('csv');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<Partial<LostItem>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; mode: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse CSV string into objects
  const parseCSV = (csvText: string): Partial<LostItem>[] => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row.');
    }

    // Split headers handling quotes
    const headers = splitCSVRow(lines[0]).map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
    const itemsList: Partial<LostItem>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = splitCSVRow(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx]?.trim() || '';
      });

      // Map row to LostItem fields
      const itemName = row['itemname'] || row['item'] || row['name'] || row['title'] || row['description'] || '';
      if (!itemName) continue;

      const dateFound = row['datefound'] || row['date'] || new Date().toISOString().split('T')[0];
      const category = normalizeCategory(row['category'] || row['type'] || 'Other');
      const locationFound = row['locationfound'] || row['location'] || row['place'] || 'Hotel Room';
      const roomNumber = row['roomnumber'] || row['room'] || row['roomno'] || '';
      const guestName = row['guestname'] || row['guest'] || '';
      const employeeName = row['finderstaff'] || row['employeename'] || row['foundby'] || row['finder'] || user?.name || 'Staff';
      const storeLocation = row['storelocation'] || row['storage'] || row['store'] || 'HK Office';
      const description = row['description'] || row['details'] || itemName;
      const status = normalizeStatus(row['status'] || 'Stored');
      const timeFound = row['timefound'] || row['time'] || '12:00';
      const dispatchDurationDays = Number(row['dispatchdurationdays'] || row['dispatchduration'] || row['duration']) || 90;

      itemsList.push({
        itemName,
        category,
        description,
        dateFound,
        timeFound,
        locationFound,
        roomNumber,
        guestName,
        employeeName,
        storeLocation,
        status,
        dispatchDurationDays
      });
    }

    return itemsList;
  };

  const splitCSVRow = (rowStr: string): string[] => {
    const result: string[] = [];
    let insideQuotes = false;
    let current = '';

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if ((char === ',' || char === '\t') && !insideQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(s => s.replace(/^["']|["']$/g, '').trim());
  };

  const normalizeCategory = (cat?: string): ItemCategory => {
    const c = (cat || '').toLowerCase();
    if (c.includes('elect') || c.includes('phone') || c.includes('charg') || c.includes('laptop')) return 'Electronics';
    if (c.includes('cloth') || c.includes('thob') || c.includes('dress') || c.includes('shirt')) return 'Clothing';
    if (c.includes('doc') || c.includes('pass') || c.includes('id') || c.includes('card')) return 'Documents';
    if (c.includes('jewel') || c.includes('ring') || c.includes('watch') || c.includes('gold')) return 'Jewelry';
    if (c.includes('med') || c.includes('pill') || c.includes('drug')) return 'Medicines';
    if (c.includes('food') || c.includes('drink') || c.includes('snack') || c.includes('choc')) return 'Foods';
    if (c.includes('bag') || c.includes('wallet') || c.includes('purse') || c.includes('luggage') || c.includes('key') || c.includes('glass') || c.includes('cosm')) return 'Personal Items';
    return 'Other';
  };

  const normalizeStatus = (stat?: string): LostItem['status'] => {
    const s = (stat || '').toLowerCase();
    if (s.includes('hand') || s.includes('deliver') || s.includes('return')) return 'Handed Over';
    if (s.includes('disp') || s.includes('ship') || s.includes('courier')) return 'Dispatched';
    if (s.includes('waste') || s.includes('dispose')) return 'Disposed';
    if (s.includes('unclaim')) return 'Unclaimed';
    if (s.includes('claim')) return 'Pending Claim';
    if (s.includes('found')) return 'Found';
    if (s.includes('archive')) return 'Archived';
    return 'Stored';
  };

  const handleProcessRawData = (text: string, format: 'csv' | 'json') => {
    setParseError(null);
    setImportSuccess(null);

    if (!text.trim()) {
      setParsedItems([]);
      return;
    }

    try {
      if (format === 'json') {
        const json = JSON.parse(text);
        const list = Array.isArray(json) ? json : [json];
        if (list.length === 0) throw new Error('JSON array is empty.');
        const normalized = list.map((item: any) => ({
          itemName: item.itemName || item.name || item.title || item.description || 'Imported Item',
          category: normalizeCategory(item.category || item.type || 'Other'),
          description: item.description || item.itemName || '',
          dateFound: item.dateFound || new Date().toISOString().split('T')[0],
          timeFound: item.timeFound || '12:00',
          locationFound: item.locationFound || item.location || 'Hotel Premises',
          roomNumber: item.roomNumber || '',
          guestName: item.guestName || '',
          employeeName: item.employeeName || item.foundBy || user?.name || 'Staff',
          storeLocation: item.storeLocation || 'HK Office',
          status: normalizeStatus(item.status || 'Stored'),
          dispatchDurationDays: Number(item.dispatchDurationDays) || 90
        }));
        setParsedItems(normalized);
      } else {
        const list = parseCSV(text);
        if (list.length === 0) throw new Error('No valid item records found in CSV.');
        setParsedItems(list);
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse data.');
      setParsedItems([]);
    }
  };

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const isJson = file.name.endsWith('.json');
    const format = isJson ? 'json' : 'csv';
    setInputFormat(format);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawText(content);
      handleProcessRawData(content, format);
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedItems.length === 0) return;
    try {
      setIsImporting(true);
      setParseError(null);
      const res = await importItems(parsedItems, importMode);
      setImportSuccess({
        count: res.count || parsedItems.length,
        mode: importMode
      });
      setRawText('');
      setFileName(null);
      setParsedItems([]);
    } catch (err: any) {
      setParseError(err.message || 'Import failed. Please check your data format.');
    } finally {
      setIsImporting(false);
    }
  };

  // Sample CSV Download
  const downloadSampleCSV = () => {
    const csvContent = `Item Name,Category,Date Found,Time Found,Location Found,Room Number,Guest Name,Finder Staff,Store Location,Description,Status,Dispatch Duration Days
iPhone 15 Pro Max,Electronics,2026-08-20,14:30,Room 302,302,Alexander Wright,Minhaz,HK Office,Natural Titanium color in black silicone case with screen protector,Stored,90
Gucci Leather Wallet,Bags & Wallets,2026-08-21,11:15,Lobby Cafe,,Fahad Al-Otaibi,Weal Salem,HK Safe,Brown monogram bi-fold wallet containing business cards,Stored,90
Traditional White Thobe,Clothing,2026-08-22,09:45,Room 514,514,Sultan Mansoor,Alhanouf,HK Office,Silk-blend white Saudi thobe left in wardrobe rack,Stored,90
Ray-Ban Aviator Sunglasses,Eyewear,2026-08-23,16:00,Swimming Pool Area,,Emma Watson,Minhaz,HK Office,Gold frame polarized dark green lenses with leather pouch,Stored,90
Rolex Oyster Watch,Jewelry,2026-08-24,18:20,Executive Lounge,,Dr. Tariq,Samir,HK Safe,Stainless steel luxury timepiece with blue dial,Stored,120`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hotel_lost_found_sample_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sample JSON Download
  const downloadSampleJSON = () => {
    const sample = [
      {
        itemName: 'Apple MacBook Air M2',
        category: 'Electronics',
        description: 'Space Gray 13-inch laptop left on study desk in room',
        dateFound: '2026-08-20',
        timeFound: '15:30',
        locationFound: 'Room 408',
        roomNumber: '408',
        guestName: 'David Miller',
        employeeName: 'Minhaz',
        storeLocation: 'HK Office Safe',
        status: 'Stored',
        dispatchDurationDays: 90
      },
      {
        itemName: 'Diamond Tennis Bracelet',
        category: 'Jewelry',
        description: 'White gold bracelet found under bathroom vanity',
        dateFound: '2026-08-22',
        timeFound: '10:00',
        locationFound: 'Room 701',
        roomNumber: '701',
        guestName: 'Sophia Loren',
        employeeName: 'Alhanouf',
        storeLocation: 'HK Safe',
        status: 'Stored',
        dispatchDurationDays: 90
      }
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hotel_lost_found_sample_template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export All Items CSV
  const handleExportItemsCSV = () => {
    const headers = [
      'Tracking Code',
      'Item Name',
      'Category',
      'Date Found',
      'Time Found',
      'Location Found',
      'Room Number',
      'Guest Name',
      'Finder Staff',
      'Store Location',
      'Status',
      'Recorded By',
      'Description',
      'Dispatch Deadline'
    ];

    const rows = items.map(i => [
      `"${i.code}"`,
      `"${(i.itemName || '').replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.dateFound}"`,
      `"${i.timeFound || ''}"`,
      `"${(i.locationFound || '').replace(/"/g, '""')}"`,
      `"${i.roomNumber || ''}"`,
      `"${(i.guestName || '').replace(/"/g, '""')}"`,
      `"${(i.employeeName || '').replace(/"/g, '""')}"`,
      `"${(i.storeLocation || '').replace(/"/g, '""')}"`,
      `"${i.status}"`,
      `"${(i.recordedBy || '').replace(/"/g, '""')}"`,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      `"${i.dispatchDeadline || ''}"`
    ]);

    const csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lost_and_found_items_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export All Items JSON
  const handleExportItemsJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lost_and_found_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-slate-900 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold">Dynamic Data Import & Export Hub</h2>
          </div>
          <p className="text-xs text-slate-500">
            Import lost & found records dynamically from CSV/Excel or JSON files, automatically populating the item list with real-time sync.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={downloadSampleCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Download CSV sample file with column templates"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sample CSV</span>
          </button>
          <button
            type="button"
            onClick={downloadSampleJSON}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Download JSON sample file"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sample JSON</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">
                Successfully imported {importSuccess.count} item records ({importSuccess.mode} mode)!
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                The items are now dynamically added and live in the Lost & Found Item Registry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>View Item List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Parse Error Notification */}
      {parseError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-900 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Import Error: </span>
            <span>{parseError}</span>
          </div>
        </div>
      )}

      {/* Step 1: Upload or Paste Data */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">1</span>
            <span>Upload File or Paste Raw Records</span>
          </label>

          {/* Format Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setInputFormat('csv');
                if (rawText) handleProcessRawData(rawText, 'csv');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                inputFormat === 'csv' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              CSV / Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setInputFormat('json');
                if (rawText) handleProcessRawData(rawText, 'json');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                inputFormat === 'json' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              JSON Array
            </button>
          </div>
        </div>

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.json"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {fileName ? (
                  <span className="text-indigo-600 font-mono">{fileName}</span>
                ) : (
                  'Click to upload or drag & drop CSV or JSON file'
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supported formats: .CSV (Excel export), .JSON array of lost item objects
              </p>
            </div>
          </div>
        </div>

        {/* Or Text Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Or paste raw data directly:</span>
            {rawText && (
              <button
                type="button"
                onClick={() => {
                  setRawText('');
                  setFileName(null);
                  setParsedItems([]);
                }}
                className="text-rose-500 hover:text-rose-700 font-medium"
              >
                Clear Input
              </button>
            )}
          </div>
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              handleProcessRawData(e.target.value, inputFormat);
            }}
            placeholder={
              inputFormat === 'csv'
                ? 'Item Name, Category, Date Found, Room Number, Guest Name, Store Location\nGold Watch, Jewelry, 2026-08-20, 304, Robert Fox, HK Safe'
                : '[\n  {\n    "itemName": "Gold Watch",\n    "category": "Jewelry",\n    "dateFound": "2026-08-20",\n    "roomNumber": "304"\n  }\n]'
            }
            rows={4}
            className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Step 2: Live Data Preview & Summary */}
      {parsedItems.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">2</span>
              <span>Data Preview ({parsedItems.length} Valid Records Found)</span>
            </label>

            {/* Mode selection */}
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-500 font-medium">Import Strategy:</span>
              <label className="inline-flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold">Append (Add to list)</span>
              </label>
              <label className="inline-flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-600">Replace All Items</span>
              </label>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Location / Room</th>
                    <th className="py-2.5 px-3">Finder Staff</th>
                    <th className="py-2.5 px-3">Store Location</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {parsedItems.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.itemName}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{item.dateFound}</td>
                      <td className="py-2 px-3">
                        {item.roomNumber ? `Room ${item.roomNumber}` : item.locationFound}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.employeeName}</td>
                      <td className="py-2 px-3 text-indigo-600 font-medium">{item.storeLocation}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedItems.length > 10 && (
              <div className="bg-slate-50 px-3 py-2 text-[11px] text-slate-500 border-t border-slate-200 text-center font-medium">
                Showing first 10 rows of {parsedItems.length} records to be imported.
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setParsedItems([]);
                setRawText('');
                setFileName(null);
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isImporting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Importing Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Import {parsedItems.length} Items Dynamically</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Export & Backup Hub */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export & Backup Registry</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Download your current live Lost & Found inventory records ({items.length} items) for offline archiving or reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Export as CSV / Excel</p>
                <p className="text-[11px] text-slate-500">Formatted spreadsheet compatible with Microsoft Excel & Sheets</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportItemsCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Export Full JSON Backup</p>
                <p className="text-[11px] text-slate-500">Raw JSON dataset containing complete timelines and metadata</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportItemsJSON}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Google Drive Auto Backup Highlight */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-4 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-bold text-slate-900">Google Drive Automated Cloud Backups</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Cloud Live
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Automatically snapshot full database, staff accounts, certificates, audit logs & settings directly into your Google Drive on an hourly, daily, or weekly schedule.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-goto-gdrive-backup"
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex-shrink-0"
          >
            <span>Manage Cloud Backups</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
