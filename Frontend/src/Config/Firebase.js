import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // ✅ THIS IS REQUIRED

const firebaseConfig = {
  apiKey: "AIzaSyB8DbUJL7FvU2ynQiD0wVEgsgF4iRvx4yY", 
  authDomain: "smms-2f88f.firebaseapp.com", 
  projectId: "smms-2f88f", 
  storageBucket: "smms-2f88f.firebasestorage.app", 
  messagingSenderId: "613458884492", 
  appId: "1:613458884492:web:02e7eab5dedacf7c2808a9", 
  measurementId: "G-GFW48H02F3"
};

const app = initializeApp(firebaseConfig);

// ✅ Define and export auth and provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };


