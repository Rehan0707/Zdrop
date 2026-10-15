# Managed station and printer acceptance

Status: optional software adapter, not a certified secure appliance. No printer is installed on the development Mac. Hardware-free simulations are separate from the acceptance steps below. Do not enable managed mode on a live server before a trusted station is ready.

Verified locally on 2026-10-15: TypeScript, production build, full existing suite plus station simulations, and managed API integration passed in isolated local-storage servers. The actual station client assembled two rendered pages with the requested copies/color/duplex settings against that server, using a fake CUPS submission only; real local source bytes were removed. Browser inspection at 390 px found zero document images, print frames or download links, a disabled browser print action, no horizontal overflow and no console errors. Both render routes' build traces include native canvas and font assets. No cloud credentials, printer settings or billing were changed; no deployment was performed.

## What changes in managed mode

Set `ZDROP_PRINT_MODE=managed` on a dedicated app deployment. `/api/print/page` denies browser pages, and browser print-start/finish are disabled on the server. The kiosk shows job settings and a code, without a document preview. An operator's existing browser capability cannot use the station endpoint. There is no browser downgrade switch.

The separate Node station tool reads a six-digit code, claims the job once, fetches each selected rendered page once using an independent station key, assembles a raster PDF in memory, and sends it through stdin to one administrator-configured CUPS queue. It applies copies, collated sets, color mode and long-edge duplex with standard CUPS/IPP options. It does not open a print dialog, file picker, preview window or original-document download. All attachments use one submission. Printer drivers must be checked for support; unsupported options can be ignored by some drivers.

The station caps transferred rasters at 64 MiB and decoded raster area at 64 million pixels per job to bound memory use; split large jobs. This can be reached before the browser's 100-page limit. Cancellation/failure also ends the job and triggers source deletion, so the station warns before accepting a code.

Claims use existing session locks and metadata (no new database tables). Claims block code re-resolution and expire within two minutes. Each page and the final submission permission can be consumed only once. The server rechecks revocation/expiry before issuing that permission; cancellation after permission or local submission cannot reliably stop already-spooled output. No automatic print retry is performed after an ambiguous response. Lost claims expire rather than making another copy.

Once CUPS accepts the job, the tool requests automatic deletion and retries only that idempotent cleanup. Cancellation and preparation failures also trigger deletion; failed deletion remains blocked and expires through the existing scheduler. A `SPOOLED` receipt means accepted by a queue, never verified paper output. Source bytes and raster buffers are never deliberately written to a station working file. JavaScript/OS memory, swap and crash dumps cannot be guaranteed erased; the OS spooler and printer necessarily receive copies.

## Trusted deployment

Current adapter: macOS/Linux with CUPS (`lp`, `lpstat`, `cancel`). Windows is not implemented and must not silently fall back to browser printing. A future Windows adapter needs equivalent driver, job-lifecycle and policy acceptance.

1. Use a dedicated, administrator-managed print computer. Run the station process under a restricted service identity separate from the browser/operator login. The operator must not have administrator, shell, debugger, environment inspection or spool-directory access to that service. The current tool is an administrator-run interactive pilot; an unattended locked-down service/operator UI is still required before an untrusted operator can use it without an administrator present.
2. Protect the station executable, dependencies, configuration and independent `ZDROP_STATION_KEY` from that operator. Generate a random key of at least 32 characters outside chat/logs, and set the same key on the app server and station. Never reuse a Supabase/Firebase service key. Browser bundles contain none of these values. For this single-station pilot the key grants access to any known code on that dedicated deployment; do not share one key across shops. Multi-shop station registration and key scoping are not implemented.
3. Copy `.env.station.example` to ignored `.env.station.local` on the station. Configure the HTTPS application origin, secret and the exact physical CUPS queue in `ZDROP_PRINTER`. Loopback HTTP is allowed for local testing; remote plain HTTP and HTTP redirects are refused. Do not commit the local file or echo its contents. Node 20.6+ can load it with `node --env-file=.env.station.local scripts/print-station.mjs --check` and, when ready, the same command without `--check` to enter a job code. `npm run station:check` / `station:run` use environment variables already supplied by the service manager.
4. The tool uses the local CUPS scheduler and rejects file/PDF/unsupported device URI schemes. An allowed URI is not proof of a physical printer: the administrator must verify the queue's destination and prevent operator edits, virtual printer installation and print-to-file queues. Check driver duplex and monochrome support before use.
5. Configure OS policy before production: restrict downloads, clipboard, USB, remote access, screen capture and alternate browsers as appropriate; keep the printer/server network private. This project does not install MDM, alter OS permissions or lock down this Mac. An administrator, compromised station or external camera can still copy data.
6. Have an administrator review CUPS `PreserveJobFiles No` and `PreserveJobHistory No`, access to retained-job retrieval/reprint, crash dumps/swap/backups and the printer's own job retention. Defaults may preserve job data. Do not change system-wide settings blindly. `cancel -x QUEUE-JOBID` requests cancellation and deletion of retained CUPS data for that one job; confirm behavior on the installed version. No app receipt verifies spool/printer erasure.
7. Keep the ZDrop expiry scheduler enabled on hosted deployments. Managed mode adds no paid service and makes no changes to Firebase billing or storage configuration.

Reference: [CUPS printing/options](https://www.cups.org/doc/options.html), [CUPS retention settings](https://www.cups.org/doc/man-cupsd.conf.html), [cancellation](https://www.cups.org/doc/man-cancel.html).

## Hardware-free development

`npm run test:station` uses fake printer commands. It checks printer arguments, cancellation, memory-buffer disposal, missing-printer refusal before claiming a job, failure cleanup and no duplicate submission. It never sends output to a real queue. The full `npm test` includes these simulations in browser mode.

`npm run test:station-api` requires a **disposable local** managed-mode server, test data directory shared with that test process, and an ephemeral `ZDROP_STATION_KEY` in its environment. It uses synthetic PDFs, real page rendering and local-byte deletion; it never invokes a printer. Never run lifecycle tests against customer data. `ZDROP_TEST_URL` selects that server. Normal development remains `ZDROP_PRINT_MODE=browser`.

## Physical printer acceptance - all pending

Generate a synthetic two-page fixture with `npm run station:test-sheet` (output is ignored by Git). It prints nothing automatically. Upload it as a new disposable job for each row. Do not use customer documents. Obtain approval to use a shop's printer/paper and record its model, OS, queue, driver version, settings and observed outcome. Keep the original test PDF on the test customer's device for comparison.

| Trial | Requested settings / expected observation | Observed |
| --- | --- | --- |
| Detail and scale | 1 copy, single-sided, color. Two sheets; small text/rules legible, border/corner marks visible, 100 mm ruler measured. Compare original and raster output. | Pending |
| Copies | 2 copies, single-sided. Four sheets, collated FRONT/BACK sets, no duplicated whole job. | Pending |
| Duplex | 2 copies, double-sided long edge. Two sheets, FRONT/BACK upright and correctly paired. Check back-to-front alignment. | Pending |
| Monochrome | B&W. All color swatches gray, grayscale steps distinct. | Pending |
| Custom range | Range 2. Only BACK appears; copies honored. | Pending |
| Cancel before submission | Interrupt preparation with Ctrl+C. No printer job; source deletion confirmed. This ends the one-time job. | Pending |
| Cancel queued output | Use a synthetic held/paused job controlled by the shop administrator. Run the tool with `--cancel QUEUE-JOBID`; only that configured queue's job may be cancelled. Check spool removal and no reprint. Already printed sheets cannot be recalled. | Pending |
| Offline / paper fault | Queue acceptance is not completion. Record what the driver reports, ensure no automatic second submission, and confirm automatic source cleanup. | Pending |
| Browser restrictions | In managed mode, no pages/print dialog; direct page API denied even with a browser operator token. | Pending on station |
| Retention | Inspect source storage, station files, CUPS retained data/history and printer job storage after success/cancel/reboot. Test with the restricted operator identity. | Pending |

Do not describe this station as copy-proof or hardware-tested until its actual OS, driver, printer and operator account have passed acceptance. Software simulations do not establish physical quality, duplex behavior, cancellation, or secure erasure.
