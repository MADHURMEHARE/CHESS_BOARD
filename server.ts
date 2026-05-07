import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let hasDb = !!process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: hasDb ? { rejectUnauthorized: false } : false
});

// In-Memory Fallback Store
const memoryStore = {
  players: [
    { id: 1, name: "Magnus Carlsen", rating: 2850, wins: 0, losses: 0 },
    { id: 2, name: "Hikaru Nakamura", rating: 2800, wins: 0, losses: 0 },
    { id: 3, name: "Fabiano Caruana", rating: 2795, wins: 0, losses: 0 },
    { id: 4, name: "Ding Liren", rating: 2780, wins: 0, losses: 0 },
    { id: 5, name: "Ian Nepomniachtchi", rating: 2770, wins: 0, losses: 0 },
    { id: 6, name: "Alireza Firouzja", rating: 2760, wins: 0, losses: 0 },
    { id: 7, name: "Anish Giri", rating: 2750, wins: 0, losses: 0 },
    { id: 8, name: "Wesley So", rating: 2740, wins: 0, losses: 0 },
    { id: 9, name: "Viswanathan Anand", rating: 2730, wins: 0, losses: 0 },
    { id: 10, name: "Rameshbabu Praggnanandhaa", rating: 2720, wins: 0, losses: 0 }
  ],
  tournaments: [] as any[],
  tournament_players: [] as any[],
  matches: [] as any[],
  playerNextId: 11,
  tournamentNextId: 1,
  matchNextId: 1
};

async function initDb() {
  if (!hasDb || process.env.DATABASE_URL === "undefined" || process.env.DATABASE_URL === "") {
    console.warn("DATABASE_URL not found or invalid. INITIALIZING IN-MEMORY FALLBACK.");
    return;
  }
  
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");
    
    // Players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        rating INTEGER DEFAULT 1200,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tournaments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'pending', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tournament players join table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tournament_players (
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        points FLOAT DEFAULT 0,
        is_disqualified BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (tournament_id, player_id)
      )
    `);

    // Matches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        round INTEGER NOT NULL,
        player1_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        player2_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        winner_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'pending', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log("Database initialized");
  } catch (err) {
    console.error("Database connection failed. Falling back to IN-MEMORY.", err);
    // Force hasDb to false if connection failed so we use memoryStore
    (hasDb as any) = false;
  }
}

async function startServer() {
  await initDb();
  
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Add DB Status Header
  app.use((req, res, next) => {
    res.setHeader('x-db-type', hasDb ? 'neon' : 'local');
    next();
  });

  // API Routes
  
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`API Request: ${req.method} ${req.url}`);
    }
    next();
  });
  
  // Players
  app.get("/api/players", async (req, res) => {
    console.log("Handling /api/players");
    if (!hasDb) {
      return res.json(memoryStore.players.sort((a, b) => b.rating - a.rating));
    }
    try {
      const result = await pool.query("SELECT * FROM players ORDER BY rating DESC");
      res.json(result.rows);
    } catch (err) {
      console.error("DB Query Error:", err);
      res.status(500).json({ error: "Failed to fetch players", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/players", async (req, res) => {
    const { name, rating } = req.body;
    if (!hasDb) {
      const newPlayer = {
        id: memoryStore.playerNextId++,
        name,
        rating: rating || 1200,
        wins: 0,
        losses: 0,
        created_at: new Date().toISOString()
      };
      memoryStore.players.push(newPlayer);
      return res.json(newPlayer);
    }
    try {
      const result = await pool.query(
        "INSERT INTO players (name, rating) VALUES ($1, $2) RETURNING *",
        [name, rating || 1200]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to create player" });
    }
  });

  // Tournaments
  app.get("/api/tournaments", async (req, res) => {
    if (!hasDb) {
      return res.json(memoryStore.tournaments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
    try {
      const result = await pool.query("SELECT * FROM tournaments ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch tournaments" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    const tid = parseInt(req.params.id);
    if (!hasDb) {
      const tournament = memoryStore.tournaments.find(t => t.id === tid);
      if (!tournament) return res.status(404).json({ error: "Tournament not found" });
      
      const players = memoryStore.tournament_players
        .filter(tp => tp.tournament_id === tid)
        .map(tp => {
          const p = memoryStore.players.find(p => p.id === tp.player_id);
          return { ...p, ...tp };
        });
      
      const matches = memoryStore.matches
        .filter(m => m.tournament_id === tid)
        .map(m => {
          const p1 = memoryStore.players.find(p => p.id === m.player1_id);
          const p2 = memoryStore.players.find(p => p.id === m.player2_id);
          const pw = memoryStore.players.find(p => p.id === m.winner_id);
          return {
            ...m,
            player1_name: p1?.name,
            player2_name: p2?.name,
            winner_name: pw?.name
          };
        })
        .sort((a, b) => a.round - b.round || a.id - b.id);

      return res.json({ ...tournament, players, matches });
    }
    try {
      const tournamentResult = await pool.query("SELECT * FROM tournaments WHERE id = $1", [req.params.id]);
      if (tournamentResult.rows.length === 0) return res.status(404).json({ error: "Tournament not found" });
      
      const playersResult = await pool.query(`
        SELECT p.*, tp.points, tp.is_disqualified 
        FROM players p 
        JOIN tournament_players tp ON p.id = tp.player_id 
        WHERE tp.tournament_id = $1
      `, [req.params.id]);
      
      const matchesResult = await pool.query(`
        SELECT m.*, 
          p1.name as player1_name, 
          p2.name as player2_name,
          pw.name as winner_name
        FROM matches m
        JOIN players p1 ON m.player1_id = p1.id
        JOIN players p2 ON m.player2_id = p2.id
        LEFT JOIN players pw ON m.winner_id = pw.id
        WHERE m.tournament_id = $1
        ORDER BY m.round ASC, m.id ASC
      `, [req.params.id]);

      res.json({
        ...tournamentResult.rows[0],
        players: playersResult.rows,
        matches: matchesResult.rows
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch tournament details" });
    }
  });

  app.post("/api/tournaments", async (req, res) => {
    const { name, playerIds } = req.body;
    if (!hasDb) {
      const newTournament = {
        id: memoryStore.tournamentNextId++,
        name,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      memoryStore.tournaments.push(newTournament);
      for (const playerId of playerIds) {
        memoryStore.tournament_players.push({
          tournament_id: newTournament.id,
          player_id: playerId,
          points: 0,
          is_disqualified: false
        });
      }
      return res.json(newTournament);
    }
    try {
      await pool.query("BEGIN");
      
      const tResult = await pool.query(
        "INSERT INTO tournaments (name, status) VALUES ($1, 'pending') RETURNING *",
        [name]
      );
      const tournamentId = tResult.rows[0].id;
      
      for (const playerId of playerIds) {
        await pool.query(
          "INSERT INTO tournament_players (tournament_id, player_id) VALUES ($1, $2)",
          [tournamentId, playerId]
        );
      }
      
      await pool.query("COMMIT");
      res.json(tResult.rows[0]);
    } catch (err) {
      await pool.query("ROLLBACK");
      res.status(500).json({ error: "Failed to create tournament" });
    }
  });

  // Tournament Logic: Simulation
  app.post("/api/tournaments/:id/simulate", async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    
    const simulateLogic = async (tId: number, getPlayers: () => Promise<number[]>, updateT: (status: string) => Promise<void>, clearMatches: () => Promise<void>, updateTP: (pid: number, points: number, dq: boolean) => Promise<void>, addMatch: (data: any) => Promise<void>) => {
      await updateT('active');
      await clearMatches();
      
      let activePlayers = await getPlayers();
      if (activePlayers.length < 10) throw new Error("Requires 10 players");

      activePlayers = activePlayers.sort(() => Math.random() - 0.5);

      // R1
      const r1Winners = [];
      const r1Matches = [];
      for (let i = 0; i < 5; i++) {
        const p1 = activePlayers[i*2];
        const p2 = activePlayers[i*2 + 1];
        const winner = Math.random() > 0.5 ? p1 : p2;
        r1Winners.push(winner);
        r1Matches.push({ p1, p2, winner, round: 1 });
      }

      // R2 (8 players)
      const r1Losers = activePlayers.filter(id => !r1Winners.includes(id));
      const luckyLosers = r1Losers.sort(() => Math.random() - 0.5).slice(0, 3);
      const r2Pool = [...r1Winners, ...luckyLosers].sort(() => Math.random() - 0.5);
      const r2Winners = [];
      const r2Matches = [];
      for (let i = 0; i < 4; i++) {
        const p1 = r2Pool[i*2];
        const p2 = r2Pool[i*2 + 1];
        const winner = Math.random() > 0.5 ? p1 : p2;
        r2Winners.push(winner);
        r2Matches.push({ p1, p2, winner, round: 2 });
      }

      // R3 (4 players)
      const r3Winners = [];
      const r3Matches = [];
      for (let i = 0; i < 2; i++) {
        const p1 = r2Winners[i*2];
        const p2 = r2Winners[i*2 + 1];
        const winner = Math.random() > 0.5 ? p1 : p2;
        r3Winners.push(winner);
        r3Matches.push({ p1, p2, winner, round: 3 });
      }

      // R4 (2 players)
      const p1 = r3Winners[0];
      const p2 = r3Winners[1];
      const winner = Math.random() > 0.5 ? p1 : p2;
      const r4Matches = [{ p1, p2, winner, round: 4 }];

      const all = [...r1Matches, ...r2Matches, ...r3Matches, ...r4Matches];
      for (const m of all) {
        await addMatch(m);
        await updateTP(m.winner, 1, false);
        const loser = m.winner === m.p1 ? m.p2 : m.p1;
        await updateTP(loser, 0, true);
      }
      await updateT('completed');
    };

    if (!hasDb) {
      try {
        await simulateLogic(
          tournamentId,
          async () => memoryStore.tournament_players.filter(tp => tp.tournament_id === tournamentId).map(tp => tp.player_id),
          async (s) => { memoryStore.tournaments.find(t => t.id === tournamentId)!.status = s; },
          async () => { memoryStore.matches = memoryStore.matches.filter(m => m.tournament_id !== tournamentId); },
          async (pid, pts, dq) => {
            const tp = memoryStore.tournament_players.find(tp => tp.tournament_id === tournamentId && tp.player_id === pid);
            if (tp) {
              tp.points += pts;
              if (dq) tp.is_disqualified = true;
            }
          },
          async (m) => {
            memoryStore.matches.push({
              id: memoryStore.matchNextId++,
              tournament_id: tournamentId,
              round: m.round,
              player1_id: m.p1,
              player2_id: m.p2,
              winner_id: m.winner,
              status: 'completed',
              created_at: new Date().toISOString()
            });
          }
        );
        return res.json({ message: "Simulated in-memory" });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    try {
      await pool.query("BEGIN");
      await simulateLogic(
        tournamentId,
        async () => (await pool.query("SELECT player_id FROM tournament_players WHERE tournament_id = $1", [tournamentId])).rows.map(r => r.player_id),
        async (s) => { await pool.query("UPDATE tournaments SET status = $1 WHERE id = $2", [s, tournamentId]); },
        async () => { 
          await pool.query("DELETE FROM matches WHERE tournament_id = $1", [tournamentId]);
          await pool.query("UPDATE tournament_players SET points = 0, is_disqualified = FALSE WHERE tournament_id = $1", [tournamentId]);
        },
        async (pid, pts, dq) => {
          await pool.query("UPDATE tournament_players SET points = points + $1, is_disqualified = $2 WHERE tournament_id = $3 AND player_id = $4", [pts, dq, tournamentId, pid]);
        },
        async (m) => {
          await pool.query("INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, status) VALUES ($1, $2, $3, $4, $5, 'completed')", [tournamentId, m.round, m.p1, m.p2, m.winner]);
        }
      );
      await pool.query("COMMIT");
      res.json({ message: "Simulation completed" });
    } catch (err) {
      await pool.query("ROLLBACK");
      res.status(500).json({ error: "Simulation failed" });
    }
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
