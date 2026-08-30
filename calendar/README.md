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
- Autosaves to the browser's `localStorage` — nothing is uploaded anywhere
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

## Running it

No build step, no dependencies. Open `index.html` in a browser, or serve the
folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/calendar/
```

## Deploying on GitHub Pages

In the repository: **Settings → Pages → Build and deployment → Deploy from a
branch**, pick the branch and `/ (root)`. The app is then served from
`/calendar/`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, views, drawer and modal shell |
| `styles.css` | Theming (CSS variables), layout, responsive and print rules |
| `app.js` | State, persistence, rendering, undo/redo, import/export |

## Notes

The calendar ships pre-loaded with the family's real week (Jashu and Anshu's
classes, dance, swimming and homework blocks, plus the Mom/Dad/Sahi driver
rotation). Everything is editable — the seed data is only a starting point, and
**Reset to sample week** in the Options drawer brings it back.
