const express = require("express");
const usersRouter = express.Router();
const { requireUser } = require("./utils");
const limiter = require("express-rate-limit");
const { body, check, validationResult } = require("express-validator");
const ddos = limiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message:
    "Too many accounts created from this IP, please try again after an hour",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const rateLimiter = require("./ratelimiter");

const {
  getUserProfile,
  userSearch,
  getUserChannelByChannelID,
  getUserChannelByName,
  getPostByChannelID,
  getUserByName,
  
  confirmVendorSubscription,

  createChannelSubscription,
  removeChannelSubscription,
  checkUserSubscriptionStatusToChannel,
  updateChannelSubscriptionCount,
  reduceChannelSubscriptionCount,

  getAllUsers,
} = require("../db");

usersRouter.get("/", async (req, res, next) => {
  try {
    const allUsers = await getAllUsers();
    res.send({
      users: allUsers,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

usersRouter.get(
  "/usersearch/:query",
  check("query").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { query } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const usersSearch = await userSearch(query);
        res.send({ users: usersSearch });
      } catch (error) {
        console.log("Oops could not find search results", error);
        next({
          name: "ErrorGettingSearchResults",
          message: "Could not get the search results",
        });
      }
    }
  }
);

usersRouter.get("/myprofile", requireUser, async (req, res, next) => {
  try {
    const { username, id } = req.user;
    const me = await getUserProfile(username);
    res.send({ profile: me });
  } catch (error) {
    console.log("Could not get user channel", error);
  }
});

usersRouter.get(
  "/myprofile/channel/:username",
  requireUser,
  check("username").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const { username } = req.params;
        const channel = await getUserChannelByName(username);
        res.send({ profile: channel });
      } catch (error) {
        console.log("Could not get user channel");
      }
    }
  }
);

usersRouter.get(
  "/myprofile/post/:channelid",
  requireUser,
  check("channelid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { username } = req.user;
    const { channelid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const uploads = await getPostByChannelID(channelid);
        res.send({ channelUploads: uploads });
      } catch (error) {
        console.log("Could not get user post");
      }
    }
  }
);

usersRouter.get(
  "/channel/:channelid",
  requireUser,
  check("channelid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const { channelid } = req.params;
        const userChannel = await getUserChannelByChannelID(channelid);
        res.send({ channel: userChannel });
      } catch (error) {
        return res.status(400).send({
          name: "Could not get user channel",
          message: "Could not get user channel",
        });
      }
    }
  }
);

usersRouter.post(
  "/subscribe/:channelname",
  requireUser,
  check("channelname").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const userid = req.body.userid;
    const channelID = req.body.channelID;
    const channel = req.body.channelname;
    const subscriber_count = req.body.subscriber_count;
    const { channelname } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const subedData = {
          userid: userid,
          channelID: channelID,
          channelname: channel,
        };
        const mySubs = await createChannelSubscription(subedData);
        const userSubs = await updateChannelSubscriptionCount(channelname);
        res.send({ mySubs: mySubs });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorSettiingUserSub",
          message: "Could not sub to this channel",
        });
      }
    }
  }
);

usersRouter.delete(
  "/unsubscribe/:userid/:channelid",
  requireUser,
  check("channelid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { channelid, userid } = req.params;
    const channel = channelid;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const myunSubs = await removeChannelSubscription(userid, channel);
        const userunSubs = await reduceChannelSubscriptionCount(channelid);
        res.send({ removedSub: myunSubs });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorSettiingUserUnSub",
          message: "Could not unsub to this channel",
        });
      }
    }
  }
);

usersRouter.get(
  "/substatus/:userid/:channelID",
  requireUser,
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("channelID")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { userid, channelID } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const subStat = await checkUserSubscriptionStatusToChannel(
          userid,
          channelID
        );
        res.send({ subedChannel: subStat });
      } catch (error) {
        console.log("Oops, could not determine sub status", error);
        next({
          name: "ErrorGettingSubsStatus",
          message: "Could set Subs status",
        });
      }
    }
  }
);

usersRouter.get(
  "/vendor-verified/:vendorid",
  requireUser,
  check("vendorid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { vendorid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const checkVerified = await confirmVendorSubscription(vendorid);
        res.send({ vendor: checkVerified });
      } catch (error) {
        console.log("Oops, could not check verification of vendor", error);
      }
    }
  }
);

module.exports = usersRouter;
