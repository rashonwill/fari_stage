require("dotenv").config();
const express = require("express");
const webhookRouter = express().Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const stripe2 = require('stripe')(process.env.STRIPE_BUSINESS_SECRET);
const { WEBHOOK_SECRET, WEBHOOK_BUSINESS_SECRET } = process.env;
const path = require("path");

const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");

const cors = require("cors");
webhookRouter.use(cors({ origin: "*" }));

const { 
  createMovieOrders,
  createWatchlistVideo,   
  registerVendor,
  setStripeID,
  updateVendorSubscriptionStatus,
  updateUserSubscriptionStatus
} = require("../db");

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
    const movieRental = await createMovieOrders(rentalOrder);
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
  try {
    let watchlistadd = await createWatchlistVideo(laterBody);
  } catch (error) {
    console.log(error);
  }
}

async function sendEmail(session) {
  let vendor_email = session.metadata.email;
  let title = session.metadata.product_name;
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      service: "outlook",
      port: 587,
      secure: false,
      auth: {
        user: "notifications@letsfari.com",
        pass: process.env.Mailer_Password,
      },
    });

    let handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve(__dirname, "../email-templates"),
        defaultLayout: false,
      },
      viewPath: path.resolve(__dirname, "../email-templates"),
      extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarOptions));

    let mailOptions = {
      from: '"Fari" <notifications@letsfari.com>',
      to: vendor_email,
      subject: "Fari - New Sale",
      template: "newmovierentalsale",
       context: {
         title: title,
      },
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      } else {
        res.send({
          name: "success",
          message: "Someone bought one of your movies.",
        });
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
}


async function sendSubscriptionConfirmation(session) {
  let user_email = session.metadata.customer_email;
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      service: "outlook",
      port: 587,
      secure: false,
      auth: {
        user: "admin@letsfari.com",
        pass: process.env.Mailer_Password,
      },
    });

    let handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve(__dirname, "../email-templates"),
        defaultLayout: false,
      },
      viewPath: path.resolve(__dirname, "../email-templates"),
      extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarOptions));

    let mailOptions = {
      from: '"Fari" <admin@letsfari.com>',
      to: user_email,
      subject: "Fari - New Subscriber",
      template: "newfarisubscriber",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      } else {
        res.send({
          name: "success",
          message: "New Fari Subscriber.",
        });
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
}

async function vendorSubscriptionFlag(session){
  let id = session.metadata.userid;  
  try{
  const updatingVendor = await updateVendorSubscriptionStatus(id);
    console.log('vendor subscription status complete')
  }catch(error){
  console.log(error)
  }

}


async function vendorVerification(session){
 let id = session.metadata.vendor;
  try{
  const verified = await registerVendor(id);
    console.log('vendor registered set')
  }catch(error){
  console.log(error)
  }

}


async function setStripeAcct(session){
  let stripe = session.metadata.stripe_acctid;
  let id = session.metadata.vendor
  try{
      let stripeAcct = {
    stripe_acctid: stripe,
  };
  
const verifiedAcct = await setStripeID(id, stripeAcct);
    console.log('stripe account set')
  }catch(error){
  console.log(error)
  }

}



//Webhooks


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

      // Fulfill the purchase...
      console.log("fulfilling order now");
      createOrder(session);
      createWatchlistAdd(session);
      sendEmail(session);
    }

    response.status(200);
  }
);

webhookRouter.post(
  "/webhook/onboarding",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const payload = request.body;
    let event;
    try {
      event = stripe2.webhooks.constructEvent(payload, sig, WEBHOOK_BUSINESS_SECRET);
    } catch (err) {
      console.log(err);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fulfill the purchase...
      setStripeAcct(session);
      vendorSubscriptionFlag(session);
      vendorVerification(session);
      sendSubscriptionConfirmation(session);
    }

    response.status(200);
  }
);


module.exports = webhookRouter;
