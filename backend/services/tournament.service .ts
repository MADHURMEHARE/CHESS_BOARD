// services/tournament.service.ts

import { hasDb, pool } from "../config/db.js";

import * as repo from "../repositories/tournament.repository .js";

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

export async function getTournament(
  id: number
) {

  const tournament =
    await repo.getTournamentById(id);

  if (!tournament) {

    throw new NotFoundError(
      "Tournament"
    );
  }

  return tournament;
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

  if (
    !Array.isArray(playerIds) ||
    playerIds.length < 10
  ) {

    throw new ValidationError(
      "Tournament requires at least 10 players"
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

    matches.push({
      p1,
      p2,
      winner: pickWinner(p1, p2),
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

  if (allPlayerIds.length < 10) {

    throw new ValidationError(
      "Tournament requires at least 10 players"
    );
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

  // -----------------------------------------------------------------------
  // DATABASE MODE
  // -----------------------------------------------------------------------

  if (hasDb) {

    const client =
      await pool.connect();

    try {

      await client.query("BEGIN");

      await repo.setTournamentStatus(
        tournamentId,
        "active",
        client
      );

      await repo.clearTournamentData(
        tournamentId,
        client
      );

      for (const m of allMatches) {

        await repo.insertMatch(
          tournamentId,
          m.round,
          m.p1,
          m.p2,
          m.winner,
          client
        );

        await repo.addPointsToPlayer(
          tournamentId,
          m.winner,
          1,
          client
        );
      }

      await repo.setTournamentStatus(
        tournamentId,
        "completed",
        client
      );

      await client.query("COMMIT");

    } catch (err) {

      await client.query(
        "ROLLBACK"
      );

      throw err;

    } finally {

      client.release();
    }

  } else {

    // ---------------------------------------------------------------------
    // MEMORY MODE
    // ---------------------------------------------------------------------

    repo.setTournamentStatus(
      tournamentId,
      "active"
    );

    repo.clearTournamentData(
      tournamentId
    );

    for (const m of allMatches) {

      repo.insertMatch(
        tournamentId,
        m.round,
        m.p1,
        m.p2,
        m.winner
      );

      repo.addPointsToPlayer(
        tournamentId,
        m.winner,
        1
      );
    }

    repo.setTournamentStatus(
      tournamentId,
      "completed"
    );
  }
}