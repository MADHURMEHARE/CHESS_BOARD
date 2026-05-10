import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});
import pg from "pg";

const { Pool } = pg;

export let hasDb = true;

console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL
);

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() => {
    console.log(
      "✅ PostgreSQL Connected"
    );
  })
  .catch((err) => {
    console.error(
      "❌ DB Connection Error:",
      err
    );

    hasDb = false;
  });