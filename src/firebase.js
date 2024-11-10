// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXfUABwF5_5mU4_S97nnjd9tQdAh2erEQ",
  authDomain: "ecommerce-bb71a.firebaseapp.com",
  databaseURL: "https://ecommerce-bb71a-default-rtdb.firebaseio.com",
  projectId: "ecommerce-bb71a",
  storageBucket: "ecommerce-bb71a.appspot.com",
  messagingSenderId: "699623838921",
  appId: "1:699623838921:web:e0bfe6fa525f622bda2918",
  measurementId: "G-L8G4BY9P2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export { firestore, auth };