const client = require("./client");
const { createUser, createChannel, updateChannel } = require("./users");
const { createUploads } = require("./explorer");

async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
         DROP TABLE IF EXISTS chat_messages;
         DROP TABLE IF EXISTS chat_conversations;

         DROP TABLE IF EXISTS customer_market_orders;
         DROP TABLE IF EXISTS customer_movie_orders;
         DROP TABLE IF EXISTS customer_orders;
         DROP TABLE IF EXISTS vendor_products;
         DROP TABLE IF EXISTS vendors;

         
         DROP TABLE IF EXISTS user_favorites;
         DROP TABLE IF EXISTS user_watchlist;
         DROP TABLE IF EXISTS user_subscriptions;
         DROP TABLE IF EXISTS user_watch_history;
         DROP TABLE IF EXISTS user_video_likes;
         DROP TABLE IF EXISTS user_video_dislikes;
         
         DROP TABLE IF EXISTS upload_comments;
         DROP TABLE IF EXISTS upload_copyright_reports;
         
         DROP TABLE IF EXISTS channel_uploads;
         DROP TABLE IF EXISTS channel_messages;
         DROP TABLE IF EXISTS user_channel;
         DROP TABLE IF EXISTS users;
         
        `);

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
    throw error;
  }
}

async function createTables() {
  try {
    console.log("Starting to build tables...");

    await client.query(`
  CREATE TABLE users (
    id SERIAL PRIMARY KEY UNIQUE,
    Username varchar(255) UNIQUE NOT NULL,
    Email TEXT NOT NULL,
    Password varchar(255) NOT NULL,
    ConfirmPassword varchar(255) NOT NULL,
    location varchar(255) NULL,
    bio varchar(8000) NULL,
    CreationDT DATE DEFAULT CURRENT_DATE NOT NULL,
    subscribed_vendor_acct BOOLEAN DEFAULT FALSE,
    subscribed_user_acct BOOLEAN DEFAULT FALSE,
    UNIQUE(Username, Email)
  );
          
    
CREATE TABLE user_channel(
  id SERIAL PRIMARY KEY UNIQUE,
  userID INT UNIQUE,
  FOREIGN KEY(userID) REFERENCES Users(id) ON DELETE CASCADE,
  channelname varchar(255) UNIQUE,
  FOREIGN KEY(channelname) REFERENCES Users(Username) ON UPDATE CASCADE,
  Profile_Avatar TEXT NULL UNIQUE,
  Profile_Poster TEXT NULL UNIQUE,
  Subscriber_Count INT DEFAULT 0,
  constraint Subscriber_Count_nonnegative check (Subscriber_Count >= 0),
  user_islive BOOLEAN DEFAULT FALSE,
  channel_earnings decimal(6,2) NULL,
  UNIQUE(channelName, userID)
);


CREATE TABLE channel_messages(
  id SERIAL PRIMARY KEY UNIQUE,
  sender_channelid INT,
  FOREIGN KEY(sender_channelid) REFERENCES user_channel(id) ON DELETE CASCADE,
  senderid INT,
  FOREIGN KEY(senderid) REFERENCES users(id),
  sendername varchar(255),
  FOREIGN KEY(sendername) REFERENCES users(username) ON UPDATE CASCADE,
  senderpic TEXT NULL,
  FOREIGN KEY(senderpic) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
  receiverid INT,
  FOREIGN KEY(receiverid) REFERENCES users(id) ON DELETE CASCADE,
  receivername varchar(255),
  FOREIGN KEY(receivername) REFERENCES users(username) ON UPDATE CASCADE,
  receiverpic TEXT,
  FOREIGN KEY(receiverpic) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
  note_message varchar(8000),
  noteread BOOLEAN DEFAULT FALSE,
  note_dt DATE DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE channel_uploads (
  ID SERIAL PRIMARY KEY UNIQUE,
  channelID INT NOT NULL,
  FOREIGN KEY(channelID) REFERENCES User_Channel(id) ON DELETE CASCADE,
  channelname varchar(255),
  FOREIGN KEY(channelname) REFERENCES users(username) ON UPDATE CASCADE,
  channelavi TEXT,
  FOREIGN KEY(channelavi) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
  videoFile TEXT NULL,
  videokey TEXT NULL,
  videoThumbnail TEXT NULL,
  thumbnailKey TEXT NULL,
  videoTitle varchar(255) NULL UNIQUE,
  videoDescription varchar(8000) NULL,
  videoTags varchar(800) NULL,
  videopostDT DATE DEFAULT CURRENT_DATE NOT NULL,
  videoLikeCount INT DEFAULT 0,
  constraint likes_nonnegative check (videoLikeCount >= 0),
  videodisLikeCount INT DEFAULT 0,
  constraint dislikes_nonnegative check (videodisLikeCount >= 0),
  videoCommentCount INT DEFAULT 0,
  constraint comments_nonnegative check (videoCommentCount >= 0),
  videoViewCount INT DEFAULT 0 UNIQUE,
  constraint views_nonnegative check (videoViewCount >= 0),
  content_type varchar(255),
  paid_content varchar(255),
  rental_price varchar(255),
  hold_for_review BOOLEAN DEFAULT FALSE,
  vendor_email varchar(255),
  stripe_acctid TEXT NULL,
  flagged_content BOOLEAN DEFAULT FALSE,
  flag_reason varchar(255) NULL,
  videoActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE upload_comments (
  ID SERIAL PRIMARY KEY UNIQUE,
  videoID INT,
  FOREIGN KEY(videoID) REFERENCES channel_uploads(id) ON DELETE CASCADE,
  commentorID INT,
  FOREIGN KEY(commentorID) REFERENCES users(id) ON DELETE CASCADE,
  commentorName varchar(255),
  FOREIGN KEY(commentorname) REFERENCES users(username) ON UPDATE CASCADE,
  commentorPic TEXT,
  FOREIGN KEY(commentorPic) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
  user_comment varchar(8000) NULL,
  commentDT DATE DEFAULT CURRENT_DATE NOT NULL,
  flagged_comment BOOLEAN DEFAULT FALSE,
  flag_reason varchar(255) NULL

);

CREATE TABLE upload_copyright_reports (
id SERIAL PRIMARY KEY UNIQUE,
videoid INT NOT NULL,
FOREIGN KEY(videoid) REFERENCES channel_uploads(id) ON DELETE CASCADE,
userid INT NOT NULL,
FOREIGN KEY(userid) REFERENCES users(id) ON DELETE CASCADE,
requestor_name varchar(255) NULL,
owner varchar(255) NULL,
relationship varchar(255) NULL,
address varchar(255) NULL,
city_state_zip varchar(255) NULL,
country varchar(255) NULL,
flagDT DATE DEFAULT CURRENT_DATE NOT NULL
);


CREATE TABLE vendors (
  id SERIAL PRIMARY KEY UNIQUE,
  userid INT UNIQUE NOT NULL,
  FOREIGN KEY(userid) REFERENCES users(id) ON DELETE CASCADE,
  vendorname varchar(255) UNIQUE NOT NULL,
  FOREIGN KEY(vendorname) REFERENCES users(username) ON DELETE CASCADE,
  registration_complete BOOLEAN DEFAULT FALSE,
  vendor_connect_complete BOOLEAN DEFAULT FALSE,
  vendor_subscription_complete BOOLEAN DEFAULT FALSE,
  stripe_acctid TEXT,
  UNIQUE(userid, vendorname)
);

CREATE TABLE vendor_products(
id SERIAL PRIMARY KEY UNIQUE,
vendorID INT,
FOREIGN KEY(vendorid) REFERENCES vendors(id) ON DELETE CASCADE,

vendorname varchar(255),
FOREIGN KEY(vendorname) REFERENCES users(username) ON DELETE CASCADE,

prod_category varchar(255) NULL,
prod_sub_category varchar(255) NULL,
prod_name varchar(255) NOT NULL,
prod_description varchar(255) NULL,
prod_price decimal(6,2) NOT NULL,
prod_quantity INT NOT NULL,
constraint quantity_nonnegative check (prod_quantity >= 0),

prod_color1 varchar(255) NULL,
prod_color2 varchar(255) NULL,
prod_color3 varchar(255) NULL,
prod_color4 varchar(255) NULL,
prod_color5 varchar(255) NULL,
prod_color6 varchar(255) NULL,

prod_size1 varchar(255) NULL,
prod_size2 varchar(255) NULL,
prod_size3 varchar(255) NULL,
prod_size4 varchar(255) NULL,
prod_size5 varchar(255) NULL,
prod_size6 varchar(255) NULL,

prod_img1 text NOT NULL,
prod_img2 text NULL,
prod_img3 text NULL,
prod_img4 text NULL,
prod_img5 text NULL,
prod_img6 text NULL,

vendor_email varchar(255) NULL,
vendoractive BOOLEAN DEFAULT TRUE,
stripe_acctid TEXT NULL
);

CREATE TABLE customer_orders (
  ID SERIAL PRIMARY KEY UNIQUE,
  customerID INT,
  FOREIGN KEY(customerID) REFERENCES users(id) ON DELETE CASCADE,
  order_date DATE DEFAULT CURRENT_DATE NOT NULL,
  order_total decimal(6,2) NOT NULL,
  order_status varchar(255) NULL,
  vendor_status varchar(255) NULL
);
ALTER SEQUENCE customer_orders_id_seq RESTART WITH 7001;

CREATE TABLE customer_movie_orders(
id SERIAL PRIMARY KEY UNIQUE,
videoid INT,
FOREIGN KEY(videoid) REFERENCES channel_uploads(id) ON DELETE CASCADE,
videotitle varchar(255),
videoprice decimal(6,2),
channelid INT,
FOREIGN KEY(channelid) REFERENCES user_channel(id) ON DELETE CASCADE,
videothumbnail TEXT,
userid INT,
FOREIGN KEY(userid) REFERENCES users(id) ON DELETE CASCADE,
rental_date DATE DEFAULT CURRENT_DATE NOT NULL,
vendor_email varchar(255) NULL
);

CREATE TABLE customer_market_orders(
id SERIAL PRIMARY KEY UNIQUE,
orderID INT,
FOREIGN KEY(orderID) REFERENCES customer_orders(id),
productID INT,
FOREIGN KEY(productID) REFERENCES vendor_products(id),
vendorid INT,
FOREIGN KEY(vendorid) REFERENCES vendors(id),
vendorname varchar(255),
FOREIGN KEY(vendorname) REFERENCES users(username) ON UPDATE CASCADE,
purchase_total decimal(6,2) NULL,
product_name varchar(255),
product_qty INT NULL,
product_color varchar(255) NULL,
product_size varchar(255) NULL,
prod_img TEXT NULL,
product_price decimal(6,2) NULL,
product_orderdt DATE DEFAULT CURRENT_DATE NOT NULL,
vendor_email varchar(255)
);

CREATE TABLE chat_conversations(
id SERIAL PRIMARY KEY UNIQUE,
user1 INT,
FOREIGN KEY(user1) REFERENCES users(id) ON DELETE CASCADE,
user1_username varchar(255),
FOREIGN KEY(user1_username) REFERENCES users(username) ON UPDATE CASCADE,
user1_pic TEXT,
FOREIGN KEY(user1_pic) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
user1_email varchar(255),
user2 INT,
FOREIGN KEY(user2) REFERENCES users(id) ON DELETE CASCADE,
user2_username varchar(255),
FOREIGN KEY(user2_username) REFERENCES users(username) ON UPDATE CASCADE,
user2_pic TEXT,
FOREIGN KEY(user2_pic) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
user2_email varchar(255),
start_date DATE DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE chat_messages(
id SERIAL PRIMARY KEY UNIQUE,
conversationid INT,
FOREIGN KEY(conversationid) REFERENCES chat_conversations(id) ON DELETE CASCADE,
senderid INT,
FOREIGN KEY(senderid) REFERENCES users(id) ON DELETE CASCADE,
sendername varchar(255),
FOREIGN KEY(sendername) REFERENCES users(username) ON UPDATE CASCADE,
receiverid INT,
FOREIGN KEY(receiverid) REFERENCES users(id) ON DELETE CASCADE,
receivername varchar(255),
FOREIGN KEY(receivername) REFERENCES users(username) ON UPDATE CASCADE,
chat_message varchar(8000) NOT NULL,
message_date varchar(255),
systemDT DATE DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE user_favorites (
id SERIAL PRIMARY KEY UNIQUE,
userid INT NOT NULL,
FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE,
videoid INT NULL,
FOREIGN KEY (videoid) REFERENCES channel_uploads(id) ON DELETE CASCADE,
channelid INT NOT NULL,
FOREIGN KEY (channelid) REFERENCES user_channel(id) ON DELETE CASCADE,
channelname varchar(255)  NULL,
FOREIGN KEY(channelname) REFERENCES users(username) ON UPDATE CASCADE,
channelavi TEXT NULL,
FOREIGN KEY(channelavi) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
videofile TEXT NOT NULL,
videoviewcount INT NOT NULL,
FOREIGN KEY(videoviewcount) REFERENCES channel_uploads(videoViewCount) ON UPDATE CASCADE,
videothumbnail TEXT NULL,
videotitle varchar(800) NULL,
FOREIGN KEY(videotitle) REFERENCES channel_uploads(videotitle) ON UPDATE CASCADE,
favedDT DATE DEFAULT CURRENT_DATE NOT NULL

);

CREATE TABLE user_watchlist (
id SERIAL PRIMARY KEY UNIQUE,
userid INT NOT NULL,
FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE,
videoid INT NULL,
FOREIGN KEY (videoid) REFERENCES channel_uploads(id) ON DELETE CASCADE,
channelid INT NOT NULL,
FOREIGN KEY (channelid) REFERENCES user_channel(id) ON DELETE CASCADE,
channelname varchar(255)  NULL,
FOREIGN KEY(channelname) REFERENCES users(username) ON UPDATE CASCADE,
channelavi TEXT  NULL,
FOREIGN KEY(channelavi) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,

videofile TEXT NULL,
videoviewcount INT NOT NULL,
FOREIGN KEY(videoviewcount) REFERENCES channel_uploads(videoViewCount) ON UPDATE CASCADE,
videothumbnail TEXT NULL,
videotitle varchar(800) NULL,
FOREIGN KEY(videotitle) REFERENCES channel_uploads(videotitle) ON UPDATE CASCADE,
paidtoview BOOLEAN DEFAULT FALSE,
user_started_watching BOOLEAN DEFAULT FALSE,
first_viewingDT DATE DEFAULT CURRENT_DATE NULL,

watchlaterDT DATE DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE user_subscriptions (
id SERIAL PRIMARY KEY UNIQUE,
userid INT NOT NULL,
FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE,
channelid INT NULL,
FOREIGN KEY (channelid) REFERENCES user_channel(id) ON DELETE CASCADE,
channelavi TEXT NULL,
FOREIGN KEY(channelavi) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
channelname varchar(255) NULL,
FOREIGN KEY(channelname) REFERENCES users(username) ON UPDATE CASCADE,
subedDT DATE DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE user_watch_history(
id SERIAL PRIMARY KEY UNIQUE,
userid INT NOT NULL,
FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE,
videoid INT NULL,
FOREIGN KEY (videoid) REFERENCES channel_uploads(id) ON DELETE CASCADE,
channelid INT,
FOREIGN KEY (channelid) REFERENCES user_channel(id) ON DELETE CASCADE,
channelavi TEXT,
FOREIGN KEY(channelavi) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
channelname varchar(255),
FOREIGN KEY(channelname) REFERENCES users(username) ON UPDATE CASCADE,
videofile TEXT NULL,
videoviewcount INT NOT NULL,
FOREIGN KEY(videoviewcount) REFERENCES channel_uploads(videoViewCount) ON UPDATE CASCADE,
videothumbnail TEXT NULL,
videotitle varchar(800) NULL,
FOREIGN KEY(videotitle) REFERENCES channel_uploads(videotitle) ON UPDATE CASCADE,
historydt DATE DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE user_video_likes(
id SERIAL PRIMARY KEY UNIQUE,
userid INT NOT NULL,
FOREIGN KEY (userid) REFERENCES users(id),
videoid INT NULL,
FOREIGN KEY (videoid) REFERENCES channel_uploads(id)
);

CREATE TABLE user_video_dislikes(
id SERIAL PRIMARY KEY UNIQUE,
userid INT NOT NULL,
FOREIGN KEY (userid) REFERENCES users(id),
videoid INT NULL,
FOREIGN KEY (videoid) REFERENCES channel_uploads(id)
);

          
          
          
  `);

    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error;
  }
}

async function createInitialUsers() {
  try {
    console.log("Starting to create users...");
    await createUser({
      username: "Rashon",
      email: "rashonwill92@gmail.com",
      location: "Southern Louisiana",
      password: "Shonmusic92$!",
      confirmpassword: "Shonmusic92$",
    });

    await createUser({
      username: "CupofJoe",
      email: "cupofjoe@test.com",
      location: "New York, NY",
      password: "P@ssw0rd!!",
      confirmpassword: "P@ssw0rd!!",
    });

    console.log("Finished creating users!");
  } catch (error) {
    console.error("Error creating users!");
    throw error;
  }
}

async function updateChannelPics() {
  try {
    console.log("Starting to update users' channels...");

    await updateChannel({
      channelname: "Rashon",
      profile_avatar:
        "https://faribucket.s3.amazonaws.com/1629464622097_Rashon.png",
      profile_poster:
        "https://faribucket.s3.amazonaws.com/1629464622386_Greatness.jpg",
    });

    await updateChannel({
      channelname: "CupofJoe",
      profile_avatar:
        "https://faribucket.s3.amazonaws.com/1629487258233_Believe%20In%20Yourself.jpg",
      profile_poster:
        "https://faribucket.s3.amazonaws.com/1629487258270_Grit.jpg",
    });

    console.log("Finished updating users' channel!");
  } catch (error) {
    console.error("Error updating users' channel!");
    throw error;
  }
}

async function createContent() {
  try {
    console.log("Starting to create uploads...");
    await createUploads({
      channelID: "2",
      channelname: "CupofJoe",
      channelavi:
        "https://faribucket.s3.amazonaws.com/1629487258233_Believe%20In%20Yourself.jpg",
      videoFile:
        "https://faribucket.s3.amazonaws.com/1629426670553_Inside+My+6%2C000+Sqft+House+_+Full+House+Tour.mp4",
      videoThumbnail:
        "https://faribucket.s3.amazonaws.com/1629426814648_ricky%20gutierrez.jpeg",
      videoTitle: "Tour of my 6,000 Sqft Arizona Home",
      videoDescription: "Ricky Guiterrez shows us a tour of his mansion.",
      videoTags: "#DayTrading #LifeStyleVlog #RickyGuiterrez",
    });

    await createUploads({
      channelID: "2",
      channelname: "CupofJoe",
      channelavi:
        "https://faribucket.s3.amazonaws.com/1629487258233_Believe%20In%20Yourself.jpg",
      videoFile:
        "https://faribucket.s3.amazonaws.com/1629474137199_Forex+Bought+Me+a+%242.2+MILLION+Dollar+MANSION%21.mp4",
      videoThumbnail:
        "https://faribucket.s3.amazonaws.com/1629474228325_mambafx.jpeg",
      videoTitle: "Forex got me a Mansion!!",
      videoDescription: "Tour of my $2.2 Million mansion - MambaFX",
      videoTags: "#HouseTour #DayTrading #MambaFX",
    });

    await createUploads({
      channelID: "2",
      channelname: "CupofJoe",
      channelavi:
        "https://faribucket.s3.amazonaws.com/1629487258233_Believe%20In%20Yourself.jpg",
      videoFile:
        "https://faribucket.s3.amazonaws.com/1629426240310_Day+in+the+Life+of+a+Millionaire+Entrepreneur+%2825+Years+Old%29.mp4",
      videoThumbnail:
        "https://faribucket.s3.amazonaws.com/1629426334946_Chris%20Williams.jpeg",
      videoTitle: "Day in the Life of a 25 Year Old Millionaire",
      videoDescription:
        "Chris Swaggy C Williams shows us a day in the life of a forex, day trading millionaire.",
      videoTags:
        "#Forex #DayTrading #LifeStyleVlog #SwagAcademy #SwaggyC #ChrisWilliams #SwagAcademy",
    });

    await createUploads({
      channelID: "1",
      channelname: "Rashon",
      channelavi:
        "https://faribucket.s3.amazonaws.com/1629464622097_Rashon.png",
      videoFile:
        "https://faribucket.s3.amazonaws.com/1629424713018_Seventeen+Again+-+Full+Movie.mp4",
      videoThumbnail:
        "https://faribucket.s3.amazonaws.com/1629425161859_17Again.jpg",
      videoTitle: "Seventeen Again",
      videoDescription:
        "While divorced and bickering grandparents watch their grandchildren (Tia Mowry, Tamera Mowry), a lab experiment gone awry transforms the elders into teenagers again.",
      videoTags: "#Movie #TiaMowry #TameraMowry",
    });

    await createUploads({
      channelID: "1",
      channelname: "Rashon",
      channelavi:
        "https://faribucket.s3.amazonaws.com/1629464622097_Rashon.png",
      videoFile:
        "https://faribucket.s3.amazonaws.com/1629592484528_Building+a+6+Million+Dollar+Home+%26+Changing+My+Forex+Day+Trading+Strategy...+Secure+The+Swag+%28Ep.+5%29.mp4",
      videoThumbnail:
        "https://faribucket.s3.amazonaws.com/1629592670554_Swaggy-C-Favorite-Purchase.jpeg",
      videoTitle:
        "Building a 6 Million Dollar Home & Changing My Forex Day Trading Strategy.",
      videoDescription:
        "Millionaire Forex Trader Swaggy C - Secure the Swag Episode 5",
      videoTags: "#Forex #DayTrader #Vlog",
    });

    await createUploads({
      channelID: "1",
      channelname: "Rashon",
      channelavi:
        "https://faribucket.s3.amazonaws.com/1629464622097_Rashon.png",
      videoFile:
        "https://faribucket.s3.amazonaws.com/1630968628118_Making+Of+Aston+Martin+Music.mp4",
      videoThumbnail:
        "https://faribucket.s3.amazonaws.com/1630968656762_Justic%20League.jpeg",
      videoTitle: "The Making of Aston Martin Music - Justice League",
      videoDescription:
        "Grammy Award Winning Production team, The J.U.S.T.I.C.E. League, to talk about the latest single off of Teflon Don, 'Aston Martin Music'.",
      videoTags: "#HipHop #Beats #MusicProduction #Drake #RickRoss",
    });

    await createUploads({
      channelID: "2",
      channelname: "CupofJoe",
      channelavi:
        "https://faribucket.s3.amazonaws.com/1629487258233_Believe%20In%20Yourself.jpg",
      videoFile:
        "https://faribucket.s3.amazonaws.com/1631373457280_I+Moved+Into+A+Van+-+Van+Life.mp4",
      videoThumbnail:
        "https://faribucket.s3.amazonaws.com/1631373636554_Jesse%20.jpeg",
      videoTitle: "I Moved Into A Van - Van Life",
      videoDescription:
        "Jesse decided to get out of Los Angeles and out of his comfort zone.",
      videoTags: "#Vlogger #VanLife #SimpleLife",
    });

    console.log("Finished creating Uploads!");
  } catch (error) {
    console.error("Error creating Uploads!");
    throw error;
  }
}

async function buildDB() {
  try {
    client.connect();
    await dropTables();
    await createTables();
    //     await createInitialUsers();
    //     await updateChannelPics();
    //     await createContent();
  } catch (error) {
    throw error;
  }
}

buildDB();
