# Candidate Education & Career Timeline

A mobile-first guided form for nursing candidates applying to Germany. It collects **Education** (nursing/college training and school leaving certificate) and **Work & Activity** (jobs, career breaks, volunteering). It **detects missing periods and overlaps automatically** and blocks submission until every gap is explained. Executives then review **only the exceptions**.

Built with Next.js (App Router), TypeScript, Tailwind CSS, React Hook Form and Zod. It deploys to Vercel as-is.

---

## 1. Deploy to Vercel (about 5 minutes)

**Option A – from GitHub (recommended)**

1. Push this folder to a new GitHub repository.
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repository.
3. Framework preset is detected as **Next.js**. Leave every setting at its default and click **Deploy**.

**Option B – from your computer**

```bash
npm i -g vercel
```

```bash
vercel --prod
```

Run the second command inside this folder.

Once it is live, open:

| Page | URL |
|---|---|
| Start page | `https://your-app.vercel.app/` |
| Sample candidate (Rohit Paswan) | `https://your-app.vercel.app/candidate/demo` |
| Executive review | `https://your-app.vercel.app/admin` |

### Two ways to run

| | Demo mode (default) | Database mode |
|---|---|---|
| Setup | nothing | add 3 environment variables (below) |
| Where answers are saved | in the browser of the phone that filled the form | in your database, plus an offline copy on the phone |
| Candidate links work on other phones | ❌ | ✅ |
| Executive sees candidate answers | only on the same browser | ✅ from anywhere, behind a passcode |
| Good for | trying the flow, showing the team | real candidates |

## 2. Connect the database (for real candidates)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project: **SQL Editor → New query** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. In **Project Settings → API**, copy the **Project URL** and the **service_role / secret key**.
4. In Vercel: **Project → Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `SUPABASE_URL` | the Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role / secret key (server-only, never shown to browsers) |
| `ADMIN_KEY` | a passcode your executives type to open `/admin` |
| `DEMO_ENABLED` | optional: `false` hides the public sample candidate |

5. **Deployments → Redeploy.** The `/admin` header now shows "Database connected".

## 3. Daily use

1. An executive opens `/admin`, types the candidate's name (and phone), and clicks **Create link**.
2. They send the link (copy, or **Share on WhatsApp**). The link contains a long random token, so nobody can guess it.
3. The candidate opens it on their phone, fills in their timeline, fixes any missing periods and submits.
4. The executive opens the candidate in `/admin` and handles only the listed items:
   - unverified institution or hospital → **Use Suggested** or **Keep Candidate Value** (plus the German name and optional "add to verified list")
   - unknown bed count → **Add Bed Count** or **Accept Unknown**
   - recognition eligibility, uncertain qualification mapping, year-only dates and confirmed overlaps → one click each
   - a remaining gap → **Accept this gap**, if it is genuinely acceptable
5. **Approve profile** gives a verified clean profile. **Send back to candidate** reopens it with a note.
6. **Export for target system** downloads every record with the target system's exact field names and values.

## 4. What the candidate experiences

- One question per screen, large buttons, sticky **Next** button, "Step X of Y" progress.
- English questions with short Hindi helper lines under the difficult ones.
- Lists to pick from instead of typing (qualification, job title, facility type, department, tasks and more), with search on long lists.
- Institution, school and hospital names: pick from the verified list or type a new one. Spelling is cleaned automatically and the original is kept. **No German name is ever asked.**
- Dates: month + year by default, with "I don't remember the exact month" (year only) and "I know the exact date" (day). The precision is stored and **dates are never invented**.
- Automatic gap detection. **Fix this period** opens a 2–3 tap form with the dates already filled in, and can reuse the previous city.
- Overlaps: "These two activities happened at the same time. Is this correct?"
- Every answer saves immediately. Refreshing or closing the page loses nothing. If the internet drops, answers stay on the phone and sync later.
- **Review My Information** only unlocks when nothing blocking is left.

## 5. Where to change things

| What | File |
|---|---|
| Dropdown lists (qualifications, job titles, departments, tasks, conditions, equipment, break reasons…) | `src/config/*.ts` |
| Which departments need "conditions treated" / "equipment used" | `src/config/departments.ts` (`requiresConditions`, `requiresEquipment`) |
| Verified institutions / schools / hospitals | `src/config/institutions.ts`, `src/config/healthcareFacilities.ts` (sample data – replace with your list) |
| Cities and countries | `src/config/cities.ts`, `src/config/countries.ts` |
| Gap length, max tasks, diploma-date limits, quality-score weights | `src/config/validationRules.ts` |
| Target-system field names used in the export | `src/config/targetFields.ts` |
| All candidate wording (English) | `src/i18n/locales/en.ts` |
| Hindi helper lines | `src/i18n/locales/hi.ts` (add more languages as new files with the same keys) |
| Field rules (what is required / blocking) | `src/domain/entries/schemas.ts` |
| Gap and overlap logic | `src/domain/timeline/gapDetector.ts`, `overlapDetector.ts` |

## 6. Run locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. Run the date/gap logic tests with:

```bash
npm test
```

## 7. Project structure

```
src/
├── app/                      pages (candidate/[token]/…, admin/…) and API routes
├── components/
│   ├── candidate/            timeline home, wizard engine, wizards per entry type
│   ├── admin/                exception review cards
│   ├── forms/                option list, multi-select, date picker, name search, city field
│   └── timeline/             vertical timeline
├── config/                   all master data and rules (no lists inside pages)
├── domain/                   dates, entry schemas (Zod), timeline engine, validation, quality score
├── i18n/                     translation keys (English + Hindi helpers)
└── lib/                      normalisation, storage (browser + database), export
supabase/schema.sql           database setup
```

Not in this version (by design): German certificate, job preferences, recognition process, vaccination, family, visa, employer matching, CRM, chatbot and interview scheduling.
