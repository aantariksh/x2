import { } from "./index.js";
import {
  getDatabase, get, set, ref, update,
  query, orderByChild, limitToFirst
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const db = getDatabase();
const GAME_ID = 'bikeRace';
const table = document.getElementById("data-table");

// const d = new Date()
// current_date.innerHTML = "Current Date: " + d.toUTCString().slice(5,16)

const downloadBtn = document.getElementById("downloadBtn")

/**
 * Compute Winners
 */

async function getProfile(mobile) {
  const dbRef = ref(db, `${GAME_ID}/users/${mobile}`)
  const snapshot = await get(dbRef);
  return snapshot.val()
}

const START_DATE = new Date("2023-09-01");
function computeWeek() {
  const currentDate = new Date()
  try {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((START_DATE - currentDate) / oneDay));
    return Math.floor(diffDays / 7);
  } catch {
    return 1
  }
}

async function computeWinningList() {
  try {
    alert("Computing results, please dont refresh...")
    const week = computeWeek()
    const winnersDbRef = ref(db, `${GAME_ID}/winners/week${week}`)
    const wsnp = await get(winnersDbRef)
    const old_winners = wsnp.val()
    if (old_winners && old_winners.length) {
      alert("Latest Winner list already declared!")
      return
    }
  
    const count = 100 * (week + 2)
    const scoreBoardQuery = query(
      ref(db, `${GAME_ID}/scores/`), 
      orderByChild('negative_total'),
      limitToFirst(count)
    ); 
  
    const snapshot = await get(scoreBoardQuery);
    const data = []
  
    snapshot.forEach(child => {
      data.push({mobile: child.key, scores: child.val()})
    })

    const promises = data.map(async (d) => {
      const user = await getProfile(d["mobile"])
      return {...d, user}
    })
    let winners = await Promise.all(promises)
    winners = winners
      .filter(w => w.user?.userType && w.user?.userType == 'User')
      .slice(0, 100)
  
    await Promise.all(winners.map(async (d) => {
      const dbRef = ref(db, `${GAME_ID}/users/${d["mobile"]}`)
      await update(dbRef, {userType: 'Winner'})
      console.log("updated user type")
    }))
    await set(winnersDbRef, winners)
    alert("Winner List declared. Refresh to view results!")
  } catch (e) {
    console.log(e)
    alert("Failed to compute winners")
  }
}
window.computeWinningList = computeWinningList


/**
 * Display List
 */

async function getWeeklyWinners() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get('week')
  if (!id) return

  const snapshot = await get(ref(db, `${GAME_ID}/winners/week${id}`))
  return snapshot.val()
}

/**
 * Onload Events
 */

window.onload = async() => {
  try {
    computeDates()
    const data = await getWeeklyWinners()
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

function computeDates() {
  const params = new URLSearchParams(document.location.search);
  let numberOfWeeks = 1
  try {
    numberOfWeeks = parseInt(params.get('week'))
  } catch (e) { console.log(e) }
  let sdays = 0 + 7 * (numberOfWeeks - 1)
  let eDays = 6 + 7 * (numberOfWeeks - 1)

  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const sd = new Date(START_DATE.getTime() + sdays * millisecondsInDay);
  const ed = new Date(START_DATE.getTime() + eDays * millisecondsInDay);

  weekId.innerHTML = `Week ` + numberOfWeeks
  startDate.innerHTML = `Start Date: ` + sd.toUTCString().slice(5,16)
  endDate.innerHTML = `Start Date: ` + ed.toUTCString().slice(5,16)
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
  downloadBtn.setAttribute("download", "winners.csv");

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
