import { memoryStore, Player } from "../schema/schema.js";
import { hasDb, pool } from "../config/db.js";

// GET ALL PLAYERS
export async function getAllPlayers(): Promise<Player[]> {

  if (!hasDb) {

    return [...memoryStore.players].sort(
      (a, b) => b.rating - a.rating
    );
  }

  const result = await pool.query(
    "SELECT * FROM players ORDER BY rating DESC"
  );

  return result.rows;
}

// GET PLAYER BY ID
export async function getPlayerById(
  id: number
): Promise<Player | null> {

  if (!hasDb) {

    const player = memoryStore.players.find(
      (p) => p.id === id
    );

    return player || null;
  }

  const result = await pool.query(
    "SELECT * FROM players WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
}

// CREATE PLAYER
export async function createPlayer(
  name: string,
  rating: number
): Promise<Player> {

  if (!hasDb) {

    const player: Player = {
      id: memoryStore.playerNextId++,
      name,
      rating,
      wins: 0,
      losses: 0,
      created_at: new Date().toISOString(),
    };

    memoryStore.players.push(player);

    return player;
  }

  const result = await pool.query(
    `
    INSERT INTO players (name, rating)
    VALUES ($1, $2)
    RETURNING *
    `,
    [name, rating]
  );

  return result.rows[0];
}

// UPDATE PLAYER
export async function updatePlayer(
  id: number,
  name: string,
  rating: number
): Promise<Player | null> {

  if (!hasDb) {

    const index = memoryStore.players.findIndex(
      (p) => p.id === id
    );

    if (index === -1) {
      return null;
    }

    memoryStore.players[index] = {
      ...memoryStore.players[index],
      name,
      rating,
    };

    return memoryStore.players[index];
  }

  const result = await pool.query(
    `
    UPDATE players
    SET name = $1,
        rating = $2
    WHERE id = $3
    RETURNING *
    `,
    [name, rating, id]
  );

  return result.rows[0] || null;
}

// DELETE PLAYER
export async function deletePlayer(
  id: number
): Promise<boolean> {

  if (!hasDb) {

    const index = memoryStore.players.findIndex(
      (p) => p.id === id
    );

    if (index === -1) {
      return false;
    }

    memoryStore.players.splice(index, 1);

    return true;
  }

  const result = await pool.query(
    "DELETE FROM players WHERE id = $1",
    [id]
  );

  return result.rowCount! > 0;
}