const FARI_API = "https://fari-stage.herokuapp.com/api";
const myToken = localStorage.getItem("fariToken");

(function () {
  if (!myToken || myToken === null) {
    window.location.href = "/login";
  } else {
    checkToken();
  }
})();


async function checkToken() {
  try {
    const response = await fetch(`${FARI_API}/account/token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${myToken}`,
      },
    });
    const data = await response.json();
	if(data.name === "TokenExpiredError"){
	localStorage.clear();
  window.location.href = "login";
	}
    return data.user;
  } catch (error) {
    console.log(error);
    response.status(400).send(error);
  }
}

async function getLoggedInUser() {
  try {
    const response = await fetch(`${FARI_API}/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${myToken}`,
      },
    });
    const data = await response.json();
    if (data.user.length === 0) {
      window.location.href = "/login";
    }
    return data.user;
  } catch (error) {
    response.status(400).send(error);
  }
}

async function vendorSubscriptionFlag() {
  let id = localStorage.getItem("userID");
  try {
    const response = await fetch(
      `${FARI_API}/subscriptions/vendor-subscription-update/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${myToken}`,
        },
      }
    );
    const data = await response.json();
    return data.user;
  } catch (error) {
    response.status(400).send(error);
  }
}

async function vendorVerification() {
  let id = localStorage.getItem("vendorID");
  try {
    const response = await fetch(
      `${FARI_API}/subscriptions/vendor-registration/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${myToken}`,
        },
      }
    );
    const data = await response.json();
    return data.vendor;
  } catch (error) {
    response.status(400).send(error);
  }
}

async function setStripeAcct() {
  let id = localStorage.getItem("vendorID");
  let stripe = localStorage.getItem("stripeAcctID");
  let stripeAcct = {
    stripe_acctid: stripe,
  };
  try {
    const response = await fetch(
      `${FARI_API}/subscriptions/setstripe-acct/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${myToken}`,
        },
        body: JSON.stringify(stripeAcct),
      }
    );
    const data = await response.json();
    return data.vendor;
  } catch (error) {
    response.status(400).send(error);
  }
}

async function vendorSubscribe() {
  let stripeacct = localStorage.getItem("stripeAcctID");
  let vendorid = localStorage.getItem("vendorID");
  fetch(`${FARI_API}/store/vendor-subscription/${stripeacct}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${myToken}`,
    },
    body: JSON.stringify({ vendor: vendorid }),
  })
    .then((res) => {
      if (res.ok) return res.json();
      return res.json().then((json) => Promise.reject(json));
    })
    .then(({ url }) => {
      window.location = url;
    })
    .catch((error) => {
      console.log(error);
    });
}

function finalize() {
  getLoggedInUser();
  setStripeAcct();
  vendorSubscriptionFlag().then(vendorVerification);
}

// finalize();
