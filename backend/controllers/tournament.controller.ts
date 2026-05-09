import { Request, Response } from "express";
import * as tournamentService from "../services/tournament.service .js";

// Reusable ID parser — keeps handlers clean
function parseId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}

export async function listTournaments(_req: Request, res: Response): Promise<void> {
  try {
    const tournaments = await tournamentService.listTournaments();
    res.json(tournaments);
  } catch {
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
}

export async function getTournament(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid tournament ID" });
    return;
  }
  try {
    const tournament = await tournamentService.getTournament(id);
    res.json(tournament);
  } catch (err: any) {
    // Service throws typed errors — map them to status codes here, not in the router
    if (err.message === "Tournament not found") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Failed to fetch tournament" });
    }
  }
}

export async function createTournament(req: Request, res: Response): Promise<void> {
  const { name, playerIds } = req.body;
  try {
    const tournament = await tournamentService.createTournament(name, playerIds);
    res.status(201).json(tournament);           // 201 Created, not 200
  } catch (err: any) {
    if (err.message?.includes("required") || err.message?.includes("Invalid")) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Failed to create tournament" });
    }
  }
}

export async function simulateTournament(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid tournament ID" });
    return;
  }
  try {
    await tournamentService.simulateTournament(id);
    res.json({ message: "Simulation completed" });
  } catch (err: any) {
    if (err.message?.includes("requires") || err.message?.includes("already")) {
      res.status(400).json({ error: err.message });
    } else if (err.message === "Tournament not found") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Simulation failed" });
    }
  }
}

export async function deleteTournament(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid tournament ID" });
    return;
  }
  try {
    await tournamentService.deleteTournament(id);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === "Tournament not found") {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Failed to delete tournament" });
    }
  }
}