// Layout Adjust
const IMG_WIDTH = 1080, IMG_HEIGHT = 1920;
const imageAspectRatio = IMG_WIDTH / IMG_HEIGHT;

function getAdjustedBackgroundImageWidth() {
  const containerHeight = backgroundContainer.clientHeight;
  const adjustedWidth = containerHeight * imageAspectRatio;
  return adjustedWidth;
}

function adjustLayout() {
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
  if (!profile && !isAuthPage) { location.href = "auth.html" }
})

function getLoggedInUser() {
  const profile = JSON.parse(localStorage.getItem("profile"))
  if (!profile) location.reload()
  return profile.mobile
}

// Logout user
function logOut() { localStorage.removeItem("profile"); location.reload(); }

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

function isDateAtLeast18YearsBack(givenDate) {
  const currentDate = new Date();
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(currentDate.getFullYear() - 18);

  const parsedDate = new Date(givenDate);
  return parsedDate <= eighteenYearsAgo;
}

const registration = document.getElementById("registration")
async function register() {
  const formData = new FormData(registration);
  const values = Object.fromEntries(formData.entries());
  const { name, mobile, dob, pincode } = values

  if (!isDateAtLeast18YearsBack(dob)) {
    alert("Must be 18+ to participate. Sorry!"); return
  }

  if (!isValidMobileNumber(mobile)) {
    alert("Please enter a valid mobile number"); return
  }
  const city = pincodes[pincode];
  if (pincodes && Object.keys(pincodes).length && !city) {
    alert("Please enter a valid pincode"); return
  }

  const urlParams = new URLSearchParams(window.location.search);
  const referredBy = urlParams.get('code') || '';

  const referralCode = generateShortUniqueCode()
  const userType = "User"

  const profile = {
    name, mobile, pincode, city, referredBy, referralCode, userType
  }

  localStorage.setItem("profile", JSON.stringify(profile));
  await addProfile(profile)
  location.href = "index.html"
}
