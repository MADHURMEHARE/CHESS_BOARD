# Chess Tournament Platform

Full-stack chess tournament management: player profiles, 10-player knockout circuits with a repechage round, simulated matches with random winners, standings, and podium results. Built with React (Vite), Node.js (Express), and PostgreSQL (works with Neon using `DATABASE_URL`). If no database URL is configured, the API falls back to an in-memory store for local demos.

---

## Features

- **Players:** Create, edit, delete, and list player profiles (name, rating, career W/L stored in the database).
- **Tournaments:** Create a tournament with **exactly 10 players**; add participants from the roster.
- **Match format:** Four rounds — Round 1 (5 pairings), Round 2 (4 pairings after three first-round losers return), Round 3 (2 semi-finals), Round 4 (1 final). Winners are chosen at random for each pairing during simulation.
- **Tracking:** Per-tournament wins, losses, and points; career `wins` / `losses` on each player row are updated when matches are simulated.
- **Rankings:** API returns `rankings` for completed events: 1st and 2nd from the final; 3rd is the semi-finalist with the higher rating (no separate bronze match).
- **Disqualification:** Players eliminated in round 1 (not among the three returners) and all round 2 losers are flagged `is_disqualified` for clear UI separation from finalists and semi-finalists.

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind   |
| Backend  | Node.js, Express, `pg` (no ORM)     |
| Database | PostgreSQL (e.g. Neon) or in-memory |

---

## Architecture (tournament flow)

1. **POST `/api/tournaments`** — Body: `{ "name": string, "playerIds": number[] }` (length 10). Inserts `tournaments` and `tournament_players` rows.
2. **POST `/api/tournaments/:id/simulate`** — Builds rounds in memory, persists `matches`, updates `tournament_players` (points, wins, losses, disqualified flags), updates global `players` wins/losses, sets tournament `status` to `completed`. All DB writes run in a single transaction when using PostgreSQL.
3. **GET `/api/tournaments/:id`** — Returns the tournament, joined players (including `tournament_wins`, `tournament_losses`), ordered `matches`, and `rankings` when status is `completed`.

```text
Round 1: 10 players -> 5 matches -> 5 winners + 5 losers
         3 losers re-enter -> Round 2 pool = 8 players -> 4 matches
Round 3: 4 winners -> 2 semi-finals
Round 4: 2 winners -> 1 final
```

---

## Project structure

```text
CHESS_BOARD/
├── frontend/          # Vite + React UI
├── backend/           # Express API, repositories, services
│   └── schema/        # Table DDL in initDb + shared TS types
└── README.md
```

---

## Setup

### 1. Clone and install

```bash
git clone <your-repository-url>
cd CHESS_BOARD
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment

**Backend** (`backend/.env`):

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
PORT=5000
```

**Frontend** (e.g. `frontend/.env`):

```env
VITE_API_URL=http://localhost:5000
```

Omit `DATABASE_URL` to run the API against the in-memory fallback (useful for quick demos).

### 3. Run

Terminal 1 — API:

```bash
cd backend
npm run dev
```

Terminal 2 — UI (default Vite port is often 5173; check terminal output):

```bash
cd frontend
npm run dev
```

---

## API (tournaments)

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/tournaments` | List tournaments |
| GET | `/api/tournaments/:id` | Detail + players + matches + `rankings` when completed |
| POST | `/api/tournaments` | Create (requires exactly 10 `playerIds`) |
| POST | `/api/tournaments/:id/simulate` | Run random-winner simulation |
| DELETE | `/api/tournaments/:id` | Delete (not allowed while `active`) |

---

## Build

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

---

## Author

Developed by Madhur Mehare

---

## License

MIT License.
