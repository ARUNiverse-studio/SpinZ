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
document.getElementById('exportButton').addEventListener('click', export360ViewerHTML);
document.getElementById('startAgainButton').innerText = 'Clear';
document.getElementById('startAgainButton').addEventListener('click', startAgain);
document.getElementById('copyEmbedButton').addEventListener('click', copyEmbedCode);

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

    try {
        console.log("Uploaded files:", files);

        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        imageElements = [];
        currentImageIndex = 0;
        totalImages = files.length;

        document.getElementById('placeholder').style.display = 'none';
        canvas.style.display = 'block';
        document.getElementById('generateButton').style.display = 'none';

        imageElements = await loadImages(files);
        console.log("Images loaded successfully:", imageElements);

        init360Viewer();
    } catch (error) {
        alert("Error occurred while generating the 360° view.");
        console.error("Error details:", error);
    }
}

async function loadImages(files) {
    const promises = [];
    for (let i = 0; i < files.length; i++) {
        promises.push(new Promise((resolve, reject) => {
            const file = files[i];
            console.log("Processing file:", file.name);

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    console.log(`Image ${i + 1} loaded successfully.`);
                    resolve(img);
                };
                img.onerror = () => {
                    console.error(`Error loading image ${i + 1}: ${file.name}`);
                    reject(new Error(`Failed to load image ${i + 1}`));
                };
            };
            reader.onerror = () => {
                console.error(`Error reading file ${i + 1}: ${file.name}`);
                reject(new Error(`Failed to read file ${i + 1}`));
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
    document.getElementById('copyEmbedButton').style.display = 'block';

    canvas.width = fixedCanvasWidth;
    canvas.height = fixedCanvasHeight;

    drawImageWithAspectRatio(imageElements[0]);
    console.log("360° Viewer initialized successfully!");

    canvas.addEventListener('mousedown', startDragging);
    canvas.addEventListener('mousemove', onDragging);
    canvas.addEventListener('mouseup', stopDragging);
    canvas.addEventListener('mouseleave', stopDragging);

    alert("360° Viewer generated successfully!");
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
    document.getElementById('copyEmbedButton').style.display = 'none';
    document.getElementById('generateButton').style.display = 'block';

    document.getElementById('imageUpload').value = '';

    canvas.width = fixedCanvasWidth;
    canvas.height = fixedCanvasHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function export360ViewerHTML() {
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

function copyEmbedCode() {
    const embedCode = `
<iframe src="your_generated_viewer_url_here" width="600" height="400" frameborder="0"></iframe>
  `;
    navigator.clipboard.writeText(embedCode).then(() => {
        alert('Embed code copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy embed code.');
        console.error(err);
    });
}
