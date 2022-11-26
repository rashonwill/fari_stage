const redis = require("./redisclient");
function rateLimiter({ secondsWindow, allowedHits }) {
  return async function (req, res, next) {
    if (!redis) {
      console.log("no redis");
    } else {
      console.log("redis connected");
      const ip = (
        req.headers["x-forwared-for"] || req.connection.remoteAddress
      ).splice(0, 9);
      console.log("requesting IP", ip);
      const requests = await redis.incr(ip);
      let ttl;
      if (requests === 1) {
        await redis.expire(ip, secondsWindow);
        ttl = secondsWindow;
      } else {
        ttl = await redis.ttl(ip);
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
