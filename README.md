# TSEB Bedside Singing Manager

Mobile-first web app for managing TSEB's bedside singing program: outreach pipeline, venue tracking, singer roster, and gig scheduling.

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, pick a name and password, choose the region closest to your volunteers
3. Wait for the project to provision (~2 minutes)

### 2. Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Open `sql/001_schema.sql`, paste the entire contents, and click **Run**
3. Open `sql/002_seed_data.sql`, paste the entire contents, and click **Run**

This creates all tables and imports your existing spreadsheet data (30 singers, ~45 institutions, contacts, and activity logs).

### 3. Enable Google Authentication

1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable **Google**
3. You'll need a Google OAuth client ID and secret:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Go to **APIs & Services > Credentials**
   - Create an **OAuth 2.0 Client ID** (Web application)
   - Add your site URL to **Authorized JavaScript origins** (e.g. `https://yourusername.github.io`)
   - Add `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback` to **Authorized redirect URIs**
   - Copy the Client ID and Client Secret back into Supabase's Google provider settings
4. Under **Authentication > URL Configuration**, add your site URL to **Redirect URLs**

### 4. Configure the App

Edit `js/config.js` with your Supabase project values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

Find these in Supabase dashboard under **Settings > API**.

### 5. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push all files to the `main` branch:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/tseb-singing-manager.git
   git push -u origin main
   ```
3. Go to **Settings > Pages** in your repo
4. Set source to **Deploy from a branch**, select `main`, root `/`
5. Your app will be live at `https://YOUR_USERNAME.github.io/tseb-singing-manager/`

## Project Structure

```
tseb-singing-manager/
├── index.html          # Main app (mobile-first, single page)
├── js/
│   ├── config.js       # Supabase URL + anon key
│   └── app.js          # All Supabase client logic
├── sql/
│   ├── 001_schema.sql  # Database tables, indexes, RLS policies
│   └── 002_seed_data.sql # Migrated spreadsheet data
└── README.md
```

## Security Model

Uses Supabase Row Level Security with a **volunteer trust model**: any authenticated Google user can read and write all records. To restrict access to only TSEB volunteers, you can modify the RLS policies in `001_schema.sql` to check against a whitelist of email addresses.

## Cost

$0/month on Supabase free tier + GitHub Pages. Free tier supports up to 500MB database and 50,000 monthly active users — more than enough for 16 outreachers.
