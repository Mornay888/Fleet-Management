# FuelTrack Pro

Fleet & fuel management system. Built with React + Vite + Supabase.

---

## Step-by-step deployment guide

Follow these steps **in order**. Estimated total time: 30–45 minutes.

---

### PART 1 — Set up Supabase (your database + auth)

**Step 1.1 — Create a Supabase account**
1. Go to https://supabase.com and click "Start your project"
2. Sign up with GitHub or email
3. Click "New project"
4. Fill in:
   - Organisation: your name or company
   - Project name: `fueltrack-pro`
   - Database password: choose a strong password and **save it**
   - Region: choose the closest to you (e.g. EU West for South Africa)
5. Click "Create new project" — wait ~2 minutes for it to provision

**Step 1.2 — Run the schema**
1. In your Supabase project, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Open the file `supabase/schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned."

**Step 1.3 — Run the seed data**
1. In the SQL Editor, click "New query" again
2. Open `supabase/seed.sql`
3. Paste the entire contents and click "Run"
4. This creates your company "My Farm Operations", the Sasol vendor,
   Tank 1 on Farm 11, the Toyota Hilux, Dawie Fourie, and the 3 activity types.

**Step 1.4 — Get your API keys**
1. In Supabase, go to "Project Settings" (gear icon, bottom left)
2. Click "API"
3. Copy these two values — you'll need them in Part 3:
   - **Project URL**: looks like `https://abcdefgh.supabase.co`
   - **anon public key**: a long string starting with `eyJ...`

---

### PART 2 — Upload code to GitHub

**Step 2.1 — Create a GitHub account** (if you don't have one)
1. Go to https://github.com and sign up

**Step 2.2 — Create a new repository**
1. Click the "+" icon (top right) → "New repository"
2. Name it `fueltrack-pro`
3. Set it to **Private** (recommended — this is your business app)
4. Do NOT check "Add a README" (you already have one)
5. Click "Create repository"

**Step 2.3 — Upload the code**

Option A — Using GitHub Desktop (easiest for non-developers):
1. Download GitHub Desktop from https://desktop.github.com
2. Open it and sign in to your GitHub account
3. Click "Add" → "Add existing repository" → browse to your `fueltrack` folder
4. If it says "not a Git repository", click "create a repository here"
5. Commit all files (write a message like "Initial commit")
6. Click "Publish repository" → choose your `fueltrack-pro` repo → Publish

Option B — Using the command line:
```bash
cd /path/to/fueltrack
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/fueltrack-pro.git
git push -u origin main
```

---

### PART 3 — Deploy to Vercel (free hosting)

**Step 3.1 — Create a Vercel account**
1. Go to https://vercel.com
2. Click "Sign up" → choose "Continue with GitHub"
3. Authorise Vercel to access your GitHub

**Step 3.2 — Import your project**
1. On the Vercel dashboard, click "Add New" → "Project"
2. You'll see your GitHub repositories listed
3. Click "Import" next to `fueltrack-pro`
4. Framework preset: Vercel should auto-detect **Vite**
5. Leave all other settings as default

**Step 3.3 — Add your environment variables**
Before clicking Deploy, scroll down to "Environment Variables" and add:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL from Step 1.4 |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key from Step 1.4 |

Click "Add" after each one.

**Step 3.4 — Deploy**
1. Click "Deploy"
2. Wait 1–2 minutes while Vercel builds your app
3. When it says "Congratulations!", click "Continue to Dashboard"
4. Your app is live at a URL like `https://fueltrack-pro.vercel.app`

---

### PART 4 — First login and link your account to the farm

**Step 4.1 — Sign up**
1. Open your app URL
2. Click "Sign up" and create your account with email + password
3. Check your email for a confirmation link and click it
4. Sign back in

**Step 4.2 — Link your user to the farm company**
After signing up, your account exists but isn't linked to a company yet.
Fix this in Supabase:

1. Go back to your Supabase dashboard → SQL Editor → New query
2. Run this to find your user ID:
   ```sql
   SELECT id, email FROM auth.users;
   ```
3. Copy your UUID (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
4. Run this query with your UUID:
   ```sql
   UPDATE profiles
   SET company_id = 'a1000000-0000-0000-0000-000000000001',
       role = 'admin',
       full_name = 'Your Name'
   WHERE id = 'PASTE-YOUR-UUID-HERE';
   ```
5. Refresh the app — you should now see "My Farm Operations" in the sidebar

**Step 4.3 — You're live!**
Your initial data is already loaded:
- Toyota Hilux (CC 87 DD GP) — 12,000 km
- Dawie Fourie (female, driver)
- Tank 1 — Farm 11 (1,000 L capacity)
- Sasol (vendor)
- Activities: Cattle movement, Private use, Transport

Set the current diesel level in Tank 1 by going to Tanks and editing the current stock,
or raise a purchase order from Sasol and receive it into Tank 1.

---

### PART 5 — Future updates (how to push changes)

Whenever you make changes to the code:
1. Save your files
2. In GitHub Desktop: review changes → write a commit message → click "Commit to main" → "Push origin"
3. Vercel automatically detects the push and redeploys within 1–2 minutes
4. Your live URL stays the same

---

### Adding more users (your staff)

1. Give them your app URL
2. They click "Sign up" and create their account
3. They email you their user UUID (they can find it by asking you)
4. You run the UPDATE query in Supabase to link them to the company with role `operator`

---

### Custom domain (optional)

1. In Vercel dashboard → your project → "Settings" → "Domains"
2. Add your domain (e.g. `fueltrack.yourfarm.co.za`)
3. Follow the DNS instructions Vercel provides
4. Your registrar (domains.co.za, afrihost, etc.) is where you update the DNS

---

## Project structure

```
fueltrack/
├── supabase/
│   ├── schema.sql        ← Database tables, triggers, RLS policies, views
│   └── seed.sql          ← Your initial data
├── src/
│   ├── context/
│   │   └── AuthContext.jsx   ← Login state management
│   ├── components/
│   │   └── Layout.jsx        ← Sidebar + navigation
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Tanks.jsx
│   │   ├── PurchaseOrders.jsx
│   │   ├── Vendors.jsx
│   │   ├── FuelIssues.jsx
│   │   ├── Vehicles.jsx
│   │   ├── Drivers.jsx
│   │   ├── DailyActivity.jsx
│   │   ├── ActivityTypes.jsx
│   │   ├── Users.jsx
│   │   └── Reports.jsx
│   ├── App.jsx           ← Router + auth guard
│   ├── main.jsx          ← Entry point
│   ├── index.css         ← All styles
│   └── supabaseClient.js ← Supabase connection
├── .env.example          ← Copy to .env, fill in your keys
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

## Tech stack

- **Frontend**: React 18 + Vite
- **Database + Auth**: Supabase (PostgreSQL)
- **Hosting**: Vercel (free tier)
- **Icons**: Tabler Icons

## Support

For Supabase help: https://supabase.com/docs
For Vercel help: https://vercel.com/docs
For React help: https://react.dev
