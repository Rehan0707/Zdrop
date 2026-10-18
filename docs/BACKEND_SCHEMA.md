# ZDrop backend schema

Current source of truth: `src/lib/server/store.ts`, `shops-store.ts` and the ordered SQL migrations. Older Firestore examples in the product design documents describe the original architecture.

All hosted session metadata uses Supabase PostgreSQL. The `zdrop_private` schema contains:

| Table | Purpose |
| --- | --- |
| `sessions` | JSON job data with generated expiry, status, purging and deletion columns |
| `codes` | Atomic six-digit code reservations and reservation deadlines |
| `locks` | Expiring distributed leases; mutations require the matching live lease |
| `rate_limits` | Atomic keyed-hash counters with one-minute reset and eventual housekeeping |
| `shops` | Durable owner/shop profiles, unique shop code, validated pricing and UPI settings |

Browser roles have no access to the private schema or ZDrop RPCs. Service credentials stay in server environment variables. SQL functions use invoker security with an empty search path. Application routes authorize capabilities or shop ownership before calling them.

`zdrop_reserve` chooses server timestamps and reserves a code transactionally. `zdrop_activate` validates a sealed pending upload and renews its 15-minute deadline. `zdrop_save_session` requires a lease and preserves immutable identity/expiry fields. `zdrop_begin_print` is the only operation that can shorten a live job’s deadline; it prevents replay and cannot alter unrelated fields. `zdrop_acquire_lock`, `zdrop_renew_lock` and `zdrop_release_lock` protect concurrent requests. `zdrop_rate_limit` increments atomically. `zdrop_candidates`, `zdrop_housekeeping` and `zdrop_retire` support cleanup and anonymous receipt retirement.

Shop RPCs support create, lookup by ID/code/owner, directory listing and owner-checked rate updates. Server public projections omit owner identifiers, email, name and phone. Job creation captures the canonical shop identity and rate snapshot. The payment state machine uses UNPAID, PENDING_CONFIRMATION (customer report), PAID_ONLINE (operator-recorded UPI receipt) and PAID_COUNTER. No status represents an independently verified bank callback.

Document bytes use `sessions/{sessionId}/{fileId}` in a private `zdrop-documents` Supabase bucket in the current billing-disabled deployment. Signed upload slots allow creation without upsert; confirmations inspect bytes and page counts. Provider upload-token expiry is independent of the job lifetime. `zdrop_orphaned_uploads` returns expired/unreferenced objects for deletion through the Storage API and never deletes storage rows directly. The optional Firebase adapter retains session-scoped upload grants and create-only Storage rules; metadata still uses Supabase. Do not enable paid Firebase Storage without approval.

Purges first block access, then delete bytes, then scrub files, notes and identity/shop details before publishing a terminal receipt. Storage errors keep the job blocked/purging and are retried. Deletion receipts are not proof of physical printer output or of copies outside ZDrop. Owner/operator capabilities remain for receipt access and retire an hour after the later of deletion/expiry.

Run `supabase/tests/*.sql` as transactional checks. They roll back synthetic rows. Run `npm run test:all` for isolated local production checks. See README for the minute Supabase cleanup job and Vault configuration; Vercel’s daily free cron alone does not satisfy short cleanup windows.
