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

const registration = document.getElementById("registration")
async function register() {
  const formData = new FormData(registration);
  const values = Object.fromEntries(formData.entries());
  const { name, mobile, pincode } = values
  if (!isValidMobileNumber(mobile)) {
    alert("Please enter a valid mobile number"); return
  }
  const city = pincodes[pincode];
  if (!city) {
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
