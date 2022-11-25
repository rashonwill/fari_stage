const Redis = require("redis");
const { redis } = new Redis();

function rateLimiter({ secondsWindow, allowedHits }) {
  return async function (req, res, next) {
    const ip = req.headers["x-forwared-for"] || req.connection.remoteAddress;

    const request = await redis.incr(ip);

    let ttl;
    if (request === 1) {
      ttl = secondsWindow;
    } else {
      ttl = await redis.ttl(ip);
    }

    if (request > allowedHits) {
      return status(503).json({
        response: "error",
        callsInAMinute: request,
        ttl,
      });
    } else {
      req.request = request;
      req.ttl = ttl;
      next();
    }
  };
}

module.exports = rateLimiter;

// const limitclient = createClient({
//   // ... (see https://github.com/redis/node-redis/blob/master/docs/client-configuration.md)
// });
// // Then connect to the Redis server
// await limitclient.connect();

// const limiter = rateLimit({
//   // Rate limiter configuration
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 75, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//   message: "Too many request from this IP",

//   // Redis store configuration
//   store: new RedisStore({
//     sendCommand: (...args: string[]) => limitclient.sendCommand(args),
//   }),
// });
