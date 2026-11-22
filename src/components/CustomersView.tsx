import React, { useState } from 'react';
import { Bill } from '../types.ts';
import { formatINR } from '../utils/formatters.ts';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  FileText, 
  Share2, 
  Eye, 
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface CustomersViewProps {
  bills: Bill[];
  onViewBill: (bill: Bill) => void;
  onCreateBillForCustomer: (customerName: string, mobile: string, address: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  bills,
  onViewBill,
  onCreateBillForCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);

  // Group bills by Customer (using normalized mobile or name)
  const customerMap: Record<string, {
    key: string;
    name: string;
    mobile: string;
    address: string;
    bills: Bill[];
    totalBilled: number;
    totalReceived: number;
    totalPending: number;
  }> = {};

  bills.forEach((b) => {
    const key = (b.mobileNumber || b.customerName).trim().toLowerCase();
    if (!customerMap[key]) {
      customerMap[key] = {
        key,
        name: b.customerName,
        mobile: b.mobileNumber,
        address: b.address || '',
        bills: [],
        totalBilled: 0,
        totalReceived: 0,
        totalPending: 0
      };
    }
    customerMap[key].bills.push(b);
    customerMap[key].totalBilled += b.netAmount || 0;
    customerMap[key].totalReceived += b.receivedAmount || 0;
    customerMap[key].totalPending += b.pendingAmount || 0;
  });

  const customerList = Object.values(customerMap);

  const filteredCustomers = customerList.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCustomer = selectedCustomerKey ? customerMap[selectedCustomerKey] : null;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-amber-300 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Customer Ledger &amp; Directory
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Complete billing history and outstanding balances for every customer
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white outline-none"
          />
        </div>
      </div>

      {/* Grid: Left Customer List, Right Customer Detail Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Customer Cards List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-stone-900 p-8 rounded-2xl border border-stone-800 text-center text-stone-500">
              <UserCheck className="w-10 h-10 mx-auto text-stone-600 mb-2" />
              <p className="font-bold text-stone-400 text-sm">No Customer Records Found</p>
              <p className="text-xs text-stone-600">Customers will appear here automatically when bills are created.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomerKey === cust.key;
              const hasPending = cust.totalPending > 0;

              return (
                <div
                  key={cust.key}
                  onClick={() => setSelectedCustomerKey(cust.key)}
                  className={`p-4 rounded-2xl border transition cursor-pointer shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-stone-800/90 border-amber-500 ring-1 ring-amber-500/50'
                      : 'bg-stone-900 hover:bg-stone-800/60 border-stone-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-100 text-base">{cust.name}</span>
                      <span className="text-[11px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-semibold">
                        {cust.bills.length} Bills
                      </span>
                    </div>

                    <div className="text-xs text-stone-400 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-400" />
                        {cust.mobile}
                      </span>
                      {cust.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {cust.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800">
                    <div className="text-right">
                      <div className="text-xs text-stone-400">Total Billed: {formatINR(cust.totalBilled)}</div>
                      <div className={`text-sm font-extrabold ${hasPending ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {hasPending ? `${formatINR(cust.totalPending)} Due` : 'All Cleared'}
                      </div>
                    </div>

                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Customer Complete Ledger (5 Cols) */}
        <div className="lg:col-span-5">
          {selectedCustomer ? (
            <div className="bg-stone-900 rounded-2xl border border-stone-800 shadow-xl p-5 space-y-5 sticky top-24">
              <div className="border-b border-stone-800 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-amber-300 font-cinzel">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    {selectedCustomer.mobile}
                  </p>
                  {selectedCustomer.address && (
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {selectedCustomer.address}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onCreateBillForCustomer(
                    selectedCustomer.name,
                    selectedCustomer.mobile,
                    selectedCustomer.address
                  )}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  + New Bill
                </button>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-stone-400 block">Total Billed</span>
                  <span className="text-sm font-bold text-amber-300">
                    {formatINR(selectedCustomer.totalBilled)}
                  </span>
                </div>
                <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-stone-400 block">Total Paid</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatINR(selectedCustomer.totalReceived)}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                selectedCustomer.totalPending > 0
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              }`}>
                <div>
                  <span className="text-xs font-semibold block">Total Outstanding Balance</span>
                  <span className="text-lg font-extrabold">
                    {formatINR(selectedCustomer.totalPending)}
                  </span>
                </div>

                {selectedCustomer.totalPending > 0 && (
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `*Jasol Furniture - Payment Reminder*\nDear ${selectedCustomer.name},\nYour total outstanding balance is *${formatINR(selectedCustomer.totalPending)}* across your orders.\nPlease clear it at your earliest convenience.\nThank you!`
                      );
                      window.open(`https://wa.me/${selectedCustomer.mobile.replace(/\D/g, '')}?text=${msg}`, '_blank');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    WhatsApp Reminder
                  </button>
                )}
              </div>

              {/* All Customer Invoices */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Previous Invoices ({selectedCustomer.bills.length})
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedCustomer.bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-amber-400">{bill.billNo}</div>
                        <div className="text-[11px] text-stone-400">{bill.billDate}</div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-stone-100">{formatINR(bill.netAmount)}</div>
                        <div className={`text-[10px] ${bill.pendingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {bill.pendingAmount > 0 ? `${formatINR(bill.pendingAmount)} Due` : 'Paid'}
                        </div>
                      </div>

                      <button
                        onClick={() => onViewBill(bill)}
                        className="p-1.5 bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 rounded-lg transition cursor-pointer"
                        title="View Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8 text-center text-stone-500">
              <p className="text-sm font-semibold">Select a customer from the list to view their complete ledger.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
