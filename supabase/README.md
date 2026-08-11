# Plixfy accounts setup

1. Create a Supabase project.
2. Run `schema.sql` in the Supabase SQL Editor.
3. Add these variables locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

4. In Supabase Authentication URL configuration, set the production Site URL to `https://www.plixfy.com` and add these redirect URLs:

- `https://www.plixfy.com/api/auth/callback`
- `http://localhost:3000/api/auth/callback`

5. Enable Google under Authentication > Providers and configure its Google OAuth client.
   Then set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` locally and in Vercel.
6. Configure a production SMTP provider before launching email confirmation and password recovery. Supabase's default sender is intended for testing and is rate limited.

The application still works as a guest when these variables are missing. Favorites and recently played games stay in browser storage and merge into the account after sign-in.
