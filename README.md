# P2P Money — USDT Trading Platform

Buy/sell USDT with client dashboards, payment screenshots, and admin management.

## Pages

| URL | Description |
|-----|-------------|
| `/register` | Customer registration (p2p register) |
| `/login` | Customer login → redirects to dashboard |
| `/dashboard` | Client USDT dashboard (balance, payments, bank/UPI) |
| `/admin` | Admin dashboard (clients, payments, registrations) |
| `/admin/login` | Admin login |

## How it works

### Registration
1. Customer enters mobile + password → **Send OTP** (duplicates auto-removed)
2. Customer enters OTP → **Register** (status: `otp_submitted`)
3. Admin **Wrong OTP** → customer sees error and re-enters
4. Admin **Approve** → creates client account, customer can login

### Client Dashboard
- **USDT Received / Sent / Balance**
- **Bank details** (name, account, IFSC, holder)
- **UPI** (Mobikwik, PhonePe, Paytm)
- **Submit payment** with screenshot + INR/USDT amount
- **Transaction history** with time and status

### Admin
- **Clients tab** — view balance, bank/UPI, add USDT sent/received, **delete account**
- **Pending Payments** — view screenshot, confirm or reject
- **Registrations / Logins** — duplicates auto-deleted (keeps latest per mobile)

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

### When to deploy?
- **Test locally first** (`npm run dev`) — make sure register, admin, and OTP flow work.
- **Then deploy** once you are happy with it.

### Environment variables on Vercel (choose "Add manually", NOT "Import from file")

Vercel asks for **Key** and **Value**. Type them manually:

| Key | Value (example) |
|-----|-----------------|
| `DATABASE_URL` | Your production database URL (see below) |
| `ADMIN_PASSWORD` | A strong password only you know |

Do **not** use "Import from .env file" on Vercel — your local `.env` is not uploaded to GitHub (for security).

### Steps
1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Under **Environment Variables**, add the two keys above manually
4. Click Deploy
5. After deploy, run `npx prisma migrate deploy` (or use Vercel build command that includes it)

### Production database (required for Vercel)
SQLite file databases do **not** work on Vercel. Use free [Neon](https://neon.tech) PostgreSQL:
1. Create free account at neon.tech
2. Create a project → copy the connection string
3. Paste it as `DATABASE_URL` on Vercel
4. Change `prisma/schema.prisma` provider to `postgresql`
5. Run `npx prisma migrate deploy`

## Production database

For production, update `prisma/schema.prisma` to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run `npx prisma migrate deploy`.
