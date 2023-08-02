// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, set, ref, get, query, orderByChild, onValue, endAt, limitToFirst } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

import pincodes from '../pincodes.json' assert {type: 'json'};

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
 * 5. get user rank
 * 6. fetch leaderboard
 * */

// USERS/mobile: { name, mobile, pincode, city, referredBy, referralCode, userType }
async function addProfile(profile) {
  const dbRef = ref(db, `${GAME_ID}/users/${profile.mobile}`)
  await set(dbRef, profile);
}

async function getProfile(mobile) {
  const dbRef = ref(db, `${GAME_ID}/users/${mobile}`)
  return await get(dbRef);
}

// SCORES/mobile: { score, bonus, total, time, gameCount }
async function addScore(score, time) {
  const mobile = getLoggedInUser()
  const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`);
  const oldScore = await get(dbRef);
  
  let finalScore = {}
  if (oldScore) {
    finalScore = { ...oldScore }
    if (score > oldScore.score) { 
      finalScore.score = score; 
      finalScore.time = time; 
      finalScore.date = new Date() 
    }
    finalScore.gameCount += 1
    finalScore.total = finalScore.score + finalScore.bonus
  } else {
    finalScore = {
      score, bonus: 0, total: score,
      time, gameCount: 1, date: new Date() 
    }
  }
  await set(dbRef, finalScore);
}

async function addBonus(bonus) {
  const mobile = getLoggedInUser()
  const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`);
  const oldScore = await get(dbRef);

  let finalScore = {}
  if (oldScore) {
    finalScore = { ...oldScore }
    if (bonus > oldScore.bonus) { 
      finalScore.bonus = bonus;
    }
    finalScore.total = finalScore.score + finalScore.bonus
  } else {
    finalScore = {
      score: 0, bonus, total: bonus,
      time: 0, gameCount: 0, date: new Date() 
    }
  }
  await set(dbRef, finalScore);
}

async function getScore(mobile) {
  const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`)
  return await get(dbRef);
}

async function getPlayerRank(score) {
  if (!score) return "No Rank!"

  const scoreBoard = query(
    ref(db, `${GAME_ID}/scores/`), 
    orderByChild('total'), 
    endAt(score)
  );
  let rank = "No Rank!"
  get(scoreBoard, (snapshot) => {
    rank = snapshot.numChildren();
  })
  return rank
}

async function getScoreWithRank() {
  const mobile = getLoggedInUser()
  const score = await getScore(mobile)
  const rank = await getPlayerRank(score?.total || 0)
  return {score, rank}
}

function getEntireLeaderBoard() {
  const topUserPostsRef = query(ref(db, 'scores/'), orderByChild('total'), limitToFirst(100));
  onValue(topUserPostsRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const childKey = childSnapshot.key;
      const childData = childSnapshot.val();
      console.log(childKey, childData)
    })
  })
}

const exports = {
  pincodes,
  addScore,
  addProfile
}
Object.keys(exports).forEach(key => window[key] = exports[key])