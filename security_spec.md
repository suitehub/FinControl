# Security Specification: FinControl Firestore Security

This document outlines the security specifications and invariants for the FinControl Firebase implementation to ensure a zero-trust, attribute-based access control (ABAC) design.

## 1. Data Invariants

1.  **User Scoping**: Users can only access, create, update, or delete data where `userId` strictly matches their own authenticated Firebase UID (`request.auth.uid`). No cross-user reads or writes are allowed.
2.  **Transactions**:
    *   `userId` must match `request.auth.uid`.
    *   `id` and other properties must be of correct types and not empty or poisoned.
    *   `dizimoSeparado` can only be set or toggle on income type.
3.  **Subscriptions**:
    *   `userId` must match `request.auth.uid`.
    *   `billingDate` must be a valid day of the month (1-31).
    *   `value` must be a positive number.
4.  **Fixed Costs**:
    *   `userId` must match `request.auth.uid`.
    *   `dueDate` must be a valid day of the month (1-31).
5.  **Patrimonio Accounts**:
    *   `userId` must match `request.auth.uid`.
    *   `balance` must be a number.
6.  **Planning Goals**:
    *   The document ID in `planningGoals` collection must match the `userId` itself.
    *   `needs + leisure + emergency + investments + goals` must be logical and individual components cannot exceed boundary limits.
7.  **Chat Messages**:
    *   `userId` must match `request.auth.uid`.
    *   Users can only delete or edit their own chat logs if permitted, or reads are constrained to owned content.

---

## 2. The "Dirty Dozen" Rogue Payloads

These 12 payloads represent malicious attempts to compromise data integrity, hijack identity, or poison fields. All must return `PERMISSION_DENIED` under the security rules.

### Payload 1: Identity Spoofing (Foreign User Impersonation)
Attempt to create a transaction belonging to another user.
```json
{
  "id": "t-spoof",
  "userId": "victim_user_123",
  "date": "2026-06-24",
  "description": "Malicious Transfer",
  "value": 1000,
  "category": "Salário",
  "type": "income"
}
```

### Payload 2: Ghost Field Insertion (Schema Poisoning)
Attempt to write a transaction containing extra, un-schema'd metadata.
```json
{
  "id": "t-ghost",
  "userId": "my_uid",
  "date": "2026-06-24",
  "description": "Clean Description",
  "value": 50,
  "category": "Alimentação",
  "type": "expense",
  "isVerifiedByAdmin": true
}
```

### Payload 3: Negative Price/Value Poisoning
Attempt to inject negative currency values in transactions or subscriptions.
```json
{
  "id": "t-poison",
  "userId": "my_uid",
  "date": "2026-06-24",
  "description": "Refund Hack",
  "value": -99999,
  "category": "Lazer",
  "type": "expense"
}
```

### Payload 4: Invalid Currency Day Range (Billing Date Overflows)
Attempt to set a billing day beyond 31 in a subscription.
```json
{
  "id": "sub-overflow",
  "userId": "my_uid",
  "name": "Super AI Pro",
  "category": "Ferramentas",
  "value": 20,
  "currency": "USD",
  "billingDate": 45,
  "autoRenew": true
}
```

### Payload 5: Planning Goal Document ID Hijack
Attempt to save a budget goal configuration with a document ID other than the user's authentic UID.
*   Target Path: `/planningGoals/another_user_uid`
```json
{
  "userId": "my_uid",
  "needs": 50,
  "leisure": 20,
  "emergency": 10,
  "investments": 10,
  "goals": 10
}
```

### Payload 6: Anonymous Write on Authenticated Collection
Attempt to write a fixed cost without a verified auth token or while unauthenticated.
```json
{
  "id": "fc-anon",
  "userId": "some_uid",
  "name": "Gas Bill",
  "value": 100,
  "dueDate": 15,
  "required": true
}
```

### Payload 7: Giant String Attack (Resource Denial of Wallet)
Attempt to inject a 2MB base64 block into the description field of a transaction to exhaust billing tier limits.
```json
{
  "id": "t-giant",
  "userId": "my_uid",
  "date": "2026-06-24",
  "description": "A... [2MB of characters] ...Z",
  "value": 15,
  "category": "Lazer",
  "type": "expense"
}
```

### Payload 8: Immutable Field Tampering (createdAt Bypass)
Attempt to update a read-only immutable field after creation.
*   Attempting to alter `userId` on update from `my_uid` to `hacker_uid`.

### Payload 9: Invalid Transaction Type Selection
Attempt to create a transaction with an unsupported type name.
```json
{
  "id": "t-bad-type",
  "userId": "my_uid",
  "date": "2026-06-24",
  "description": "Coffee",
  "value": 5,
  "category": "Alimentação",
  "type": "malicious_type"
}
```

### Payload 10: Invalid Currency Type Selection
Attempt to use an unsupported currency type symbol (e.g. BTC) in a subscription or asset account.
```json
{
  "id": "sub-bad-curr",
  "userId": "my_uid",
  "name": "Bitcoin Miner Premium",
  "category": "Lazer",
  "value": 1.5,
  "currency": "BTC",
  "billingDate": 10,
  "autoRenew": true
}
```

### Payload 11: Cross-User Read Request (Query Scraping)
Attempting to read all collections or query without filter restrictions on `userId` to scrape other people's finances.
*   Requires a rule-enforced secure list condition: `allow list: if resource.data.userId == request.auth.uid`.

### Payload 12: Invalid Account Type Selection
Attempt to create an asset account with an unauthorized account type (e.g. 'crypto_vault').
```json
{
  "id": "acc-bad-type",
  "userId": "my_uid",
  "name": "Shadow Bank",
  "type": "crypto_vault",
  "balance": 1000000,
  "currency": "USD"
}
```

---

## 3. Test Verification Plan

All security checks will be implemented in `firestore.rules` and verified using active role checks. The primary fortress rules will use strict `isValidId()` limits and schema validation helpers to enforce zero-trust bounds.
