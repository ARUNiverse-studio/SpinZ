let isDragging = false;
let startX = 0;
let currentImageIndex = 0;
let totalImages = 0;
let imageElements = [];
let canvas, ctx;
let dragSpeed = 200; // Higher value means slower drag speed for smooth rotation

document.getElementById('generateButton').addEventListener('click', generate360View);
document.getElementById('exportButton').addEventListener('click', exportHTMLFile);
document.getElementById('startAgainButton').addEventListener('click', startAgain);
document.getElementById('exportGifButton').addEventListener('click', exportGif);

function generate360View() {
  const files = document.getElementById('imageUpload').files;
  if (files.length === 0) {
    alert("Please upload images to generate the 360° view.");
    return;
  }

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d', { willReadFrequently: true }); // Added willReadFrequently here
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
          console.log("All images loaded.");
          init360Viewer();
        }
      };
    };
    reader.readAsDataURL(files[i]); // Convert image to Base64
  }
}


function init360Viewer() {
  const canvasWidth = 800; // Set your desired canvas width
  const canvasHeight = (imageElements[0].height / imageElements[0].width) * canvasWidth; // Maintain aspect ratio

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';
  document.getElementById('startAgainButton').style.display = 'block';
  document.getElementById('exportGifButton').style.display = 'block'; // Show the Export GIF button

  // Display the first image with scaling to fit the canvas
  ctx.drawImage(imageElements[0], 0, 0, canvas.width, canvas.height);

  // Add event listeners for dragging
  canvas.addEventListener('mousedown', startDragging);
  canvas.addEventListener('mousemove', onDragging);
  canvas.addEventListener('mouseup', stopDragging);
  canvas.addEventListener('mouseleave', stopDragging); // Stop dragging if the mouse leaves the canvas
  canvas.addEventListener('touchstart', startDragging);
  canvas.addEventListener('touchmove', onDragging);
  canvas.addEventListener('touchend', stopDragging);
}

function startDragging(e) {
  e.preventDefault(); // Prevent default touch behavior (scrolling)
  isDragging = true;
  startX = e.clientX || e.touches[0].clientX;
}

function onDragging(e) {
  e.preventDefault(); // Prevent default touch behavior (scrolling)
  if (!isDragging) return;

  const currentX = e.clientX || e.touches[0].clientX;
  const deltaX = currentX - startX;

  if (Math.abs(deltaX) > dragSpeed / totalImages) {
    const direction = deltaX > 0 ? -1 : 1; // Negative for left, positive for right
    startX = currentX;

    currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = imageElements[currentImageIndex];
    const canvasWidth = canvas.width;
    const canvasHeight = (img.height / img.width) * canvasWidth; // Maintain aspect ratio
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  }
}

function stopDragging() {
  isDragging = false;
}

function startAgain() {
  // Reset uploaded images
  imageElements = [];
  currentImageIndex = 0;
  totalImages = 0;

  // Hide the viewer container and export buttons
  document.getElementById('viewerContainer').style.display = 'none';
  document.getElementById('exportButton').style.display = 'none';
  document.getElementById('startAgainButton').style.display = 'none';
  document.getElementById('exportGifButton').style.display = 'none';

  // Clear the file input
  document.getElementById('imageUpload').value = '';

  // Clear the canvas
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  alert("All images have been cleared.");
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

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '360_viewer.html'; 
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Export GIF using gif.js
function exportGif() {
  console.log("Starting GIF export...");

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height
  });

  // Add each image frame to the GIF
  imageElements.forEach((img, index) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing new image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw image on canvas
    gif.addFrame(ctx, {copy: true, delay: 100}); // Add the frame to the GIF (100ms delay per frame)
    console.log("Added frame " + (index + 1));
  });

  gif.on('finished', function(blob) {
  console.log("GIF rendering finished.");
  if (!blob) {
    console.error("Blob is empty.");
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '360_view.gif'; // Name of the GIF file
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  console.log("GIF downloaded.");
});

  gif.render(); // Start generating the GIF
  console.log("GIF rendering started...");
}
