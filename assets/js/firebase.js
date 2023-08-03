// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, get, set, ref, query, orderByChild, onValue, endAt, limitToFirst } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlaXoh9qDEob3zJZ7HztV5lTShDvILVEI",
  authDomain: "dbscore-cec2e.firebaseapp.com",
  databaseURL: "https://dbscore-cec2e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dbscore-cec2e",
  storageBucket: "dbscore-cec2e.appspot.com",
  messagingSenderId: "69028027626",
  appId: "1:69028027626:web:3b2cf41b95dd0db2270b93"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase();

const GAME_ID = "bikeRace"


/**
 * FIREBASE CRUD functions
 * 1. add user profile
 * 2. get user profile (get from local storage instead)
 * 
 * 3. add new score
 * 4. add bonus points
 * 5. get score
 * 6. get user rank
 * 7. get score and rank
 * 
 * 8. fetch leaderboard
 * */

// USERS/mobile: { name, mobile, pincode, city, referredBy, referralCode, userType }
async function addProfile(profile) {
  const dbRef = ref(db, `${GAME_ID}/users/${profile.mobile}`)
  await set(dbRef, profile);
}

async function getProfile(mobile) {
  const dbRef = ref(db, `${GAME_ID}/users/${mobile}`)
  const snapshot = await get(dbRef);
  return snapshot.val()
}

// SCORES/mobile: { score, bonus, total, time, gameCount }
async function addScore(score, time) {
  const mobile = getLoggedInUser()
  const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`);
  const snapshot = await get(dbRef);
  const oldScore = snapshot.val()
  
  let finalScore = {
    score: oldScore?.score || 0,
    bonus: oldScore?.bonus || 0,
    time: oldScore?.time || 0, 
    gameCount: (oldScore?.gameCount || 0) + 1, 
    date: oldScore?.date || new Date() 
  }
  if (score > finalScore.score) { 
    finalScore.score = score; 
    finalScore.time = time; 
    finalScore.date = new Date() 
  }
  finalScore.total = finalScore.score + finalScore.bonus
  finalScore.negative_total = -finalScore.total

  console.log(finalScore)
  await set(dbRef, finalScore);
}

async function addBonus(bonus) {
  const mobile = getLoggedInUser()
  const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`);
  const oldScore = await get(dbRef);

  let finalScore = {
    score: oldScore?.score || 0,
    bonus: oldScore?.bonus || 0,
    time: oldScore?.time || 0, 
    gameCount: oldScore?.gameCount || 0, 
    date: oldScore?.date || new Date() 
  }
  finalScore.bonus += bonus;
  finalScore.total = finalScore.score + finalScore.bonus
  finalScore.negative_total = -total

  await set(dbRef, finalScore);
}

async function getScore(mobile) {
  const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`)
  const snapshot = await get(dbRef);
  return snapshot.val()
}

async function getPlayerRank(score) {
  if (!score) return "No Rank!"

  const scoreBoardQuery = query(
    ref(db, `${GAME_ID}/scores/`), 
    orderByChild('negative_total'), 
    endAt(-score)
  );
  try {
    const snapshot = await get(scoreBoardQuery);
    const rank = snapshot.size;
    return rank;
  } catch (error) {
    console.error('Error fetching data:', error);
    return "No Rank!";
  }
}

async function getScoreWithRank() {
  const mobile = getLoggedInUser()
  const score = await getScore(mobile)
  const rank = await getPlayerRank(score?.total || 0)
  return {score, rank}
}

// LeaderBoard
async function getEntireLeaderBoard() {
  const scoreBoardQuery = query(ref(db, `${GAME_ID}/scores/`), orderByChild('negative_total'), limitToFirst(100));
  const snapshot = await get(scoreBoardQuery);
  const data = []

  snapshot.forEach(child => {
    data.push({mobile: child.key, scores: child.val()})
  })

  const promises = data.map(async (d) => {
    const user = await getProfile(d["mobile"])
    return {...d, user}
  })
  const leaderBoard = await Promise.all(promises)
  return leaderBoard
}

const exports = {
  addProfile, getProfile,
  addScore, addBonus,
  getScore, getPlayerRank, getScoreWithRank,
  getEntireLeaderBoard
}
Object.keys(exports).forEach(key => window[key] = exports[key])
