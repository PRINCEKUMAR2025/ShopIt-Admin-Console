import React, { useEffect, useState } from 'react';
import { firestore } from './firebase'; // Import Firestore instance
import { collection, onSnapshot } from 'firebase/firestore';
import ChatWindow from './ChatWindow'; // Import the ChatWindow component

const AdminChatDashboard = () => {
    const [userChats, setUserChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firestore, 'chats'), (snapshot) => {
            const chatsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserChats(chatsData);
        });

        return () => unsubscribe();
    }, []);

    const openChat = (chatId) => {
        setActiveChat(chatId);
    };

    const closeChat = () => {
        setActiveChat(null);
    };

    return (
        <div>
            <h1>Admin Ticket Dashboard</h1>
            <h2>User Tickets</h2>
            <ul>
                {userChats.map(chat => (
                    <li key={chat.id}>
                        <button onClick={() => openChat(chat.id)}>Chat with {chat.id}</button>
                    </li>
                ))}
            </ul>
            {activeChat && <ChatWindow chatId={activeChat} onClose={closeChat} />}
        </div>
    );
};

export default AdminChatDashboard;