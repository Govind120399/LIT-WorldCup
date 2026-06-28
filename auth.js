import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

// Monitor user login state shifts
export function watchAuthState(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      callback({ uid: user.uid, ...userDoc.data() });
    } else {
      callback(null);
    }
  });
}

// Sign Up New Competitor
export async function registerUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const userData = { name: name.trim(), email, createdAt: new Date().toISOString() };
  await setDoc(doc(db, 'users', user.uid), userData);
  return { uid: user.uid, ...userData };
}

// Sign In Existing Competitor
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  return { uid: user.uid, ...userDoc.data() };
}

// Global Sign Out
export async function logoutUser() {
  await signOut(auth);
}