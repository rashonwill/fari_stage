const client = require("./client");
const { createUser, createChannel, updateChannel } = require("./users");
const { createUpload } = require("./explorer");

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
  Profile_Poster TEXT NULL,
  Subscriber_Count INT DEFAULT 0,
  constraint Subscriber_Count_nonnegative check (Subscriber_Count >= 0),
  user_islive BOOLEAN DEFAULT FALSE,
  channel_earnings decimal(6,2) NULL,
  UNIQUE(channelName, userID, Profile_Avatar)
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
  channelavi TEXT NULL,
  FOREIGN KEY(channelavi) REFERENCES user_channel(profile_avatar) ON UPDATE CASCADE,
  videoFile TEXT NULL,
  videokey TEXT NULL,
  videoThumbnail TEXT NULL,
  thumbnailKey TEXT NULL,
  videoTitle varchar(255) NOT NULL UNIQUE,
  videoDescription varchar(8000) NULL,
  videoTags varchar(800) NULL,
  videopostDT DATE DEFAULT CURRENT_DATE NOT NULL,
  videoLikeCount INT DEFAULT 0,
  constraint likes_nonnegative check (videoLikeCount >= 0),
  videodisLikeCount INT DEFAULT 0,
  constraint dislikes_nonnegative check (videodisLikeCount >= 0),
  videoCommentCount INT DEFAULT 0,
  constraint comments_nonnegative check (videoCommentCount >= 0),
  videoViewCount INT DEFAULT 0,
  constraint views_nonnegative check (videoViewCount >= 0),
  content_category varchar(255),
  content_class varchar(255),
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
FOREIGN KEY(vendorname) REFERENCES users(username) ON UPDATE CASCADE,

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
      username: "Fari",
      email: "admin@letsfari.com",
      location: "Made in the USA",
      password: "Shonmusic92$",
      confirmpassword: "Shonmusic92$",
    });

    await createUser({
      username: "Rashon",
      email: "rashonwill92@gmail.com",
      location: "Southern Louisiana",
      password: "Shonmusic92$!",
      confirmpassword: "Shonmusic92$",
    });
    
     await createUser({
      username: "C.J.",
      email: "chejwilliams@yahoo.com",
      location: "The Boot",
      password: "Shonmusic92$",
      confirmpassword: "Shonmusic92$",
    });
    
      await createUser({
      username: "ShowTime",
      email: "test@test.com",
      password: "Shonmusic92$",
      confirmpassword: "Shonmusic92$",
    });
    
     await createUser({
      username: "HappyGilmore",
      email: "test1@test.com",
      location: "My happy place :)",
      password: "Shonmusic92$",
      confirmpassword: "Shonmusic92$",
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
      profile_avatar: "https://d32wkr8chcuveb.cloudfront.net/1669734512176_1667833451693_theo-document-1 (1).png",
      profile_poster: "https://d32wkr8chcuveb.cloudfront.net/1669734710107_PINK CROWN.jpg",
    });

    await updateChannel({
      channelname: "Fari",
      profile_avatar: "https://d32wkr8chcuveb.cloudfront.net/1669735748650_1667408386418_Logo Black.png",
      profile_poster: "https://d32wkr8chcuveb.cloudfront.net/1669735898220_Logo Black.png",
    });
    
        await updateChannel({
      channelname: "C.J.",
      profile_avatar:"https://d32wkr8chcuveb.cloudfront.net/1669749371946_rapper_back_Smoke.png",
      profile_poster: "https://d32wkr8chcuveb.cloudfront.net/1669749757872_stay humble_tranparent.png",
    })
    
        await updateChannel({
      channelname: "ShowTime",
      profile_avatar: "https://d32wkr8chcuveb.cloudfront.net/1669753852336_michael j.gif",
    })
    
        await updateChannel({
      channelname: "HappyGilmore",
      profile_avatar: "https://d32wkr8chcuveb.cloudfront.net/1669756362517_FINGERS SMILES.jpg",
    })

    console.log("Finished updating users' channel!");
  } catch (error) {
    console.error("Error updating users' channel!");
    throw error;
  }
}

async function createContent() {
  try {
    console.log("Starting to create uploads...");
    await createUpload({
      channelID: "1",
      channelname: "Fari",
      channelavi:"https://d32wkr8chcuveb.cloudfront.net/1669735748650_1667408386418_Logo Black.png",
      videoFile: "https://d32wkr8chcuveb.cloudfront.net/1669736145067_fari animation 2.MP4",
      videoKey: "1669736145067_fari animation 2.MP4",
      videoThumbnail: "https://d32wkr8chcuveb.cloudfront.net/1669736146799_Logo Black.png",
      thumbnailKey: "1669736146799_Logo Black.png",
      videoTitle: "Welcome to Fari!",
      videoDescription: "Welcome.",
      videoTags: "#welcome #fari",
      videoviewcount: 5230,
      content_category: "other",
      vendor_email: "admin@letsfari.com"
    });
    
    
     await createUpload({
      channelID: "2",
      channelname: "Rashon",
      channelavi:"https://d32wkr8chcuveb.cloudfront.net/1669734512176_1667833451693_theo-document-1 (1).png",
      videoFile:"https://d32wkr8chcuveb.cloudfront.net/1669744240661_1668611937503_CGI Animated Short Film_ _Unlucky Charms_ by Kris Theorin _ CGMeetup.mp4",
      videoKey:"1669744240661_1668611937503_CGI Animated Short Film_ _Unlucky Charms_ by Kris Theorin _ CGMeetup.mp4",
      videoThumbnail:"https://d32wkr8chcuveb.cloudfront.net/1669744245619_1668611942352_Unlucky Charms (1).jpg",
      thumbnailKey: "1669744245619_1668611942352_Unlucky Charms (1).jpg",
      videoTitle: "CGI Animated Short Film: &amp;quot;Unlucky Charms&amp;quot; by Kris Theorin | CGMeetup",
      videoDescription: "Late One Night, A Bored Cashier Collects All Three Toys From A Box Of Magic Munchos And Unwittingly Unleashes The Ancient Evil That Lies Within…",
      videoTags: "#animation #shortfilm",
      videoviewcount: 4500,
      content_category: "film",
      content_class: "free",
      vendor_email: "rashonwill92@gmail.com"
    });
    
      await createUpload({
      channelID: "3",
      channelname: "C.J.",
      channelavi:"https://d32wkr8chcuveb.cloudfront.net/1669749371946_rapper_back_Smoke.png",
      videoFile:"https://d32wkr8chcuveb.cloudfront.net/1669751658656_The Boondocks (S03E08) - Pause Full Episode.mp4",
      videoKey: "1669751658656_The Boondocks (S03E08) - Pause Full Episode.mp4",
      videoThumbnail:"https://d32wkr8chcuveb.cloudfront.net/1669751670021_pause.jpg",
      thumbnailKey: "1669751670021_pause.jpg",
      videoTitle: "The Boondocks - &amp;quot;Pause&amp;quot;",
      videoDescription: "Granddad believes he will become a superstar when he is cast as a leading man by Winston Jerome. Huey and Riley need to step in when the group is not exactly what Granddad was expecting.",
      videoTags: "#animation #boondocks #anime #series",
      videoviewcount: 7534,
      content_category: "series",
      content_class: "free",
      vendor_email: "chejwilliams@yahoo.com"  
    });
    
      await createUpload({
      channelID: "3",
      channelname: "C.J.",
      channelavi:"https://d32wkr8chcuveb.cloudfront.net/1669749371946_rapper_back_Smoke.png",
      videoFile:"https://d32wkr8chcuveb.cloudfront.net/1669753357079_Swaggy C - Day In The Life.mp4",
      videoKey: "1669753357079_Swaggy C - Day In The Life.mp4",
      videoThumbnail:"https://d32wkr8chcuveb.cloudfront.net/1669753374471_1629426334946_Chris Williams.jpeg",
      thumbnailKey: "1669753374471_1629426334946_Chris Williams.jpeg",
      videoTitle: "Day in the Life of a 25 Year Old Millionaire",
      videoDescription: "Chris Swaggy C Williams shows us a day in the life of a forex, day trading millionaire.",
      videoTags: "#vlog #swaggyc #forex #daytrader",
      videoviewcount: 2137,
      content_category: "vlog",
      vendor_email: "chejwilliams@yahoo.com"  
    });
    
      await createUpload({
      channelID: "4",
      channelname: "ShowTime",
      channelavi:"https://d32wkr8chcuveb.cloudfront.net/1669753852336_michael j.gif",
      videoFile:"https://d32wkr8chcuveb.cloudfront.net/1669754610163_1669125608126_TRICK or TREAT! A Short Horror Film.mp4",
      videoKey: "1669754610163_1669125608126_TRICK or TREAT! A Short Horror Film.mp4",
      videoThumbnail:"https://d32wkr8chcuveb.cloudfront.net/1669754616990_1669125614856_TrickorTreat.jpg",
      thumbnailKey: "1669754616990_1669125614856_TrickorTreat.jpg",
      videoTitle: "TRICK OR TREAT!",
      videoDescription: "During their first Halloween in their new home, Travis and Beth encounter an unexpected trick or treater.",
      videoTags: "#shortfilm #horrorfilm #movie",
      videoviewcount: 1567, 
      content_category: "film",
      content_class: "free",
      vendor_email: "test@test.com"  
    });
    
    
     await createUpload({
      channelID: "5",
      channelname: "HappyGilmore",
      channelavi:"https://d32wkr8chcuveb.cloudfront.net/1669756362517_FINGERS SMILES.jpg",
      videoFile:"https://d32wkr8chcuveb.cloudfront.net/1669755428534_1666706988999_Runyon Canyon Hike & Lakers game _ VLOG 02.mp4",
      videoKey: "1669755428534_1666706988999_Runyon Canyon Hike & Lakers game _ VLOG 02.mp4",
      videoThumbnail:"https://d32wkr8chcuveb.cloudfront.net/1669755452072_1666707012180_johnnyedlind.jpg",
      thumbnailKey: "1669755452072_1666707012180_johnnyedlind.jpg",
      videoTitle: "Runyon Canyon Hike &amp;amp; Lakers Game",
      videoDescription: "Johnny Edlind | Vlog 2",
      videoTags: "#VLOG #JOHNNYEDLIND #LAKERS",
      videoviewcount: 3061, 
      content_category: "vlog",
      vendor_email: "test1@test.com" 
    });
    
      await createUpload({
      channelID: "5",
      channelname: "HappyGilmore",
      channelavi:"https://d32wkr8chcuveb.cloudfront.net/1669756362517_FINGERS SMILES.jpg",
      videoFile:"https://d32wkr8chcuveb.cloudfront.net/1669757415968_The Distinguished Gentleman Full Film - Eddie Murphy (1992 ).mp4",
      videoKey: "1669757415968_The Distinguished Gentleman Full Film - Eddie Murphy (1992 ).mp4",
      videoThumbnail:"https://d32wkr8chcuveb.cloudfront.net/1669757463990_the distinguish.jpg",
      thumbnailKey: "1669757463990_the distinguish.jpg",
      videoTitle: "The Distinguished Gentleman",
      videoDescription: "In the conniving world of politics, even a professional shyster like Thomas Jefferson Johnson (Eddie Murphy) can find himself outmatched. After using name recognition to get elected, Johnson enjoys many of the same financial perks as other politicians. However, while investigating the connection between electric companies and cancer in young children, he unexpectedly develops a conscience. Unfortunately, fellow Congressman Dick Dodge (Lane Smith) isn&amp;#x27;t about to let him rock the boat.",
      videoTags: "#EddieMurphy #TheDistinguishGentlemen #Film #Movie #comedy",
      videoviewcount: 2013,
      content_category: "film",
      content_class: "paid",
      rental_price: 1.99,
      vendor_email: "test1@test.com"  
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
        await createInitialUsers();
        await updateChannelPics();
        await createContent();
  } catch (error) {
    throw error;
  }
}

buildDB();
