async function getAllUploads() {
  const { rows } = await client.query(`
  SELECT *, channel_uploads.id AS videoID
  FROM channel_uploads
  ORDER BY random();
  `);

  return rows;
}


async function videoLikesZero() {
  try {
    const { rows } = await client.query(
      `
              UPDATE channel_uploads
              SET videolikecount = 0
              RETURNING *;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function videoDisLikesZero() {
  try {
    const { rows } = await client.query(
      `
              UPDATE channel_uploads
              SET videodislikecount = 0
              RETURNING *;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function videoViewsZero() {
  try {
    const { rows } = await client.query(
      `
              UPDATE channel_uploads
              SET videoviewcount = 0
              RETURNING *;
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function allUserLikesZero() {
  try {
    const { rows } = await client.query(
      `DELETE 
       FROM user_video_likes;
      `
    );

    await client.query(
      `DELETE 
       FROM user_video_dislikes;
      `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function allUserLikes() {
  try {
    const { rows } = await client.query(
      `SELECT *
       FROM user_video_likes;
      `
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function allUserDisLikes() {
  try {
    const { rows } = await client.query(
      `SELECT *
       FROM user_video_dislikes;
      `
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function allCommentCountZero() {
  try {
    const { rows } = await client.query(
      `UPDATE channel_uploads
       SET videocommentcount=0;
      `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}





async function updateUploadsPicture(channelname, pic) {
  const { channelavi } = pic;
  try {
    const { rows } = await client.query(
      `
              UPDATE channel_uploads
              SET channelavi=$2
              WHERE channelname=$1
              RETURNING *;
            `,
      [channelname, channelavi]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateCommentsPic(commentorName, pic) {
  const { commentorpic } = pic;
  try {
    const { rows } = await client.query(
      `
              UPDATE upload_comments
              SET commentorPic=$2
              WHERE commentorName=$1
              RETURNING *;
            `,
      [commentorName, commentorpic]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}


async function getVideoByID(id) {
  try {
    const { rows } = await client.query(
      `
    
  SELECT *, channel_uploads.id AS videoid
  FROM channel_uploads 
  WHERE id=$1;
  `,
      [id]
    );
    return rows;
  } catch (error) {
    console.error("Could not get that video");
  }
}

async function getAllUsers() {
  const { rows } = await client.query(`SELECT * FROM users;`);

  return rows;
}


async function zeroSubs() {
  try {
    const { rows } = await client.query(
      `
              UPDATE user_channel
              SET subscriber_count = 0
              RETURNING *;
            `
    );

    return rows;
  } catch (error) {
    throw error;
  }
}


//Inactive Vendor

// UPDATE vendors
// SET registered = 'false'
// WHERE id = $1

// UPDATE products
// SET vendoractive='false', prod_quantity=0
// WHERE vendorid=$1

// UPDATE users_channel
// SET vendoractive = 'false'
// WHERE id=$1

// UPDATE usersuploads
// SET paid_content = 'free',
// WHERE id=$1

//    UPDATE users
//    SET farivendor_subed='false'
//    WHERE id=$1

