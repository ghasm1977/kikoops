# KIKO Ops — Go Live Guide
**Target: kikoops.afg.com**

---

## Step 1 — Supabase (15 min)
1. Go to supabase.com → New project → name: "kikoops" → region: Middle East
2. SQL Editor → paste entire `supabase_schema.sql` → Run
3. Authentication → Settings → Site URL: `https://kikoops.afg.com`
4. Copy: Project URL + anon key → paste into `.env`

## Step 2 — Create first admin user (5 min)
In Supabase SQL editor:
```sql
-- After signing up via the app, run this to make yourself admin:
update profiles set role = 'admin', full_name = 'Wissam Ghaddar' 
where email = 'wissam.ghaddar@cenomi.com';
```

## Step 3 — Deploy to Vercel (10 min)
```bash
npm install -g vercel
cd /path/to/kikoops
vercel --prod
```
- Framework: Vite
- Add env vars from .env in Vercel dashboard
- Custom domain: kikoops.afg.com → add DNS CNAME record

## Step 4 — Gmail SOH Auto-Sync (20 min)

### Get Gmail OAuth credentials:
1. console.cloud.google.com → New project → Enable Gmail API
2. Credentials → OAuth 2.0 → Desktop app → Download JSON
3. Run once locally to get refresh token:
```bash
cd server
node get-token.js  # will open browser, paste code back
```

### Deploy sync server on Railway (free tier):
1. railway.app → New project → Deploy from GitHub
2. Add env vars (SUPABASE_URL, SUPABASE_SERVICE_KEY, GMAIL_*)
3. Add cron: `0 7 * * *` (runs at 7am daily)

## Step 5 — Add team users (5 min each)
In Supabase → Authentication → Users → Invite user → then:
```sql
-- Set their role and store:
update profiles 
set role = 'store_manager', store_id = 1, full_name = 'Store Manager Name'
where email = 'manager@cenomi.com';
```

### Role permissions:
| Role          | Access |
|---------------|--------|
| admin         | Everything — all stores, all data |
| area_manager  | Region view, all stores in region, no salary |
| store_manager | Own store only — checklist, schedule, KPI, SOH |
| staff         | Own store — checklist view + schedule only |

---

## Architecture Summary
```
Gmail (daily 3:29pm) → Railway cron (7am) → Supabase DB → Vercel React app
                                                ↑
                              Oracle Excel upload (manual monthly)
```

## Cost estimate
- Supabase Free: SAR 0 (up to 500MB, 50k users) 
- Vercel Free: SAR 0
- Railway: ~SAR 20/month for sync server
- Domain kikoops.afg.com: depends on your IT/DNS setup
- **Total: ~SAR 20/month**
