import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; 
import OrderList from './OrderList';
import Login from './Login';
import UploadProduct from './UploadProduct'; // Import UploadProduct
import Chat from './Chat'; // Import Chat component
import './App.css'; 

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/orders" element={isAuthenticated ? <OrderList /> : <Navigate to="/login" />} />
                <Route path="/upload-product" element={isAuthenticated ? <UploadProduct /> : <Navigate to="/login" />} /> {/* New route */}
                <Route path="/chat" element={isAuthenticated ? <Chat chatId="chat1" userId="admin" /> : <Navigate to="/login" />} /> {/* New chat route */}
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;