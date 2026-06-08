# P2P Money

Registration and login app with admin dashboard.

## Pages

| URL | Description |
|-----|-------------|
| `/register` | Customer registration (p2p register) |
| `/login` | Customer login |
| `/admin` | Admin dashboard (view all submissions) |
| `/admin/login` | Admin login |

## How it works

1. Customer enters mobile + password and clicks **Send OTP** → saved to database (visible in admin).
2. Customer enters OTP and clicks **Register** → OTP saved to database (visible in admin).
3. Customer login attempts are also saved and visible in admin.

## Setup

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000/register

## Admin access

- URL: http://localhost:3000/admin/login
- Default password: `admin123` (change in `.env`)

## Environment variables

Copy `.env.example` to `.env`:

```
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="your-secure-password"
```

## Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL` — use [Turso](https://turso.tech) or [Neon](https://neon.tech) for production SQLite/Postgres
   - `ADMIN_PASSWORD` — your secure admin password
4. For SQLite on Vercel, switch Prisma to Turso or use PostgreSQL

## Production database

For production, update `prisma/schema.prisma` to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run `npx prisma migrate deploy`.
