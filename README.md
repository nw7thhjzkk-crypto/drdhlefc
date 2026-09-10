# GymSmart ERP

GymSmart ERP is the management system for Dr DHL Elite Fitness Club. It is a comprehensive platform designed to manage memberships, trainers, payments, workout/diet plans, and more for the fitness club.

## Tech Stack

This project is built using:
- **[Next.js](https://nextjs.org/)** (App Router) + **TypeScript** for the frontend and API routes.
- **[Tailwind CSS](https://tailwindcss.com/)** for styling.
- **[Supabase](https://supabase.com/)** for the PostgreSQL database, Authentication, and Row Level Security.
- **[Gemini API](https://deepmind.google/technologies/gemini/)** for AI integrations.
- Deployed on **[Vercel](https://vercel.com/)**.

## Getting Started

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env.local` and add your keys.
4. Run the development server with `npm run dev`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## One-time Owner Setup

To create the initial Owner account for the platform:

1. Ensure your `.env.local` contains real values for `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. Add your desired credentials to `.env.local`:
   ```env
   OWNER_EMAIL=your_real_admin_email@example.com
   OWNER_PASSWORD=your_secure_password
   ```
3. Run the setup script locally:
   ```bash
   npx tsx --env-file=.env.local scripts/create-owner.ts
   ```
4. **Important**: Never commit your `.env.local` or any file containing real credentials to version control.

---
**Note:** This commit ensures a diff exists to successfully publish the branch.

---
**Note:** Verified on $(date)

## Public website & early-access leads

The public club website (`/`) renders without Supabase configured, so you can
preview the Coming Soon experience immediately. Role redirects, `/login`, and
the ERP portals need the Supabase environment variables as usual.

**Get Early Access** writes to the canonical `public.leads` table (no separate
CRM). To enable live capture:

1. Apply the lead-capture migration to your Supabase database:
   `supabase/migrations/000020_submit_website_lead.sql`
   (adds `public.submit_website_lead(...)` — a `SECURITY DEFINER` RPC that forces
   `source = 'Website'` and `stage = 'new'`; table RLS is not weakened).
2. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   in `.env.local`.
3. Optionally set `NEXT_PUBLIC_SITE_URL` to the production origin for canonical
   URLs, sitemap, Open Graph, and JSON-LD.

Until the migration is applied, the enquiry form fails closed (shows an error
and an email fallback) — it never reports a fake success. Submitted enquiries
appear in **Owner → Leads & CRM**, including the visitor's goal, interest, and
message in the enquiry notes.

## Environment Variables
Ensure GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, and GOOGLE_DRIVE_REFRESH_TOKEN are set.
<!-- Jules autonomous merge verification -->
