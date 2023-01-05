const express = require("express");
const uploadsRouter = express.Router();
const { requireUser } = require("./utils");
const path = require("path");
const { check, validationResult } = require("express-validator");
const rateLimiter = require("./ratelimiter");
const multer = require("multer");
const uuid = require("uuid");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "useruploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fieldSize: 10 * 1024 * 1024 },
});
const videoUpload = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

const profilePosterUpdate = upload.single("channel-poster");
const profileAvatarUpdate = upload.single("avatar");

const { uploadVideo, deleteFile, uploadPhotos } = require("../aws");

const {
  createUpload,
  editUpload,
  deleteUpload,
  updatePoster,
  updateAvatar,
  updateUploadsPicture,
  updateCommentsPic,
} = require("../db");

uploadsRouter.get("/", async (req, res) => {
  res.send({ message: "Uploads router" });
});

uploadsRouter.put(
  "/update/poster/:channelname",
  rateLimiter({ secondsWindow: 15, allowedHits: 1 }),
  profilePosterUpdate,
  requireUser,
  check("channelname").not().isEmpty().trim().escape(),
  async (req, res, next) => {
    const { channelname } = req.params;
    const cloudfront = process.env.CLOUDFRONT_URL;
    const pic2 = req.file;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.array());
    } else {
      if (
        req.file.mimetype === "image/jpeg" ||
        req.file.mimetype === "image/png" ||
        req.file.mimetype === "image/jpg" ||
        req.file.mimetype === "image/gif"
      ) {
        try {
          const result1 = await uploadPhotos(pic2);
          const updateData = {
            profile_poster: cloudfront + result1.Key,
          };

          const updatedchannel = await updatePoster(channelname, updateData);
          res.send({ channel: updatedchannel });
        } catch (error) {
          console.error("Could not update user profile", error);
          next(error);
        }
      } else {
        return res.status(400).send({
          name: "Invalid file type or no file found",
          message: "Invalid file type or no file found",
        });
      }
    }
  }
);

uploadsRouter.put(
  "/update/avatar/:channelname",
  requireUser,
  check("channelname").not().isEmpty().trim().escape(),
  profileAvatarUpdate,
  rateLimiter({ secondsWindow: 15, allowedHits: 1 }),
  async (req, res, next) => {
    const { channelname } = req.params;
    const cloudfront = process.env.CLOUDFRONT_URL;
    const pic1 = req.file;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      if (
        req.file.mimetype === "image/jpeg" ||
        req.file.mimetype === "image/png" ||
        req.file.mimetype === "image/jpg" ||
        req.file.mimetype === "image/gif"
      ) {
        try {
          const result = await uploadPhotos(pic1);
          const updatedAvi = {
            profile_avatar: cloudfront + result.Key,
          };
          const updatedchannel = await updateAvatar(channelname, updatedAvi);
          res.send({ channel: updatedchannel });
        } catch (error) {
          console.log("Could not update user profile", error);
          next(error);
        }
      } else {
        return res.status(400).send({
          name: "Invalid file type or no file found",
          message: "Invalid file type or no file found",
        });
      }
    }
  }
);

uploadsRouter.post(
  "/new-upload",
  requireUser,
  rateLimiter({ secondsWindow: 15, allowedHits: 1 }),
  videoUpload,
  check("title").not().isEmpty().trim().escape(),
  check("description").trim().escape(),
  check("tags").trim().escape(),
  check("ticketprice").trim().escape(),
  async (req, res, next) => {
    const { user } = req.user;
    const cloudfront = process.env.CLOUDFRONT_URL;
    const vid = req.files["video"][0];
    const thumbnail = req.files["thumbnail"][0];
    const {
      title,
      description,
      tags,
      channelid,
      channelname,
      content_category,
      content_class,
      rental_price,
      vendor_email,
      stripe_acctid,
    } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      if (
        thumbnail.mimetype === "image/jpeg" ||
        thumbnail.mimetype === "image/png" ||
        thumbnail.mimetype === "image/jpg" ||
        vid.mimetype === "video/mp4" ||
        vid.mimetype === "video/avi" ||
        vid.mimetype === "video/mov" ||
        vid.mimetype === "video/mpeg-4" ||
        vid.mimetype === "video/wmv"
      ) {
        try {
          const video1 = await uploadVideo(vid);
          console.log(video1)
          const thumbnail1 = await uploadPhotos(thumbnail);

          const uploadData = {
            channelID: channelid,
            channelname: channelname,
            videoFile: cloudfront + video1.Key,
            videoKey: video1.Key,
            videoThumbnail: cloudfront + thumbnail1.Key,
            thumbnailKey: thumbnail1.Key,
            videoTitle: title,
            videoDescription: description,
            videoTags: tags,
            content_category: content_category,
            content_class: content_class,
            rental_price: rental_price,
            vendor_email: vendor_email,
            stripe_acctid: stripe_acctid,
            uuid: uuid.v4(),
          };

          const newUpload = await createUpload(uploadData);
          res.send({ upload: newUpload });
        } catch (error) {
          next({
            name: "ErrorUploadingContent",
            message: "Could not upload content",
          });
          console.log(error);
        }
      } else {
        return res
          .status(400)
          .send({ name: "InvalidFiles", message: "Invalid file types" });
      }
    }
  }
);

uploadsRouter.delete(
  "/delete-upload/:id/:key/:thumbnail",
  requireUser,
  async (req, res, next) => {
    const { id, key, thumbnail } = req.params;
    try {
      const deleteIt = await deleteUpload(id);
      const deleteS3 = await deleteFile(key);
      const deleteS3Photo = await deleteFile(thumbnail);
      res.send("Upload Deleted");
    } catch (error) {
      console.log(error);
      next({
        name: "ErrorDeletingContent",
        message: "Could not delete upload",
      });
    }
  }
);

uploadsRouter.put(
  "/edit-upload/:id",
  requireUser,
  check("videotitle").not().isEmpty().trim().escape(),
  check("videodescription").trim().escape(),
  check("videotags").trim().escape(),
  async (req, res, next) => {
    const { id } = req.params;
    const { videotitle, videodescription, videotags } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ name: "Validation Error", message: errors.array()[0].msg });
    } else {
      try {
        const uploadUpdate = {
          videoTitle: videotitle,
          videoDescription: videodescription,
          videoTags: videotags,
        };

        const updateIt = await editUpload(id, uploadUpdate);

        res.send({ updateIt });
      } catch (error) {
        console.log(error);
        next({
          name: "ErrorUpdatingContent",
          message: "Could not update upload",
        });
      }
    }
  }
);

module.exports = uploadsRouter;
