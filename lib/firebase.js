import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Dedicated Firebase project for the car dealership
const firebaseConfig = {
  apiKey: "AIzaSyDE_4r-r5k25mnxxtFcjmP3INYvLRVWyY",
  authDomain: "cars-d0f1d.firebaseapp.com",
  projectId: "cars-d0f1d",
  storageBucket: "cars-d0f1d.firebasestorage.app",
  messagingSenderId: "965234308245",
  appId: "1:965234308245:web:0efd2bd1251c382115979c"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
