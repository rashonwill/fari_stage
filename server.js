"use strict";
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const compression = require("compression");
const express = require("express");
const server = express();
const cluster = require("cluster");
const http = require("http");
const os = require("os");
const helmet = require("helmet");
const numCPU = os.cpus().length;
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { WEBHOOK_SECRET } = process.env;

const client = require("./backend/db/client");
client.connect();

const hpp = require("hpp");
server.use(hpp());

const cors = require("cors");
server.use(cors({ origin: "*" }));

server.use("/processes", require("./backend/processes"));

//middleware

server.use(express.static("public", { extensions: ["html"] }));
server.use(express.urlencoded({ extended: false, limit: "1kb" }));
server.use(express.json({ limit: "100mb" }));

const bodyParser = require("body-parser");
server.use(bodyParser.json({ limit: "20mb" }));
server.use(bodyParser.urlencoded({ extended: false, limit: "20mb" }));

server.use(helmet());

server.use(function (req, res, next) {
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

server.use(compression());
const morgan = require("morgan");
const { Server } = require("https");
server.use(morgan("dev"));

server.use("/api", require("./backend/api"));

if (cluster.isMaster) {
  for (let index = 0; index < numCPU; index++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  server.listen(PORT, async () => {
    console.log(`Welcome to Fari! Listening on Port: ${PORT}`);
  });
}
