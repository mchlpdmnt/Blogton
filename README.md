# Blogton

**Version:** 1.0

A minimalist blogging platform. Read. Write. Connect.

**Stack:** Vanilla HTML5, CSS3, JavaScript, Supabase, Netlify

---

## Local Development

```bash
# Requires Netlify CLI because Supabase config is served by a Netlify Function.
npm install -g netlify-cli
netlify dev
```

Do not use `python -m http.server`; the Netlify function that serves runtime credentials will not run.

---

## Project Structure

Only committed source paths are shown here. Private/local folders such as `.env`, `.netlify/`, `issues/`, and `supabase/` are intentionally ignored.

```text
blogton/
|-- public/                  # Public marketing pages
|   |-- home/                # Landing page
|   |-- about/               # About page
|   |-- contact/             # Contact page
|   `-- privacy/             # Privacy page
|
|-- app/                     # App pages
|   |-- feed/                # Feed page
|   |-- blog/                # Blog detail page
|   |-- profile/             # Current user profile
|   |-- settings/            # Account settings
|   |-- user/                # Public user profile
|   `-- search/              # Search page
|
|-- scripts/                 # Shared JavaScript
|   |-- supabaseClient.js    # Supabase initialization
|   |-- auth.js              # Auth helpers
|   |-- utils.js             # Shared UI/data utilities
|   |-- transitions.js       # Page transitions and top progress bar
|   |-- userProfile.js       # Cached profile store
|   |-- public-shell.js      # Shared public-page shell
|   |-- components/
|   |   `-- nav.js           # App navbar
|   `-- modules/
|       |-- blogCard.js      # Canonical blog card renderer
|       |-- composeModal.js  # Create/edit post modal
|       |-- interactions.js  # Likes, stars, comments, counts
|       |-- navSearch.js     # Navbar search
|       `-- profileStore.js  # Profile CRUD and image upload
|
|-- styles/
|   |-- main.css             # Global stylesheet entry point
|   |-- base/
|   |   |-- tokens.css       # Design tokens
|   |   `-- reset.css        # Reset/base styles
|   `-- components/          # Shared component styles
|
|-- assets/                  # Favicons and static assets
|-- netlify/functions/       # Serverless functions
|   `-- config.js            # Runtime Supabase config endpoint
|-- _redirects               # Netlify routing
|-- _headers                 # Security headers
|-- netlify.toml             # Netlify config
|-- .env.example             # Environment variable template
`-- .gitignore               # Ignored private/local files
```

---

## Architecture

### Routing

Clean URLs are handled by Netlify via `_redirects`. There is no client-side router.

| URL       | Resolves to                |
|-----------|----------------------------|
| `/`       | `public/home/index.html`   |
| `/about`  | `public/about/index.html`  |
| `/feed`   | `app/feed/index.html`      |
| `/user/*` | `app/user/index.html`      |

### Script Loading Order

```text
Supabase CDN UMD -> supabaseClient.js -> transitions.js -> utils.js
-> auth.js -> userProfile.js -> modules -> components/nav.js -> page script
```

`supabaseClient.js` dispatches `supabaseReady` on `window` once the client is initialized. Page scripts wait for that event before making Supabase calls.

---

## Deployment

1. Push `main` to GitHub.
2. Connect the GitHub repo to Netlify.
3. Set Netlify environment variables:
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. Keep database schema, migrations, and Supabase admin assets outside the public repo unless they are intentionally sanitized for release.

---

## Release 1.0

Blogton 1.0 is the first GitHub release of the refactored app.

Included in version 1.0:

- Public pages for home, about, contact, and privacy.
- App pages for feed, blog detail, profiles, search, and settings.
- Shared blog card renderer for consistent post cards across pages.
- Shared compose modal for creating and editing posts.
- Shared interaction handling for likes, favorites, comments, and counts.
- Netlify runtime config function for Supabase browser credentials.
- Clean Netlify routing through `_redirects`.
- Mobile tap highlight removed from interactive surfaces.
- Top page progress bar changed from green to the site accent color.

---

## Devlog 1.0

- Consolidated repeated page logic into shared modules under `scripts/modules/`.
- Moved shared UI styling into `styles/base/` and `styles/components/`.
- Added global reset behavior for mobile tap highlights.
- Updated transition progress styling to use `var(--accent, #111110)`.
- Kept local-only folders out of source control through `.gitignore`.

---

## Security 1.0

- Real environment files are ignored: `.env` and `.env.local`.
- Netlify local state is ignored: `.netlify/`.
- Supabase project files are ignored by default: `supabase/`.
- Issue screenshots and local debugging artifacts are ignored: `issues/`.
- Browser Supabase values are served at runtime by `netlify/functions/config.js`.
- Do not commit service-role keys, production database dumps, or unsanitized migration data.
