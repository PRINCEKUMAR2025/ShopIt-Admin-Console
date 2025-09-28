const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Firebase constants
const FCM_API_URL = 'https://fcm.googleapis.com/v1/projects/ecommerce-bb71a/messages:send';
const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

// Load service account from env var instead of absolute path
const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// Function to get access token
async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT,
    scopes: SCOPES,
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

// Notification endpoint
app.post('/send-notification', async (req, res) => {
  const { fcmToken, orderId, status } = req.body;

  if (!fcmToken || !orderId || !status) {
    return res.status(400).send('Missing required fields: fcmToken, orderId, or status');
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
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      res.status(200).send('Notification sent successfully');
    } else {
      res.status(response.status).send('Failed to send notification');
    }
  } catch (error) {
    console.error('Error sending notification:', error.message);
    res.status(500).send(`Error sending notification: ${error.message}`);
  }
});

// 👉 Serve React build
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
