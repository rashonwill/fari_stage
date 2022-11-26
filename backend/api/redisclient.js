const Redis = require("ioredis");
const redis = new Redis({
  host: process.env.REDIS_HOST,
  tls: {
    host: process.env.REDIS_HOST,
  },
});

module.exports = redis;
