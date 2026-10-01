import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, CheckCircle2, MapPin, User, Calendar, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ItemCategory, ItemStatus } from '../../types';
import { DEFAULT_ITEM_CATEGORIES } from '../../lib/constants';
import { generateUniqueItemCode } from '../../lib/codeGenerator';
import { capitalizeWords } from '../../lib/stringUtils';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-toastify';
import {
  itemValidationSchema,
  validateForm,
  FormFieldErrorMessage,
  FormValidationBanner,
  getFieldInputClasses,
  ItemFormData
} from '../../lib/validationSchema';

// Helper to check if string contains only standard English ASCII characters
const isEnglishOnly = (text: string): boolean => {
  if (!text) return true;
  return /^[\x20-\x7E\r\n\t]*$/.test(text);
};

// Helper to normalize any date input into YYYY-MM-DD for standard <input type="date">
const parseDateToYMD = (dateVal?: string): string => {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  const trimmed = dateVal.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  if (/^\d{4}\/\d{2}\/\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10).replace(/\//g, '-');
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(trimmed)) {
    const parts = trimmed.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

const STANDARD_LOCATIONS = [
  'Room',
  'Lobby Lounge',
  'Restaurant',
  'Swimming Pool',
  'Fitness Center / Gym',
  'Spa & Wellness',
  'Banquet Hall',
  'Parking Area',
  'Other'
];

export const AddItemModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, editingItem, setEditingItem, createItem, updateItem, staff, settings, items, getValidationMessage } = useApp();
  const { user } = useAuth();

  const isAdminRole = ['Super Admin', 'Admin', 'Manager'].includes(user?.role || '');
  const isAdminTier = ['Super Admin', 'Admin', 'Manager', 'Supervisor'].includes(user?.role || '');

  // Dynamic Categories from Settings
  const availableCategories = (settings?.categories && settings?.categories.length > 0)
    ? settings.categories
    : DEFAULT_ITEM_CATEGORIES;

  const defaultCategoryName = availableCategories[0]?.name || 'Clothing';
  const defaultCategoryRetention = availableCategories[0]?.retentionDays || settings?.defaultDispatchDurationDays || 30;

  const [dateFound, setDateFound] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>(defaultCategoryName);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState('Room');
  const [customLocation, setCustomLocation] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [storeLocation, setStoreLocation] = useState(settings?.defaultStoreLocation || 'HK Office');
  const [dispatchDurationDays, setDispatchDurationDays] = useState(defaultCategoryRetention);
  const [status, setStatus] = useState<ItemStatus>('Stored');
  const [customCode, setCustomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Unified Item Schema Validation
  const itemFormData: ItemFormData = useMemo(() => ({
    itemName,
    category,
    dateFound,
    locationType,
    roomNumber,
    customLocation,
    storeLocation,
    employeeName,
    customCode: ''
  }), [itemName, category, dateFound, locationType, roomNumber, customLocation, storeLocation, employeeName]);

  const validationContext = useMemo(() => ({
    existingItems: items,
    currentId: editingItem?.id || null,
    requireFinder: isAdminTier && !editingItem
  }), [items, editingItem, isAdminTier]);

  const validation = useMemo(() => {
    return validateForm(itemFormData, itemValidationSchema, validationContext);
  }, [itemFormData, validationContext]);

  const { errors, errorList, hasDuplicateError } = validation;

  const isCodeDuplicate = false;

  const handleClose = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isAddModalOpen,
    closeOnEsc: true
  });

  // Track previous modal open state and editingItem ID to prevent clearing form while user types
  const prevModalOpenRef = useRef(false);
  const prevEditingIdRef = useRef<string | null>(null);

  // Category Selection handler: dynamically sets retention days
  const handleCategoryChange = (newCatName: string) => {
    setCategory(newCatName);
    const found = availableCategories.find(c => c.name.toLowerCase() === newCatName.toLowerCase());
    if (found && typeof found.retentionDays === 'number') {
      setDispatchDurationDays(found.retentionDays);
    }
  };

  // Sync state ONLY when modal is opened or target editing item changes
  useEffect(() => {
    const isOpeningNow = !prevModalOpenRef.current && isAddModalOpen;
    const editingChanged = editingItem?.id !== prevEditingIdRef.current;

    if (isAddModalOpen && (isOpeningNow || editingChanged)) {
      setValidationError(null);
      if (editingItem) {
        // 1. Date Found
        const rawDate = editingItem.dateFound || (editingItem as any).date_found || (editingItem as any).createdAt;
        setDateFound(parseDateToYMD(rawDate));

        // 2. Category & Retention Days
        const itemCat = editingItem.category || defaultCategoryName;
        setCategory(itemCat);

        // 3. Item Name & Description
        const rawName =
          editingItem.itemName ||
          (editingItem as any).name ||
          (editingItem as any).item_name ||
          editingItem.description ||
          '';
        const rawDesc = editingItem.description || '';
        setItemName(rawName);
        setDescription(rawDesc);

        // 4. Room Number & Location Found
        let rawRoom = editingItem.roomNumber || (editingItem as any).room_number || (editingItem as any).room || '';
        const locFound = editingItem.locationFound || (editingItem as any).location_found || '';

        if (!rawRoom && locFound) {
          const roomMatch = locFound.match(/Room\s*#?\s*([0-9a-zA-Z-]+)/i);
          if (roomMatch) {
            rawRoom = roomMatch[1];
          }
        }
        setRoomNumber(rawRoom);

        if (locFound.toLowerCase().startsWith('room') || rawRoom) {
          setLocationType('Room');
          setCustomLocation('');
        } else if (STANDARD_LOCATIONS.includes(locFound)) {
          setLocationType(locFound);
          setCustomLocation('');
        } else if (locFound) {
          setLocationType('Other');
          setCustomLocation(locFound);
        } else {
          setLocationType('Room');
          setCustomLocation('');
        }

        // 5. Guest Name
        const rawGuest = editingItem.guestName || (editingItem as any).guest_name || '';
        setGuestName(rawGuest === 'Unknown' || rawGuest === '-' ? '' : rawGuest);

        // 6. Employee Name: Locked to original finder
        const rawEmployee =
          editingItem.employeeName ||
          (editingItem as any).employee_name ||
          (editingItem as any).finder ||
          (editingItem as any).finderName ||
          (editingItem as any).recordedBy ||
          editingItem.recordedBy ||
          '';
        setEmployeeName(rawEmployee || 'Staff');

        // 7. Store Location
        setStoreLocation(editingItem.storeLocation || (editingItem as any).store_location || settings?.defaultStoreLocation || 'HK Office');

        // 8. Dispatch Duration Days
        const existingRetention = editingItem.dispatchDurationDays || (editingItem as any).dispatch_duration_days;
        if (existingRetention) {
          setDispatchDurationDays(existingRetention);
        } else {
          const found = availableCategories.find(c => c.name.toLowerCase() === itemCat.toLowerCase());
          setDispatchDurationDays(found?.retentionDays || settings?.defaultDispatchDurationDays || 30);
        }

        // 9. Status
        setStatus(editingItem.status || 'Stored');

        // 10. Code
        setCustomCode(editingItem.code || '');
      } else {
        const initialCat = availableCategories[0] || { name: 'Clothing', retentionDays: 30 };
        setDateFound(new Date().toISOString().split('T')[0]);
        setCategory(initialCat.name);
        setItemName('');
        setDescription('');
        setCustomCode('');
        setLocationType('Room');
        setCustomLocation('');
        setRoomNumber('');
        setGuestName('');
        setEmployeeName(isAdminTier ? '' : (user?.name || ''));
        setStoreLocation(settings?.defaultStoreLocation || 'HK Office');
        setDispatchDurationDays(initialCat.retentionDays || settings?.defaultDispatchDurationDays || 30);
        setStatus(isAdminTier ? 'Stored' : 'Pending Approval');
      }
    }

    prevModalOpenRef.current = isAddModalOpen;
    prevEditingIdRef.current = editingItem?.id || null;
  }, [isAddModalOpen, editingItem?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setHasAttemptedSubmit(true);

    if (!validation.isValid) {
      const firstErr = validation.firstError;
      if (firstErr) {
        setValidationError(firstErr.message);
        toast.warning(firstErr.message);
      }
      return;
    }

    const finalItemName = capitalizeWords(itemName.trim());

    // English-only validation across all user inputs
    const inputsToCheck = [
      { name: 'Item Name', val: finalItemName },
      { name: 'Room Number', val: roomNumber },
      { name: 'Custom Location', val: customLocation },
      { name: 'Guest Name', val: guestName },
      { name: 'Finder Employee', val: employeeName }
    ];

    for (const inp of inputsToCheck) {
      if (inp.val && !isEnglishOnly(inp.val)) {
        const errorMsg = `Only English characters (A-Z, 0-9, and standard punctuation) are allowed in ${inp.name}. Please enter lost item details in English only.`;
        setValidationError(errorMsg);
        toast.warning(`⚠️ ${errorMsg}`);
        return;
      }
    }

    const finalDescription = (editingItem && editingItem.description) ? editingItem.description : finalItemName;

    // Final employee name determination
    let finalEmployeeName = employeeName.trim();
    if (!isAdminTier) {
      finalEmployeeName = user?.name || 'Staff Member';
    } else if (editingItem) {
      finalEmployeeName = editingItem.employeeName || employeeName.trim() || 'Staff Member';
    }
    if (!finalEmployeeName) {
      finalEmployeeName = user?.name || 'Staff Member';
    }

    // Automatically determine retention days from category policy dynamically
    const categoryConfig = availableCategories.find(c => c.name.toLowerCase() === category.toLowerCase());
    const computedRetentionDays = editingItem
      ? (Number(dispatchDurationDays) || categoryConfig?.retentionDays || settings?.defaultDispatchDurationDays || 30)
      : (categoryConfig?.retentionDays || settings?.defaultDispatchDurationDays || 30);

    // Automatically determine status:
    // Staff member upload -> 'Pending Approval' (shows under pending)
    // Other users (Super Admin / Admin / Manager / Supervisor) -> 'Stored' (shows in Stored immediately on dashboard)
    const autoStatus: ItemStatus = !isAdminTier ? 'Pending Approval' : 'Stored';
    const finalStatus: ItemStatus = editingItem ? (isAdminTier ? status : editingItem.status) : autoStatus;

    setIsSubmitting(true);
    try {
      let computedLocation = locationType;
      let finalRoomNumber = '';
      if (locationType === 'Room') {
        finalRoomNumber = roomNumber.trim();
        computedLocation = finalRoomNumber ? `Room ${finalRoomNumber}` : 'Room';
      } else if (locationType === 'Other') {
        computedLocation = customLocation.trim() || 'Hotel Area';
      } else {
        computedLocation = locationType;
      }

      if (editingItem) {
        await updateItem(editingItem.id, {
          code: editingItem.code,
          dateFound,
          category,
          itemName: finalItemName,
          description: finalDescription,
          locationFound: computedLocation,
          roomNumber: finalRoomNumber,
          guestName: guestName.trim() || 'Unknown',
          employeeName: isAdminRole ? (employeeName.trim() || editingItem.employeeName) : editingItem.employeeName,
          storeLocation: storeLocation.trim() || settings?.defaultStoreLocation || 'HK Office',
          dispatchDurationDays: computedRetentionDays,
          status: finalStatus
        });
      } else {
        await createItem({
          dateFound,
          category,
          itemName: finalItemName,
          description: finalDescription,
          locationFound: computedLocation,
          roomNumber: finalRoomNumber,
          guestName: guestName.trim() || 'Unknown',
          employeeName: finalEmployeeName,
          storeLocation: storeLocation.trim() || settings?.defaultStoreLocation || 'HK Office',
          dispatchDurationDays: computedRetentionDays,
          status: finalStatus
        });
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Error saving item:', err);
      const errMsg = err.message || 'Failed to save item.';
      setValidationError(errMsg);
      toast.error(`❌ ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Lost & Found Record' : 'Register New Lost Item'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {editingItem
                ? 'Update details with instant real-time cloud and local synchronization.'
                : 'Fill in the details below to log and categorize the found inventory item.'}
            </p>
          </div>
          <button
            id="btn-close-add-modal"
            onClick={() => {
              setIsAddModalOpen(false);
              setEditingItem(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Top Unified Validation Banner */}
          {(hasDuplicateError || hasAttemptedSubmit) && errorList.length > 0 && (
            <FormValidationBanner errors={errorList} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Found *
              </label>
              <input
                id="input-add-date-found"
                type="date"
                required
                value={dateFound}
                onChange={e => setDateFound(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                id="select-add-category"
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
              >
                {availableCategories.map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Item Title / Name *
              </label>
              <span className="text-[11px] text-slate-400">e.g. Gold Ring, iPhone 15, Samsonite Suitcase</span>
            </div>
            <input
              id="input-add-item-name"
              type="text"
              required
              placeholder="e.g. Gold Ring 18K, Samsonite Suitcase, iPhone 15"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              className={`${getFieldInputClasses(Boolean(errors.itemName && hasAttemptedSubmit))} font-medium capitalize`}
              style={{ textTransform: 'capitalize' }}
            />
            <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.itemName : null} />
          </div>

          {/* Location Found & Room Number */}
          <div className={`grid gap-4 ${locationType === 'Room' || locationType === 'Other' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location Found *
              </label>
              <select
                id="select-add-location"
                value={locationType}
                onChange={e => setLocationType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              >
                <option value="Room">Room</option>
                <option value="Lobby Lounge">Lobby Lounge</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Swimming Pool">Swimming Pool</option>
                <option value="Fitness Center / Gym">Fitness Center / Gym</option>
                <option value="Spa & Wellness">Spa & Wellness</option>
                <option value="Banquet Hall">Banquet Hall</option>
                <option value="Parking Area">Parking Area</option>
                <option value="Other">Other (Specify Custom Location)</option>
              </select>
            </div>

            {locationType === 'Room' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Number *
                </label>
                <input
                  id="input-add-room-number"
                  type="text"
                  required
                  placeholder="e.g. 404, 216, 501"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  className={getFieldInputClasses(Boolean(errors.roomNumber && hasAttemptedSubmit))}
                />
                <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.roomNumber : null} />
              </div>
            )}

            {locationType === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Location Name *
                </label>
                <input
                  id="input-add-custom-location"
                  type="text"
                  required
                  placeholder="e.g. 3rd Floor Terrace, Kitchen"
                  value={customLocation}
                  onChange={e => setCustomLocation(e.target.value)}
                  className={getFieldInputClasses(Boolean(errors.customLocation && hasAttemptedSubmit))}
                />
                <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.customLocation : null} />
              </div>
            )}
          </div>

          {/* Guest Name & Employee Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Guest Name (if known)
              </label>
              <input
                id="input-add-guest-name"
                type="text"
                placeholder="Name of the guest or Unknown"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Found By (Employee Name) *
                </label>
                {editingItem ? (
                  isAdminRole ? (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      Admin Editable
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Admin Only
                    </span>
                  )
                ) : !isAdminTier ? (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Logged in Staff
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">
                    Select or type staff
                  </span>
                )}
              </div>
              
              {editingItem ? (
                isAdminRole ? (
                  <div>
                    <input
                      id="input-add-employee-name"
                      type="text"
                      required
                      list="staff-names-list"
                      placeholder="Enter or select finder name..."
                      value={employeeName}
                      onChange={e => setEmployeeName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-indigo-300 bg-indigo-50/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                    />
                    <span className="text-[10px] text-indigo-600 mt-1 block">
                      Admin Authorized: You can modify the finder employee record.
                    </span>
                    <datalist id="staff-names-list">
                      {staff.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.department} - {s.role})
                        </option>
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      id="input-add-employee-name"
                      type="text"
                      disabled
                      value={employeeName}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium cursor-not-allowed"
                      title="Only Admin can modify Finder Employee name"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Only Admin can modify the Finder Employee Name.
                    </span>
                  </div>
                )
              ) : !isAdminTier ? (
                <div className="relative">
                  <input
                    id="input-add-employee-name"
                    type="text"
                    disabled
                    value={user?.name || employeeName || 'Staff Member'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-amber-50/50 text-slate-800 font-medium cursor-not-allowed"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    Auto-filled with your staff account name.
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    id="input-add-employee-name"
                    type="text"
                    required
                    list="staff-names-list"
                    placeholder="Enter or select staff name..."
                    value={employeeName}
                    onChange={e => setEmployeeName(e.target.value)}
                    className={getFieldInputClasses(Boolean(errors.employeeName && hasAttemptedSubmit))}
                  />
                  <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.employeeName : null} />
                  <datalist id="staff-names-list">
                    {staff.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.department} - {s.role})
                      </option>
                    ))}
                  </datalist>
                </div>
              )}
            </div>
          </div>

          {/* Store Location */}
          <div className={editingItem && isAdminTier ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Location *
              </label>
              <input
                id="input-add-store-location"
                type="text"
                required
                placeholder="e.g. HK Office"
                value={storeLocation}
                onChange={e => setStoreLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            {editingItem && isAdminTier && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="select-add-status"
                  value={status}
                  onChange={e => setStatus(e.target.value as ItemStatus)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                >
                  <option value="Stored">Stored</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Pending Claim">Pending Claim</option>
                  <option value="Handed Over">Handed Over</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Unclaimed">Unclaimed</option>
                </select>
              </div>
            )}
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
            <div className="flex items-center text-[11px] text-emerald-600 font-medium space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-time sync enabled</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="btn-add-item-cancel"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-add-item-submit"
                disabled={isSubmitting || hasDuplicateError}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <span>
                    {editingItem
                      ? 'Save & Sync Changes'
                      : !isAdminTier
                      ? 'Submit for Approval'
                      : 'Register & Store Item'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
