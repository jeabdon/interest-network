// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6ty2CvkfcjVoV6FNBLhjc4bkLpeglZFo",
  authDomain: "my-app-1-8fad6.firebaseapp.com",
  projectId: "my-app-1-8fad6",
  storageBucket: "my-app-1-8fad6.firebasestorage.app",
  messagingSenderId: "388083494558",
  appId: "1:388083494558:web:70ac488c7740be3ff5558f",
  measurementId: "G-ML6RTZ8SM3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore(); 