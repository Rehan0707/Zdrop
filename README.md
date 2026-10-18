# ZDrop

Temporary document handoff to print shops: select PDF/JPG/PNG files, choose print settings, share a six-digit code or job QR, then print and automatically delete ZDrop’s copy. Up to three files, 25 MiB each and 100 selected pages per print job.

## Run locally

Use Node.js 20.9 or later and npm:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`ZDROP_STORAGE=local` keeps documents and shop accounts in ignored `.zdrop-data`. Use one server on persistent disk. Google sign-in requires the Firebase public configuration and authorized domain; the underlying capability API also supports anonymous sessions. Never expose `.zdrop-data` as static assets.

```sh
npm run typecheck
npm run test:all
```

`test:all` copies source into a disposable directory, excludes every env file and existing customer data, checks types, builds production, verifies native print assets, runs the full API suite and tests managed mode with simulated hardware. It removes its own temporary data afterward. The individual `test:*` API scripts require a running **local disposable** server, with `ZDROP_TEST_URL` and matching working directory/data location. Edge and station API tests deliberately change test-session expiry; never run them against customer data.

## Hosted setup

Current hosting uses the existing free Vercel project, Supabase PostgreSQL metadata and a private Supabase Storage bucket. Firebase supplies Google sign-in. **Keep Firebase billing disabled.** Firebase Storage remains an optional adapter requiring separate billing approval; no paid Firebase deployment is needed for the current setup. See [verified setup status](docs/SETUP_STATUS.md).

1. Use the intended existing Supabase project. Apply `supabase/migrations/*.sql` in filename order as the database owner. The base metadata migration is included; later migrations add shops, atomic print start, pricing and upload cleanup. These migrations preserve existing records. Check SQL output before continuing. Run the transactional tests in `supabase/tests`; they roll back synthetic records.
2. Create a **private** bucket named `zdrop-documents`. Apply the upload cleanup migration after creating it to enforce the 25 MiB/type restrictions. Do not add client read/list/update/delete policies. Originals are accessible only to the server.
3. Configure server-only `SUPABASE_URL`, either `SUPABASE_SECRET_KEY` or the legacy `SUPABASE_SERVICE_ROLE_KEY`, `ZDROP_STORAGE=supabase`, `RATE_LIMIT_SECRET`, `CRON_SECRET` and `ZDROP_AUTH_SECRET`. Use independent long random secrets. Keep local values in ignored `.env.local`; use hosting environment settings in production. Never prefix privileged keys with `NEXT_PUBLIC_`. Hosted failures must remain failures; shop metadata and passwords never fall back to ephemeral disk.
4. Configure the `NEXT_PUBLIC_FIREBASE_*` values shown in `.env.example`, enable Google in Firebase Auth, and authorize the deployed hostname. Public Firebase configuration is not a privileged credential. A real Google sign-in requires the user to complete Google’s UI; tests only verify token rejection/server verification behavior.
5. Configure frequent cleanup. Vercel Hobby’s daily cron in `vercel.json` is only a fallback. For the existing free Supabase project, save the matching production `CRON_SECRET` in **Integrations → Vault → Secrets**, named `zdrop_cleanup_secret`, then run `supabase/cleanup-schedule.sql`. Do not paste secret values into SQL queries or Git. The one-minute job calls the protected app endpoint using Vault. Verify both `cron.job_run_details` **and** `net._http_response`: queued HTTP work alone does not prove cleanup succeeded. A healthy endpoint returns 200 with `failed: 0`; deletion failures return 503 and are retried.
6. Build and verify an isolated deployment before assigning the public domain. A Git push alone does not prove deployment. Keep service-role functions inaccessible to `anon` and `authenticated`; all table access remains server-only.

Official setup references: [Supabase Cron](https://supabase.com/docs/guides/cron), [Vault scheduling](https://supabase.com/docs/guides/functions/schedule-functions), [Vercel Hobby cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Customer and shop flows

The landing form reads page counts and advisory color estimates locally. It disables submission during analysis to prevent incomplete settings or removed files reappearing. Customer settings include copies, color, duplex, notes and a page range across **all attachments in order**. A range outside the document selects no pages and cannot silently print everything.

The server reserves a six-digit code atomically, issues session-scoped upload slots, checks actual formats/sizes/page counts and activates a 15-minute session. File URLs and customer identity never appear in operator responses. Session capabilities protect status, revoke and print actions; owner recovery uses sessionStorage and survives transient connection failures.

Shop owners can register and sign in, create their counter QR and save rates/UPI settings. Only the actual owner can change a shop’s rates. Public shop listings omit owner identifiers, email, name and phone. The server verifies the selected shop and captures its rates/payment destination for the job; later price edits do not alter an existing quote.

UPI links/QRs pay the **configured shop**, with no placeholder merchant. UPI is offered only with an INR destination. A customer can report a transfer as **awaiting shop confirmation**; only the operator records receipt after checking their bank or taking cash. ZDrop has no bank webhook/payment gateway and does not independently verify money movement. Color estimates and totals remain advisory; confirm the final bill at the counter.

## Printing and deletion

`/api/files` always denies original downloads. Only the operator can request server-rendered, no-store PNG pages. PDF text/original bytes are never delivered to the browser. The print packet contains selected page images only; the app adds no watermark or billing/navigation content. Turn off browser-generated headers/footers in the native dialog.

**Print job & auto-delete** starts one atomic print window, blocks further page retrieval/code resolution and shortens expiry to at most two minutes. Closing the dialog, including Cancel, clears temporary page objects and triggers automatic purge. Cancellation requires re-uploading. Copies/color/duplex must still be set in the browser’s native dialog. No browser event proves physical paper output.

Revocation and expiry also purge. Failed storage deletion leaves access blocked and cleanup pending; it never publishes a false deletion receipt. Local cleanup runs every five seconds while the server runs. Cloud requests enforce expiry immediately, and the minute scheduler retries storage removal. Outages or paused free services can delay physical cleanup. Anonymous status receipts/codes retire an hour after the later of deletion and expiry; personal profile/shop details, files and notes are scrubbed on purge.

Supabase signed upload tokens have a provider-controlled lifetime separate from the session and cannot be individually revoked. Slots disable upsert so confirmed originals cannot be overwritten. Cleanup also finds late uploads to deleted/expired/orphaned slots and removes them through the Storage API; no raw SQL deletion of storage objects is used. This does not promise exact-millisecond erasure or removal of provider backups.

Restricted browser printing supports PDF/JPG/PNG; legacy API DOCX uploads cannot be printed or downloaded and must be converted to PDF on the customer’s device. Rasterization can affect fine text and image quality. A browser cannot block screenshots, developer tools, Save as PDF, OS spooling or copies retained by the printer.

For stronger restrictions, the optional macOS/Linux [managed print station](docs/MANAGED_PRINT_STATION.md) submits in-memory raster jobs to a configured CUPS printer with copies/color/duplex, then purges. Set `ZDROP_PRINT_MODE=managed` only on a dedicated deployment with a configured station and independent `ZDROP_STATION_KEY`. This administrator-run pilot requires OS/printer lockdown; Windows, multi-shop station enrollment and physical-printer completion tracking are not implemented. No printer hardware is available for acceptance testing.

AI/OCR, general document conversion, automated bank verification and physical scanners are future features; the app does not pretend to provide them. See [backend schema](docs/BACKEND_SCHEMA.md) for current persistence and [setup status](docs/SETUP_STATUS.md) for verified cloud checks.
