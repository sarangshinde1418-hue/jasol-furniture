import React, { useState } from 'react';
import { Bill } from '../types.ts';
import { formatINR, generateWhatsAppMessage } from '../utils/formatters.ts';
import { 
  Search, 
  Printer, 
  Edit3, 
  Trash2, 
  Eye, 
  Share2, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileText
} from 'lucide-react';

interface BillsListViewProps {
  bills: Bill[];
  onViewBill: (bill: Bill) => void;
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (bill: Bill) => void;
  onQuickPayment: (bill: Bill) => void;
  onCreateNew: () => void;
}

export const BillsListView: React.FC<BillsListViewProps> = ({
  bills,
  onViewBill,
  onEditBill,
  onDeleteBill,
  onQuickPayment,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchSearch =
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mobileNumber.includes(searchTerm) ||
      b.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'Paid'
        ? b.paymentStatus === 'Paid' || b.pendingAmount === 0
        : statusFilter === 'Partial'
        ? b.paymentStatus === 'Partial' || (b.receivedAmount > 0 && b.pendingAmount > 0)
        : b.pendingAmount > 0 && b.receivedAmount === 0;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, phone or bill no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white outline-none"
          />
        </div>

        {/* Filters & Add Button */}
        <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-2">
          {/* Status Chips */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            {['all', 'Paid', 'Partial', 'Unpaid'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-500 text-stone-950 font-bold shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All Bills' : st}
              </button>
            ))}
          </div>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-sm rounded-xl shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Bill
          </button>
        </div>
      </div>

      {/* Bills Records Table */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto text-stone-500">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-300">No Bills Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchTerm
                ? 'No bills match your search criteria. Try clearing the filter.'
                : "You haven't created any bills yet. Click 'Create New Bill' to get started."}
            </p>
            <button
              onClick={onCreateNew}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Bill
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-950 text-stone-400 uppercase text-[11px] font-bold border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Bill No &amp; Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                  <th className="py-3 px-4 text-right">Received</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredBills.map((bill) => {
                  const isPaid = bill.paymentStatus === 'Paid' || bill.pendingAmount === 0;
                  const isPartial = bill.paymentStatus === 'Partial' || (bill.receivedAmount > 0 && bill.pendingAmount > 0);

                  return (
                    <tr 
                      key={bill.id}
                      className="hover:bg-stone-800/40 transition group"
                    >
                      {/* Bill No & Date */}
                      <td className="py-3 px-4 font-medium">
                        <div className="font-bold text-amber-400 text-sm tracking-wide">
                          {bill.billNo}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {bill.billDate} &bull; {bill.billTime}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-100 text-sm">
                          {bill.customerName}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-2">
                          <span>{bill.mobileNumber}</span>
                          {bill.address && <span className="truncate max-w-[150px]">({bill.address})</span>}
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                          {bill.items?.length || 0} items
                        </span>
                      </td>

                      {/* Net Amount */}
                      <td className="py-3 px-4 text-right font-bold text-amber-300">
                        {formatINR(bill.netAmount)}
                      </td>

                      {/* Received Amount */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        {formatINR(bill.receivedAmount)}
                      </td>

                      {/* Pending Due */}
                      <td className="py-3 px-4 text-right font-bold">
                        {bill.pendingAmount > 0 ? (
                          <span className="text-rose-400">{formatINR(bill.pendingAmount)}</span>
                        ) : (
                          <span className="text-stone-500">₹0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isPaid
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : isPartial
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                        }`}>
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Receipt */}
                          <button
                            onClick={() => onViewBill(bill)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 transition cursor-pointer"
                            title="View / Print Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Payment update if pending */}
                          {bill.pendingAmount > 0 && (
                            <button
                              onClick={() => onQuickPayment(bill)}
                              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-600 text-emerald-300 hover:text-white transition cursor-pointer"
                              title="Receive Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          {/* WhatsApp Share */}
                          <button
                            onClick={() => {
                              const msg = generateWhatsAppMessage(
                                bill.billNo,
                                bill.customerName,
                                bill.netAmount,
                                bill.receivedAmount,
                                bill.pendingAmount
                              );
                              window.open(`https://wa.me/${bill.mobileNumber.replace(/\D/g, '')}?text=${msg}`, '_blank');
                            }}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-emerald-600 hover:text-white text-stone-300 transition cursor-pointer"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Edit Bill */}
                          <button
                            onClick={() => onEditBill(bill)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 transition cursor-pointer"
                            title="Edit Bill"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Bill */}
                          <button
                            onClick={() => onDeleteBill(bill)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-600 hover:text-white text-stone-400 transition cursor-pointer"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
