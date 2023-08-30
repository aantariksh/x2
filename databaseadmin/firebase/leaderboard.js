import {} from "./index.js";
import {
  getDatabase, get, ref,
  query, orderByChild, limitToFirst
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const db = getDatabase();
const GAME_ID = 'bikeRace';
const table = document.getElementById("data-table");

const d = new Date()
current_date.innerHTML = "Current Date: " + d.toUTCString().slice(5,16)

const downloadBtn = document.getElementById("downloadBtn")

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

  let csvContent = "#,Name,Mobile,Pincode,City,Game Count,Highest Score,Time\r\n";

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

    csvContent += [
        ctr+1, row?.user?.name || '', row?.mobile || '', row?.user?.pincode ||'', row?.user?.city || '-',
        row?.scores?.gameCount || '0', row?.scores?.total || '0', row?.scores?.time || '0'
      ].join(',') + "\r\n";      
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  downloadBtn.setAttribute("href", blobUrl);
  downloadBtn.setAttribute("download", "leaderboard.csv");

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
