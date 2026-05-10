
import { hasDb,pool} from "../config/db.js";

// ---------------------------------------------------------------------------
// In-Memory Fallback Store
// ---------------------------------------------------------------------------

export interface Player {
  id: number;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  created_at?: string;
}

export interface Tournament {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

export interface TournamentPlayer {
  tournament_id: number;
  player_id: number;
  points: number;
  is_disqualified: boolean;
}

export interface Match {
  id: number;
  tournament_id: number;
  round: number;
  player1_id: number;
  player2_id: number;
  winner_id: number | null;
  status: string;
  created_at: string;
}

export const memoryStore = {
  players: [
    { id: 1, name: "Magnus Carlsen",   rating: 2850, wins: 0, losses: 0 },
    { id: 2, name: "Hikaru Nakamura",  rating: 2800, wins: 0, losses: 0 },
    { id: 3, name: "Ding Liren",       rating: 2790, wins: 0, losses: 0 },
    { id: 4, name: "Ian Nepomniachtchi", rating: 2780, wins: 0, losses: 0 },
    { id: 5, name: "Alireza Firouzja", rating: 2770, wins: 0, losses: 0 },
  ] as Player[],
  tournaments: [] as Tournament[],
  tournament_players: [] as TournamentPlayer[],
  matches: [] as Match[],
  playerNextId: 11,
  tournamentNextId: 1,
  matchNextId: 1,
};

// ---------------------------------------------------------------------------
// DB Initialiser
// ---------------------------------------------------------------------------

export async function initDb(): Promise<void> {
  if (!hasDb) {
    console.warn("DATABASE_URL not found or invalid. INITIALIZING IN-MEMORY FALLBACK.");
    return;
  }

  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");

    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id         SERIAL PRIMARY KEY,
        name       TEXT    NOT NULL,
        rating     INTEGER DEFAULT 1200,
        wins       INTEGER DEFAULT 0,
        losses     INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        status     TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tournament_players (
        tournament_id   INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        player_id       INTEGER REFERENCES players(id)     ON DELETE CASCADE,
        points          FLOAT   DEFAULT 0,
        is_disqualified BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (tournament_id, player_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id            SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        round         INTEGER NOT NULL,
        player1_id    INTEGER REFERENCES players(id) ON DELETE CASCADE,
        player2_id    INTEGER REFERENCES players(id) ON DELETE CASCADE,
        winner_id     INTEGER REFERENCES players(id) ON DELETE SET NULL,
        status        TEXT DEFAULT 'pending',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log("Database initialised");
  } catch (err) {
    console.error("Database connection failed. Falling back to IN-MEMORY.", err);
    (hasDb as any) = false;
  }
}