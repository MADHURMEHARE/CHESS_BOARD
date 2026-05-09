import * as playerRepo from "../repositories/player.repository.js";

import { Player } from "../schema/schema";

// GET ALL PLAYERS
export async function listPlayers(): Promise<Player[]> {

  return playerRepo.getAllPlayers();
}

// GET PLAYER BY ID
export async function getPlayer(
  id: number
): Promise<Player | null> {

  if (!id) {
    throw new Error("Player ID is required");
  }

  return playerRepo.getPlayerById(id);
}

// CREATE PLAYER
export async function addPlayer(
  name: string,
  rating?: number
): Promise<Player> {

  if (
    !name ||
    typeof name !== "string" ||
    name.trim() === ""
  ) {
    throw new Error(
      "Player name is required"
    );
  }

  return playerRepo.createPlayer(
    name.trim(),
    rating ?? 1200
  );
}

// UPDATE PLAYER
export async function updatePlayer(
  id: number,
  name: string,
  rating: number
): Promise<Player | null> {

  if (!id) {
    throw new Error("Player ID is required");
  }

  if (
    !name ||
    typeof name !== "string" ||
    name.trim() === ""
  ) {
    throw new Error(
      "Player name is required"
    );
  }

  if (!rating || rating < 0) {
    throw new Error(
      "Valid player rating required"
    );
  }

  return playerRepo.updatePlayer(
    id,
    name.trim(),
    rating
  );
}

// DELETE PLAYER
export async function removePlayer(
  id: number
): Promise<boolean> {

  if (!id) {
    throw new Error("Player ID is required");
  }

  return playerRepo.deletePlayer(id);
}