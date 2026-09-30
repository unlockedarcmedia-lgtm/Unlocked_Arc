# UNLOCKED ARC — Google-ready GitHub Pages package

Website: https://unlockedarcmedia-lgtm.github.io/Unlocked_Arc/

Upload all files in this folder to the root of your GitHub Pages repository.

Included:
- index.html — SEO metadata, canonical URL, social sharing metadata, structured data
- style.css — existing design
- unlocked-arc-banner.png — supplied hero image
- unlocked-arc-logo.png — supplied logo
- robots.txt — crawl instructions and sitemap location
- sitemap.xml — homepage sitemap

Important: GitHub Pages is static. The story form is still a front-end form and is not a secure submission backend. Connect it to a proper form service/backend before accepting real story/photo submissions.

Next:
1. Upload/replace these files in the `Unlocked_Arc` repository.
2. Confirm GitHub Pages uses `main` and `/ (root)`.
3. Add `https://unlockedarcmedia-lgtm.github.io/Unlocked_Arc/` as a URL-prefix property in Google Search Console.
4. Verify ownership.
5. Use URL Inspection and request indexing for `https://unlockedarcmedia-lgtm.github.io/Unlocked_Arc/`.
6. Submit `https://unlockedarcmedia-lgtm.github.io/Unlocked_Arc/sitemap.xml` in the Sitemaps report.


## Secure story system

A production-ready Supabase integration is included on branch `secure-story-system`.

### Components
- `story-submit.js` — secure browser submission client
- `supabase/schema.sql` — database, Row Level Security, and private photo bucket
- `admin/` — authenticated admin dashboard
- `supabase-config.js` — public project URL + publishable/anon key placeholder

### Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Create an admin user in Supabase Authentication.
4. Add that Auth user's UUID/email to `public.admin_users`.
5. Put the Supabase project URL and publishable/anon key in `supabase-config.js`.
6. Deploy the `secure-story-system` branch only after testing, or merge it into `main`.
7. Open `/admin/` to sign in.

### Secrets
Never commit a Supabase service-role/secret key. The frontend uses only the publishable/anon key; Row Level Security protects database and private storage access.

### Before accepting real submissions
Enable rate limiting/bot protection, confirm the maximum upload policy, test deletion/retention procedures, and review the privacy/consent wording for your jurisdiction.
