const redis = require("./redisclient");

(async () => {
  redis.on("error", (err) => {
    console.log("Redis Client Error", err);
  });
  redis.on("ready", () => console.log("Redis is ready"));
  await redis.connect();
  await redis.set("App", "Hello Fari APP");
  const myapp = await redis.get("App");
  console.log("Redis key value", myapp);
})();

function rateLimiter({ secondsWindow, allowedHits }) {
  return async function (req, res, next) {
    const ip = req.headers["x-forwared-for"] || req.connection.remoteAddress;
    console.log("requesting IP", ip);
    const requests = await redis.incr(ip);
    console.log("req redis incr", requests);
    let ttl;
    if (requests === 1) {
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
  };
}

module.exports = rateLimiter;
