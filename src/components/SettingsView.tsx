import React, { useState } from 'react';
import { BusinessProfile, Bill } from '../types.ts';
import { updateBusinessProfile, saveBill } from '../firebase.ts';
import { formatDateToReceipt, formatTimeToReceipt } from '../utils/formatters.ts';
import { Save, CheckCircle2, Sparkles, Building2 } from 'lucide-react';

interface SettingsViewProps {
  profile: BusinessProfile;
  ownerId: string;
  onProfileUpdated: (p: BusinessProfile) => void;
  onSampleCreated?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  ownerId,
  onProfileUpdated,
  onSampleCreated,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [appPin, setAppPin] = useState(localStorage.getItem('jasol_app_pin') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const updated: BusinessProfile = {
        ...formData,
        ownerId,
        updatedAt: new Date().toISOString()
      };
      await updateBusinessProfile(updated);
      onProfileUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert('Error updating settings: ' + (err.message || 'Check connection'));
    } finally {
      setSaving(false);
    }
  };

  // Seed default attached bill (JYF-001: Rahul Sharma, ₹20,000, 10% discount = ₹18,000 Net, Received ₹18,000, Paid)
  const handleSeedSampleBill = async () => {
    if (!confirm('Would you like to seed the attached sample invoice (JYF-001: Rahul Sharma)?')) return;
    setSeeding(true);
    try {
      const sampleBill: Bill = {
        id: `bill_${Date.now()}_sample`,
        billNo: 'JYF-001',
        customerName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        address: 'Washim, Maharashtra',
        billDate: formatDateToReceipt(),
        billTime: formatTimeToReceipt(),
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
        ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveBill(sampleBill);
      onSampleCreated?.();
      alert('Sample bill added successfully!');
    } catch (err: any) {
      alert('Error creating sample bill: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-amber-300 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Business Profile &amp; Invoice Settings
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Configure shop branding, invoice prefix, and sequence counter
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedSampleBill}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {seeding ? 'Adding...' : 'Add Sample Bill (JYF-001)'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-stone-900 rounded-2xl border border-stone-800 shadow-xl p-5 sm:p-6 space-y-5">
        {success && (
          <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Settings saved successfully!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Business / Shop Name</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Shop Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Categories / Subtitles</label>
            <input
              type="text"
              value={formData.subcategories}
              onChange={(e) => setFormData({ ...formData, subcategories: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Contact Mobile Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Shop Address &amp; Location</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Bill Serial Prefix</label>
            <input
              type="text"
              value={formData.billPrefix}
              onChange={(e) => setFormData({ ...formData, billPrefix: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-amber-400 font-bold outline-none"
              required
            />
            <p className="text-[11px] text-stone-500 mt-1">Example: Prefix 'JYF-' generates JYF-001, JYF-002</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Next Bill Sequence Counter</label>
            <input
              type="number"
              min="1"
              value={formData.nextSequence}
              onChange={(e) => setFormData({ ...formData, nextSequence: Number(e.target.value) })}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
              required
            />
          </div>

          <div className="sm:col-span-2 pt-3 border-t border-stone-800">
            <label className="text-xs font-semibold text-amber-300 mb-1 block">
              Owner Security Passcode / Password (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 1234 or Jasol@2026"
              value={appPin}
              onChange={(e) => {
                setAppPin(e.target.value);
                localStorage.setItem('jasol_app_pin', e.target.value);
              }}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              You can set a personal passcode or PIN to lock the counter screen when away.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-800 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-sm rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
