import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function initDb() {
    console.log("Initializing database schema...");

    try {
        // Read SQL file
        const sqlPath = path.join(__dirname, "schema.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");
        // Execute schema tables creation and initial seeds
        await pool.query(sql);
        console.log("Tables created and seeded with default data successfully.");
        // Seed default users with bcrypt-hashed passwords
        console.log("Seeding default user credentials...");
        const defaultPassword = "password";
        const hash = await bcrypt.hash(defaultPassword, 10);
        const users = [
            { email: "ronakskaka08@gmail.com", role: "manager" },
            { email: "driver@transitops.com", role: "driver" },
            { email: "safety@transitops.com", role: "safety" },
            { email: "finance@transitops.com", role: "finance" },
        ];
        for (const user of users) {
            await pool.query(
                `INSERT INTO users (email, password_hash, role) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
                [user.email, hash, user.role]
            );
            console.log(`Seeded user: ${user.email} (${user.role}) with password: "${defaultPassword}"`);
        }
        console.log("Database initialization completed successfully.");
    } catch (err: any) {
        console.error("Failed to initialize database:", err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}
initDb();
