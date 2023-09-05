import {} from "./index.js";
import {
  getDatabase, get, ref
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const db = getDatabase();

const START_DATE = new Date("2023-09-01");

async function main() {
  const dbRef = ref(db, `bikeRace/users/`)
  const snapshot = await get(dbRef);
  const users = snapshot.val();
  const usersData = Object.keys(users)
    .filter(mobile => users[mobile]?.joinDate)
    .map(mobile => new Date(users[mobile]?.joinDate))
    .filter(date => date >= START_DATE)
    .sort((a, b) => a-b);

  function computeWeek(currentDate = new Date()) {
    try {
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round(Math.abs((START_DATE - currentDate) / oneDay));
      return Math.floor(diffDays / 7) + 1;
    } catch {
      return 1
    }
  }

  // Aggregate data for daily counts
  const dailyCounts = {};

  usersData.forEach(date => {
    const joinDate = date.toLocaleDateString();
    dailyCounts[joinDate] = (dailyCounts[joinDate] || 0) + 1;
  });

  console.log(dailyCounts)

  // Chart.js configuration
  const ct = document.getElementById('dailyChart').getContext('2d');
  new Chart(ct, {
    type: 'bar', // Use 'bar' for bar chart
    data: {
      labels: Object.keys(dailyCounts),
      datasets: [{
        label: 'Weekly User Counts',
        data: Object.values(dailyCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Set colors as needed
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: true // Change to false for line chart without fill
      }]
    },
    options: {
      // Chart options here
    }
  });

  // Display data in a graph (using a library like Chart.js)
  // For aggregation by week, create a new object with week as key and sum of counts as value
  const weeklyCounts = {};
  usersData.forEach(date => {
    const weekNumber = computeWeek(new Date(date));
    weeklyCounts[weekNumber] = (weeklyCounts[weekNumber] || 0) + 1;
  });

  console.log(weeklyCounts)

  // Chart.js configuration
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  const userChart = new Chart(ctx, {
    type: 'bar', // Use 'bar' for bar chart
    data: {
      labels: Object.keys(weeklyCounts),
      datasets: [{
        label: 'Weekly User Counts',
        data: Object.values(weeklyCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Set colors as needed
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: true // Change to false for line chart without fill
      }]
    },
    options: {
      // Chart options here
    }
  });
}

window.onload = function () {
  main()
}