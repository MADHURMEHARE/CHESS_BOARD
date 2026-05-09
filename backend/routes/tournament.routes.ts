import { Router } from "express";
import * as tournamentController from "../controllers/tournament.controller.js";

const router = Router();

router.get("/",             tournamentController.listTournaments);
router.get("/:id",          tournamentController.getTournament);
router.post("/",            tournamentController.createTournament);
router.post("/:id/simulate", tournamentController.simulateTournament);
router.delete("/:id",       tournamentController.deleteTournament);

export default router;