```javascript
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

async function generate360View() {
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
    try {
      // Compress the image
      const compressedFile = await imageCompression(files[i], {
        maxSizeMB: 0.2,  // Set maximum size to 200KB
        maxWidthOrHeight: 800,  // Set maximum dimensions
        useWebWorker: true
      });

      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          imageElements.push(img);
          if (imageElements.length === totalImages) {
            init360Viewer();
            document.getElementById('loadingSpinner').style.display = 'none';
          }
        };
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error while compressing images: ", error);
    }
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

function startAgain() {
  imageElements = [];
  currentImageIndex = 0;
  totalImages = 0;

  document.getElementById('viewerContainer').style.display = 'none';
  document.getElementById('exportButton').style.display = 'none';
  document.getElementById('startAgainButton').style.display = 'none';

  document.getElementById('imageUpload').value = '';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  alert("All images have been cleared.");
}

function exportHTMLFile() {
  let base64Images = imageElements.map(img => img.src);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>360° Image Viewer</title>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        let imageSrcs = ${JSON.stringify(base64Images)};
        // Similar logic as implemented above for generating the viewer
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '360_viewer.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```
}
