const redis = require("redis");
let redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false,
  },
});

(async () => {
  redisClient.on("error", (err) => {
    console.log("Redis Client Error", err);
  });
  redisClient.on("ready", () => console.log("Redis is ready"));
  await redis.connect();
})();

module.exports = redisClient;
