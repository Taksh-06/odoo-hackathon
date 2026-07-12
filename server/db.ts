import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
// Configure the native PG type parser to parse NUMERIC (type OID 1700) as float
// so that database numeric fields map cleanly to numbers in the frontend.
pg.types.setTypeParser(1700, (val: string) => parseFloat(val));
const { Pool } = pg;
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "transitops",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});
// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection failure:", err.message);
  } else {
    console.log("Database connected successfully at:", res.rows[0].now);
  }
});
