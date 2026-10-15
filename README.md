# ZDrop

Temporary document handoff for customers using print and copy shops. Customers upload up to three PDF, DOCX, JPG, or PNG files (25 MiB each), choose print preferences, and share a six-digit code or ZDrop job QR. Shop operators open `/kiosk` to retrieve, preview, print, and delete the job.

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
7. Deploy on Vercel with those environment variables. Local storage mode intentionally refuses to run on Vercel. Firebase uploads go directly through `uploadBytesResumable`, so file bytes do not traverse Vercel request bodies. Cloud downloads redirect to signed URLs valid for at most 60 seconds and never beyond the session deadline; deletion removes the backing object.

Official references: [Admin setup](https://firebase.google.com/docs/admin/setup), [custom tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens), [Storage rules](https://firebase.google.com/docs/storage/security).

## Lifecycle and privacy

Code reservation uses cryptographic randomness and an atomic Firestore transaction (exclusive creation on local disk). The upload phase expires after 15 minutes; successful confirmation starts the 15-minute printing deadline and renews the code reservation. Confirmation seals cloud writes, verifies byte counts and formats, and detects PDF page counts. Invalid/password-protected PDFs and invalid Office containers are rejected and purged. PDF page counts are shown when known; DOCX pagination is left to the native Office app.

Deletion first disables cloud uploads, deletes file bytes, then publishes the deletion receipt. Interrupted purges remain blocked and are retried by session requests and the scheduler. Operations use Firestore leases or local locks; stale local locks recover after five minutes. Files become inaccessible at the deadline. Physical cloud cleanup normally follows within the scheduler interval; no website can guarantee deletion at the exact millisecond during infrastructure outages. Local cleanup runs every five seconds while the server is running.

Receipts contain no filenames or notes. Session records, capabilities, and reserved codes are removed an hour after both the deadline and deletion, preserving short-lived status receipts. Cloud rate limiting stores only keyed hashes with expiring counters; configure Firestore TTL for the `rateLimits.deleteAfter` field using the included field override. Only configure `ZDROP_TRUST_PROXY=true` if your reverse proxy overwrites forwarded headers; Vercel's trusted forwarding header is used automatically.

Browser status polling retries after network interruption. The owner capability is kept in sessionStorage for refresh recovery. Documents disable caching and are not embedded in localStorage. A six-digit code grants access to anyone who knows it; share it only with the intended operator.

## Printing

PDFs and images use browser preview/print. DOCX must be opened in an Office app on the operator device. Operators apply copies, color, duplex, and page ranges in the native print dialog. Print each attachment before confirming purge. Confirmation requires a separate dialog; Ctrl/Cmd+P dispatches the selected document. Browser APIs cannot select a printer silently or verify that physical sheets exited the printer.

The optional Auto color estimate analyzes PDF pages and images in the customer's browser using sampled pixels. Original file bytes are not sent to an analysis service. Results are heuristic; unsupported or unanalyzed formats are estimated as color. The kiosk lists suggested color and B&W page ranges, which the operator must review and apply in separate printer-dialog runs.

ZDrop removes its stored files, but cannot prevent operating-system screenshots, print-to-file, printer spool retention, or copies already loaded into browser memory. Operators should clear shop-device and printer artifacts under their shop's retention policy.

## Requirements

The implementation follows `docs/PRD.md`, `docs/TRD.md`, `docs/APP_FLOW.md`, `docs/BACKEND_SCHEMA.md`, and `docs/UI_UX_DESIGN.md`. Customer uploads, structured preferences, code reservation, ZDrop job QR display/reading, real file previews, live status, refresh recovery, revoke/print deletion, expiry cleanup, resumable cloud uploads, rate limits, and lifecycle recovery are implemented. Physical document scanning, ID capture, scan-to-phone, automated payment processing, and hardware print-driver integration are not included in the MVP.

Deployment credentials and actual printer hardware are environment-specific. A live Firebase project and printer need acceptance testing after configuration; local testing does not prove live cloud permissions or physical print fidelity.

## Verification

The final sources passed TypeScript and a production Next.js build in a clean checkout. API tests passed byte upload/download, capability authorization, confirmation, operator resolution, revocation, and deletion. Local edge tests verified real PDF page counts, expiry of ACCESSED sessions with physical file removal, stale-lock recovery, interrupted-purge recovery, invalid PDF rejection, cron authorization, and request throttling. A three-file JPG/PNG/DOCX test also passed upload, response types, native Office download, and deletion of all attachments. The dependency audit reported zero known vulnerabilities.

Playwright browser checks verified mobile upload and print preferences, code and QR display, a separate kiosk tab with PDF preview and the same preferences, explicit deletion confirmation, and the customer's live deletion receipt. Production pages had no browser-console errors, code entry fit 320px without horizontal overflow, and camera permission denial preserved manual entry. Actual camera hardware, physical printers, and a live Firebase project remain environment acceptance checks; no credentials were available, and the local Firebase emulator also requires a Java runtime that is not installed here.

Run `npm run test:api` and `npm run test:formats` against a running local server. `npm run test:edge` is a local-only test: run it from the same directory as the local server because it changes test-session expiry and lock files in `.zdrop-data`. Set `ZDROP_TEST_URL` if using a different port. Edge tests intentionally reach the one-minute lookup rate limit.
