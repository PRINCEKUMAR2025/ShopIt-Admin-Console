// ... existing imports ...
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { firestore } from './firebase'; // Import Firestore instance
import './OrderList.css'; // Import CSS file for styling
import { Link } from 'react-router-dom'; // Import Link for navigation
import axios from 'axios'; // Import axios for making API requests

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notificationMessage, setNotificationMessage] = useState(''); // State for notification feedback

    const statusOptions = [
        'Placed',
        'In Transit',
        'In Nearest Hub',
        'Out for Delivery',
        'Delivered',
        'Cancelled By Seller' // Added status option
    ];

    // Load Orders from Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, 'Orders'), (orderDocs) => {
            const ordersData = [];

            orderDocs.forEach(userDoc => {
                const normalOrderCollection = collection(userDoc.ref, 'NormalOrder');

                onSnapshot(normalOrderCollection, (normalOrderDocs) => {
                    normalOrderDocs.forEach(orderDoc => {
                        const order = {
                            id: orderDoc.id,
                            userOrder: orderDoc.data().userOrder,
                            orderStatus: orderDoc.data().orderStatus || 'Placed',
                            userId: userDoc.id
                        };
                        ordersData.push(order);
                    });
                    setOrders(prevOrders => {
                        const updatedOrders = [...prevOrders];
                        ordersData.forEach(newOrder => {
                            const existingOrderIndex = updatedOrders.findIndex(order => order.id === newOrder.id && order.userId === newOrder.userId);
                            if (existingOrderIndex > -1) {
                                updatedOrders[existingOrderIndex] = newOrder;
                            } else {
                                updatedOrders.push(newOrder);
                            }
                        });
                        return updatedOrders;
                    });
                });
            });
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch FCM token from Firestore
    const fetchFCMToken = async (userId) => {
        try {
            console.log(`Fetching FCM token for user ID: ${userId}`);
            
            // Reference to the FCM_Tokens collection for the user
            const fcmTokensRef = collection(firestore, 'Orders', userId, 'FCM_Tokens');
            console.log(`FCM_Tokens collection reference created: ${fcmTokensRef.path}`);
            
            // Get all the documents in the FCM_Tokens collection
            const fcmTokensSnapshot = await getDocs(fcmTokensRef);
            console.log(`Documents fetched from FCM_Tokens collection: ${fcmTokensSnapshot.size}`);
            
            if (!fcmTokensSnapshot.empty) {
                // Assuming there's only one FCM token per user, so take the first document
                const firstTokenDoc = fcmTokensSnapshot.docs[0];
                const fcmToken = firstTokenDoc.data().fcmToken;
    
                console.log(`FCM token found: ${fcmToken}`);
                return fcmToken;
            } else {
                console.warn(`No FCM token found for user ID: ${userId}`);
                return null;
            }
        } catch (err) {
            console.error(`Error fetching FCM token for user ID ${userId}:`, err);
            return null;
        }
    };
    

    // Handle Order Status Change and Send Push Notification
    const handleStatusChange = async (orderId, userId, newStatus) => {
        try {
            console.log(`Updating order status for Order ID: ${orderId}, User ID: ${userId} to ${newStatus}`);
            const fcmToken = await fetchFCMToken(userId);
            if (!fcmToken) {
                throw new Error(`FCM token not found for user ID: ${userId}`);
            }

            const orderRef = doc(firestore, 'Orders', userId, 'NormalOrder', orderId);
            await updateDoc(orderRef, { orderStatus: newStatus });

            setOrders(orders.map(order =>
                order.id === orderId && order.userId === userId ? { ...order, orderStatus: newStatus } : order
            ));

            // Send push notification for all status changes except "Placed"
            if (newStatus !== 'Placed') {
                console.log(`Sending push notification for Order ID: ${orderId} to User ID: ${userId}`);
                await sendPushNotification(userId, fcmToken, orderId, newStatus);
            }
            
            alert('Order status updated successfully.');
        } catch (err) {
            console.error(`Error updating order status for Order ID: ${orderId}, User ID: ${userId}`, err);
            alert('Error updating order status: ' + err.message);
        }
    };
    

    // Send Push Notification to user
    const sendPushNotification = async (userId, fcmToken, orderId, newStatus) => {
        try {
            console.log(`Preparing to send notification for Order ID: ${orderId}, User ID: ${userId} with FCM token: ${fcmToken}`);
            
            // API call to your server to send the notification
            const response = await axios.post('http://localhost:3001/send-notification', {
                fcmToken: fcmToken,
                orderId: orderId,
                status: newStatus
            });

            if (response.status === 200) {
                const successMessage = `Notification sent successfully to user ${userId}`;
                console.log(successMessage);
                setNotificationMessage(successMessage); // Update UI with success message
            } else {
                console.error('Error sending notification:', response.data);
                setNotificationMessage(`Error sending notification to user ${userId}: ${response.data}`);
            }
        } catch (err) {
            console.error(`Error sending notification to user ${userId}:`, err);
            setNotificationMessage(`Error sending notification to user ${userId}: ${err.message}`);
        }
    };

    if (loading) return <p>Loading orders...</p>;
    if (error) return <p>Error fetching orders: {error}</p>;

    return (
        <div className="order-list">
            <h2>ShopIt Admin Panel Orders</h2>

            <div className="upload-button-container">
                <Link to="/upload-product">
                    <button className="upload-button">Upload New Product</button>
                </Link>
            </div>

            {/* Button to navigate to Chat */}
            <div className="chat-button-container">
                <Link to="/chat">
                    <button className="chat-button">Go to Chat</button>
                </Link>
            </div>

            {/* Display notification message */}
            {notificationMessage && (
                <div className="notification-feedback">
                    <p>{notificationMessage}</p>
                </div>
            )}

            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>User Order</th>
                        <th>Order Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.userOrder}</td>
                            <td>
                                <select
                                    value={order.orderStatus}
                                    onChange={(e) => handleStatusChange(order.id, order.userId, e.target.value)}
                                >
                                    {statusOptions.map((status, index) => (
                                        <option key={index} value={status}>{status}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};  

export default OrderList;