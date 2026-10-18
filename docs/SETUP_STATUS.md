# ZDrop setup status

Updated 2026-10-18. Only ZDrop was changed. Firebase billing stays disabled.

- Repository baseline was clean on `main`, four commits ahead of `origin/main`; no reset, discard, pull or rebase was performed. The writable GitHub remote is `fork` (Rehan0707/Zdrop).
- Existing Supabase project: **ZDrop**, Nxtstep organization, `wrxqpmsimbimoxgmdpel`, free tier. No duplicate project created.
- Supabase metadata and atomic reservation, lease, activation, rate-limit and one-time print functions were inspected. The missing base schema source has been restored to the repository from the hosted definitions.
- Applied the shop schema and additive durable-pricing migration. Transactional tests passed shop create/lookups, durable rates, wrong-owner rejection and invalid-price rejection. All public ZDrop functions were verified executable by service_role and denied to anon/authenticated.
- Applied private bucket size/type limits and the server-only orphan-upload candidate function. Upload URLs disable upsert. Actual cleanup removes bytes through the provider Storage API.
- The existing write-only CRON_SECRET was replaced with explicit user approval. Its matching active copy is stored in Supabase Vault under `zdrop_cleanup_secret`. An earlier saved value was invalidated and is unused. No unrelated production credentials were downloaded or changed.
- Created a one-minute Supabase cron job named `zdrop-purge-expired` calling the existing protected production cleanup endpoint. Live scheduled HTTP responses were verified as 200 with zero cleanup failures; the daily Vercel cron remains a fallback.
- Local server configuration lives in ignored env files. Privileged keys and station credentials remain server-only. The local test runner excludes all env files and customer data.

Verification completed:

- `npm run test:all`: typecheck, optimized production build, native print dependency traces, full API/format/auth/pricing/security/recovery/expiry suite and managed-station API all passed in a disposable copy. The dependency install audit reported zero known vulnerabilities.
- Added regression coverage for multi-file page ranges, fractional rates, wrong-owner pricing, unverified payment claims, bounded streamed JSON, malformed images and transient session recovery. A truncated PNG that terminated the old native decoder now returns a validation error; image validation/rendering uses pinned Sharp with pixel limits.
- Hosted PDF and PNG upload/confirmation/rendering/revoke/print-finish passed. Duplicate signed uploads could not overwrite confirmed bytes. Actual Storage requests confirmed the synthetic objects were gone after deletion (Supabase encodes object-not-found as statusCode 404 inside HTTP 400).
- Real hosted password authentication was verified with a synthetic account, then that account was removed. SQL tests independently verified durable shop data and owner-only pricing.
- Independent public scheduler test: a print was started and abandoned, and a late upload was recreated in a deleted slot. Both objects disappeared after scheduled cleanup without session polling or manual cleanup calls triggering removal. The check completed in 141 seconds and the following protected cleanup returned zero failures. Earlier cleanup also removed 15 orphaned objects.
- Browser checks verified shop registration, saved rates/UPI settings, PDF page-color analysis, destination selection and customer settings reaching the kiosk with the same quote. A fresh browser print check verified exactly one selected landscape page (400×300 pt), the application hidden in print layout, and automatic DELETED receipt after a simulated dialog close. Physical printer output is not claimed.

Final ready deployment: `dpl_9yQT8cUSG8cQW9hLmqPns74h1X1p`, built from the verified source, at `https://zdropv1-8sdp2tvr5-rehan0707s-projects.vercel.app`. Public URL: https://zdropv1.vercel.app. No paid resources or Firebase billing changes were made. Git records the corresponding code/documentation commit; pushes target the existing writable fork.

Hardware/capability limits: no physical printer is available. CUPS checks use simulated hardware. Browser printing cannot block Save as PDF, screenshots or printer-retained copies. The managed-station pilot is optional and is not an installed locked-down appliance. Real Google sign-in requires the user’s Google UI; tests reject fabricated tokens. UPI is a payment intent plus operator-confirmed receipt, without bank verification. AI/OCR, general conversion and physical scanning are not implemented.
