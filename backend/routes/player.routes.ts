import express from "express";
import * as playerController from "../controllers/player.controller.js";

const router = express.Router();

router.get("/",      playerController.listPlayers);
router.get("/:id",   playerController.getPlayer);
router.post("/",     playerController.addPlayer);
router.put("/:id",   playerController.updatePlayer);
router.delete("/:id", playerController.removePlayer);

export default router;