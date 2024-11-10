import React, { useState } from 'react';
import { firestore } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import './UploadProduct.css';

const UploadProduct = () => {
    const [product, setProduct] = useState({ name: '', price: 0, description: '', img_url: '', rating: '' });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Check if the field is 'price', then convert it to a number
        if (name === 'price') {
            setProduct({ ...product, [name]: Number(value) });
        } else {
            setProduct({ ...product, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');

        try {
            await addDoc(collection(firestore, 'NewProducts'), product);
            setSuccessMessage('Product added successfully!');
            setProduct({ name: '', price: 0, description: '', img_url: '', rating: '' }); // Clear form
        } catch (err) {
            setError('Failed to add product: ' + err.message);
        }
    };

    return (
        <div className="upload-product-container">
            <h2>Upload New Product</h2>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <form className="upload-product-form" onSubmit={handleSubmit}>
                <label htmlFor="name">Product Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="price">Price</label>
                <input
                    type="number"
                    id="price"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="img_url">Image URL</label>
                <input
                    type="url"
                    id="img_url"
                    name="img_url"
                    value={product.img_url}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="rating">Rating</label>
                <input
                    type="text"
                    id="rating"
                    name="rating"
                    value={product.rating}
                    onChange={handleChange}
                    required
                />

                <button type="submit" className="upload-button">Upload Product</button>
            </form>
        </div>
    );
};

export default UploadProduct;
