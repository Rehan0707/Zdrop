-- Run once as database owner after storing the matching production CRON_SECRET
-- in Dashboard > Integrations > Vault, with name zdrop_cleanup_secret.
-- No secret values belong in SQL editor queries or Git.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule('zdrop-purge-expired','* * * * *', $schedule$
 select net.http_post(
   url := 'https://zdropv1.vercel.app/api/cron/purge-expired',
   headers := jsonb_build_object('Content-Type','application/json','Authorization',
     'Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='zdrop_cleanup_secret')),
   body := '{}'::jsonb,
   timeout_milliseconds := 55000
 );
$schedule$);
-- Verify: one named active job, then net._http_response status_code=200 and
-- content includes failed=0. Cron SQL success alone only means the HTTP call queued.
