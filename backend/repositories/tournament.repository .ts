import { PoolClient } from "pg";
import { hasDb, pool } from "../config/db.js";
import { memoryStore, Tournament } from "../schema/schema.js";

// Db is either a transaction client or the pool itself (for non-transactional calls)
type Db = PoolClient | typeof pool;

// ---------------------------------------------------------------------------
// Reads — no transaction needed
// ---------------------------------------------------------------------------

export async function getAllTournaments(): Promise<Tournament[]> {
  if (!hasDb) {
    return [...memoryStore.tournaments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  const result = await pool.query("SELECT * FROM tournaments ORDER BY created_at DESC");
  return result.rows;
}

export async function getTournamentById(id: number) {
  if (!hasDb) {
    const tournament = memoryStore.tournaments.find((t) => t.id === id);
    if (!tournament) return null;

    const players = memoryStore.tournament_players
      .filter((tp) => tp.tournament_id === id)
      .map((tp) => {
        const p = memoryStore.players.find((p) => p.id === tp.player_id);
        if (!p) return null;                      // guard: skip orphaned records
        return { ...p, ...tp };
      })
      .filter(Boolean);                           // remove any nulls

    const matches = memoryStore.matches
      .filter((m) => m.tournament_id === id)
      .map((m) => {
        const p1 = memoryStore.players.find((p) => p.id === m.player1_id);
        const p2 = memoryStore.players.find((p) => p.id === m.player2_id);
        const pw = memoryStore.players.find((p) => p.id === m.winner_id);
        return {
          ...m,
          player1_name: p1?.name ?? "Unknown",
          player2_name: p2?.name ?? "Unknown",
          winner_name:  pw?.name ?? null,
        };
      })
      .sort((a, b) => a.round - b.round || a.id - b.id);

    return { ...tournament, players, matches };
  }

  const tournamentResult = await pool.query(
    "SELECT * FROM tournaments WHERE id = $1", [id]
  );
  if (tournamentResult.rows.length === 0) return null;

  const playersResult = await pool.query(
    `SELECT p.*, tp.points, tp.is_disqualified
     FROM players p
     JOIN tournament_players tp ON p.id = tp.player_id
     WHERE tp.tournament_id = $1`,
    [id]
  );

  const matchesResult = await pool.query(
    `SELECT m.*,
       p1.name AS player1_name,
       p2.name AS player2_name,
       pw.name AS winner_name
     FROM matches m
     JOIN players p1 ON m.player1_id = p1.id
     JOIN players p2 ON m.player2_id = p2.id
     LEFT JOIN players pw ON m.winner_id = pw.id
     WHERE m.tournament_id = $1
     ORDER BY m.round ASC, m.id ASC`,
    [id]
  );

  return {
    ...tournamentResult.rows[0],
    players: playersResult.rows,
    matches: matchesResult.rows,
  };
}

export async function getTournamentPlayerIds(tournamentId: number): Promise<number[]> {
  if (!hasDb) {
    return memoryStore.tournament_players
      .filter((tp) => tp.tournament_id === tournamentId)
      .map((tp) => tp.player_id);
  }
  const result = await pool.query(
    "SELECT player_id FROM tournament_players WHERE tournament_id = $1",
    [tournamentId]
  );
  return result.rows.map((r) => r.player_id);
}

// ---------------------------------------------------------------------------
// Writes — accept an optional PoolClient to support transactions
// ---------------------------------------------------------------------------

export async function createTournament(
  name: string,
  playerIds: number[]
): Promise<Tournament> {
  if (!hasDb) {
    const tournament: Tournament = {
      id: memoryStore.tournamentNextId++,
      name,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    memoryStore.tournaments.push(tournament);
    for (const playerId of playerIds) {
      memoryStore.tournament_players.push({
        tournament_id: tournament.id,
        player_id: playerId,
        points: 0,
        is_disqualified: false,
      });
    }
    return tournament;
  }

  // Acquire a dedicated client so BEGIN/INSERT/COMMIT share one connection
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tResult = await client.query(
      "INSERT INTO tournaments (name, status) VALUES ($1, 'pending') RETURNING *",
      [name]
    );
    const tournamentId = tResult.rows[0].id;
    for (const playerId of playerIds) {
      await client.query(
        "INSERT INTO tournament_players (tournament_id, player_id) VALUES ($1, $2)",
        [tournamentId, playerId]
      );
    }
    await client.query("COMMIT");
    return tResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteTournament(id: number): Promise<void> {
  if (!hasDb) {
    const index = memoryStore.tournaments.findIndex((t) => t.id === id);
    if (index !== -1) memoryStore.tournaments.splice(index, 1);
    // schema.ts uses ON DELETE CASCADE in DB; replicate it for memory store
    memoryStore.tournament_players = memoryStore.tournament_players.filter(
      (tp) => tp.tournament_id !== id
    );
    memoryStore.matches = memoryStore.matches.filter(
      (m) => m.tournament_id !== id
    );
    return;
  }
  // FK cascade handles tournament_players and matches
  await pool.query("DELETE FROM tournaments WHERE id = $1", [id]);
}

export async function setTournamentStatus(
  tournamentId: number,
  status: string,
  db: Db = pool
): Promise<void> {
  if (!hasDb) {
    const t = memoryStore.tournaments.find((t) => t.id === tournamentId);
    if (t) t.status = status;
    return;
  }
  await db.query("UPDATE tournaments SET status = $1 WHERE id = $2", [status, tournamentId]);
}

export async function clearTournamentData(
  tournamentId: number,
  db: Db = pool
): Promise<void> {
  if (!hasDb) {
    memoryStore.matches = memoryStore.matches.filter(
      (m) => m.tournament_id !== tournamentId
    );
    memoryStore.tournament_players
      .filter((tp) => tp.tournament_id === tournamentId)
      .forEach((tp) => { tp.points = 0; tp.is_disqualified = false; });
    return;
  }
  await db.query("DELETE FROM matches WHERE tournament_id = $1", [tournamentId]);
  await db.query(
    "UPDATE tournament_players SET points = 0, is_disqualified = FALSE WHERE tournament_id = $1",
    [tournamentId]
  );
}

export async function insertMatch(
  tournamentId: number,
  round: number,
  player1Id: number,
  player2Id: number,
  winnerId: number,
  db: Db = pool
): Promise<void> {
  if (!hasDb) {
    memoryStore.matches.push({
      id: memoryStore.matchNextId++,
      tournament_id: tournamentId,
      round,
      player1_id: player1Id,
      player2_id: player2Id,
      winner_id: winnerId,
      status: "completed",
      created_at: new Date().toISOString(),
    });
    return;
  }
  await db.query(
    `INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, status)
     VALUES ($1, $2, $3, $4, $5, 'completed')`,
    [tournamentId, round, player1Id, player2Id, winnerId]
  );
}

export async function addPointsToPlayer(
  tournamentId: number,
  playerId: number,
  points: number,
  db: Db = pool
): Promise<void> {
  if (!hasDb) {
    const tp = memoryStore.tournament_players.find(
      (tp) => tp.tournament_id === tournamentId && tp.player_id === playerId
    );
    if (tp) tp.points += points;
    return;
  }
  await db.query(
    `UPDATE tournament_players SET points = points + $1
     WHERE tournament_id = $2 AND player_id = $3`,
    [points, tournamentId, playerId]
  );
}