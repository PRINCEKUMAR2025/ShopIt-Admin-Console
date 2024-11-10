import React, { useEffect, useState } from 'react';
import { firestore } from './firebase'; // Import Firestore instance
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import './Chat.css'; // Import CSS file for styling

const Chat = ({ chatId, userId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, `chats/${chatId}/messages`), (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, [chatId]);

    const sendMessage = async () => {
        if (newMessage.trim()) {
            await addDoc(collection(firestore, `chats/${chatId}/messages`), {
                senderId: userId,
                text: newMessage,
                timestamp: serverTimestamp(),
            });
            setNewMessage('');
        }
    };

    return (
        <div className="chat-container">
            <div className="messages-container">
                {messages.map(message => (
                    <div key={message.id} className={`message ${message.senderId === userId ? 'sent' : 'received'}`}>
                        <strong>{message.senderId}: </strong>{message.text}
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button onClick={sendMessage} className="send-button">Send</button>
            </div>
        </div>
    );
};

export default Chat;