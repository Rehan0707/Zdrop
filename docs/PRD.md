# ZDrop - Product Requirements Document (PRD)

> **Document Version:** 1.0.0 (MVP Specification)  
> **Project Name:** ZDrop ("Drop it. Print it. Done.")  
> **Team:** Team Cook (Web Development)  
> **Members:** Sanadi Rehan Najir (Team Leader), Belwadkar Soham Shankar, Nimbalkar Harsh Abasaheb, Patil Chetan Gajanan  
> **Status:** Approved for Implementation  

---

## 1. Executive Summary & Vision

People use print and copy shops for personal, work, and study documents. Sending files through messaging apps, email, or removable media can leave extra copies on shared devices or expose contact details:
- WhatsApp Web (leaves downloaded files indefinitely in the operator's `Downloads` folder, exposes personal phone numbers to strangers).
- Personal Email attachments (exposes personal email addresses, leaves unmanaged inbox clutter).
- USB drives (require physical handoff and can leave unmanaged copies on shared computers).
- Bluetooth / Quick Share (slow pairing, inconsistent discovery, device clutter).

**ZDrop** solves this with a low-friction, privacy-focused web application. A customer uploads files from a phone or computer and configures print preferences, and receives a temporary 6-digit access code (OTP). The print shop opens the ZDrop kiosk, enters the 6-digit code, and reviews the print job. ZDrop removes its stored copy when the job ends or the session expires; copies made by the operator or printer may remain outside ZDrop.

---

## 2. Problem Statement & Opportunities

| Existing Pain Point | Traditional Method (WhatsApp/USB) | ZDrop Solution |
| :--- | :--- | :--- |
| **Data Privacy & Retention** | Files sit indefinitely on shop PC hard drives; operator has unrestricted offline access. | Strict Ephemeral Storage: dual-trigger destruction (instant purge on print + 15-minute hard TTL). |
| **Personal Info Exposure** | Contact details may be exposed when files are sent through personal chats or email. | The temporary print job does not display the customer's Google profile to the shop operator. |
| **Communication Errors** | "Print pages 3 to 12, double sided, 2 copies, in B&W" verbally miscommunicated amidst noise. | Structured Print Preferences configured directly on customer's phone and displayed on operator screen. |
| **Queue Latency** | Operators spend minutes searching WhatsApp chats, downloading, and hunting for files. | Instant OTP access: typing 6 digits immediately loads the exact print job with pre-configured settings. |
| **Device Friction** | Customers may arrive without a computer, cable, or removable drive. | Web-based upload and job lookup work in modern mobile and desktop browsers without an app install. |

---

## 3. User Personas & Use Cases

### 3.1 Customer (Mobile Web)
- **Context:** A customer needs to print a work document, personal form, report, or other file at a participating print or copy shop. They may be using a phone or computer.
- **Goals:** Upload files, choose print settings, share a temporary code or ZDrop QR, and have ZDrop remove its stored copy when the job ends or expires.
- **Frustrations:** Does not want to share files through persistent chats or leave contact details with an unfamiliar shop.

### 3.2 Print or Copy Shop Operator (Kiosk Web)
- **Context:** An operator handles print jobs at a neighborhood shop, workplace print room, or another participating counter.
- **Goals:** Enter a temporary code, review files and print settings, print the job, and clear its ZDrop copy promptly.
- **Frustrations:** Files and instructions can be difficult to track when they arrive through chats, email, or removable media.

---

## 4. MVP Scope & Boundaries

### 4.1 In Scope (Phase 1 MVP)
1. **Customer Upload and Print Setup**:
   - Customers sign in with Google before creating a print job; no phone number is required.
   - Batch upload of up to 3 files per session (PDF, DOCX, JPG/PNG), max 25MB per file.
   - Interactive Print Preferences configuration (copies, B&W vs. Color, Single vs. Double-sided, page range).
2. **Access Code Engine**:
   - Unique, collision-resistant 6-digit numeric access OTP (e.g., `482913`).
   - ZDrop job QR alternative; the kiosk camera reads this code only.
3. **Session Lifecycle & Privacy Destruction (Dual-Trigger)**:
   - **Trigger A (Instant Purge):** The operator completes a job or the customer revokes the session -> immediate deletion of ZDrop file contents and session details.
   - **Trigger B (Automated 15-Minute TTL):** Server-side TTL expiration cron / Cloud Function wipes all unprinted files after 15 minutes.
   - Live status updates on the customer's device (`Uploaded` -> `Accessed by Operator` -> `Printed & Destroyed`).
4. **Operator Kiosk Web Portal**:
   - Simple desktop web view (`/operator` or `/kiosk`).
   - Large numeric code entry pad.
   - Instant document inspection, preference review card, PDF viewer/preview, and native Print trigger (`window.print()`).
5. **Responsive Modern UI**:
   - General print-flow design system (Slate-50 background, Electric Blue `#2563EB` accents, Geist/Inter typography).

### 4.2 Out of Scope (Post-MVP Roadmap)
- Integrated online payments (UPI / Razorpay) — deferred to v2.
- Advanced shop-owner permissions, staff roles, and multi-location management.
- Native mobile application (PWA/web first).
- Physical document or ID scanners, scan-to-phone, OCR/PII redaction, and other scanner integrations. The QR reader is only for ZDrop job codes.
- Complex cloud print-driver hardware integrations (MVP uses the browser-native print pipeline).

---

## 5. Functional Requirements (FR)

### FR-1: File Intake & Validation
- **FR-1.1:** System shall accept files of types `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx), `image/jpeg`, and `image/png`.
- **FR-1.2:** System shall reject files larger than 25MB individually, or sessions exceeding 3 files.
- **FR-1.3:** System shall sanitize file names and generate cryptographically secure UUID storage keys to prevent path traversal or overwrites.

### FR-2: Print Preferences Specification
- **FR-2.1:** User can specify number of copies (integer between 1 and 99, default 1).
- **FR-2.2:** User can choose Color Mode: `Auto` (default), `Black & White`, or `Color`.
- **FR-2.2a:** Auto mode analyzes PDF and image pages locally, estimates mixed color and B&W pricing, and shows suggested per-file page ranges to the operator. Results are heuristic and require operator review; unsupported formats are estimated as color.
- **FR-2.3:** User can toggle Print Sides: `Double-Sided (Duplex)` (default) vs. `Single-Sided`.
- **FR-2.4:** User can define Page Selection: `All Pages` (default) or custom page range string (e.g., `1-5, 8, 11-14`).

### FR-3: Session & Access Code Generation
- **FR-3.1:** Upon upload confirmation, the system creates an ephemeral session document with a unique 6-digit code.
- **FR-3.2:** The 6-digit code shall not collide with any active, unexpired session.
- **FR-3.3:** The system generates a QR code representing the direct operator URL (`https://zdrop.app/kiosk?code=482913`).

### FR-4: Real-Time Synchronization & Telemetry
- **FR-4.1:** The customer client receives session status updates for the active job.
- **FR-4.2:** Session states: `ACTIVE` -> `ACCESSED` -> `PRINTED` / `EXPIRED` / `REVOKED`.
- **FR-4.3:** Live countdown timer accurately ticks down from 900 seconds (15 minutes).

### FR-5: Operator Kiosk Operations
- **FR-5.1:** Operator inputs 6-digit code via keyboard or on-screen keypad.
- **FR-5.2:** If code is invalid or expired, clear error message displays ("Code invalid or expired").
- **FR-5.3:** Valid code transitions session to `ACCESSED`, rendering the document viewer and print configuration panel.
- **FR-5.4:** Operator clicks "Print Document": triggers browser print dialog.
- **FR-5.5:** Operator clicks "Mark Printed & Delete Now": immediately invokes deletion endpoint.

### FR-6: Privacy & Auto-Purge Engine
- **FR-6.1:** Deletion API irrevocably removes all uploaded blobs from cloud object storage.
- **FR-6.2:** Deletion API marks Firestore session as `DELETED` and scrubs document metadata, leaving only anonymous telemetry (time to print, file count).
- **FR-6.3:** Scheduled background worker (cron / Firebase Function) executes every 2 minutes to query and purge sessions where `expiresAt <= now` and `status != DELETED`.

---

## 6. Non-Functional Requirements (NFR)

- **Performance**:
  - Code generation within ≤ 1.5 seconds of file upload completion.
  - Operator code resolution and document display within ≤ 1.0 second.
- **Reliability & Availability**:
  - Target 99.9% uptime during the configured service's operating hours.
- **Security & Privacy**:
  - Transport Layer Security (TLS 1.3) enforced on all traffic.
  - Do not log document contents. ZDrop removes its stored copies when a job is completed or expires; copies saved outside ZDrop by an operator or printer are outside its control.
  - Storage bucket permissions restricted: public read disabled; access gated by time-limited signed URLs or server proxy.
- **Usability & Accessibility**:
  - WCAG 2.1 AA compliant contrast ratios across all buttons and inputs.
  - Zero-step onboarding: first interaction to code generation requires less than 4 taps on mobile.

---

## 7. Success Metrics & KPIs for MVP

1. **Session Completion Time**: Average time from customer arrival to print dispatch < 60 seconds.
2. **Privacy Enforcement Rate**: 100% of files deleted within 15 minutes or immediately upon print completion.
3. **Misprint Reduction**: Zero misprints due to verbal misunderstanding of print preferences.
4. **Customer Satisfaction Score (CSAT)**: ≥ 90% positive ratings in customer surveys.
