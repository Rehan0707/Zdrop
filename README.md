# ZDrop

Temporary document handoff for customers using print and copy shops. Customers upload up to three PDF, JPG, or PNG files (25 MiB each), choose print preferences, and share a six-digit code or ZDrop job QR. Shop operators open `/kiosk` to retrieve, preview, print, and delete the job.

## Product scope

ZDrop serves customers who need to print personal, work, or study documents at a participating print or copy shop. The kiosk camera reads ZDrop job QR codes only. Physical document scanners, ID-card capture, scan-to-phone, and other scanner integrations are out of scope. The existing on-device PDF and image page-color estimate is a software check, not document capture.

## Run locally

Node.js 20 or later:

```sh
npm ci
cp .env.example .env.local
npm run dev -- --hostname 0.0.0.0
```

Open http://localhost:3000. Phones on the same network can use the computer's LAN address and port 3000. The kiosk camera QR reader requires HTTPS or localhost; manual code entry works over LAN HTTP. Local mode stores real document bytes in `.zdrop-data`, outside public assets and excluded from Git. Use persistent disk and one server instance. Local development uses a shared rate-limit bucket unless a trusted reverse proxy is configured.

```sh
npm run typecheck
npm run build
npm run start
ZDROP_TEST_URL=http://localhost:3000 node scripts/smoke-test.mjs
```

## Firebase and Vercel setup

1. Create a Firebase project with the **default** Firestore database, Firebase Authentication, and a Cloud Storage bucket. Enable the required billing plan for Storage and scheduled deployment.
2. Create a server service account with Firestore, Storage, and Firebase Auth administration permissions. Set `ZDROP_STORAGE=firebase`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`, and `FIREBASE_WEB_API_KEY`. Private keys may contain escaped newlines. Alternatively use Application Default Credentials with token-signing permissions. The web API key identifies the project and is safe to send to the browser; the private key is server-only.
3. Configure Firebase Authentication's authorized domains for the deployed hostname. Customers sign in with Google before creating a job; the print shop receives the temporary job details, not the customer's Google profile. File uploads use a separate session-scoped custom identity held in browser memory and cleared during cleanup.
4. Deploy the rules and indexes using Firebase CLI: `firebase deploy --only firestore:rules,firestore:indexes,storage`. When prompted, enable Storage rules' access to Firestore. Storage allows only creation of reserved files with exact size/type, authenticated as the session uploader, before sealing, revocation, or expiry. Public reads and client updates/deletes are denied. Firestore client access is denied; status is fetched through capability-protected API polling.
5. Set independent long random `CRON_SECRET` and `RATE_LIMIT_SECRET` values. Vercel configuration schedules `/api/cron/purge-expired` every minute and supplies `CRON_SECRET` as a bearer token. Use a Vercel plan that supports per-minute schedules, or an external scheduler with that authorization header. GET and POST are supported.
6. Apply the fallback lifecycle: `gcloud storage buckets update gs://YOUR_BUCKET --lifecycle-file=storage.lifecycle.json`. This deletes orphaned session objects older than one day; it supplements the minute scheduler. Disable object soft delete/versioning/retention if your deployment requires file contents to be physically removed rather than recoverable by administrators: `gcloud storage buckets update gs://YOUR_BUCKET --clear-soft-delete --no-versioning`. Review existing retention policies in the cloud console before launch.
7. Deploy on Vercel with those environment variables. Local storage mode intentionally refuses to run on Vercel. Firebase uploads go directly through `uploadBytesResumable`, so file bytes do not traverse Vercel request bodies. Kiosk page rendering reads document bytes on the server; original document downloads and signed read redirects are disabled.

Official references: [Admin setup](https://firebase.google.com/docs/admin/setup), [custom tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens), [Storage rules](https://firebase.google.com/docs/storage/security).

## Lifecycle and privacy

Code reservation uses cryptographic randomness and an atomic Firestore transaction (exclusive creation on local disk). The upload phase expires after 15 minutes; successful confirmation starts the 15-minute printing deadline and renews the code reservation. Confirmation seals cloud writes, verifies byte counts and formats, and detects PDF page counts. Invalid/password-protected PDFs and invalid Office containers are rejected and purged. PDF page counts are shown when known; Customers must convert DOCX to PDF before restricted printing.

Deletion first disables cloud uploads, deletes file bytes, then publishes the deletion receipt. Interrupted purges remain blocked and are retried by session requests and the scheduler. Operations use Firestore leases or local locks; stale local locks recover after five minutes. Files become inaccessible at the deadline. Physical cloud cleanup normally follows within the scheduler interval; no website can guarantee deletion at the exact millisecond during infrastructure outages. Local cleanup runs every five seconds while the server is running.

Receipts contain no filenames or notes. Session records, capabilities, and reserved codes are removed an hour after both the deadline and deletion, preserving short-lived status receipts. Cloud rate limiting stores only keyed hashes with expiring counters; configure Firestore TTL for the `rateLimits.deleteAfter` field using the included field override. Only configure `ZDROP_TRUST_PROXY=true` if your reverse proxy overwrites forwarded headers; Vercel's trusted forwarding header is used automatically.

Browser status polling retries after network interruption. The owner capability is kept in sessionStorage for refresh recovery. Documents disable caching and are not embedded in localStorage. A six-digit code grants access to anyone who knows it; share it only with the intended operator.

## Restricted browser printing

Original PDF, image and Office downloads are disabled. Customer/owner responses contain no file URLs. The legacy `/api/files` route always denies downloads; it no longer redirects to signed cloud URLs. Only an operator capability can call `POST /api/print/page`, which renders a PDF page or image on the server and returns a no-store PNG. This keeps original PDF/Office bytes and their selectable text out of the kiosk. Keep storage buckets private; do not publish object URLs or configure public read access.

The kiosk prepares all selected pages from every PDF/image attachment in a temporary print frame. One **Print job & auto-delete** action opens the native printer dialog after an explicit warning. Closing the dialog—including cancellation—clears the browser's temporary preview/print objects and calls an idempotent server purge. There is no manual “mark printed” step. Copies, color and duplex still need to be applied in the native dialog; the selected page range is already included in the prepared job. The browser reports an attempt ending, not successful physical printing.

Starting the print window is atomic: further page requests and repeated code resolution are blocked, and the existing session deadline is shortened to at most two minutes. If the tab disappears or a browser fails to emit `afterprint`, normal local cleanup or the deployed scheduler purges the files at that deadline. Keep the scheduler configured in cloud deployments; physical deletion cannot be guaranteed while infrastructure is unavailable. Failed storage deletion keeps the session blocked/purging and is retried, rather than returning a successful deletion receipt.

Restricted printing supports PDF/JPG/PNG and at most 100 selected pages per job. Rasterization can affect fine print fidelity; verify the actual printer before use. Legacy/API DOCX uploads remain valid, but the upload form rejects new DOCX selections and they cannot be downloaded or printed here: the customer must convert them to PDF on their own device and upload again. No external conversion service or paid resource is configured.

This is a browser restriction, not DRM. Rendered pages can still be captured through screenshots, developer tools, operating-system print-to-file, or printer spooling. The website cannot prevent saving all copies, silently choose a physical printer, or verify paper output. Those requirements need a trusted managed print agent, OS/printer policies, and printer completion integration. ZDrop cannot restrict copies of originals already held on the customer's own device.

The optional Auto color estimate is advisory. Review customer settings and page-color estimates before starting the one-time print job.

## Optional managed print station

For a dedicated trusted station, `ZDROP_PRINT_MODE=managed` blocks browser document pages and browser printing on the server. A separate macOS/Linux CUPS tool claims a code, prepares raster pages in memory and submits directly to one configured printer with copies/color/duplex settings, then automatically purges the ZDrop source. It does not open a Save as PDF dialog. The default remains browser mode; no printer or OS policy is configured automatically. This is an administrator-run pilot, not an installed locked-down appliance. Windows and multi-shop station registration are not implemented. See [station setup and physical acceptance](docs/MANAGED_PRINT_STATION.md) before enabling it.

Run `npm run test:station` for hardware-free tests and `npm run station:test-sheet` to create a synthetic printer test PDF. No physical printer results are claimed.

## Requirements

The implementation follows `docs/PRD.md`, `docs/TRD.md`, `docs/APP_FLOW.md`, `docs/BACKEND_SCHEMA.md`, and `docs/UI_UX_DESIGN.md`. Customer uploads, structured preferences, code reservation, ZDrop job QR display/reading, real file previews, live status, refresh recovery, revoke/print deletion, expiry cleanup, resumable cloud uploads, rate limits, and lifecycle recovery are implemented. Physical document scanning, ID capture, scan-to-phone, automated payment processing, and hardware print-driver integration are not included in the MVP.

Deployment credentials and actual printer hardware are environment-specific. A live Firebase project and printer need acceptance testing after configuration; local testing does not prove live cloud permissions or physical print fidelity.

## Verification

Earlier sources passed TypeScript and a production Next.js build in a clean checkout. API tests passed byte upload/download, capability authorization, confirmation, operator resolution, revocation, and deletion. Local edge tests verified real PDF page counts, expiry of ACCESSED sessions with physical file removal, stale-lock recovery, interrupted-purge recovery, invalid PDF rejection, cron authorization, and request throttling. A three-file JPG/PNG/DOCX test also passed upload, response types, native Office download, and deletion of all attachments. The dependency audit reported zero known vulnerabilities.

Playwright browser checks verified mobile upload and print preferences, code and QR display, a separate kiosk tab with PDF preview and the same preferences, explicit deletion confirmation, and the customer's live deletion receipt. Production pages had no browser-console errors, code entry fit 320px without horizontal overflow, and camera permission denial preserved manual entry. Actual camera hardware, physical printers, and a live Firebase project remain environment acceptance checks; no credentials were available, and the local Firebase emulator also requires a Java runtime that is not installed here.

Run `npm run test:api` and `npm run test:formats` against a running local server. `npm run test:edge` is a local-only test: run it from the same directory as the local server because it changes test-session expiry and lock files in `.zdrop-data`. Set `ZDROP_TEST_URL` if using a different port. Edge tests intentionally reach the one-minute lookup rate limit.

Run `npm run test:print` against the local server from the same working directory. It verifies rendered PDF text, operator-only access, blocked originals, atomic one-time print start, idempotent cleanup, expired print attempts, DOCX rejection, and storage deletion failure/recovery. It uses disposable local test data and fake storage credentials for the isolated cloud failure test. Browser checks can simulate a closed/cancelled print dialog; actual printer completion remains outside the browser contract.
