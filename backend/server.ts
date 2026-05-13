import dotenv from "dotenv";
import fs from "fs";
dotenv.config({
  path: ".env",
});
console.log(fs.existsSync(".env"));
import express from "express";
import cors from "cors";

import { dbState } from "./config/db.js";
import { initDb } from "./schema/schema.js";

import playerRoutes from "./routes/player.routes.js";
import tournamentRoutes from "./routes/tournament.routes.js";

async function startServer() {

  await initDb();

  const app = express();

  app.use(express.json());
  app.use(cors());

  // DB Status Header
  app.use((_req, res, next) => {

    res.setHeader(
      "x-db-type",
      dbState.hasDb ? "neon" : "local"
    );

    next();
  });

  // API Logger


  // Routes
  app.use(
    "/api/players",
    playerRoutes
  );
 



  app.use(
    "/api/tournaments",
    tournamentRoutes
  );

  // Health Route
  app.get("/", (_req, res) => {

    res.json({
      message: "Chess API running",
      database: dbState.hasDb
        ? "neon"
        : "memory",
    });
  });

const PORT = Number(
  process.env.PORT
) || 5000;

  app.listen(PORT, "0.0.0.0", () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
}

startServer();