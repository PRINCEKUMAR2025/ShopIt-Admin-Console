import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';
import './OrderList.css';
import { Link } from 'react-router-dom';
import axios from 'axios';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notificationMessage, setNotificationMessage] = useState('');

    const statusOptions = [
        'Placed',
        'In Transit',
        'In Nearest Hub',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Cancelled By Seller'
    ];

    // Load Orders from Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, 'Orders'), (userDocs) => {
            const ordersData = [];

            userDocs.forEach(userDoc => {
                // Load Normal Orders
                const normalOrderCollection = collection(userDoc.ref, 'NormalOrder');
                onSnapshot(normalOrderCollection, (normalOrderDocs) => {
                    normalOrderDocs.forEach(orderDoc => {
                        const orderData = orderDoc.data();
                        const order = {
                            id: orderDoc.id,
                            orderId: orderData.orderId || orderDoc.id,
                            userOrder: orderData.orderSummary || orderData.userOrder || 'N/A',
                            orderStatus: orderData.orderStatus || 'Placed',
                            orderType: orderData.orderType || 'Normal Order',
                            userId: userDoc.id,
                            timestamp: orderData.timestamp,
                            grandTotal: orderData.grandTotal || 0,
                            deliveryAddress: orderData.deliveryAddress || 'N/A',
                            paymentMethod: orderData.paymentMethod || 'N/A',
                            paymentStatus: orderData.paymentStatus || 'N/A',
                            itemCount: orderData.itemCount || 0,
                            subtotal: orderData.subtotal || 0,
                            deliveryFee: orderData.deliveryFee || 0,
                            platformFee: orderData.platformFee || 0,
                            cartItems: orderData.cartItems || 'N/A'
                        };
                        ordersData.push(order);
                    });
                    
                    // Sort and update orders
                    const sortedOrders = ordersData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setOrders([...sortedOrders]);
                });

                // Load Voice Orders
                const voiceOrderCollection = collection(userDoc.ref, 'VoiceOrders');
                onSnapshot(voiceOrderCollection, (voiceOrderDocs) => {
                    voiceOrderDocs.forEach(orderDoc => {
                        const orderData = orderDoc.data();
                        const order = {
                            id: orderDoc.id,
                            orderId: orderData.orderId || orderDoc.id,
                            userOrder: `🎤 Voice Order: ${orderData.productName || 'N/A'} (Qty: ${orderData.quantity || 1})`,
                            orderStatus: orderData.orderStatus || 'Placed',
                            orderType: 'Voice Chat Order',
                            userId: userDoc.id,
                            timestamp: orderData.timestamp,
                            grandTotal: orderData.grandTotal || orderData.productPrice || 0,
                            deliveryAddress: orderData.deliveryAddress || 'N/A',
                            paymentMethod: orderData.paymentMethod || 'N/A',
                            paymentStatus: orderData.paymentStatus || 'N/A',
                            itemCount: orderData.quantity || 1,
                            subtotal: orderData.productPrice || 0,
                            deliveryFee: orderData.deliveryFee || 0,
                            platformFee: orderData.platformFee || 0,
                            // Voice order specific fields
                            productName: orderData.productName,
                            productPrice: orderData.productPrice,
                            productDescription: orderData.productDescription,
                            imageUrl: orderData.imageUrl,
                            customerName: orderData.customerName
                        };
                        ordersData.push(order);
                    });
                    
                    // Sort and update orders
                    const sortedOrders = ordersData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setOrders([...sortedOrders]);
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
    const handleStatusChange = async (orderId, userId, newStatus, orderType) => {
        try {
            console.log(`Updating order status for Order ID: ${orderId}, User ID: ${userId} to ${newStatus}`);
            const fcmToken = await fetchFCMToken(userId);
            if (!fcmToken) {
                throw new Error(`FCM token not found for user ID: ${userId}`);
            }

            // Determine the correct collection based on order type
            const collectionName = orderType === 'Voice Chat Order' ? 'VoiceOrders' : 'NormalOrder';
            const orderRef = doc(firestore, 'Orders', userId, collectionName, orderId);
            await updateDoc(orderRef, { orderStatus: newStatus });

            setOrders(orders.map(order =>
                order.id === orderId && order.userId === userId ? { ...order, orderStatus: newStatus } : order
            ));

            // Send push notification for all status changes except "Placed"
            if (newStatus !== 'Placed') {
                console.log(`Sending push notification for Order ID: ${orderId} to User ID: ${userId}`);
                await sendPushNotification(userId, fcmToken, orderId, newStatus);
            }
            
            // Show success message in notification area instead of popup
            setNotificationMessage(`✅ Order ${orderId} status updated to ${newStatus}`);
            setTimeout(() => setNotificationMessage(''), 3000);
        } catch (err) {
            console.error(`Error updating order status for Order ID: ${orderId}, User ID: ${userId}`, err);
            setNotificationMessage(`❌ Error updating order ${orderId}: ${err.message}`);
            setTimeout(() => setNotificationMessage(''), 5000);
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
                setNotificationMessage(successMessage);
            } else {
                console.error('Error sending notification:', response.data);
                setNotificationMessage(`Error sending notification to user ${userId}: ${response.data}`);
            }
        } catch (err) {
            console.error(`Error sending notification to user ${userId}:`, err);
            setNotificationMessage(`Error sending notification to user ${userId}: ${err.message}`);
        }
    };

    if (loading) return (
        <div className="order-list">
            <div className="loading-state">🔄 Loading orders...</div>
        </div>
    );
    
    if (error) return (
        <div className="order-list">
            <div className="error-state">❌ Error fetching orders: {error}</div>
        </div>
    );

    return (
        <div className="order-list">
            <h2>Orders Management</h2>

            {/* Display notification message */}
            {notificationMessage && (
                <div className={`notification-feedback ${notificationMessage.includes('❌') ? 'error' : ''}`}>
                    <p>{notificationMessage}</p>
                </div>
            )}

            <div className="orders-container">
                <div className="orders-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Type</th>
                                <th>Order Details</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Address</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                                        📦 No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={`${order.id}-${order.userId}`}>
                                        <td>
                                            <strong>#{order.orderId?.substring(0, 12) || order.id?.substring(0, 12)}</strong>
                                        </td>
                                        <td>
                                            <span className={`order-type-badge ${
                                                order.orderType === 'Voice Chat Order' ? 'order-type-voice' : 'order-type-normal'
                                            }`}>
                                                {order.orderType === 'Voice Chat Order' ? '🎤 Voice' : '📱 Normal'}
                                            </span>
                                        </td>
                                        <td style={{maxWidth: '200px', wordWrap: 'break-word'}}>
                                            {order.userOrder}
                                        </td>
                                        <td>
                                            <small>{order.userId?.substring(0, 8)}...</small>
                                        </td>
                                        <td>
                                            <strong>₹{order.grandTotal || 0}</strong>
                                        </td>
                                        <td style={{maxWidth: '150px', wordWrap: 'break-word', fontSize: '12px'}}>
                                            {order.deliveryAddress}
                                        </td>
                                        <td>
                                            <span className={`status-${order.paymentStatus?.toLowerCase().replace(' ', '-')}`}>
                                                {order.paymentMethod}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={order.orderStatus}
                                                onChange={(e) => handleStatusChange(order.id, order.userId, e.target.value, order.orderType)}
                                                className={`status-${order.orderStatus?.toLowerCase().replace(' ', '-')}`}
                                            >
                                                {statusOptions.map((status, index) => (
                                                    <option key={index} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{fontSize: '12px'}}>
                                            {order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};  

export default OrderList;