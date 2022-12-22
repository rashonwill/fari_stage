const client = require("./client");

async function alterDatabase() {
  try {
    await client.query(`
    CREATE INDEX idx_username ON users(username);
    CREATE INDEX idx_videotitle ON channel_uploads(videotitle);
    CREATE INDEX idx_videotags ON channel_uploads(videotags);
    CREATE INDEX idx_channelname ON channel_uploads(channelname);
    
    ALTER TABLE users
    ADD COLUMN jwt_token TEXT NULL;

    ALTER TABLE users
    ADD COLUMN disclaimer_accepted BOOLEAN DEFAULT FALSE;

    ALTER TABLE users
    ADD COLUMN termsofuse_acceprted BOOLEAN DEFAULT FALSE;
         
    `);

    console.log("Finished altering tables!");
  } catch (error) {
    console.error("Error altering tables.");
    throw error;
  }
}

async function buildDB() {
  try {
    client.connect();
    await alterDatabase();
  } catch (error) {
    throw error;
  }
}

buildDB();
