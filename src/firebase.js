import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC50OpGt0pezNLkAfbnLTRgylZSkjocVO4",
  authDomain: "rtc-bus-tracker-3f89c.firebaseapp.com",
  projectId: "rtc-bus-tracker-3f89c",
  storageBucket: "rtc-bus-tracker-3f89c.firebasestorage.app",
  messagingSenderId: "693853183950",
  appId: "1:693853183950:web:3cd24a07f6eb67c839d59f"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)