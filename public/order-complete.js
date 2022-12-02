const FARI_API = "https://fari-stage.herokuapp.com/api";
const myToken = localStorage.getItem("fariToken");


async function getVideoData(){

let videoid = localStorage.getItem('videoID')
 try {
   const response = await fetch(`${FARI_API}/explorer/getVideo/${videoid}`,{
       method: 'GET',  
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${myToken}`
       },
     }) 
   const data = await response.json();
   return data.uploads;
 }catch(error){
 response.status(400).send(error);
 }
}



async function createRentalOrder(){
  var getFeature = await getVideoData();
 
  var vidID = getFeature[0].videoid;
  var posFile = getFeature[0].videothumbnail;
  var channelID = getFeature[0].channelid; 
  var userPurchased = localStorage.getItem('userID');
  var purchasePrice = getFeature[0].rental_price;
  var purchaseTitle = getFeature[0].videotitle;
  var vendor_email = getFeature[0].vendor_email;
  
  localStorage.setItem('vendorEmail', vendor_email)
  
  const rentalBody = {
  videoid: vidID,
  channelid: channelID,
  videothumbnail: posFile, 
  userid: userPurchased, 
  videotitle: purchaseTitle, 
  videoprice: purchasePrice, 
  vendor_email: vendor_email,  
  };
  
  try {
  const response = await fetch(`${FARI_API}/orders/create/movieorder`,{
      method: 'POST',  
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${myToken}`
      }, body: JSON.stringify(rentalBody)
                               
})
    const data = await response.json();
    return data;
}catch(error){
response.status(400).send(error);
}};

async function laterVideoPurchased(){
  var getFeature = await getVideoData();
  
  var userid = localStorage.getItem('userID');
  var vidID = getFeature[0].videoid;
  var channelname = getFeature[0].channel_name;
  var video = getFeature[0].videofile;
  var posFile = getFeature[0].videothumbnail;
  var vidTitle = getFeature[0].videotitle;
  var channelID = getFeature[0].channelid; 
  var views = getFeature[0].videoviewcount;
  
  const laterBody = {
  userid: userid,
  videoid: vidID,
  channelname: channelname,
  videofile: video,
  videothumbnail: posFile,
  videotitle: vidTitle, 
  channelid: channelID,
  videoviewcount: views, 
  paidtoview: true,  
  };
  try {
  const response = await fetch(`${FARI_API}/explorer/add/watchlist`,{
      method: 'POST',  
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${myToken}`
      }, body: JSON.stringify(laterBody)
                               
})
    const data = await response.json();
    return data;
}catch(error){
response.status(400).send(error);
}
};

async function moviePurchaseEmail(){
  let email = localStorage.getItem('vendorEmail');
  try {
    const response = await fetch(`${FARI_API}/mailer/newsale/movierental/${email}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  }catch (error) {
    response.status(400).send(error);
  }
}




function cleanup(){
            createRentalOrder()
            laterVideoPurchased(); 
            moviePurchaseEmail();
            localStorage.removeItem('videoPurchase')
             
}

cleanup();
