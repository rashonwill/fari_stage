require("dotenv").config();
const express = require("express");
const webhookRouter = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { WEBHOOK_SECRET } = process.env;

const { createMovieOrders, createWatchlistVideo } = require("../db");

async function createOrder(session) {
  const videoprice = session.metadata.price;
  const videotitle = session.metadata.title;
  const thechannelid = session.metadata.channelid;
  const thethumbnail = session.metadata.thumbnail;
  const userid = session.metadata.userid;
  const vendor_email = session.metadata.email;
  const uuid = session.metadata.videoid;

  try {
    const rentalOrder = {
      channelid: thechannelid,
      videothumbnail: thethumbnail,
      userid: userid,
      videotitle: videotitle,
      videoprice: videoprice,
      vendor_email: vendor_email,
      video_uuid: uuid,
    };

    console.log("rentalorder", rentalOrder);

    const movieRental = await createMovieOrders(rentalOrder);
    console.log({ order: movieRental });
  } catch (error) {
    console.log(error);
  }
}

async function createWatchlistAdd(session) {
  var userid = session.metadata.userid;
  var vidID = session.metadata.videoid;
  var channelname = session.metadata.vendor;
  var video = session.metadata.videofile;
  var posFile = session.metadata.thumbnail;
  var vidTitle = session.metadata.title;
  var channelID = session.metadata.channelid;
  var views = session.metadata.views;

  const laterBody = {
    userid: userid,
    channelname: channelname,
    videofile: video,
    videothumbnail: posFile,
    videotitle: vidTitle,
    channelid: channelID,
    videoviewcount: views,
    video_uuid: vidID,
    paidtoview: true,
  };

  console.log("watchlist video", laterBody);
  try {
    let watchlistadd = await createWatchlistVideo(laterBody);
    console.log({ myWatchLaters: watchlistadd });
  } catch (error) {
    console.log(error);
  }
}

webhookRouter.get("/", async (req, res) => {
  res.send("Welcome to Stripe webhooks");
});

webhookRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const payload = request.body;
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
      console.log("sessionInfo", session);

      // Fulfill the purchase...
      console.log("fulfilling order now");
      createOrder(session);
      createWatchlistAdd(session);
    }

    response.status(200);
  }
);

module.exports = webhookRouter;
