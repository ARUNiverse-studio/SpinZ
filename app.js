let isDragging = false;
let startX = 0;
let currentImageIndex = 0;
let totalImages = 0;
let imageElements = [];
let canvas, ctx;
let dragSpeed = 200; // Higher value means slower drag speed for smooth rotation

document.getElementById('generateButton').addEventListener('click', generate360View);
document.getElementById('exportButton').addEventListener('click', exportHTMLFile);

function generate360View() {
  const files = document.getElementById('imageUpload').files;
  if (files.length === 0) {
    alert("Please upload images to generate the 360° view.");
    return;
  }

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  imageElements = [];
  currentImageIndex = 0;
  totalImages = files.length;

  // Load and store images
  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result; // Base64 encoded image
      img.onload = () => {
        imageElements.push(img);
        if (imageElements.length === totalImages) {
          init360Viewer();
        }
      };
    };
    reader.readAsDataURL(files[i]); // Convert image to Base64
  }
}

function init360Viewer() {
  canvas.width = imageElements[0].width;
  canvas.height = imageElements[0].height;
  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';

  // Display the first image
  ctx.drawImage(imageElements[0], 0, 0);

  // Add event listeners for dragging
  canvas.addEventListener('mousedown', startDragging);
  canvas.addEventListener('mousemove', onDragging);
  canvas.addEventListener('mouseup', stopDragging);
  canvas.addEventListener('touchstart', startDragging);
  canvas.addEventListener('touchmove', onDragging);
  canvas.addEventListener('touchend', stopDragging);
}

function startDragging(e) {
  isDragging = true;
  startX = e.clientX || e.touches[0].clientX;
}

function onDragging(e) {
  if (!isDragging) return;
  const currentX = e.clientX || e.touches[0].clientX;
  const deltaX = currentX - startX;

  // Adjust sensitivity for smooth rotation
  if (Math.abs(deltaX) > dragSpeed / totalImages) {
    const direction = deltaX > 0 ? -1 : 1; // Negative for left, positive for right
    startX = currentX;

    // Move to the next/previous image smoothly
    currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;

    // Clear the canvas and draw the current image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElements[currentImageIndex], 0, 0);
  }
}

function stopDragging() {
  isDragging = false;
}

// Export HTML file with embedded images in Base64
function exportHTMLFile() {
  let base64Images = imageElements.map(img => img.src); // Get Base64 encoded image sources

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>360° Image Viewer</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f4f4f9;
        }
        canvas {
          width: 80%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        let isDragging = false;
        let startX = 0;
        let currentImageIndex = 0;
        let totalImages = ${totalImages};
        let imageElements = [];
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let dragSpeed = 200;

        // Load and store images
        const imageSrcs = ${JSON.stringify(base64Images)};
        imageSrcs.forEach(src => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            imageElements.push(img);
            if (imageElements.length === totalImages) {
              initViewer();
            }
          };
        });

        function initViewer() {
          canvas.width = imageElements[0].width;
          canvas.height = imageElements[0].height;
          ctx.drawImage(imageElements[0], 0, 0);

          canvas.addEventListener('mousedown', startDragging);
          canvas.addEventListener('mousemove', onDragging);
          canvas.addEventListener('mouseup', stopDragging);
        }

        function startDragging(e) {
          isDragging = true;
          startX = e.clientX;
        }

        function onDragging(e) {
          if (!isDragging) return;
          const currentX = e.clientX;
          const deltaX = currentX - startX;

          if (Math.abs(deltaX) > dragSpeed / totalImages) {
            const direction = deltaX > 0 ? -1 : 1;
            startX = currentX;

            currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imageElements[currentImageIndex], 0, 0);
          }
        }

        function stopDragging() {
          isDragging = false;
        }
      </script>
    </body>
    </html>
  `;

  // Create a blob for the HTML content and trigger a download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '360_viewer.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
