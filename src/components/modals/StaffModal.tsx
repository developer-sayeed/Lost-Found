import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Shield, CheckSquare, Square, Sliders, Building, Calendar, CreditCard, BadgeCheck, Phone, Briefcase, AlertCircle, AlertTriangle, Eye, EyeOff, Shuffle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StaffMember, UserRole, PermissionKey, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, PermissionCategory } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-toastify';
import { api } from '../../lib/api';
import {
  staffValidationSchema,
  validateForm,
  FormFieldErrorMessage,
  FormValidationBanner,
  getFieldInputClasses,
  StaffFormData
} from '../../lib/validationSchema';

const PERMISSION_GROUPS: {
  category: PermissionCategory;
  title: string;
  icon: string;
}[] = [
  {
    category: 'Items',
    title: 'ITEM OPERATIONS',
    icon: '📦'
  },
  {
    category: 'Operations',
    title: 'GUEST & WORKFLOW ACTIONS',
    icon: '🔄'
  },
  {
    category: 'Certificates',
    title: 'CERTIFICATES & AWARDS (PERMISSION-CONTROLLED)',
    icon: '📜'
  },
  {
    category: 'Administration',
    title: 'ADMINISTRATION (STAFF & SYSTEM)',
    icon: '⚙️'
  }
];

export const StaffModal: React.FC = () => {
  const { isStaffModalOpen, setIsStaffModalOpen, editingStaff, setEditingStaff, addStaff, updateStaff, getValidationMessage, staff, settings } = useApp();

  const getRoleDefault = (r: UserRole): PermissionKey[] => {
    return (settings?.rolePermissions && settings.rolePermissions[r]) || DEFAULT_ROLE_PERMISSIONS[r] || [];
  };

  const handleClose = () => {
    setIsStaffModalOpen(false);
    setEditingStaff(null);
    setShowPassword(false);
  };

  const modalRef = useClickOutside<HTMLDivElement>(handleClose, {
    active: isStaffModalOpen,
    closeOnEsc: true
  });

  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailCustom, setIsEmailCustom] = useState(false);
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Front Desk');
  const [role, setRole] = useState<UserRole>('Employee');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Suspended'>('Active');
  const [password, setPassword] = useState('Warwick#2026');
  const [showPassword, setShowPassword] = useState(false);
  
  // Random email generator from Full Name
  const generateRandomEmailFromName = (fullName: string, currentEmail?: string): string => {
    if (!fullName || !fullName.trim()) return '';
    const domain = 'warwickhotels.com';
    const cleaned = fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
    const rawWords = cleaned.split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return '';

    if (rawWords.length === 1) {
      return `${rawWords[0]}@${domain}`;
    }

    // Filter out short prefixes/honorifics like 'md', 'mr', 'ms', 'dr', 'al', 'el', 'bin', 'ibn'
    const filterWords = rawWords.filter(w => !['md', 'mr', 'ms', 'dr', 'al', 'el', 'bin', 'ibn'].includes(w) && w.length > 1);
    const words = filterWords.length > 0 ? filterWords : rawWords;

    const candidates: string[] = [];
    // Single word candidates (e.g. "abu sayeed riday" -> "riday@warwickhotels.com", "sayeed@warwickhotels.com")
    words.forEach(w => candidates.push(`${w}@${domain}`));

    // Multi-word combination (first.last)
    if (words.length >= 2) {
      candidates.push(`${words[0]}.${words[words.length - 1]}@${domain}`);
    }

    const uniqueCandidates = Array.from(new Set(candidates));
    const differentCandidates = uniqueCandidates.filter(c => c !== currentEmail);
    const pool = differentCandidates.length > 0 ? differentCandidates : uniqueCandidates;

    return pool[Math.floor(Math.random() * pool.length)] || `${words[0]}@${domain}`;
  };

  // Precomputed email variations for quick suggestion pills
  const emailSuggestions = useMemo(() => {
    if (!name || !name.trim() || editingStaff) return [];
    const domain = 'warwickhotels.com';
    const cleaned = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
    const rawWords = cleaned.split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return [];
    if (rawWords.length === 1) return [`${rawWords[0]}@${domain}`];

    const filterWords = rawWords.filter(w => !['md', 'mr', 'ms', 'dr', 'al', 'el', 'bin', 'ibn'].includes(w) && w.length > 1);
    const words = filterWords.length > 0 ? filterWords : rawWords;

    const list: string[] = [];
    words.forEach(w => list.push(`${w}@${domain}`));
    if (words.length >= 2) {
      list.push(`${words[0]}.${words[words.length - 1]}@${domain}`);
    }
    return Array.from(new Set(list));
  }, [name, editingStaff]);

  // Extended Profile Fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [iqamaNumber, setIqamaNumber] = useState('');
  const [staffId, setStaffId] = useState('');
  const [workplace, setWorkplace] = useState('Warwick Hotels and Resorts');
  const [position, setPosition] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>(DEFAULT_ROLE_PERMISSIONS['Employee']);
  const [isCustomPermissions, setIsCustomPermissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverDuplicates, setServerDuplicates] = useState<Record<string, { message: string; existingName?: string; value?: string }>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Identity of currently edited staff profile (to exclude from duplicate checks)
  const currentEditingId = editingStaff ? (editingStaff.id || (editingStaff as any)._id || editingStaff.userId) : null;

  // Unified Schema-based Validation
  const formData: StaffFormData = useMemo(() => ({
    name,
    email,
    phone,
    staffId,
    iqamaNumber,
    dateOfBirth,
    workplace,
    department,
    position,
    emergencyContact,
    password,
    role
  }), [name, email, phone, staffId, iqamaNumber, dateOfBirth, workplace, department, position, emergencyContact, password, role]);

  const validationContext = useMemo(() => ({
    existingStaff: staff,
    currentId: currentEditingId,
    serverDuplicates,
    isEditing: Boolean(editingStaff)
  }), [staff, currentEditingId, serverDuplicates, editingStaff]);

  const validation = useMemo(() => {
    return validateForm(formData, staffValidationSchema, validationContext);
  }, [formData, validationContext]);

  const { errors, errorList, hasDuplicateError } = validation;

  // Real-time asynchronous database duplicate check (debounced)
  useEffect(() => {
    if (!isStaffModalOpen) {
      setServerDuplicates({});
      setHasAttemptedSubmit(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const cleanPhone = (phone || '').trim().replace(/[\s\-\+\(\)]/g, '');
        const res = await api.checkStaffDuplicate({
          staffId: (staffId || '').trim() || undefined,
          iqamaNumber: (iqamaNumber || '').trim() || undefined,
          email: !editingStaff && email.trim() ? email.trim() : undefined,
          phone: cleanPhone.length >= 7 ? phone.trim() : undefined,
          excludeId: currentEditingId || undefined
        });

        if (res && res.isDuplicate && res.errors) {
          setServerDuplicates(res.errors);
        } else {
          setServerDuplicates({});
        }
      } catch {
        // ignore
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [staffId, iqamaNumber, email, phone, currentEditingId, editingStaff, isStaffModalOpen]);

  useEffect(() => {
    if (editingStaff) {
      setName(editingStaff.name);
      setUserId(editingStaff.userId);
      setEmail(editingStaff.email);
      setPhone(editingStaff.phone || '');
      setDepartment(editingStaff.department);
      setRole(editingStaff.role);
      setStatus(editingStaff.status);
      setDateOfBirth(editingStaff.dateOfBirth || '');
      setIqamaNumber(editingStaff.iqamaNumber || '');
      setStaffId(editingStaff.staffId || '');
      setWorkplace(editingStaff.workplace || 'Warwick Hotels and Resorts');
      setPosition(editingStaff.position || '');
      setEmergencyContact(editingStaff.emergencyContact || '');
      setNotes(editingStaff.notes || '');

      const perms = editingStaff.permissions || DEFAULT_ROLE_PERMISSIONS[editingStaff.role] || [];
      setSelectedPermissions(perms);
      // Check if custom
      const defaultForRole = DEFAULT_ROLE_PERMISSIONS[editingStaff.role] || [];
      const isCustom = perms.length !== defaultForRole.length || perms.some(p => !defaultForRole.includes(p));
      setIsCustomPermissions(isCustom);
    } else {
      setName('');
      setUserId('');
      setEmail('');
      setIsEmailCustom(false);
      setPhone('');
      setDepartment('Housekeeping');
      setRole('Employee');
      setStatus('Active');
      setPassword('Warwick#2026');
      setShowPassword(false);
      setDateOfBirth('');
      setIqamaNumber('');
      setStaffId(`STF-${Math.floor(1000 + Math.random() * 9000)}`);
      setWorkplace('Warwick Hotels and Resorts');
      setPosition('Frontline Associate');
      setEmergencyContact('');
      setNotes('');
      setSelectedPermissions(getRoleDefault('Employee'));
      setIsCustomPermissions(false);
    }
  }, [editingStaff, isStaffModalOpen]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (!isCustomPermissions) {
      setSelectedPermissions(getRoleDefault(newRole));
    }
  };

  const togglePermission = (permId: PermissionKey) => {
    setIsCustomPermissions(true);
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleResetToRoleDefault = () => {
    setIsCustomPermissions(false);
    setSelectedPermissions(getRoleDefault(role));
  };

  const handleSelectAll = () => {
    setIsCustomPermissions(true);
    setSelectedPermissions(ALL_PERMISSIONS.map(p => p.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validation.isValid) {
      errorList.forEach(err => {
        toast.error(err.message, { toastId: `staff-val-${err.field}` });
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStaff) {
        const staffIdToUpdate = editingStaff.id || (editingStaff as any)._id || editingStaff.userId || editingStaff.email;
        await updateStaff(staffIdToUpdate, {
          name: name.trim(),
          userId: userId.trim() || email.split('@')[0],
          email: email.trim(),
          phone: phone.trim(),
          department: department as any,
          role,
          status,
          dateOfBirth,
          iqamaNumber: iqamaNumber.trim(),
          staffId: staffId.trim(),
          workplace: workplace.trim(),
          position: position.trim(),
          emergencyContact: emergencyContact.trim(),
          notes: notes.trim(),
          permissions: selectedPermissions
        });
      } else {
        await addStaff({
          name: name.trim(),
          userId: (userId.trim() || staffId.trim() || email.split('@')[0] || name.toLowerCase().replace(/\s+/g, '.')).trim(),
          email: email.trim(),
          phone: phone.trim(),
          department: department as any,
          role,
          status,
          password: password.trim(),
          dateOfBirth,
          iqamaNumber: iqamaNumber.trim(),
          staffId: staffId.trim(),
          workplace: workplace.trim(),
          position: position.trim(),
          emergencyContact: emergencyContact.trim(),
          notes: notes.trim(),
          permissions: selectedPermissions
        });
      }
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      setServerDuplicates({});
      setHasAttemptedSubmit(false);
      toast.success(editingStaff ? 'Staff member updated successfully!' : 'Staff member created successfully!');
    } catch (e: any) {
      console.error(e);
      if (e?.errors) {
        setServerDuplicates(e.errors);
      }
      toast.error(`❌ Operation failed: ${e?.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isStaffModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingStaff ? `Edit Staff Member: ${editingStaff.name}` : 'Add New Staff Member'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingStaff
                  ? 'Update staff profile credentials, contact details, and role-based permissions.'
                  : 'Register a new employee and configure system permissions.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsStaffModalOpen(false);
              setEditingStaff(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Top Unified Validation Banner */}
          {(hasDuplicateError || hasAttemptedSubmit) && errorList.length > 0 && (
            <FormValidationBanner errors={errorList} />
          )}

          {/* Personal Identity Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personal & Work Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Al-Ghamdi"
                  value={name}
                  onChange={e => {
                    const newName = e.target.value;
                    setName(newName);
                    if (!editingStaff && !isEmailCustom) {
                      const autoEmail = generateRandomEmailFromName(newName, email);
                      setEmail(autoEmail);
                    }
                  }}
                  className={getFieldInputClasses(Boolean(errors.name && hasAttemptedSubmit))}
                />
                <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.name : null} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff ID Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. STF-2026-088"
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  className={`${getFieldInputClasses(Boolean(errors.staffId))} font-mono`}
                />
                <FormFieldErrorMessage error={errors.staffId} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Iqama Number / National ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2489371029"
                  value={iqamaNumber}
                  onChange={e => setIqamaNumber(e.target.value)}
                  className={`${getFieldInputClasses(Boolean(errors.iqamaNumber))} font-mono`}
                />
                <FormFieldErrorMessage error={errors.iqamaNumber} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address *
                  </label>
                  {!editingStaff && name.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const newEmail = generateRandomEmailFromName(name, email);
                        if (newEmail) {
                          setEmail(newEmail);
                          setIsEmailCustom(false);
                        }
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Randomly pick another email from full name"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Randomize Email</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingStaff)}
                    placeholder="staff@warwickhotels.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setIsEmailCustom(true);
                    }}
                    className={`${editingStaff ? 'w-full px-3.5 py-2 text-xs rounded-xl border bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 select-none' : getFieldInputClasses(Boolean(errors.email))} ${!editingStaff && name.trim() ? 'pr-8' : ''}`}
                  />
                  {!editingStaff && name.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const newEmail = generateRandomEmailFromName(name, email);
                        if (newEmail) {
                          setEmail(newEmail);
                          setIsEmailCustom(false);
                        }
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Generate random email from name"
                      aria-label="Generate random email from name"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {editingStaff ? (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Email address is permanently locked and cannot be modified.
                  </p>
                ) : (
                  <>
                    <FormFieldErrorMessage error={errors.email} />
                    {emailSuggestions.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-slate-400">Suggestions:</span>
                        {emailSuggestions.map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              setEmail(sug);
                              setIsEmailCustom(false);
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-colors cursor-pointer ${
                              email === sug
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                            }`}
                          >
                            {sug.split('@')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+966 50 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={getFieldInputClasses(Boolean(errors.phone))}
                />
                <FormFieldErrorMessage error={errors.phone} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workplace / Property
                </label>
                <input
                  type="text"
                  placeholder="Warwick Hotel Baha"
                  value={workplace}
                  onChange={e => setWorkplace(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Position / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Duty Manager"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Number & Relation
              </label>
              <input
                type="text"
                placeholder="e.g. +966 55 987 6543 (Brother)"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* Account & Role Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Account Credentials & Role</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!editingStaff && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Initial Password *
                    </label>
                    <span className="text-[10px] text-slate-400">Min 4 characters</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 4 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`${getFieldInputClasses(Boolean(errors.password && hasAttemptedSubmit))} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                  <FormFieldErrorMessage error={hasAttemptedSubmit ? errors.password : null} />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned System Role *
                </label>
                <select
                  value={role}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-semibold"
                >
                  <option value="Employee">Employee (Basic Find & View)</option>
                  <option value="Supervisor">Supervisor (Create, Edit & Dispatch)</option>
                  <option value="Admin">Admin (Full Operations Management)</option>
                  <option value="Super Admin">Super Admin (Unrestricted System Access)</option>
                </select>
              </div>

              {editingStaff && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Operational Notes
              </label>
              <textarea
                rows={2}
                placeholder="Add special notes, shift details, or ID certifications..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 resize-none"
              />
            </div>
          </div>

          {/* Function Permissions Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Function Permissions</span>
                  <span className="text-indigo-600 font-bold font-mono text-xs">
                    ({selectedPermissions.length} / {ALL_PERMISSIONS.length})
                  </span>
                  {isCustomPermissions && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Customized
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which system functions and buttons this user can access
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetToRoleDefault}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Role Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  Grant All
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
              {PERMISSION_GROUPS.map(group => {
                const permsInCat = ALL_PERMISSIONS.filter(p => p.category === group.category);
                return (
                  <div key={group.category} className="space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 tracking-wider">
                      <span>{group.icon}</span>
                      <span>{group.title}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {permsInCat.map(perm => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-start space-x-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold leading-tight ${isChecked ? 'text-indigo-950' : 'text-slate-800'}`}>
                                {perm.label}
                              </p>
                              <p className={`text-[11px] line-clamp-1 mt-0.5 ${isChecked ? 'text-slate-500' : 'text-slate-400'}`}>
                                {perm.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              {hasDuplicateError && (
                <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  <span>Please resolve duplicate database conflicts before proceeding.</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsStaffModalOpen(false);
                  setEditingStaff(null);
                  setServerDuplicates({});
                  setHasAttemptedSubmit(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasDuplicateError}
                className="px-6 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingStaff ? 'Save Changes' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
