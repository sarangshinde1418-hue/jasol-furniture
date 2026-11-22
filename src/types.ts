export interface BillItem {
  id: string;
  name: string;
  amount: number;
  quantity?: number;
  rate?: number;
}

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Bill {
  id: string;
  billNo: string;
  customerName: string;
  mobileNumber: string;
  address: string;
  billDate: string;
  billTime: string;
  items: BillItem[];
  totalAmount: number;
  discountPercent: number;
  discountAmount: number;
  netAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  notes?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  mobile: string;
  address: string;
  totalBillsCount: number;
  totalBilledAmount: number;
  totalReceivedAmount: number;
  totalPendingDue: number;
  ownerId: string;
  updatedAt: string;
}

export interface BusinessProfile {
  businessName: string;
  tagline: string;
  subcategories: string;
  address: string;
  phone: string;
  billPrefix: string;
  nextSequence: number;
  ownerId: string;
  updatedAt: string;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessName: 'JASOL Furniture',
  tagline: 'Build Better... Live Better...',
  subcategories: 'Furniture | Woodwork',
  address: 'Washim, Maharashtra',
  phone: '9876543210',
  billPrefix: 'JYF-',
  nextSequence: 1,
  ownerId: '',
  updatedAt: new Date().toISOString()
};

export const COMMON_MATERIALS = [
  'Triputi Plywood',
  'Balaji Ply',
  'Century Ply',
  'Lamination Sheet',
  'Edge Band',
  'Hardware Fitting',
  'Screw & Fastener',
  'Other Material',
  'Teak Wood',
  'MDF / HDF Board',
  'Fevicol / Adhesive',
  'Telescopic Channel',
  'Hydraulic Soft-Close Hinges',
  'Drawer Locks & Handles',
  'PU Polish / Deco Paint',
  'Glass & Mirror Fitting'
];
