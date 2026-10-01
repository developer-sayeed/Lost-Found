import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  User as UserIcon,
  Calendar,
  CreditCard,
  Building,
  Briefcase,
  Phone,
  Mail,
  Shield,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Printer,
  Edit3,
  Save,
  X,
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Boxes,
  ArrowLeft,
  Users,
  Award,
  Layers,
  Truck,
  RotateCcw,
  Lock,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import {
  staffValidationSchema,
  validateForm,
  FormFieldErrorMessage,
  FormValidationBanner,
  getFieldInputClasses
} from '../lib/validationSchema';
import { LostItem, StaffMember, User } from '../types';
import { toast } from 'react-toastify';

export const UserProfileView: React.FC = () => {
  const { user, updateProfile, hasPermission } = useAuth();
  const { items, staff, updateStaff, selectedStaffProfile, setSelectedStaffProfile, openItemDetails, openPrint } = useApp();

  // Selected staff state (default to selectedStaffProfile or current logged in user with exact email match)
  const currentStaffMatch = useMemo(() => {
    if (selectedStaffProfile) {
      return staff.find(s => s.id === selectedStaffProfile.id || (s.email && selectedStaffProfile.email && s.email.toLowerCase() === selectedStaffProfile.email.toLowerCase())) || selectedStaffProfile;
    }
    if (user) {
      const uEmail = (user.email || '').toLowerCase().trim();
      return staff.find(s => s.email && uEmail && s.email.toLowerCase().trim() === uEmail) || null;
    }
    return null;
  }, [selectedStaffProfile, user, staff]);

  // If viewing someone else
  const isViewingOtherStaff = Boolean(selectedStaffProfile && user && selectedStaffProfile.id !== user.id && selectedStaffProfile.email !== user.email);
  const canEditCurrentProfile = !isViewingOtherStaff || user?.role === 'Super Admin' || hasPermission('edit_staff') || hasPermission('manage_staff_access');

  const displayName = selectedStaffProfile?.name || user?.name || currentStaffMatch?.name || 'Staff Member';
  const displayEmail = selectedStaffProfile?.email || user?.email || currentStaffMatch?.email || '';
  const displayRole = selectedStaffProfile?.role || user?.role || currentStaffMatch?.role || 'Employee';
  const displayDept = selectedStaffProfile?.department || user?.department || currentStaffMatch?.department || 'Housekeeping';
  const displayPhone = selectedStaffProfile?.phone || user?.phone || currentStaffMatch?.phone || '';
  const displayStaffId = selectedStaffProfile?.staffId || selectedStaffProfile?.userId || user?.staffId || currentStaffMatch?.staffId || currentStaffMatch?.userId || 'STF-2026-01';
  const displayIqama = selectedStaffProfile?.iqamaNumber || user?.iqamaNumber || currentStaffMatch?.iqamaNumber || '';
  const displayDOB = selectedStaffProfile?.dateOfBirth || user?.dateOfBirth || currentStaffMatch?.dateOfBirth || '';
  const displayWorkplace = selectedStaffProfile?.workplace || user?.workplace || currentStaffMatch?.workplace || 'Warwick Hotels and Resorts';
  const displayPosition = selectedStaffProfile?.position || user?.position || currentStaffMatch?.position || displayDept;
  const displayEmergency = selectedStaffProfile?.emergencyContact || user?.emergencyContact || currentStaffMatch?.emergencyContact || '';

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: displayName,
    email: displayEmail,
    phone: displayPhone,
    dateOfBirth: displayDOB,
    iqamaNumber: displayIqama,
    staffId: displayStaffId,
    workplace: displayWorkplace,
    department: displayDept,
    position: displayPosition,
    emergencyContact: displayEmergency
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverDuplicates, setServerDuplicates] = useState<Record<string, { message: string; existingName?: string; value?: string }>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Identity of currently edited staff profile (to exclude from duplicate checks)
  const currentEditingId = useMemo(() => {
    if (isViewingOtherStaff && selectedStaffProfile) {
      return selectedStaffProfile.id || (selectedStaffProfile as any)._id || selectedStaffProfile.userId;
    }
    return currentStaffMatch?.id || (currentStaffMatch as any)?._id || currentStaffMatch?.userId || user?.id || user?.staffId;
  }, [isViewingOtherStaff, selectedStaffProfile, currentStaffMatch, user]);

  // Unified Schema-based Validation
  const validationContext = useMemo(() => ({
    existingStaff: staff,
    currentId: currentEditingId,
    serverDuplicates,
    isEditing: true
  }), [staff, currentEditingId, serverDuplicates]);

  const validation = useMemo(() => {
    return validateForm(editFormData, staffValidationSchema, validationContext);
  }, [editFormData, validationContext]);

  const { errors, errorList, hasDuplicateError } = validation;

  // Real-time asynchronous database check
  useEffect(() => {
    if (!isEditing) {
      setServerDuplicates({});
      setHasAttemptedSubmit(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const cleanPhone = (editFormData.phone || '').trim().replace(/[\s\-\+\(\)]/g, '');
        const res = await api.checkStaffDuplicate({
          staffId: (editFormData.staffId || '').trim() || undefined,
          iqamaNumber: (editFormData.iqamaNumber || '').trim() || undefined,
          phone: cleanPhone.length >= 7 ? editFormData.phone.trim() : undefined,
          email: (editFormData.email || '').trim().toLowerCase() || undefined,
          excludeId: currentEditingId ? String(currentEditingId) : undefined
        });

        if (res.isDuplicate && res.errors) {
          setServerDuplicates(res.errors);
        } else {
          setServerDuplicates({});
        }
      } catch {
        // ignore network error
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [editFormData.staffId, editFormData.iqamaNumber, editFormData.phone, editFormData.email, currentEditingId, isEditing]);

  // Filters & Data Table States for items submitted by this staff
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof LostItem | 'serial'>('dateFound');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter items submitted / found / recorded / handed over by this staff member
  const userSubmittedItems = useMemo(() => {
    const targetName = displayName.toLowerCase().trim();
    const targetEmail = displayEmail.toLowerCase().trim();
    const targetStaffId = displayStaffId.toLowerCase().trim();

    return items.filter(item => {
      const empName = (item.employeeName || '').toLowerCase().trim();
      const recBy = (item.recordedBy || '').toLowerCase().trim();
      const subName = (item.submittedByStaffName || '').toLowerCase().trim();
      const subId = (item.submittedByStaffId || '').toLowerCase().trim();
      const legacyFound = ((item as any).foundBy || '').toLowerCase().trim();
      const legacyLogged = ((item as any).loggedBy || '').toLowerCase().trim();
      const handedBy = (item.handoverDetails?.handedOverBy || '').toLowerCase().trim();

      const matchName = targetName && (
        empName.includes(targetName) ||
        targetName.includes(empName && empName.length > 3 ? empName : '_____none_____') ||
        recBy.includes(targetName) ||
        targetName.includes(recBy && recBy.length > 3 ? recBy : '_____none_____') ||
        subName.includes(targetName) ||
        legacyFound.includes(targetName) ||
        legacyLogged.includes(targetName) ||
        handedBy.includes(targetName)
      );

      const matchId = targetStaffId && subId === targetStaffId;

      return matchName || matchId;
    });
  }, [items, displayName, displayEmail, displayStaffId]);

  // Dynamic Statistics per staff member
  const { totalItemsAdded, itemsPending, successfulHandovers, storedItemsCount, dispatchedItemsCount, successRate } = useMemo(() => {
    const total = userSubmittedItems.length;
    
    // Stored items
    const stored = userSubmittedItems.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s === 'stored' || s === 'found' || s === 'under review' || s === 'registered';
    }).length;

    // Successful handovers
    const handovers = userSubmittedItems.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s === 'handed over' || s === 'claimed' || Boolean(i.handoverDetails);
    }).length;

    // Items pending (pending approval, pending claim, or pending dispatch)
    const pending = userSubmittedItems.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s.includes('pending') || (s === 'stored' && i.dispatchDeadline);
    }).length;

    // Dispatched items
    const dispatched = userSubmittedItems.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s === 'dispatched' || s === 'disposed' || s === 'archived';
    }).length;

    const rate = total > 0 ? Math.round((handovers / total) * 100) : 0;

    return {
      totalItemsAdded: total,
      itemsPending: pending,
      successfulHandovers: handovers,
      storedItemsCount: stored,
      dispatchedItemsCount: dispatched,
      successRate: rate
    };
  }, [userSubmittedItems]);

  // Unique categories from this staff's items
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    userSubmittedItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [userSubmittedItems]);

  // Filtered & Sorted items list
  const filteredAndSortedItems = useMemo(() => {
    const filtered = userSubmittedItems.filter(item => {
      const itemCode = item.code || (item as any).trackingNumber || '';
      const q = (searchFilter || '').toLowerCase().trim();
      const matchesSearch = !q ||
        (item.itemName && item.itemName.toLowerCase().includes(q)) ||
        (itemCode && itemCode.toLowerCase().includes(q)) ||
        (item.locationFound && item.locationFound.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter !== 'All') {
        const s = (item.status || '').toLowerCase();
        if (statusFilter === 'Stored') {
          matchesStatus = s === 'stored' || s === 'found' || s === 'under review';
        } else if (statusFilter === 'Pending') {
          matchesStatus = s.includes('pending');
        } else if (statusFilter === 'Handed Over') {
          matchesStatus = s === 'handed over' || s === 'claimed';
        } else if (statusFilter === 'Dispatched') {
          matchesStatus = s === 'dispatched' || s === 'disposed' || s === 'archived';
        } else {
          matchesStatus = item.status === statusFilter;
        }
      }

      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof LostItem] ?? '';
      let bVal: any = b[sortField as keyof LostItem] ?? '';

      if (sortField === 'dateFound') {
        aVal = new Date(a.dateFound || a.createdAt || 0).getTime();
        bVal = new Date(b.dateFound || b.createdAt || 0).getTime();
      } else {
        aVal = String(aVal ?? '').toLowerCase();
        bVal = String(bVal ?? '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [userSubmittedItems, searchFilter, statusFilter, categoryFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredAndSortedItems.length);
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  // Sorting handler
  const handleSort = (field: keyof LostItem) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: keyof LostItem) => {
    if (sortField !== field) {
      return <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-300 opacity-60" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 text-indigo-600 font-bold" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 text-indigo-600 font-bold" />
    );
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredAndSortedItems.map((item, idx) => ({
        '#': idx + 1,
        'Item Code': item.code || '',
        'Item Name': item.itemName || '',
        'Category': item.category || '',
        'Date Found': item.dateFound || '',
        'Location Found': item.locationFound || '',
        'Storage Location': item.storeLocation || 'HK Office',
        'Status': item.status || '',
        'Staff Name': displayName,
        'Staff ID': displayStaffId,
        'Description': item.description || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Staff Item Logs');
      XLSX.writeFile(wb, `${displayName.replace(/\s+/g, '_')}_Items_Report.xlsx`);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleStartEdit = () => {
    setEditFormData({
      name: displayName,
      email: displayEmail,
      phone: displayPhone,
      dateOfBirth: displayDOB,
      iqamaNumber: displayIqama,
      staffId: displayStaffId,
      workplace: displayWorkplace,
      department: displayDept,
      position: displayPosition,
      emergencyContact: displayEmergency
    });
    setServerDuplicates({});
    setHasAttemptedSubmit(false);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (errorList.length > 0) {
      errorList.forEach(err => {
        toast.error(err.message, { toastId: `profile-val-${err.field}` });
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isViewingOtherStaff && selectedStaffProfile) {
        if (updateStaff) {
          await updateStaff(selectedStaffProfile.id, {
            name: editFormData.name.trim(),
            phone: editFormData.phone.trim(),
            dateOfBirth: editFormData.dateOfBirth,
            iqamaNumber: editFormData.iqamaNumber.trim(),
            staffId: editFormData.staffId.trim(),
            workplace: editFormData.workplace.trim(),
            department: editFormData.department as any,
            position: editFormData.position.trim(),
            emergencyContact: editFormData.emergencyContact.trim()
          });
        }
        setSelectedStaffProfile({
          ...selectedStaffProfile,
          name: editFormData.name.trim(),
          phone: editFormData.phone.trim(),
          dateOfBirth: editFormData.dateOfBirth,
          iqamaNumber: editFormData.iqamaNumber.trim(),
          staffId: editFormData.staffId.trim(),
          workplace: editFormData.workplace.trim(),
          department: editFormData.department as any,
          position: editFormData.position.trim(),
          emergencyContact: editFormData.emergencyContact.trim()
        });
      } else {
        await updateProfile({
          id: user?.id,
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          phone: editFormData.phone.trim(),
          dateOfBirth: editFormData.dateOfBirth,
          iqamaNumber: editFormData.iqamaNumber.trim(),
          staffId: editFormData.staffId.trim(),
          workplace: editFormData.workplace.trim(),
          department: editFormData.department as any,
          position: editFormData.position.trim(),
          emergencyContact: editFormData.emergencyContact.trim()
        });
        // Only sync to staff record if user has an associated staff record with the exact same email
        if (currentStaffMatch && currentStaffMatch.email && user?.email && currentStaffMatch.email.toLowerCase().trim() === user.email.toLowerCase().trim() && updateStaff) {
          try {
            await updateStaff(currentStaffMatch.id, {
              name: editFormData.name.trim(),
              phone: editFormData.phone.trim(),
              dateOfBirth: editFormData.dateOfBirth,
              iqamaNumber: editFormData.iqamaNumber.trim(),
              staffId: editFormData.staffId.trim(),
              workplace: editFormData.workplace.trim(),
              department: editFormData.department as any,
              position: editFormData.position.trim(),
              emergencyContact: editFormData.emergencyContact.trim()
            });
          } catch (syncErr) {
            console.warn('Staff match update sync error:', syncErr);
          }
        }
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setServerDuplicates({});
      setHasAttemptedSubmit(false);
      toast.success('👤 Profile updated successfully!');
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      if (err.errors) {
        setServerDuplicates(err.errors);
      }
      toast.error(`❌ Failed to update profile: ${err.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-32 md:pb-8 w-full max-w-full overflow-x-hidden">
      {/* If viewing other staff member profile, show clean back navigation */}
      {isViewingOtherStaff && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setSelectedStaffProfile(null)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-semibold cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span>Back to My Profile</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Viewing Staff: <strong className="text-slate-800">{displayName}</strong>
          </span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Profile information has been updated and synchronized with the database successfully!</span>
        </div>
      )}

      {/* Main Profile Info Card with Gradient Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 w-full xl:w-auto">
              <div
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center text-xl sm:text-3xl font-bold !text-white shadow-inner flex-shrink-0"
                style={{ color: '#ffffff' }}
              >
                {displayName ? displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    id="user-profile-card-name"
                    className="text-base sm:text-xl font-bold !text-white user-profile-name flex items-center gap-1.5 break-words"
                    style={{ color: '#ffffff' }}
                  >
                    <span className="!text-white user-profile-name" style={{ color: '#ffffff' }}>
                      {displayName}
                    </span>
                    <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0" />
                  </h1>

                  {/* Pen / Edit Icon for modifying staff data */}
                  {canEditCurrentProfile && !isEditing && (
                    <button
                      type="button"
                      id="btn-edit-profile-pen"
                      onClick={handleStartEdit}
                      title="Edit Staff Profile"
                      aria-label="Edit Staff Profile"
                      className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white hover:text-indigo-200 border border-white/20 transition-all shadow-xs cursor-pointer group"
                    >
                      <Edit3 className="w-4 h-4 text-white group-hover:text-indigo-200 transition-colors" />
                      <span className="text-xs font-semibold text-white ml-1.5 hidden sm:inline group-hover:text-indigo-200">
                        Edit Profile
                      </span>
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-indigo-200 flex flex-wrap items-center gap-1.5 mt-0.5 break-words">
                  <span>{displayPosition || displayDept}</span>
                  <span>•</span>
                  <span>{displayWorkplace}</span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-indigo-200 border border-white/20 whitespace-nowrap">
                    {displayRole}
                  </span>
                  <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] sm:text-[11px] font-mono text-indigo-100 border border-white/10">
                    Staff ID: {displayStaffId}
                  </span>
                  {displayIqama && (
                    <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] sm:text-[11px] font-mono text-indigo-100 border border-white/10">
                      Iqama: {displayIqama}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] sm:text-[11px] font-semibold border border-emerald-500/30">
                    Active Staff Member
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Performance Badge Banner */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2.5 sm:p-4 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 w-full xl:w-auto">
              <div className="text-center px-1">
                <p className="text-[10px] sm:text-xs text-indigo-200 leading-tight whitespace-nowrap">Total Items</p>
                <p className="text-base sm:text-2xl font-bold text-white mt-0.5">{totalItemsAdded}</p>
              </div>
              <div className="text-center px-1 border-x border-white/20">
                <p className="text-[10px] sm:text-xs text-indigo-200 leading-tight whitespace-nowrap">Handover</p>
                <p className="text-base sm:text-2xl font-bold text-emerald-300 mt-0.5">{successfulHandovers}</p>
              </div>
              <div className="text-center px-1">
                <p className="text-[10px] sm:text-xs text-indigo-200 leading-tight whitespace-nowrap">Pending</p>
                <p className="text-base sm:text-2xl font-bold text-amber-300 mt-0.5">{itemsPending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} noValidate className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-slate-50/50">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Edit Profile Information</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setServerDuplicates({});
                  setHasAttemptedSubmit(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer p-1"
              >
                Cancel
              </button>
            </div>

            {/* Top Distinct Validation Errors Banner */}
            {(hasDuplicateError || hasAttemptedSubmit) && (
              <FormValidationBanner errors={errorList} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={getFieldInputClasses(Boolean(errors.name && hasAttemptedSubmit))}
                />
                <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.name : null} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Locked)</label>
                <input
                  type="email"
                  required
                  disabled
                  value={editFormData.email}
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                  className={errors.email ? getFieldInputClasses(true) : 'w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 text-slate-500 bg-slate-100 cursor-not-allowed select-none min-h-[44px] sm:min-h-0'}
                />
                {errors.email ? (
                  <FormFieldErrorMessage error={errors.email} />
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>Email is permanently locked and managed by Admin.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className={getFieldInputClasses(Boolean(errors.phone))}
                />
                <FormFieldErrorMessage error={errors.phone} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={e => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Iqama / National ID</label>
                <input
                  type="text"
                  value={editFormData.iqamaNumber}
                  onChange={e => setEditFormData({ ...editFormData, iqamaNumber: e.target.value })}
                  className={getFieldInputClasses(Boolean(errors.iqamaNumber))}
                />
                <FormFieldErrorMessage error={errors.iqamaNumber} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff ID Code *</label>
                <input
                  type="text"
                  value={editFormData.staffId}
                  onChange={e => setEditFormData({ ...editFormData, staffId: e.target.value })}
                  className={getFieldInputClasses(Boolean(errors.staffId))}
                />
                <FormFieldErrorMessage error={errors.staffId} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workplace / Hotel Location</label>
                <input
                  type="text"
                  value={editFormData.workplace}
                  onChange={e => setEditFormData({ ...editFormData, workplace: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={editFormData.department}
                  onChange={e => setEditFormData({ ...editFormData, department: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
                >
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Security">Security</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position / Title</label>
                <input
                  type="text"
                  value={editFormData.position}
                  onChange={e => setEditFormData({ ...editFormData, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. +966 50 999 8888 (Brother/Manager)"
                  value={editFormData.emergencyContact}
                  onChange={e => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                  className="w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:space-x-3 pt-4 border-t border-slate-200">
              <div>
                {hasDuplicateError && (
                  <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                    <span>Please resolve duplicate database conflicts before saving profile.</span>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2.5 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setServerDuplicates({});
                    setHasAttemptedSubmit(false);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || hasDuplicateError}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile Data'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-3.5 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 bg-slate-50/40">
            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Iqama / ID Number</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 font-mono break-all">
                {displayIqama || 'Not Provided'}
              </p>
            </div>

            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Date of Birth</span>
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {displayDOB || 'Not Provided'}
              </p>
            </div>

            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Email Address</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 break-all">
                {displayEmail || 'Not Provided'}
              </p>
            </div>

            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Phone Contact</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 break-all">
                {displayPhone || 'Not Provided'}
              </p>
            </div>

            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Workplace Property</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 break-words">
                {displayWorkplace}
              </p>
            </div>

            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Department & Position</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 break-words">
                {displayDept} - {displayPosition || 'Staff'}
              </p>
            </div>

            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>System Role</span>
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {displayRole}
              </p>
            </div>

            <div className="space-y-1 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-slate-100 sm:border-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Emergency Contact</span>
              </span>
              <p className="text-xs font-semibold text-slate-800 break-words">
                {displayEmergency || 'Not Provided'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5 DYNAMIC METRIC CARDS (PLACED DIRECTLY AFTER USER PROFILE SECTION) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Card 1: Total Items Added */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              TOTAL ADDED
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
              {totalItemsAdded}
            </p>
            <p className="text-[10px] sm:text-[11px] text-indigo-600 font-medium mt-0.5 truncate">
              Deposited by {displayName.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Card 2: Currently Stored */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mr-1">
              STORED ITEMS
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
              {storedItemsCount}
            </p>
            <p className="text-[10px] sm:text-[11px] text-blue-600 font-medium mt-0.5 truncate">
              In custody / warehouse
            </p>
          </div>
        </div>

        {/* Card 3: Items Pending */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider truncate mr-1">
              ITEMS PENDING
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">
              {itemsPending}
            </p>
            <p className="text-[10px] sm:text-[11px] text-amber-600 font-medium mt-0.5 truncate">
              Approval & dispatch
            </p>
          </div>
        </div>

        {/* Card 4: Successful Handovers */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider truncate mr-1">
              HANDOVERS
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-baseline space-x-1.5 flex-wrap">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">
                {successfulHandovers}
              </p>
              {totalItemsAdded > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                  {successRate}% rate
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-0.5 truncate">
              Returned to guests
            </p>
          </div>
        </div>

        {/* Card 5: Total Dispatched */}
        <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-wider truncate mr-1">
              DISPATCHED
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">
              {dispatchedItemsCount}
            </p>
            <p className="text-[10px] sm:text-[11px] text-purple-600 font-medium mt-0.5 truncate">
              Handed to finder staff
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ITEM SUBMISSION DATA TABLE & ACTIVITY SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Section Header with Actions */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span>Deposited Items & Inventory Records ({userSubmittedItems.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive record list for lost & found items found and registered by {displayName}
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              disabled={filteredAndSortedItems.length === 0}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download full item list as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls Toolbar */}
        <div className="px-3.5 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, code, location, category..."
              value={searchFilter}
              onChange={e => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 min-h-[44px] sm:min-h-0"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px] sm:min-h-0"
            >
              <option value="All">All Statuses ({userSubmittedItems.length})</option>
              <option value="Stored">Stored ({storedItemsCount})</option>
              <option value="Pending">Pending Approval / Review ({itemsPending})</option>
              <option value="Handed Over">Handed Over / Claimed ({successfulHandovers})</option>
              <option value="Dispatched">Dispatched / Disposed ({dispatchedItemsCount})</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px] sm:min-h-0"
            >
              <option value="All">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-between sm:justify-end space-x-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Show:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="flex-1 sm:flex-initial px-3 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px] sm:min-h-0"
            >
              <option value={10}>10 items</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
            </select>
          </div>
        </div>

        {/* Data Items Display */}
        {paginatedItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No items found matching the selected filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search term or adjusting status/category filter</p>
            <button
              onClick={() => {
                setSearchFilter('');
                setStatusFilter('All');
                setCategoryFilter('All');
                setCurrentPage(1);
              }}
              className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Touch-Friendly Card View (visible on mobile < md) */}
            <div className="md:hidden divide-y divide-slate-100 px-3.5 sm:px-4">
              {paginatedItems.map((item, index) => {
                const serial = startIndex + index + 1;
                const itemCode = item.code || (item as any).trackingNumber || 'LF-2026';
                const itemStore = item.storeLocation || (item as any).storageLocation || 'HK Office';
                const isHandedOver = item.status === 'Handed Over' || item.status === 'Claimed';
                const statusColors: Record<string, string> = {
                  'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
                  'Pending Claim': 'bg-amber-50 text-amber-700 border-amber-200',
                  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
                  'Stored': 'bg-sky-50 text-sky-700 border-sky-200',
                  'Registered': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  'Handed Over': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'Claimed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'Dispatched': 'bg-purple-50 text-purple-700 border-purple-200',
                  'Disposed': 'bg-slate-100 text-slate-600 border-slate-200',
                  'Archived': 'bg-slate-100 text-slate-600 border-slate-200'
                };

                return (
                  <div key={item.id} className="py-3.5 space-y-2.5">
                    {/* Header: Serial + Code + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">#{serial}</span>
                        <button
                          type="button"
                          onClick={() => openItemDetails(item)}
                          className="font-mono font-bold text-sm text-indigo-600 hover:text-indigo-800 hover:underline text-left cursor-pointer truncate"
                        >
                          {itemCode}
                        </button>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Item Name & Details */}
                    <div>
                      <p
                        className="font-semibold text-slate-900 text-sm break-words capitalize"
                        style={{ textTransform: 'capitalize' }}
                      >
                        {item.itemName}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 break-words">{item.description}</p>
                      )}
                    </div>

                    {/* Compact Grid Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 block">Category</span>
                        <span className="font-medium text-slate-700 truncate block">{item.category}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 block">Date Found</span>
                        <span className="font-medium text-slate-700 truncate block">{item.dateFound || (item.createdAt ? item.createdAt.split('T')[0] : 'N/A')}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 block">Location</span>
                        <span className="font-medium text-slate-700 truncate block">{item.locationFound || 'Not specified'}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 block">Storage</span>
                        <span className="font-medium text-slate-700 truncate block">{itemStore}</span>
                      </div>
                    </div>

                    {/* Direct Actions with 44px touch targets on mobile */}
                    <div className="flex items-center justify-end space-x-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => openItemDetails(item)}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-indigo-50 active:bg-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openPrint(item, isHandedOver ? 'receipt' : 'report')}
                        className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 active:bg-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Full Data Table (visible on md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold text-[11px] border-y border-slate-200 select-none">
                    <th className="py-3.5 px-4 text-center w-12">#</th>
                    <th
                      onClick={() => handleSort('code')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>Code / ID</span>
                        {renderSortIcon('code')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('itemName')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>Item Details</span>
                        {renderSortIcon('itemName')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>Category</span>
                        {renderSortIcon('category')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('dateFound')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>Date Found</span>
                        {renderSortIcon('dateFound')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('locationFound')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>Location</span>
                        {renderSortIcon('locationFound')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('storeLocation')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>Storage Facility</span>
                        {renderSortIcon('storeLocation')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedItems.map((item, index) => {
                    const serial = startIndex + index + 1;
                    const itemCode = item.code || (item as any).trackingNumber || 'LF-2026';
                    const itemStore = item.storeLocation || (item as any).storageLocation || 'HK Office';
                    const statusColors: Record<string, string> = {
                      'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
                      'Pending Claim': 'bg-amber-50 text-amber-700 border-amber-200',
                      'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
                      'Stored': 'bg-sky-50 text-sky-700 border-sky-200',
                      'Registered': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      'Handed Over': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      'Claimed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      'Dispatched': 'bg-purple-50 text-purple-700 border-purple-200',
                      'Disposed': 'bg-slate-100 text-slate-600 border-slate-200',
                      'Archived': 'bg-slate-100 text-slate-600 border-slate-200'
                    };

                    const isHandedOver = item.status === 'Handed Over' || item.status === 'Claimed';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                          {serial}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                          <button
                            onClick={() => openItemDetails(item)}
                            className="hover:underline text-left cursor-pointer"
                          >
                            {itemCode}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div>
                            <p
                              className="font-semibold text-slate-900 truncate capitalize"
                              style={{ textTransform: 'capitalize' }}
                            >
                              {item.itemName}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {item.dateFound || (item.createdAt ? item.createdAt.split('T')[0] : 'N/A')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                          {item.locationFound}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                          {itemStore}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => openItemDetails(item)}
                              title="View Full Details"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openPrint(item, isHandedOver ? 'receipt' : 'report')}
                              title="Print Item Record"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Data Table Pagination Footer */}
        {filteredAndSortedItems.length > 0 && (
          <div className="px-3.5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="text-center sm:text-left w-full sm:w-auto">
              Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
              <span className="font-semibold text-slate-800">{filteredAndSortedItems.length}</span> items
            </div>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPageSafe <= 1}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3.5 py-2.5 sm:py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="px-2 font-medium text-slate-700 whitespace-nowrap text-center">
                Page {currentPageSafe} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe >= totalPages}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3.5 py-2.5 sm:py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
