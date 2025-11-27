import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDdZrIDxAnGiFO6Km4Hto63Eh5dOy-wC_o",
    authDomain: "cardlesson-5ad0b.firebaseapp.com",
    projectId: "cardlesson-5ad0b",
    storageBucket: "cardlesson-5ad0b.firebasestorage.app",
    messagingSenderId: "239161773030",
    appId: "1:239161773030:web:e4d07e5b59dcba872ca427"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
