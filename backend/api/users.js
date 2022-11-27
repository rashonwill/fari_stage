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
  getAllUsers,
  getAllChannels,
  verifiedVendors,
  getUserChannelByChannelID,
  getPostByChannelID,
  getUserChannel,
  getUserProfile,
  getUserById,
  createSubs,
  updateChannelSubs,
  removeChannelSub,
  removeSubs,
  getUserStatSubForChannel,
  getChannelByName,
  getLiveChannels,
  userSearch,
  getAllUsersUsername,
  getUsersByUsername,
  verifyUserSubscriptionStatus,
  updateChannelSubsStatus,
} = require("../db");

usersRouter.get("/", requireUser, async (req, res, next) => {
  try {
    const allUsers = await getAllUsers();
    res.send({
      users: allUsers,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

usersRouter.get("/me", requireUser, async (req, res, next) => {
  try {
    res.send({ user: req.user });
  } catch (error) {
    console.error("Hmm, can't seem to get that user", error);
    next(error);
  }
});

usersRouter.get("/usernames", ddos, requireUser, async (req, res, next) => {
  console.log("no cache found");
  try {
    const allUsernames = await getAllUsersUsername();
    let setData = await redisClient.set(
      "fariUsers",
      JSON.stringify(allUsernames)
    );
    res.send({ users: allUsernames });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

usersRouter.get(
  "/usernames/:username",
  check("username").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { username } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const usersName = await getUsersByUsername(username);
        res.send({
          users: usersName,
        });
      } catch ({ name, message }) {
        next({ name, message });
      }
    }
  }
);

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

usersRouter.get("/channels", async (req, res, next) => {
  try {
    const allChannels = await getAllChannels();
    res.send({ allChannels });
  } catch ({ name, message }) {
    next({
      name: "ErrorGettingChannels",
      message: "Could not retrieve channels",
    });
  }
});

usersRouter.get(
  "/livechannels/:userid",
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { userid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const liveChannels = await getLiveChannels(userid);
        res.send({ live: liveChannels });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorGettingLiveChannels",
          message: "Could not retrieve live channels",
        });
      }
    }
  }
);

usersRouter.get(
  "/loggedin/:id",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const loggedIn = await getUserById(id);
        res.send({ user: loggedIn });
      } catch (error) {
        console.error("Hmm, can't seem to get that user", error);
        next(error);
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
        const channel = await getUserChannel(username);
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
  rateLimiter({ secondsWindow: 10, allowedHits: 5 }),
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
    const channel_avi = req.body.channelavi;
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
          channelavi: channel_avi,
        };
        const mySubs = await createSubs(subedData);
        const userSubs = await updateChannelSubs(channelname);
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
        const myunSubs = await removeSubs(userid, channel);
        const userunSubs = await removeChannelSub(channelid);
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
        const subStat = await getUserStatSubForChannel(userid, channelID);
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
  "/getChannel/:channelName",
  requireUser,
  check("userid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { channelName } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const channel = await getChannelByName(channelName);
        res.send({ channels: channel });
      } catch (error) {
        console.log("Oops, could not get channel", error);
        next({ name: "ErrorGettingChannel", message: "Could get channel" });
      }
    }
  }
);

usersRouter.get(
  "/user-sub-verified/:id",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const checkVerified = await verifyUserSubscriptionStatus(id);
        res.send({ user: checkVerified });
      } catch (error) {
        console.log("Oops, could not check verification of vendor", error);
      }
    }
  }
);

usersRouter.patch(
  "/updatechannelsub/:id",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const channelsubstatus = await updateChannelSubsStatus(id);
        res.send({ user: channelsubstatus });
      } catch (error) {
        console.log("Oops, could not check verification of vendor", error);
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
        const checkVerified = await verifiedVendors(vendorid);
        res.send({ vendor: checkVerified });
      } catch (error) {
        console.log("Oops, could not check verification of vendor", error);
      }
    }
  }
);

module.exports = usersRouter;
