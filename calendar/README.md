# Family Calendar Manager

A single-page web app for managing the family's weekly schedule — kids' classes,
practices, homework blocks and carpool/driver duties — built from the family
spreadsheet.

Live (once GitHub Pages is enabled): `https://<user>.github.io/george-washington/calendar/`

## Features

**Scheduling**
- Weekly grid with one column per day, grouped by person
- Add / edit / duplicate / delete activities
- Drag & drop a card to move it to another day or another person
- Optional start & end times, location/teacher, category and free-text notes
- "Also repeat on" — create the same activity on several days at once

**Views**
- **Week** — the full board, closest to the original spreadsheet
- **Agenda** — a chronological list per day
- **By Person** — each person's whole week on one card
- **Carpool** — driver duties per day, plus an editable code key (JD, JP, DD, DP…)
- **Insights** — totals, busiest day, scheduled hours, and bar charts for
  activities per day / per person / per category / per driver

**Organising**
- People manager (name, short code, colour) — removing a person removes their activities
- Category manager (name, colour) with usage counts
- Filter by person (chips), by category, and full-text search across titles,
  locations, notes, people and categories

**Data**
- **Static-file backend** — the calendar lives in `data/calendar.json` in this repo, so every
  device loads the same week (see below)
- Autosaves to the browser's `localStorage` between publishes
- Export / import **JSON** (backup or move to another device)
- Export **CSV** (activities + driver duties)
- Export **.ics** — weekly recurring events you can import into Google or Apple Calendar
- **Copy share link** — packs the whole calendar into a URL
- Reset to the sample week, or clear all activities

**Quality of life**
- Light / dark theme
- Today's column highlighted
- Undo / redo (60 steps) with undo prompts on deletes
- Print stylesheet (landscape, one page)
- Responsive down to phone width
- Keyboard shortcuts: `N` new activity, `/` search, `1`–`5` switch views,
  `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Y` redo, `Esc` close

## The static-file backend

There is no server. The calendar is a JSON file committed next to the app —
`calendar/data/calendar.json` — and GitHub Pages serves it like any other asset.

**Reading** needs nothing: every device fetches that file on load, so the phone, the
Chromebook and the laptop all open the same week. Local edits are held in
`localStorage` until they are published.

**Writing** goes through the GitHub Contents API, which needs a token. Without one the
app still works — it just hands you the file to commit yourself.

### Status badge

The pill in the header says where you stand. Click it to open the settings (or to
resolve a conflict).

| Badge | Meaning |
| --- | --- |
| ● **Synced** | Matches the file in the repository |
| ▲ **Unpublished** | You have edits that are not in the repository yet |
| ! **Conflict** | The repository changed *and* you have local edits — pick a side |
| ○ **Local only** | The data file is unreachable (opened as a `file://` page, say) |

### How reconciling works

On load the app fetches the file and compares it against the last version it knows the
repository had:

- **First visit** → take the repository file.
- **No local edits, repository changed** → take the repository file. This is the sync.
- **Local edits, repository unchanged** → keep yours, badge reads *Unpublished*.
- **Local edits and the repository changed** → *Conflict*. You choose "keep the repository
  version" or "publish mine anyway"; there is no automatic merge, and the dialog offers a
  JSON export first.

Publishing re-checks the file immediately before writing, so a change made on another
device between your load and your publish is caught rather than silently overwritten.

### Setting up publishing

1. Create a **fine-grained** personal access token at
   *GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens*.
2. Scope it to **this repository only**, with **Contents: read and write**, and set an
   expiry date.
3. In the app: **Options (☰) → Repository sync**, paste the token, **Save settings**.

Owner, repository, branch and file path are filled in automatically from the Pages URL;
override them if you fork or move the app.

Then **↑ Publish** commits the file. Pages redeploys in under a minute and other devices
pick the change up on their next load.

**About the token.** It is stored in this browser's `localStorage` and never leaves it —
it is not included in JSON exports or share links (both are checked by the test suite).
But anyone with access to that browser profile can read it, so don't add one on a shared
or public machine, and use **Forget token** when you're done. A fine-grained,
single-repository, expiring token keeps the blast radius small. Everything except
publishing works without a token.

## Running it

No build step, no dependencies. Serve the repository root — the app needs an HTTP
origin to read its data file:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/calendar/
```

Opening `index.html` straight off disk works too, but the backend is unreachable over
`file://`, so the badge reads *Local only* and you get the built-in sample week.

## Deploying on GitHub Pages

In the repository: **Settings → Pages → Build and deployment → Deploy from a
branch**, pick the branch and `/ (root)`. The app is then served from
`/calendar/`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, views, drawer and modal shell |
| `styles.css` | Theming (CSS variables), layout, responsive and print rules |
| `app.js` | State, persistence, sync, rendering, undo/redo, import/export |
| `data/calendar.json` | **The calendar itself** — the static-file backend |

## Notes

The calendar ships pre-loaded with the family's real week (Jashu and Anshu's
classes, dance, swimming and homework blocks, plus the Mom/Dad/Sahi driver
rotation). Everything is editable — the seed data is only a starting point, and
**Reset to sample week** in the Options drawer brings it back.
