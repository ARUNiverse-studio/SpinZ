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

  console.log(`Total images to load: ${totalImages}`);

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

      // Check if the file is a HEIC image
      if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
        heic2any({
          blob: file,
          toType: 'image/jpeg'
        }).then((convertedBlob) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
              console.log(`HEIC image ${i + 1} converted and loaded successfully.`);
              resolve(img);
            };
            img.onerror = (err) => {
              console.error(`Error loading converted HEIC image ${i + 1}:`, err);
              reject(new Error(`Failed to load converted HEIC image ${i + 1}`));
            };
          };
          reader.onerror = (err) => {
            console.error(`Error reading converted HEIC file ${i + 1}:`, err);
            reject(new Error(`Failed to read converted HEIC file ${i + 1}`));
          };
          reader.readAsDataURL(convertedBlob);
        }).catch((err) => {
          console.error(`Error converting HEIC file ${i + 1}:`, err);
          reject(new Error(`Failed to convert HEIC file ${i + 1}`));
        });
      } else {
        // Handle non-HEIC images
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target.result;
          img.onload = () => {
            console.log(`Image ${i + 1} loaded successfully.`);
            resolve(img);
          };
          img.onerror = (err) => {
            console.error(`Error loading image ${i + 1}:`, err);
            reject(new Error(`Failed to load image ${i + 1} (File: ${file.name})`));
          };
        };
        reader.onerror = (err) => {
          console.error(`Error reading file ${i + 1}:`, err);
          reject(new Error(`Failed to read file ${i + 1} (File: ${file.name})`));
        };
        reader.readAsDataURL(file);
      }
    }));
  }

  return Promise.all(promises);
}

function init360Viewer() {
  if (imageElements.length === 0) {
    alert("No images available to display.");
    return;
  }

  const canvasWidth = Math.min(window.innerWidth * 0.9, 800); // Responsive width
  const canvasHeight = (imageElements[0].height / imageElements[0].width) * canvasWidth;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';
  document.getElementById('startAgainButton').style.display = 'block';

  // Display the first image with scaling to fit the canvas
  ctx.drawImage(imageElements[0], 0, 0, canvas.width, canvas.height);

  // Add event listeners for dragging
  canvas.addEventListener('mousedown', startDragging);
  canvas.addEventListener('mousemove', onDragging);
  canvas.addEventListener('mouseup', stopDragging);
  canvas.addEventListener('mouseleave', stopDragging);
  canvas.addEventListener('touchstart', startDragging);
  canvas.addEventListener('touchmove', onDragging);
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

  if (Math.abs(deltaX) > dragSpeed / totalImages) {
    const direction = deltaX > 0 ? -1 : 1; // Negative for left, positive for right
    startX = currentX;

    currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = imageElements[currentImageIndex];
    const canvasWidth = canvas.width;
    const canvasHeight = (img.height / img.width) * canvasWidth;
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  }
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
