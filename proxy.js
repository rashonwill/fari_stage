const createProxyMiddleware = require("http-proxy-middleware");

module.exports = function (server) {
  server.use(
    "/api",
    createProxyMiddleware({
      target: "https://fari-stage.herokuapp.com/api",
      changeOrigin: true,
    })
  );
};
