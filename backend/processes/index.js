require("dotenv").config();

const express = require("express");
const processesRouter = express.Router();

const webhookRouter = require("./webhooks");
apiRouter.use("/webhooks", webhookRouter);

processesRouter.use((error, req, res, next) => {
  res.send(error);
});

module.exports = processesRouter;