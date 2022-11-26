const express = require("express");
const explorerRouter = express.Router();
const { requireUser } = require("./utils");
const rateLimiter = require("./ratelimiter");
const { check, validationResult } = require("express-validator");

const cors = require("cors");
explorerRouter.use(cors());

const {
  getAllUploads,
  getUploadByID,
  createComments,
  getVideoComments,
  videoSearch,
  vlogSearch,
  movieSearch,
  showsSearch,
  animationSearch,
  videoLikes,
  createFavs,
  createLaters,
  getUserSubs,
  getUserFavs,
  getUserLaters,
  getUserSubsUploads,
  updateVideoViews,
  videoDisLikes,
  getUserSubsLimit,
  usersLikes,
  usersDisLikes,
  myLikes,
  myDisLikes,
  getVideo,
  deleteLaters,
  deleteFavs,
  revokeLikes,
  revokeDisLikes,
  userUnLikes,
  userUnDisLikes,
  getLimitedUploads,
  editComment,
  deleteComment,
  getLiveChannels,
  getPayToViewContent,
  getFreeContent,
  getMovieOrders,
  updatePaidWatchStarted,
  reduceUserCommentCount,
  updateUserCommentCount,
  flaggedComment,
  flaggedVideo,
  copyrightClaim,
  getTopUploads,
  watchHistory,
  getHistory,
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

explorerRouter.get("/", requireUser, async (req, res, next) => {
  try {
    const allContent = await getAllUploads();
    res.send({ uploads: allContent });
  } catch (error) {
    next({
      name: "ErrorGettingUploads",
      message: "Could Not get the uploads",
    });
  }
});

explorerRouter.get(
  "/discover",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  requireUser,
  async (req, res, next) => {
    try {
      const freeContent = await getFreeContent();
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

explorerRouter.get(
  "/popular-uploads",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  requireUser,
  async (req, res, next) => {
    // let getCache = await redisClient.get("popularContent");
    // await redisClient.expire("popularContent", 200);
    // if (getCache && getCache != null) {
    //   console.log("cache found");
    //   res.send({ uploads: JSON.parse(getCache) });
    // } else {
    //   console.log("no cache found");
    try {
      const freeContent = await getTopUploads();
      //     let setData = await redisClient.set(
      //       "popularContent",
      //       JSON.stringify(freeContent)
      //     );
      res.send({ uploads: freeContent });
    } catch (error) {
      console.log(error);
      next({
        name: "ErrorGettingUploads",
        message: "Could Not get the free uploads",
      });
    }
    // }
  }
);

explorerRouter.get(
  "/paytoview",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  requireUser,
  async (req, res, next) => {
    try {
      const payContent = await getPayToViewContent();
      res.send({ uploads: payContent });
    } catch (error) {
      next({
        name: "ErrorGettingUploads",
        message: "Could Not get the paid uploads",
      });
    }
  }
);

explorerRouter.get(
  "/recommended",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  requireUser,
  async (req, res, next) => {
    try {
      const recUploads = await getLimitedUploads();
      res.send({ uploads: recUploads });
    } catch (error) {
      next({
        name: "ErrorGettingUploads",
        message: "Could Not get the uploads",
      });
    }
  }
);

explorerRouter.get(
  "/getVideo/:videoid",
  requireUser,
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const selectedVideo = await getVideo(videoid);
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
  requireUser,
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
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

explorerRouter.get(
  "/search/vlogs",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  requireUser,
  async (req, res, next) => {
    try {
      const vlogVids = await vlogSearch();
      //     redisClient.set("vloggerContent", JSON.stringify(vlogVids));
      res.send({ videos: vlogVids });
    } catch (error) {
      console.log("Oops could not find search results", error);
      next({
        name: "ErrorGettingSearchResults",
        message: "Could not get the search results for Vloggers",
      });
    }
  }
);

explorerRouter.get(
  "/search/animations",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
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

explorerRouter.get(
  "/search/movies",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  requireUser,
  async (req, res, next) => {
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
    // }
  }
);

explorerRouter.get(
  "/search/shows",
  rateLimiter({ secondsWindow: 60, allowedHits: 5 }),
  requireUser,
  async (req, res, next) => {
    try {
      const showsVids = await showsSearch();
      res.send({ videos: showsVids });
    } catch (error) {
      console.log("Oops could not find search results", error);
      next({
        name: "ErrorGettingSearchResults",
        message: "Could not get the search results for Shows",
      });
    }
    // }
  }
);

explorerRouter.post(
  "/youlikeme/:id",
  requireUser,
  rateLimiter({ secondsWindow: 10, allowedHits: 2 }),
  check("id")
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
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
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
          videoid: videoid,
        };

        const upvote = await videoLikes(id);
        const likedVid = await usersLikes(likingUser);
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
  "/youlikeme/revoke/:id/:videoid",
  requireUser,
  check("id")
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
    const { id, videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const unlikedVid = await userUnLikes(id);
        const removeLike = await revokeLikes(videoid);
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
  "/youdislikeme/:id",
  requireUser,
  rateLimiter({ secondsWindow: 10, allowedHits: 2 }),
  check("id")
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
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { id } = req.params;
    const { userid, videoid } = req.body;

    const dislikingUser = {
      userid: userid,
      videoid: videoid,
    };
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const downvote = await videoDisLikes(id);
        const dislikedVid = await usersDisLikes(dislikingUser);
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
  "/youdislikeme/revoke/:userid/:videoid",
  requireUser,
  check("id")
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
    const { userid, videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const undislikedVid = await userUnDisLikes(userid);
        const removeDislike = await revokeDisLikes(videoid);
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
  "/mylikes/:videoid/:userid",
  requireUser,
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
    const { videoid, userid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const myLike = await myLikes(videoid, userid);
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
  "/mydislikes/:videoid/:userid",
  requireUser,
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
    const { videoid, userid } = req.params;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const myDisLike = await myDisLikes(videoid, userid);
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
  "/update/viewcount/:videoid",
  requireUser,
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const likedVid = await updateVideoViews(videoid);
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
  "/play/:videoid",
  requireUser,
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const playMe = await getUploadByID(videoid);
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
  rateLimiter({ secondsWindow: 10, allowedHits: 1 }),
  check("user_comment").not().isEmpty().trim().escape(),
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { videoid, commentorid, commentorname, commentorpic, user_comment } =
      req.body;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array() });
    } else {
      try {
        const commentData = {
          videoID: videoid,
          commentorID: commentorid,
          commentorName: commentorname,
          commentorPic: commentorpic,
          user_comment: user_comment,
        };

        const userComment = await createComments(commentData);
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
  rateLimiter({ secondsWindow: 10, allowedHits: 1 }),
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
  "/comments/:videoid",
  requireUser,
  check("videoid")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const videoComments = await getVideoComments(videoid);
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
        const userSubs = await getUserSubs(userid);
        res.send({ mysubscriptions: userSubs });
      } catch (error) {
        next({
          name: "ErrorGettingUserSubs",
          message: "Could not get subscriptions",
        });
      }
    }
  }
);

explorerRouter.get(
  "/recentuploads/subs/:userid",
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
        const recentUploadedSubs = await getUserSubsLimit(userid);
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
  "/subs/uploads/:userid",
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
        const subUploads = await getUserSubsUploads(userid);
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
        const userFaved = await getUserFavs(userid);
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
  const channel_avi = req.body.channelavi;
  const video = req.body.videofile;
  const thumbnail = req.body.videothumbnail;
  const title = req.body.videotitle;
  const channelidentification = req.body.channelid;
  const videoviewcount = req.body.videoviewcount;
  try {
    const favedData = {
      userid: userid,
      videoid: videoid,
      channelname: channel,
      channelavi: channel_avi,
      videofile: video,
      videothumbnail: thumbnail,
      videotitle: title,
      channelid: channelidentification,
      videoviewcount: videoviewcount,
    };

    const usersFaved = await createFavs(favedData);
    res.send({ myFavorites: usersFaved });
  } catch (error) {
    console.log(error);
    next({ name: "ErrorSettiingUserFav", message: "Could not fav this video" });
  }
});

explorerRouter.get(
  "/watchlater/:userid",
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
        const userWatchList = await getUserLaters(userid);
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

explorerRouter.post("/watchlist", requireUser, async (req, res, next) => {
  const userid = req.body.userid;
  const videoid = req.body.videoid;
  const channel = req.body.channelname;
  const channel_avi = req.body.channelavi;
  const video = req.body.videofile;
  const thumbnail = req.body.videothumbnail;
  const title = req.body.videotitle;
  const channelident = req.body.channelid;
  const views = req.body.videoviewcount;
  const paidtoview = req.body.paidtoview;

  try {
    const laterData = {
      userid: userid,
      videoid: videoid,
      channelname: channel,
      channelavi: channel_avi,
      videofile: video,
      videothumbnail: thumbnail,
      videotitle: title,
      channelid: channelident,
      videoviewcount: views,
      paidtoview: paidtoview,
    };

    const usersList = await createLaters(laterData);
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
  "/userwatched/:id",
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
        const userWatchedMe = await updatePaidWatchStarted(id);
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
  "/delete/watchlater/:userid/:videoid",
  requireUser,
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
    const { userid, videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const userWatchList = await deleteLaters(userid, videoid);
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
  "/delete/favs/:userid/:videoid",
  requireUser,
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
    const { userid, videoid } = req.params;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const favedNo = await deleteFavs(userid, videoid);
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
  "/updatecommentcount/:id",
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
        const updatedCount = await updateUserCommentCount(id);
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
  "/reducecommentcount/:id",
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
        const reducedCount = await reduceUserCommentCount(id);
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

        const flaggedComm = await flaggedComment(commentid, flagReason);
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
  "/flag-video/:videoid",
  requireUser,
  check("id")
    .not()
    .isEmpty()
    .isNumeric()
    .withMessage("Not a valid value")
    .trim()
    .escape(),
  async (req, res, next) => {
    const { videoid } = req.params;
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

        const flaggedVid = await flaggedVideo(videoid, flagReason);
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
    const { id } = req.params;
    let {
      videoid,
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
          videoid: videoid,
          userid: userid,
          requestor_name: requestor_name,
          owner: owner,
          relationship: relationship,
          address: address,
          city_state_zip: city_state_zip,
          country: country,
        };

        const copyrightIssue = await copyrightClaim(copyrightPlaintiff);
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
  "/watchhistory",
  cors(),
  requireUser,
  async (req, res, next) => {
    const { user } = req.user;
    const userID = req.body.userid;
    const videoid = req.body.videoid;
    const channel = req.body.channelname;
    const channel_avi = req.body.channelavi;
    const channelid = req.body.channelid;
    const videofile = req.body.videofile;
    const videothumbnail = req.body.videothumbnail;
    const videotitle = req.body.videotitle;
    const videoviewcount = req.body.videoviewcount;

    try {
      const videoHistory = {
        userid: userID,
        videoid: videoid,
        channelname: channel,
        channelavi: channel_avi,
        channelid: channelid,
        videofile: videofile,
        videothumbnail: videothumbnail,
        videotitle: videotitle,
        videoviewcount: videoviewcount,
      };
      const newHistory = await watchHistory(videoHistory);
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
        const videohistory = await getHistory(userid);
        res.send({ history: videohistory });
      } catch (error) {
        next({
          name: "ErrorGettinContent",
          message: "Could not get video history",
        });
        console.log(error);
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
