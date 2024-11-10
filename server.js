const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors()); // Enable CORS for all routes

const FCM_API_URL = 'https://fcm.googleapis.com/v1/projects/ecommerce-bb71a/messages:send';
const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
const SERVICE_ACCOUNT = require('C:\\Users\\princ\\Downloads\\ecommerce-bb71a-firebase-adminsdk-pdr48-b196692f34.json'); // Service account JSON file

// Function to get access token
async function getAccessToken() {
    const auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT,
        scopes: SCOPES,
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token; // Return token value
}

// Endpoint to send notification
app.post('/send-notification', async (req, res) => {
    const { fcmToken, orderId, status } = req.body;

    // Validate input
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
                    image: 'https://example.com/order-status.png',
                },
                data: {
                    orderId: orderId,
                    status: status,
                },
                android: {
                    notification: {
                        clickAction: 'OPEN_ORDER_DETAILS',
                        color: '#FF5722', // Notification icon color
                    },
                    priority: 'high', // Set priority here
                },
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
        console.error('Error sending notification:', error.response ? error.response.data : error.message);
        res.status(500).send(`Error sending notification: ${error.response ? error.response.data : error.message}`);
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
