const redis = require("redis");
let redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false,
  },
});
module.exports = redisClient;
