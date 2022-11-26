const redis = require("./redisclient");
// const Redis = require("ioredis");
// const { REDIS_URL } = process.env;
// const renderRedis = new Redis(REDIS_URL);

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

// const rateLimit = require("express-rate-limit");
// const RedisStore = require("rate-limit-redis");
// const { createClient } = require("redis");

// // Create a `node-redis` client
// const client = createClient({
//   url: process.env.REDIS_URL,
//   socket: {
//     tls: true,
//     rejectUnauthorized: false,
//   },
// });
// await client.connect();

// // Create and use the rate limiter
// const limiter = rateLimit({
//   // Rate limiter configuration
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers

//   // Redis store configuration
//   store: new RedisStore({
//     client: redis.createClient({
//       host: process.env.REDIS_HOST,
//       port: process.env.REDIS_PORT,
//     }),
//   }),
// });
// app.use(limiter);
