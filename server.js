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

const client = require("./backend/db/client");
client.connect();

const hpp = require("hpp");
server.use(hpp());

server.use(express.static("public", { extensions: ["html"] }));
server.use(express.urlencoded({ extended: false, limit: "1kb" }));
server.use(express.json({ limit: "100mb" }));

server.use(helmet());

//middleware

const cors = require("cors");
server.use(cors({ origin: "*" }));

const bodyParser = require("body-parser");
server.use(bodyParser.json({ limit: "30mb" }));
server.use(bodyParser.urlencoded({ extended: false, limit: "30mb" }));

server.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
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
server.use(morgan("dev"));

// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "useruploads");
//   },
//   filename: (req, file, cb) => {
//     console.log(file);
//     cb(null, Date.now() + "_" + file.originalname);
//   },
// });

// const upload = multer({
//   storage: storage,
//   limits: { fieldSize: 10 * 1024 * 1024 },
// });

// const randomUpload = upload.single("random");

// const {
//   uploadVideo,
//   deleteFile,
//   uploadPhotos,
//   largeFileUpload,
// } = require("./aws");

// //Router API
// server.post("/upload-multer", randomUpload, async (req, res) => {
//   const pic2 = req.file;
//   try {
//     const result1 = await uploadPhotos(pic2);
//     res.send({ message: "File uploaded" });
//   } catch (error) {
//     console.log(error);
//   }
// });
server.use("/api", require("./backend/api"));

// if (cluster.isMaster) {
//   for (let index = 0; index < numCPU; index++) {
//     cluster.fork();
//   }
//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//     cluster.fork();
//   });
// } else {
//   server.listen(PORT, async () => {
//     console.log(`Welcome to Fari! Listening on Port: ${PORT}`);
//   });
// }

server.listen(PORT, async () => {
  console.log(`Welcome to Fari! Listening on Port: ${PORT}`);
});
