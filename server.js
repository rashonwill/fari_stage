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

server.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const payload = request.body;
    console.log("sig", sig);
    console.log("payload", payload);
    console.log("secret", WEBHOOK_SECRET);
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.log(err);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fulfill the purchase...
      console.log("fulfilling order now");
    }

    response.status(200);
  }
);

server.use(express.static("public", { extensions: ["html"] }));
server.use(express.urlencoded({ extended: false, limit: "1kb" }));
server.use(express.json({ limit: "100mb" }));

server.use(helmet());

//middleware

const cors = require("cors");
server.use(cors({ origin: "*" }));

const bodyParser = require("body-parser");
server.use(bodyParser.json({ limit: "20mb" }));
server.use(bodyParser.urlencoded({ extended: false, limit: "20mb" }));

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

server.get("/webhook", async (req, res) => {
  res.send("Welcome to Stripe webhooks");
});

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
