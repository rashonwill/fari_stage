// const redis = require("./redisclient");

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
  await redisClient.connect();
  await redisClient.set("App", "Hello Fari APP");
  const myapp = await redis.get("App");
  console.log("Redis key value", myapp);
})();

function rateLimiter({ secondsWindow, allowedHits }) {
  return async function (req, res, next) {
    const ip = req.headers["x-forwared-for"] || req.connection.remoteAddress;
    console.log("requesting IP", ip);
    const requests = await redisClient.incr(ip);
    console.log("req redis incr", requests);
    let ttl;
    if (requests === 1) {
      ttl = secondsWindow;
    } else {
      ttl = await redisClient.ttl(ip);
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
