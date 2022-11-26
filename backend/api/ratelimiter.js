const redis = require("./redisclient");

function rateLimiter({ secondsWindow, allowedHits }) {
  return async function (req, res, next) {
    const ip = (
      req.headers["x-forwared-for"] || req.connection.remoteAddress
    ).splice(0, 9);
    console.log("requesting IP", ip);
    const requests = await redis.incr(ip);
    console.log("req redis incr", requests);
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
  };
}

module.exports = rateLimiter;
