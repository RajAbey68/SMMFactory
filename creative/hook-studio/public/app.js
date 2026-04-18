/* ═══════════════════════════════════════════
   Hook Studio — App Logic
   ═══════════════════════════════════════════ */

// ── State ──
const state = {
  images: [],       // { filename, originalname, path }
  style: 'cinematic',
  aspect: '9:16',
  transition: 'crossfade',
  speed: 'medium',
  colorGrade: 'cinematic',
  hookText: '',
  hookPosition: 'center',
  generating: false
};

// ── DOM Refs ──
const $ = id => document.getElementById(id);
const dropZone = $('dropZone');
const fileInput = $('fileInput');
const imageStrip = $('imageStrip');
const imageCount = $('imageCount');
const btnGenerate = $('btnGenerate');
const btnClearAll = $('btnClearAll');
const videoPreview = $('videoPreview');
const previewPlaceholder = $('previewPlaceholder');
const previewAspect = $('previewAspect');
const progressContainer = $('progressContainer');
const progressFill = $('progressFill');
const progressText = $('progressText');
const statusDot = $('statusDot');
const statusText = $('statusText');
const gallerySection = $('gallerySection');
const galleryGrid = $('galleryGrid');

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  setupDropZone();
  setupFileInput();
  setupStyleCards();
  setupAspectButtons();
  setupSpeedButtons();
  setupGradeButtons();
  setupPositionButtons();
  setupTransition();
  setupHookText();
  setupGenerate();
  setupClear();
  loadExistingImages();
  loadGallery();
});

// ── Drop Zone ──
function setupDropZone() {
  dropZone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(e => {
    dropZone.addEventListener(e, ev => {
      ev.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(e => {
    dropZone.addEventListener(e, ev => {
      ev.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', ev => {
    const files = ev.dataTransfer.files;
    if (files.length) uploadFiles(files);
  });
}

// ── File Input ──
function setupFileInput() {
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      uploadFiles(fileInput.files);
      fileInput.value = '';
    }
  });
}

// ── Upload ──
async function uploadFiles(files) {
  const formData = new FormData();
  let count = 0;
  for (const file of files) {
    if (/\.(jpg|jpeg|png|webp|bmp|tiff)$/i.test(file.name) && count < 15) {
      formData.append('images', file);
      count++;
    }
  }

  if (!count) {
    toast('No valid images selected', 'error');
    return;
  }

  setStatus('processing', 'Uploading...');

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      state.images.push(...data.files);
      renderImageStrip();
      toast(`${data.files.length} image${data.files.length > 1 ? 's' : ''} added`, 'success');
    } else {
      toast(data.error || 'Upload failed', 'error');
    }
  } catch (err) {
    toast('Upload failed: ' + err.message, 'error');
  }

  setStatus('ready', 'Ready');
}

// ── Render Image Strip ──
function renderImageStrip() {
  imageStrip.innerHTML = '';

  state.images.forEach((img, i) => {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.draggable = true;
    card.dataset.index = i;

    card.innerHTML = `
      <span class="drag-handle">⠿</span>
      <img class="thumb" src="${img.path}" alt="${img.originalname || img.filename}" loading="lazy">
      <div class="img-info">
        <div class="img-name">${img.originalname || img.filename}</div>
        <div class="img-order">#${i + 1}</div>
      </div>
      <button class="btn-remove" data-index="${i}" title="Remove">✕</button>
    `;

    // Drag events for reordering
    card.addEventListener('dragstart', e => {
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', i.toString());
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.image-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));

    card.addEventListener('drop', e => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(card.dataset.index);
      if (fromIndex !== toIndex) {
        const [moved] = state.images.splice(fromIndex, 1);
        state.images.splice(toIndex, 0, moved);
        renderImageStrip();
      }
    });

    // Remove button
    card.querySelector('.btn-remove').addEventListener('click', async (e) => {
      e.stopPropagation();
      const idx = parseInt(e.target.dataset.index);
      const removed = state.images.splice(idx, 1)[0];
      try { await fetch(`/api/images/${removed.filename}`, { method: 'DELETE' }); } catch(e) {}
      renderImageStrip();
      toast('Image removed', 'info');
    });

    imageStrip.appendChild(card);
  });

  imageCount.textContent = `${state.images.length} image${state.images.length !== 1 ? 's' : ''} loaded`;
  btnGenerate.disabled = state.images.length < 2;
  updateDurationEstimate();
}

// ── Style Cards ──
function setupStyleCards() {
  document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.style = card.dataset.style;

      // Auto-set defaults based on style
      const presets = {
        cinematic: { speed: 'slow', colorGrade: 'cinematic', transition: 'crossfade' },
        artisan: { speed: 'slow', colorGrade: 'warm', transition: 'crossfade' },
        energetic: { speed: 'fast', colorGrade: 'vibrant', transition: 'slide' },
        minimal: { speed: 'medium', colorGrade: 'none', transition: 'cut' }
      };

      const preset = presets[state.style];
      if (preset) {
        // Update speed
        state.speed = preset.speed;
        document.querySelectorAll('.speed-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.speed === preset.speed);
        });

        // Update color grade
        state.colorGrade = preset.colorGrade;
        document.querySelectorAll('.grade-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.grade === preset.colorGrade);
        });

        // Update transition
        state.transition = preset.transition;
        $('transitionSelect').value = preset.transition;

        updateDurationEstimate();
      }
    });
  });
}

// ── Aspect Buttons ──
function setupAspectButtons() {
  document.querySelectorAll('.aspect-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.aspect = btn.dataset.aspect;

      // Update preview frame
      previewAspect.dataset.aspect = state.aspect;
      previewAspect.querySelector('.preview-label').textContent = state.aspect;

      // Update resolution display
      const resMap = { '9:16': '1080×1920', '1:1': '1080×1080', '16:9': '1920×1080' };
      $('infoRes').textContent = resMap[state.aspect] || '1080×1920';
    });
  });
}

// ── Speed Buttons ──
function setupSpeedButtons() {
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.speed = btn.dataset.speed;
      updateDurationEstimate();
    });
  });
}

// ── Grade Buttons ──
function setupGradeButtons() {
  document.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.colorGrade = btn.dataset.grade;
    });
  });
}

// ── Position Buttons ──
function setupPositionButtons() {
  document.querySelectorAll('.position-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.hookPosition = btn.dataset.pos;
    });
  });
}

// ── Transition ──
function setupTransition() {
  $('transitionSelect').addEventListener('change', e => {
    state.transition = e.target.value;
  });
}

// ── Hook Text ──
function setupHookText() {
  $('hookTextInput').addEventListener('input', e => {
    state.hookText = e.target.value;
  });
}

// ── Duration Estimate ──
function updateDurationEstimate() {
  const speedMap = { slow: 4.0, medium: 2.5, fast: 1.5 };
  const perImage = speedMap[state.speed] || 2.5;
  const n = state.images.length;
  if (n < 2) {
    $('infoDur').textContent = '—';
    return;
  }
  const transDur = Math.min(perImage * 0.3, 0.8);
  const total = perImage * n - transDur * (n - 1);
  $('infoDur').textContent = `~${total.toFixed(1)}s`;
}

// ── Clear All ──
function setupClear() {
  btnClearAll.addEventListener('click', async () => {
    if (!state.images.length) return;
    if (!confirm('Remove all images?')) return;
    try { await fetch('/api/clear', { method: 'POST' }); } catch(e) {}
    state.images = [];
    renderImageStrip();
    toast('All images cleared', 'info');
  });
}

// ── Generate ──
function setupGenerate() {
  btnGenerate.addEventListener('click', generateVideo);
}

async function generateVideo() {
  if (state.generating || state.images.length < 2) return;

  state.generating = true;
  btnGenerate.disabled = true;
  progressContainer.hidden = false;
  progressFill.style.width = '0%';
  setStatus('processing', 'Generating...');

  // Simulate progress since FFmpeg doesn't give real-time feedback
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 8, 90);
    progressFill.style.width = `${progress}%`;
    const steps = ['Preparing images...', 'Applying Ken Burns...', 'Rendering transitions...', 'Color grading...', 'Encoding...'];
    progressText.textContent = steps[Math.min(Math.floor(progress / 20), steps.length - 1)];
  }, 600);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: state.images.map(i => i.filename),
        style: state.style,
        aspect: state.aspect,
        transition: state.transition,
        speed: state.speed,
        colorGrade: state.colorGrade,
        hookText: state.hookText,
        hookPosition: state.hookPosition
      })
    });

    clearInterval(progressInterval);
    const data = await res.json();

    if (data.success) {
      progressFill.style.width = '100%';
      progressText.textContent = 'Complete!';

      // Show video preview
      videoPreview.src = data.video;
      videoPreview.hidden = false;
      previewPlaceholder.hidden = true;

      toast(`✅ Hook video generated — ${data.duration}, ${data.resolution}`, 'success');
      setStatus('ready', 'Done!');

      setTimeout(() => setStatus('ready', 'Ready'), 3000);

      // Refresh gallery
      loadGallery();
    } else {
      progressFill.style.width = '0%';
      toast(`❌ ${data.error}${data.details ? ': ' + data.details.slice(0, 100) : ''}`, 'error');
      setStatus('error', 'Failed');
    }
  } catch (err) {
    clearInterval(progressInterval);
    progressFill.style.width = '0%';
    toast('❌ Generation failed: ' + err.message, 'error');
    setStatus('error', 'Failed');
  }

  state.generating = false;
  btnGenerate.disabled = state.images.length < 2;
  setTimeout(() => { progressContainer.hidden = true; }, 2000);
}

// ── Load Existing Images ──
async function loadExistingImages() {
  try {
    const res = await fetch('/api/images');
    const data = await res.json();
    if (data.files.length) {
      state.images = data.files.map(f => ({
        filename: f.filename,
        originalname: f.filename,
        path: f.path
      }));
      renderImageStrip();
    }
  } catch(e) {}
}

// ── Load Gallery ──
async function loadGallery() {
  try {
    const res = await fetch('/api/videos');
    const data = await res.json();

    if (data.files.length) {
      gallerySection.hidden = false;
      galleryGrid.innerHTML = data.files.map(f => `
        <div class="gallery-card" data-filename="${f.filename}">
          <video src="${f.path}" muted preload="metadata"></video>
          <div class="gallery-card-info">
            <span class="gallery-card-name">${f.filename}</span>
            <div class="gallery-card-actions">
              <a href="${f.path}" download="${f.filename}">⬇ Save</a>
              <button onclick="deleteVideo('${f.filename}')">✕</button>
            </div>
          </div>
        </div>
      `).join('');

      // Play on hover
      galleryGrid.querySelectorAll('.gallery-card video').forEach(v => {
        const card = v.closest('.gallery-card');
        card.addEventListener('mouseenter', () => v.play());
        card.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
      });
    } else {
      gallerySection.hidden = true;
    }
  } catch(e) {}
}

// ── Delete Video ──
window.deleteVideo = async function(filename) {
  try {
    await fetch(`/api/videos/${filename}`, { method: 'DELETE' });
    loadGallery();
    toast('Video deleted', 'info');
  } catch(e) {}
};

// ── Status ──
function setStatus(type, text) {
  statusDot.className = 'status-dot' + (type === 'processing' ? ' processing' : type === 'error' ? ' error' : '');
  statusText.textContent = text;
}

// ── Toast ──
function toast(msg, type = 'info') {
  const container = $('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 300);
  }, 4000);
}
