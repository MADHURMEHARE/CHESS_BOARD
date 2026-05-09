import { Request, Response } from "express";
import * as playerService from "../services/player.service.js";

export async function listPlayers(req: Request, res: Response): Promise<void> {
  try {
    const players = await playerService.listPlayers();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch players" });
  }
}

export async function getPlayer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
       res.status(400).json({ error: "Invalid player ID" });
       return;
    }
    const player = await playerService.getPlayer(id);
    if (!player) {
       res.status(404).json({ error: "Player not found" });
       return;
    }
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch player" });
  }
}

export async function addPlayer(req: Request, res: Response): Promise<void> {
  try {
    const { name, rating } = req.body;
    const player = await playerService.addPlayer(name, rating);
    res.status(201).json(player);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function updatePlayer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
       res.status(400).json({ error: "Invalid player ID" });
       return;
    }
    const { name, rating } = req.body;
    const player = await playerService.updatePlayer(id, name, rating);
    if (!player) {
       res.status(404).json({ error: "Player not found" });
       return;
    }
    res.json(player);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function removePlayer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
       res.status(400).json({ error: "Invalid player ID" });
       return;
    }
    const deleted = await playerService.removePlayer(id);
    if (!deleted) {
       res.status(404).json({ error: "Player not found" });
       return;
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}