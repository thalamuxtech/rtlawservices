# Case status relay

The case status tracker (`/case-status-tracker/`) looks cases up through the
USCIS Case Status API. That API authenticates with a client ID and secret,
which must stay on a server, so this Cloudflare Worker sits between the
website and USCIS. It accepts requests only from the firm's website, limits
how often one visitor can ask, and keeps no record of receipt numbers or
results.

## Access from USCIS

1. Register the firm on the [USCIS Developer Portal](https://developer.uscis.gov/get-started/introduction), create a Developer Team App and request the Case Status API.
2. The sandbox keys work at once with USCIS's published test receipt numbers, for example `EAC9999103403`.
3. For real cases, request production access. USCIS requires an organization incorporated in the United States, a public privacy policy, an accessible (Section 508) website and a demonstration of the application.

## Deploy

```sh
cd workers/case-status
npx wrangler login
npx wrangler secret put USCIS_CLIENT_ID
npx wrangler secret put USCIS_CLIENT_SECRET
npx wrangler deploy
```

Wrangler prints the relay's address, for example
`https://rt-case-status.<account>.workers.dev`. Set it as the repository
variable `NEXT_PUBLIC_CASE_STATUS_RELAY` on GitHub (Settings, Secrets and
variables, Actions, Variables) so the next build enables live lookups.

When USCIS grants production access, change `USCIS_TOKEN_URL` and
`USCIS_CASE_URL` in `wrangler.toml` to the production addresses USCIS
supplies, put the production keys in with `wrangler secret put`, and deploy
again.
