const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, 'vishalhindu734@gmail.com', 'adminadmin');
    console.log("Logged in");
    const snap = await getDocs(collection(db, 'chatRooms'));
    console.log("Chat Rooms fetched:", snap.docs.length);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
run();
