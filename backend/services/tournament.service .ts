// services/tournament.service.ts

import type { PoolClient } from "pg";
import { hasDb, pool } from "../config/db.js";

import * as repo from "../repositories/tournament.repository .js";
import { getTournamentCountRepo } from "../repositories/tournament.repository .js";
import * as playerRepo from "../repositories/player.repository.js";

export type PodiumEntry = {
  place: number;
  player_id: number;
  name: string;
  rating: number;
};

function computePodium(
  matches: {
    round: number;
    player1_id: number;
    player2_id: number;
    winner_id: number | null;
  }[],
  players: { id: number; name: string; rating: number }[]
): PodiumEntry[] | null {
  const final = matches.find((m) => m.round === 4);
  if (!final?.winner_id) return null;

  const find = (pid: number) => {
    const p = players.find((x) => x.id === pid);
    return p
      ? { player_id: p.id, name: p.name, rating: p.rating }
      : null;
  };

  const secondId =
    final.player1_id === final.winner_id
      ? final.player2_id
      : final.player1_id;

  const semis = matches.filter((m) => m.round === 3);
  if (semis.length < 2) return null;

  const semiLosers = semis.map((m) =>
    m.player1_id === m.winner_id ? m.player2_id : m.player1_id
  );
  const s0 = find(semiLosers[0]);
  const s1 = find(semiLosers[1]);
  if (!s0 || !s1) return null;

  const third = s0.rating >= s1.rating ? s0 : s1;
  const first = find(final.winner_id);
  const second = find(secondId);
  if (!first || !second) return null;

  return [
    { place: 1, ...first },
    { place: 2, ...second },
    { place: 3, ...third },
  ];
}

export async function getTournamentCountService() {
  return await getTournamentCountRepo();
}
// CUSTOM ERRORS
class ValidationError extends Error {

  constructor(message: string) {
    super(message);

    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {

  constructor(entity: string) {
    super(`${entity} not found`);

    this.name = "NotFoundError";
  }
}

// ---------------------------------------------------------------------------
// TOURNAMENT CRUD
// ---------------------------------------------------------------------------

export async function listTournaments() {

  return repo.getAllTournaments();
}

export async function getTournament(id: number) {
  const tournament = await repo.getTournamentById(id);

  if (!tournament) {
    throw new NotFoundError("Tournament");
  }

  const rankings =
    tournament.status === "completed" &&
    Array.isArray(tournament.matches) &&
    tournament.matches.length > 0
      ? computePodium(tournament.matches, tournament.players)
      : null;

  return { ...tournament, rankings };
}

export async function createTournament(
  name: string,
  playerIds: number[]
) {

  if (
    !name ||
    typeof name !== "string" ||
    name.trim() === ""
  ) {

    throw new ValidationError(
      "Tournament name is required"
    );
  }

  if (!Array.isArray(playerIds) || playerIds.length !== 10) {
    throw new ValidationError(
      "Tournament requires exactly 10 players (round 1: five matches; three returners join round 2)"
    );
  }

  return repo.createTournament(
    name.trim(),
    playerIds
  );
}

export async function deleteTournament(
  id: number
): Promise<void> {

  const tournament =
    await repo.getTournamentById(id);

  if (!tournament) {

    throw new NotFoundError(
      "Tournament"
    );
  }

  if (
    tournament.status === "active"
  ) {

    throw new ValidationError(
      "Cannot delete an active tournament"
    );
  }

  await repo.deleteTournament(id);
}

// ---------------------------------------------------------------------------
// SIMULATION
// ---------------------------------------------------------------------------

interface MatchRecord {
  p1: number;
  p2: number;
  winner: number;
  loser: number;
  round: number;
}

function pickWinner(
  a: number,
  b: number
): number {

  return Math.random() > 0.5
    ? a
    : b;
}

// BUILD MATCHES
function buildRound(
  players: number[],
  round: number
): MatchRecord[] {

  const shuffled =
    [...players].sort(
      () => Math.random() - 0.5
    );

  const matches: MatchRecord[] = [];

  for (
    let i = 0;
    i < Math.floor(shuffled.length / 2);
    i++
  ) {
    const p1 = shuffled[i * 2];
    const p2 = shuffled[i * 2 + 1];

    const winner = pickWinner(p1, p2);
    matches.push({
      p1,
      p2,
      winner,
      loser: winner === p1 ? p2 : p1,
      round,
    });
  }

  return matches;
}

// ---------------------------------------------------------------------------
// SIMULATE TOURNAMENT
// ---------------------------------------------------------------------------

export async function simulateTournament(
  tournamentId: number
): Promise<void> {

  const tournament =
    await repo.getTournamentById(
      tournamentId
    );

  if (!tournament) {

    throw new NotFoundError(
      "Tournament"
    );
  }

  if (
    tournament.status ===
    "completed"
  ) {

    throw new ValidationError(
      "Tournament has already been completed"
    );
  }

  const allPlayerIds =
    await repo.getTournamentPlayerIds(
      tournamentId
    );

  if (allPlayerIds.length !== 10) {
    throw new ValidationError("Tournament requires exactly 10 players");
  }

  // ROUND 1
  const r1Matches =
    buildRound(allPlayerIds, 1);

  const r1Winners =
    r1Matches.map(
      (m) => m.winner
    );

  const r1Losers =
    allPlayerIds.filter(
      (id: number) =>
        !r1Winners.includes(id)
    );

  // LUCKY LOSERS
  const luckyLosers =
    [...r1Losers]
      .sort(
        () => Math.random() - 0.5
      )
      .slice(0, 3);

  // ROUND 2
  const r2Pool = [
    ...r1Winners,
    ...luckyLosers,
  ];

  const r2Matches =
    buildRound(r2Pool, 2);

  // ROUND 3
  const r3Matches =
    buildRound(
      r2Matches.map(
        (m) => m.winner
      ),
      3
    );

  // ROUND 4
  const r4Matches =
    buildRound(
      r3Matches.map(
        (m) => m.winner
      ),
      4
    );

  const allMatches = [
    ...r1Matches,
    ...r2Matches,
    ...r3Matches,
    ...r4Matches,
  ];

  const dqRound1 = r1Losers.filter((id) => !luckyLosers.includes(id));
  const dqRound2 = r2Matches.map((m) => m.loser);
  const disqualifiedIds = [...new Set([...dqRound1, ...dqRound2])];

  async function persistMatches(db?: PoolClient): Promise<void> {
    for (const m of allMatches) {
      if (db) {
        await repo.insertMatch(
          tournamentId,
          m.round,
          m.p1,
          m.p2,
          m.winner,
          db
        );
        await repo.recordTournamentMatchOutcome(
          tournamentId,
          m.winner,
          m.loser,
          db
        );
        await playerRepo.incrementPlayerWinLoss(m.winner, m.loser, db);
      } else {
        await repo.insertMatch(
          tournamentId,
          m.round,
          m.p1,
          m.p2,
          m.winner
        );
        await repo.recordTournamentMatchOutcome(
          tournamentId,
          m.winner,
          m.loser
        );
        await playerRepo.incrementPlayerWinLoss(m.winner, m.loser);
      }
    }
    if (db) {
      await repo.markPlayersDisqualified(tournamentId, disqualifiedIds, db);
    } else {
      await repo.markPlayersDisqualified(tournamentId, disqualifiedIds);
    }
  }

  if (hasDb) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await repo.setTournamentStatus(tournamentId, "active", client);
      await repo.clearTournamentData(tournamentId, client);
      await persistMatches(client);
      await repo.setTournamentStatus(tournamentId, "completed", client);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } else {
    repo.setTournamentStatus(tournamentId, "active");
    repo.clearTournamentData(tournamentId);
    await persistMatches();
    repo.setTournamentStatus(tournamentId, "completed");
  }
}