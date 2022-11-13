// helper function to fetch token from an API backend
async function fetchToken() {
  const axiosConfig = {
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
    },
  };

  const tokenRes = await axios
    .get(config.inrixTokenAPI, axiosConfig)
    .then((response) => {
      // if (response.status === 200) {
      this.accessToken = response.data;
      return response.data;
      // }
    })
    .catch((error) => {
      console.error("An error occured: ", error);
      // return error.message;
      throw "error";
    });
  return tokenRes;
}

async function getToken() {
  // Access token management would be handled on the backend of your server, it would get / renew / reuse the token as necessary

  let expiredToken = true;

  // check localStorage for token
  if (localStorage.token) {
    this.accessToken = JSON.parse(localStorage.getItem("token"));
    // check if token expiry is ok
    if (this.accessToken.exp > new Date().getTime() / 1000) {
      // miliseconds comparison
      // not expired token
      expiredToken = false;
    }
  }
  // if expired get new token and place it in localStorage
  if (expiredToken) {
    // make call to tokenAPI and set the token
    // getting the accessToken from the API asynchronously
    console.log("Initiating request for new token...");
    this.accessToken = await fetchToken();
    if (this.accessToken) {
      localStorage.setItem("token", JSON.stringify(this.accessToken));
    }
    expiredToken = false;
  }

  // regenerate token little before (5sec.) expiry time
  const bufferTime = 10000; // 5 sec. before the token expiry_time.
  let now = new Date().getTime();
  let exp_date = new Date(this.accessToken.exp * 1000 - bufferTime).getTime();
  this.refreshIn = Math.round(exp_date - now); // in miliseconds
  if (this.refreshIn > 0) {
    setInterval(async () => {
      await calculateRefresh();
      console.log(
        "Regenerating token in: ",
        Math.round(this.refreshIn / 1000) + "sec."
      );
    }, this.refreshIn);
  }

  // make function to recheck with the next token expiry time
  this.calculateRefresh = async () => {
    try {
      this.accessToken = await fetchToken();
    } catch (e) {
      return null;
    }
  };

  return this.accessToken;
}
