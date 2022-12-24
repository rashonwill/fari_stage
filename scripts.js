const client = require("./backend/db/client");

async function removePurchasedLatersThreeDays() {
  try {
    await client.query(
      `
              DELETE FROM user_watchlist
              WHERE paidtoview='true' AND user_started_watching='true' AND first_viewingDT < DATE(NOW() - INTERVAL '3 DAYS') ;
            `
    );
    console.log("Removal of purchased watchlaters, completed");
  } catch (error) {
    throw error;
  }
}

async function cleanHistory() {
  try {
    await client.query(
      `
              DELETE FROM user_watch_history
              WHERE historydt < DATE(NOW() - INTERVAL '15 DAYS') ;
            `
    );
    console.log("Removal of purchased watchlaters, completed");
  } catch (error) {
    throw error;
  }
}

async function cleanupDB() {
  try {
    client.connect();
    await removePurchasedLatersThreeDays();
    await cleanHistory();
  } catch (error) {
    throw error;
  }
}

cleanupDB();
