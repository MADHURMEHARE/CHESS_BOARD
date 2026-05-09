import pg from "pg";

const { Pool } = pg;

export const hasDb = true;

export const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_79miDuXPShLB@ep-weathered-boat-aql0e11t.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require",

  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
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
  });