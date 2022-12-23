const client = require("./client");

async function alterDatabase() {
  try {
    await client.query(`
    
    ALTER TABLE user_watchlist
    ADD COLUMN video_uuid TEXT NULL;

    ALTER TABLE user_favorites
    ADD COLUMN video_uuid  TEXT NULL;

    ALTER TABLE user_watch_history
    ADD COLUMN video_uuid  TEXT NULL;

    ALTER TABLE upload_comments
    ADD COLUMN video_uuid  TEXT NULL;

    ALTER TABLE user_video_likes
    ADD COLUMN video_uuid  TEXT NULL;

    ALTER TABLE user_video_dislikes
    ADD COLUMN video_uuid  TEXT NULL;

    ALTER TABLE customer_movie_orders
    ADD COLUMN video_uuid TEXT NULL;

    ALTER TABLE upload_copyright_reports
    ADD COLUMN video_uuid TEXT NULL;

    ALTER TABLE user_watchlist
   DROP COLUMN videoid;

    ALTER TABLE user_favorites
   DROP COLUMN videoid;

    ALTER TABLE user_watch_history
   DROP COLUMN videoid;

    ALTER TABLE upload_comments
   DROP COLUMN videoid;

    ALTER TABLE user_video_likes
   DROP COLUMN videoid;

    ALTER TABLE user_video_dislikes
   DROP COLUMN videoid;

    ALTER TABLE customer_movie_orders
   DROP COLUMN videoid;

    ALTER TABLE upload_copyright_reports
   DROP COLUMN videoid;

   ALTER TABLE users
   DROP COLUMN jwt_token;


         
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
