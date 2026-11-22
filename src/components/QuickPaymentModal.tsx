import React, { useState } from 'react';
import { Bill } from '../types.ts';
import { formatINR } from '../utils/formatters.ts';
import { X, CheckCircle2, DollarSign } from 'lucide-react';

interface QuickPaymentModalProps {
  bill: Bill;
  onSavePayment: (updatedBill: Bill) => Promise<void>;
  onClose: () => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  bill,
  onSavePayment,
  onClose,
}) => {
  const [paymentToAdd, setPaymentToAdd] = useState<number>(bill.pendingAmount);
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [saving, setSaving] = useState(false);

  const newReceived = (bill.receivedAmount || 0) + Number(paymentToAdd || 0);
  const newPending = Math.max(0, bill.netAmount - newReceived);
  const newStatus = newPending === 0 ? 'Paid' : 'Partial';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentToAdd <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setSaving(true);
    try {
      const updated: Bill = {
        ...bill,
        receivedAmount: newReceived,
        pendingAmount: newPending,
        paymentStatus: newStatus,
        paymentMethod: paymentMode,
        updatedAt: new Date().toISOString()
      };
      await onSavePayment(updated);
      onClose();
    } catch (err: any) {
      alert('Error updating payment: ' + (err.message || 'Check connection'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2c170a] to-[#452310] p-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-amber-300 font-cinzel">
                Receive Payment / Record Installment
              </h3>
              <p className="text-[11px] text-amber-200/70">
                Bill No: {bill.billNo} &bull; {bill.customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current State Overview */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[10px]">Net Amount</span>
              <span className="font-bold text-amber-300 text-xs">{formatINR(bill.netAmount)}</span>
            </div>
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[10px]">Total Paid</span>
              <span className="font-bold text-emerald-400 text-xs">{formatINR(bill.receivedAmount)}</span>
            </div>
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-800">
              <span className="text-stone-400 block text-[10px]">Current Balance</span>
              <span className="font-bold text-rose-400 text-xs">{formatINR(bill.pendingAmount)}</span>
            </div>
          </div>

          {/* New Payment Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-stone-200">Payment Amount to Add (₹)</label>
              <button
                type="button"
                onClick={() => setPaymentToAdd(bill.pendingAmount)}
                className="text-[10px] bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded transition cursor-pointer"
              >
                Full Balance ({formatINR(bill.pendingAmount)})
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={bill.pendingAmount}
              value={paymentToAdd}
              onChange={(e) => setPaymentToAdd(Number(e.target.value))}
              className="w-full bg-stone-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-base font-bold text-emerald-400 outline-none"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="UPI / GPay / PhonePe">UPI / Google Pay / PhonePe</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Result Calculation Preview */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex justify-between items-center text-xs">
            <div>
              <span className="text-stone-400 block">Remaining Balance Will Be:</span>
              <span className={`font-extrabold text-sm ${newPending === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(newPending)} {newPending === 0 ? '(Full Paid)' : '(Partial)'}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              newPending === 0 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {newStatus}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Updating...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
