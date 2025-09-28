import React, { useEffect, useState } from 'react';
import { firestore } from './firebase'; // Import Firestore instance
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, deleteDoc } from 'firebase/firestore';

const ChatWindow = ({ chatId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const messagesCollection = collection(firestore, `chats/${chatId}/messages`);
        const q = query(messagesCollection, orderBy('timestamp'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(messagesData);
        });

        return () => {
            unsubscribe();
        };
    }, [chatId]);

    const sendMessage = async () => {
        if (newMessage.trim()) {
            await addDoc(collection(firestore, `chats/${chatId}/messages`), {
                senderId: 'admin', // Set senderId to 'admin' for admin replies
                text: newMessage,
                timestamp: new Date().getTime(), // Use current timestamp
            });
            setNewMessage('');
        }
    };

    const closeTicket = async () => {
        const messagesCollection = collection(firestore, `chats/${chatId}/messages`);
        const messagesSnapshot = await getDocs(messagesCollection);

        // Delete all messages in the messages collection
        const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));

        try {
            await Promise.all(deletePromises); // Wait for all deletions to complete
            console.log("All messages deleted successfully.");
        } catch (error) {
            console.error("Error deleting messages: ", error);
        }

        // Close the chat window after deletion
        onClose();
    };

    // Function to format the timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format to HH:MM
    };

    return (
        <div className="chat-window">
            <h2>Chat with User: {chatId}</h2>
            <div className="messages-container">
                {messages.map(message => (
                    <div key={message.id} className={`message ${message.senderId === 'admin' ? 'admin' : 'user'}`}>
                        <div className="message-header">
                            <strong>{message.senderId}</strong>
                            <span className="timestamp">{formatTimestamp(message.timestamp)}</span> {/* Display timestamp */}
                        </div>
                        <p className="message-text">{message.text}</p> {/* Message text with background */}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
            <button onClick={closeTicket}>Close Ticket</button> {/* Close Ticket button */}
            <button onClick={onClose}>Close Chat</button>
        </div>
    );
};

export default ChatWindow;