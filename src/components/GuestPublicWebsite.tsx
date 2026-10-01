import React, { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Send,
  Copy,
  Check,
  Building,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { GuestInquiry, GuestInquiryStatus } from '../types';

export const GuestPublicWebsite: React.FC = () => {
  const {
    items,
    publicWebsiteSettings,
    createGuestInquiry,
    inquiries,
    updateGuestInquiry,
    setActiveTab,
    setIsPublicWebsiteMode
  } = useApp();

  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState<'catalog' | 'report' | 'track' | 'staff_review'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Tracking State
  const [trackingInput, setTrackingInput] = useState('');
  const [trackedInquiry, setTrackedInquiry] = useState<GuestInquiry | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isSearchingTracking, setIsSearchingTracking] = useState(false);

  // Claim Form State
  const [claimGuestName, setClaimGuestName] = useState('');
  const [claimGuestEmail, setClaimGuestEmail] = useState('');
  const [claimGuestPhone, setClaimGuestPhone] = useState('');
  const [claimRoomNumber, setClaimRoomNumber] = useState('');
  const [claimItemName, setClaimItemName] = useState('');
  const [claimCategory, setClaimCategory] = useState('Electronics');
  const [claimDateLost, setClaimDateLost] = useState(new Date().toISOString().split('T')[0]);
  const [claimLocationLost, setClaimLocationLost] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimBrand, setClaimBrand] = useState('');
  const [claimColor, setClaimColor] = useState('');
  const [claimPhotoUrl, setClaimPhotoUrl] = useState('');
  const [claimMatchedItemCode, setClaimMatchedItemCode] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<GuestInquiry | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Filter public items: only active, stored/found items (exclude deleted, claimed, handed over)
  const publicItems = useMemo(() => {
    return items.filter(item => {
      if (item.isDeleted) return false;
      if (['Handed Over', 'Archived', 'Disposed'].includes(item.status)) return false;
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        !q ||
        (item.itemName && item.itemName.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.locationFound && item.locationFound.toLowerCase().includes(q)) ||
        (item.code && item.code.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  const handleStartClaimForItem = (item: any) => {
    setClaimItemName(item.itemName);
    setClaimCategory(item.category || 'Other');
    setClaimMatchedItemCode(item.code);
    setClaimLocationLost(item.locationFound || '');
    setActiveSection('report');
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setIsSearchingTracking(true);
    setTrackingError(null);
    try {
      const code = trackingInput.trim().toUpperCase();
      const match = inquiries.find(
        inq => inq.trackingCode.toUpperCase() === code || inq.matchedItemCode?.toUpperCase() === code
      );
      if (match) {
        setTrackedInquiry(match);
      } else {
        const res = await fetch(`/api/public/inquiries/track/${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.success && data.inquiry) {
          setTrackedInquiry(data.inquiry);
        } else {
          setTrackingError(`No claim found matching reference "${code}". Please verify the code.`);
          setTrackedInquiry(null);
        }
      }
    } catch {
      setTrackingError('Network error checking claim status. Please try again.');
    } finally {
      setIsSearchingTracking(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClaim(true);
    try {
      const created = await createGuestInquiry({
        guestName: claimGuestName,
        guestEmail: claimGuestEmail,
        guestPhone: claimGuestPhone,
        roomNumber: claimRoomNumber,
        itemName: claimItemName,
        category: claimCategory,
        dateLost: claimDateLost,
        locationLost: claimLocationLost,
        description: claimDescription,
        brand: claimBrand,
        color: claimColor,
        photoUrl: claimPhotoUrl,
        matchedItemCode: claimMatchedItemCode
      });
      setSubmittedClaim(created);
      setClaimGuestName('');
      setClaimGuestEmail('');
      setClaimGuestPhone('');
      setClaimRoomNumber('');
      setClaimItemName('');
      setClaimDescription('');
    } catch (err: any) {
      alert(err.message || 'Error submitting claim.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const copyTrackingCode = () => {
    if (!submittedClaim) return;
    navigator.clipboard.writeText(submittedClaim.trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const getStatusStepIndex = (status: GuestInquiryStatus) => {
    switch (status) {
      case 'Received':
        return 1;
      case 'Under Review':
        return 2;
      case 'Matched':
        return 3;
      case 'Ready for Pickup':
        return 4;
      case 'Closed':
      case 'Dispatched':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Top Staff Return Bar (Only shown if logged in) */}
      {user && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hotel Staff Portal Active ({user.name} - {user.role})</span>
          </div>
          <button
            onClick={() => {
              setIsPublicWebsiteMode(false);
              setActiveTab('dashboard');
            }}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold transition-colors text-[11px] flex items-center gap-1"
          >
            <span>Return to Staff Dashboard</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Website Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900">
                {publicWebsiteSettings.portalTitle || 'WARWICK HOTEL'}
              </div>
              <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
                {publicWebsiteSettings.portalSubtitle || 'Guest Lost Property Portal & Concierge'}
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setActiveSection('catalog')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Found Property Catalog
            </button>
            <button
              onClick={() => setActiveSection('report')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'report'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Report Lost Item
            </button>
            <button
              onClick={() => setActiveSection('track')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'track'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Track Claim Status
            </button>
            {user && (
              <button
                onClick={() => setActiveSection('staff_review')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  activeSection === 'staff_review'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Guest Inquiries ({inquiries.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            24/7 Concierge & Housekeeping Property Recovery
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Did you leave something behind during your stay?
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {publicWebsiteSettings.welcomeMessage}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Phone className="w-4 h-4 text-indigo-400" />
              <span>Concierge Hotline: <strong>{publicWebsiteSettings.contactPhone || '+966 12 345 6789'}</strong></span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Email: <strong>{publicWebsiteSettings.contactEmail || 'lostfound@warwickhotel.com'}</strong></span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Retention Period: <strong>{publicWebsiteSettings.lostRetentionDays || 90} Days</strong></span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* SECTION 1: Found Property Catalog */}
        {activeSection === 'catalog' && (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by keyword, item name, room or area..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {publicItems.length > 0 ? (
                publicItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                  >
                    <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-slate-300" />
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/90 text-slate-800 shadow-xs backdrop-blur-xs">
                        {item.category}
                      </span>
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        {item.code}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3
                          className="font-bold text-slate-900 text-sm line-clamp-1 capitalize"
                          style={{ textTransform: 'capitalize' }}
                        >
                          {item.itemName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>Location Found</span>
                          </span>
                          <strong className="text-slate-700">{item.locationFound || 'Hotel Grounds'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Date Logged</span>
                          </span>
                          <strong className="text-slate-700">{item.dateFound}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartClaimForItem(item)}
                        className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>This is Mine (Claim)</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 text-sm">No items found matching your filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Try searching with broader terms, or submit a lost item report so our team can notify you as soon as it is handed in.
                  </p>
                  <button
                    onClick={() => setActiveSection('report')}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs"
                  >
                    Submit Lost Property Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: Report Lost Item Claim Form */}
        {activeSection === 'report' && (
          <div className="max-w-2xl mx-auto">
            {submittedClaim ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md text-center space-y-5 animate-in zoom-in-95 duration-150">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Claim Inquiry Received!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your claim has been submitted to Warwick Concierge and Housekeeping management.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block text-left w-full">
                  <div className="text-[11px] text-slate-400 font-medium">Your Tracking Reference Code:</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-lg font-black text-indigo-700 tracking-wider">
                      {submittedClaim.trackingCode}
                    </span>
                    <button
                      onClick={copyTrackingCode}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Please keep this tracking code safe. You can use it on our Track Status page to monitor investigation progress, verify identity, or arrange collection.
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSubmittedClaim(null);
                      setTrackingInput(submittedClaim.trackingCode);
                      setActiveSection('track');
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                  >
                    Track Status Now
                  </button>
                  <button
                    onClick={() => setSubmittedClaim(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Submit Another Claim
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Report Lost Property / File Claim</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please provide detailed information so our team can match your item against our secure inventory.
                  </p>
                </div>

                <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
                  {claimMatchedItemCode && (
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                      <span className="font-semibold text-indigo-900">
                        Claiming referenced catalog item: <strong>{claimMatchedItemCode}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setClaimMatchedItemCode('')}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Clear Reference
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      1. Guest Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={claimGuestName}
                          onChange={(e) => setClaimGuestName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={claimGuestEmail}
                          onChange={(e) => setClaimGuestEmail(e.target.value)}
                          placeholder="guest@example.com"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={claimGuestPhone}
                          onChange={(e) => setClaimGuestPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Room Number (if known)</label>
                        <input
                          type="text"
                          value={claimRoomNumber}
                          onChange={(e) => setClaimRoomNumber(e.target.value)}
                          placeholder="e.g. Room 404 or Lobby"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      2. Lost Item Description
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                        <input
                          type="text"
                          required
                          value={claimItemName}
                          onChange={(e) => setClaimItemName(e.target.value)}
                          placeholder="e.g. Black Leather Wallet or iPhone 15"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                        <select
                          value={claimCategory}
                          onChange={(e) => setClaimCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        >
                          <option value="Electronics">Electronics</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Jewelry">Jewelry & Watches</option>
                          <option value="Documents">Documents & Passports</option>
                          <option value="Accessories">Accessories & Bags</option>
                          <option value="Keys">Keys</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Brand / Make</label>
                        <input
                          type="text"
                          value={claimBrand}
                          onChange={(e) => setClaimBrand(e.target.value)}
                          placeholder="e.g. Apple, Samsonite, Sony"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Color</label>
                        <input
                          type="text"
                          value={claimColor}
                          onChange={(e) => setClaimColor(e.target.value)}
                          placeholder="e.g. Matte Black, Gold, Navy Blue"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Date Lost</label>
                        <input
                          type="date"
                          value={claimDateLost}
                          onChange={(e) => setClaimDateLost(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Location Lost</label>
                        <input
                          type="text"
                          value={claimLocationLost}
                          onChange={(e) => setClaimLocationLost(e.target.value)}
                          placeholder="e.g. Swimming Pool, Restaurant, Room 202"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Distinguishing Features & Detailed Description *</label>
                      <textarea
                        required
                        rows={3}
                        value={claimDescription}
                        onChange={(e) => setClaimDescription(e.target.value)}
                        placeholder="Please include serial numbers, stickers, scratches, contents, or passwords to verify ownership..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 rtl:space-x-reverse">
                    <button
                      type="button"
                      onClick={() => setActiveSection('catalog')}
                      className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingClaim}
                      className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmittingClaim ? 'Submitting...' : 'Submit Claim Report'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Track Claim Status */}
        {activeSection === 'track' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Track Your Property Claim</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your unique tracking reference code (e.g. WARWICK-CLM-2026-XXXX) or catalog reference code.
              </p>

              <form onSubmit={handleTrackSubmit} className="mt-4 flex gap-2">
                <input
                  type="text"
                  required
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="e.g. WARWICK-CLM-2026-0001"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-mono uppercase"
                />
                <button
                  type="submit"
                  disabled={isSearchingTracking}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearchingTracking ? 'Searching...' : 'Track'}</span>
                </button>
              </form>

              {trackingError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{trackingError}</span>
                </div>
              )}
            </div>

            {trackedInquiry && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in zoom-in-95 duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Claim Reference</span>
                    <h3 className="font-mono text-lg font-black text-indigo-700">{trackedInquiry.trackingCode}</h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date Filed</span>
                    <div className="text-xs font-semibold text-slate-700">
                      {new Date(trackedInquiry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                    Investigation & Claim Lifecycle
                  </h4>

                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    {[
                      { step: 1, label: 'Received' },
                      { step: 2, label: 'Under Review' },
                      { step: 3, label: 'Matched' },
                      { step: 4, label: 'Ready for Collection' }
                    ].map(st => {
                      const currentStep = getStatusStepIndex(trackedInquiry.status);
                      const isComplete = currentStep >= st.step;
                      const isCurrent = currentStep === st.step;

                      return (
                        <div key={st.step} className="space-y-1.5">
                          <div className={`h-2 rounded-full transition-all ${
                            isComplete ? 'bg-indigo-600' : 'bg-slate-200'
                          }`} />
                          <span className={`block font-bold ${
                            isCurrent ? 'text-indigo-600' : isComplete ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Item Claimed</span>
                    <strong className="text-slate-800">{trackedInquiry.itemName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Category</span>
                    <strong className="text-slate-800">{trackedInquiry.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                      {trackedInquiry.status}
                    </span>
                  </div>
                </div>

                {trackedInquiry.staffNotes && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Concierge & Verification Instructions:</span>
                    </span>
                    <p className="text-amber-800">{trackedInquiry.staffNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Staff Review & Inquiries Management (Staff Only) */}
        {activeSection === 'staff_review' && user && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Guest Claims & Inquiries Management</h3>
                <p className="text-xs text-slate-500">
                  Review claims submitted via the guest website, match against found inventory, and update review status.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {inquiries.length} Active Inquiries
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {inquiries.length > 0 ? (
                inquiries.map(inq => (
                  <div key={inq.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700">{inq.trackingCode}</span>
                        <span className="font-bold text-slate-900 text-sm">{inq.itemName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {inq.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Guest: <strong>{inq.guestName}</strong> ({inq.guestEmail}, {inq.guestPhone}) • Room: {inq.roomNumber || 'N/A'}
                      </div>
                      <p className="text-xs text-slate-600 italic">"{inq.description}"</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={inq.status}
                        onChange={(e) => updateGuestInquiry(inq.id, { status: e.target.value as any })}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="Received">Received</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Matched">Matched</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No guest inquiries submitted yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
