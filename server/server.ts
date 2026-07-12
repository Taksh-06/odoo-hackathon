import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { pool } from "./db";
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
// --- UTILITY FOR KEY MAPPING (snake_case from DB <-> camelCase for React) ---
function toCamel(s: string): string {
    return s.replace(/([-_][a-z])/g, ($1) => $1.toUpperCase().replace("-", "").replace("_", ""));
}
function toSnake(s: string): string {
    return s.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
function mapKeysToCamel(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(mapKeysToCamel);
    } else if (obj !== null && typeof obj === "object") {
        const newObj: any = {};
        for (const key of Object.keys(obj)) {
            newObj[toCamel(key)] = mapKeysToCamel(obj[key]);
        }
        return newObj;
    }
    return obj;
}
// --- BOOTSTRAP API ---
app.get("/api/bootstrap", async (req, res) => {
    try {
        const vehiclesQuery = await pool.query("SELECT * FROM vehicles ORDER BY id");
        const driversQuery = await pool.query("SELECT * FROM drivers ORDER BY id");
        // Get active trips: progress < 100 or recently completed trips (completed_triggered = TRUE)
        const tripsQuery = await pool.query("SELECT * FROM trips WHERE progress < 100 OR completed_triggered = TRUE ORDER BY id");
        const fuelLogsQuery = await pool.query("SELECT * FROM fuel_logs ORDER BY id DESC");
        const maintenanceLogsQuery = await pool.query("SELECT * FROM maintenance_logs ORDER BY id DESC");
        const expensesQuery = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
        const documentsQuery = await pool.query("SELECT * FROM documents ORDER BY upload_date DESC");
        res.json(mapKeysToCamel({
            vehicles: vehiclesQuery.rows,
            drivers: driversQuery.rows,
            activeTrips: tripsQuery.rows,
            fuelLogs: fuelLogsQuery.rows,
            maintenanceLogs: maintenanceLogsQuery.rows,
            expenses: expensesQuery.rows,
            documents: documentsQuery.rows
        }));
    } catch (err: any) {
        console.error("Bootstrap error:", err.message);
        res.status(500).json({ error: "Failed to fetch bootstrap operational state." });
    }
});
// --- AUTHENTICATION ---
app.post("/api/auth/login", async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return res.status(400).json({ error: "Email, password, and role are required." });
    }
    try {
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "SECURITY ALARM: Invalid operator credentials." });
        }
        const user = userResult.rows[0];
        if (user.role !== role) {
            return res.status(403).json({ error: "SECURITY ALARM: Role mismatch for operator profile." });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "SECURITY ALARM: Incorrect password." });
        }
        res.json({
            success: true,
            user: {
                email: user.email,
                role: user.role
            }
        });
    } catch (err: any) {
        console.error("Auth error:", err.message);
        res.status(500).json({ error: "Database verification error." });
    }
});
// --- DISPATCH NEW TRIP ---
app.post("/api/trips", async (req, res) => {
    const { id, source, destination, driverId, vehicleId, cargo, weight, speed } = req.body;
    if (!id || !source || !destination || !driverId || !vehicleId || !cargo || !weight || !speed) {
        return res.status(400).json({ error: "Missing required dispatch trip parameters." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Insert trip
        await client.query(
            `INSERT INTO trips (id, source, destination, driver_id, vehicle_id, cargo, weight, progress, speed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0.00, $8)`,
            [id, source, destination, driverId, vehicleId, cargo, weight, speed]
        );
        // Update vehicle status
        await client.query(
            `UPDATE vehicles SET status = 'on-trip', capacity_current = $1 WHERE id = $2`,
            [weight, vehicleId]
        );
        // Update driver status
        await client.query(
            `UPDATE drivers SET status = 'on-trip' WHERE id = $1`,
            [driverId]
        );
        await client.query("COMMIT");
        res.json({ success: true, message: `Trip ${id} dispatched successfully.` });
    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error("Dispatch error:", err.message);
        res.status(500).json({ error: `Dispatch transaction failed: ${err.message}` });
    } finally {
        client.release();
    }
});
// --- ACKNOWLEDGE COMPLETED TRIP (Frontend displays toast, then acks it) ---
app.post("/api/trips/:id/ack-complete", async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE trips SET completed_triggered = FALSE WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err: any) {
        console.error("Ack complete error:", err.message);
        res.status(500).json({ error: "Failed to acknowledge trip completion." });
    }
});
// --- EMERGENCY REPAIR REDIRECT ---
app.post("/api/vehicles/emergency-repair", async (req, res) => {
    const { vehicleId } = req.body;
    if (!vehicleId) {
        return res.status(400).json({ error: "Vehicle ID is required." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Check status
        const vRes = await client.query("SELECT status, name FROM vehicles WHERE id = $1", [vehicleId]);
        if (vRes.rows.length === 0) {
            throw new Error(`Vehicle ${vehicleId} not found.`);
        }
        const vehicle = vRes.rows[0];
        if (vehicle.status === "on-trip") {
            throw new Error(`Vehicle ${vehicle.name} is currently active on transit.`);
        }
        // Update status to in-shop
        await client.query("UPDATE vehicles SET status = 'in-shop' WHERE id = $1", [vehicleId]);
        // Log maintenance record
        const mId = `M-${Math.floor(600 + Math.random() * 400)}`;
        await client.query(
            `INSERT INTO maintenance_logs (id, vehicle_id, date, description, cost, status)
       VALUES ($1, $2, 'Urgent (Today)', 'Sensor Malfunction & Critical Powertrain Overhaul', 2450.00, 'In-Shop')`,
            [mId, vehicleId]
        );
        await client.query("COMMIT");
        res.json({ success: true, message: `Emergency repair initialized. Maint ID: ${mId}` });
    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error("Emergency repair error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});
// --- RESOLVE MAINTENANCE ---
app.post("/api/maintenance/resolve", async (req, res) => {
    const { maintId, vehicleId } = req.body;
    if (!maintId || !vehicleId) {
        return res.status(400).json({ error: "Maintenance ID and Vehicle ID are required." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("UPDATE maintenance_logs SET status = 'Completed' WHERE id = $1", [maintId]);
        await client.query("UPDATE vehicles SET status = 'available', fuel_level = 100 WHERE id = $1", [vehicleId]);
        await client.query("COMMIT");
        res.json({ success: true, message: `Vehicle ${vehicleId} returned to service.` });
    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error("Resolve maintenance error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});
// --- DRIVER STATUS (Safety Officer Dashboard) ---
app.post("/api/drivers/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: "Driver status is required." });
    }
    try {
        if (status === "suspended") {
            await pool.query(
                `UPDATE drivers 
                 SET status = 'suspended', 
                     hours_remaining = 0.0,
                     license_type = CASE WHEN license_type NOT LIKE '%(Suspended)%' THEN license_type || ' (Suspended)' ELSE license_type END
                 WHERE id = $1`,
                [id]
            );
        } else {
            await pool.query(
                `UPDATE drivers 
                 SET status = 'available', 
                     hours_remaining = 14.0,
                     license_type = REPLACE(license_type, ' (Suspended)', '')
                 WHERE id = $1`,
                [id]
            );
        }
        res.json({ success: true, message: `Driver ${id} status updated to ${status}.` });
    } catch (err: any) {
        console.error("Driver status update error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
// --- FUEL LOGGING ---
app.post("/api/fuel-logs", async (req, res) => {
    const { id, vehicleId, date, amountAdded, cost, location } = req.body;
    if (!id || !vehicleId || !date || !amountAdded || !cost || !location) {
        return res.status(400).json({ error: "Missing fuel log parameters." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Insert fuel log
        await client.query(
            `INSERT INTO fuel_logs (id, vehicle_id, date, amount_added, cost, location)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, vehicleId, date, amountAdded, cost, location]
        );
        // Extract amount if numeric (e.g. "150 kWh" -> 150, "120 Gal" -> 120)
        const amountVal = parseFloat(amountAdded);
        const addedVal = isNaN(amountVal) ? 30 : amountVal;
        // We can cap the fuel level at 100. If it's a battery charging van, let's increment fuelLevel
        await client.query(
            `UPDATE vehicles SET fuel_level = LEAST(100, fuel_level + $1) WHERE id = $2`,
            [addedVal, vehicleId]
        );
        await client.query("COMMIT");
        res.json({ success: true, message: `Fuel logged successfully. cost: $${cost}` });
    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error("Fuel logging error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});
// --- MANUAL MAINTENANCE LOGGING ---
app.post("/api/maintenance-logs", async (req, res) => {
    const { id, vehicleId, date, description, cost, status } = req.body;
    if (!id || !vehicleId || !date || !description || !cost || !status) {
        return res.status(400).json({ error: "Missing maintenance parameters." });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `INSERT INTO maintenance_logs (id, vehicle_id, date, description, cost, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, vehicleId, date, description, cost, status]
        );
        if (status === "In-Shop") {
            await client.query("UPDATE vehicles SET status = 'in-shop' WHERE id = $1", [vehicleId]);
        }
        await client.query("COMMIT");
        res.json({ success: true, message: `Maintenance log created.` });
    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error("Maintenance logging error:", err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});
// --- EXPENSES API ---
app.get("/api/expenses", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM expenses ORDER BY date DESC");
        res.json(mapKeysToCamel(result.rows));
    } catch (err: any) {
        console.error("Get expenses error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
app.post("/api/expenses", async (req, res) => {
    const { id, description, amount, category, date, vehicleId } = req.body;
    if (!id || !description || !amount || !category || !date) {
        return res.status(400).json({ error: "Missing required expense parameters." });
    }
    try {
        await pool.query(
            `INSERT INTO expenses (id, description, amount, category, date, vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, description, amount, category, date, vehicleId || null]
        );
        res.json({ success: true, message: `Expense recorded successfully.` });
    } catch (err: any) {
        console.error("Post expense error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
// --- DOCUMENTS API ---
app.get("/api/documents", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM documents ORDER BY upload_date DESC");
        res.json(mapKeysToCamel(result.rows));
    } catch (err: any) {
        console.error("Get documents error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
app.post("/api/documents", async (req, res) => {
    const { id, title, type, url, uploadDate, driverId, vehicleId } = req.body;
    if (!id || !title || !type || !url || !uploadDate) {
        return res.status(400).json({ error: "Missing required document parameters." });
    }
    try {
        await pool.query(
            `INSERT INTO documents (id, title, type, url, upload_date, driver_id, vehicle_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, title, type, url, uploadDate, driverId || null, vehicleId || null]
        );
        res.json({ success: true, message: `Document uploaded/logged successfully.` });
    } catch (err: any) {
        console.error("Post document error:", err.message);
        res.status(500).json({ error: err.message });
    }
});
// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`TransitOps Express Backend running on port ${PORT}`);
});
// ==================== BACKGROUND TRIP PROGRESS SIMULATION ENGINE ====================
setInterval(async () => {
    try {
        // Select trips that are active (progress < 100)
        const activeTripsQuery = await pool.query("SELECT * FROM trips WHERE progress < 100");

        for (const trip of activeTripsQuery.rows) {
            // Calculate random progress increment
            const increment = parseFloat((Math.random() * 1.5 + 0.8).toFixed(1));
            const nextProgress = Math.min(100, parseFloat(trip.progress) + increment);
            if (nextProgress >= 100) {
                // Complete the trip
                const client = await pool.connect();
                try {
                    await client.query("BEGIN");

                    // Set progress to 100 and flag completed_triggered = TRUE so frontend detects it
                    await client.query(
                        `UPDATE trips SET progress = 100.00, completed_triggered = TRUE WHERE id = $1`,
                        [trip.id]
                    );
                    // Release vehicle
                    await client.query(
                        `UPDATE vehicles SET status = 'available', capacity_current = 0 WHERE id = $1`,
                        [trip.vehicle_id]
                    );
                    // Release driver
                    await client.query(
                        `UPDATE drivers SET status = 'available' WHERE id = $1`,
                        [trip.driver_id]
                    );
                    await client.query("COMMIT");
                    console.log(`Trip ${trip.id} completed. Driver ${trip.driver_id} and Vehicle ${trip.vehicle_id} released.`);
                } catch (txErr: any) {
                    await client.query("ROLLBACK");
                    console.error(`Simulation trip-completion rollback for ${trip.id}:`, txErr.message);
                } finally {
                    client.release();
                }
            } else {
                // Increment progress
                await pool.query(
                    `UPDATE trips SET progress = $1 WHERE id = $2`,
                    [nextProgress, trip.id]
                );
            }
        }
    } catch (err: any) {
        console.error("Error in Trip Simulation background loop:", err.message);
    }
}, 1500);
