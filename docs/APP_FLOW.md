# ZDrop - Application Flow & User Journeys

> **Restricted printing update (2026-10-15):** Original downloads and signed read redirects are disabled. Operators receive server-rendered PNG pages; customers do not receive document URLs. PDF/image attachments print together in one temporary frame, then closing or cancelling the dialog triggers automatic deletion. Print-start blocks further retrieval and shortens expiry to two minutes for cleanup recovery. DOCX requires customer-side conversion to PDF; browser printing is limited to 100 selected pages. Screenshots, saving rendered pages and print-to-file cannot be prevented. See README for the current flow; older manual-purge examples below are historical.

> **Document Version:** 1.0.0  
> **Target Actors:** Customer (Mobile Web POV) & Print Shop Operator (Desktop Kiosk POV)

---

## 1. End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Mobile Web)
    actor Operator as Print Shop Operator (Desktop Kiosk)
    participant NextAPI as ZDrop API (/api/sessions)
    participant CloudStore as Firebase Storage
    participant Firestore as Cloud Firestore

    %% Step 1: Upload & Config
    Customer->>NextAPI: 1. Select files (up to 3) + Set Print Preferences
    NextAPI->>Firestore: 2. Create pending session + generate 6-digit OTP
    NextAPI-->>Customer: 3. Return session ID & upload paths
    Customer->>CloudStore: 4. Upload binary blobs directly
    Customer->>NextAPI: 5. Confirm upload completion
    NextAPI->>Firestore: 6. Set status = 'ACTIVE', start 15-min countdown
    Customer->>NextAPI: 7. Poll session status with the session capability token

    %% Step 2: In-Person Code Exchange
    Note over Customer,Operator: Customer dictates "482913" or displays QR across counter
    Operator->>NextAPI: 8. Input 6-digit code on desktop kiosk
    NextAPI->>Firestore: 9. Validate code & update status = 'ACCESSED'
    Customer->>NextAPI: 10. Poll for the updated session status
    NextAPI->>Firestore: Read the authorized session
    Firestore-->>NextAPI: Current session state
    NextAPI-->>Customer: "Operator is reviewing your files"
    NextAPI-->>Operator: 11. Return document list, signed URLs, & pre-set preferences

    %% Step 3: Print & Hard Deletion
    Operator->>Operator: 12. Review settings & trigger native print (window.print)
    Operator->>NextAPI: 13. Click "Print Complete & Delete Now"
    NextAPI->>CloudStore: 14. Purge all files in session directory
    NextAPI->>Firestore: 15. Mark session status = 'DELETED'
    Customer->>NextAPI: 16. Poll for the final session status
    NextAPI->>Firestore: Read the authorized session
    Firestore-->>NextAPI: Session deleted
    NextAPI-->>Customer: "ZDrop removed its stored copy"
```

---

## 2. Customer POV Flow (Mobile Web)

### Step 1: Frictionless Landing & Drop Zone
- **Screen:** `zdrop.app` (Mobile Viewport)
- **Action:** Customer opens the site on a phone or computer and signs in with Google before creating a job. No phone number is required.
- **UI Elements:**
  - High-trust banner: "Drop it. Print it. Done."
  - Dropzone card with upload icon: "Tap to select document (PDF, DOCX, JPG, PNG)".
  - File picker triggers device storage.
- **Validation:** Enforces maximum 3 files, 25MB individual file limit.
- **Card State:** Uploaded files appear as pill chips with file size, detected page count, and removal button (`✕`).

### Step 2: Print Preferences Configuration
- Immediately below the dropzone, an intuitive preferences card expands:
  - **Copies Stepper:** `[-] 1 [+]` (with intuitive tap increment).
  - **Color Mode Segment:** `[Auto]` (active) / `[Black & White]` / `[Color]`. Auto analyzes PDF and image pages in the browser and displays a heuristic mixed-price estimate; DOCX and unavailable analyses are estimated as color.
  - **Sides Segment:** `[Double-Sided (Duplex)]` (active) / `[Single-Sided]`.
  - **Page Selection:** Radio choice: `(•) All Pages` or `( ) Custom Range: [ e.g. 1-12 ]`.
  - **Optional Note:** Input for quick requests: *"Staple corner"*.

### Step 3: Code Generation & Ephemeral Session Creation
- Customer taps primary button: **`Generate Access Code`**.
- File binaries stream directly to Firebase Cloud Storage via secure signed pathways.
- System registers Firestore document and generates a unique 6-digit OTP (e.g., `4 8 2 9 1 3`).

### Step 4: Live Access & Real-Time Privacy Tracker
- The screen transitions smoothly to the **Access Code Display**:
  - Huge, high-contrast monospace code: `4 8 2 9 1 3` with one-tap copy button.
  - Dynamic QR Code containing deep-link `https://zdrop.app/kiosk?code=482913` for quick job-code lookup.
  - **Live Countdown Timer:** `Expires in 14:48` with a pulsing live green heartbeat dot.
  - **Real-Time Step Indicator**:
    - `[✓] Uploaded` (Done)
    - `[•] Waiting for Operator...` (Pulsing blue)
    - `[ ] Printed & Destroyed` (Pending)
  - Emergency Action: **`Revoke Session & Delete Files Now`** (Red outline button, allowing customer to cancel anytime).

### Step 5: Destruction Confirmation
- The moment the operator completes printing, the Firestore listener detects `status: 'DELETED'`.
- The screen displays a celebratory privacy confirmation:
  - *"Done! ZDrop removed its stored copy. The operator or printer may retain other copies."*
  - Shows anonymous receipt: *"Session duration: 1m 42s · 0 bytes retained."*
  - Clean "Done / Print Another Document" CTA.

---

## 3. Print Shop Operator POV Flow (Desktop Kiosk)

### Step 1: Kiosk Station Mode
- **Screen:** `zdrop.app/kiosk` (or `zdrop.app/operator`)
- Designed specifically for shopkeepers running on Windows desktop PCs, chrome kiosks, or touch terminals.
- **UI Elements:**
  - High-visibility header: "ZDrop Kiosk - Fast & Private Document Queue".
  - Large centered OTP input with 6 auto-advancing boxes (`[ ][ ][ ] - [ ][ ][ ]`).
  - Physical keyboard number pad focus active by default (operator doesn't even need a mouse).
  - Optional kiosk camera reads the generated ZDrop job QR only; it does not capture or scan documents.

### Step 2: Code Lookup & Pre-Flight Inspection
- Operator types `482913` or reads the generated ZDrop job QR.
- Within <500ms, the screen transitions to the **Job Inspection Console**:
  - **Summary Banner:**
    - Document Name: `assignment_final.pdf` (12 pages, 2.4 MB)
    - **Copies:** `2 Sets`
    - **Color:** `Black & White`
    - **Sides:** `Double-Sided`
    - **Pages:** `All Pages (1-12)`
  - Embedded PDF preview frame (rendered securely via browser PDF engine).

### Step 3: Print Dispatch
- Operator reviews the pre-filled preferences.
- Operator clicks high-contrast button: **`Print Document (Ctrl+P)`**.
- Native browser print dialog launches automatically with target printer pre-selected.

### Step 4: Instant Destruction & Queue Reset
- Once the printer spools the pages, operator clicks: **`Mark Printed & Purge Files`** (keyboard shortcut `Enter` or `Esc`).
- The backend immediately deletes the files from Cloud Storage and updates Firestore.
- Operator screen shows a brief toast: *"Job completed. Storage cleared."* and immediately resets the 6-digit input box for the next customer in line.

---

## 5. Exception Handling & Edge Cases

| Scenario | System Response | Recovery Action |
| :--- | :--- | :--- |
| **Expired Code (Customer arrives after 15 mins)** | Backend returns `410 Gone`. Operator sees "This code has expired and files were auto-purged." | Customer mobile shows "Session Expired due to 15-minute privacy limit". Customer re-uploads in 2 taps. |
| **Paper Jam / Printer Failure** | Operator needs to reprint before files are deleted. | Operator does *not* click "Mark Printed" until physical sheets exit the tray. Files remain accessible until the 15-minute TTL expires. |
| **Accidental Customer Revocation** | Customer accidentally hits "Revoke". | Confirmation modal: *"Are you sure? All files will be deleted immediately."* |
| **Customer Network Disconnect** | Mobile loses connection after uploading. | The 6-digit code remains active on the server; the customer can still verbally dictate the code displayed on their screen. |
