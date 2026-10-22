# RT Law Services website

Public website and staff back office for RT Law Services, an immigration law firm serving clients across the United States.

Live site: <https://rtlawservices.com>

## Stack

- Next.js 16 (App Router) with static export, TypeScript and Tailwind CSS 4
- One Cloudflare Worker that serves the built pages and answers `/api/` requests (`worker/`)
- Cloudflare D1, a SQLite database, for requests, website content and staff accounts (`migrations/`)
- Cloudflare R2 object storage for uploaded images and CVs
- Brevo for email sent from the back office (password links and messages to clients)
- Motion for interface animation, Lucide for icons
- Nager.Date public holiday API, used by the booking calendar to skip U.S. federal holidays

## Local development

```bash
npm install
npm run dev        # pages only, at http://localhost:3000, with the content of the last build
npm run lint
npm run typecheck  # the site and the Worker
npm run build      # writes the static site to out/
npx wrangler dev   # the full site with its back end, at http://localhost:8787, on a local database
```

`npm run build` first runs `scripts/pull-content.mjs`, which reads the published content from the live site (`CONTENT_URL`, by default `https://rtlawservices.com`). Afterwards it runs `scripts/flatten-segments.mjs`, because Next.js writes route segment payloads as nested folders while the client router requests a flat file name.

For a local database, run `npx wrangler d1 migrations apply rtlawservices --local` once.

## How content reaches visitors

1. Staff save a record in the back office at `/admin`. The Worker stores it in D1.
2. Every page reads `/api/content` when it opens, so visitors see the change on their next page load.
3. The save also starts the GitHub workflow, which rebuilds the prerendered pages that search engines read. A scheduled run every ten minutes catches any change the save did not start.

The seed content in `src/content/` is used only when the database cannot be reached during a local build.

### Sample content

Records flagged `demo: true` are fictional. Attorneys and case results flagged demo are never published. Reviews flagged demo are shown with a note that they are illustrative, until real reviews replace them.

### Filing fees

The fee table in `src/content/general.ts` comes from the USCIS fee schedule, Form G-1055, edition dated 1 October 2026. Check the official schedule and update the table whenever USCIS (U.S. Citizenship and Immigration Services) changes its fees.

## Data and security

- Visitors can create consultation requests, messages and free evaluations through `/api/`. They cannot read them back.
- Each 30-minute block of an attorney's calendar is a row with a unique key, so the database refuses a second booking of the same time.
- Public forms are limited to 10 submissions an hour from one connection, and sign-in to 10 attempts every 15 minutes.
- Requests that change data must come from a page on the same site.
- Staff sessions use an HttpOnly cookie. Passwords are stored as PBKDF2 (Password-Based Key Derivation Function 2) hashes with a random salt.
- Staff moved from Firebase keep their password: the first sign-in checks it once with Firebase and then stores it in D1. Remove `FIREBASE_API_KEY` from `wrangler.jsonc` once every staff member has signed in.

### Staff accounts

Owners add and remove staff on the Staff screen of the back office. A new staff member receives an email with a link to set a password. If email is not set up, the owner copies the link from the screen and sends it privately. A link works once, for one hour.

## Secrets

Set with `npx wrangler secret put <NAME>`:

| Name | Purpose |
|---|---|
| `BREVO_API_KEY` | Sends password links and messages to clients through Brevo |
| `GITHUB_TOKEN` | Fine-grained token, limited to Actions on this repository, that starts a rebuild after each save |

## Deployment

Pushing to `main` lints, type-checks, builds, applies any new database migrations and deploys the Worker, through `.github/workflows/deploy.yml`. The workflow needs the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Manual deployment:

```bash
npm run deploy
```
