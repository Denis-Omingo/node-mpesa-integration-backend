/*
  Author: Denis Omingo
  Description: Mpesa Daraja API with Node JS
  Date: 23/10/2023
  Github Link: https://github.com/Denis-Omingo/mern-mpesa-integration.git
  Website: www.denisomingo.com
  Email: omingodenis7@gmail.com
  Phone: +254113890709
  
*/

const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require("body-parser");
const axios = require("axios"); // Import 'axios' instead of 'request'
const moment = require("moment");
const apiRouter = require('./api');
const cors = require("cors");
const fs = require("fs");
require('dotenv').config();


const port = process.env.PORT;
const hostname = "localhost";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use('/', apiRouter);

const server = http.createServer(app);

// ACCESS TOKEN FUNCTION - Updated to use 'axios'
async function getAccessToken() {
  const consumer_key = process.env.CONSUMER_KEY; // REPLACE IT WITH YOUR CONSUMER KEY
  const consumer_secret = process.env.CONSUMER_SECRET; // REPLACE IT WITH YOUR CONSUMER SECRET
  const url =process.env.ACCESS_TOKEN_URL;
  const auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });
   
    const dataresponse = response.data;
    // console.log(data);
    const accessToken = dataresponse.access_token;
    return accessToken;
  } catch (error) {
    throw error;
  }
}

app.get("/", (req, res) => {
  res.send("MPESA DARAJA API WITH NODE JS BY DENIS OMINGO");
  var timeStamp = moment().format("YYYYMMDDHHmmss");
  console.log(timeStamp);
});


//ACCESS TOKEN ROUTE
app.get("/access_token", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      res.send("😀 Your access token is " + accessToken);
    })
    .catch(console.log);
});

//MPESA STK PUSH ROUTE
app.post("/stkpush", (req, res) => {
  // const {phone, amount}=req.body;
  // console.log("Phone:"+
  //    phone+" Amount"+
  //     amount
  // )
  getAccessToken()
    .then((accessToken) => {
      const url =process.env.STKPUSH_URL;
      const auth = "Bearer " + accessToken;
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const password = new Buffer.from(
        process.env.STK_BUSINESS_SHORT_CODE + 
          process.env.STKPUSH_PASSWORD +
          timestamp 
      ).toString("base64"); 
      // paybil+pass key

      axios
        .post(
          url,
          {
            BusinessShortCode: STK_BUSINESS_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: "3000",
            PartyA: "254113890709", //phone number to receive the stk push
            PartyB: STK_BUSINESS_SHORT_CODE,
            PhoneNumber: "254113890709",
            CallBackURL:`${process.env.CALLBACK_URL}/callback`,
            AccountReference: "DENIS-NODE MPESA API",
            TransactionDesc: "Mpesa Daraja API stk push test",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.send("😀 Request is successful done ✔✔. Please enter mpesa pin on your phone to complete the transaction");
        })
        .catch((error) => {
          console.error("Error response from M-Pesa:", error);
          res.status(500).send("❌ Request failed"+error);
        });
    })
    .catch(console.log);
});




//STK PUSH CALLBACK ROUTE
app.post("/callback", (req, res) => {
  console.log("STK PUSH CALLBACK");
  const CheckoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
  const ResultCode = req.body.Body.stkCallback.ResultCode;
  var json = JSON.stringify(req.body);
  fs.writeFile("stkcallback.json", json, "utf8", function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("STK PUSH CALLBACK JSON FILE SAVED");
  });
  console.log(req.body);
});

// REGISTER URL FOR C2B
app.get("/registerurl", (req, resp) => {
  getAccessToken()
    .then((accessToken) => {
      const url = process.env.REGISTER_URL;
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            ShortCode: process.env.C2B_SHORTCODE,
            ResponseType: "Complete",
            ConfirmationURL: `${process.env.CONFIRMATION_URL}/confirmation`,
            ValidationURL: `${process.env.VALIDATION_URL}/validation`,
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          resp.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          resp.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

app.get("/confirmation", (req, res) => {
  console.log("All transaction will be sent to this URL");
  console.log(req.body);
});

app.get("/validation", (req, resp) => {
  console.log("Validating payment");
  console.log(req.body);
});

// B2C ROUTE OR AUTO WITHDRAWAL
app.get("/b2curlrequest", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const securityCredential =process.env.SECURITY_CREDENTIAL;
      const url = process.env.B2C_URL;
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            InitiatorName: "testapi",
            SecurityCredential: securityCredential,
            CommandID: "PromotionPayment",
            Amount: "1",
            PartyA: "600996",
            PartyB: "",//phone number to receive the stk push
            Remarks: "Withdrawal",
            QueueTimeOutURL: `${process.env.QUEUETIMEOUT_URL}/b2c/queue`,
            ResultURL: `${process.env.RESULT_URL}/b2c/result`,
            Occasion: "Withdrawal",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
