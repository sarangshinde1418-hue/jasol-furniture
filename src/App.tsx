import React, { useState, useEffect } from 'react';
import { 
  auth, 
  logOutUser, 
  subscribeToBills, 
  saveBill, 
  deleteBill, 
  getBusinessProfile 
} from './firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Bill, BusinessProfile, DEFAULT_BUSINESS_PROFILE } from './types.ts';
import { formatDateToReceipt, formatTimeToReceipt } from './utils/formatters.ts';

import { AuthView } from './components/AuthView.tsx';
import { ReceiptView } from './components/ReceiptView.tsx';
import { BillEditor } from './components/BillEditor.tsx';
import { BillsListView } from './components/BillsListView.tsx';
import { HisabKitabView } from './components/HisabKitabView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { QuickPaymentModal } from './components/QuickPaymentModal.tsx';

import { 
  FileText, 
  PlusCircle, 
  TrendingUp, 
  Users, 
  Settings, 
  LogOut, 
  Receipt, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  Building,
  Lock 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<'bills' | 'create' | 'edit' | 'receipt' | 'accounts' | 'customers' | 'settings'>('bills');
  const [activeBill, setActiveBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [quickPaymentBill, setQuickPaymentBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('jasol_app_pin') || '1234';
    if (enteredPin.trim() === savedPin.trim() || enteredPin.trim() === '1234' || enteredPin.trim() === 'Jasol@2026') {
      setIsLocked(false);
      setEnteredPin('');
      setPinError('');
    } else {
      setPinError('Incorrect password or PIN. Please try again.');
    }
  };

  // Monitor Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        try {
          const prof = await getBusinessProfile(currentUser.uid);
          if (prof) setProfile(prof);
        } catch (err) {
          console.warn('Profile fetch notice:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to User's Bills in Firestore
  useEffect(() => {
    if (!user) {
      setBills([]);
      return;
    }

    const unsub = subscribeToBills(
      user.uid,
      (fetchedBills) => {
        setBills(fetchedBills);

        // If newly created user with 0 bills, auto-seed the sample bill matching attached image
        if (fetchedBills.length === 0) {
          seedInitialSample(user.uid);
        }
      },
      (err) => {
        console.error('Bills listener notice:', err);
      }
    );

    return () => unsub();
  }, [user]);

  // Seed sample bill matching the user's uploaded attachment exactly
  const seedInitialSample = async (userId: string) => {
    const sample: Bill = {
      id: `bill_${Date.now()}_initial`,
      billNo: 'JYF-001',
      customerName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      address: 'Washim, Maharashtra',
      billDate: '21 Nov 2026',
      billTime: '03:45 PM',
      items: [
        { id: '1', name: 'Triputi Plywood', amount: 2500 },
        { id: '2', name: 'Balaji Ply', amount: 2000 },
        { id: '3', name: 'Century Ply', amount: 2500 },
        { id: '4', name: 'Lamination Sheet', amount: 3000 },
        { id: '5', name: 'Edge Band', amount: 1500 },
        { id: '6', name: 'Hardware Fitting', amount: 2000 },
        { id: '7', name: 'Screw & Fastener', amount: 1500 },
        { id: '8', name: 'Other Material', amount: 1500 },
      ],
      totalAmount: 20000,
      discountPercent: 10,
      discountAmount: 2000,
      netAmount: 18000,
      receivedAmount: 18000,
      pendingAmount: 0,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      notes: 'Standard Jasol Furniture fitting and warranty applied.',
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveBill(sample);
    } catch (e) {
      console.warn('Initial seed notice:', e);
    }
  };

  // Compute Next Bill Number
  const getNextBillNo = () => {
    const prefix = profile.billPrefix || 'JYF-';
    const count = bills.length + 1;
    const padded = String(count).padStart(3, '0');
    return `${prefix}${padded}`;
  };

  // Save Bill Handler
  const handleSaveBill = async (billToSave: Bill, andPrint: boolean = false) => {
    await saveBill(billToSave);
    setActiveBill(billToSave);
    setActiveTab('receipt');
    setEditingBill(null);

    if (andPrint) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  // Delete Bill Handler
  const confirmDeleteBill = async () => {
    if (!deletingBill) return;
    try {
      await deleteBill(deletingBill.id, deletingBill);
      setDeletingBill(null);
      if (activeBill?.id === deletingBill.id) {
        setActiveBill(null);
        setActiveTab('bills');
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Quick Payment Handler
  const handleQuickPaymentSave = async (updated: Bill) => {
    await saveBill(updated);
    setQuickPaymentBill(null);
    if (activeBill?.id === updated.id) {
      setActiveBill(updated);
    }
  };

  // Auth Loading View
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1b0f07] flex flex-col items-center justify-center p-4 text-amber-200">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="font-cinzel text-lg font-bold text-amber-400">JASOL FURNITURE</p>
        <p className="text-xs text-stone-400 mt-1">Connecting to Cloud Database...</p>
      </div>
    );
  }

  // Not Logged In View
  if (!user) {
    return <AuthView />;
  }

  // Outstanding Dues Alert count
  const pendingBillsCount = bills.filter((b) => b.pendingAmount > 0).length;

  return (
    <div className="min-h-screen bg-[#140b05] text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      
      {/* TOP NAVIGATION BAR (Hidden during print) */}
      <header className="no-print bg-[#211107] border-b border-amber-600/30 sticky top-0 z-40 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Logo & Tagline */}
          <div 
            onClick={() => setActiveTab('bills')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 text-stone-950 flex items-center justify-center font-extrabold shadow-md group-hover:scale-105 transition">
              <span className="font-cinzel text-base tracking-tighter">JJ</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black font-cinzel text-amber-300 tracking-wider">
                  {profile.businessName || 'JASOL Furniture'}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                  Billing Pro
                </span>
              </div>
              <p className="text-[11px] text-amber-200/60 font-serif italic">
                {profile.tagline || 'Build Better... Live Better...'} • {profile.address || 'Washim, Maharashtra'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'bills'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>All Bills</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'bills' ? 'bg-stone-950 text-amber-300' : 'bg-stone-800 text-stone-300'
              }`}>
                {bills.length}
              </span>
            </button>

            <button
              onClick={() => {
                setEditingBill(null);
                setActiveTab('create');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-md'
                  : 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Bill</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'accounts'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Accounts &amp; Ledger</span>
              {pendingBillsCount > 0 && (
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                  {pendingBillsCount} Due
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
              title="Store Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>

          {/* User Profile, Lock & Logout */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400 hidden lg:inline max-w-[150px] truncate">
              {user.email}
            </span>
            <button
              onClick={() => setIsLocked(true)}
              className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-amber-600 hover:text-stone-950 text-amber-400 transition cursor-pointer"
              title="Lock Software Screen (PIN Lock)"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={() => logOutUser()}
              className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-rose-950 hover:text-rose-300 text-stone-400 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        
        {/* VIEW 1: BILL RECEIPT FULL VIEW */}
        {activeTab === 'receipt' && activeBill && (
          <ReceiptView
            bill={activeBill}
            onClose={() => setActiveTab('bills')}
            onEdit={(b) => {
              setEditingBill(b);
              setActiveTab('edit');
            }}
          />
        )}

        {/* VIEW 2: CREATE NEW BILL */}
        {activeTab === 'create' && (
          <BillEditor
            nextBillNo={getNextBillNo()}
            ownerId={user.uid}
            onSave={handleSaveBill}
            onCancel={() => setActiveTab('bills')}
          />
        )}

        {/* VIEW 3: EDIT BILL */}
        {activeTab === 'edit' && editingBill && (
          <BillEditor
            initialBill={editingBill}
            ownerId={user.uid}
            onSave={handleSaveBill}
            onCancel={() => {
              setActiveBill(editingBill);
              setActiveTab('receipt');
            }}
          />
        )}

        {/* VIEW 4: ALL BILLS LIST */}
        {activeTab === 'bills' && (
          <BillsListView
            bills={bills}
            onViewBill={(b) => {
              setActiveBill(b);
              setActiveTab('receipt');
            }}
            onEditBill={(b) => {
              setEditingBill(b);
              setActiveTab('edit');
            }}
            onDeleteBill={(b) => setDeletingBill(b)}
            onQuickPayment={(b) => setQuickPaymentBill(b)}
            onCreateNew={() => {
              setEditingBill(null);
              setActiveTab('create');
            }}
          />
        )}

        {/* VIEW 5: ACCOUNTS & LEDGER */}
        {activeTab === 'accounts' && (
          <HisabKitabView
            bills={bills}
            onViewBill={(b) => {
              setActiveBill(b);
              setActiveTab('receipt');
            }}
            onQuickPayment={(b) => setQuickPaymentBill(b)}
          />
        )}

        {/* VIEW 6: CUSTOMERS & KHATA LEDGER */}
        {activeTab === 'customers' && (
          <CustomersView
            bills={bills}
            onViewBill={(b) => {
              setActiveBill(b);
              setActiveTab('receipt');
            }}
            onCreateBillForCustomer={(name, mobile, address) => {
              setEditingBill({
                id: '',
                billNo: getNextBillNo(),
                customerName: name,
                mobileNumber: mobile,
                address,
                billDate: formatDateToReceipt(),
                billTime: formatTimeToReceipt(),
                items: [],
                totalAmount: 0,
                discountPercent: 0,
                discountAmount: 0,
                netAmount: 0,
                receivedAmount: 0,
                pendingAmount: 0,
                paymentStatus: 'Unpaid',
                paymentMethod: 'Cash',
                ownerId: user.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setActiveTab('edit');
            }}
          />
        )}

        {/* VIEW 7: SHOP SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            ownerId={user.uid}
            onProfileUpdated={(updated) => setProfile(updated)}
            onSampleCreated={() => setActiveTab('bills')}
          />
        )}
      </main>

      {/* QUICK PAYMENT MODAL */}
      {quickPaymentBill && (
        <QuickPaymentModal
          bill={quickPaymentBill}
          onSavePayment={handleQuickPaymentSave}
          onClose={() => setQuickPaymentBill(null)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-stone-900 border border-rose-600/40 rounded-2xl p-5 space-y-4 text-stone-100 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-rose-300">Delete Invoice / Bill?</h3>
                <p className="text-xs text-stone-400">Bill No: {deletingBill.billNo}</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Are you sure you want to permanently delete this bill for customer <strong className="text-white">{deletingBill.customerName}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBill(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBill}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                Yes, Delete Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER PASSCODE / PIN LOCK SCREEN OVERLAY */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-[#120904]/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-stone-900 border-2 border-amber-600/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-cinzel text-amber-300">Jasol Furniture Locked</h3>
              <p className="text-xs text-stone-400 mt-1">Enter your owner passcode or PIN to unlock</p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-3.5">
              <input
                type="password"
                placeholder="Enter Passcode / PIN"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-full text-center tracking-widest text-base font-bold bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-white outline-none"
                autoFocus
                required
              />
              {pinError && <p className="text-xs text-rose-400 font-medium">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 font-bold text-sm rounded-xl shadow-lg cursor-pointer hover:from-amber-400 hover:to-yellow-400 transition"
              >
                Unlock Software
              </button>
            </form>
            <p className="text-[11px] text-stone-500">
              Default passcode: <code className="text-amber-400 font-mono">1234</code> or <code className="text-amber-400 font-mono">Jasol@2026</code>
            </p>
          </div>
        </div>
      )}

      {/* FOOTER (Hidden during print) */}
      <footer className="no-print bg-[#1a0e06] border-t border-stone-800 text-stone-500 text-xs py-3 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {profile.businessName || 'Jasol Furniture'} &bull; Washim, Maharashtra &bull; Billing &amp; Accounts Software
          </span>
          <span className="text-[11px] text-amber-500/80">
            Firebase Firestore Cloud Database Connected
          </span>
        </div>
      </footer>
    </div>
  );
}
