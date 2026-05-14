import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCMa-3ZUW4ruZno8JVWFIWF_5DL6ejhNNg",
  authDomain: "tracker-app-b9542.firebaseapp.com",
  projectId: "tracker-app-b9542",
  storageBucket: "tracker-app-b9542.firebasestorage.app",
  messagingSenderId: "1031111995300",
  appId: "1:1031111995300:web:f84019b8257b46ec231b31",
  measurementId: "G-H8EYGJRQ59"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)