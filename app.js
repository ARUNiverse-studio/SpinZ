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
document.getElementById('getEmbedButton').addEventListener('click', generateEmbedCode);
document.getElementById('copyEmbedButton').addEventListener('click', copyEmbedCode);

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

  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        imageElements.push(img);
        if (imageElements.length === totalImages) {
          init360Viewer();
        }
      };
    };
    reader.readAsDataURL(files[i]);
  }
}

function init360Viewer() {
  const canvasWidth = 800;
  const canvasHeight = (imageElements[0].height / imageElements[0].width) * canvasWidth;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  document.getElementById('viewerContainer').style.display = 'block';
  document.getElementById('exportButton').style.display = 'block';
  document.getElementById('startAgainButton').style.display = 'block';
  document.getElementById('getEmbedButton').style.display = 'block';

  ctx.drawImage(imageElements[0], 0, 0, canvas.width, canvas.height);
  
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
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
  document.getElementById('getEmbedButton').style.display = 'none';
  document.getElementById('embedCodeTextarea').style.display = 'none';
  document.getElementById('copyEmbedButton').style.display = 'none';

  document.getElementById('imageUpload').value = '';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  alert("All images have been cleared.");
}

// Generate the embed code for the current canvas state
function generateEmbedCode() {
  const base64Images = imageElements.map(img => img.src); // Get Base64 encoded images

  const iframeHTML = `
    <iframe width="${canvas.width}" height="${canvas.height}" frameborder="0" scrolling="no" srcdoc="
      <html>
      <body style='margin:0;overflow:hidden;'>
      <canvas id='canvas'></canvas>
      <script>
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let imageElements = [];
        let currentImageIndex = 0;
        let totalImages = ${totalImages};
        let dragSpeed = 200;

        canvas.width = ${canvas.width};
        canvas.height = ${canvas.height};

        const imageSrcs = ${JSON.stringify(base64Images)};
        imageSrcs.forEach(src => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            imageElements.push(img);
            if (imageElements.length === totalImages) {
              ctx.drawImage(imageElements[0], 0, 0, canvas.width, canvas.height);
              initViewer();
            }
          };
        });

        function initViewer() {
          canvas.addEventListener('mousedown', startDragging);
          canvas.addEventListener('mousemove', onDragging);
          canvas.addEventListener('mouseup', stopDragging);

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
              ctx.drawImage(imageElements[currentImageIndex], 0, 0, canvas.width, canvas.height);
            }
          }

          function stopDragging() {
            isDragging = false;
          }
        }
      </script>
      </body>
      </html>
    "></iframe>
  `;

  const embedTextarea = document.getElementById('embedCodeTextarea');
  embedTextarea.value = iframeHTML;
  embedTextarea.style.display = 'block';

  document.getElementById('copyEmbedButton').style.display = 'block';
}

function copyEmbedCode() {
  const embedTextarea = document.getElementById('embedCodeTextarea');
  embedTextarea.select();
  document.execCommand('copy');

  alert('Embed code copied to clipboard!');
}
