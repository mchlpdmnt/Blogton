# Blogton

A minimalist blogging platform. Read. Write. Connect.

**Stack:** Vanilla HTML5 · CSS3 · JavaScript (no build step) · Supabase · Netlify

---

## Local Development

```bash
# Requires Netlify CLI (reads env vars for Supabase credentials)
npm install -g netlify-cli
netlify dev
```

> Do **not** use `python -m http.server` — the Netlify function serving credentials won't run.

---

## Project Structure

```
blogton/
├── public/                  # Marketing pages (no auth required)
│   ├── home/               # index.html + home.css + home.js
│   ├── about/              # index.html + about.css + about.js
│   ├── contact/            # index.html + contact.css + contact.js
│   └── privacy/            # index.html + privacy.css + privacy.js
│
├── app/                     # Authenticated app pages
│   ├── feed/               # index.html + feed.css + feed.js
│   ├── blog/               # index.html + blog.css + blog.js
│   ├── profile/            # index.html + profile.css + profile.js
│   ├── settings/           # index.html + settings.css + settings.js
│   ├── user/               # index.html + user.css + user.js
│   └── search/             # index.html + search.css + search.js
│
├── scripts/                 # Shared business logic
│   ├── supabaseClient.js   # Supabase init (fetches creds from Netlify fn)
│   ├── auth.js             # Auth helpers (requireAuth, logIn, signUp…)
│   ├── utils.js            # TobUtils — toast, escapeHtml, formatCount…
│   ├── transitions.js      # Page fade + progress bar
│   ├── userProfile.js      # UserProfile — cached profile store
│   ├── public-shell.js     # Shared sidebar/theme/auth modal for public pages
│   ├── components/
│   │   └── nav.js          # App navbar (Nav.render, ComposeModal integration)
│   └── modules/
│       ├── blogCard.js     # BlogCard.create — canonical card builder
│       ├── composeModal.js # ComposeModal — create/edit post dialog
│       ├── interactions.js # Interactions — likes, stars, counts
│       ├── navSearch.js    # NavSearch — debounced search dropdown
│       └── profileStore.js # ProfileStore — profile CRUD and image upload
│
├── styles/
│   ├── main.css            # Entry point — imports base + components
│   ├── base/
│   │   ├── tokens.css      # Design tokens (CSS custom properties)
│   │   └── reset.css       # CSS reset
│   └── components/         # Shared component styles
│
├── assets/                  # Static assets (favicons, SVG icons)
├── netlify/functions/       # Serverless: config.js serves Supabase creds
├── supabase/                # DB schema + migrations
├── _redirects               # Netlify server-side routing
├── _headers                 # Security headers
└── netlify.toml             # Build config (no build command)
```

---

## Architecture

### Routing
Clean URLs handled entirely by Netlify via `_redirects`. No client-side router.

| URL          | Resolves to                   |
|--------------|-------------------------------|
| `/`          | `public/home/index.html`      |
| `/about`     | `public/about/index.html`     |
| `/feed`      | `app/feed/index.html`         |
| `/user/*`    | `app/user/index.html`         |

### Script Loading Order (App Pages)
```
Supabase CDN UMD  →  supabaseClient.js  →  transitions.js  →  utils.js
→  auth.js  →  userProfile.js  →  [modules]  →  components/nav.js  →  [page].js
```

`supabaseClient.js` dispatches `supabaseReady` on `window` once the client is initialized. All page scripts listen for this event before making any Supabase calls.

### Credentials Security
Supabase credentials are **never in source**. They live in Netlify environment variables and are served at runtime by `netlify/functions/config.js` via `/.netlify/functions/config`.

---

## Deployment

1. Push to `main` — Netlify auto-deploys
2. Set env vars in Netlify dashboard: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
3. Set Supabase Edge Function secrets: `SUPABASE_SERVICE_ROLE_KEY`
4. Apply `supabase/schema.sql` in the Supabase SQL editor
