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



async function getAllUsersUsername() {
  const { rows } = await client.query(`
  SELECT users.id AS userid, username, email, user_channel.profile_avatar 
  FROM users
  JOIN users_channel ON users.id = users_channel.userid;
  `);

  return rows;
}

async function getAllChannels() {
  const { rows } = await client.query(
    `SELECT * FROM user_channel order by random() limit 9;`
  );

  return rows;
}


async function getChannelByName(channelName) {
  try {
    const {
      rows: [channels],
    } = await client.query(
      `
  SELECT *, user_channel.id AS channelid
  FROM user_channel
  WHERE channelName=$1;
  `,
      [channelName]
    );

    return channels;
  } catch (error) {
    console.log("Could not get user channel in db");
  }
}

async function goLive(id) {
  try {
    const {
      rows: [channel],
    } = await client.query(
      `
              UPDATE user_channel
              SET user_isLive='true'
              WHERE id=$1
              RETURNING *;
            `,
      [id]
    );

    return channel;
  } catch (error) {
    throw error;
  }
}

async function endLive(id) {
  try {
    const {
      rows: [channel],
    } = await client.query(
      `
              UPDATE user_channel
              SET user_isLive='false'
              WHERE id=$1
              RETURNING *;
            `,
      [id]
    );

    return channel;
  } catch (error) {
    throw error;
  }
}


async function updateChannelSubsStatus(id) {
  try {
    const { rows } = await client.query(
      `
              UPDATE user_channel
              SET vendoractive='true'
              WHERE id=$1
              RETURNING *;
            `,
      [id]
    );
    return rows;
  } catch (error) {
    throw error;
  }
  
  async function verifyUserSubscriptionStatus(id) {
  try {
    const { rows } = await client.query(
      `
              SELECT * FROM users
              WHERE id=$1;
            `,
      [id]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}
  
  
//API
  
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

