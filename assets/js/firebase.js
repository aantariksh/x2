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
const START_DATE = new Date("2023-08-25");

function computeCurrentWeek() {
  try {
    const currentDate = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((START_DATE - currentDate) / oneDay));
    // Calculate the current week
    return Math.floor(diffDays / 7) + 1;
  } catch {
    return 1
  }
}

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

// USERS/mobile: { name, mobile, pincode, city, referredBy, referralCode, userType, joinDate }
async function addProfile(profile) {
  const dbRef = ref(db, `${GAME_ID}/users/${profile.mobile}`)
  await set(dbRef, profile);
}

async function getProfile(mobile) {
  const dbRef = ref(db, `${GAME_ID}/users/${mobile}`)
  const snapshot = await get(dbRef);
  return snapshot.val()
}

async function check(k) {
  const secRef = ref(db, `secret`)
  const secret = await get(secRef);
  return secret.val() == k
}

// SCORES/mobile: { score, bonus, total, time, gameCount }
async function addScore(k, s, t) {
  const isValid = await check(k);
  if (!isValid) return
  const score = parseInt(s);
  const time = parseFloat(t).toFixed(2);
  
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

  await set(dbRef, finalScore);
}

async function addBonus(referredBy) {
  const bonus = 50
  // Reference to the Firebase database
  let dbRef =  ref(db, `${GAME_ID}/users`);
  
  // Query the database to find the user with the referral code
  let snapshot = await get(dbRef);
  const data = snapshot.val()
  let mobile = ''
  for (let id in data) {
    const userData = data[id]
    if (userData.referralCode === referredBy) {
      mobile = id; break
    }
  }
  if (!mobile) return

  // Update Score
  dbRef = ref(db, `${GAME_ID}/scores/${mobile}`);
  snapshot = await get(dbRef);
  const oldScore = snapshot.val()

  let finalScore = {
    score: oldScore?.score || 0,
    bonus: oldScore?.bonus || 0,
    time: oldScore?.time || 0, 
    gameCount: oldScore?.gameCount || 0, 
    date: oldScore?.date || new Date() 
  }
  finalScore.bonus += bonus;
  finalScore.total = finalScore.score + finalScore.bonus
  finalScore.negative_total = -finalScore.total

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
async function getEntireLeaderBoard(count=100) {
  const scoreBoardQuery = query(ref(db, `${GAME_ID}/scores/`), orderByChild('negative_total'), limitToFirst(count));
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

// Weekly Winners/weekId: [mobile, mobile2, ..., mobile100]
async function getWeeklyWinners(week) {
  const dbRef = ref(db, `${GAME_ID}/winners/${week}`)
  const snapshot = await get(dbRef);
  return snapshot.val()
}

async function getWeeklyWinnersWithDetails(week) {
  const winningMobileNumbers = await getWeeklyWinners(week)
  const promises = winningMobileNumbers.map(async mobile => {
    const user = await getProfile(mobile)
    const scores = await getScore(mobile)
    return {mobile, user, scores}
  })
  const data = await Promise.all(promises)
  return data
}

async function computeWinners(count) {
  const week = computeCurrentWeek() - 1
  if (![1,2,3,4,5,6].includes(week)) return

  const scoreBoardQuery = query(ref(db, `${GAME_ID}/scores/`), orderByChild('negative_total'), limitToFirst(count * week));
  const snapshot = await get(scoreBoardQuery);
  const data = []
  snapshot.forEach(child => data.push(child.key))

  let prevWinners = []
  for (let i = 0; i < week; i++) {
    prevWinners.push(getWeeklyWinners(i))
  }
}

const exports = {
  computeCurrentWeek,
  addProfile, getProfile,
  addScore,
  getScoreWithRank,
  getEntireLeaderBoard,
  getWeeklyWinnersWithDetails, computeWinners
}
Object.keys(exports).forEach(key => window[key] = exports[key])
