import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FieldError {
  field: string;
  label: string;
  message: string;
  isDuplicate?: boolean;
}

export type FormErrors<T> = Partial<Record<keyof T, FieldError>>;

export interface ValidationResult<T> {
  isValid: boolean;
  errors: FormErrors<T>;
  errorList: FieldError[];
  hasDuplicateError: boolean;
  firstError?: FieldError;
}

export interface FieldValidatorContext {
  existingStaff?: any[];
  existingItems?: any[];
  existingUsers?: any[];
  currentId?: string | null;
  serverDuplicates?: Record<string, { message: string; existingName?: string; value?: string }>;
  isEditing?: boolean;
  [key: string]: any;
}

export interface RuleDefinition<T, K extends keyof T> {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { regex: RegExp; message: string };
  validate?: (val: T[K], formData: T, context?: FieldValidatorContext) => string | null;
  checkDuplicate?: (val: T[K], formData: T, context?: FieldValidatorContext) => { isDuplicate: boolean; message: string } | null;
}

export interface FieldSchema<T, K extends keyof T = keyof T> {
  label: string;
  rules: RuleDefinition<T, K>;
}

export type FormSchema<T> = {
  [K in keyof T]?: FieldSchema<T, K>;
};

/**
 * Validate a single field based on its schema definition
 */
export function validateField<T, K extends keyof T>(
  fieldName: K,
  value: T[K],
  schema: FormSchema<T>,
  formData: T,
  context?: FieldValidatorContext
): FieldError | null {
  const fieldDef = schema[fieldName];
  if (!fieldDef) return null;

  const { label, rules } = fieldDef;
  const strVal = typeof value === 'string' ? value.trim() : (value !== undefined && value !== null ? String(value).trim() : '');

  // 1. Required Check
  if (rules.required) {
    if (!strVal) {
      const msg = typeof rules.required === 'string' ? rules.required : `⚠️ ${label} Required: Please enter ${label.toLowerCase()}.`;
      return { field: String(fieldName), label, message: msg };
    }
  }

  // If empty and not required, pass
  if (!strVal) {
    return null;
  }

  // 2. Min Length Check
  if (rules.minLength && strVal.length < rules.minLength.value) {
    return { field: String(fieldName), label, message: rules.minLength.message };
  }

  // 3. Max Length Check
  if (rules.maxLength && strVal.length > rules.maxLength.value) {
    return { field: String(fieldName), label, message: rules.maxLength.message };
  }

  // 4. Pattern / Regex Check
  if (rules.pattern && !rules.pattern.regex.test(strVal)) {
    return { field: String(fieldName), label, message: rules.pattern.message };
  }

  // 5. Duplicate Check
  if (rules.checkDuplicate) {
    const dupResult = rules.checkDuplicate(value, formData, context);
    if (dupResult && dupResult.isDuplicate) {
      return { field: String(fieldName), label, message: dupResult.message, isDuplicate: true };
    }
  }

  // Check server duplicates as well if provided in context
  if (context?.serverDuplicates && context.serverDuplicates[String(fieldName)]) {
    const srvDup = context.serverDuplicates[String(fieldName)];
    return { field: String(fieldName), label, message: srvDup.message, isDuplicate: true };
  }

  // 6. Custom Validator
  if (rules.validate) {
    const customMsg = rules.validate(value, formData, context);
    if (customMsg) {
      return { field: String(fieldName), label, message: customMsg };
    }
  }

  return null;
}

/**
 * Validate an entire form data object based on a schema
 */
export function validateForm<T extends Record<string, any>>(
  formData: T,
  schema: FormSchema<T>,
  context?: FieldValidatorContext
): ValidationResult<T> {
  const errors: FormErrors<T> = {};
  const errorList: FieldError[] = [];

  for (const key of Object.keys(schema) as Array<keyof T>) {
    const fieldError = validateField(key, formData[key], schema, formData, context);
    if (fieldError) {
      errors[key] = fieldError;
      errorList.push(fieldError);
    }
  }

  const hasDuplicateError = errorList.some(e => e.isDuplicate);

  return {
    isValid: errorList.length === 0,
    errors,
    errorList,
    hasDuplicateError,
    firstError: errorList[0]
  };
}

// =========================================================================
// PREDEFINED REUSABLE SCHEMAS
// =========================================================================

export interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  staffId: string;
  iqamaNumber: string;
  dateOfBirth?: string;
  workplace?: string;
  department?: string;
  position?: string;
  emergencyContact?: string;
  password?: string;
  role?: string;
}

/**
 * Unified Staff / User Profile Schema
 * Shared identically by StaffModal (Admin) and UserProfileView (User & Admin)!
 */
export const staffValidationSchema: FormSchema<StaffFormData> = {
  name: {
    label: 'Full Name',
    rules: {
      required: '⚠️ Full Name Required: Please enter the staff member\'s full legal name.',
      minLength: { value: 2, message: '⚠️ Full Name must be at least 2 characters.' }
    }
  },
  staffId: {
    label: 'Staff ID',
    rules: {
      required: '⚠️ Staff ID Required: Please enter an employee Staff ID number (e.g. STF-2026-088).',
      checkDuplicate: (val, _, ctx) => {
        const clean = (val || '').trim().toLowerCase();
        if (!clean) return null;
        const currentId = ctx?.currentId;
        const existingStaff = ctx?.existingStaff || [];
        const existingUsers = ctx?.existingUsers || [];

        const dupStaff = existingStaff.find((s: any) =>
          s.id !== currentId &&
          s.userId !== currentId &&
          ((s.staffId && s.staffId.trim().toLowerCase() === clean) ||
           (s.userId && s.userId.trim().toLowerCase() === clean) ||
           (s.id && s.id.toLowerCase() === clean))
        );
        const dupUser = existingUsers.find((u: any) =>
          u.id !== currentId &&
          (((u.staffId && u.staffId.trim().toLowerCase() === clean) ||
            (u.id && u.id.toLowerCase() === clean)))
        );
        const dup = dupStaff || dupUser;
        if (dup) {
          return {
            isDuplicate: true,
            message: `⚠️ Staff ID Already Exists: Staff ID "${val.trim()}" is already assigned to ${dup.name || 'another staff member'}. Duplicate Staff IDs are not permitted.`
          };
        }
        return null;
      }
    }
  },
  iqamaNumber: {
    label: 'Iqama / National ID',
    rules: {
      checkDuplicate: (val, _, ctx) => {
        const clean = (val || '').trim().toLowerCase();
        if (!clean) return null;
        const currentId = ctx?.currentId;
        const existingStaff = ctx?.existingStaff || [];

        const dup = existingStaff.find((s: any) =>
          s.id !== currentId &&
          s.userId !== currentId &&
          s.iqamaNumber &&
          s.iqamaNumber.trim().toLowerCase() === clean
        );
        if (dup) {
          return {
            isDuplicate: true,
            message: `⚠️ Iqama Number Already Exists: Iqama Number "${val.trim()}" already exists in database (${dup.name || 'another staff member'}). Duplicate Iqama numbers are not permitted.`
          };
        }
        return null;
      }
    }
  },
  email: {
    label: 'Email Address',
    rules: {
      required: '⚠️ Email Address Required: Please enter the staff member\'s email address.',
      pattern: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '⚠️ Invalid Email Format: Please enter a valid email format (e.g. staff@warwickhotels.com).'
      },
      checkDuplicate: (val, _, ctx) => {
        const clean = (val || '').trim().toLowerCase();
        if (!clean) return null;
        const currentId = ctx?.currentId;
        const existingStaff = ctx?.existingStaff || [];
        const existingUsers = ctx?.existingUsers || [];

        const dupStaff = existingStaff.find((s: any) =>
          s.id !== currentId &&
          s.userId !== currentId &&
          s.email &&
          s.email.trim().toLowerCase() === clean
        );
        const dupUser = existingUsers.find((u: any) =>
          u.id !== currentId &&
          u.email &&
          u.email.trim().toLowerCase() === clean
        );
        const dup = dupStaff || dupUser;
        if (dup) {
          return {
            isDuplicate: true,
            message: `⚠️ Email Address Already Exists: Email address "${clean}" already exists in database (${dup.name || 'another account'}). Duplicate emails are not permitted.`
          };
        }
        return null;
      }
    }
  },
  phone: {
    label: 'Phone Contact',
    rules: {
      checkDuplicate: (val, _, ctx) => {
        const cleanPhone = (val || '').trim().replace(/[\s\-\+\(\)]/g, '');
        if (!cleanPhone || cleanPhone.length < 7) return null;
        const currentId = ctx?.currentId;
        const existingStaff = ctx?.existingStaff || [];

        const dup = existingStaff.find((s: any) => {
          if (s.id === currentId || s.userId === currentId || !s.phone) return false;
          const norm = s.phone.trim().replace(/[\s\-\+\(\)]/g, '');
          return norm === cleanPhone;
        });
        if (dup) {
          return {
            isDuplicate: true,
            message: `⚠️ Phone Number Already Exists: Phone number "${val.trim()}" is already assigned to ${dup.name || 'another staff member'}. Duplicate phone numbers are not permitted.`
          };
        }
        return null;
      }
    }
  },
  password: {
    label: 'Password',
    rules: {
      validate: (val, _, ctx) => {
        if (!ctx?.isEditing && (!val || val.trim().length < 4)) {
          return '⚠️ Password Required: Please enter an account password (minimum 4 characters).';
        }
        return null;
      }
    }
  }
};

export interface ItemFormData {
  customCode?: string;
  itemName: string;
  category: string;
  dateFound: string;
  locationType?: string;
  roomNumber?: string;
  customLocation?: string;
  storeLocation?: string;
  employeeName?: string;
}

/**
 * Unified Lost Item Schema
 */
export const itemValidationSchema: FormSchema<ItemFormData> = {
  itemName: {
    label: 'Item Title',
    rules: {
      required: '⚠️ Item Title Required: Please enter a descriptive title for the found item.',
      minLength: { value: 2, message: '⚠️ Item Title must be at least 2 characters.' }
    }
  },
  category: {
    label: 'Category',
    rules: {
      required: '⚠️ Category Required: Please select an item category.'
    }
  },
  dateFound: {
    label: 'Date Found',
    rules: {
      required: '⚠️ Date Found Required: Please specify the date the item was located.'
    }
  },
  roomNumber: {
    label: 'Room Number',
    rules: {
      validate: (val, formData) => {
        if (formData.locationType === 'Room' && (!val || !val.trim())) {
          return '⚠️ Room Number Required: Please specify the room number where item was found.';
        }
        return null;
      }
    }
  },
  customLocation: {
    label: 'Custom Location',
    rules: {
      validate: (val, formData) => {
        if (formData.locationType === 'Other' && (!val || !val.trim())) {
          return '⚠️ Location Description Required: Please specify the area or location where item was found.';
        }
        return null;
      }
    }
  },
  employeeName: {
    label: 'Finder Staff / Employee Name',
    rules: {
      validate: (val, _, ctx) => {
        if (ctx?.requireFinder && (!val || !val.trim())) {
          return '⚠️ Finder Required: Please specify the staff member or finder who located the item.';
        }
        return null;
      }
    }
  },
  customCode: {
    label: 'Item Tracking Code',
    rules: {
      checkDuplicate: (val, _, ctx) => {
        const clean = (val || '').trim().toUpperCase();
        if (!clean) return null;
        const currentId = ctx?.currentId;
        const existingItems = ctx?.existingItems || [];

        const dup = existingItems.find((i: any) =>
          (currentId ? i.id !== currentId : true) &&
          i.code &&
          i.code.trim().toUpperCase() === clean
        );
        if (dup) {
          return {
            isDuplicate: true,
            message: `⚠️ Item Tracking Code Already Exists: Code "${clean}" is already assigned to "${dup.itemName || 'another item'}". Duplicate item tracking codes are not permitted.`
          };
        }
        return null;
      }
    }
  }
};

export interface HandoverFormData {
  receiverName: string;
  contactNumber: string;
}

export const handoverValidationSchema: FormSchema<HandoverFormData> = {
  receiverName: {
    label: 'Receiver Name',
    rules: {
      required: '⚠️ Receiver Name Required: Please enter the receiver or guest name.',
      minLength: { value: 2, message: '⚠️ Receiver Name must be at least 2 characters.' }
    }
  },
  contactNumber: {
    label: 'Contact Number',
    rules: {
      validate: (val) => {
        const clean = (val || '').trim().replace(/[\s\-\+\(\)]/g, '');
        if (clean && clean.length > 0 && clean.length < 7) {
          return '⚠️ Invalid Contact Number: Please enter a valid phone number (at least 7 digits).';
        }
        return null;
      }
    }
  }
};

export interface StaffPasswordFormData {
  targetPassword: string;
}

export const staffPasswordValidationSchema: FormSchema<StaffPasswordFormData> = {
  targetPassword: {
    label: 'Password',
    rules: {
      required: '⚠️ Password Required: Please enter a secure password.',
      minLength: { value: 4, message: '⚠️ Password must be at least 4 characters long.' }
    }
  }
};

// =========================================================================
// REUSABLE UI VALIDATION COMPONENTS
// =========================================================================

/**
 * Dynamic input CSS classes based on error state
 */
export function getFieldInputClasses(
  hasError: boolean,
  baseClass = 'w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border focus:outline-none focus:ring-2 min-h-[44px] sm:min-h-0 transition-colors'
): string {
  if (hasError) {
    return `${baseClass} border-red-500 bg-red-50/60 text-red-900 focus:ring-red-500/20 focus:border-red-500`;
  }
  return `${baseClass} border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white`;
}

/**
 * Standardized inline error message under input
 */
export const FormFieldErrorMessage: React.FC<{ error?: FieldError | null }> = ({ error }) => {
  if (!error) return null;
  return (
    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1 animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
      <span>{error.message}</span>
    </p>
  );
};

/**
 * Standardized top alert summary banner for form validation errors
 */
export const FormValidationBanner: React.FC<{
  errors: FieldError[];
  title?: string;
}> = ({ errors, title }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 space-y-2.5 animate-shake shadow-xs">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <span className="font-bold text-xs sm:text-sm">
          {title || `⚠️ Validation Conflicts Detected (${errors.length} field${errors.length > 1 ? 's' : ''} require attention)`}
        </span>
      </div>
      <div className="space-y-1.5 pt-1 border-t border-red-200/60">
        {errors.map(err => (
          <div
            key={err.field}
            className="flex items-start space-x-2 text-xs bg-white/90 p-2.5 rounded-xl border border-red-100 shadow-2xs"
          >
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 flex-shrink-0">
              {err.label}
            </span>
            <span className="text-red-700 leading-snug font-medium">
              {err.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
