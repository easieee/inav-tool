# TechScheduler — Technician Scheduling System

A web-based scheduling system for technicians that uses **Google Sheets** as the database and **Google OAuth** for authentication.

---

## Features

- **Dashboard** — stats bar (scheduled/available today) + 7-day Gantt calendar with hover tooltips
- **Technician Panel** — add technicians, view job stats and points per technician
- **Job Order Panel** — create/edit/delete jobs, mark done, track history
- **Back-Job System** — promote any history entry to a Back-Job; points auto-adjusted
- **Points System** — +5 pts for completed jobs, −2 pts for original tech on back-jobs, +5 pts for completing back-jobs
- **Google Sheets DB** — all data lives in your own spreadsheet; no backend needed

---

## Quick Setup (localhost)

### Step 1 — Install Node.js
Download and install [Node.js 20+](https://nodejs.org/).

### Step 2 — Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a **new blank spreadsheet**.
2. At the bottom, rename the default tab to **`Technicians`**.
3. Add two more tabs: **`JobOrders`** and **`JobHistory`**.
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  <<<THIS_PART>>>  /edit
   ```
5. Leave the sheets empty — the app will add headers automatically on first login.

### Step 3 — Set up Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Enable the **Google Sheets API**:
   - Navigate to **APIs & Services → Library**
   - Search for "Google Sheets API" and click **Enable**
4. Create OAuth credentials:
   - Navigate to **APIs & Services → Credentials**
   - Click **+ Create Credentials → OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `TechScheduler`
   - Under **Authorized JavaScript origins**, add:
     ```
     http://localhost:3000
     ```
   - Click **Create**
5. Copy the **Client ID** (looks like `123456789-xxx.apps.googleusercontent.com`).
6. Set up the **OAuth Consent Screen** (if prompted):
   - User type: **External** (for testing) or **Internal** (for Google Workspace)
   - App name: `TechScheduler`
   - Add your email as a test user (if External)
   - Add scopes: `openid`, `profile`, `email`, and `https://www.googleapis.com/auth/spreadsheets`

### Step 4 — Configure environment variables

In the project root, copy `.env.example` to `.env`:

```
cp .env.example .env
```

Then edit `.env` and fill in your values:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_SPREADSHEET_ID=your-spreadsheet-id
```

### Step 5 — Install dependencies and run

```bash
cd Coding/technician-scheduler
npm install
npm run dev
```

Open your browser at **http://localhost:3000**

---

## Usage Guide

### Logging In
- Click **Sign in with Google** and authorize the app.
- The app requests permission to access Google Sheets on your behalf — data only goes to the spreadsheet you configured.

### Dashboard
- **Stats bar** at the top shows how many technicians are scheduled vs. available today.
- **Calendar** shows a 7-day Gantt view starting from today. Hover any colored block to see full job details.

### Technicians
- Click **Add Technician** to register a new technician.
- Click any technician card to see their stats: points, jobs completed, back-jobs.

### Job Orders
- Click **New Job** to create a job order (assign technician(s), date, time, location, client, device).
- **Mark Done** — moves the job to history and awards **+5 points** to each assigned technician.
- **Edit / Delete** are available on all active jobs.

### Back-Jobs
- In the **Job History** section, click **Create Back-Job** on any completed entry.
- Choose technician(s) for the back-job and set the new date/time.
- Original technicians receive **−2 points** when a back-job is raised.
- When the back-job is marked done, assigned technicians receive **+5 points**.

---

## Points System Summary

| Event | Points |
|---|---|
| Complete a job order | +5 per assigned technician |
| Your job becomes a back-job | −2 per original technician |
| Complete a back-job | +5 per assigned technician |

---

## Data Storage (Google Sheets)

| Sheet Tab | What's Stored |
|---|---|
| `Technicians` | id, name, email, phone, points, createdAt |
| `JobOrders` | Active jobs + back-jobs in progress |
| `JobHistory` | All completed jobs and back-jobs (audit log) |

Headers are created automatically on first login.

---

## Notes & Limitations

- **Session duration** — Google OAuth tokens expire after ~1 hour. Simply sign out and sign back in.
- **Concurrent edits** — If two users edit simultaneously, the last write wins (Google Sheets API limitation without a lock mechanism).
- **Deleted rows** — Deleted job entries are cleared (cells emptied) rather than removed, to keep row indexing stable. You can periodically clean empty rows from the sheet manually.
- **Build for production** — Run `npm run build` to get a static `/dist` folder you can host anywhere.

---

## Tech Stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [@react-oauth/google](https://github.com/MomenSherif/react-oauth) — Google Sign-In
- [Google Sheets API v4](https://developers.google.com/sheets/api) — Database
- [date-fns](https://date-fns.org/) — Date utilities
- [lucide-react](https://lucide.dev/) — Icons
- [react-hot-toast](https://react-hot-toast.com/) — Notifications
