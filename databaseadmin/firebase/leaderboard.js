import {} from "./index.js";
import {
  getDatabase, get, ref,
  query, orderByChild, limitToFirst
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const db = getDatabase();
const GAME_ID = 'bikeRace';
const table = document.getElementById("data-table");

async function getProfile(mobile) {
  const dbRef = ref(db, `${GAME_ID}/users/${mobile}`)
  const snapshot = await get(dbRef);
  return snapshot.val()
}

async function getEntireLeaderBoard(count=100) {
  let scoreBoardQuery = query(ref(db, `${GAME_ID}/scores/`), orderByChild('negative_total'));
  if (count && count > 0) {
    scoreBoardQuery = query(ref(db, `${GAME_ID}/scores/`), orderByChild('negative_total'), limitToFirst(count)); 
  }

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

window.onload = async() => {
  try {
    const data = await getEntireLeaderBoard()
    if (data && data.length) {
      console.log(data)
      displayData(data)
    } else {
      displayMessage("No data available");
    }
  } catch(error) {
    displayMessage(error);
  }
}

function displayData(data) {
  let tableValues = "";
  data.forEach((row, ctr) => {
    tableValues += `
      <tr class="text-center">
        <td> ${ctr + 1} </td>
        <td> ${row.user.name} </td>
        <td> ${row.mobile}  </td>
        <td> ${row.user.city} <br> <small>${row.user.pincode}</small> </td>
        <td> ${row.scores.gameCount} </td>
        <td> ${row.scores.total} <br> <small>${row.scores.time} secs</small> </td>
      </tr>`;
  });

  table.innerHTML = tableValues;
}

function displayMessage(msg) {
  table.innerHTML = `
    <tr>
      <td colspan="7" class="text-center">
        ${msg}
      </td>
    </tr>`;
}

function disableUser(mobile) {
  console.log(mobile)
}
window.disableUser = disableUser
