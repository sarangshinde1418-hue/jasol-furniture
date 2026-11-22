/**
 * Formatting utilities for Indian currency, dates, and bills
 */

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  // Format as Indian numbering format (e.g. 20,000 or 1,50,000)
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);
  return `₹${formatted}`;
}

export function formatDateToReceipt(dateStr?: string | Date): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '21 Nov 2026';
  
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTimeToReceipt(dateStr?: string | Date): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '03:45 PM';

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hrStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hrStr}:${minStr} ${ampm}`;
}

export function generateWhatsAppMessage(
  billNo: string,
  customerName: string,
  netAmount: number,
  receivedAmount: number,
  pendingAmount: number,
  shopName: string = 'Jasol Furniture'
): string {
  let msg = `*${shopName} - Payment Receipt*\n`;
  msg += `---------------------------------\n`;
  msg += `Dear *${customerName}*,\n`;
  msg += `Thank you for your business! Here are your bill details:\n\n`;
  msg += `📄 *Bill No:* ${billNo}\n`;
  msg += `💰 *Net Amount:* ${formatINR(netAmount)}\n`;
  msg += `✅ *Received Amount:* ${formatINR(receivedAmount)}\n`;
  if (pendingAmount > 0) {
    msg += `⏳ *Pending Balance:* ${formatINR(pendingAmount)}\n`;
    msg += `Please clear your pending balance at your earliest convenience.\n`;
  } else {
    msg += `🎉 *Payment Status:* Full Paid\n`;
  }
  msg += `\n*Jasol Furniture - Washim, Maharashtra*\n`;
  msg += `Contact: 9876543210`;
  return encodeURIComponent(msg);
}
