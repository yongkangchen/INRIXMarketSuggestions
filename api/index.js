const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const port = 3000;
const axios = require("axios");
const NodeCache = require("node-cache");
const apiCache = new NodeCache();

var config = require("./config");
var dataset = require("./dataset");

app.use(express.static("../ui"));
app.use(express.json());

app.get("/getToken", (req, res) => {
  // url to produce token based on appId and hashToken
  res.setHeader("Access-Control-Allow-Origin", "*"); // setup cors compatibility
  // get from .env variables
  // const appId = process.env.APP_ID; // req.query.appId
  // const hashToken = process.env.HASH_TOKEN;

  const appId = config.appId;
  const hashToken = config.hashToken;

  if (apiCache.has(appId)) {
    // Serve response from cache
    // console.log('Retrieved value from cache !!!');
    res.json(apiCache.get(appId));
  } else {
    // create server request
    const axiosConfig = {
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
      },
    };
    axios
      .get(
        config.authTokenUrl,
        {
          params: {
            appId,
            hashToken,
          },
        },
        axiosConfig
      )
      .then((response) => {
        if (response.status === 200) {
          const oneHour = 1 * 60 * 60; // One hour in seconds
          //const twelvehours = 15;
          const exp = (new Date().getTime() + oneHour * 1000) / 1000;

          const payload = {
            token: response.data.result.token,
            exp, //in seconds
          };
          // Set value for same appId, in order to serve future requests efficiently
          apiCache.set(appId, payload);
          res.json(payload);
        }
      })
      .catch((error) => {
        // res.json(error);
        res.status(500).send({ error: 'error fetching token' })
      });
  }
});

app.get("/checkConfig", (req, res) => {
  let exists = false;
  if (config.appId && config.hashToken && config.authTokenUrl) {
    exists = true;
  }
  const payload = {
    exists,
  };
  res.json(payload);
});

app.post("/visitCount", (req, res) => {
  // console.log(req.body);
  let key = req.body.latitude + "|" + req.body.longitude;

  let from = dataset["from"][key]
  let to = dataset["to"][key]
  res.json({from: from, to: to});
});

app.listen(port, () => {
  console.log(`Open the URL: http://localhost:${port} in your browser`);
});

//console.log(`statusCode: ${response.status}`)
// console.log(response.data.result.token);
