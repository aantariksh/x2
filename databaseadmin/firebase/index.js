// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

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
const auth = getAuth();
window.auth = auth

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const formProps = new FormData(event.target);
    const formData = Object.fromEntries(formProps);
    signInWithEmailAndPassword(auth, formData.email, formData.password)
      .then(() => (location.href = "/databaseadmin/index.html"))
      .catch(() => failMessage());
  });
}

window.logOut = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  const index = "/databaseadmin/index";
  const users = "/databaseadmin/users";
  const currentPage = location.pathname;

  if (user) {
    if (user.uid != "iGZqcy0IAzevZrVhAAbct8WZ4xK2" && user.uid != "VPpk8oj6L9ZKgoxlv1XohQn1v8u2") signOut(auth);
    if (currentPage.startsWith(index)) {
      location.pathname = users + ".html";
    }
  } else {
    if (!currentPage.startsWith(index)) {
      location.pathname = index + ".html";
    }
  }
});

export function failMessage() {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: "Login Failed",
  }).then(() => location.reload());
}

// Load Navbar from dedicated HTML file
if (!window.location.pathname.split('/').includes('index')) {
  fetch('navbar.html')
    .then(res => res.text())
    .then(text => {
        let container = document.getElementById('navbarPlaceholder');
        container.insertAdjacentHTML( 'beforeBegin', text );
        identifyCurrentPage()
    })
}

// Current Page
function identifyCurrentPage() {
  const pageName = window.location.pathname.split('/').pop();
  var elements = document.querySelectorAll(`a[href="${pageName}"]`);
  if (elements && elements.length) {
    elements[0].classList.add('active');
  }
}

// Download functions
function downloadCSV(downloadName='data') {
  const table = document.querySelector('.table');
  if (!table) {
      console.error("Table element not found.");
      return;
  }  

  var rows = table.querySelectorAll('tr');
  var csvContent = "";
  
  rows.forEach(function(row) {
      var rowData = [];
      row.querySelectorAll('td, th').forEach(function(cell) {
          rowData.push(cell.textContent.trim());
      });
      csvContent += rowData.join(',') + "\r\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", blobUrl);
  link.setAttribute("download", downloadName + ".csv");

  link.click();

  URL.revokeObjectURL(blobUrl);
}
window.downloadCSV = downloadCSV
