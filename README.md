# MoneyMetric

Minimal-friction personal expense tracker. Double-tap the back of your iPhone → an iOS
Shortcut pops native dropdowns → it POSTs to an API → the expense lands in a database.
No native iOS app, no Mac required.

```
Double back-tap
   → iOS Shortcut (runs on the phone)
       → amount  (number keypad)
       → category (dropdown)
       → account  (dropdown → derives card/UPI/cash)
       → note     (optional)
   → POST /api/expense   ← only network call
   → "Saved ✅" notification
```

## Stack

| Piece | Tech |
|---|---|
| Frontend (analytics dashboard, later) | Vite + React + TypeScript (`src/`) |
| API | Vercel Serverless Functions (`api/`) — plain Node handlers |
| Shared config (single source of truth) | `lib/options.js` |
| Database | CockroachDB Serverless (Postgres-compatible) |
| Hosting | Vercel (one deploy for both frontend + API) |
| Logging trigger | iPhone Back Tap → iOS Shortcut |

## Project layout

```
api/expense.ts      POST endpoint: validate → insert
api/options.ts      GET category/account lists
lib/options.js      categories + accounts (EDIT THIS) — used by API, seeder, frontend
lib/db.ts           CockroachDB client (postgres.js)
db/schema.sql       table definitions
scripts/db-setup.mjs  creates schema + seeds from lib/options.js
src/                React dashboard (placeholder)
```

---

## Setup

### Prerequisites
- Node.js **>= 20.6** (`node -v`)
- A free [CockroachDB Serverless](https://cockroachlabs.cloud) account
- A free [Vercel](https://vercel.com) account + a GitHub repo
- iPhone on iOS 14+ (Back Tap needs iPhone 8 or newer)

### 1. Install
```bash
npm install
```

### 2. Database
1. In CockroachDB Cloud, create a **Serverless** cluster (free).
2. Click **Connect → General connection string** and copy it.
3. Create your env file and paste it in:
   ```bash
   cp .env.example .env
   # edit .env, set DATABASE_URL=...
   ```
4. Create tables + seed your categories/accounts:
   ```bash
   npm run db:setup
   ```
   Re-run this any time you edit `lib/options.js`.

### 3. Make the accounts yours
Open `lib/options.js` and replace the placeholder `ACCOUNTS` with your real cards / UPI
handles (keep the `type` accurate — it sets card/upi/cash automatically). Tweak
`CATEGORIES` if you like. Then `npm run db:setup` again.

### 4. Run locally
```bash
npm run dev        # frontend only (http://localhost:5173)
npm run dev:full   # frontend + /api together via `vercel dev`
```
Test the endpoint:
```bash
curl -X POST http://localhost:3000/api/expense \
  -H "Content-Type: application/json" \
  -d '{"amount":450,"category":"dining","account":"UPI (GPay)","note":"swiggy"}'
# → {"ok":true,"id":"...","message":"Saved ✅ ₹450 dining"}
```

### 5. Deploy
1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → import the repo** (it auto-detects Vite).
3. Add an env var **`DATABASE_URL`** (same value as your `.env`).
4. Deploy. Your endpoint is now `https://YOUR-APP.vercel.app/api/expense`.

---

## Build the iOS Shortcut (one-time, ~10 min)

Open the **Shortcuts** app → **+** (new shortcut) → name it **Log Expense**. Add these
actions in order (tap the search bar at the bottom to find each one):

1. **Ask for Input**
   - *Input Type:* **Number**, *Prompt:* `Amount`
   - (rename its output variable to **Amount**)
2. **List** — add your categories as items: `rent`, `bills`, `groceries`, `transport`,
   `health`, `dining`, `shopping`, `entertainment`, `subscriptions`, `misc`
3. **Choose from List** — *from* the List above, *Prompt:* `Category`
   - (rename output to **Category**)
4. **List** — add your account names exactly as in `lib/options.js`
   (e.g. `HDFC Credit Card`, `ICICI Amazon Pay`, `UPI (GPay)`, `Cash`)
5. **Choose from List** — *from* that List, *Prompt:* `Account`
   - (rename output to **Account**)
6. **Ask for Input** — *Input Type:* **Text**, *Prompt:* `Note (optional)`
   - (rename output to **Note**)
7. **Get Contents of URL**
   - *URL:* `https://YOUR-APP.vercel.app/api/expense`
   - *Method:* **POST**
   - *Headers:* `Content-Type` = `application/json`
   - *Request Body:* **JSON**, add four fields:
     - `amount` → (Number) the **Amount** variable
     - `category` → (Text) the **Category** variable
     - `account` → (Text) the **Account** variable
     - `note` → (Text) the **Note** variable
8. *(optional confirmation)* **Get Dictionary Value** — *key* `message`, *from* Contents of URL
9. **Show Notification** — show the `message` value (or just type `Saved ✅`)

### Bind it to Back Tap
**Settings → Accessibility → Touch → Back Tap → Double Tap → Log Expense**

Now double-tap the back of the phone (unlocked) → fill the dropdowns → done.

> Tip: the lists in steps 2 & 4 are typed into the Shortcut (fast). When you add a card or
> category later, update both `lib/options.js` *and* the Shortcut list. (A future version can
> fetch them live from `GET /api/options` so you only edit one place.)

---

## API reference

**`POST /api/expense`**
```json
{ "amount": 450, "category": "dining", "account": "UPI (GPay)", "note": "swiggy" }
```
- `amount` (required, > 0), `category` (required, must exist in `lib/options.js`)
- `account` (optional, derives `payment_method`), `note` (optional)
- `type` (optional: `expense` | `income` | `refund`), `occurred_at` (optional ISO timestamp)

**`GET /api/options`** → `{ "categories": [...], "accounts": [...] }`

---

## Notes & roadmap
- **Auth:** none yet (personal, single-user). To add later: check an `Authorization: Bearer`
  header in `api/expense.ts` and send it from the Shortcut.
- **Schema** already includes `merchant`, `tags`, `budgets`, soft-delete, and `user_id` so
  future features (top-merchant reports, trip tags, budgets, multi-user) need no migration.
- **Next up:** the dashboard in `src/` — monthly totals, category breakdown, and the
  essential-vs-discretionary (50/30/20) split.
