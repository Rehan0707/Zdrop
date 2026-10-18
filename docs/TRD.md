> **Current implementation (2026-10-18):** This document retains the original product/design specification. Use [README](../README.md), [backend schema](BACKEND_SCHEMA.md) and [setup status](SETUP_STATUS.md) for the implemented Supabase persistence, operator-confirmed payments and one-time document-only automatic-purge printing. Historical Firestore, iframe, download and manual “mark printed” examples below are superseded.

# ZDrop - Technical Requirements Document (TRD)

> **Restricted printing update (2026-10-15):** Original downloads and signed read redirects are disabled. Operators receive server-rendered PNG pages; customers do not receive document URLs. PDF/image attachments print together in one temporary frame, then closing or cancelling the dialog triggers automatic deletion. Print-start blocks further retrieval and shortens expiry to two minutes for cleanup recovery. DOCX requires customer-side conversion to PDF; browser printing is limited to 100 selected pages. Screenshots, saving rendered pages and print-to-file cannot be prevented. See README for the current flow; older manual-purge examples below are historical.

> **Document Version:** 1.0.0 (MVP Technical Specification)  
> **Target Framework:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4  
> **Backend & Cloud:** Firebase (Cloud Storage, Cloud Firestore, Firebase Admin SDK)  
> **Deployment:** Vercel (Frontend & Serverless API) + Firebase Cloud Infrastructure  

---

## 1. System Architecture Overview

ZDrop is built as a unified modern fullstack application utilizing Next.js 15 App Router with serverless API route handlers and Firebase backend services.

```mermaid
flowchart TD
    subgraph Client Tier
        CustomerMobile["Customer Device (Mobile or Desktop Web)"]
        OperatorDesktop["Print Shop Kiosk (Desktop Web)"]
    end

    subgraph Application Tier [Next.js 15 App Router]
        RouteHandlers["Serverless API Routes (/api/sessions/*)"]
        NextServerActions["Server Actions / Pre-flight Validation"]
        CronPurgeWorker["Background Purge Cron / Cloud Function"]
    end

    subgraph Cloud Infrastructure [Firebase Platform]
        Firestore["Cloud Firestore (Session Metadata & Real-time Sync)"]
        CloudStorage["Firebase Cloud Storage (Encrypted Ephemeral Blobs)"]
        AdminSDK["Firebase Admin SDK (Privileged Storage Deletions)"]
    end

    CustomerMobile -->|1. Upload Files| CloudStorage
    CustomerMobile -->|2. Create Session & Settings| RouteHandlers
    RouteHandlers -->|3. Store Ephemeral Session| Firestore
    CustomerMobile <-->|4. Poll Status API| RouteHandlers

    OperatorDesktop -->|5. Lookup 6-Digit Code| RouteHandlers
    RouteHandlers -->|6. Verify & Fetch Signed URLs| Firestore
    OperatorDesktop -->|7. View & Print (window.print)| CloudStorage
    OperatorDesktop -->|8. 'Print & Delete Now'| RouteHandlers
    RouteHandlers -->|9. Hard Purge Storage Blobs| CloudStorage
    RouteHandlers -->|10. Mark Session Deleted| Firestore

    CronPurgeWorker -->|Every 2 Mins: Purge Expired TTL| Firestore
    CronPurgeWorker -->|Delete Unclaimed Blobs| CloudStorage
```

---

## 2. Technology Stack & Runtime Specifications

| Layer | Technology | Specification / Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js | 15.x (React 19, TypeScript 5.x) | Fast App Router routing, Server Components for SEO, isolated Client Components for mobile touch events. |
| **Styling & Design System** | Tailwind CSS v4 | `@tailwindcss/postcss`, "General Print Flow" tokens | Modern zero-configuration v4 engine, design tokens matching Stitch MCP guidelines. |
| **Animation & Micro-physics** | Motion | `motion/react` | Smooth state transitions, interactive upload drops, spring physics for code reveal. |
| **Iconography** | Phosphor Icons / Lucide | `@phosphor-icons/react` or `lucide-react` | Standardized stroke width (1.5px), crisp SVG glyphs for file types and print toggles. |
| **Metadata Database** | Cloud Firestore | NoSQL Document Store | Session records are accessed through server-side API routes; the browser polls status with a session capability token. |
| **Blob Storage** | Firebase Cloud Storage | Google Cloud Storage Bucket | Scalable ephemeral object storage, resumable chunked uploads, signed download URLs. |
| **Security & Auth** | Firebase Admin SDK | `firebase-admin` (Node.js runtime) | Zero-trust privileged execution for deletion and secure signed URL generation. |
| **Document Rendering** | PDF.js / Browser iFrame | Native PDF embedder + `window.print()` | Maximum fidelity rendering without server-side compute overhead. |

---

## 3. Cryptographic OTP & Session Generation Engine

To guarantee zero collisions while maintaining human ease of verbal dictation across noisy counters:
- **Format:** 6-digit decimal string (`100000` to `999999`), total $900,000$ possible combinations.
- **Collision Mitigation Algorithm**:
  1. Generate cryptographically secure random integer `code` using `crypto.randomInt(100000, 1000000)`.
  2. Perform atomic Firestore query: `db.collection('sessions').where('accessCode', '==', code).where('status', 'in', ['ACTIVE', 'ACCESSED']).limit(1)`.
  3. If code exists in an active session, retry generation (up to 3 retries). With 15-minute TTL, active concurrency rarely exceeds 1,000 active sessions per service deployment (collision probability $< 0.1\%$).
  4. Reserve the code within a Firestore transaction.

---

## 4. REST API Endpoint Specifications

### 4.1 `POST /api/sessions/create`
Initializes a pending upload session and provides client storage upload paths.
- **Request Body**:
  ```json
  {
    "fileCount": 2,
    "files": [
      { "fileName": "report.pdf", "fileSize": 2450000, "mimeType": "application/pdf" },
      { "fileName": "notes.docx", "fileSize": 820000, "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
    ],
    "preferences": {
      "copies": 2,
      "colorMode": "BW",
      "sides": "DOUBLE",
      "pageRange": "ALL"
    }
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "sessionId": "ses_9f81a7b2-3c12-4d8e",
    "accessCode": "482913",
    "expiresAt": "2026-10-08T10:30:00.000Z",
    "uploadTargets": [
      { "fileId": "file_01", "storagePath": "sessions/ses_9f81a7b2-3c12-4d8e/report.pdf" },
      { "fileId": "file_02", "storagePath": "sessions/ses_9f81a7b2-3c12-4d8e/notes.docx" }
    ]
  }
  ```

### 4.2 `POST /api/sessions/confirm`
Called after client completes uploading binary blobs to Firebase Storage. Activates the 15-minute countdown and marks the session `ACTIVE`.
- **Request Body**:
  ```json
  {
    "sessionId": "ses_9f81a7b2-3c12-4d8e",
    "accessCode": "482913"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "ACTIVE",
    "expiresAt": "2026-10-08T10:30:00.000Z",
    "ttlRemainingSeconds": 900
  }
  ```

### 4.3 `GET /api/sessions/resolve?code=482913`
Invoked by the print shop operator kiosk when entering the 6-digit access code.
- **Behavior**:
  - Validates code status (`ACTIVE` or `ACCESSED`).
  - Generates short-lived Firebase Storage Signed URLs (valid for 10 minutes) for each document.
  - Updates session status in Firestore to `ACCESSED`, triggering real-time UI notification on customer's device.
- **Response (200 OK)**:
  ```json
  {
    "sessionId": "ses_9f81a7b2-3c12-4d8e",
    "status": "ACCESSED",
    "createdAt": "2026-10-08T10:15:00.000Z",
    "expiresAt": "2026-10-08T10:30:00.000Z",
    "preferences": {
      "copies": 2,
      "colorMode": "BW",
      "sides": "DOUBLE",
      "pageRange": "ALL"
    },
    "documents": [
      {
        "fileId": "file_01",
        "fileName": "report.pdf",
        "fileSize": 2450000,
        "mimeType": "application/pdf",
        "signedUrl": "https://storage.googleapis.com/...signed..."
      }
    ]
  }
  ```

### 4.4 `POST /api/sessions/delete`
Executed when operator clicks "Mark Printed & Delete Now" OR when the customer clicks "Revoke Session".
- **Request Body**:
  ```json
  {
    "sessionId": "ses_9f81a7b2-3c12-4d8e",
    "source": "OPERATOR_PRINT" // or "STUDENT_REVOKE" (legacy customer-revoke value)
  }
  ```
- **Behavior**:
  - Admin SDK loops through bucket path `sessions/ses_9f81a7b2-3c12-4d8e/` and executes `bucket.deleteFiles({ prefix })`.
  - Sets Firestore session status to `DELETED`, scrubs file names and URLs, updates `deletedAt: serverTimestamp()`.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Files irrevocably destroyed from storage."
  }
  ```

### 4.5 `POST /api/cron/purge-expired`
Automated garbage collection endpoint executed every 2 minutes via Vercel Cron or GitHub Actions worker.
- **Header**: `Authorization: Bearer <CRON_SECRET>`
- **Logic**:
  - Queries Firestore: `status in ['ACTIVE', 'ACCESSED'] AND expiresAt <= now()`.
  - For each expired session: invokes batch deletion in Cloud Storage, marks record `EXPIRED_AND_DELETED`.

---

## 5. Security & Access Control Model

### 5.1 Storage Security Rules (`storage.rules`)
```cel
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only allow writes to session folder if file <= 25MB and format is allowed
    match /sessions/{sessionId}/{fileName} {
      allow write: if request.resource.size <= 25 * 1024 * 1024
                   && (request.resource.contentType.matches('application/pdf')
                    || request.resource.contentType.matches('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                    || request.resource.contentType.matches('image/jpeg')
                    || request.resource.contentType.matches('image/png'));
      
      // Direct client reading is forbidden; downloads occur only through short-lived server-signed URLs
      allow read: if false;
      allow delete: if false; // Only Firebase Admin SDK has deletion authority
    }
  }
}
```

### 5.2 Firestore Security Rules (`firestore.rules`)
```cel
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      // Anyone can read if they know the document ID (for customer session status updates)
      allow read: if true;
      // All mutations, creations, and deletions are routed strictly via Admin SDK API endpoints
      allow write: if false;
    }
  }
}
```

---

## 6. Document Printing & Preview Strategy

### 6.1 PDF Printing Pipeline
1. Operator desktop loads the signed PDF URL inside an isolated hidden or visible `<iframe>`.
2. For high-speed printing:
   ```javascript
   function triggerDirectPrint(pdfUrl) {
     const iframe = document.createElement('iframe');
     iframe.style.display = 'none';
     iframe.src = pdfUrl;
     iframe.onload = () => {
       iframe.contentWindow.focus();
       iframe.contentWindow.print();
     };
     document.body.appendChild(iframe);
   }
   ```
3. Operators can also click "Open in Full Preview" to examine specific pages before sending to print.

### 6.2 DOCX / Office Format Handling
- In the MVP: DOCX files can be directly downloaded or converted via client-side libraries (like `mammoth.js` for quick HTML preview) or opened in native desktop Word / LibreOffice print dialogs.

---

## 7. Performance & Latency Targets

- File upload time: Resumable chunked upload over 4G/5G mobile network (~2-4 seconds for a 10MB PDF).
- Session creation: ≤ 350ms.
- Code verification and document rendering on operator PC: ≤ 800ms.
- Complete document hard deletion: ≤ 1.2 seconds.
