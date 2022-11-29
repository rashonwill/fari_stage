const client = require("./client");
const bcrypt = require("bcrypt");
const SALT_COUNT = 10;

async function createUser({
  username,
  email,
  password,
  confirmpassword,
  location,
}) {
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT);
  const confirmedhashedPassword = await bcrypt.hash(
    confirmpassword,
    SALT_COUNT
  );
  try {
    const {
      rows: [user],
    } = await client.query(
      `
                INSERT INTO users(username, email, password, confirmpassword, location) 
                VALUES($1, $2, $3, $4, $5)
                RETURNING *;
              `,
      [username, email, hashedPassword, confirmedhashedPassword, location]
    );

    await client.query(
      `
     
     INSERT INTO user_channel(userID, channelName) 
                VALUES($1, $2)
                RETURNING *;
     `,
      [user.id, username]
    );

    await client.query(
      `
     
     INSERT INTO vendors(userid, vendorname) 
                VALUES($1, $2)
                RETURNING *;
     `,
      [user.id, username]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

async function createChannel({
  userID,
  channelname,
  profile_avatar,
  profile_poster,
}) {
  try {
    const {
      rows: [channel],
    } = await client.query(
      `
                INSERT INTO user_channel( userID, channelname, profile_avatar, profile_poster) 
                VALUES($1, $2, $3, $4 )
                RETURNING *;
              `,
      [userID, channelname, profile_avatar, profile_poster]
    );
    return channel;
  } catch (error) {
    throw error;
  }
}

async function createVendor({ userid, vendorname }) {
  try {
    const {
      rows: [vendor],
    } = await client.query(
      `
                INSERT INTO vendors(userid, vendorname) 
                VALUES($1, $2)
                RETURNING *;
              `,
      [userid, vendorname]
    );
    return vendor;
  } catch (error) {
    throw error;
  }
}

async function updatePassword(id, { password, confirmpassword }) {
  const UpdatedhashedPassword = await bcrypt.hash(password, SALT_COUNT);
  const UpdatedconhashedPassword = await bcrypt.hash(
    confirmpassword,
    SALT_COUNT
  );
  try {
    const { rows } = await client.query(
      `
                UPDATE users
                SET password=$2, confirmpassword=$3
                WHERE id=$1;
              `,
      [id, UpdatedhashedPassword, UpdatedconhashedPassword]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function addLocation(id, { location }) {
  try {
    const { rows } = await client.query(
      `
                UPDATE users
                SET location=$2
                WHERE id=$1;
              `,
      [id, location]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function addBio(id, { bio }) {
  try {
    const { rows } = await client.query(
      `
                UPDATE users
                SET bio=$2
                WHERE id=$1;
              `,
      [id, bio]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const { rows } = await client.query(
      `
           SELECT *
           FROM users
           WHERE username=$1
         `,
      [username]
    );
    if (!rows || !rows.length) {
      console.log("User not found");
      return null;
    }
    const [user] = rows;
    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const { rows } = await client.query(
      `
           SELECT *
           FROM users
           WHERE email=$1
         `,
      [email]
    );

    if (!rows || !rows.length) {
      console.log("Email not found");
      return null;
    }
    const [user] = rows;
    return user;
  } catch (error) {
    throw error;
  }
}

async function getUser({ username, password }) {
  if (!username || !password) {
    return null;
  }
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return null;
    }
    const hashedPassword = user.password;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (passwordMatch === true) {
      return user;
    }
  } catch (error) {
    console.error("Could not find user in DB.");
  }
}

async function getUserById(id) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
        SELECT *, users.id AS userid
        FROM users
        WHERE id=$1
      `,
      [id]
    );
    if (!user) {
      delete user.password;
      return null;
    }
    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  const { rows } = await client.query(`
  SELECT users.id AS userid, username, email, user_channel.profile_avatar 
  FROM users
  JOIN user_channel ON users.id = user_channel.userid
  WHERE username ILIKE N'%${username}%';
  `);

  return rows;
}

async function userSearch(query) {
  try {
    const { rows } = await client.query(
      `
              SELECT users.id AS userid, username, email
              FROM users
              WHERE username ILIKE N'%${query}%';
            `
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getLiveChannels(userSubed) {
  try {
    const { rows } = await client.query(
      `
  SELECT *, user_channel.id AS channelid
  FROM user_channel
  RIGHT JOIN user_subscriptions ON user_channel.id = user_subscriptions.channelid
  WHERE user_channel.user_islive='true' AND user_subscriptions.userid=$1
  order by random() limit 9;
  `,
      [userSubed]
    );

    return rows;
  } catch (error) {
    console.log("Could not get live channels");
  }
}

async function getUserChannelByChannelID(channelid) {
  try {
    const { rows } = await client.query(
      `
  SELECT *, user_channel.id AS channelid, users.location, users.bio
  FROM user_channel
  RIGHT JOIN users ON user_channel.channelname = users.username
  WHERE user_channel.id=$1;
  `,
      [channelid]
    );

    return rows;
  } catch (error) {
    console.log("Could not get user channel in db");
  }
}

async function getUserChannelByName(username) {
  try {
    const { rows } = await client.query(
      `
  SELECT *, user_channel.id AS channelid
  FROM users
  RIGHT JOIN user_channel ON users.username = user_channel.channelname
  WHERE username=$1;
  `,
      [username]
    );

    return rows;
  } catch (error) {
    console.log("Could not get user profile from db");
  }
}

async function getUserProfile(username) {
  try {
    const { rows } = await client.query(
      `
  SELECT DISTINCT users.id AS userID, users.username, users.email, user_channel.channelname, user_channel.profile_avatar, user_channel.id AS channelid, user_channel.user_islive,
  vendors.id AS vendorID, vendors.vendorname, vendors.stripe_acctid
  FROM users
  RIGHT JOIN user_channel ON users.username = user_channel.channelname
  RIGHT JOIN vendors ON users.username = vendors.vendorname
  WHERE username=$1;
  `,
      [username]
    );

    return rows;
  } catch (error) {
    console.log("Could not get user profile from db");
  }
}

async function getPostByChannelID(id) {
  try {
    const { rows } = await client.query(
      `
  SELECT *, channel_uploads.id AS videoID
  FROM channel_uploads 
  RIGHT JOIN User_Channel ON channel_uploads.channelid = user_channel.id
  WHERE channelid=$1;
  `,
      [id]
    );

    return rows;
  } catch (error) {
    console.log("Could not get user post from db");
  }
}

async function updateAvatar(channelname, photos) {
  const { profile_avatar } = photos;
  try {
    const { rows } = await client.query(
      `
              UPDATE user_channel
              SET profile_avatar=$2
              WHERE channelname=$1
              RETURNING *;
            `,
      [channelname, profile_avatar]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updatePoster(channelname, photos) {
  const { profile_poster } = photos;
  try {
    const { rows } = await client.query(
      `
              UPDATE user_channel
              SET profile_poster=$2
              WHERE channelname=$1
              RETURNING *;
            `,
      [channelname, profile_poster]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateChannelSubscriptionCount(channelname) {
  try {
    const {
      rows: [channel],
    } = await client.query(
      `
              UPDATE user_channel
              SET subscriber_count = subscriber_count + 1
              WHERE channelname=$1
              RETURNING *;
            `,
      [channelname]
    );

    return channel;
  } catch (error) {
    throw error;
  }
}

async function reduceChannelSubscriptionCount(id) {
  try {
    const {
      rows: [channel],
    } = await client.query(
      `
              UPDATE user_channel
              SET subscriber_count = subscriber_count - 1
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

async function updateUserSubscriptionStatus(id) {
  try {
    const { rows } = await client.query(
      `
              UPDATE users
              SET subscribed_user_acct='true'
              WHERE id=$1
              RETURNING *;
            `,
      [id]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateVendorSubscriptionStatus(id) {
  try {
    const { rows } = await client.query(
      `
              UPDATE users
              SET subscribed_vendor_acct='true'
              WHERE id=$1
              RETURNING *;
            `,
      [id]
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function confirmVendorSubscription(id) {
  try {
    const { rows } = await client.query(
      `
 SELECT registration_complete
 FROM vendors
 WHERE id=$1;
 `,
      [id]
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

module.exports = {
  client,
  createUser,
  createChannel,
  createVendor,

  updatePassword,

  addLocation,
  addBio,

  getUserByUsername,
  getUserByEmail,
  getUser,
  getUserById,

  userSearch,
  getLiveChannels,
  getUserChannelByChannelID,
  getUserChannelByName,
  getUserProfile,
  getPostByChannelID,

  updateAvatar,
  updatePoster,
  updateChannelSubscriptionCount,
  reduceChannelSubscriptionCount,

  updateUserSubscriptionStatus,
  updateVendorSubscriptionStatus,
  confirmVendorSubscription,

  getAllUsers,
};
