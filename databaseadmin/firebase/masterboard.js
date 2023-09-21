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

const downloadBtn = document.getElementById("downloadBtn")

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

  let csvContent = "#,Name,Mobile,Pincode,City,User Type,Join Date,Game Count,Highest Score,Time\r\n";

  ids.forEach((id, ctr) => {
    const row = data[id];
    tableValues += `
      <tr class="text-center">
        <td class="id"> ${ctr + 1} </td>
        <td class="name"> ${row?.user?.name || '-'} </td>
        <td class="mobile"> ${row?.mobile || '-'} </td>
        <td class="pincode"> ${row?.user?.pincode || '-'} </td>
        <td class="city"> ${row?.user?.city || '-'} </td>
        <td class="user_type"> ${row?.user?.userType || 'User'} </td>
        <td class="join_date"> ${row?.user?.joinDate || '-'} </td>
        <td class="game_count"> ${row?.scores?.gameCount || '0'} </td>
        <td class="score"> ${row?.scores?.total || '0'} <br> <small>${row?.scores?.time || '0'} secs</small> </td>
        <td class=""> <a type="button" class="text-danger" onclick="disableUser('${row?.mobile}')"><i class="bi bi-x-circle-fill"></i></a> </td>
      </tr>`;

    csvContent += [
      ctr+1, row?.user?.name || '', row?.mobile || '', row?.user?.pincode ||'', row?.user?.city || '-',
      row?.user?.userType || 'User', row?.user?.joinDate || '-', row?.scores?.gameCount || '0', 
      row?.scores?.total || '0', row?.scores?.time || '0'
    ].join(',') + "\r\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  downloadBtn.setAttribute("href", blobUrl);
  downloadBtn.setAttribute("download", "masterboard.csv");

  table.innerHTML = tableValues;
  listInit()
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
    const urlParams = new URLSearchParams(window.location.search);
    let count = parseInt(urlParams.get('count'))
    if ( count == 0) {}
    else if (!count) { count = 100 }
    await getEntireLeaderBoard(count)
  } catch(error) {
    displayMessage(error);
  }
}

async function disableUser(mobile) {
  const rf = ref(db, `bikeRace/users/${mobile}/userType`)

  const snapshot = await get(rf)
  const data = snapshot.val()
  console.log(data)
  switch (data) {
    case 'User': {
      if (confirm("Are you sure you want to report this user as SUSPICIOUS?")) 
        set(rf, "Suspicious")
        .then(() => {alert('User marked as suspicious'); location.reload()})
        .catch(() => alert("Failed to mark user!"));
      break;
    }
    case 'Suspicious': {
      if (confirm("Are you sure you want to remove this user from SUSPICIOUS list?")) 
        set(rf, "User")
        .then(() => {alert('User marked as Normal User'); location.reload()})
        .catch(() => alert("Failed to mark user!"));
      break;
    }
    case 'Winner': {
      alert("User type can't be changed");break;
    }
    default: {
      alert("Failed to mark user!");break;
    }
  }

}
window.disableUser = disableUser
