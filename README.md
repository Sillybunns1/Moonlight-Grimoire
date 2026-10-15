# ☾ Moonlight Grimoire

A standalone, mobile-first, gothic companion PWA for **Moonlight Peaks**. This is a *community companion*, not an official game app. It does not contain story spoilers or undiscovered game content.

**No npm install or computer build process required.** This repository is a static HTML/CSS/JavaScript app that can run on GitHub Pages. Its cloud backend is a **separate Supabase project**, entirely independent of Plot Pals.

## What is included

- Dashboard showing the current in-game date, compact priorities, two favorite Quick Actions (Plant Crop and Social Activity), Quick Add menu, active session, and mandatory Next Day confirmation.
- Daily Journal with a burgundy diary text box at the top, followed by remembered collapsible sections in the agreed order: Garden, Social, Quests, Businesses, Upgrades, Chronicle, Tomorrow's Reminders.
- Garden crop definitions, grow seasons, dated planting batches, harvest confirmations, regrowth predictions, crop filtering by season, and reminders. No seed or produce inventory.
- Four 28-day seasons in order Spring → Summer → Autumn → Winter. Each season starts Monday. Growth timing uses planting date + days, and confirmed harvest date + regrowth nights, based on the Blood Grapes field test.
- Residents with one Talked/Gifted checklist per in-game day, dates, milestone records, birthday data, and a business directory with known hours, regular closures, and pins.
- Dated quest objective progress, material-by-material upgrade tracking, and automatic Session / Season / Year activity summaries.
- Collection Codex for 12 Spells, 53 Crops, 144 Recipes, 9 Potions, 100 Soul Blobs, 22 Fish, 95 Critters, and 100 Vampsters. Supports unnamed progress, individually named discoveries, and starting baselines without double-counting.
- One-time and repeating in-game reminders, with business-aware missed-task rescheduling when Next Day is confirmed.
- Multiple independent playthroughs, new/existing playthrough setup, coin snapshots, copyable ChatGPT summaries, and JSON backup export/restore previews.
- Email/password sign-in, owner-scoped cloud storage, local IndexedDB caching, optimistic versioned updates, and conflict review **once Supabase is configured**.

## Files

```text
index.html             App entry point
config.js              Fill in your own Supabase public project URL/key
manifest.webmanifest   Installable PWA metadata
sw.js                  Offline page-shell cache
icon.svg               Grimoire icon
src/app.js             UI, interactions, saving, syncing, backups
src/domain.js          Calendar, harvest, reminder and merge logic
src/cloud.js           Offline cache, Supabase auth and API
src/style.css          Gothic mobile styling
supabase/setup.sql     Database table, RLS policies, versioned save function
tests/domain.test.js   Logic tests (optional: node --test)
```

## 1. Put the app in GitHub

1. Download **moonlight-grimoire.zip** and extract it (on iPhone, tap the ZIP in Files to unzip).
2. Create a GitHub repository, for example `moonlight-grimoire`.
3. Upload **the contents of the extracted `moonlight-grimoire` folder**, keeping `src/` and `supabase/` as directories. The repository's root must contain `index.html`. **Uploading the ZIP file alone will not deploy the app.**
4. Commit the files to the default `main` branch.
5. In GitHub repository **Settings → Pages**, choose **Deploy from a branch**, then `main` and `/(root)`, and save.
6. GitHub will provide an app URL, usually `https://YOURNAME.github.io/moonlight-grimoire/`.

**Important:** Uploading a folder to GitHub can be awkward on iPhone. If GitHub mobile cannot preserve the directories, leave the ZIP in Files and upload the extracted folder when you have access to a computer, or use a compatible Git client. No compilation or terminal commands are necessary.

The app opens in **Local Preview** until the cloud project is connected. Local Preview is NOT cloud-synced. You can use it to explore the interface and export its data. Set up the cloud before beginning a playthrough you want protected online.

## 2. Create your independent Supabase cloud project

1. In [Supabase](https://supabase.com/dashboard), create a **new project** for Moonlight Grimoire (not the Plot Pals project).
2. Go to **SQL Editor**, paste all of `supabase/setup.sql`, and run it. This creates `public.playthroughs`, user-only RLS access policies, and an atomic compare-and-swap save function.
3. Open **Project Settings / Connect** (the exact navigation may change), and copy your **Project URL** and **publishable key** (or legacy `anon` public key).
4. Open the repository file **`config.js`** in GitHub, select Edit, and fill in:

   ```javascript
   window.GRIMOIRE_CONFIG = {
     supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
     supabasePublishableKey: 'YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY'
   };
   ```

5. Commit the edit. **Never paste a service-role key, database password, or secret API key into `config.js`.** The publishable key is designed for public frontends; RLS is what protects your data.
6. Under **Authentication → URL Configuration** in Supabase, set **Site URL** to your deployed GitHub Pages app URL, and add that same URL to **Redirect URLs**. Keep your actual repository subpath and trailing `/`.
7. Under **Authentication → Providers → Email**, ensure email/password is enabled and email confirmation is configured the way you want. For production, email delivery may need a custom SMTP service if Supabase's default quota is insufficient.
8. Reload your GitHub Pages app, create an account, verify the confirmation email if required, and sign in.

**Never disable RLS.** Do not store other users' credentials in the source code. You only need public frontend settings in `config.js`.

## 3. Install on iPhone

1. Open the HTTPS GitHub Pages app URL in **Safari**.
2. Tap the Share icon → **Add to Home Screen**.
3. Enable **Open as Web App**, if prompted, and add it.
4. Launch from the Home Screen. Sign in with the Moonlight Grimoire account you created.

Use the **Sync** status at the top to check whether changes are saved only locally, pending, or cloud-synced. When offline after initial setup, the already-loaded PWA and IndexedDB can keep changes locally. Reconnect to sync. iOS may remove website data in some circumstances; independent backups remain important.

## 4. Backup and restore

In **Settings → Export all playthroughs**, download a JSON backup and save the downloaded file to **Files or iCloud Drive**. Confirm it is saved when prompted. To restore, choose **Restore backup** and pick the exported JSON file. You can:

- Import a playthrough as a new copy (safest).
- Restore just the matching playthrough.
- Replace the entire playthrough library after explicit confirmation.

**Full cloud library replacement requires an internet connection.** Before destructive restoration, export a fresh safety backup. Don't overwrite a newer backup with an older one by accident.

Cloud syncing and independent backup files solve different problems. Sync alone is not a historical backup. This app deliberately does not pretend that clicking Export proves an iPhone actually saved the file.

## 5. Development notes and limitations

- This is a fully authored first release, not a hosted app. **Live Supabase authentication, email delivery, RLS, deployment, and actual multi-device conflicts cannot be end-to-end validated until you connect your own project.** The comparison logic has unit tests, but real sync still needs manual verification on two devices.
- In-game activities are manually recorded by the player. The app does not read Moonlight Peaks game saves or know when something happens unless you enter it.
- Shop schedules and discovered crops are user-entered, not spoilers or official game data. Unknown timing remains unknown until entered.
- Offline editing relies on device storage and an existing signed-in account. Do not clear website data while you have unsynchronized changes.
- JSON backups are unencrypted plain text; keep them in a private location. They contain your diary entries and game records but do **not** include your password.
- The browser-only UI uses a small number of native browser controls. More advanced reporting, deletion/archiving, and stronger automated UI and device testing are good areas for future polish.
- To run locally on a computer: `python3 -m http.server 8080`, then open `http://localhost:8080`. Opening `index.html` directly as a `file://` URL is not supported for service-worker/PWA features.
- Optional logic tests if Node.js is installed: `node --test tests/*.test.js` (no packages to install).
- After changing cached code, update the cache name in `sw.js` (e.g. `moonlight-grimoire-v2`) if an installed app doesn't immediately pick up the update.

## Helpful official docs

- [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Supabase email/password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Apple — Add a website to iPhone Home Screen](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)

Made for your vampire's journal. ✦
