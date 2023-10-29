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

// Call the function initially and add a resize event listener to recalculate the layout on window resize
adjustLayout();
window.addEventListener('resize', adjustLayout);