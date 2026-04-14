const express = require("express");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const app = express();
app.use(express.json());

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      description VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "jobs-api" });
});

app.get("/jobs", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, status, created_at FROM jobs ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.post("/jobs", async (req, res) => {
  const { title, description, status } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO jobs (title, description, status) VALUES ($1, $2, $3) RETURNING id, title, description, status, created_at",
      [title, description, status ?? "pending"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create job" });
  }
});

app.put("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      "UPDATE jobs SET status = $1 WHERE id = $2 RETURNING id, title, description, status, created_at",
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update job" });
  }
});

app.delete("/jobs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM jobs WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete job" });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      if (JWT_SECRET === undefined) {
        console.warn("JWT_SECRET is not set");
      }
      console.log(`jobs-api running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
