// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, set, ref, get, push, query, orderByChild, onValue, limitToFirst, limitToLast, child, remove } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

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

// Check Login Status 
window.addEventListener('load', async () => {
    const currentPage = location.pathname;
    const isAuthPage = currentPage.includes('auth')
    const profile = localStorage.getItem("profile");
    if (!profile && !isAuthPage) { location.href = "auth.html" }
})

// Registration process
const registration = document.getElementById("registration")
if (registration) {
    registration.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const values = Object.fromEntries(formData.entries());
    
        // TODO: 
        // 1. Compute city from pincode. 
        // 2. Generate referal code
        // 3. User Type
    
        localStorage.setItem("profile", JSON.stringify(values));
        await addProfile(values)
        location.href = "index.html"
    })
}

function getLoggedInUser() {
    const profile = JSON.parse(localStorage.getItem("profile"))
    return profile.mobile
}
 
// Logout user
window.logOut = () => { localStorage.removeItem("profile"); location.reload(); }

/**
 * Firebase CRUD
 */

// USERS: mobile: { name, mobile, pincode, city, referredBy, referralCode }
async function addProfile(profile) {
    const dbRef = ref(db, `${GAME_ID}/users/${profile.mobile}`)
    await set(dbRef, profile);
}


function pushData() {
    const postListRef = ref(db, 'posts');
    const newPostRef = push(postListRef);
    set(newPostRef, {
        some: "123"
    });
}
function getEntireLeaderBoard() {
    const topUserPostsRef = query(ref(db, 'posts/'), orderByChild('total'), limitToLast(300));
    onValue(topUserPostsRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const childKey = childSnapshot.key;
        const childData = childSnapshot.val();
        console.log(childKey, childData)
      })
    })
}
getEntireLeaderBoard()


// SCORES: mobile: { score, bonus, total, time }
async function addScore(newScore) {
    // const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`)
    // await set(dbRef, score);
    const mobile = getLoggedInUser()
    
    const leaderboardRef = ref(db, `${GAME_ID}/scores/`)
    leaderboardRef.child(mobile).transaction((currentData) => {
      if (currentData) {
        // If the user entry exists, update the score
        const newEntry = { ...currentData }
        if (newScore.score > currentData.score) {newEntry.score = newScore.score; newEntry.date = new Date()}
        if (newScore.bonus > currentData.bonus) {newEntry.bonus = newScore.bonus; newEntry.date = new Date()}
        newEntry.gameCount += 1
        newEntry.total = newEntry.score + newEntry.bonus
        return newEntry
      } else {
        // If the user entry doesn't exist, create a new entry
        return { mobile, ...newScore, date: new Date(), gameCount: 0 };
      }
    });
}
window.addScore = addScore;

async function getScore(mobile, score) {
    const dbRef = ref(db, `${GAME_ID}/scores/${mobile}`)
    await get(dbRef);
}



