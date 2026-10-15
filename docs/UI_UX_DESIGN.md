# ZDrop - UI/UX Design Specification

> **Reference design update (2026-10-14):** The supplied print-desk screenshot is the current visual reference: warm paper (#f4f5ef), ink (#20271f), lime (#d8f36a), a full-width header, editorial hero, paper-to-printer illustration and bordered upload workbench. Shared styles are in `src/components/print-desk.css`. Mobile stacks the hero and form; dark mode remains available. Current Google sign-in and shop selection are retained: selecting files is local, and sign-in is required before submitting an upload. The original visual specification below is retained for context.

> **Verification:** Typecheck and a production build passed. Existing API, file-format, lifecycle, and all eight auth/shop tests passed against an isolated local copy; auth used the existing mock provider, not live Google OAuth. Browser checks verified desktop layout, 390px/320px widths without horizontal overflow, light/dark themes, local file selection, the sign-in gate, preferences, and real upload/code generation after local development sign-in. Printer hardware and live Google OAuth were not tested in this UI change.

> **Document Version:** 1.0.0  
> **Aesthetic Foundation:** "General Print Flow" (Generated via Google Stitch MCP)
> **Skill Adherence:** `/design-taste-frontend` Anti-Slop Directives  
> **Target Devices:** Mobile Web (375px - 430px) & Desktop Kiosk (1280px - 1920px)  

---

## 1. Design Read & Core Dials

```text
Reading this as: High-Trust Mobile & Kiosk Document Printing Web Platform for customers and print shop operators, with a clean utilitarian, high-clarity language, leaning toward Tailwind Slate/White surfaces with bold Electric Blue (#2563EB) accents and tactile status chips.
```

### The Three Dials
- **`DESIGN_VARIANCE: 6`** (Structured, disciplined layout; no asymmetric chaos or novelty layouts; focus is operational speed).
- **`MOTION_INTENSITY: 5`** (Restrained, functional motion: smooth file drop spring physics, animated numeric countdown timer, live status heartbeat, tactile active press feedback).
- **`VISUAL_DENSITY: 5`** (Airy and comfortable on mobile touch targets; high-density tabular precision on the desktop operator kiosk).

---

## 2. Color Calibration & Contrast Matrix

The palette strictly complies with the **Anti-Default Discipline** (no AI-purple gradients, no centered dark mesh hero). It uses a single primary accent color locked across the entire application: **Electric Blue (`#2563EB`)**, directly matching the ZDrop logo brand identity.

| Token | Hex Value | Usage / Semantic Role | WCAG Contrast vs Canvas |
| :--- | :--- | :--- | :--- |
| **`canvas-base`** | `#F8FAFC` (Slate 50) | Main background canvas, soft glare-free substrate | N/A |
| **`surface-card`** | `#FFFFFF` (Pure White) | Elevated modules, cards, input wells | 1.05:1 (separated by 1px border) |
| **`border-subtle`** | `#E2E8F0` (Slate 200) | 1px continuous structural borders | 1.3:1 (structural boundary) |
| **`text-primary`** | `#0F172A` (Slate 900) | Primary headlines, OTP code, key values | **16.5:1 (AAA Pass)** |
| **`text-secondary`**| `#334155` (Slate 700) | Body copy, preference labels, subheaders | **10.2:1 (AAA Pass)** |
| **`text-muted`** | `#64748B` (Slate 500) | Metadata, file size, inactive tabs | **4.9:1 (AA Pass)** |
| **`primary-accent`**| `#2563EB` (Electric Blue)| Primary CTAs, active segmented tabs, focus rings | **4.6:1 (AA Large Pass)** |
| **`status-emerald`**| `#10B981` (Emerald) | Privacy badge, active printer, deletion confirmation | Used with `#ECFDF5` background |
| **`status-alert`** | `#EF4444` (Crimson) | Revoke session button, upload errors | Used with `#FEF2F2` background |

---

## 3. Typographic System

Typography pairs **Geist** for crisp geometric headlines, monetary rates, and tabular numbers with **Inter** for reading legibility.

- **Headline Display (Mobile):** Geist SemiBold, 24px (`leading-[30px]`, `tracking-[-0.025em]`).
- **Headline Display (Desktop Kiosk):** Geist Bold, 32px (`leading-[38px]`, `tracking-[-0.03em]`).
- **Access Code OTP Readout:** Geist Mono / JetBrains Mono, 42px on mobile / 56px on kiosk, tabular figures (`font-feature-settings: 'tnum' 1`), letter spacing `0.15em`.
- **Body & Controls:** Inter Regular/Medium, 14px (`leading-[20px]`).
- **Micro-labels & Badges:** Geist SemiBold, 11px uppercase (`tracking-[0.05em]`).

---

## 4. Geometric & Tactile Hierarchy

- **Card Containers:** `rounded-xl` (`12px` / `0.75rem`) with `border border-slate-200` and soft elevation `shadow-[0_1px_3px_rgba(15,23,42,0.04)]`.
- **Buttons & Inputs:** `rounded-lg` (`8px` / `0.5rem`).
- **Pill Badges & Tabs:** `rounded-md` (`6px`) inside containers; full pill (`rounded-full`) exclusively for status heartbeat chips.
- **Tactile Feedback:** On all interactive triggers (`:active`), apply `scale-[0.98]` and `-translate-y-[1px]` to mimic physical tactile hardware.

---

## 5. Screen-by-Screen Layout Specifications

### 5.1 Screen 1: Customer Upload & Print Preferences
- **Viewport:** Mobile (390px × 844px)
- **Header:**
  - Left: Bold **ZDrop** wordmark in Electric Blue (`#2563EB`).
  - Right: Micro pill chip with glowing green dot: `🔒 Temporary Storage`.
- **Module 1: Document Dropzone:**
  - Clean card with dashed border: `border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white`.
  - Icon: Centered cloud upload icon in slate-600.
  - Subtext: *"Tap to upload PDF, DOCX, JPG (Up to 3 files, 25MB each)"*.
  - Uploaded File List: Horizontal card rows showing file thumbnail icon, file name (`assignment_math.pdf`), size (`2.4 MB`), and remove button (`✕`).
- **Module 2: Print Preferences Card:**
  - **Copies Control:** Centered numeric stepper:
    - Button `[-]` | Value `2 Sets` | Button `[+]` (44px touch targets).
  - **Color Mode Segment:** 2-segment pill:
    - `[ Black & White ]` (Solid white active pill with subtle shadow) | `[ Color ]`.
  - **Print Sides Segment:** 2-segment pill:
    - `[ Double-Sided (Duplex) ]` (Active) | `[ Single-Sided ]`.
  - **Page Range:**
    - Option 1: `(•) All Pages (12 pgs)`
    - Option 2: `( ) Custom Range: [ Input: "1-8" ]`
- **Module 3: Primary CTA Bar:**
  - Sticky bottom anchor bar.
  - Button: Solid Electric Blue `#2563EB`, text white, height 48px:
    **`Generate Access Code →`**
  - Sub-caption: *"Files auto-delete in 15 minutes or immediately after printing."*

---

### 5.2 Screen 2: Customer 6-Digit OTP & Live Privacy Tracker
- **Viewport:** Mobile (390px × 844px)
- **Top Bar:** Back button + "Session Active" status chip.
- **Hero Card: The Access Code:**
  - Label: `TELL THE OPERATOR THIS CODE` (11px uppercase mono).
  - Display: Huge 6-digit code with distinct split:
    ```text
    4 8 2   9 1 3
    ```
  - Sub-action: Tap to copy code icon + "Tap to enlarge".
- **Module 2: Counter QR Code:**
  - 140x140px crisp QR code with high error correction.
  - Caption: *"Or show this ZDrop job QR at the counter."*
- **Module 3: Live Privacy & Queue Status Tracker:**
  - Live Countdown Timer: Card displaying `⏱️ Auto-purges in 14:38` with animated progress ring.
  - Real-Time Step Bar:
    1. `[✓] Uploaded & Encrypted` (Green checkmark)
    2. `[●] Waiting for Counter...` (Pulsing blue indicator)
    3. `[○] Printed & Hard-Purged` (Pending)
- **Emergency Action:**
  - Ghost Destructive Button: `Revoke Session & Delete Files Now` (`text-red-600 hover:bg-red-50`).

---

### 5.3 Screen 3: Print Shop Operator Desktop Kiosk
- **Viewport:** Desktop (1440px × 900px)
- **Header:**
  - Left: `ZDrop Kiosk Station` + Shop terminal badge (`Terminal #1 · Shop Location`).
  - Right: System time + Quick stats (`Today's Jobs: 84 · Active: 1`).
- **Left Column (40% width): OTP Input Hub:**
  - Card with prominent instructions: *"Enter 6-Digit Customer Code"*
  - 6 large input boxes with auto-focus and instant jump:
    `[ 4 ] [ 8 ] [ 2 ]   [ 9 ] [ 1 ] [ 3 ]`
  - Integrated on-screen numeric keypad for touch kiosks + physical keyboard numpad support.
  - Camera QR reader: *"Scan ZDrop Job QR"*. It reads only the job code, not documents.
- **Right Column (60% width): Job Review & Print Action Console:**
  - Automatically loads upon 6th digit entered.
  - **Document Inspection Header:**
    - File: `assignment_math.pdf` (12 pages, 2.4 MB)
    - File status: *Pre-flight verified · Ready to spool*.
  - **Customer Instructions Matrix (Large High-Visibility Badges):**
    - Copies: **2 Sets**
    - Color: **Black & White**
    - Sides: **Double-Sided (Duplex)**
    - Pages: **Pages 1 through 12**
  - **Embedded Document Preview:**
    - Clean inline canvas rendering Page 1 with page navigation controls.
  - **Action Hub:**
    - Primary Button: **`Print Document (Ctrl+P)`** (Electric Blue, 52px height, prominent).
    - Secondary Affirmative Button: **`Mark Printed & Purge Files Now`** (Emerald `#10B981`).
    - Emergency Button: **`Cancel / Reject Job`**.

---

## 6. Motion & Micro-Interactions Spec

- **File Drop:** When a file is dropped into the dropzone, container triggers a subtle spring pulse (`scale: [1, 1.02, 1]`, duration 0.25s).
- **OTP Code Reveal:** Staggered digit flip transition on screen load: each digit animates from `y: 12, opacity: 0` to `y: 0, opacity: 1` with a `0.04s` stagger.
- **Heartbeat Indicator:** Active session shows a 6px green LED dot that smoothly pulses `opacity: [1, 0.4, 1]` with a 2-second repeat cycle.
- **Reduced Motion:** If `prefers-reduced-motion` is detected, all transform and scale physics are immediately replaced with simple instant opacity fades.
