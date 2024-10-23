let isDragging = false;
let startX = 0;
let currentImageIndex = 0;
let totalImages = 0;
let imageElements = [];
let canvas, ctx;
let animationFrameId;

document.getElementById('generateButton').addEventListener('click', generate360View);
document.getElementById('exportButton').addEventListener('click', exportHTMLFile);
document.getElementById('startAgainButton').addEventListener('click', startAgain);

function generate360View() {
  const files = document.getElementById('imageUpload').files;
  if (files.length === 0) {
    alert("Please upload images to generate the 360° view.");
    return;
  }

  // Show loading spinner
  document.getElementById('loadingSpinner').style.display = 'block';

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  imageElements = [];
  currentImageIndex = 0;
  totalImages = files.length;

  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        imageElements.push(img);
        if (imageElements.length === totalImages) {
          init360Viewer();
          // Hide loading spinner
          document.getElementById('loadingSpinner').style.display = 'none';
        }
      };
    };
    reader.readAsDataURL(files[i]);
  }
}

function init360Viewer() {
  const canvasWidth = 500; // Set your desired canvas width
  const canvasHeight = (imageElements[0].height / imageElements[0].width) * canvasWidth;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';
  document.getElementById('startAgainButton').style.display = 'block';

  ctx.drawImage(imageElements[0], 0, 0, canvas.width, canvas.height);

  canvas.addEventListener('mousedown', startDragging);
  canvas.addEventListener('mousemove', debounce(onDragging, 16)); // Debounce to throttle
  canvas.addEventListener('mouseup', stopDragging);
  canvas.addEventListener('mouseleave', stopDragging);
  canvas.addEventListener('touchstart', startDragging);
  canvas.addEventListener('touchmove', debounce(onDragging, 16));
  canvas.addEventListener('touchend', stopDragging);
}

function startDragging(e) {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX || e.touches[0].clientX;
}

function onDragging(e) {
  e.preventDefault();
  if (!isDragging) return;

  const currentX = e.clientX || e.touches[0].clientX;
  const deltaX = currentX - startX;

  if (Math.abs(deltaX) > 20) {
    const direction = deltaX > 0 ? -1 : 1;
    startX = currentX;

    currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    animationFrameId = requestAnimationFrame(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = imageElements[currentImageIndex];
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    });
  }
}

function stopDragging() {
  isDragging = false;
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
