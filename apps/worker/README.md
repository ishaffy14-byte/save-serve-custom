# Save&Serve Worker

Background worker scaffold for the Base44 migration.

Planned responsibilities:

- Outbox event processing.
- Email and push delivery.
- Stripe webhook follow-up and reconciliation.
- Listing expiration and pickup reminders.
- Compliance PDF/report generation.

Run locally after building:

```bash
npm run worker:build
npm run worker:start
```

Environment variables are listed in `../../env.example`.
