# RT Law Services website

Public website and staff back office for RT Law Services, an immigration law firm based in Maryland.

Live preview: <https://rtlawservice.web.app>

## Stack

- Next.js 16 (App Router) with static export, TypeScript and Tailwind CSS 4
- Firebase Hosting, Cloud Firestore and Firebase Authentication (project `rtlawservice`)
- Motion for interface animation, Lucide for icons
- Nager.Date public holiday API, used by the booking calendar to skip U.S. federal holidays

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build      # writes the static site to out/
```

`npm run build` runs `scripts/flatten-segments.mjs` afterwards. Next.js writes route segment payloads as nested folders, while the client router requests a flat file name, so the script writes the flat copies a static host needs.

## Content

All page content lives in `src/content/`:

| File | Content |
|---|---|
| `site.ts` | Firm name, phone, email, hours, responsible attorney, site mode |
| `expertise.ts` | The twelve practice pages, including forms, timelines, checklists and questions |
| `proof.ts` | Attorneys, case results and client reviews |
| `general.ts` | Process stages, general questions, glossary, path finder and the USCIS fee table |
| `articles.ts` | Resource guides |

### Sample content

Records in `proof.ts` flagged `demo: true` are fictional and carry a visible "Sample" label. Set `NEXT_PUBLIC_SITE_MODE=production` (see `.env.example`) to hide every demo record. Replace them with real, consented material before the site goes live on the firm's own domain.

### Filing fees

The fee table in `general.ts` comes from the USCIS fee schedule, Form G-1055, edition dated 1 October 2026. Check the official schedule and update the table whenever USCIS changes its fees.

## Data and security

- Visitors can create consultation requests (`bookings`), slot locks (`slots`) and messages (`messages`). They cannot read them back.
- A slot lock can be created once and never overwritten, which prevents double booking.
- Staff read and update requests after signing in at `/admin`. Access requires a document at `staff/{uid}`, which only project owners can create in the Firebase console.
- Rules live in `firestore.rules`. Every other path is denied.

### Adding a staff member

1. In the Firebase console, open Authentication and add a user with the staff member's email.
2. Copy the user's UID.
3. In Firestore, create a document `staff/{UID}` with the fields `role` (for example `attorney` or `intake`) and `name`.
4. The staff member sets a password through "Forgot password?" on `/admin`.

## Deployment

Pushing to `main` builds the site and deploys it to Firebase Hosting through `.github/workflows/deploy.yml`. The workflow needs the repository secret `FIREBASE_SERVICE_ACCOUNT_RTLAWSERVICE`.

Manual deployment:

```bash
npm run build
firebase deploy --only hosting,firestore --project rtlawservice
```
