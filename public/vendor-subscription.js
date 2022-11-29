const FARI_API = "https://fari-testapi.herokuapp.com/api";
const myToken = localStorage.getItem("fariToken");

(function () {
  if (!myToken || myToken === null) {
    window.location.href = "/login";
  }
})();

$(".connect .btn").click(function () {
  // vendorVerification();
  onBoarding();
});

$(".subscriptions .btn").click(function () {
  // vendorVerification();
  goSubscriptions();
});

async function onBoarding() {
  fetch(`${FARI_API}/store/onboard-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${myToken}`,
    },
  })
    .then((res) => {
      if (res.ok) return res.json();
      return res.json().then((json) => Promise.reject(json));
    })
    .then(({ url, accountid }) => {
      localStorage.setItem("stripeAcctID", accountid);
      window.location = url;
    })
    .catch((error) => {
      console.log(error);
    });
}

async function goSubscriptions() {
  let vendorid = localStorage.getItem("vendorID");
  fetch(`${FARI_API}/store/vendor-subscription`, {
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

async function vendorVerification() {
  let id = localStorage.getItem("vendorID");
  try {
    const response = await fetch(
      `${FARI_API}/store/vendor-registration/${id}`,
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
