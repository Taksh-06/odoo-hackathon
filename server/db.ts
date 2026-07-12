import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
// Configure the native PG type parser to parse NUMERIC (type OID 1700) as float
// so that database numeric fields map cleanly to numbers in the frontend.
pg.types.setTypeParser(1700, (val: string) => parseFloat(val));
const { Pool } = pg;
const isLocalhost =
  !process.env.DB_HOST ||
  process.env.DB_HOST.trim().includes("localhost") ||
  process.env.DB_HOST.trim().includes("127.0.0.1");

export const pool = new Pool({
  host: process.env.DB_HOST ? process.env.DB_HOST.trim() : "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME ? process.env.DB_NAME.trim() : "transitops",
  user: process.env.DB_USER ? process.env.DB_USER.trim() : "postgres",
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : "postgres",
  ssl: isLocalhost ? undefined : { rejectUnauthorized: false }
});
// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection failure:", err.message);
  } else {
    console.log("Database connected successfully at:", res.rows[0].now);
  }
});

// Handle unexpected errors on idle clients to prevent crashing the serverless runtime
pool.on("error", (err) => {
  console.error("Unexpected database pool client error:", err.message);
});
