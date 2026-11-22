import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Bill, CustomerSummary, BusinessProfile, DEFAULT_BUSINESS_PROFILE } from './types.ts';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: Required for Enterprise DB */
export const auth = getAuth(app);

// Provider for Google Auth
export const googleProvider = new GoogleAuthProvider();

// Test Connection Helper (MANDATORY per skill instructions)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Structured Firestore Error Handling (MANDATORY per skill instructions)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth Helper Functions
export async function signInUserWithEmail(email: string, pass: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  } catch (err: any) {
    // If user doesn't exist yet, try creating account seamlessly if requested or rethrow
    throw err;
  }
}

export async function registerUserWithEmail(email: string, pass: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function signInWithGooglePopup() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function logOutUser() {
  await signOut(auth);
}

// Database Services: Bills
export function subscribeToBills(userId: string, callback: (bills: Bill[]) => void, onError?: (err: any) => void) {
  const path = 'bills';
  const q = query(
    collection(db, path),
    where('ownerId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const bills: Bill[] = [];
      snapshot.forEach((docSnap) => {
        bills.push({ ...docSnap.data(), id: docSnap.id } as Bill);
      });
      // Sort in memory by createdAt descending
      bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(bills);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveBill(bill: Bill): Promise<void> {
  const path = `bills/${bill.id}`;
  try {
    await setDoc(doc(db, 'bills', bill.id), bill);
    // Also synchronously update the customer's khata summary
    await updateCustomerSummaryAfterBill(bill);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBill(billId: string, billObj?: Bill): Promise<void> {
  const path = `bills/${billId}`;
  try {
    await deleteDoc(doc(db, 'bills', billId));
    if (billObj) {
      await recalculateCustomerAfterBillDelete(billObj);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Database Services: Customers Khata
export function subscribeToCustomers(userId: string, callback: (customers: CustomerSummary[]) => void) {
  const path = 'customers';
  const q = query(
    collection(db, path),
    where('ownerId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const customers: CustomerSummary[] = [];
      snapshot.forEach((docSnap) => {
        customers.push({ ...docSnap.data(), id: docSnap.id } as CustomerSummary);
      });
      customers.sort((a, b) => b.totalPendingDue - a.totalPendingDue);
      callback(customers);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Sync Customer Ledger
async function updateCustomerSummaryAfterBill(bill: Bill) {
  if (!bill.customerName || !bill.mobileNumber) return;
  const customerId = `${bill.ownerId}_${bill.mobileNumber.trim().replace(/\D/g, '') || bill.customerName.toLowerCase().replace(/\s+/g, '_')}`;
  const path = `customers/${customerId}`;

  try {
    const custRef = doc(db, 'customers', customerId);
    const existingSnap = await getDoc(custRef);
    
    if (existingSnap.exists()) {
      const existing = existingSnap.data() as CustomerSummary;
      // We will recalculate by querying all bills for this customer or updating
      await setDoc(custRef, {
        ...existing,
        name: bill.customerName,
        mobile: bill.mobileNumber,
        address: bill.address || existing.address || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      const newCust: CustomerSummary = {
        id: customerId,
        name: bill.customerName,
        mobile: bill.mobileNumber,
        address: bill.address || '',
        totalBillsCount: 1,
        totalBilledAmount: bill.netAmount,
        totalReceivedAmount: bill.receivedAmount,
        totalPendingDue: bill.pendingAmount,
        ownerId: bill.ownerId,
        updatedAt: new Date().toISOString()
      };
      await setDoc(custRef, newCust);
    }
  } catch (err) {
    console.warn('Customer summary update notice:', err);
  }
}

async function recalculateCustomerAfterBillDelete(bill: Bill) {
  // Gracefully attempt customer ledger reconciliation
  if (!bill.customerName || !bill.mobileNumber) return;
  const customerId = `${bill.ownerId}_${bill.mobileNumber.trim().replace(/\D/g, '') || bill.customerName.toLowerCase().replace(/\s+/g, '_')}`;
  try {
    const custRef = doc(db, 'customers', customerId);
    const snap = await getDoc(custRef);
    if (snap.exists()) {
      const curr = snap.data() as CustomerSummary;
      const newCount = Math.max(0, (curr.totalBillsCount || 1) - 1);
      const newBilled = Math.max(0, (curr.totalBilledAmount || 0) - bill.netAmount);
      const newRecv = Math.max(0, (curr.totalReceivedAmount || 0) - bill.receivedAmount);
      const newPending = Math.max(0, (curr.totalPendingDue || 0) - bill.pendingAmount);
      await setDoc(custRef, {
        ...curr,
        totalBillsCount: newCount,
        totalBilledAmount: newBilled,
        totalReceivedAmount: newRecv,
        totalPendingDue: newPending,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Recalculate customer notice:', err);
  }
}

// Database Services: Business Profile
export async function getBusinessProfile(userId: string): Promise<BusinessProfile> {
  const path = `business_profiles/${userId}`;
  try {
    const profileRef = doc(db, 'business_profiles', userId);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as BusinessProfile;
    }
    const initial: BusinessProfile = {
      ...DEFAULT_BUSINESS_PROFILE,
      ownerId: userId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(profileRef, initial);
    return initial;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateBusinessProfile(profile: BusinessProfile): Promise<void> {
  const path = `business_profiles/${profile.ownerId}`;
  try {
    await setDoc(doc(db, 'business_profiles', profile.ownerId), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
