import React, { useState, useEffect } from 'react';
import { Bill, BillItem, COMMON_MATERIALS, CustomerSummary } from '../types.ts';
import { formatINR, formatDateToReceipt, formatTimeToReceipt } from '../utils/formatters.ts';
import { 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  X, 
  Layers, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar, 
  Clock, 
  Calculator
} from 'lucide-react';

interface BillEditorProps {
  initialBill?: Bill | null;
  nextBillNo?: string;
  existingCustomers?: CustomerSummary[];
  ownerId: string;
  onSave: (bill: Bill, andPrint?: boolean) => Promise<void>;
  onCancel: () => void;
}

export const BillEditor: React.FC<BillEditorProps> = ({
  initialBill,
  nextBillNo = 'JYF-001',
  existingCustomers = [],
  ownerId,
  onSave,
  onCancel,
}) => {
  // Form State
  const [billNo, setBillNo] = useState(initialBill?.billNo || nextBillNo);
  const [customerName, setCustomerName] = useState(initialBill?.customerName || '');
  const [mobileNumber, setMobileNumber] = useState(initialBill?.mobileNumber || '');
  const [address, setAddress] = useState(initialBill?.address || 'Washim, Maharashtra');
  const [billDate, setBillDate] = useState(initialBill?.billDate || formatDateToReceipt());
  const [billTime, setBillTime] = useState(initialBill?.billTime || formatTimeToReceipt());
  
  // Items State (default with standard items if new bill)
  const defaultInitialItems: BillItem[] = [
    { id: '1', name: 'Triputi Plywood', amount: 2500 },
    { id: '2', name: 'Balaji Ply', amount: 2000 },
    { id: '3', name: 'Century Ply', amount: 2500 },
    { id: '4', name: 'Lamination Sheet', amount: 3000 },
    { id: '5', name: 'Edge Band', amount: 1500 },
    { id: '6', name: 'Hardware Fitting', amount: 2000 },
    { id: '7', name: 'Screw & Fastener', amount: 1500 },
    { id: '8', name: 'Other Material', amount: 1500 },
  ];

  const [items, setItems] = useState<BillItem[]>(
    initialBill?.items && initialBill.items.length > 0 ? initialBill.items : defaultInitialItems
  );

  // Financials State
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountPercent, setDiscountPercent] = useState<number>(initialBill?.discountPercent ?? 10);
  const [discountAmount, setDiscountAmount] = useState<number>(initialBill?.discountAmount ?? 2000);
  const [receivedAmount, setReceivedAmount] = useState<number>(initialBill?.receivedAmount ?? 18000);
  const [paymentMethod, setPaymentMethod] = useState<string>(initialBill?.paymentMethod || 'Cash');
  const [notes, setNotes] = useState<string>(initialBill?.notes || '');
  const [saving, setSaving] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Compute Total Material Amount
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Sync Discount and Net Amount
  const computedDiscountAmount = discountType === 'percent'
    ? Math.round((totalAmount * (discountPercent || 0)) / 100)
    : Number(discountAmount || 0);

  const netAmount = Math.max(0, totalAmount - computedDiscountAmount);
  const pendingAmount = Math.max(0, netAmount - (Number(receivedAmount) || 0));

  // Determine Payment Status
  let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Paid';
  if (pendingAmount === 0) {
    paymentStatus = 'Paid';
  } else if (Number(receivedAmount) > 0) {
    paymentStatus = 'Partial';
  } else {
    paymentStatus = 'Unpaid';
  }

  // Handle adding new custom row
  const handleAddItem = (name: string = '', amount: number = 0) => {
    setItems([
      ...items,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        name,
        amount
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      setItems([{ id: '1', name: '', amount: 0 }]);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Quick fill customer
  const selectCustomer = (cust: CustomerSummary) => {
    setCustomerName(cust.name);
    setMobileNumber(cust.mobile);
    if (cust.address) setAddress(cust.address);
    setShowCustomerDropdown(false);
  };

  // Quick Auto Set Full Payment
  const handleSetFullPayment = () => {
    setReceivedAmount(netAmount);
  };

  const handleSave = async (andPrint: boolean = false) => {
    if (!customerName.trim()) {
      alert('Please enter the customer name.');
      return;
    }
    if (!mobileNumber.trim()) {
      alert('Please enter the customer mobile phone number.');
      return;
    }

    setSaving(true);
    try {
      const billId = initialBill?.id || `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const billPayload: Bill = {
        id: billId,
        billNo: billNo.trim() || 'JYF-001',
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim() || 'Washim, Maharashtra',
        billDate: billDate.trim(),
        billTime: billTime.trim(),
        items: items.filter(it => it.name.trim() !== '' || it.amount > 0),
        totalAmount,
        discountPercent: discountType === 'percent' ? discountPercent : 0,
        discountAmount: computedDiscountAmount,
        netAmount,
        receivedAmount: Number(receivedAmount) || 0,
        pendingAmount,
        paymentStatus,
        paymentMethod,
        notes: notes.trim(),
        ownerId,
        createdAt: initialBill?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(billPayload, andPrint);
    } catch (err: any) {
      console.error('Error saving bill:', err);
      alert('Error saving bill: ' + (err.message || 'Please check your connection'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-amber-600/40 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2e1709] via-[#4a2612] to-[#2e1709] p-4 sm:p-5 border-b border-amber-500/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 rounded-xl shadow font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-cinzel text-amber-300">
              {initialBill ? 'Edit Bill / Payment Receipt' : 'New Bill / Payment Receipt'}
            </h2>
            <p className="text-xs text-amber-200/70">
              Jasol Furniture &bull; Washim, Maharashtra
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Section 1: Customer & Bill Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Customer Details Box */}
          <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700 space-y-3">
            <div className="flex items-center justify-between text-amber-400 font-bold text-sm border-b border-stone-700 pb-2">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" />
                Customer Details
              </span>
              {existingCustomers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Select Existing
                </button>
              )}
            </div>

            {/* Dropdown for existing customers */}
            {showCustomerDropdown && existingCustomers.length > 0 && (
              <div className="bg-stone-900 border border-amber-500/50 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                <p className="text-[11px] text-amber-300/80 px-2 py-0.5">Click to auto-fill customer info:</p>
                {existingCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-stone-800 text-xs flex justify-between items-center transition cursor-pointer"
                  >
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="text-stone-400 text-[11px]">{c.mobile}</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-300 mb-1 block">Customer Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 mb-1 block">Mobile Number *</label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 mb-1 block">Address / Site Location</label>
              <input
                type="text"
                placeholder="e.g. Washim, Maharashtra"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* Bill Metadata Box */}
          <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700 space-y-3">
            <div className="text-amber-400 font-bold text-sm border-b border-stone-700 pb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              Bill Information
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 mb-1 block">Bill No. (Invoice #)</label>
              <input
                type="text"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1 block">Bill Date</label>
                <input
                  type="text"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1 block">Bill Time</label>
                <input
                  type="text"
                  value={billTime}
                  onChange={(e) => setBillTime(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-300 mb-1 block">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI / GPay / PhonePe">UPI / Google Pay / PhonePe</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Material Items (Items Table) */}
        <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-700 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-400">Material Items &amp; Rates</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {items.length} items
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAddItem()}
              className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          </div>

          {/* Quick Add Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-stone-400 self-center mr-1">Quick Add:</span>
            {COMMON_MATERIALS.slice(0, 8).map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => handleAddItem(mat, 1500)}
                className="text-[11px] bg-stone-900 hover:bg-stone-700 text-amber-200/90 border border-amber-500/30 px-2.5 py-1 rounded-full transition cursor-pointer"
              >
                + {mat}
              </button>
            ))}
          </div>

          {/* Items List Table */}
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-stone-400 px-2">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-7">Material Name</div>
              <div className="col-span-3 text-right">Amount (₹)</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {items.map((item, idx) => (
              <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                <div className="col-span-1 text-center font-bold text-stone-400 text-sm">
                  {idx + 1}
                </div>
                <div className="col-span-7">
                  <input
                    type="text"
                    placeholder="Material or Item Name"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded px-2.5 py-1.5 text-sm text-white outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={item.amount === 0 ? '' : item.amount}
                    onChange={(e) => handleUpdateItem(idx, 'amount', Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded px-2.5 py-1.5 text-sm text-right text-amber-300 font-bold outline-none"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="p-1 text-stone-500 hover:text-rose-400 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal Banner */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-amber-950/60 to-amber-900/60 border border-amber-600/40 text-amber-200 mt-3">
            <span className="font-bold text-sm">Total Material Amount</span>
            <span className="font-extrabold text-base text-amber-300 tracking-wider">
              {formatINR(totalAmount)}
            </span>
          </div>
        </div>

        {/* Section 3: Charges Calculation (Discount, Net, Received, Pending) */}
        <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-stone-700 pb-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            Charges Calculation &amp; Payment Settlement
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Discount Setting */}
            <div className="bg-stone-900 p-3 rounded-xl border border-stone-800 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-stone-300">Discount</label>
                <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 rounded ${discountType === 'percent' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`px-2 py-0.5 rounded ${discountType === 'flat' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'}`}
                  >
                    ₹
                  </button>
                </div>
              </div>

              {discountType === 'percent' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-sm text-white outline-none"
                  />
                  <span className="text-xs text-stone-400">%</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1.5 text-sm text-white outline-none"
                  />
                  <span className="text-xs text-stone-400">₹</span>
                </div>
              )}

              <p className="text-[11px] text-emerald-400">
                Discount: -{formatINR(computedDiscountAmount)}
              </p>
            </div>

            {/* Net Amount Box */}
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-3 rounded-xl border border-amber-500/40 flex flex-col justify-center">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Net Payable Amount</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1">
                {formatINR(netAmount)}
              </span>
              <span className="text-[11px] text-amber-200/60 mt-0.5">
                After {formatINR(computedDiscountAmount)} discount
              </span>
            </div>

            {/* Received Amount Input */}
            <div className="bg-stone-900 p-3 rounded-xl border border-stone-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-emerald-300">Received Amount (₹)</label>
                <button
                  type="button"
                  onClick={handleSetFullPayment}
                  className="text-[10px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Full Paid
                </button>
              </div>

              <input
                type="number"
                min="0"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                className="w-full bg-stone-950 border border-emerald-500/50 rounded px-2.5 py-1.5 text-base font-bold text-emerald-400 outline-none"
              />

              <div className="flex justify-between text-xs pt-1">
                <span className="text-stone-400">Pending Balance:</span>
                <span className={`font-bold ${pendingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatINR(pendingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status Display */}
          <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Status will be saved as:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                paymentStatus === 'Paid'
                  ? 'bg-emerald-600 text-white'
                  : paymentStatus === 'Partial'
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {paymentStatus} ({pendingAmount === 0 ? 'Full Paid' : pendingAmount > 0 && receivedAmount > 0 ? 'Partially Paid' : 'Payment Due'})
              </span>
            </div>

            <div className="text-xs text-stone-400">
              Payment Mode: <span className="font-semibold text-white">{paymentMethod}</span>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-semibold text-stone-300 mb-1 block">Notes / Warranty / Remarks (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. 5-year warranty on Century Ply. Delivered to site."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-stone-950 p-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-semibold transition cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-sm transition shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & View Bill'}
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-stone-950 font-extrabold text-sm transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Save &amp; Print
          </button>
        </div>
      </div>
    </div>
  );
};
