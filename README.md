# SyncCRM AI — Concept Demo

An AI-enriched CRM dashboard for a small business (fictional “Brightline Home
Services”): every contact gets a **transparent AI score**, possible duplicates
are **detected and merged**, **follow-up emails are auto-drafted** in three
tones, and a **live pipeline-sync feed** streams CRM/inbox/calendar activity.

**All data is fictional sample data, clearly labeled. Nothing is connected to
real services — scoring, enrichment, drafts and sync are simulated in the
browser. No client names, metrics, or testimonials are claimed.**

## Features

- **AI lead scoring (transparent):** 0–100 from email domain, title authority,
  phone on file, source, engagement (emails opened, site visits, calls) and
  recency. Every point is explained in a “Why this AI score” panel. Tiers A/B/C.
- **Duplicate detection:** case-insensitive email match + same name/company
  matching; one-click merge that keeps the most recently active record and
  combines engagement stats, then re-scores.
- **Auto-drafted follow-ups:** three tones (Friendly / Professional / Concise),
  personalized from the contact's real signals; regenerate or queue for review
  (simulated — nothing is actually sent).
- **Pipeline-sync activity feed:** simulated live events every 4 seconds
  (CRM syncs, email opens, re-scores, call logs, bookings) with pause/resume.
- **Add contact:** new contacts are AI-scored instantly and checked for
  duplicates on the way in.
- **localStorage persistence** with a one-click “Reset demo data”.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Build (static export)

```bash
npm run build   # outputs to out/
```

`next.config.mjs` uses `output: 'export'`, `trailingSlash: true` and
`basePath: '/crm-ai-integration'` for GitHub Pages hosting.

## Demo video

See `DEMO-SCRIPT.md` for the 60-second recording script.
