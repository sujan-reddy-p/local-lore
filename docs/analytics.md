# Analytics

## Current setup

`components/posthog-provider.tsx` initializes PostHog in the browser when these public build variables exist:

```text
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

They are configured in Vercel Development, Preview, and Production. The project API key is intentionally public; never commit a personal or admin PostHog API key.

## What is collected now

PostHog automatic capture records page views and supported element interactions. Session replay is enabled and masks input fields. PostHog can derive approximate geographic and device properties from requests, including country, region, city when available, browser, operating system, device type, language, referrer, and anonymous session identity.

No Local Lore account identity exists. The application does not call `identify()`, request GPS permission, collect a user name/email, or attach raw map coordinates to custom analytics events.

## Dashboard usage

Create a Trends insight on `$pageview`, select Unique users, then break down by `$geoip_city_name`, `$geoip_subdivision_1_name`, `$geoip_country_name`, `$device_type`, `$os`, `$browser`, or referrer. Geography is approximate and can be affected by VPNs, relays, mobile carriers, and corporate networks.

## Future instrumentation

If a future agent adds custom events, use a small typed helper and meaningful event names such as `mission_opened`, `source_link_clicked`, `filter_selected`, `map_control_used`, `agent_panel_opened`, and `no_results_seen`. Do not add raw free-text search, raw IP, precise map coordinates, or source URLs with tracking query parameters.
