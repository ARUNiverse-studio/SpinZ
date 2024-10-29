let isDragging = false;
let startX = 0;
let currentImageIndex = 0;
let totalImages = 0;
let imageElements = [];
let canvas, ctx;
let dragSpeed = 200;

document.getElementById('generateButton').addEventListener('click', generate360View);
document.getElementById('exportButton').addEventListener('click', exportHTMLFile);
document.getElementById('startAgainButton').addEventListener('click', startAgain);

async function generate360View() {
  const files = document.getElementById('imageUpload').files;

  if (files.length === 0) {
    alert("Please upload images to generate the 360° view.");
    return;
  }

  if (files.length > 80) {
    alert("Please upload no more than 80 images.");
    return;
  }

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  imageElements = [];
  currentImageIndex = 0;
  totalImages = files.length;

  try {
    imageElements = await loadImages(files);
    init360Viewer();
  } catch (error) {
    alert("An error occurred while loading the images.");
    console.error("Detailed error information: ", error);
  }
}

async function loadImages(files) {
  const promises = [];

  for (let i = 0; i < files.length; i++) {
    promises.push(new Promise((resolve, reject) => {
      const file = files[i];

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          resolve(img);
        };
        img.onerror = (err) => {
          reject(new Error(`Failed to load image ${i + 1} (File: ${file.name})`));
        };
      };
      reader.onerror = (err) => {
        reject(new Error(`Failed to read file ${i + 1} (File: ${file.name})`));
      };
      reader.readAsDataURL(file);
    }));
  }

  return Promise.all(promises);
}

function init360Viewer() {
  if (imageElements.length === 0) {
    alert("No images available to display.");
    return;
  }

  const canvasWidth = Math.min(window.innerWidth * 0.9, 800); 
  const canvasHeight = Math.min(window.innerHeight * 0.9, 600); // Responsive to height

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';
  document.getElementById('startAgainButton').style.display = 'block';

  // Draw the first image while maintaining the aspect ratio
  drawImageWithAspectRatio(imageElements[0]);

  // Add event listeners for dragging
  canvas.addEventListener('mousedown', startDragging);
  canvas.addEventListener('mousemove', onDragging);
  canvas.addEventListener('mouseup', stopDragging);
  canvas.addEventListener('mouseleave', stopDragging);
}

function drawImageWithAspectRatio(img) {
  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = img.width / img.height;

  let renderWidth, renderHeight;

  // Determine whether to scale by width or height based on the aspect ratio
  if (canvasRatio > imageRatio) {
    // Fit by height
    renderHeight = canvas.height;
    renderWidth = renderHeight * imageRatio;
  } else {
    // Fit by width
    renderWidth = canvas.width;
    renderHeight = renderWidth / imageRatio;
  }

  const xOffset = (canvas.width - renderWidth) / 2;
  const yOffset = (canvas.height - renderHeight) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas
  ctx.drawImage(img, xOffset, yOffset, renderWidth, renderHeight);  // Draw the image
}

function onDragging(e) {
  e.preventDefault();
  if (!isDragging) return;

  const currentX = e.clientX;
  const deltaX = currentX - startX;

  if (Math.abs(deltaX) > dragSpeed / totalImages) {
    const direction = deltaX > 0 ? -1 : 1;
    startX = currentX;

    currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;

    drawImageWithAspectRatio(imageElements[currentImageIndex]);
  }
}

function startDragging(e) {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX;
}

function stopDragging() {
  isDragging = false;
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
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #121212;
          color: white;
        }
        canvas {
          width: 100%;
          height: auto;
          border-radius: 10px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
          background-color: #262626;
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
          const canvasWidth = Math.min(window.innerWidth * 0.9, 800); 
          const canvasHeight = Math.min(window.innerHeight * 0.9, 600);

          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          // Display the first image
          drawImageWithAspectRatio(imageElements[0]);

          canvas.addEventListener('mousedown', startDragging);
          canvas.addEventListener('mousemove', onDragging);
          canvas.addEventListener('mouseup', stopDragging);
        }

        function drawImageWithAspectRatio(img) {
          const canvasRatio = canvas.width / canvas.height;
          const imageRatio = img.width / img.height;

          let renderWidth, renderHeight;

          if (canvasRatio > imageRatio) {
            renderHeight = canvas.height;
            renderWidth = renderHeight * imageRatio;
          } else {
            renderWidth = canvas.width;
            renderHeight = renderWidth / imageRatio;
          }

          const xOffset = (canvas.width - renderWidth) / 2;
          const yOffset = (canvas.height - renderHeight) / 2;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, xOffset, yOffset, renderWidth, renderHeight);
        }

        function startDragging(e) {
          e.preventDefault();
          isDragging = true;
          startX = e.clientX;
        }

        function onDragging(e) {
          e.preventDefault();
          if (!isDragging) return;

          const currentX = e.clientX;
          const deltaX = currentX - startX;

          if (Math.abs(deltaX) > dragSpeed / totalImages) {
            const direction = deltaX > 0 ? -1 : 1;
            startX = currentX;

            currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;

            drawImageWithAspectRatio(imageElements[currentImageIndex]);
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
