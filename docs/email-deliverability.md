# CleanNest email deliverability

CleanNest now queues transactional notification email so SMTP delivery does not
delay booking actions. Call one of these endpoints from a trusted scheduler:

- `GET /api/internal/bookings/reconcile`
- `GET /api/internal/notifications/process`

Send the header `Authorization: Bearer <CRON_SECRET>`. Running every 1–5 minutes
is appropriate. The booking reconciliation endpoint also processes the
notification queue, so one scheduler is enough.

## Required sender configuration

Use a real address on a domain you control:

```env
EMAIL_FROM="CleanNest <notifications@yourdomain.com>"
EMAIL_REPLY_TO="support@yourdomain.com"
EMAIL_MESSAGE_DOMAIN="yourdomain.com"
APP_URL="https://your-real-site.com"
```

Do not use `no-reply@cleannest.com` unless you own and authenticate
`cleannest.com`. The visible From domain must align with the domain authenticated
by the SMTP provider.

At the DNS provider for the sending domain:

1. Publish the exact SPF TXT record supplied by the SMTP provider. A domain
   should have one combined SPF record, not several competing SPF records.
2. Enable DKIM in the SMTP provider and publish its selector TXT/CNAME records.
   Prefer provider-side DKIM. Use the `EMAIL_DKIM_*` variables only when the
   SMTP service does not sign outgoing messages itself.
3. Start DMARC in monitoring mode:

   ```text
   Host: _dmarc.yourdomain.com
   Type: TXT
   Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com; adkim=s; aspf=s
   ```

4. After SPF and DKIM both pass consistently, move DMARC gradually to
   `p=quarantine`, then `p=reject`.
5. Ask the SMTP provider to confirm return-path alignment and reverse DNS for
   its sending IPs.

## Verification

Send a test to Gmail, open **Show original**, and confirm:

- SPF: PASS
- DKIM: PASS
- DMARC: PASS
- The From domain is the expected custom domain

Also test Outlook/Yahoo, avoid sudden high-volume sending, remove invalid
addresses, and monitor bounces and spam complaints. Gmail recommends keeping
user-reported spam below 0.1% and avoiding 0.3% or higher.

Official references:

- Gmail sender guidelines: https://support.google.com/mail/answer/81126
- Yahoo sender best practices: https://senders.yahooinc.com/best-practices/
- Nodemailer DKIM: https://nodemailer.com/dkim
