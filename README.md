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

## Quick Start with Docker

```bash
# Clone and enter the project
cd skyreach-visuals

# Set your Stripe keys (optional — the app runs without them but payments won't work)
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...

# Start everything
docker compose up --build

# Run the database migration (first time only)
docker compose exec server npx prisma migrate deploy
```

The site will be available at `http://localhost:3000`.

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
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | For payments |
| `CLIENT_URL` | Frontend URL (for CORS) | Yes |
| `STRIPE_SUCCESS_URL` | Redirect after successful payment | For payments |
| `STRIPE_CANCEL_URL` | Redirect after cancelled payment | For payments |
| `SMTP_HOST` | SMTP server hostname | For emails |
| `SMTP_PORT` | SMTP port (587 or 465) | For emails |
| `SMTP_USER` | SMTP username | For emails |
| `SMTP_PASS` | SMTP password | For emails |
| `EMAIL_FROM` | Sender email address | For emails |
| `PORT` | Server port (default: 5000) | No |

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in |
| POST | `/api/auth/logout` | No | Log out |
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
