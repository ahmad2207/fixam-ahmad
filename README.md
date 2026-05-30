# Fixam Africa — Next.js

Premium kitchen products e-commerce store built with Next.js 16, Drizzle ORM, PostgreSQL, and DigitalOcean Spaces.

## Prerequisites

- Node.js 18+
- Access to the team's environment variables (ask the project lead)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root and fill in all values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret — run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `DO_SPACES_KEY` | DigitalOcean Spaces access key |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret |
| `DO_SPACES_ENDPOINT` | e.g. `https://fra1.digitaloceanspaces.com` |
| `DO_SPACES_BUCKET` | Bucket name |
| `DO_SPACES_REGION` | e.g. `fra1` |
| `DO_SPACES_CDN_ENDPOINT` | CDN URL for serving files |
| `DO_SPACES_DIR` | Subdirectory inside bucket (default: `fixam-rev`) |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key (server-side only) |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key (client-side) |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Flutterwave webhook secret hash |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | Verified sender email address |
| `NEXT_PUBLIC_APP_URL` | Public-facing base URL |

### 3. Generate and run database migrations

```bash
npm run db:generate   # generates SQL migration files from schema
npm run db:migrate    # applies migrations to the database
```

### 4. Seed base data

```bash
npm run db:seed       # inserts categories and other required base data
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the store.
The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migration files from schema |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:seed` | Seed base data (categories, etc.) |

## Project Structure

```
src/
├── app/
│   ├── (store)/        # Public-facing store pages
│   ├── (admin)/        # Admin panel pages
│   └── api/            # API routes
├── components/
│   ├── store/          # Store UI components
│   ├── admin/          # Admin UI components
│   └── ui/             # shadcn/ui base components
├── db/
│   └── schema/         # Drizzle table definitions
├── lib/                # Utilities, db client, spaces client
├── hooks/              # React hooks
├── context/            # React context providers
└── providers/          # App-level providers
scripts/
└── seed.ts             # Base data seed script
```

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4
- **Database** — PostgreSQL on DigitalOcean (via Drizzle ORM)
- **Auth** — NextAuth.js v5
- **Media** — DigitalOcean Spaces (S3-compatible)
- **Payments** — Flutterwave
- **Email** — Resend
- **UI Components** — shadcn/ui
