// Layout Adjust
const IMG_WIDTH = 1080, IMG_HEIGHT = 1920;
const imageAspectRatio = IMG_WIDTH / IMG_HEIGHT;

function getAdjustedBackgroundImageWidth() {
  const containerHeight = backgroundContainer.clientHeight;
  const adjustedWidth = containerHeight * imageAspectRatio;
  return adjustedWidth;
}

function adjustLayout() {
  const currentPage = location.pathname;
  const isGamePage = currentPage.includes('game')
  if (isGamePage) return

  const backgroundContainer = document.getElementById('backgroundContainer');
  const contentContainer = document.getElementById('contentContainer');
  const screenWidth = window.innerWidth;

  // Check if the screen width is less than or equal to the mobile breakpoint (e.g., 768px)
  if (screenWidth <= 450) {
    // Mobile view: Set background size to cover and content container width to screen width
    backgroundContainer.style.backgroundSize = 'cover';
    contentContainer.style.width = `${screenWidth}px`;
  } else {
    // Desktop view: Set background size to contain, height to 100vh, and content container width to image width
    backgroundContainer.style.backgroundSize = `contain`;
    const adjustedWidth = getAdjustedBackgroundImageWidth();
    contentContainer.style.width = `${adjustedWidth}px`;
  }
}

let pincodes = {}
// Fetch Pincodes JSON
fetch('./assets/pincodes.json')
  .then(response => response.json())
  .then(data => {
    // Use the JSON data here
    pincodes = data;
  })
  .catch(error => {
    // Handle errors if the fetch fails
    console.error('Error fetching JSON:', error);
  });


// Call the function initially and add a resize event listener to recalculate the layout on window resize
adjustLayout();
window.addEventListener('resize', adjustLayout);


// Check Login Status 
window.addEventListener('load', async () => {
  const currentPage = location.pathname;
  const isAuthPage = currentPage.includes('auth')
  const profile = localStorage.getItem("profile");
  if (!profile && !isAuthPage) { 
    const loc = currentPage.includes('game') ? "../auth.html" : "auth.html"
    location.href = loc
  }
})

function getLoggedInUser() {
  const profile = JSON.parse(localStorage.getItem("profile"))
  if (!profile) location.href = "auth.html"
  return profile.mobile
}

// Logout user
function logOut() { localStorage.removeItem("profile"); location.href = "auth.html"; }

/**
 * Registration process
 */ 
function isValidMobileNumber(input) {
  // Remove any non-digit characters from the input
  const cleanedInput = input.replace(/\D/g, '');
  // Check if the cleaned input has exactly 10 digits and starts with 7, 8, or 9
  const isValid = /^\d{10}$/.test(cleanedInput) && /^[789]/.test(cleanedInput);
  return isValid;
}

function generateShortUniqueCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }

  const timestamp = Date.now().toString(36);
  code += timestamp;

  return code;
}

// Remember that the month is 0-based so February is actually 1...
function isValidDate(year, month, day) {
  var d = new Date(year, month, day);
  if (d.getFullYear() == year && d.getMonth() == month && d.getDate() == day) {
      return true;
  }
  return false;
}

function isDateAtLeast18YearsBack(parsedDate) {
  const currentDate = new Date();
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(currentDate.getFullYear() - 18);

  return parsedDate <= eighteenYearsAgo;
}

const registration = document.getElementById("registration")
async function register() {
  const formData = new FormData(registration);
  const values = Object.fromEntries(formData.entries());
  const { name: raw_name, mobile, date, month, year, pincode } = values
  const name = raw_name.replace(/[^a-zA-Z\s.]/g, "");

  if (!isValidMobileNumber(mobile)) {
    alert("Please enter a valid mobile number"); return
  }

  if (!isValidDate(year, month-1, date)) {
    alert("Please select a valid date"); return
  }
  const dob = new Date(year, month-1, date)
  if (!isDateAtLeast18YearsBack(dob)) {
    alert("Must be 18+ to participate. Sorry!"); return
  }

  const city = pincodes[pincode];
  if (pincodes && Object.keys(pincodes).length && !city) {
    alert("Please enter a valid pincode"); return
  }

  const urlParams = new URLSearchParams(window.location.search);
  const referredBy = urlParams.get('referralcode') || '';
  if (referredBy) {
    // await addBonus(referredBy)
  }

  const referralCode = generateShortUniqueCode()
  const userType = "User"

  const d = new Date()
  const joinDate = d.toISOString().split("T")[0]

  const profile = {
    name, mobile, pincode, city, referredBy, referralCode, userType, joinDate
  }

  localStorage.setItem("profile", JSON.stringify(profile));
  await addProfile(profile)
  location.href = "index.html"
}
