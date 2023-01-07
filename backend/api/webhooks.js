const express = require("express");
const webhookRouter = express();

const { buffer } = require("micro");

const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { WEBHOOK_SECRET } = process.env;

webhookRouter.get("/webhook", async (req, res) => {
  res.send("Welcome to Stripe webhooks");
});

webhookRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const payload = request.rawbody;
    // const payload = await buffer(request.rawBody);
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
      console.log(session);
    }

    response.status(200);
  }
);

module.exports = webhookRouter;
