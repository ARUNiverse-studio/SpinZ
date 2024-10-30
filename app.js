let isDragging = false;
let startX = 0;
let currentImageIndex = 0;
let totalImages = 0;
let imageElements = [];
let canvas, ctx;
let dragSpeed = 200;

const fixedCanvasHeight = 400;
const fixedCanvasWidth = 600;

document.getElementById('generateButton').addEventListener('click', generate360View);
document.getElementById('exportButton').addEventListener('click', exportHDImage);
document.getElementById('startAgainButton').innerText = 'Clear';
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

  document.getElementById('placeholder').style.display = 'none';
  canvas.style.display = 'block';

  document.getElementById('generateButton').style.display = 'none';

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

  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';
  document.getElementById('startAgainButton').style.display = 'block';

  canvas.width = fixedCanvasWidth;
  canvas.height = fixedCanvasHeight;

  drawImageWithAspectRatio(imageElements[0]);

  canvas.addEventListener('mousedown', startDragging);
  canvas.addEventListener('mousemove', onDragging);
  canvas.addEventListener('mouseup', stopDragging);
  canvas.addEventListener('mouseleave', stopDragging);
}

function drawImageWithAspectRatio(img) {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imageWidth = img.width;
  const imageHeight = img.height;

  const canvasAspectRatio = canvasWidth / canvasHeight;
  const imageAspectRatio = imageWidth / imageHeight;

  let renderWidth, renderHeight;

  if (canvasAspectRatio > imageAspectRatio) {
    renderHeight = canvasHeight;
    renderWidth = renderHeight * imageAspectRatio;
  } else {
    renderWidth = canvasWidth;
    renderHeight = renderWidth / imageAspectRatio;
  }

  const xOffset = (canvasWidth - renderWidth) / 2;
  const yOffset = (canvasHeight - renderHeight) / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, 0, 0, img.width, img.height, xOffset, yOffset, renderWidth, renderHeight);
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
  document.getElementById('generateButton').style.display = 'block';

  document.getElementById('imageUpload').value = '';

  canvas.width = fixedCanvasWidth;
  canvas.height = fixedCanvasHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function exportHDImage() {
  const currentImage = imageElements[currentImageIndex];
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = currentImage.width;
  exportCanvas.height = currentImage.height;

  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.drawImage(currentImage, 0, 0);

  exportCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '360_view_image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, 'image/png', 1.0);  // High-quality PNG export
}
