# Visitor capture

When `DATABASE_URL` or `POSTGRES_URL` is configured, Local Lore records one row per distinct IP address in Neon through the server-only `POST /api/visitor` route. The map and catalog remain static; this is the only visitor database write in the web runtime. The local `.env.local` now enables this endpoint, so an ordinary local browser visit can record the visitor's raw IP and user agent. Avoid page loads during verification unless that write is intended.

## Stored fields

- `ip_address`: the raw address received from Vercel's request headers.
- `first_seen_at` and `last_seen_at`: UTC timestamps.
- `visit_count`: visits recorded by the browser, limited to one request per
  browser session by `sessionStorage`.
- `user_agent`: the request's browser user-agent string.

The `ip_address` primary key makes `COUNT(*)` the distinct-IP total. It does
not represent a guaranteed count of people: shared networks, VPNs, rotating
mobile addresses, and privacy tools affect the result.

## Viewing data in Neon

Open the connected Neon project and run:

```sql
SELECT COUNT(*) AS unique_ip_visitors FROM visitors;

SELECT ip_address, first_seen_at, last_seen_at, visit_count, user_agent
FROM visitors
ORDER BY last_seen_at DESC;
```

Do not expose this table through a public API. Use the Neon console or a
separately authenticated admin tool. Set a retention policy before production
use; raw IP addresses should not be retained indefinitely.
