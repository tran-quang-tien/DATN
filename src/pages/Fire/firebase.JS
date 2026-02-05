import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDkzjIJ3jlcvls-Bu8dvjyiR2mceAZywpQ",
  authDomain: "sakura-cafe-bcfe7.firebaseapp.com",
  projectId: "sakura-cafe-bcfe7",
  storageBucket: "sakura-cafe-bcfe7.firebasestorage.app",
  messagingSenderId: "727874007999",
  appId: "1:727874007999:web:e7ce30686df1f000eba70a"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);