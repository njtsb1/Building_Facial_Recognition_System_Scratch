(() => {
  // --- Translations ---
  const TRANSLATIONS = {
    "en-US": {
      title: "Face Recognition",
      uploadTitle: "Upload image",
      uploadDesc: "Select an image to detect and recognize faces. The frontend will show results with blue rectangles and labels.",
      chooseFile: "Choose an image or drag it here",
      detectBtn: "Detect & Recognize",
      clearBtn: "Clear",
      noImage: "No image selected",
      notesTitle: "Notes",
      footer: "Developed by Nivaldo Beirão",
      statusUploading: "Preparing image...",
      statusProcessing: "Processing...",
      statusDone: "Done",
      statusError: "Error"
    },
    "pt-BR": {
      title: "Reconhecimento Facial",
      uploadTitle: "Enviar imagem",
      uploadDesc: "Selecione uma imagem para detectar e reconhecer faces. A interface mostrará retângulos azuis e rótulos.",
      chooseFile: "Escolha uma imagem ou arraste aqui",
      detectBtn: "Detectar e Reconhecer",
      clearBtn: "Limpar",
      noImage: "Nenhuma imagem selecionada",
      notesTitle: "Observações",
      footer: "Desenvolvido por Nivaldo Beirão",
      statusUploading: "Preparando imagem...",
      statusProcessing: "Processando...",
      statusDone: "Concluído",
      statusError: "Erro"
    },
    "es-ES": {
      title: "Reconocimiento Facial",
      uploadTitle: "Subir imagen",
      uploadDesc: "Seleccione una imagen para detectar y reconocer rostros. La interfaz mostrará rectángulos azules y etiquetas.",
      chooseFile: "Elija una imagen o arrástrela aquí",
      detectBtn: "Detectar y Reconocer",
      clearBtn: "Limpiar",
      noImage: "Ninguna imagen seleccionada",
      notesTitle: "Notas",
      footer: "Desarrollado por Nivaldo Beirão",
      statusUploading: "Preparando imagen...",
      statusProcessing: "Procesando...",
      statusDone: "Listo",
      statusError: "Error"
    }
  };

  // --- Elements ---
  const body = document.body;
  const langSelect = document.getElementById('lang-select');
  const themeToggle = document.getElementById('theme-toggle');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');

  const fileInput = document.getElementById('image-input');
  const filePlaceholder = document.getElementById('file-placeholder');
  const detectBtn = document.getElementById('detect-btn');
  const clearBtn = document.getElementById('clear-btn');
  const statusEl = document.getElementById('status');

  const previewCanvas = document.getElementById('preview-canvas');
  const previewWrapper = document.getElementById('preview-wrapper');
  const noImage = document.getElementById('no-image');

  // Canvas context
  const ctx = previewCanvas.getContext ? previewCanvas.getContext('2d') : null;

  // --- State ---
  let currentLang = localStorage.getItem('ui_lang') || 'en-US';
  let theme = localStorage.getItem('ui_theme') || 'dark';
  let currentImage = null; // Image object
  let currentImageData = null; // original image data

  // --- Initialization ---
  function init() {
    // set language
    langSelect.value = currentLang;
    applyTranslations();

    // set theme
    applyTheme(theme);

    // event listeners
    langSelect.addEventListener('change', onLangChange);
    themeToggle.addEventListener('click', onThemeToggle);

    fileInput.addEventListener('change', onFileChange);
    detectBtn.addEventListener('click', onDetect);
    clearBtn.addEventListener('click', onClear);

    // drag & drop support
    setupDragDrop();

    // keyboard accessibility for theme toggle
    themeToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onThemeToggle();
      }
    });
  }

  // --- Translations ---
  function applyTranslations() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en-US'];
    document.getElementById('app-title').textContent = t.title;
    document.getElementById('upload-title').textContent = t.uploadTitle;
    document.getElementById('upload-desc').textContent = t.uploadDesc;
    filePlaceholder.textContent = t.chooseFile;
    detectBtn.textContent = t.detectBtn;
    clearBtn.textContent = t.clearBtn;
    noImage.textContent = t.noImage;
    document.getElementById('info-title').textContent = t.notesTitle;
    document.getElementById('footer-text').textContent = t.footer;
  }

  function onLangChange(e) {
    currentLang = e.target.value;
    localStorage.setItem('ui_lang', currentLang);
    applyTranslations();
  }

  // --- Theme handling ---
  function applyTheme(mode) {
    if (mode === 'light') {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      document.documentElement.classList.add('light');
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
      themeToggle.setAttribute('aria-pressed', 'false');
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      document.documentElement.classList.remove('light');
      iconMoon.classList.remove('hidden');
      iconSun.classList.add('hidden');
      themeToggle.setAttribute('aria-pressed', 'true');
    }
    localStorage.setItem('ui_theme', mode);
    theme = mode;
  }

  function onThemeToggle() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  // --- File handling & preview ---
  function onFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    filePlaceholder.textContent = file.name;
    loadImageFile(file);
  }

  function setupDragDrop() {
    const label = document.querySelector('.file-label');
    ['dragenter','dragover'].forEach(evt => {
      label.addEventListener(evt, (e) => {
        e.preventDefault(); e.stopPropagation();
        label.classList.add('dragover');
      });
    });
    ['dragleave','drop'].forEach(evt => {
      label.addEventListener(evt, (e) => {
        e.preventDefault(); e.stopPropagation();
        label.classList.remove('dragover');
      });
    });
    label.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (!dt) return;
      const file = dt.files && dt.files[0];
      if (file) {
        fileInput.files = dt.files;
        filePlaceholder.textContent = file.name;
        loadImageFile(file);
      }
    });
  }

  function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = new Image();
      img.onload = function() {
        currentImage = img;
        currentImageData = ev.target.result;
        renderPreview();
        detectBtn.disabled = false;
        clearBtn.disabled = false;
        statusEl.hidden = true;
      };
      img.onerror = function() {
        showStatus('statusError', true);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    showStatus('statusUploading');
  }

  function renderPreview(detections = []) {
    if (!ctx || !currentImage) return;
    // set canvas size to image size but constrained to wrapper width
    const wrapperWidth = previewWrapper.clientWidth;
    const scale = Math.min(1, wrapperWidth / currentImage.width);
    const canvasWidth = Math.round(currentImage.width * scale);
    const canvasHeight = Math.round(currentImage.height * scale);

    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;
    previewCanvas.style.width = canvasWidth + 'px';
    previewCanvas.style.height = canvasHeight + 'px';

    // draw image
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(currentImage, 0, 0, canvasWidth, canvasHeight);

    // draw detections (if any)
    if (Array.isArray(detections) && detections.length) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--blue-rect') || '#007bff';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '14px system-ui, Arial';
      ctx.textBaseline = 'top';

      detections.forEach(det => {
        // det expected: {box: [x,y,w,h], name: 'label', confidence: 0.95}
        const [x, y, w, h] = det.box;
        // scale coordinates to canvas
        const sx = x * (canvasWidth / currentImage.width);
        const sy = y * (canvasHeight / currentImage.height);
        const sw = w * (canvasWidth / currentImage.width);
        const sh = h * (canvasHeight / currentImage.height);

        // rectangle
        ctx.strokeRect(sx, sy, sw, sh);

        // label background
        const label = `${det.name} (${(det.confidence || 0).toFixed(2)})`;
        const padding = 6;
        const textWidth = ctx.measureText(label).width;
        const rectW = textWidth + padding;
        const rectH = 20;
        ctx.fillRect(sx, sy - rectH - 6, rectW, rectH);

        // label text
        ctx.fillStyle = '#fff';
        ctx.fillText(label, sx + 4, sy - rectH - 4);

        // reset fill style for next rect
        ctx.fillStyle = ctx.strokeStyle;
      });
    }

    noImage.style.display = 'none';
  }

  // --- Status helper ---
  function showStatus(key, isError = false) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en-US'];
    const text = t[key] || key;
    statusEl.textContent = text;
    statusEl.hidden = false;
    statusEl.style.color = isError ? 'var(--accent)' : 'inherit';
  }

  // --- Detect & Recognize (placeholder for backend call) ---
  async function onDetect() {
    if (!currentImageData) return;
    showStatus('statusProcessing');
    detectBtn.disabled = true;

    try {
      // Example: POST to backend endpoint /api/recognize
      // The backend should return JSON: { detections: [ { box:[x,y,w,h], name:"label", confidence:0.95 }, ... ] }
      // If you don't have a backend yet, the code below will simulate a response for demo.

      // Uncomment and adapt this block to call your backend:
      /*
      const form = new FormData();
      const blob = dataURLtoBlob(currentImageData);
      form.append('image', blob, 'upload.jpg');

      const resp = await fetch('/api/recognize', {
        method: 'POST',
        body: form
      });
      if (!resp.ok) throw new Error('Server error');
      const result = await resp.json();
      const detections = result.detections || [];
      */

      // Simulated demo response (replace with real backend response)
      await new Promise(r => setTimeout(r, 800)); // simulate latency
      const detections = simulateDetections(currentImage.width, currentImage.height);

      renderPreview(detections);
      showStatus('statusDone');
    } catch (err) {
      console.error(err);
      showStatus('statusError', true);
    } finally {
      detectBtn.disabled = false;
    }
  }

  // --- Clear ---
  function onClear() {
    fileInput.value = '';
    filePlaceholder.textContent = TRANSLATIONS[currentLang].chooseFile;
    currentImage = null;
    currentImageData = null;
    detectBtn.disabled = true;
    clearBtn.disabled = true;
    statusEl.hidden = true;
    if (ctx) {
      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
    noImage.style.display = 'block';
  }

  // --- Utility: simulate detections for demo ---
  function simulateDetections(imgW, imgH) {
    // create 1-4 random boxes for demo purposes
    const count = Math.min(4, Math.max(1, Math.floor(Math.random() * 4) + 1));
    const names = ['unknown', 'person1', 'person2', 'person3'];
    const detections = [];
    for (let i = 0; i < count; i++) {
      const w = Math.round(imgW * (0.12 + Math.random() * 0.25));
      const h = Math.round(w * (0.9 + Math.random() * 0.3));
      const x = Math.round(Math.random() * (imgW - w));
      const y = Math.round(Math.random() * (imgH - h));
      detections.push({
        box: [x, y, w, h],
        name: names[Math.floor(Math.random() * names.length)],
        confidence: Math.random() * 0.6 + 0.3
      });
    }
    return detections;
  }

  // --- Utility: convert dataURL to Blob (if needed for backend) ---
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  // initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);
})();
