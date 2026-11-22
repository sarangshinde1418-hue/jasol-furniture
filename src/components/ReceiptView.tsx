import React, { useState } from 'react';
import { Bill } from '../types.ts';
import { formatINR, generateWhatsAppMessage } from '../utils/formatters.ts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Printer, 
  Share2, 
  Edit3, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Layers, 
  Calculator,
  Receipt,
  Download,
  Sparkles
} from 'lucide-react';

interface ReceiptViewProps {
  bill: Bill;
  onEdit?: (bill: Bill) => void;
  onClose?: () => void;
  showActions?: boolean;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  bill,
  onEdit,
  onClose,
  showActions = true,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Direct 1-Click PDF File Generator & Downloader (Works 100% in all iframes and browsers)
  const handleDownloadPDF = async () => {
    const docEl = document.getElementById('receipt-document');
    if (!docEl) return;

    setIsDownloadingPdf(true);
    setDownloadSuccess(false);

    try {
      // Scroll to top to ensure complete viewport capture
      window.scrollTo(0, 0);

      // Render high-definition canvas (2.5x for crisp print-grade vector-like quality)
      const canvas = await html2canvas(docEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fffaf0',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Standard A4 dimensions: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Cover exact 100% of A4 portrait edge-to-edge without white borders
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      
      const safeBillNo = (bill.billNo || 'JYF-001').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Jasol_Furniture_${safeBillNo}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4500);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      // Fallback to browser print dialog
      try {
        window.print();
      } catch {
        alert('Could not download PDF automatically. Please check your browser download permissions.');
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Browser Print Dialog Trigger
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('window.print restricted by iframe sandbox, falling back to direct PDF download:', e);
      handleDownloadPDF();
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = generateWhatsAppMessage(
      bill.billNo,
      bill.customerName,
      bill.netAmount,
      bill.receivedAmount,
      bill.pendingAmount
    );
    window.open(`https://wa.me/${bill.mobileNumber.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  // Status Styling
  const isPaid = bill.paymentStatus === 'Paid' || bill.pendingAmount === 0;
  const isPartial = bill.paymentStatus === 'Partial' || (bill.receivedAmount > 0 && bill.pendingAmount > 0);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Action Toolbar (Hidden during print) */}
      {showActions && (
        <div className="no-print w-full max-w-[760px] mb-3 flex flex-col gap-2">
          <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-stone-900/95 text-white p-3 rounded-xl shadow-lg border border-amber-500/30">
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <span className="font-semibold text-amber-400 text-xs sm:text-sm tracking-wide">
                Invoice: {bill.billNo}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition shadow cursor-pointer"
                title="Share receipt via WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>

              {onEdit && (
                <button
                  onClick={() => onEdit(bill)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-medium transition shadow border border-stone-700 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}

              {/* DIRECT SAVE PDF BUTTON (1-Click Instant Download) */}
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs sm:text-sm transition shadow-md cursor-pointer disabled:opacity-60"
                title="Download complete A4 PDF file directly to your computer"
              >
                {isDownloadingPdf ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving PDF...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>PDF Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Save PDF (A4)</span>
                  </>
                )}
              </button>

              {/* BROWSER PRINT BUTTON */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-extrabold text-xs sm:text-sm transition shadow-md cursor-pointer"
                title="Open browser print dialog"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>

          {/* Success notice */}
          {downloadSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full A4 PDF has been downloaded to your downloads folder without any white borders!</span>
            </div>
          )}
        </div>
      )}

      {/* The Printable Receipt Document - Covers 100% of A4 page edge-to-edge */}
      <div 
        id="receipt-document"
        className="print-only-container w-full max-w-[760px] min-h-[960px] sm:min-h-[1050px] flex flex-col justify-between bg-[#fffaf0] rounded-xl sm:rounded-2xl shadow-2xl border-2 border-[#b58024] overflow-hidden text-[#231709] transition-all"
        style={{
          boxShadow: '0 15px 35px -5px rgba(60, 30, 5, 0.25), 0 0 0 1px #d49b29'
        }}
      >
        {/* HEADER IMAGE: JJ Jasol Furniture banner */}
        <div className="w-full relative overflow-hidden bg-[#2b170c] border-b border-[#e2a838] shrink-0">
          <img 
            src="/receipt-header.png" 
            alt="Jasol Furniture Header" 
            className="w-full h-auto block select-none"
          />
        </div>

        {/* RECEIPT BODY - Flexes proportionally to cover full A4 height */}
        <div className="receipt-body-content flex-1 flex flex-col justify-between p-3.5 sm:p-4 gap-2.5 bg-gradient-to-b from-[#fffbf2] via-[#fbf5e7] to-[#f8efdc]">
          
          {/* TITLE RIBBON: PAYMENT RECEIPT */}
          <div className="flex items-center justify-center my-0.5 shrink-0">
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-[#c68f2c] to-[#e4af47]"></div>
            <div className="mx-2 sm:mx-3 relative">
              <div className="bg-gradient-to-r from-[#2a160b] via-[#432312] to-[#2a160b] text-white px-6 sm:px-8 py-1 rounded-full border-2 border-[#dca63d] shadow-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8be66] shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]"></span>
                <div className="bg-[#e9ba55] text-stone-900 p-0.5 rounded-xs flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5 text-[#331a0b]" />
                </div>
                <h1 className="text-xs sm:text-sm font-bold tracking-wider uppercase font-cinzel text-[#fce8b8] drop-shadow-xs">
                  Payment Receipt
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8be66] shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]"></span>
              </div>
            </div>
            <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-[#c68f2c] to-[#e4af47]"></div>
          </div>

          {/* TWO INFO CARDS: Customer Details (Left) & Bill Information (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
            
            {/* Customer Details Card */}
            <div className="bg-[#fffdf8] rounded-lg border border-[#d6a13d] shadow-xs overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-[#381e0e] via-[#4e2a14] to-[#381e0e] text-[#fbe1a6] px-3 py-1 border-b border-[#cca043] flex items-center gap-1.5">
                <div className="p-0.5 bg-[#e4b34b] text-stone-900 rounded-full">
                  <User className="w-3 h-3 text-[#3a1d0d]" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-wide uppercase">Customer Details</span>
              </div>

              {/* Body: Headings 100% on 1 line with fixed width; value wraps properly */}
              <div className="p-2 sm:p-2.5 space-y-1.5 text-xs font-medium bg-[#fffdf8] flex-1">
                {/* Customer Name */}
                <div className="flex items-start leading-snug">
                  <div className="w-28 sm:w-32 shrink-0 flex items-center gap-1.5 text-stone-700 font-medium whitespace-nowrap">
                    <User className="w-3.5 h-3.5 text-[#a8741e] shrink-0" />
                    <span>Customer Name</span>
                  </div>
                  <span className="w-3 text-center font-bold text-stone-800 shrink-0">:</span>
                  <span className="flex-1 font-bold text-stone-950 break-words min-w-0">
                    {bill.customerName}
                  </span>
                </div>

                {/* Mobile Number */}
                <div className="flex items-start leading-snug">
                  <div className="w-28 sm:w-32 shrink-0 flex items-center gap-1.5 text-stone-700 font-medium whitespace-nowrap">
                    <Phone className="w-3.5 h-3.5 text-[#a8741e] shrink-0" />
                    <span>Mobile Number</span>
                  </div>
                  <span className="w-3 text-center font-bold text-stone-800 shrink-0">:</span>
                  <span className="flex-1 font-bold text-stone-950 break-words min-w-0">
                    {bill.mobileNumber}
                  </span>
                </div>

                {/* Address (Supports any length properly) */}
                <div className="flex items-start leading-snug">
                  <div className="w-28 sm:w-32 shrink-0 flex items-center gap-1.5 text-stone-700 font-medium whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 text-[#a8741e] shrink-0" />
                    <span>Address</span>
                  </div>
                  <span className="w-3 text-center font-bold text-stone-800 shrink-0">:</span>
                  <span className="flex-1 font-bold text-stone-950 break-words min-w-0 leading-tight">
                    {bill.address || 'Washim, Maharashtra'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill Information Card */}
            <div className="bg-[#fffdf8] rounded-lg border border-[#d6a13d] shadow-xs overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-[#381e0e] via-[#4e2a14] to-[#381e0e] text-[#fbe1a6] px-3 py-1 border-b border-[#cca043] flex items-center gap-1.5">
                <div className="p-0.5 bg-[#e4b34b] text-stone-900 rounded-full">
                  <Calendar className="w-3 h-3 text-[#3a1d0d]" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-wide uppercase">Bill Information</span>
              </div>

              {/* Body: Headings 100% on 1 line */}
              <div className="p-2 sm:p-2.5 space-y-1.5 text-xs font-medium bg-[#fffdf8] flex-1">
                {/* Bill No */}
                <div className="flex items-start leading-snug">
                  <div className="w-22 sm:w-24 shrink-0 flex items-center gap-1.5 text-stone-700 font-medium whitespace-nowrap">
                    <FileText className="w-3.5 h-3.5 text-[#a8741e] shrink-0" />
                    <span>Bill No.</span>
                  </div>
                  <span className="w-3 text-center font-bold text-stone-800 shrink-0">:</span>
                  <span className="flex-1 font-bold text-[#972a08] tracking-wider break-words min-w-0">
                    {bill.billNo}
                  </span>
                </div>

                {/* Bill Date */}
                <div className="flex items-start leading-snug">
                  <div className="w-22 sm:w-24 shrink-0 flex items-center gap-1.5 text-stone-700 font-medium whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 text-[#a8741e] shrink-0" />
                    <span>Bill Date</span>
                  </div>
                  <span className="w-3 text-center font-bold text-stone-800 shrink-0">:</span>
                  <span className="flex-1 font-bold text-stone-950 break-words min-w-0">
                    {bill.billDate}
                  </span>
                </div>

                {/* Time */}
                <div className="flex items-start leading-snug">
                  <div className="w-22 sm:w-24 shrink-0 flex items-center gap-1.5 text-stone-700 font-medium whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-[#a8741e] shrink-0" />
                    <span>Time</span>
                  </div>
                  <span className="w-3 text-center font-bold text-stone-800 shrink-0">:</span>
                  <span className="flex-1 font-bold text-stone-950 break-words min-w-0">
                    {bill.billTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MATERIAL DETAILS TABLE - Stretches to fill middle section like original receipt */}
          <div className="bg-[#fffdf8] rounded-lg border border-[#d6a13d] shadow-xs overflow-hidden flex-1 flex flex-col justify-between">
            <div>
              {/* Header with diagonal stripe badge */}
              <div className="bg-gradient-to-r from-[#381e0e] via-[#4e2a14] to-[#381e0e] text-[#fbe1a6] px-3 py-1.5 border-b border-[#cca043] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 bg-[#e4b34b] text-stone-900 rounded-xs">
                    <Layers className="w-3 h-3 text-[#3a1d0d]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold tracking-wide uppercase">Material Details</span>
                </div>
                {/* Diagonal gold stripes icon badge */}
                <div className="flex items-center gap-1 opacity-90">
                  <span className="w-1.5 h-3 skew-x-[-20deg] bg-[#f0c359] block"></span>
                  <span className="w-1.5 h-3 skew-x-[-20deg] bg-[#f0c359] block"></span>
                  <span className="w-1.5 h-3 skew-x-[-20deg] bg-[#f0c359] block"></span>
                </div>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#f5ca66] via-[#e5b244] to-[#f5ca66] text-stone-950 font-bold border-b border-[#c8942b]">
                      <th className="py-1.5 px-2.5 text-center w-14 border-r border-[#d49f33]">Sr. No.</th>
                      <th className="py-1.5 px-3 text-left border-r border-[#d49f33]">Material Name</th>
                      <th className="py-1.5 px-3 text-right w-32 sm:w-36">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebd095]">
                    {bill.items.map((item, idx) => (
                      <tr 
                        key={item.id || idx}
                        className={idx % 2 === 0 ? 'bg-[#fffefb]' : 'bg-[#fcf6e8]'}
                      >
                        <td className="py-1.5 px-2.5 text-center font-bold text-stone-800 border-r border-[#edd8aa]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-stone-900 border-r border-[#edd8aa]">
                          {item.name}
                          {item.quantity && item.rate ? (
                            <span className="text-[10px] text-stone-600 ml-1.5 font-normal">
                              ({item.quantity} × {formatINR(item.rate)})
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-stone-950">
                          {formatINR(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Material Amount Footer Bar */}
            <div className="bg-gradient-to-r from-[#f7ce69] via-[#e8b548] to-[#f7ce69] text-stone-950 font-extrabold border-t border-[#b88220] flex items-center justify-between px-3.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#44220c]" />
                <span className="text-xs sm:text-sm">Total Material Amount</span>
              </div>
              <span className="text-xs sm:text-sm tracking-wide font-black">
                {formatINR(bill.totalAmount)}
              </span>
            </div>
          </div>

          {/* CHARGES CALCULATION CARD */}
          <div className="bg-[#fffdf8] rounded-lg border border-[#d6a13d] shadow-xs overflow-hidden shrink-0">
            <div className="bg-gradient-to-r from-[#381e0e] via-[#4e2a14] to-[#381e0e] text-[#fbe1a6] px-3 py-1 border-b border-[#cca043] flex items-center gap-1.5">
              <div className="p-0.5 bg-[#e4b34b] text-stone-900 rounded-xs">
                <Calculator className="w-3 h-3 text-[#3a1d0d]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold tracking-wide uppercase">Charges Calculation</span>
            </div>

            <div className="p-2.5 sm:p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                
                {/* Left Side: Total, Discount, Net Amount */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-dashed border-[#e6c98c]">
                    <span className="font-semibold text-stone-800">Total Material Amount</span>
                    <span className="font-bold text-stone-950">{formatINR(bill.totalAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-dashed border-[#e6c98c]">
                    <span className="font-semibold text-stone-800">
                      Discount {bill.discountPercent ? `(${bill.discountPercent}%)` : ''}
                    </span>
                    <span className="font-bold text-emerald-800">
                      - {formatINR(bill.discountAmount || 0)}
                    </span>
                  </div>

                  {/* Net Amount Highlight Bar */}
                  <div className="bg-gradient-to-r from-[#fadc78] via-[#e5b349] to-[#fadc78] px-3 py-1.5 rounded-md border border-[#c48e24] shadow-xs flex justify-between items-center">
                    <span className="font-bold text-stone-950 text-xs sm:text-sm">Net Amount</span>
                    <span className="font-extrabold text-stone-950 text-sm sm:text-base tracking-wide">
                      {formatINR(bill.netAmount)}
                    </span>
                  </div>
                </div>

                {/* Right Side: Received Amount & Pending Amount */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center bg-[#f0f9f3] p-1.5 px-2.5 rounded-md border border-emerald-300">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Received Amount</span>
                    </div>
                    <span className="font-extrabold text-emerald-900 text-xs sm:text-sm">
                      {formatINR(bill.receivedAmount)}
                    </span>
                  </div>

                  <div className={`flex justify-between items-center p-1.5 px-2.5 rounded-md border ${
                    bill.pendingAmount > 0 
                      ? 'bg-[#fef2f2] border-rose-300 text-rose-950' 
                      : 'bg-[#fafaf9] border-stone-200 text-stone-700'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className={`w-3.5 h-3.5 shrink-0 ${bill.pendingAmount > 0 ? 'text-rose-600' : 'text-stone-400'}`} />
                      <span>Pending Balance</span>
                    </div>
                    <span className={`font-extrabold text-xs sm:text-sm ${bill.pendingAmount > 0 ? 'text-rose-700' : 'text-stone-800'}`}>
                      {formatINR(bill.pendingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PAYMENT STATUS PILL (Matching the green pill badge in the attachment) */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                <div className={`inline-flex items-center gap-1.5 px-5 py-1 rounded-full font-bold text-xs sm:text-sm text-white shadow-xs border ${
                  isPaid
                    ? 'bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 border-green-400'
                    : isPartial
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border-yellow-300'
                    : 'bg-gradient-to-r from-red-700 via-rose-600 to-red-700 border-rose-400'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Payment Status : {bill.paymentStatus}</span>
                </div>

                {bill.paymentMethod && (
                  <span className="text-[11px] font-semibold text-stone-700 bg-[#faeed2] px-2.5 py-0.5 rounded-full border border-[#d6a94a]">
                    Mode: {bill.paymentMethod}
                  </span>
                )}
              </div>

              {bill.notes && (
                <div className="text-[10px] text-stone-700 bg-[#fffdf5] p-1.5 rounded border border-[#edd7a4] text-center italic">
                  Note: {bill.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER IMAGE: Location, Phone 9876543210, "Thank You For Your Business!" banner */}
        <div className="w-full relative overflow-hidden bg-[#2b170c] border-t border-[#e2a838] shrink-0">
          <img 
            src="/receipt-footer.png" 
            alt="Jasol Furniture Footer" 
            className="w-full h-auto block select-none"
          />
        </div>
      </div>
    </div>
  );
};
