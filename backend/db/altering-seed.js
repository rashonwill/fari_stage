const client = require("./client");

async function alterDatabase() {
  try {
    await client.query(`
    
    
    ALTER TABLE channel_uploads
    ADD COLUMN uuid TEXT NULL;
         
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
