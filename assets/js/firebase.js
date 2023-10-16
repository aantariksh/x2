// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, get, set, ref, query, orderByChild, onValue, endAt, limitToFirst } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByC1b982YfVdqkYJGs10bwBK7bKEbOSYc",
  authDomain: "race2vegas-2.firebaseapp.com",
  databaseURL: "https://race2vegas-2-default-rtdb.firebaseio.com",
  projectId: "race2vegas-2",
  storageBucket: "race2vegas-2.appspot.com",
  messagingSenderId: "1020653892747",
  appId: "1:1020653892747:web:bf70bf62f9142b0d5c508e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase();

const GAME_ID = "bikeRace"
const START_DATE = new Date("2023-09-01");

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
  console.log(profile)
  const dbRef = ref(db, `${GAME_ID}/users/${profile.mobile}`)
  
  // Check if existing user, copy userType
  const snapshot = await get(dbRef)
  const old_profile = snapshot.val()
  if (old_profile && old_profile?.userType) {
    profile = { ...profile, userType: old_profile.userType }
  }
  // Save profile
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
  
  const profile = getLoggedInUser() 
  const mobile = profile?.mobile
  if (!mobile) return

  const profileSaved = await getProfile(mobile)
  if (!profileSaved) {
    await addProfile(profile)
  }

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
  const profile =  getLoggedInUser() 
  const mobile = profile?.mobile
  if (!mobile) return

  const score = await getScore(mobile)
  const rank = await getPlayerRank(score?.total || 0)
  return {score, rank}
}

// LeaderBoard
async function getEntireLeaderBoard(count=100) {
  const scoreBoardQuery = query(ref(db, `${GAME_ID}/scores/`), orderByChild('negative_total'), limitToFirst(count*2));
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
  return leaderBoard.filter(d => ['User', 'Winner'].includes(d?.user?.userType)).slice(0, count)
}

async function getWeeklyWinners(id) {
  const snapshot = await get(ref(db, `${GAME_ID}/winners/week${id}`))
  return snapshot.val()
}


async function computeWinners(count) {
  const week = computeCurrentWeek() - 1
  if (![1,2,3,4,5,6,7,8].includes(week)) return

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
  getWeeklyWinners, computeWinners
}
Object.keys(exports).forEach(key => window[key] = exports[key])
