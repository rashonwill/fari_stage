const express = require("express");
const subscriptionsRouter = express.Router();
const { requireUser } = require("./utils");
const { body, check, validationResult } = require("express-validator");
const rateLimiter = require("./ratelimiter");
const { STRIPE_SECRET } = process.env;
const { STRIPE_BUSINESS_SECRET } = process.env;
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const stripe2 = require('stripe')(process.env.STRIPE_BUSINESS_SECRET);

const {
  registerVendor,
  setStripeID,
  updateVendorSubscriptionStatus,
  updateUserSubscriptionStatus,
  
} = require("../db");


//Set Vendor Registered to True

subscriptionsRouter.patch("/vendor-registration/:id", requireUser, check('id').not().isEmpty().isNumeric().withMessage('Not a valid value').trim().escape(), async (req, res, next) => {
const { id } = req.params;
 let errors = validationResult(req);  
 if (!errors.isEmpty()) {
    return res.status(400).send({name: 'Validation Error', message: errors.array()[0].msg});
}else{  
try {
const verified = await registerVendor(id);
 res.send({vendor: verified});
}catch(error){
console.log('Oops could register vendor', error)
next({ name: "ErrorRegisteringVendor", message: "Could not complete vendor registration" });
}
}
});


//Set Vendor Flag on Users table

subscriptionsRouter.patch("/vendor-subscription-update/:id", requireUser, check('id').not().isEmpty().isNumeric().withMessage('Not a valid value').trim().escape(), async (req, res, next) => {
const { id } = req.params;
   let errors = validationResult(req);
     if (!errors.isEmpty()) {
   return res.status(400).send({name: 'Validation Error', message: errors.array()[0].msg});
}else{ 
try{
 const updatingVendor = await updateVendorSubscriptionStatus(id);
 res.send({updatedSubscription: updatingVendor})
}catch(error){
console.log('Oops, could not update vendor subscription status', error);
}
}
});

//Set user subcription flag on Users table

subscriptionsRouter.patch("/user-subscription-update/:id", requireUser, check('id').not().isEmpty().isNumeric().withMessage('Not a valid value').trim().escape(), async (req, res, next) => {
const { id } = req.params;
  let errors = validationResult(req);
     if (!errors.isEmpty()) {
   return res.status(400).send({name: 'Validation Error', message: errors.array()[0].msg});
}else{	
try{
 const updatingUser = await updateUserSubscriptionStatus(id);
 res.send({updatedSubscription: updatingUser})
}catch(error){
console.log('Oops, could not update user subscription status', error);
}
}
});

//Set Vendor Stripe Account ID On Vendor Table

subscriptionsRouter.patch("/setstripe-acct/:id", requireUser, check('id').not().isEmpty().isNumeric().withMessage('Not a valid value').trim().escape(), async (req, res, next) => {
const { id } = req.params;
 
const stripe_acctid = req.body.stripe_acctid; 
const stripeAcct = {
stripe_acctid: stripe_acctid,
}
 let errors = validationResult(req);  
 if (!errors.isEmpty()) {
    return res.status(400).send({name: 'Validation Error', message: errors.array()[0].msg});
}else{ 
try {
const verifiedAcct = await setStripeID(id, stripeAcct);
 res.send({vendor: verifiedAcct});
}catch(error){
console.log('Oops could register vendor', error)
next({ name: "ErrorRegisteringVendor", message: "Could not set vendor stripe account" });
} 
}
});

//Stripe Connect


subscriptionsRouter.post("/onboard-user", requireUser, async (req, res) => {
 try{
 const account = await stripe.accounts.create({
 type: 'standard',
});
  const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://fari-stage.netlify.app/profile',
  return_url: 'https://fari-stage.netlify.app/profile',
  type: 'account_onboarding',
});
  
  console.log(accountLink, account.id)
 res.json({url: accountLink.url, accountid: account.id })
 }catch(error){
  console.log(error)
 }
 
});


//Monthly Subscriptions


subscriptionsRouter.post("/vendor-subscription", requireUser, async function(req, res) {
const priceID = 'price_1L1BVrF7h5B228czlK6zy2db'
const taxRateId = 'txr_1MOLpoF7h5B228czSERQvGxx'
const customer_email = req.body.customer_email;
const fariVendorID = req.body.vendor;
const stripe_acct = req.body.stripe_acctid;  
const userid = req.body.userid;
  
 try{
  const session = await stripe2.checkout.sessions.create({
  mode: 'subscription',
  subscription_data: {
    default_tax_rates: [
      taxRateId
    ],
  },
  payment_intent_data: {
    metadata: {
     FariVendorID: fariVendorID,
    }
  },
  line_items: [
    {
      price: priceID,
      quantity: 1,
    },
  ],
  success_url: 'https://fari-stage.netlify.app/registration-complete?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://fari-stage.netlify.app/profile',
    metadata:{
    customer_email: customer_email,
    vendor: fariVendorID,
    stripe_acctid:  stripe_acct,
    userid: userid,
    }
   
});  
   
   console.log(session)
res.json({url: session.url })             
 }catch(error){
 console.log(error)
}              
                 
})


subscriptionsRouter.post("/fariplus-subscription", requireUser, async function(req, res){
const priceID = 'price_1L19HEF7h5B228czDoDCwbJp'
const taxRateId = 'txr_1L19ISF7h5B228czIjPOqQmS'
const fariUserID = req.body.userid
 try{
  const session = await stripe2.checkout.sessions.create({
  mode: 'subscription',
  subscription_data: {
    default_tax_rates: [
      taxRateId
    ],
  },
  payment_intent_data: {
    metadata: {
     FariUserID: fariUserID,
    }
  },
  line_items: [
    {
      price: priceID,
      quantity: 1,
    },
  ],
  success_url: 'https://fari-stage.netlify.app/subscription-complete?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://fari-stage.netlify.app/profile',
  
}); 
res.json({url: session.url })             
 }catch(error){
 console.log(error)
}              
                 
})

module.exports = subscriptionsRouter;
