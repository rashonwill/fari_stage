const redis = require("./redisclient");
const Redis = require("ioredis");

const renderRedis = new Redis({
  host: process.env.REDIS_HOST, // Render Redis hostname, REGION-redis.render.com
  password: process.env.REDIS_PASSWORD, // Provided password
  port: process.env.REDIS_PORT || 6379, // Connection port
  tls: true, // TLS required when externally connecting to Render Redis
  rejectUnauthorized: false,
});
function rateLimiter({ secondsWindow, allowedHits }) {
  return async function (req, res, next) {
    console.log("redis connected");
    const ip = req.headers["x-forwared-for"] || req.connection.remoteAddress;
    console.log("requesting IP", ip);
    const requests = await renderRedis.incr(ip);
    console.log("ip requests exist?", requests);
    let ttl;
    if (requests === 1) {
      await renderRedis.expire(ip, secondsWindow);
      ttl = secondsWindow;
    } else {
      ttl = await renderRedis.ttl(ip);
    }

    if (requests > allowedHits) {
      return res.status(503).json({
        response: "error",
        callsInAMinute: requests,
        ttl,
      });
    } else {
      req.request = requests;
      req.ttl = ttl;
      next();
    }
  };
}

module.exports = rateLimiter;
