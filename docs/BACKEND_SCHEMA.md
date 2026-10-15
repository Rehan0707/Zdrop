# ZDrop - Backend Database & Storage Schema

> **Document Version:** 1.0.0 (Data Architecture & Model Specification)  
> **Target Database:** Google Cloud Firestore (NoSQL Document Store)  
> **Blob Store:** Firebase Cloud Storage (Google Cloud Storage)  
> **Validation Engine:** Zod (TypeScript runtime schema validation)  

---

## 1. Firestore Data Collections

The ZDrop data layer is deliberately minimalist and privacy-compliant. No user credentials, IP logs, or personal telephone numbers are retained in the database.

### 1.1 Collection: `sessions`
Path: `/sessions/{sessionId}`  
Document Key: `sessionId` (String format: `ses_<uuidv4>`)

#### Field Definitions
| Field Name | Type | Constraints / Format | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | `ses_[a-f0-9-]{36}` | Unique session identifier. |
| `accessCode` | String | Exactly 6 numeric digits (`^[0-9]{6}$`) | Temporary OTP code used across counter. |
| `status` | String (Enum) | `PENDING_UPLOAD` \| `ACTIVE` \| `ACCESSED` \| `PRINTED` \| `DELETED` \| `EXPIRED` | Lifecycle state machine tracker. |
| `createdAt` | Timestamp | Firestore ServerTimestamp | Exact timestamp of session initialization. |
| `expiresAt` | Timestamp | `createdAt + 15 minutes` | Hard cutoff timestamp for automated purge. |
| `accessedAt` | Timestamp \| Null | Nullable | Timestamp when operator first validated the OTP. |
| `deletedAt` | Timestamp \| Null | Nullable | Timestamp when documents were purged from storage. |
| `deletionSource` | String \| Null | `OPERATOR_PRINT` \| `STUDENT_REVOKE` \| `TTL_PURGE` \| Null | Origin of deletion trigger; `STUDENT_REVOKE` is the persisted legacy value for a customer-requested deletion. |
| `preferences` | Map (Object) | Embedded Map | User-defined printing configuration. |
| `preferences.copies` | Integer | Min 1, Max 99 (Default: 1) | Number of physical duplicate sets. |
| `preferences.colorMode` | String (Enum) | `AUTO` \| `BW` \| `COLOR` | Heuristic page-color mix, Black & White, or Full Color. |
| `preferences.sides` | String (Enum) | `SINGLE` \| `DOUBLE` | Single-sided vs. Duplex print. |
| `preferences.pageRange` | String | String (`ALL` or e.g. `"1-10, 15"`) | Specific pages to be printed. |
| `preferences.customerNotes`| String \| Null | Max 120 chars | Optional quick note (e.g., "Staple top-left"). |
| `fileCount` | Integer | Min 1, Max 3 | Number of attached files in this session. |
| `totalSizeBytes` | Integer | Max 78,643,200 (75 MB total) | Aggregate byte size of all files combined. |
| `files` | Array<Map> | Length 1 to 3 | Detailed metadata of each file in the session. |
| `files[].fileId` | String | `file_[a-z0-9]{8}` | Unique sub-identifier for the file. |
| `files[].originalName` | String | Max 100 chars (sanitized) | Display name shown in UI (e.g., `"final_resume.pdf"`). |
| `files[].storagePath` | String | Relative cloud storage path | `sessions/{sessionId}/{fileId}_{sanitizedName}`. |
| `files[].sizeBytes` | Integer | Max 26,214,400 (25 MB) | Exact file size. |
| `files[].mimeType` | String | Allowed MIME enum | `application/pdf`, `application/vnd.openxmlformats...`, `image/jpeg`, `image/png`. |
| `files[].pageCount` | Integer \| Null | Nullable | Detected page count if available from pre-flight. |
| `files[].colorPages` | Array<Integer> \| Null | 1-based page numbers, max 2000 | On-device PDF/image color-analysis result; advisory only. Missing means unavailable and is conservatively estimated as color. |

---

## 2. TypeScript Data Interfaces & Zod Validation Schemas

```typescript
import { z } from 'zod';

// Allowed MIME types
export const AllowedMimeTypesEnum = z.enum([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]);

// Print preferences schema
export const PrintPreferencesSchema = z.object({
  copies: z.number().int().min(1).max(99).default(1),
  colorMode: z.enum(['BW', 'COLOR']).default('BW'),
  sides: z.enum(['SINGLE', 'DOUBLE']).default('DOUBLE'),
  pageRange: z.string().max(50).default('ALL'),
  customerNotes: z.string().max(120).optional()
});

// File metadata schema
export const FileMetadataSchema = z.object({
  fileId: z.string(),
  originalName: z.string().min(1).max(100),
  storagePath: z.string(),
  sizeBytes: z.number().int().max(25 * 1024 * 1024), // 25 MB max
  mimeType: AllowedMimeTypesEnum,
  pageCount: z.number().int().optional()
});

// Full session document schema
export const SessionDocumentSchema = z.object({
  id: z.string(),
  accessCode: z.string().regex(/^[0-9]{6}$/, 'Must be a 6-digit numeric OTP'),
  status: z.enum(['PENDING_UPLOAD', 'ACTIVE', 'ACCESSED', 'PRINTED', 'DELETED', 'EXPIRED']),
  createdAt: z.date(),
  expiresAt: z.date(),
  accessedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  deletionSource: z.enum(['OPERATOR_PRINT', 'STUDENT_REVOKE', 'TTL_PURGE']).nullable(),
  preferences: PrintPreferencesSchema,
  fileCount: z.number().int().min(1).max(3),
  totalSizeBytes: z.number().int().max(75 * 1024 * 1024),
  files: z.array(FileMetadataSchema).min(1).max(3)
});

export type PrintPreferences = z.infer<typeof PrintPreferencesSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type SessionDocument = z.infer<typeof SessionDocumentSchema>;
```

---

## 3. Database Indexes

Firestore requires explicit composite indexes for multi-field queries executed by the kiosk lookup and background purge workers.

### Index 1: Access Code Resolution Index
```json
{
  "collectionGroup": "sessions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "accessCode", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```
*Purpose:* Enables rapid $O(1)$ lookup when the print shop operator submits an access code:
`where('accessCode', '==', enteredCode).where('status', 'in', ['ACTIVE', 'ACCESSED'])`.

### Index 2: Automated TTL Purge Index
```json
{
  "collectionGroup": "sessions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "expiresAt", "order": "ASCENDING" }
  ]
}
```
*Purpose:* Allows the background cron worker to efficiently scan for expired documents:
`where('status', 'in', ['ACTIVE', 'ACCESSED']).where('expiresAt', '<=', now)`.

---

## 4. Cloud Storage Bucket Structure & Lifecycle Configuration

### 4.1 Storage Path Hierarchy
```text
gs://<firebase-project-id>.firebasestorage.app/
└── sessions/
    └── ses_9f81a7b2-3c12-4d8e/
        ├── file_a89f1021_assignment_math.pdf
        ├── file_b312cc04_appendix_figures.png
        └── file_c7891230_cover_page.pdf
```

### 4.2 GCS Object Lifecycle Management Fallback (`lifecycle.json`)
Even if the application backend or cron worker temporarily fails, the Google Cloud Storage bucket natively enforces a hard auto-deletion policy:
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": {
          "age": 1, 
          "matchesPrefix": ["sessions/"]
        }
      }
    ]
  }
}
```
*Note:* A Cloud Storage lifecycle rule is intended to remove orphaned temporary blobs older than 1 day. Verify the deployed rule before relying on it; this eventual cleanup is not zero-retention.
