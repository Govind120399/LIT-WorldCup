import { db } from './firebase-config.js';
import { 
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs 
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

// Retrieve global match results document
export async function fetchResults() {
  const resDoc = await getDoc(doc(db, 'global', 'results'));
  return resDoc.exists() ? resDoc.data() : {};
}

// Post administrative score verification
export async function updateMatchResult(matchId, h, a) {
  await setDoc(doc(db, 'global', 'results'), {
    [matchId]: { h: parseInt(h), a: parseInt(a) }
  }, { merge: true });
}

// Create a new competitive micro-league
export async function dbCreateLeague(name, userId) {
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  const leagueId = 'l_' + Date.now();
  const newLeague = {
    id: leagueId,
    name: name.trim(),
    code,
    hostId: userId,
    members: [{ userId, joinedAt: new Date().toISOString() }],
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'leagues', leagueId), newLeague);
  return newLeague;
}

// Join competitive micro-league via code identifier
export async function dbJoinLeague(code, userId) {
  const q = query(collection(db, 'leagues'), where('code', '==', code.toUpperCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('League code not found');
  
  const leagueDoc = snap.docs[0];
  const leagueData = leagueDoc.data();
  
  if (leagueData.members.some(m => m.userId === userId)) throw new Error("Already a member");

  const memberObj = { userId, joinedAt: new Date().toISOString() };
  await updateDoc(doc(db, 'leagues', leagueDoc.id), {
    members: arrayUnion(memberObj)
  });
  return leagueDoc.id;
}

// Remove profile membership from league
export async function dbLeaveLeague(leagueId, userId, memberObj) {
  await updateDoc(doc(db, 'leagues', leagueId), {
    members: arrayRemove(memberObj)
  });
}

// Fetch all profiles matching a list of user IDs
export async function fetchUsersList(userIds) {
  if (!userIds.length) return [];
  const q = query(collection(db, 'users'), where('__name__', 'in', userIds));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Fetch all leagues an active profile is inside
export async function fetchMyLeagues(userId) {
  const q = query(collection(db, 'leagues'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => d.data())
    .filter(league => league.members.some(m => m.userId === userId));
}

// Retrieve or write prediction matrices
export async function fetchPredictions(leagueId) {
  const q = query(collection(db, 'predictions'), where('leagueId', '==', leagueId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

export async function dbSavePrediction(userId, leagueId, matchId, h, a) {
  const predId = `${userId}_${leagueId}_${matchId}`;
  const prediction = { userId, leagueId, matchId, h, a, at: new Date().toISOString() };
  await setDoc(doc(db, 'predictions', predId), prediction);
  return prediction;
}