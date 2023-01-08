const express = require("express");
const ordersRouter = express.Router();
const { requireUser } = require("./utils");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const rateLimiter = require("./ratelimiter");
const bodyParser = require("body-parser");

const { WEBHOOK_SECRET } = process.env;

const { createMovieOrders } = require("../db");

ordersRouter.post(
  "/create/movieorder",
  rateLimiter({ secondsWindow: 15, allowedHits: 1 }),
  requireUser,
  async (req, res, next) => {
    const videoprice = req.body.videoprice;
    const videotitle = req.body.videotitle;
    const thechannelid = req.body.channelid;
    const thethumbnail = req.body.videothumbnail;
    const userid = req.body.userid;
    const vendor_email = req.body.vendor_email;
    const uuid = req.body.video_uuid;

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

      const movieRental = await createMovieOrders(rentalOrder);
      res.send({ movieRental });
    } catch (error) {
      console.log(error);
      next({
        name: "ErrorGettingRentals",
        message: "Ooops, could not create movie order",
      });
    }
  }
);

ordersRouter.post(
  "/stripe-checkout/rental",
  requireUser,
  rateLimiter({ secondsWindow: 15, allowedHits: 2 }),
  async (req, res) => {
    const stripeAcctID = req.body.stripe_acct;
    const customeremail = req.body.customeremail;
    try {
      const session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ["card"],
          payment_intent_data: {
            receipt_email: customeremail,
          },
          line_items: req.body.items.map((item) => {
            return {
              price_data: {
                currency: "usd",
                product_data: {
                  name: item.name,
                  description: "Movie/Film",
                  images: [item.image],
                  metadata: {
                    vendor: item.vendor,
                    price: item.price,
                    channelid: item.channelid,
                    userid: item.buyerid,
                    videofile: item.videofile,
                    views: item.views,
                    videoid: item.video_uuid,
                    title: item.name,
                    thumbnail: item.image,
                    email: item.vendoremail,
                  },
                },
                unit_amount_decimal: Math.round(item.price * 100),
              },
              quantity: item.quantity,
            };
          }),
          mode: "payment",
          success_url: process.env.SUCCESS_URL,
          cancel_url: process.env.CANCEL_URL,
        },
        {
          stripeAccount: stripeAcctID,
        }
      );
      res.json({ url: session.url, id: session.id });
    } catch (error) {
      console.log(error);
    }
  }
);

module.exports = ordersRouter;
