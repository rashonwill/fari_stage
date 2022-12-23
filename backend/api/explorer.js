const express = require("express");
const explorerRouter = express.Router();
const { requireUser } = require("./utils");
const rateLimiter = require("./ratelimiter");
const { check, validationResult } = require("express-validator");
const uuid = require("uuid");

// const redis = require('redis');
// let redisClient = redis.createClient({url: process.env.REDIS_URL, socket: {
//     tls: true,
//     rejectUnauthorized: false
//   }});

const cors = require("cors");
explorerRouter.use(cors());

const {
  createComment,
  editComment,
  deleteComment,

  getVideoComments,
  updateVideoCommentCount,
  reduceVideoCommentCount,

  getUploadByID,
  getVideoByID,

  getDiscoverContent,
  getPayToViewContent,
  getRecommendedUploads,

  getTopUploads,
  getTopChannels,

  videoSearch,
  animationSearch,
  movieSearch,
  seriesSearch,
  vlogSearch,

  addVideoLike,
  revokeVideoLike,
  createUserVideoLike,
  removeUserVideoLike,
  checkUserVideoLikeStatus,

  addVideoDislike,
  revokeVideoDislike,
  createUserVideoDislike,
  removeUserVideoDislike,
  checkUserVideoDislikeStatus,

  updateVideoViews,

  createFavorite,
  deleteFavorite,
  getUserFavorites,

  createWatchlistVideo,
  deleteWatchlistVideo,
  getUserWatchlist,

  removePurchasedWatchlistVideosThreeDays,
  updatePaidWatchStartedFlag,

  createHistoryVideo,
  getUserWatchHistory,

  getUserSubscriptions,
  getUserSubscriptionsLimited,
  getUserSubscriptionUploads,

  getMovieOrders,

  setVendorActiveVideoStatus,

  setVideoFlag,
  setCommentFlag,

  createCopyrightClaim,
} = require("../db");

// (async () => {
//   redisClient.on("error", (err) => {
//     console.log("Redis Client Error", err);
//   });
//   redisClient.on("ready", () => console.log("Redis is ready"));
//   await redisClient.connect();
//   //  await redisClient.set('App', 'Hello Fari APP - Explorer Router', 'EX', 300);
//   //  const myapp = await redisClient.get('App');
//   //  console.log('Redis key value', myapp)
// })();

explorerRouter.get(
  "/discover",
  //   rateLimiter({ secondsWindow: 45, allowedHits: 10 }),
  async (req, res, next) => {
    try {
      const freeContent = await getDiscoverContent();
      res.send({ uploads: freeContent });
    } catch (error) {
      console.log(error);
      next({
        name: "ErrorGettingUploads",
        message: "Could Not get the free uploads",
      });
    }
  }
);

explorerRouter.get("/popular-uploads", requireUser, async (req, res, next) => {
  try {
    const freeContent = await getTopUploads();
    res.send({ uploads: freeContent });
  } catch (error) {
    console.log(error);
    next({
      name: "ErrorGettingUploads",
      message: "Could Not get the free uploads",
    });
  }
});

explorerRouter.get("/popular-channels", requireUser, async (req, res, next) => {
  try {
    const allChannels = await getTopChannels();
    res.send({ allChannels });
  } catch ({ name, message }) {
    next({
      name: "ErrorGettingChannels",
      message: "Could not retrieve channels",
    });
  }
});

explorerRouter.get("/paytoview", requireUser, async (req, res, next) => {
  try {
    const payContent = await getPayToViewContent();
    res.send({ uploads: payContent });
  } catch (error) {
    next({
      name: "ErrorGettingUploads",
      message: "Could Not get the paid uploads",
    });
  }
});

explorerRouter.get("/recommended", async (req, res, next) => {
  try {
    const recUploads = await getRecommendedUploads();
    res.send({ uploads: recUploads });
  } catch (error) {
    next({
      name: "ErrorGettingUploads",
      message: "Could Not get the uploads",
    });
  }
});

explorerRouter.get(
  "/getVideo/:uuid",
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const selectedVideo = await getVideoByID(uuid);
        res.send({
          uploads: selectedVideo,
        });
      } catch (error) {
        next({
          name: "ErrorGettingVideo",
          message: "Could Not get the upload",
        });
      }
    }
  }
);

explorerRouter.get(
  "/video-search/:query",
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
        const userSearch = await videoSearch(query);
        res.send({ videos: userSearch });
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

explorerRouter.get("/search/vlogs", requireUser, async (req, res, next) => {
  try {
    const vlogVids = await vlogSearch();
    res.send({ videos: vlogVids });
  } catch (error) {
    console.log("Oops could not find search results", error);
    next({
      name: "ErrorGettingSearchResults",
      message: "Could not get the search results for Vloggers",
    });
  }
});

explorerRouter.get(
  "/search/animations",
  requireUser,
  async (req, res, next) => {
    try {
      const animationsSearch = await animationSearch();
      res.send({ videos: animationsSearch });
    } catch (error) {
      console.log("Oops could not find search results", error);
      next({
        name: "ErrorGettingSearchResults",
        message: "Could not get the search results Animations",
      });
    }
  }
);

explorerRouter.get("/search/movies", requireUser, async (req, res, next) => {
  try {
    const movieVids = await movieSearch();
    res.send({ videos: movieVids });
  } catch (error) {
    console.log("Oops could not find search results", error);
    next({
      name: "ErrorGettingSearchResults",
      message: "Could not get the search results for Movies",
    });
  }
});

explorerRouter.get("/search/series", requireUser, async (req, res, next) => {
  try {
    const showsVids = await seriesSearch();
    res.send({ videos: showsVids });
  } catch (error) {
    console.log("Oops could not find search results", error);
    next({
      name: "ErrorGettingSearchResults",
      message: "Could not get the search results for Shows",
    });
  }
});

explorerRouter.post(
  "/youlikeme/:uuid",
  requireUser,
  check("uuid").not().isEmpty().trim().escape(),
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    const { userid, videoid } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const likingUser = {
          userid: userid,
          video_uuid: videoid,
        };

        const upvote = await addVideoLike(uuid);
        const likedVid = await createUserVideoLike(likingUser);
        res.send({ video: upvote });
      } catch (error) {
        console.log("Oops could not like this video", error);
        next({
          name: "ErrorSettingLike",
          message: "Could not like this video",
        });
      }
    }
  }
);

explorerRouter.delete(
  "/youlikeme/revoke/:id/:uuid",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("uuid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id, uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const unlikedVid = await removeUserVideoLike(id);
        const removeLike = await revokeVideoLike(uuid);
        res.send({ video: removeLike });
      } catch (error) {
        console.log("Oops could not unlike this video", error);
        next({
          name: "ErrorSettingLike",
          message: "Could not unlike this video",
        });
      }
    }
  }
);

explorerRouter.post(
  "/youdislikeme/:uuid",
  requireUser,
  check("uuid").not().isEmpty().trim().escape(),
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    const { userid, videoid } = req.body;

    const dislikingUser = {
      userid: userid,
      video_uuid: videoid,
    };
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const downvote = await addVideoDislike(uuid);
        const dislikedVid = await createUserVideoDislike(dislikingUser);
        res.send({ video: downvote });
      } catch (error) {
        console.log("Oops could not like this video", error);
        next({
          name: "ErrorSettingLike",
          message: "Could not like this video",
        });
      }
    }
  }
);

explorerRouter.delete(
  "/youdislikeme/revoke/:userid/:uuid",
  requireUser,
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { userid, uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const undislikedVid = await removeUserVideoDislike(userid);
        const removeDislike = await revokeVideoDislike(uuid);
        res.send({ video: removeDislike });
      } catch (error) {
        console.log("Oops could not undislike this video", error);
        next({
          name: "ErrorSettingLike",
          message: "Could not undislike this video",
        });
      }
    }
  }
);

explorerRouter.get(
  "/mylikes/:uuid/:userid",
  requireUser,
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { uuid, userid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const myLike = await checkUserVideoLikeStatus(uuid, userid);
        res.send({ iLike: myLike });
      } catch (error) {
        console.log("Oops could not like this video", error);
        next({
          name: "ErrorSettingLike",
          message: "Could not get your liked video",
        });
      }
    }
  }
);

explorerRouter.get(
  "/mydislikes/:uuid/:userid",
  requireUser,
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { uuid, userid } = req.params;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const myDisLike = await checkUserVideoDislikeStatus(uuid, userid);
        res.send({ idisLike: myDisLike });
      } catch (error) {
        console.log("Oops could not like this video", error);
        next({
          name: "ErrorSettingLike",
          message: "Could not get your disliked video",
        });
      }
    }
  }
);

explorerRouter.patch(
  "/update/viewcount/:uuid",
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const likedVid = await updateVideoViews(uuid);
        res.send({ upload: likedVid });
      } catch (error) {
        console.log("Oops could not like this video", error);
        next({
          name: "ErrorSettingLike",
          message: "Could not like this video",
        });
      }
    }
  }
);

explorerRouter.get(
  "/play/:uuid",
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const playMe = await getUploadByID(uuid);
        res.send({ video: playMe });
      } catch (error) {
        next({ name: "ErrorGettingVideo", message: "Could Not get the video" });
      }
    }
  }
);

explorerRouter.post(
  "/comment/new",
  requireUser,
  check("user_comment").not().isEmpty().trim().escape(),
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { commentorid, commentorname, user_comment, uuid } = req.body;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array() });
    } else {
      try {
        const commentData = {
          commentorID: commentorid,
          commentorName: commentorname,
          user_comment: user_comment,
          video_uuid: uuid,
        };

        const userComment = await createComment(commentData);
        res.send({ comment: userComment });
      } catch (error) {
        console.error("Oops could not create comment", error);
        next(error);
      }
    }
  }
);

explorerRouter.patch(
  "/comment/edit/:commentid",
  requireUser,
  cors(),
  check("user_comment")
    .not()
    .isEmpty()
    .withMessage("Cannot submit empty string")
    .trim()
    .escape(),
  check("commentid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { commentid } = req.params;
    const { user_comment } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const commentEdit = {
          user_comment: user_comment,
        };

        const editIt = await editComment(commentid, commentEdit);
        res.send({ editIt });
      } catch (error) {
        console.error("Oops could not  edit comment", error);
        next({
          name: "ErrorUpdatingContent",
          message: "Could not update comment",
        });
      }
    }
  }
);

explorerRouter.delete(
  "/comment/delete/:commentid",
  requireUser,
  check("commentid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { commentid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const delComment = await deleteComment(commentid);
        res.send({ comment: delComment });
      } catch (error) {
        console.error("Oops could not delete comment", error);
        next(error);
      }
    }
  }
);

explorerRouter.get(
  "/comments/:uuid",
  check("uuid")
    .not()
    .isEmpty()
    .trim()
    .escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const videoComments = await getVideoComments(uuid);
        res.send({ comments: videoComments });
      } catch (error) {
        next({
          name: "ErrorGettingVideoComments",
          message: "Could Not get the video comments",
        });
      }
    }
  }
);

explorerRouter.get(
  "/mysubs/:userid",
  requireUser,
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
        const userSubs = await getUserSubscriptions(userid);
        res.send({ mysubscriptions: userSubs });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorGettingUserSubs",
          message: "Could not get subscriptions",
        });
      }
    }
  }
);

explorerRouter.get(
  "/subscription-profiles/:userid",
  requireUser,
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
        const recentUploadedSubs = await getUserSubscriptionsLimited(userid);
        res.send({ mysubscriptions: recentUploadedSubs });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorGettingRecentUserSubs",
          message: "Could not get recent subscriptions",
        });
      }
    }
  }
);

explorerRouter.get(
  "/subscription-uploads/:userid",
  requireUser,
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
        const subUploads = await getUserSubscriptionUploads(userid);
        res.send({ subscriptionUploads: subUploads });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorGettingSubuploads",
          message: "Could not get subs' uploads",
        });
      }
    }
  }
);

explorerRouter.get(
  "/myfavs/:userid",
  requireUser,
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
        const userFaved = await getUserFavorites(userid);
        res.send({ myFavVids: userFaved });
      } catch (error) {
        next({ name: "ErrorGettingUserFavs", message: "Could not get favs" });
      }
    }
  }
);

explorerRouter.post("/youfavedme", requireUser, async (req, res, next) => {
  const userid = req.body.userid;
  const videoid = req.body.videoid;
  const channel = req.body.channelname;
  const video = req.body.videofile;
  const thumbnail = req.body.videothumbnail;
  const title = req.body.videotitle;
  const channelidentification = req.body.channelid;
  const videoviewcount = req.body.videoviewcount;
  try {
    const favedData = {
      userid: userid,
      channelname: channel,
      videofile: video,
      videothumbnail: thumbnail,
      videotitle: title,
      channelid: channelidentification,
      videoviewcount: videoviewcount,
      video_uuid: uuid.v4(),
    };

    const usersFaved = await createFavorite(favedData);
    res.send({ myFavorites: usersFaved });
  } catch (error) {
    console.log(error);
    next({ name: "ErrorSettiingUserFav", message: "Could not fav this video" });
  }
});

explorerRouter.get(
  "/watchlist/:userid",
  requireUser,
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
        const userWatchList = await getUserWatchlist(userid);
        res.send({ myWatchList: userWatchList });
      } catch (error) {
        next({
          name: "ErrorGettingUserWatchList",
          message: "Could not get user watchlist",
        });
      }
    }
  }
);

explorerRouter.post("/add/watchlist", requireUser, async (req, res, next) => {
  const userid = req.body.userid;
  const videoid = req.body.videoid;
  const channel = req.body.channelname;
  const video = req.body.videofile;
  const thumbnail = req.body.videothumbnail;
  const title = req.body.videotitle;
  const channelident = req.body.channelid;
  const views = req.body.videoviewcount;
  const paidtoview = req.body.paidtoview;

  try {
    const laterData = {
      userid: userid,
      channelname: channel,
      videofile: video,
      videothumbnail: thumbnail,
      videotitle: title,
      channelid: channelident,
      videoviewcount: views,
      paidtoview: paidtoview,
      video_uuid: uuid.v4(),
    };

    const usersList = await createWatchlistVideo(laterData);
    res.send({ myWatchLaters: usersList });
  } catch (error) {
    console.log(error);
    next({
      name: "ErrorSettiingLater",
      message: "Could not add this video to watchlist",
    });
  }
});

explorerRouter.patch(
  "/userwatched/:uuid",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const userWatchedMe = await updatePaidWatchStartedFlag(uuid);
        res.send({ userWatchedMe });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorSettiingUserWatchedFlag",
          message: "Could update user watched flag",
        });
      }
    }
  }
);

explorerRouter.delete(
  "/delete/watchlater/:userid/:uuid",
  requireUser,
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("uuid")
    .not()
    .isEmpty()
    .trim()
    .escape(),
  async (req, res, next) => {
    const { userid, uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const userWatchList = await deleteWatchlistVideo(userid, uuid);
        res.send({ removedWatchList: userWatchList });
      } catch (error) {
        next({
          name: "ErrorGettingRemovingFromWatchlist",
          message: "Could not remove from watchlist",
        });
      }
    }
  }
);

explorerRouter.delete(
  "/delete/favs/:userid/:uuid",
  requireUser,
  check("userid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  check("uuid")
    .not()
    .isEmpty()
    .trim()
    .escape(),
  async (req, res, next) => {
    const { userid, uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const favedNo = await deleteFavorite(userid, uuid);
        res.send({ removedFav: favedNo });
      } catch (error) {
        next({
          name: "ErrorGettingRemovingfromFavs",
          message: "Could not remove from favs",
        });
      }
    }
  }
);

explorerRouter.patch(
  "/updatecommentcount/:uuid",
  requireUser,
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const updatedCount = await updateVideoCommentCount(uuid);
        res.send({ comment: updatedCount });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorUpdating",
          message: "Ooops, could not update comment count",
        });
      }
    }
  }
);

explorerRouter.patch(
  "/reducecommentcount/:uuid",
  requireUser,
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { id } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const reducedCount = await reduceVideoCommentCount(uuid);
        res.send({ comment: reducedCount });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorUpdating",
          message: "Ooops, could not reduce comment count",
        });
      }
    }
  }
);

explorerRouter.patch(
  "/flag-comment/:commentid",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { commentid } = req.params;
    let { flagged_reason } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        let flagReason = {
          flagged_reason: flagged_reason,
        };

        const flaggedComm = await setCommentFlag(commentid, flagReason);
        res.send({ comment: flaggedComm });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorUpdating",
          message: "Ooops, could not flag comment",
        });
      }
    }
  }
);

explorerRouter.patch(
  "/flag-video/:uuid",
  requireUser,
  check("uuid").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { uuid } = req.params;
    let { flagged_reason } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        let flagReason = {
          flagged_reason: flagged_reason,
        };

        const flaggedVid = await setVideoFlag(uuid, flagReason);
        res.send({ video: flaggedVid });
      } catch (error) {
        console.log(error);
        next({ name: "ErrorUpdating", message: "Ooops, could not flag video" });
      }
    }
  }
);

explorerRouter.post(
  "/copyright-issue",
  requireUser,
  check("requestor_name").not().isEmpty().trim().escape(),
  check("owner").not().isEmpty().trim().escape(),
  check("relationship").not().isEmpty().trim().escape(),
  check("address").not().isEmpty().trim().escape(),
  check("cit_state_zip").not().isEmpty().trim().escape(),
  check("country").not().isEmpty().trim().escape(),

  async (req, res, next) => {
    let {
      uuid,
      userid,
      requestor_name,
      owner,
      relationship,
      address,
      city_state_zip,
      country,
    } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.array());
    } else {
      try {
        let copyrightPlaintiff = {
          video_uuid: uuid,
          userid: userid,
          requestor_name: requestor_name,
          owner: owner,
          relationship: relationship,
          address: address,
          city_state_zip: city_state_zip,
          country: country,
        };

        const copyrightIssue = await createCopyrightClaim(copyrightPlaintiff);
        res.send({ video: copyrightIssue });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorUpdating",
          message: "Ooops, could not create copyright issue.",
        });
      }
    }
  }
);

explorerRouter.post(
  "/add/watchhistory",
  cors(),
  requireUser,
  async (req, res, next) => {
    const { user } = req.user;
    const userID = req.body.userid;
    const channel = req.body.channelname;
    const channelid = req.body.channelid;
    const videofile = req.body.videofile;
    const videothumbnail = req.body.videothumbnail;
    const videotitle = req.body.videotitle;
    const videoviewcount = req.body.videoviewcount;

    try {
      const videoHistory = {
        userid: userID,
        channelname: channel,
        channelid: channelid,
        videofile: videofile,
        videothumbnail: videothumbnail,
        videotitle: videotitle,
        videoviewcount: videoviewcount,
        uuid: uuid.v4(),
      };
      const newHistory = await createHistoryVideo(videoHistory);
      res.send({ upload: newHistory });
    } catch (error) {
      next({
        name: "ErrorUploadingContent",
        message: "Could not add to history",
      });
      console.log(error);
    }
  }
);

explorerRouter.get(
  "/gethistory/:userid",
  requireUser,
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
        const videohistory = await getUserWatchHistory(userid);
        res.send({ history: videohistory });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorGettinContent",
          message: "Could not get video history",
        });
      }
    }
  }
);

explorerRouter.get("/movierentals", requireUser, async (req, res, next) => {
  try {
    const allmovieRental = await getMovieOrders();
    res.send({ allmovieRental });
  } catch (error) {
    console.log(error);
    next({
      name: "ErrorGettingRentals",
      message: "Ooops, could not get movie orders",
    });
  }
});

module.exports = explorerRouter;
