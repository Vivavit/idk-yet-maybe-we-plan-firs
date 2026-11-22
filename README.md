# IDK Yet Maybe We Plan First

A fast, cross-device filmmaking pre-production web app with Apple-style frosted glass UI, Full Script + Scene Breakdown, Shot List & WebP Storyboard Studio, Link-Only Moodboard, Shoot Prep, High-Contrast On-Set Mode, Friend Profiles, and Live Presence + Cursors.

## Run Locally (Zero Setup)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
Works offline-first with IndexedDB and live multi-tab `BroadcastChannel` sync (open a shoot in two tabs to see live cursors & presence!).

## Deploy Online (Free Supabase + Free Vercel)

1. **Create a free Supabase project** at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in Supabase and run the full contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env.local` (for local testing) and add your Supabase **Project URL** and **anon public key**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Push this repo to **GitHub**, import it in **Vercel**, paste the same 2 environment variables, and click **Deploy**.
