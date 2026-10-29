import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../lib/api';
import {
  staffValidationSchema,
  validateForm
} from '../../../lib/validationSchema';
import { LostItem } from '../../../types';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfileSkeleton } from '../../../components/common/Skeleton';
import { UserProfileHeader } from './components/UserProfileHeader';
import { UserProfileEditForm } from './components/UserProfileEditForm';
import { UserProfileInfoGrid } from './components/UserProfileInfoGrid';
import { UserProfileMetrics } from './components/UserProfileMetrics';
import { UserItemsHistoryTable } from './components/UserItemsHistoryTable';
import { MediaPickerModal } from '../../../components/common/MediaPickerModal';

export const UserProfileView: React.FC = () => {
  const { user, updateProfile, hasPermission } = useAuth();
  const { items, staff, updateStaff, selectedStaffProfile, setSelectedStaffProfile, openItemDetails, openPrint, isLoading } = useApp();
  const { staffId: urlStaffId } = useParams<{ staffId?: string }>();
  const navigate = useNavigate();

  // Selected staff state (resolve from URL param :staffId, or selectedStaffProfile, or logged in user)
  const resolvedTargetStaff = useMemo(() => {
    if (urlStaffId) {
      const decoded = decodeURIComponent(urlStaffId).toLowerCase().trim();
      const match = staff.find(s => 
        (s.id && s.id.toLowerCase() === decoded) ||
        (s.staffId && s.staffId.toLowerCase() === decoded) ||
        (s.userId && s.userId.toLowerCase() === decoded) ||
        (s.name && s.name.toLowerCase().trim() === decoded) ||
        (s.email && s.email.toLowerCase().trim() === decoded)
      );
      if (match) return match;
    }
    if (selectedStaffProfile) {
      return staff.find(s => s.id === selectedStaffProfile.id || (s.email && selectedStaffProfile.email && s.email.toLowerCase() === selectedStaffProfile.email.toLowerCase())) || selectedStaffProfile;
    }
    return null;
  }, [urlStaffId, selectedStaffProfile, staff]);

  const currentStaffMatch = useMemo(() => {
    if (resolvedTargetStaff) return resolvedTargetStaff;
    if (user) {
      const uEmail = (user.email || '').toLowerCase().trim();
      return staff.find(s => s.email && uEmail && s.email.toLowerCase().trim() === uEmail) || null;
    }
    return null;
  }, [resolvedTargetStaff, user, staff]);

  // If viewing someone else
  const isViewingOtherStaff = Boolean(
    resolvedTargetStaff && 
    user && 
    resolvedTargetStaff.id !== user.id && 
    resolvedTargetStaff.email !== user.email &&
    resolvedTargetStaff.staffId !== user.staffId
  );
  const canEditCurrentProfile = !isViewingOtherStaff || user?.role === 'Super Admin' || hasPermission('edit_staff') || hasPermission('manage_staff_access');

  const activeStaff = resolvedTargetStaff || currentStaffMatch;
  const displayName = activeStaff?.name || user?.name || 'Staff Member';
  const displayEmail = activeStaff?.email || user?.email || '';
  const displayRole = activeStaff?.role || user?.role || 'Employee';
  const displayDept = activeStaff?.department || user?.department || 'Housekeeping';
  const displayPhone = activeStaff?.phone || user?.phone || '';
  const displayStaffId = activeStaff?.staffId || (activeStaff as any)?.userId || user?.staffId || 'STF-2026-01';
  const displayIqama = activeStaff?.iqamaNumber || user?.iqamaNumber || '';
  const displayDOB = activeStaff?.dateOfBirth || user?.dateOfBirth || '';
  const displayWorkplace = activeStaff?.workplace || user?.workplace || 'Warwick Hotels and Resorts';
  const displayPosition = activeStaff?.position || user?.position || displayDept;
  const displayEmergency = activeStaff?.emergencyContact || user?.emergencyContact || '';

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

  // Avatar Picker Modal State
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  const handleAvatarSelect = async (url: string) => {
    setIsAvatarPickerOpen(false);
    try {
      const targetId = activeStaff?.id || currentStaffMatch?.id || user?.id || (user as any)?.staffId;
      if (targetId) {
        await updateStaff(targetId, { avatar: url });
      }
      if (updateProfile) {
        await updateProfile({ avatar: url } as any);
      }
      toast.success('Profile photo updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile photo');
    }
  };

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

  // Filter items submitted by this staff member
  const userSubmittedItems = useMemo(() => {
    const targetName = displayName.toLowerCase().trim();
    const targetStaffId = displayStaffId.toLowerCase().trim();
    const targetUserId = (currentStaffMatch?.userId || user?.id || '').toLowerCase().trim();

    return items.filter(item => {
      const subId = (item.submittedByStaffId || (item as any).employeeId || '').toLowerCase().trim();
      if (subId) {
        if (targetStaffId && subId === targetStaffId) return true;
        if (targetUserId && subId === targetUserId) return true;
      }

      const empName = (item.employeeName || '').toLowerCase().trim();
      const subName = (item.submittedByStaffName || '').toLowerCase().trim();
      const foundBy = ((item as any).foundBy || '').toLowerCase().trim();
      const approvedBy = (item.approvedBy || '').toLowerCase().trim();

      const isExactOrCloseNameMatch = (nameToCheck: string) => {
        if (!nameToCheck || !targetName) return false;
        if (nameToCheck === targetName) return true;
        if (nameToCheck.length >= 4 && targetName.includes(nameToCheck)) return true;
        if (targetName.length >= 4 && nameToCheck.includes(targetName)) return true;
        return false;
      };

      const matchesEmp = isExactOrCloseNameMatch(empName);
      const matchesSub = isExactOrCloseNameMatch(subName);
      const matchesFound = isExactOrCloseNameMatch(foundBy);

      if (empName || subName || foundBy) {
        if (!matchesEmp && !matchesSub && !matchesFound) {
          return false;
        }
        return matchesEmp || matchesSub || matchesFound;
      }

      const recBy = (item.recordedBy || '').toLowerCase().trim();
      if (recBy && recBy !== 'pending approval') {
        if (approvedBy && recBy === approvedBy && isExactOrCloseNameMatch(approvedBy)) {
          return false;
        }
        return isExactOrCloseNameMatch(recBy);
      }

      return false;
    });
  }, [items, displayName, displayStaffId, currentStaffMatch, user]);

  // Dynamic Statistics per staff member
  const { totalItemsAdded, itemsPending, successfulHandovers, storedItemsCount, dispatchedItemsCount, successRate } = useMemo(() => {
    const total = userSubmittedItems.length;
    
    const stored = userSubmittedItems.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s === 'stored' || s === 'found' || s === 'under review' || s === 'registered';
    }).length;

    const handovers = userSubmittedItems.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s === 'handed over' || s === 'claimed' || Boolean(i.handoverDetails);
    }).length;

    const pending = userSubmittedItems.filter(i => {
      const s = (i.status || '').toLowerCase();
      return s.includes('pending') || (s === 'stored' && i.dispatchDeadline);
    }).length;

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

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    userSubmittedItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [userSubmittedItems]);

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

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredAndSortedItems.length);
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  const handleSort = (field: keyof LostItem) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: keyof LostItem) => {
    return null;
  };

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

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-32 md:pb-8 w-full max-w-full overflow-x-hidden">
      {isViewingOtherStaff && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => {
              setSelectedStaffProfile(null);
              navigate('/profile');
            }}
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

      <div className="bg-white dark:bg-[#180F1A] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-fuchsia-500/25 shadow-xl shadow-fuchsia-950/15 overflow-hidden transition-all">
        <UserProfileHeader
          displayName={displayName}
          avatarUrl={activeStaff?.avatar || currentStaffMatch?.avatar || (user as any)?.avatar}
          displayPosition={displayPosition}
          displayDept={displayDept}
          displayWorkplace={displayWorkplace}
          displayRole={displayRole}
          displayStaffId={displayStaffId}
          displayIqama={displayIqama}
          totalItemsAdded={totalItemsAdded}
          successfulHandovers={successfulHandovers}
          itemsPending={itemsPending}
          canEditCurrentProfile={canEditCurrentProfile}
          isEditing={isEditing}
          onStartEdit={handleStartEdit}
          onChangeAvatar={() => setIsAvatarPickerOpen(true)}
        />

        {isEditing ? (
          <UserProfileEditForm
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            errors={errors}
            hasAttemptedSubmit={hasAttemptedSubmit}
            hasDuplicateError={hasDuplicateError}
            errorList={errorList}
            isSaving={isSaving}
            onSubmit={handleSaveProfile}
            onCancel={() => {
              setIsEditing(false);
              setServerDuplicates({});
              setHasAttemptedSubmit(false);
            }}
          />
        ) : (
          <UserProfileInfoGrid
            displayIqama={displayIqama}
            displayDOB={displayDOB}
            displayEmail={displayEmail}
            displayPhone={displayPhone}
            displayWorkplace={displayWorkplace}
            displayDept={displayDept}
            displayPosition={displayPosition}
            displayRole={displayRole}
            displayEmergency={displayEmergency}
          />
        )}
      </div>

      <UserProfileMetrics
        displayName={displayName}
        totalItemsAdded={totalItemsAdded}
        storedItemsCount={storedItemsCount}
        itemsPending={itemsPending}
        successfulHandovers={successfulHandovers}
        successRate={successRate}
        dispatchedItemsCount={dispatchedItemsCount}
      />

      <UserItemsHistoryTable
        userSubmittedItems={userSubmittedItems}
        filteredAndSortedItems={filteredAndSortedItems}
        paginatedItems={paginatedItems}
        displayName={displayName}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        pageSize={pageSize}
        setPageSize={setPageSize}
        currentPageSafe={currentPageSafe}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        availableCategories={availableCategories}
        storedItemsCount={storedItemsCount}
        itemsPending={itemsPending}
        successfulHandovers={successfulHandovers}
        dispatchedItemsCount={dispatchedItemsCount}
        onExportExcel={handleExportExcel}
        onSort={handleSort}
        renderSortIcon={renderSortIcon}
        openItemDetails={openItemDetails}
        openPrint={openPrint}
      />

      {/* Avatar Picker Modal with HD 512x512 Cropper */}
      <MediaPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        onSelect={handleAvatarSelect}
        title="Change Profile Photo (প্রোফাইল ছবি পরিবর্তন ও ক্রপ)"
        description="মিডিয়া লাইব্রেরি থেকে পূর্বে আপলোডকৃত যেকোনো ছবি বেছে নিন অথবা আপনার ডিভাইস থেকে সরাসরি নতুন ছবি আপলোড করে সেন্টারে পারফেক্ট ক্রপ করুন।"
        currentValue={activeStaff?.avatar || currentStaffMatch?.avatar || (user as any)?.avatar}
        enableCrop={true}
      />
    </div>
  );
};
