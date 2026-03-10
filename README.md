# SkyReach Visuals

Full-stack website for a drone videography company based in Bournemouth, UK. Includes public marketing pages, user authentication, Stripe-powered booking and payment, email notifications, and a customer dashboard.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT with httpOnly cookies
- **Payments**: Stripe Checkout
- **Email**: Nodemailer (SMTP)
- **Deployment**: Docker + Docker Compose

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Stripe account (test keys)
- SMTP credentials (optional for dev — emails log to console without them)

## Media assets (images and videos)

Videos and some large assets are **gitignored**. For the site to show hero video, gallery, and logos, place the required files in `client/public/` before building (or host videos externally and point the app at those URLs). See **[client/public/README.md](client/public/README.md)** for the full list of required files and optional CDN hosting.

### Why images don't load on the server (but work locally)

The repo does **not** include the image files in `client/public/` (only `client/public/README.md` is committed). When you build on the server with `git pull` then `docker compose up --build`, the client image is built from the clone, so **no images are in the built app** and they 404. Locally you have those files in `client/public/`, so they work.

**Fix (choose one):**

1. **Commit the images** so the server gets them on pull: copy the required files (see [client/public/README.md](client/public/README.md)) into `client/public/` with the exact names the app expects, then `git add client/public/*.png client/public/*.jpg` (and any videos you want in the repo), commit, and push. After that, `git pull` and rebuild on the server will include them.

2. **Copy assets on the server before each build:** On the server, after `git pull`, copy your image (and optionally video) files into `client/public/`, then run `docker compose build client && docker compose up -d` (or your usual up command). For example, if you keep a backup of assets in `~/skyreach-assets/`:
   ```bash
   cp ~/skyreach-assets/*.png ~/skyreach-assets/*.jpg client/public/ 2>/dev/null || true
   mkdir -p client/public/videos && cp ~/skyreach-assets/*.mp4 client/public/videos/ 2>/dev/null || true
   docker compose build client && docker compose up -d
   ```

## Quick Start with Docker

```bash
# Clone and enter the project
cd skyreach-visuals

# Set your Stripe keys (optional — the app runs without them but payments won't work)
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...

# Start everything
docker compose up --build

# Run the database migration (first time only; optional — the server entrypoint runs `prisma db push` so tables are created on start)
docker compose exec server npx prisma migrate deploy
```

The site will be available at `http://localhost:3000` (or port 3003 if you use the default client port mapping).

**If you get 502 on /api (e.g. login or register):** The API is served by the `server` container. Check that it is running and see startup errors with:
```bash
docker compose ps
docker compose logs server --tail 80
```
Fix any DB connection or startup errors shown there.

**Email verification:** New users must verify their email via the link sent to them before they can log in. Ensure `SMTP_*` and `EMAIL_FROM` are set (e.g. IONOS) so verification emails are sent. After the first deploy that adds verification, existing users will have `emailVerified = false`; to allow them to log in, run once:
```bash
docker compose exec db psql -U skyreach -d skyreach -c "UPDATE \"User\" SET \"emailVerified\" = true;"
```

**Admin live mailbox (Admin → Email):** View your IONOS inbox and sent folder and send emails from the app. Defaults use `imap.ionos.co.uk:993` and the same credentials as SMTP; set `IMAP_HOST`/`IMAP_PORT`/`IMAP_USER`/`IMAP_PASS` if needed.

### "Not Secure" in Safari (or Chrome) when opening links from emails

The app and Docker stack serve **HTTP** internally. The public site (e.g. `https://www.skyreachvisuals.co.uk`) must be fronted by something that provides **HTTPS** (SSL/TLS). If Safari shows "Not Secure", the page is being loaded over HTTP. Fix it at the **hosting** layer:

- **Option A — Reverse proxy on the Pi:** Run Caddy or Nginx on the host (not in Docker) with a certificate for `www.skyreachvisuals.co.uk` (e.g. Let's Encrypt). Point it at the client container (e.g. port 3003). Ensure the proxy listens on 443 and redirects HTTP → HTTPS.
- **Option B — Cloudflare (or similar):** Put the site behind Cloudflare with "SSL/TLS" set to Full or Full (strict). Cloudflare terminates HTTPS; your Pi can still serve HTTP to Cloudflare if it’s the only client.

Also ensure `CLIENT_URL` in production is `https://www.skyreachvisuals.co.uk` so links in emails use HTTPS (see `deploy/env.production`).

### Emails going to Junk (e.g. Apple Mail)

Apple Mail and others often treat mail as junk when the **sending domain** isn’t authenticated. Configure these for `skyreachvisuals.co.uk` (where your `EMAIL_FROM` lives):

1. **SPF** — DNS TXT record for the domain authorising your mail server. For IONOS, add the SPF record IONOS provides (or an include like `include:ionos.co.uk` / their current value). This says “IONOS is allowed to send for skyreachvisuals.co.uk”.
2. **DKIM** — Sign outbound mail with a key stored in DNS. IONOS usually offers DKIM in the control panel (domain or email settings). Turn it on and add the CNAME/TXT records they give you.
3. **DMARC** — DNS TXT record `_dmarc.skyreachvisuals.co.uk` with a policy (e.g. `v=DMARC1; p=none;` to start, then `p=quarantine` or `p=reject` once you’re happy). This tells receivers what to do with mail that fails SPF/DKIM.

Use the same From address everywhere (e.g. `support@skyreachvisuals.co.uk`) and avoid spammy wording in subject/body. After SPF/DKIM/DMARC are correct, re-send a verification or test email; it may take a little while for Apple’s filters to trust the domain.

## Development Setup (without Docker)

You'll need a running PostgreSQL instance.

### 1. Set up the database

```bash
# Create the database
createdb skyreach

# Or via psql
psql -c "CREATE DATABASE skyreach;"
```

### 2. Configure environment

```bash
# Copy the example env file and fill in your values
cp .env.example server/.env
```

Edit `server/.env` with your database URL and Stripe keys.

### 3. Install dependencies

```bash
# Client
cd client && npm install

# Server
cd ../server && npm install
```

### 4. Run database migrations

```bash
cd server
npx prisma migrate dev --name init
```

### 5. Start dev servers

In two separate terminals:

```bash
# Terminal 1 — Server (port 5000)
cd server && npm run dev

# Terminal 2 — Client (port 5173)
cd client && npm run dev
```

The client proxies `/api` requests to `localhost:5000` via Vite config.

Open `http://localhost:5173` in your browser.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `JWT_EXPIRES_IN` | Token expiry (default `3650d` ~10 years; stay logged in until logout) | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For payments |
| `CLIENT_URL` | Frontend URL (for CORS) | Yes |
| `STRIPE_SUCCESS_URL` | Redirect after successful payment | For payments |
| `STRIPE_CANCEL_URL` | Redirect after cancelled payment | For payments |
| `SMTP_HOST` | SMTP server hostname (e.g. `smtp.ionos.co.uk`) | For emails |
| `SMTP_PORT` | SMTP port (587 or 465) | For emails |
| `SMTP_USER` | SMTP username (full email) | For emails |
| `SMTP_PASS` | SMTP password | For emails |
| `EMAIL_FROM` | Sender email address | For emails |
| `IMAP_HOST` | IMAP server (default `imap.ionos.co.uk`) | For admin live mailbox |
| `IMAP_PORT` | IMAP port (default 993) | For admin live mailbox |
| `IMAP_USER` | IMAP username (defaults to `SMTP_USER`) | For admin live mailbox |
| `IMAP_PASS` | IMAP password (defaults to `SMTP_PASS`) | For admin live mailbox |
| `PORT` | Server port (default: 5000) | No |

**Live payments:** To receive real payouts to your bank account, use Stripe **live** keys in production: set `STRIPE_SECRET_KEY` to your live secret (`sk_live_...`) and `STRIPE_WEBHOOK_SECRET` to the signing secret for your live webhook endpoint. Configure the webhook in the Stripe Dashboard to point at your production URL (e.g. `https://your-api.com/api/webhooks/stripe`) for `checkout.session.completed`.

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account (sends verification email) |
| POST | `/api/auth/login` | No | Log in (requires verified email) |
| POST | `/api/auth/logout` | No | Log out |
| GET | `/api/auth/verify-email?token=` | No | Verify email via link in email |
| POST | `/api/auth/resend-verification` | No | Resend verification email (body: `{ email }`) |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update name/email |
| PUT | `/api/auth/password` | Yes | Change password |

### Bookings
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/bookings` | Yes | Create booking + Stripe session |
| GET | `/api/bookings` | Yes | List user's bookings |
| GET | `/api/bookings/verify` | Yes | Verify Stripe payment |
| GET | `/api/bookings/:id` | Yes | Get booking details |

### Other
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/contact` | No | Submit contact form |
| POST | `/api/webhooks/stripe` | No | Stripe webhook |
| GET | `/api/health` | No | Health check |

## Project Structure

```
├── client/                 React frontend
│   ├── src/
│   │   ├── api/            Fetch wrapper
│   │   ├── components/     Shared UI components
│   │   ├── context/        Auth context
│   │   ├── data/           Package definitions
│   │   ├── hooks/          Custom hooks
│   │   ├── layouts/        Page layout wrapper
│   │   └── pages/          Route pages
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                 Express backend
│   ├── prisma/             Database schema & migrations
│   └── src/
│       ├── config/         DB, Stripe, env config
│       ├── controllers/    Route handlers
│       ├── data/           Package definitions (server-side)
│       ├── middleware/      Auth, error handling
│       ├── routes/         Express routes
│       ├── services/       Business logic
│       └── utils/          Error classes
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Packages

| Package | Price | Duration | Clips | Locations |
|---|---|---|---|---|
| Horizon | £149 | 30 min | 3 | 1 |
| Aerial Pro | £299 | 90 min | 8 | 2 |
| Cinematic Full Day | £599 | Full day | Unlimited | 5 |
