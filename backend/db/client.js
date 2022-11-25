const { Client, Pool } = require("pg");

const client = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost:5432/faristage",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

module.exports = client;
