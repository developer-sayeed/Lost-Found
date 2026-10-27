import React from 'react';
import { CreditCard, Calendar, Mail, Phone, Building, Briefcase, Shield } from 'lucide-react';

interface UserProfileInfoGridProps {
  displayIqama?: string;
  displayDOB?: string;
  displayEmail?: string;
  displayPhone?: string;
  displayWorkplace?: string;
  displayDept?: string;
  displayPosition?: string;
  displayRole?: string;
  displayEmergency?: string;
}

export const UserProfileInfoGrid: React.FC<UserProfileInfoGridProps> = ({
  displayIqama,
  displayDOB,
  displayEmail,
  displayPhone,
  displayWorkplace,
  displayDept,
  displayPosition,
  displayRole,
  displayEmergency
}) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 bg-slate-50/60 dark:bg-[#150a17]">
      {/* Card 1: Iqama */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-100 dark:border-fuchsia-800/40 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            Iqama / ID Number
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-mono break-all pt-2.5">
          {displayIqama || 'Not Provided'}
        </p>
      </div>

      {/* Card 2: DOB */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            Date of Birth
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white pt-2.5">
          {displayDOB || 'Not Provided'}
        </p>
      </div>

      {/* Card 3: Email */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            Email Address
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white break-all pt-2.5">
          {displayEmail || 'Not Provided'}
        </p>
      </div>

      {/* Card 4: Phone */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            Phone Contact
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white break-all pt-2.5">
          {displayPhone || 'Not Provided'}
        </p>
      </div>

      {/* Card 5: Property */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            Workplace Property
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white break-words pt-2.5">
          {displayWorkplace}
        </p>
      </div>

      {/* Card 6: Dept */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            Department &amp; Position
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white break-words pt-2.5">
          {displayDept} - {displayPosition || 'Staff'}
        </p>
      </div>

      {/* Card 7: Role */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-100 dark:border-fuchsia-800/40 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            System Role
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white pt-2.5">
          {displayRole}
        </p>
      </div>

      {/* Card 8: Emergency Contact */}
      <div className="bg-white dark:bg-[#1c0f20] p-4 rounded-xl border border-slate-200/80 dark:border-fuchsia-900/30 shadow-xs hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all flex flex-col justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-fuchsia-300/70 truncate">
            Emergency Contact
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white break-words pt-2.5">
          {displayEmergency || 'Not Provided'}
        </p>
      </div>
    </div>
  );
};
