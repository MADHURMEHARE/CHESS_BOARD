import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import { hasDb } from "./config/db.js";
import { initDb } from "./schema/schema.js";

import playerRoutes from "./routes/player.routes.js";
import tournamentRoutes from "./routes/tournament.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function startServer() {
  await initDb();

  const app = express();
  app.use(express.json());
  app.use(cors());

  // Indicate which data store is active
  app.use((_req, res, next) => {
    res.setHeader("x-db-type", hasDb ? "neon" : "local");
    next();
  });

  // Request logger (API only)
  app.use((req, _res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`API Request: ${req.method} ${req.url}`);
    }
    next();
  });

  // Mount routers
  app.use("/api/players",     playerRoutes);
  app.use("/api/tournaments", tournamentRoutes);

  // Vite dev / production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  const PORT = 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();