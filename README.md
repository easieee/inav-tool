# TechScheduler — Technician Scheduling System

A web-based scheduling system for field technicians. Uses **Google Sheets** as the database and **Google OAuth** for authentication. No backend server required — the browser talks directly to Google's APIs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | **React 18** (via Vite 5) |
| Language | **JavaScript (JSX)** — no TypeScript |
| Styling | **Tailwind CSS 3** (utility-first, light theme) |
| Auth | **Google OAuth 2.0** via `@react-oauth/google` |
| Database | **Google Sheets API v4** (no SQL, no backend) |
| Date handling | **date-fns 3** |
| Icons | **lucide-react** |
| Notifications | **react-hot-toast** |
| Build tool | **Vite 5** |
| Deployment | **Netlify** (static hosting, auto-deploy from GitHub) |

---

## Project Structure

```
src/
├── main.jsx                  # App entry — wraps everything in GoogleOAuthProvider
├── App.jsx                   # Root layout — renders TopBar + all panels + modals
├── index.css                 # Global styles + zoom scale
│
├── context/
│   └── AppContext.jsx         # Global state + all Google Sheets CRUD + audit logs
│
├── lib/
│   ├── sheetsAPI.js           # Google Sheets API v4 wrapper (read/write/delete rows)
│   └── utils.js               # generateId(), formatTime(), todayStr()
│
└── components/
    ├── TopBar.jsx             # Header bar — stats, date nav, sign-in/sign-out
    ├── CalendarPanel.jsx      # 24-hour Gantt calendar for selected date
    ├── TechPerformancePanel.jsx  # Technician list with points + job counts
    ├── DispatchQueue.jsx      # Active job orders — edit / delete / mark done
    ├── AuditLog.jsx           # Persistent activity log panel
    ├── JobHistoryPanel.jsx    # Completed jobs — create back-job button
    ├── CreateJobModal.jsx     # Modal — create new job order
    ├── EditJobModal.jsx       # Modal — edit existing job order
    ├── AddTechnicianModal.jsx # Modal — register a new technician
    ├── DeleteConfirmModal.jsx # Modal — confirm job deletion
    └── BackJobModal.jsx       # Modal — create a back-job from history
```

---

## How the Workflow Works

### 1. Authentication
- The user clicks **Sign in with Google** in the TopBar.
- Google OAuth issues a short-lived **access token** (valid ~1 hour).
- The token and user profile are saved to `localStorage` so the session survives page refreshes.
- On reload, the saved token is used to silently reload data without re-login. If the token has expired, the user is prompted to sign in again.

### 2. Data Storage (Google Sheets as Database)
There is no SQL database or backend. All data lives in **one Google Spreadsheet** with four tabs:

| Sheet Tab | Contents |
|---|---|
| `Technicians` | id, name, email, phone, points, createdAt |
| `JobOrders` | id, title, client, location, device, date, times, technicianIds, status, ... |
| `JobHistory` | Same as JobOrders + completedAt (jobs moved here when marked Done) |
| `AuditLogs` | id, type, title, description, timestamp, user, userEmail |

- **Read** — `getAllRows()` fetches rows via `GET /values/{sheet}` and maps them to objects using the header row.
- **Write** — `appendRow()` calls `POST /values/{sheet}:append`.
- **Update** — `updateRowById()` finds the row by `id` column then calls `PUT /values/{sheet}!A{n}:{Z}{n}`.
- **Delete** — `deleteRowById()` is a soft-delete: it clears all cells in the row so the row ID is no longer found on read.
- All tabs are **auto-created** with correct headers on first sign-in via `initializeSheets()`.

### 3. Points System
| Event | Effect |
|---|---|
| Job marked **Done** | +5 pts to every assigned technician |
| Done job becomes a **Back-Job** | −2 pts to each original technician |
| Back-Job marked **Done** | +5 pts to every assigned technician |

### 4. Audit Logging
- Every action (create job, mark done, add tech, back-job, login) calls `addLog()`.
- Each log entry is written to the `AuditLogs` sheet in real time.
- On next load, all logs are fetched from the sheet so every user sees the full history.

### 5. Deployment
- Code is hosted on **GitHub** (`easieee/technician-scheduler`).
- Every `git push` to `master` triggers an automatic **Netlify** build (`npm run build` → `dist/`).
- Environment variables (`VITE_GOOGLE_CLIENT_ID`, `VITE_SPREADSHEET_ID`) are set in Netlify — never committed to git.
- The custom domain `acedev.space` points to Netlify via DNS.

---

## Quick Setup (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Create .env in project root
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_SPREADSHEET_ID=your-spreadsheet-id

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

**Google Cloud Console requirements:**
- Enable **Google Sheets API**
- Create an **OAuth 2.0 Client ID** (Web application)
- Add `http://localhost:3000` (dev) and `https://acedev.space` (prod) to **Authorized JavaScript Origins**
- Add your Google account as a test user on the OAuth consent screen


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
