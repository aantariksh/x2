import {} from "./index.js";
import {
  getDatabase,
  query, orderByChild, limitToFirst,
  get, set, ref,
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const db = getDatabase()
const dbRef = ref(db);
const GAME_ID = 'bikeRace'
const table = document.getElementById("data-table");

async function getProfile(mobile) {
  const dbRef = ref(db, `${GAME_ID}/users/${mobile}`)
  const snapshot = await get(dbRef);
  return snapshot.val()
}

async function getEntireLeaderBoard(count=1) {
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
  displayData(leaderBoard)
}

function displayData(data) {
  let tableValues = "";
  const ids = Object.keys(data);
  ids.forEach((id, ctr) => {
    const row = data[id];
    tableValues += `
      <tr class="text-center">
        <td> ${ctr + 1} </td>
        <td> ${row?.user?.name || '-'} </td>
        <td> ${row?.mobile || '-'} </td>
        <td> ${row?.user?.pincode || '-'} </td>
        <td> ${row?.user?.city || '-'} </td>
        <td> ${row?.user?.userType || 'User'} </td>
        <td> ${row?.user?.joinDate || '-'} </td>
        <td> ${row?.scores?.gameCount || '0'} </td>
        <td> ${row?.scores?.total || '0'} <br> <small>${row?.scores?.time || '0'} secs</small> </td>
        <td> <a type="button" class="text-danger" onclick="disableUser('${row?.mobile}')"><i class="bi bi-x-circle-fill"></i></a> </td>
      </tr>`;
  });

  table.innerHTML = tableValues;
}

function displayMessage(msg) {
  table.innerHTML = `
    <tr>
      <td colspan="10" class="text-center">
        ${msg}
      </td>
    </tr>`;
}

window.onload = async() => {
  try {
    await getEntireLeaderBoard(0)
  } catch(error) {
    displayMessage(error);
  }
}

function disableUser(mobile) {
  const rf = ref(db, `bikeRace/users/${mobile}/userType`)
  set(rf, "Suspicious")
    .then(() => alert('User marked as suspicious'))
    .catch(() => alert("Failed to mark user!"));
}
window.disableUser = disableUser
