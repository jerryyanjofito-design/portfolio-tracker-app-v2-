# Supabase Setup Guide

Follow these steps to set up Supabase for the Portfolio Tracker.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Choose organization (create one if needed)
5. Fill in project details:
   - Name: portfolio-tracker
   - Database Password: (choose a strong password, save it!)
   - Region: Singapore (closest to Indonesia)
6. Click "Create new project" (takes ~1-2 minutes)

## Step 2: Get API Credentials

1. Once project is ready, click "Settings" → "API"
2. Copy the following values:
   - **Project URL**: https://xxxxxxxx.supabase.co
   - **anon public** key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## Step 3: Configure Environment Variables

Create `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Step 2.

## Step 4: Create Database Tables

1. In Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Open `supabase/schema.sql` from your project
4. Copy and paste the SQL content
5. Click "Run" to execute

This creates two tables:
- `holdings` - for your investment holdings
- `cash_accounts` - for your cash accounts

## Step 5: Verify Setup

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Try adding a holding or cash account
4. Check Supabase → Table Editor to see data saved

## Troubleshooting

**Issue: "Supabase not initialized"**
- Check `.env.local` file exists and has correct values
- Restart the dev server after updating env variables

**Issue: "Invalid supabaseUrl"**
- Make sure URL starts with https://
- Check for typos in the URL

**Issue: Data not saving**
- Check browser console for errors
- Verify tables exist in Supabase Table Editor
- Check RLS policies (should work without authentication for now)

## Next Steps

Once setup is complete:
1. Add your current holdings
2. Add your cash accounts
3. Track your net worth progress toward 15B IDR goal!
