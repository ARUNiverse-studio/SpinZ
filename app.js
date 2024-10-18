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
document.getElementById('getEmbedCodeButton').addEventListener('click', getEmbedCode);

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
  const canvasWidth = 800; // Set your desired canvas width
  const canvasHeight = (imageElements[0].height / imageElements[0].width) * canvasWidth; // Maintain aspect ratio

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';
  document.getElementById('startAgainButton').style.display = 'block';
  document.getElementById('getEmbedCodeButton').style.display = 'block';

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
    const direction = deltaX > 0 ? -1 : 1;
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
  document.getElementById('getEmbedCodeButton').style.display = 'none';

  document.getElementById('imageUpload').value = '';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
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

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '360_viewer.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function getEmbedCode() {
  if (imageElements.length === 0) {
    alert("Please generate a 360° view first.");
    return;
  }

  const embedCode = generateEmbedCode();
  
  // Create a modal to display the embed code
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#fff';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '5px';
  modalContent.style.maxWidth = '80%';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '10px';
  closeButton.addEventListener('click', () => document.body.removeChild(modal));

  const embedTextarea = document.createElement('textarea');
  embedTextarea.value = embedCode;
  embedTextarea.style.width = '100%';
  embedTextarea.style.height = '200px';
  embedTextarea.style.marginBottom = '10px';

  modalContent.appendChild(embedTextarea);
  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);

  document.body.appendChild(modal);
}

function generateEmbedCode() {
  const base64Images = imageElements.map(img => img.src);
  const embedCode = `
<div id="spiZ360Viewer" style="width:100%;max-width:800px;margin:0 auto;">
  <canvas id="spiZ360Canvas"></canvas>
</div>
<script>
  (function() {
    const images = ${JSON.stringify(base64Images)};
    let currentIndex = 0;
    const canvas = document.getElementById('spiZ360Canvas');
    const ctx = canvas.getContext('2d');
    let isDragging = false;
    let startX;

    function loadImages() {
      const imageElements = images.map(src => {
        const img = new Image();
        img.src = src;
        return img;
      });

      imageElements[0].onload = () => {
        canvas.width = imageElements[0].width;
        canvas.height = imageElements[0].height;
        ctx.drawImage(imageElements[0], 0, 0);
      };

      return imageElements;
    }

    const imageElements = loadImages();

    canvas.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
    });

    canvas.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 5) {
        currentIndex = (currentIndex + (deltaX > 0 ? 1 : -1) + imageElements.length) % imageElements.length;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageElements[currentIndex], 0, 0);
        startX = e.clientX;
      }
    });

    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => isDragging = false);
  })();
</script>
`;

  return embedCode;
}
