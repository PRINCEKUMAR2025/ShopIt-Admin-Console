const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// -------------------- Firebase Config --------------------
const FCM_API_URL =
  "https://fcm.googleapis.com/v1/projects/ecommerce-bb71a/messages:send";
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

let serviceAccount;

// ✅ Load service account
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (err) {
    console.error("❌ Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
    process.exit(1);
  }
} else {
  // Local fallback
  try {
    serviceAccount = require("./serviceAccount.json");
  } catch (err) {
    console.error("❌ Service account not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env variable.");
    process.exit(1);
  }
}

// -------------------- Get Access Token --------------------
async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken || !accessToken.token) {
    throw new Error("Unable to fetch Firebase access token");
  }

  return accessToken.token;
}

// -------------------- API Endpoint --------------------
app.post("/send-notification", async (req, res) => {
  const { fcmToken, orderId, status } = req.body;

  if (!fcmToken || !orderId || !status) {
    return res
      .status(400)
      .json({ error: "Missing required fields: fcmToken, orderId, or status" });
  }

  try {
    const accessToken = await getAccessToken();

    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: `Update on Order #${orderId}`,
          body: `Your order is ${status}.`,
        },
        data: { orderId, status },
      },
    };

    const response = await axios.post(FCM_API_URL, message, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json({
      message: "Notification sent successfully",
      fcmResponse: response.data,
    });
  } catch (error) {
    console.error("❌ Error sending notification:", error.response?.data || error.message);
    res
      .status(500)
      .json({ error: "Error sending notification", details: error.message });
  }
});

// -------------------- Serve React Build --------------------
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
