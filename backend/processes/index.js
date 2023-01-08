require("dotenv").config();
const express = require("express");
const processesRouter = express.Router();

const cors = require("cors");
processesRouter.use(cors({ origin: "*" }));

processesRouter.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL);
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Request-With, Content-Type, Accept, Authorization, Cookies"
  );
  next();
});

const webhookRouter = require("./webhooks");
processesRouter.use("/webhooks", webhookRouter);

processesRouter.use((error, req, res, next) => {
  res.send(error);
});

module.exports = processesRouter;
