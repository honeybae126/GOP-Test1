# GOP Automation System — Intercare Hospital (Phase 1)

A Guarantee of Payment (GOP) pre-authorisation workflow system built with Next.js 16.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Insurance Staff | staff@intercare.com | gop123 |
| Doctor | doctor@intercare.com | gop123 |
| Admin | admin@intercare.com | gop123 |

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/honeybae126/GOP-Test1.git
cd GOP-Test1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

You can keep the default `AUTH_SECRET` for local development.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Auth**: NextAuth v5
- **UI**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand
- **Data**: Mock data (Phase 1 — no database required)

## Notes

- All data is mock/in-memory. No database setup needed for Phase 1.
- State resets on server restart (Zustand is client-side only).
- PDF generation uses the browser's print dialog (`/print/gop/[id]`).
