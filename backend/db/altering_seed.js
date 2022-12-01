const client = require("./client");


async function alterDatabase() {
  try {
    
    
    await client.query(`
    ALTER TABLE channel_messages 
    DROP COLUMN senderpic;
    
    ALTER TABLE channel_messages 
    DROP COLUMN receiverpic;
    
    ALTER TABLE channel_uploads 
    DROP COLUMN channelavi;
    
    ALTER TABLE upload_comments 
    DROP COLUMN commentorpic;
    
    ALTER TABLE user_favorites 
    DROP COLUMN channelavi;
    
    ALTER TABLE user_watchlist 
    DROP COLUMN channelavi;
    
    ALTER TABLE user_subscriptions 
    DROP COLUMN channelavi;
    
    ALTER TABLE user_watch_history 
    DROP COLUMN channelavi;
         
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
