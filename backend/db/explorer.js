const client = require("./client");

async function createUpload({
  channelID,
  channelname,
  videoFile,
  videoKey,
  videoThumbnail,
  thumbnailKey,
  videoTitle,
  videoDescription,
  videoTags,
  content_category,
  content_class,
  rental_price,
  vendor_email,
  stripe_acctid,
  uuid,
}) {
  try {
    const {
      rows: [uploads],
    } = await client.query(
      `
              INSERT INTO channel_uploads(channelID, channelname, videoFile, videoKey, videoThumbnail, thumbnailKey, videoTitle, videoDescription, videoTags, content_category, content_class, rental_price, vendor_email, stripe_acctid, uuid) 
              VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              RETURNING *;
            `,
      [
        channelID,
        channelname,
        videoFile,
        videoKey,
        videoThumbnail,
        thumbnailKey,
        videoTitle,
        videoDescription,
        videoTags,
        content_category,
        content_class,
        rental_price,
        vendor_email,
        stripe_acctid,
        uuid,
      ]
    );
    return uploads;
  } catch (error) {
    throw error;
  }
}

async function editUpload(uuid, { videoTitle, videoDescription, videoTags }) {
  try {
    const { rows } = await client.query(
      `
              UPDATE channel_uploads
              SET videoTitle=$2, videoDescription=$3, videoTags=$4
              WHERE uuid=$1
              RETURNING *;
            `,
      [uuid, videoTitle, videoDescription, videoTags]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function deleteUpload(uuid) {
  try {
    const {
      rows: [upload],
    } = await client.query(
      `
       DELETE FROM channel_uploads
       WHERE uuid=$1
       RETURNING *;
            `,
      [uuid]
    );
    return upload;
  } catch (error) {
    throw error;
  }
}

async function createComment({
  commentorID,
  commentorName,
  user_comment,
  video_uuid,
}) {
  try {
    const {
      rows: [comment],
    } = await client.query(
      `
              INSERT INTO upload_comments(commentorID, commentorName, user_comment, video_uuid) 
              VALUES($1, $2, $3, $4)
              RETURNING *;
            `,
      [commentorID, commentorName, user_comment, video_uuid]
    );
    return comment;
  } catch (error) {
    throw error;
  }
}

async function editComment(id, thecomment) {
  const { user_comment } = thecomment;
  try {
    const { rows } = await client.query(
      `
              UPDATE upload_comments
              SET user_comment=$2
              WHERE id=$1
              RETURNING *;
     `,
      [id, user_comment]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function deleteComment(id) {
  try {
    const { rows } = await client.query(
      `
              DELETE
              FROM upload_comments
              WHERE id=$1;
            `,
      [id]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getVideoComments(video_uuid) {
  try {
    const { rows } = await client.query(
      `
    
  SELECT *, upload_comments.id AS commentid, user_channel.id AS channelid, user_channel.profile_avatar
  FROM upload_comments
  INNER JOIN user_channel ON upload_comments.commentorname = user_channel.channelname
  WHERE video_uuid=$1;
  `,
      [video_uuid]
    );
    return rows;
  } catch (error) {
    console.error("Could not get that video");
  }
}

async function updateVideoCommentCount(uuid) {
  try {
    const { rows } = await client.query(
      `UPDATE channel_uploads
       SET videocommentcount= videocommentcount + 1
       WHERE uuid=$1;
      `,
      [uuid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function reduceVideoCommentCount(uuid) {
  try {
    const { rows } = await client.query(
      `UPDATE channel_uploads
       SET videocommentcount= videocommentcount - 1
       WHERE uuid=$1;
      `,
      [uuid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUploadByID(uuid) {
  try {
    const { rows } = await client.query(
      `
    
  SELECT *, channel_uploads.id AS videoID, user_channel.channelname, user_channel.profile_avatar
  FROM channel_uploads 
  INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
  WHERE channel_uploads.uuid=$1;
  `,
      [uuid]
    );
    return rows;
  } catch (error) {
    console.error("Could not get that video");
  }
}

async function getVideoByID(uuid) {
  try {
    const { rows } = await client.query(
      `
    
  SELECT *, channel_uploads.id AS videoid
  FROM channel_uploads 
  WHERE uuid=$1;
  `,
      [uuid]
    );
    return rows;
  } catch (error) {
    console.error("Could not get that video");
  }
}

async function getDiscoverContent() {
  const { rows } = await client.query(`
  SELECT *, channel_uploads.id AS videoID, user_channel.profile_avatar
  FROM channel_uploads
  INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
  WHERE content_class='free' OR content_class IS NULL
  ORDER BY random() limit 1000;
  `);

  return rows;
}

async function getPayToViewContent() {
  const { rows } = await client.query(`
  SELECT *, channel_uploads.id AS videoID, user_channel.profile_avatar, vendors.stripe_acctid
  FROM channel_uploads
  INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
  INNER JOIN vendors ON channel_uploads.channelname = vendors.vendorname
  WHERE content_category='film' AND content_class='paid' OR content_category='series' AND content_class='paid'
  ORDER BY random() limit 1000;
  `);

  return rows;
}

async function getRecommendedUploads() {
  const { rows } = await client.query(`
  SELECT *, channel_uploads.id AS videoID, user_channel.profile_avatar
  FROM channel_uploads
  INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
  WHERE content_class='free' OR content_class IS NULL OR content_category='vlog' OR content_category='other' OR content_category IS NULL
  ORDER BY random() limit 200;
  `);

  return rows;
}

async function getTopUploads() {
  const { rows } = await client.query(`
  SELECT *, channel_uploads.id AS videoID, user_channel.profile_avatar
  FROM channel_uploads
  INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
  WHERE content_class='free' AND videolikecount >=10000 
  OR content_class IS NULL AND videolikecount >=10000  
  OR content_category='vlog'  AND videolikecount >=10000 
  OR content_category='other' AND videolikecount >=10000 
  OR content_category IS NULL AND videolikecount >=10000 
  OR videoviewcount >=10000
  ORDER BY random() limit 9;
  `);

  return rows;
}

async function getTopChannels() {
  const { rows } = await client.query(`
  SELECT *
  FROM user_channel
  WHERE subscriber_count >= 500
  ORDER BY random() limit 9;
  `);

  return rows;
}

async function videoSearch(query) {
  try {
    const { rows } = await client.query(
      `
              SELECT *, channel_uploads.id AS videoid, user_channel.profile_avatar
              FROM channel_uploads
              INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
              WHERE videotags ILIKE N'%${query}%' OR videotitle ILIKE N'%${query}%' OR channel_uploads.channelname ILIKE N'%${query}%'
              ORDER BY random();
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function animationSearch() {
  try {
    const { rows } = await client.query(
      `
              SELECT *, channel_uploads.id AS videoid, user_channel.profile_avatar
              FROM channel_uploads
              INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
              WHERE videotags ILIKE any (array['%Animation%','%Animiations%', '%Animated%']) AND content_class='free' OR videotags ILIKE any (array['%Animation%','%Animations%', '%Animated%']) AND content_class IS NULL
              ORDER BY random() limit 1000;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function movieSearch() {
  try {
    const { rows } = await client.query(
      `
              SELECT *, channel_uploads.id AS videoid, user_channel.profile_avatar
              FROM channel_uploads
              INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
              WHERE content_category='film' AND content_class='free' OR content_category='film' AND content_class IS NULL OR videotags ILIKE any (array['%Movie%', '%ShortFilm%', '%Films%', '%FullMovie%']) AND content_class='free' OR videotags ILIKE any (array['%Movie%', '%ShortFilm%', '%Films%', '%FullMovie%']) AND content_class IS NULL
              ORDER BY random() limit 1000;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function seriesSearch() {
  try {
    const { rows } = await client.query(
      `
              SELECT *, channel_uploads.id AS videoid, user_channel.profile_avatar
              FROM channel_uploads
              INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
              WHERE content_category='series' AND content_class='free' OR content_category='series' AND content_class IS NULL OR videotags ILIKE any (array['%Series%','%Sitcom%', '%Webseries%']) AND content_class='free' OR videotags ILIKE any (array['%Series%','%Sitcom%', '%Webseries%']) AND content_class IS NULL
              ORDER BY random() limit 1000;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function vlogSearch() {
  try {
    const { rows } = await client.query(
      `
              SELECT *, channel_uploads.id AS videoid, user_channel.profile_avatar
              FROM channel_uploads
              INNER JOIN user_channel ON channel_uploads.channelid = user_channel.id
              WHERE content_category='vlog' OR videotags ILIKE any (array['%Vlog%','%Vlogs%']) AND content_class='free' OR videotags ILIKE any (array['%Vlog%','%Vlogs%']) AND content_class IS NULL
              ORDER BY random() limit 1000;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function addVideoLike(uuid) {
  try {
    const {
      rows: [uploads],
    } = await client.query(
      `
              UPDATE channel_uploads
              SET videolikecount = videolikecount + 1
              WHERE uuid=$1
              RETURNING *;
            `,
      [uuid]
    );
    return uploads;
  } catch (error) {
    throw error;
  }
}

async function revokeVideoLike(uuid) {
  try {
    const {
      rows: [uploads],
    } = await client.query(
      `
              UPDATE channel_uploads
              SET videolikecount = videolikecount - 1
              WHERE uuid=$1
              RETURNING *;
            `,
      [uuid]
    );
    return uploads;
  } catch (error) {
    throw error;
  }
}

async function createUserVideoLike({ userid, video_uuid }) {
  try {
    const {
      rows: [likedvideo],
    } = await client.query(
      `
              INSERT INTO user_video_likes(userid, video_uuid)
              VALUES($1, $2)
              RETURNING *;
            `,
      [userid, video_uuid]
    );
    return likedvideo;
  } catch (error) {
    throw error;
  }
}

async function removeUserVideoLike(id) {
  try {
    const {
      rows: [likedvideo],
    } = await client.query(
      `
              DELETE FROM user_video_likes
              WHERE id=$1;
            `,
      [id]
    );
    return likedvideo;
  } catch (error) {
    throw error;
  }
}

async function checkUserVideoLikeStatus(video_uuid, userid) {
  try {
    const { rows } = await client.query(
      `
              SELECT *, user_video_likes.id AS likeid
              FROM user_video_likes
              WHERE video_uuid=$1 AND userid=$2 ;
            `,
      [video_uuid, userid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function addVideoDislike(uuid) {
  try {
    const {
      rows: [uploads],
    } = await client.query(
      `
              UPDATE channel_uploads
              SET videodislikecount = videodislikecount + 1
              WHERE uuid=$1
              RETURNING *;
            `,
      [uuid]
    );
    return uploads;
  } catch (error) {
    throw error;
  }
}

async function revokeVideoDislike(uuid) {
  try {
    const {
      rows: [uploads],
    } = await client.query(
      `
              UPDATE channel_uploads
              SET videodislikecount = videodislikecount - 1
              WHERE uuid=$1
              RETURNING *;
            `,
      [uuid]
    );
    return uploads;
  } catch (error) {
    throw error;
  }
}

async function createUserVideoDislike({ userid, video_uuid }) {
  try {
    const {
      rows: [dislikedvideo],
    } = await client.query(
      `
              INSERT INTO user_video_dislikes(userid, video_uuid)
              VALUES($1, $2)
              RETURNING *;
            `,
      [userid, video_uuid]
    );
    return dislikedvideo;
  } catch (error) {
    throw error;
  }
}

async function removeUserVideoDislike(id) {
  try {
    const {
      rows: [dislikedvideo],
    } = await client.query(
      `
              DELETE FROM user_video_dislikes
              WHERE id=$1;
            `,
      [id]
    );
    return dislikedvideo;
  } catch (error) {
    throw error;
  }
}

async function checkUserVideoDislikeStatus(video_uuid, userid) {
  try {
    const { rows } = await client.query(
      `
              SELECT *, user_video_dislikes.id AS dislikeid
              FROM user_video_dislikes
              WHERE video_uuid=$1 AND userid=$2;
            `,
      [video_uuid, userid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateVideoViews(uuid) {
  try {
    const {
      rows: [uploads],
    } = await client.query(
      `
              UPDATE channel_uploads
              SET videoviewcount = videoviewcount + 1
              WHERE uuid=$1
              RETURNING *;
            `,
      [uuid]
    );
    return uploads;
  } catch (error) {
    throw error;
  }
}

async function createFavorite({
  userid,
  channelname,
  videofile,
  videothumbnail,
  videotitle,
  channelid,
  videoviewcount,
  video_uuid,
}) {
  try {
    const {
      rows: [favs],
    } = await client.query(
      `
              INSERT INTO user_favorites(userid, channelname, videofile, videothumbnail, videotitle, channelid, videoviewcount, video_uuid) 
              VALUES($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING *;
            `,
      [
        userid,
        channelname,
        videofile,
        videothumbnail,
        videotitle,
        channelid,
        videoviewcount,
        video_uuid,
      ]
    );
    return favs;
  } catch (error) {
    throw error;
  }
}

async function deleteFavorite(userid, video_uuid) {
  try {
    const { rows } = await client.query(
      `
              DELETE FROM user_favorites
              WHERE userid=$1 AND video_uuid=$2;
            `,
      [userid, video_uuid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserFavorites(userid) {
  try {
    const { rows } = await client.query(
      `SELECT *, user_channel.profile_avatar
       FROM user_favorites
       INNER JOIN user_channel ON user_favorites.channelid = user_channel.id
       WHERE user_favorites.userid=$1;
      `,
      [userid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function createWatchlistVideo({
  userid,
  channelname,
  videofile,
  videothumbnail,
  videotitle,
  channelid,
  videoviewcount,
  paidtoview,
  video_uuid,
}) {
  try {
    const {
      rows: [watchlater],
    } = await client.query(
      `
              INSERT INTO user_watchlist(userid, channelname, videofile, videothumbnail, videotitle, channelid, videoviewcount, paidtoview, video_uuid) 
              VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING *;
            `,
      [
        userid,
        channelname,
        videofile,
        videothumbnail,
        videotitle,
        channelid,
        videoviewcount,
        paidtoview,
        video_uuid,
      ]
    );
    return watchlater;
  } catch (error) {
    throw error;
  }
}

async function deleteWatchlistVideo(userid, video_uuid) {
  try {
    const { rows } = await client.query(
      `
              DELETE FROM user_watchlist
              WHERE userid=$1 AND video_uuid=$2;
            `,
      [userid, video_uuid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserWatchlist(userid) {
  try {
    const { rows } = await client.query(
      `SELECT *, user_channel.profile_avatar
       FROM user_watchlist
       INNER JOIN user_channel ON user_watchlist.channelid = user_channel.id
       WHERE user_watchlist.userid=$1;
      `,
      [userid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function removePurchasedWatchlistVideosThreeDays() {
  try {
    const { rows } = await client.query(
      `
              DELETE FROM user_watchlist
              WHERE paidtoview='true' AND user_started_watching='true' AND watchlaterdt < DATE(NOW() - INTERVAL 3 DAY) ;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function updatePaidWatchStartedFlag(video_uuid) {
  try {
    const { rows } = await client.query(
      `UPDATE user_watchlist
       SET user_started_watching='true', first_viewingDT=CURRENT_DATE 
       WHERE video_uuid=$1;
      `,
      [video_uuid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function createChannelSubscription({ userid, channelID, channelname }) {
  try {
    const {
      rows: [subs],
    } = await client.query(
      `
              INSERT INTO user_subscriptions(userid, channelID, channelname) 
              VALUES($1, $2, $3)
              RETURNING *;
            `,
      [userid, channelID, channelname]
    );
    return subs;
  } catch (error) {
    throw error;
  }
}

async function removeChannelSubscription(userid, channelid) {
  try {
    const { rows } = await client.query(
      `
              DELETE FROM user_subscriptions WHERE userid=$1 AND channelid=$2
              RETURNING *;
            `,
      [userid, channelid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserSubscriptions(userid) {
  try {
    const { rows } = await client.query(
      `SELECT *, user_channel.profile_avatar
       FROM user_subscriptions
       INNER JOIN user_channel ON user_subscriptions.channelid = user_channel.id
       WHERE user_subscriptions.userid=$1;
      `,
      [userid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function checkUserSubscriptionStatusToChannel(userid, channelID) {
  try {
    const { rows } = await client.query(
      `SELECT * 
       FROM user_subscriptions
       WHERE userid=$1 AND channelID=$2;
      `,
      [userid, channelID]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserSubscriptionsLimited(userid) {
  try {
    const { rows } = await client.query(
      `SELECT *, user_channel.profile_avatar
       FROM user_subscriptions
       INNER JOIN user_channel ON user_subscriptions.channelid = user_channel.id
       WHERE user_subscriptions.userid=$1
       ORDER BY random() limit 20;
      `,
      [userid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserSubscriptionUploads(userid) {
  try {
    const { rows } = await client.query(
      `SELECT *, channel_uploads.id AS videoid, user_channel.profile_avatar
       FROM user_subscriptions
       INNER JOIN channel_uploads ON user_subscriptions.channelid = channel_uploads.channelID
       INNER JOIN user_channel ON user_subscriptions.channelid = user_channel.id
       WHERE user_subscriptions.userid=$1;
      `,
      [userid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

//Movie Orders

async function createMovieOrders({
  channelid,
  videothumbnail,
  userid,
  videotitle,
  videoprice,
  vendor_email,
  video_uuid,
}) {
  try {
    const {
      rows: [order],
    } = await client.query(
      `
              INSERT INTO customer_movie_orders(channelid, videothumbnail, userid, videotitle, videoprice, vendor_email, video_uuid) 
              VALUES($1, $2, $3, $4, $5, $6, $7)
              RETURNING *;
            `,
      [
        channelid,
        videothumbnail,
        userid,
        videotitle,
        videoprice,
        vendor_email,
        video_uuid,
      ]
    );
    return order;
  } catch (error) {
    throw error;
  }
}

async function getMovieOrders() {
  try {
    const { rows } = await client.query(`
    
  SELECT *, customer_movie_orders.id AS rentalId
  FROM customer_movie_orders
  RETURNING *;
  `);
    return rows;
  } catch (error) {
    console.error("Could not get that video");
  }
}

async function setVendorActiveVideoStatus(channelid) {
  try {
    const { rows } = await client.query(
      `UPDATE channel_uploads
       SET vendoractive = 'true'
       WHERE channelid=$1;
      `,
      [channelid]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function setVideoFlag(uuid, theReason) {
  let { flagged_reason } = theReason;
  try {
    const { rows } = await client.query(
      `UPDATE channel_uploads
       SET flagged_content = 'true', flagged_reason=$2
       WHERE uuid=$1;
      `,
      [uuid, flagged_reason]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function setCommentFlag(id, theReason) {
  let { flagged_reason } = theReason;
  try {
    const { rows } = await client.query(
      `UPDATE upload_comments
       SET flagged_comment = 'true', flagged_reason=$2
       WHERE id=$1;
      `,
      [id, flagged_reason]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function createCopyrightClaim({
  uuid,
  userid,
  requestor_name,
  owner,
  relationship,
  address,
  city_state_zip,
  country,
}) {
  try {
    const {
      rows: [flagged_upload],
    } = await client.query(
      `
              INSERT INTO upload_copyright_reports(uuid, userid, requestor_name, owner, relationship, address, city_state_zip, country) 
              VALUES($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING *;
            `,
      [
        uuid,
        userid,
        requestor_name,
        owner,
        relationship,
        address,
        city_state_zip,
        country,
      ]
    );
    return flagged_upload;
  } catch (error) {
    throw error;
  }
}

async function createHistoryVideo({
  userid,
  videoid,
  channelname,
  channelid,
  videofile,
  videothumbnail,
  videotitle,
  videoviewcount,
  uuid,
}) {
  try {
    const {
      rows: [history],
    } = await client.query(
      `
              INSERT INTO user_watch_history(userid, videoid, channelname, channelid, videofile, videothumbnail, videotitle, videoviewcount, uuid) 
              VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9 )
              RETURNING *;
            `,
      [
        userid,
        videoid,
        channelname,
        channelid,
        videofile,
        videothumbnail,
        videotitle,
        videoviewcount,
        uuid,
      ]
    );
    return history;
  } catch (error) {
    throw error;
  }
}

async function getUserWatchHistory(userid) {
  try {
    const { rows } = await client.query(
      `  
    SELECT *, user_channel.profile_avatar
    FROM user_watch_history
    INNER JOIN user_channel ON user_watch_history.channelid = user_channel.id
    WHERE user_watch_history.userid=$1
  `,
      [userid]
    );
    return rows;
  } catch (error) {
    console.error("Could not get history videos");
  }
}

module.exports = {
  client,
  createUpload,
  editUpload,
  deleteUpload,

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

  createChannelSubscription,
  removeChannelSubscription,
  getUserSubscriptions,
  checkUserSubscriptionStatusToChannel,
  getUserSubscriptionsLimited,
  getUserSubscriptionUploads,

  createMovieOrders,
  getMovieOrders,

  setVendorActiveVideoStatus,

  setVideoFlag,
  setCommentFlag,

  createCopyrightClaim,
};
