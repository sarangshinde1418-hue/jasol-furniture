# Security Specification: Jasol Furniture Billing & Hisab Software

## 1. Data Invariants
1. Unauthenticated users cannot read, list, create, update, or delete any bills, customers, or business profiles.
2. Every bill document must have `ownerId == request.auth.uid`. A user cannot forge or overwrite another user's `ownerId`.
3. Every bill write must strictly validate field types and boundary constraints (`billNo`, `customerName`, `mobileNumber`, `totalAmount`, `netAmount`, `receivedAmount`, `pendingAmount`, `paymentStatus`).
4. Financial balance integrity: `netAmount` and `totalAmount` must be non-negative numbers.
5. All IDs must adhere to standard alphanumeric and safe character format `^[a-zA-Z0-9_-]+$`.
6. Customers ledger must be strictly bounded to `ownerId == request.auth.uid`.
7. Client cannot perform blanket or unconstrained cross-tenant listing without matching `resource.data.ownerId == request.auth.uid`.

## 2. The Dirty Dozen Payloads (Designed to Fail with PERMISSION_DENIED)
1. **Unauthenticated Bill Read**: Reading `/bills/bill-001` without `request.auth`.
2. **Unauthenticated Bill Creation**: Creating a bill without `request.auth`.
3. **Owner Spoofing on Create**: Authenticated user `user_A` creating a bill with `ownerId: "user_B"`.
4. **Owner Hijack on Update**: Authenticated user updating `ownerId` from `user_A` to `user_B`.
5. **Cross-Tenant Bill Deletion**: User `user_A` deleting a bill belonging to `user_B`.
6. **Cross-Tenant List Scraping**: Querying `/bills` where `resource.data.ownerId != request.auth.uid`.
7. **Negative Total Amount Poisoning**: Bill creation with `totalAmount: -5000`.
8. **Invalid Status Injection**: Setting `paymentStatus: "Comped_Secret"` instead of `["Paid", "Partial", "Unpaid"]`.
9. **Junk ID Resource Exhaustion**: Attempting to create a document with a 2KB junk character ID.
10. **Shadow Field Injection**: Injecting unauthorized root keys like `__isAdmin: true` into a bill document.
11. **Cross-Tenant Customer Tampering**: User `user_A` updating or deleting `user_B`'s customer ledger document.
12. **Business Profile Forgery**: Setting another user's UID inside `business_profiles/{profileId}`.

## 3. Test Runner
Defined in `firestore.rules.test.ts` verifying that unauthorized or malformed requests are strictly rejected.
