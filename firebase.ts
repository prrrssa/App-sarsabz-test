import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// IMPORTANT: Replace with your actual Firebase project configuration
// You can get this from the Firebase console for your web app.
const firebaseConfig = {
  apiKey: "AIzaSyAnzLFFdW-kemShV3h5IoAHW5r7MP7yzbA",
  authDomain: "sabz-exchange.firebaseapp.com",
  projectId: "sabz-exchange",
  storageBucket: "sabz-exchange.firebasestorage.app",
  messagingSenderId: "756558137548",
  appId: "1:756558137548:web:d9b15e065ed19915ec5a69"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// Export Firebase services for use in other parts of the app
export const auth = firebase.auth();
export const db = firebase.firestore();
