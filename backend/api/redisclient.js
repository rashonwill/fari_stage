const redis = require("redis");
let redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  connectTimeout: 10000,
  socket: {
    tls: true,
    rejectUnauthorized: false,
  },
});
module.exports = redisClient;
