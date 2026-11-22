import React, { useState } from 'react';
import { Bill } from '../types.ts';
import { formatINR, generateWhatsAppMessage } from '../utils/formatters.ts';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  Share2, 
  DollarSign, 
  AlertTriangle, 
  CreditCard,
  ArrowUpRight
} from 'lucide-react';

interface HisabKitabViewProps {
  bills: Bill[];
  onViewBill: (bill: Bill) => void;
  onQuickPayment: (bill: Bill) => void;
}

export const HisabKitabView: React.FC<HisabKitabViewProps> = ({
  bills,
  onViewBill,
  onQuickPayment,
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Filter bills based on date
  const now = new Date();
  const filteredBills = bills.filter((b) => {
    if (timeFilter === 'all') return true;
    const bDate = new Date(b.createdAt || b.billDate);
    if (isNaN(bDate.getTime())) return true;

    if (timeFilter === 'today') {
      return (
        bDate.getDate() === now.getDate() &&
        bDate.getMonth() === now.getMonth() &&
        bDate.getFullYear() === now.getFullYear()
      );
    }
    if (timeFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return bDate >= oneWeekAgo;
    }
    if (timeFilter === 'month') {
      return (
        bDate.getMonth() === now.getMonth() &&
        bDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  // Calculate Aggregates
  const totalBilled = filteredBills.reduce((acc, b) => acc + (b.netAmount || 0), 0);
  const totalReceived = filteredBills.reduce((acc, b) => acc + (b.receivedAmount || 0), 0);
  const totalPending = filteredBills.reduce((acc, b) => acc + (b.pendingAmount || 0), 0);
  const recoveryRate = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 100;

  // Bills with pending money (Outstanding)
  const pendingBills = filteredBills.filter((b) => b.pendingAmount > 0);

  // Group by Payment Mode
  const modeStats = filteredBills.reduce((acc, b) => {
    const mode = b.paymentMethod || 'Cash';
    acc[mode] = (acc[mode] || 0) + (b.receivedAmount || 0);
    return acc;
  }, {} as Record<string, number>);

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Bill No,Date,Customer Name,Mobile,Net Amount,Received Amount,Pending Amount,Status,Payment Mode\n';
    filteredBills.forEach((b) => {
      csv += `"${b.billNo}","${b.billDate}","${b.customerName}","${b.mobileNumber}",${b.netAmount},${b.receivedAmount},${b.pendingAmount},"${b.paymentStatus}","${b.paymentMethod || 'Cash'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jasol_Accounts_Ledger_${timeFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Time Filter */}
      <div className="bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-amber-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Store Accounts &amp; Financial Ledger
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Jasol Furniture &bull; Total Sales, Payments Collected, and Outstanding Balances
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Buttons */}
          <div className="bg-stone-950 p-1 rounded-xl border border-stone-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                timeFilter === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                timeFilter === 'today' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                timeFilter === 'week' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                timeFilter === 'month' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 transition cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            Export Ledger
          </button>
        </div>
      </div>

      {/* 4 Financial Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 p-4 rounded-2xl border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              Total Sales (Gross Billed)
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-2">
            {formatINR(totalBilled)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>{filteredBills.length} Invoices</span>
            <span className="text-amber-300 font-semibold">{timeFilter.toUpperCase()}</span>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 p-4 rounded-2xl border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
              Payments Collected
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatINR(totalReceived)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>Recovery Rate</span>
            <span className="text-emerald-400 font-bold">{recoveryRate}%</span>
          </div>
        </div>

        {/* Total Pending / Dues */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 p-4 rounded-2xl border border-rose-500/30 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
              Outstanding Balance (Due)
            </span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-2">
            {formatINR(totalPending)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>{pendingBills.length} Customers Pending</span>
            <span className="text-rose-400 font-semibold">Receivables</span>
          </div>
        </div>

        {/* Total Bills & Average */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 p-4 rounded-2xl border border-stone-800 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wide">
              Average Bill Value
            </span>
            <div className="p-2 bg-stone-800 text-stone-400 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-100 mt-2">
            {filteredBills.length > 0 ? formatINR(Math.round(totalBilled / filteredBills.length)) : '₹0'}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>Per Order Average</span>
            <span className="text-stone-300">{filteredBills.length} Total</span>
          </div>
        </div>
      </div>

      {/* Main Section: Outstanding Balances & Payment Mode Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Pending Payments List (Dues Collection) - 2 Columns */}
        <div className="lg:col-span-2 bg-stone-900 rounded-2xl border border-stone-800 shadow-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-stone-100">
                Outstanding Balances &amp; Collections
              </h3>
            </div>
            <span className="text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800/50 px-2.5 py-1 rounded-full">
              {pendingBills.length} Pending Bills &bull; {formatINR(totalPending)}
            </span>
          </div>

          {pendingBills.length === 0 ? (
            <div className="text-center py-8 text-stone-500 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-emerald-400">All payments are fully cleared!</p>
              <p className="text-xs text-stone-500">There are no outstanding customer balances for this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-800 space-y-2 max-h-96 overflow-y-auto">
              {pendingBills.map((b) => (
                <div key={b.id} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-800/40 p-2.5 rounded-xl transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-100 text-sm">{b.customerName}</span>
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                        {b.billNo}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-2">
                      <span>{b.mobileNumber}</span>
                      <span>&bull;</span>
                      <span>{b.billDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-rose-400">
                        {formatINR(b.pendingAmount)} <span className="text-xs text-stone-400 font-normal">due</span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Total {formatINR(b.netAmount)} | Paid: {formatINR(b.receivedAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Reminder */}
                      <button
                        onClick={() => {
                          const msg = generateWhatsAppMessage(
                            b.billNo,
                            b.customerName,
                            b.netAmount,
                            b.receivedAmount,
                            b.pendingAmount
                          );
                          window.open(`https://wa.me/${b.mobileNumber.replace(/\D/g, '')}?text=${msg}`, '_blank');
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Send WhatsApp Payment Reminder"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Reminder
                      </button>

                      {/* Quick Record Payment */}
                      <button
                        onClick={() => onQuickPayment(b)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Collect Payment"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Collect
                      </button>

                      {/* View Bill */}
                      <button
                        onClick={() => onViewBill(b)}
                        className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition cursor-pointer"
                        title="View Bill Receipt"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Payment Modes & Business Summary */}
        <div className="bg-stone-900 rounded-2xl border border-stone-800 shadow-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-stone-100">
              Payment Method Breakdown
            </h3>
          </div>

          <div className="space-y-3">
            {Object.keys(modeStats).length === 0 ? (
              <p className="text-xs text-stone-500">No payment collection records yet.</p>
            ) : (
              Object.entries(modeStats).map(([mode, amt]) => {
                const percent = totalReceived > 0 ? Math.round((amt / totalReceived) * 100) : 0;
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-stone-300">{mode}</span>
                      <span className="font-bold text-amber-300">{formatINR(amt)} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Accounts Summary info */}
          <div className="mt-6 pt-4 border-t border-stone-800 space-y-2 bg-stone-950/60 p-3.5 rounded-xl">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Store Accounts Notes
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              All sales invoices and customer balances are securely stored in the cloud. You can send payment reminders on WhatsApp or record installment collections anytime.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
