import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom'; 
import OrderList from './OrderList';
import Login from './Login';
import UploadProduct from './UploadProduct'; // Import UploadProduct
import AdminChatDashboard from './AdminChatDashboard'; // Import AdminChatDashboard
import ChatWindow from './ChatWindow'; // Import ChatWindow
import './App.css'; 

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [userId, setUserId] = useState('user123'); // Example user ID

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const openChat = () => {
        setIsChatOpen(true);
    };

    const closeChat = () => {
        setIsChatOpen(false);
        // Optionally clear userId or perform other cleanup
    };

    return (
        <Router>
            <div>
                <h1>Welcome to the Admin Panel</h1>
                <nav>
                    <ul>
                        <li><Link to="/orders">Orders</Link></li>
                        <li><Link to="/upload-product">Upload Product</Link></li>
                        <li><Link to="/admin-chats">Admin Ticket Dashboard</Link></li>
                    </ul>
                </nav>
                <div className="main-content">
                    <Routes>
                        <Route path="/login" element={<Login onLogin={handleLogin} />} />
                        <Route path="/orders" element={isAuthenticated ? <OrderList /> : <Navigate to="/login" />} />
                        <Route path="/upload-product" element={isAuthenticated ? <UploadProduct /> : <Navigate to="/login" />} />
                        <Route path="/admin-chats" element={isAuthenticated ? <AdminChatDashboard /> : <Navigate to="/login" />} /> {/* Protected route */}
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </div>
                {isChatOpen && <ChatWindow userId={userId} onClose={closeChat} />}
            </div>
        </Router>
    );
};

export default App;