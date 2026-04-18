/* ═══════════════════════════════════════════
   Hook Studio — Zero-dependency server
   Uses only Node.js built-in modules
   ═══════════════════════════════════════════ */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3847;
const HOST = '127.0.0.1';

// Directories
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMP_DIR = path.join(__dirname, 'temp');

[UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// MIME types
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ico': 'image/x-icon',
};

// ── Parse multipart form data (image uploads) ──
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const boundary = req.headers['content-type']?.match(/boundary=(.+)/)?.[1];
    if (!boundary) return reject(new Error('No boundary in content-type'));

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const files = [];
      const boundaryBuf = Buffer.from(`--${boundary}`);

      // Split by boundary
      let start = 0;
      const positions = [];
      while (true) {
        const pos = buffer.indexOf(boundaryBuf, start);
        if (pos === -1) break;
        positions.push(pos);
        start = pos + boundaryBuf.length;
      }

      for (let i = 0; i < positions.length - 1; i++) {
        const partStart = positions[i] + boundaryBuf.length + 2; // skip \r\n
        const partEnd = positions[i + 1] - 2; // before \r\n--boundary
        const part = buffer.slice(partStart, partEnd);

        // Find header/body separator (\r\n\r\n)
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headers = part.slice(0, headerEnd).toString();
        const body = part.slice(headerEnd + 4);

        // Get filename from Content-Disposition
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        if (!filenameMatch) continue;

        const originalname = filenameMatch[1];
        const ext = path.extname(originalname).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'].includes(ext)) continue;

        const filename = `img_${Date.now()}_${randomBytes(4).toString('hex')}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filepath, body);

        files.push({
          filename,
          originalname,
          path: `/uploads/${filename}`,
          size: body.length
        });
      }

      resolve(files);
    });
    req.on('error', reject);
  });
}

// ── Parse JSON body ──
function parseJSON(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// ── Serve static files ──
function serveStatic(req, res, urlPath) {
  // Determine which directory to serve from
  let filePath;
  if (urlPath.startsWith('/uploads/')) {
    filePath = path.join(UPLOAD_DIR, urlPath.slice(9));
  } else if (urlPath.startsWith('/output/')) {
    filePath = path.join(OUTPUT_DIR, urlPath.slice(8));
  } else {
    filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  }

  // Security: prevent directory traversal
  const resolvedDir = urlPath.startsWith('/uploads/') ? UPLOAD_DIR :
                      urlPath.startsWith('/output/') ? OUTPUT_DIR : PUBLIC_DIR;
  if (!path.resolve(filePath).startsWith(resolvedDir)) {
    res.writeHead(403);
    res.end();
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  // For video, support range requests
  if (ext === '.mp4' || ext === '.webm' || ext === '.mov') {
    const stat = fs.statSync(filePath);
    const range = req?.headers?.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': mime });
  res.end(content);
}

// ── Send JSON response ──
function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── VIDEO GENERATION ENGINE ──
function generateVideo(config) {
  const {
    images = [],
    style = 'cinematic',
    aspect = '9:16',
    transition = 'crossfade',
    speed = 'medium',
    colorGrade = 'cinematic',
    hookText = '',
    hookPosition = 'center',
  } = config;

  // Dimension presets
  const dims = {
    '9:16': { w: 1080, h: 1920 },
    '1:1':  { w: 1080, h: 1080 },
    '16:9': { w: 1920, h: 1080 }
  };
  const { w, h } = dims[aspect] || dims['9:16'];

  // Timing per image based on speed
  const speedMap = { slow: 4.0, medium: 2.5, fast: 1.5 };
  const imgDur = speedMap[speed] || 2.5;
  const transDur = Math.min(imgDur * 0.3, 0.8);

  // Ken Burns motion patterns
  const motions = [
    { z_start: 1.0, z_end: 1.15, x_drift: 0.02, y_drift: 0.01 },
    { z_start: 1.15, z_end: 1.0, x_drift: -0.02, y_drift: 0.01 },
    { z_start: 1.0, z_end: 1.1, x_drift: 0.0, y_drift: 0.02 },
    { z_start: 1.1, z_end: 1.0, x_drift: 0.01, y_drift: -0.02 },
    { z_start: 1.0, z_end: 1.2, x_drift: -0.01, y_drift: 0.0 },
    { z_start: 1.05, z_end: 1.0, x_drift: 0.015, y_drift: 0.015 },
  ];

  // Color grading filters
  const gradeFilters = {
    cinematic: 'eq=contrast=1.1:brightness=0.02:saturation=0.85',
    warm: 'colorbalance=rs=0.08:gs=0.02:bs=-0.05:rm=0.05:gm=0.01:bm=-0.03,eq=contrast=1.05:saturation=1.1',
    cool: 'colorbalance=rs=-0.05:gs=0.0:bs=0.08:rm=-0.03:gm=0.01:bm=0.06,eq=contrast=1.08:saturation=0.9',
    vibrant: 'eq=contrast=1.15:brightness=0.03:saturation=1.4,unsharp=5:5:0.8',
    none: 'null'
  };
  const gradeFilter = gradeFilters[colorGrade] || gradeFilters['cinematic'];

  const timestamp = Date.now();
  const outFile = `hook_${style}_${aspect.replace(':', 'x')}_${timestamp}.mp4`;
  const outPath = path.join(OUTPUT_DIR, outFile);

  const fps = 30;
  const totalFrames = Math.ceil(imgDur * fps);

  // ── Step 1: Create individual clips with Ken Burns effect ──
  const clipFiles = [];

  for (let i = 0; i < images.length; i++) {
    const imgPath = path.join(UPLOAD_DIR, images[i]);
    const clipPath = path.join(TEMP_DIR, `clip_${timestamp}_${i}.mp4`);
    clipFiles.push(clipPath);

    const motion = motions[i % motions.length];
    const zStep = (motion.z_end - motion.z_start) / totalFrames;
    const xStep = motion.x_drift / totalFrames;
    const yStep = motion.y_drift / totalFrames;

    // Scale image large, then zoompan across it
    const zpFilter = [
      `scale=-1:${h * 3}`,
      `zoompan=z='${motion.z_start}+${zStep}*in':` +
      `x='iw/2-(iw/zoom/2)+${xStep}*iw*in':` +
      `y='ih/2-(ih/zoom/2)+${yStep}*ih*in':` +
      `d=${totalFrames}:s=${w}x${h}:fps=${fps}`,
      `setsar=1`
    ].join(',');

    const cmd = `ffmpeg -y -loop 1 -i "${imgPath}" -vf "${zpFilter}" -t ${imgDur} -c:v libx264 -preset fast -pix_fmt yuv420p -r ${fps} "${clipPath}" 2>&1`;

    console.log(`  🎞  Clip ${i + 1}/${images.length}: Ken Burns...`);
    execSync(cmd, { timeout: 120000 });
  }

  // ── Step 2: Concatenate with transitions ──
  console.log('  🔗 Joining clips with transitions...');

  if (transition === 'cut' || images.length === 1) {
    // Simple concat
    const listPath = path.join(TEMP_DIR, `list_${timestamp}.txt`);
    const listContent = clipFiles.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listPath, listContent);

    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -vf "${gradeFilter}" -c:v libx264 -preset fast -pix_fmt yuv420p -movflags +faststart "${outPath}" 2>&1`;
    execSync(concatCmd, { timeout: 120000 });

    try { fs.unlinkSync(listPath); } catch(e) {}
  } else {
    // Crossfade transitions using xfade filter chain
    const inputArgs = clipFiles.map(f => `-i "${f}"`).join(' ');
    const n = clipFiles.length;
    let filterComplex = '';

    const xfadeType = transition === 'slide' ? 'slideleft' :
                      transition === 'zoom' ? 'circlecrop' : 'fade';

    if (n === 2) {
      const offset = (imgDur - transDur).toFixed(3);
      filterComplex = `[0:v][1:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset},${gradeFilter}[outv]`;
    } else {
      // Chain xfade filters for n clips
      let prevLabel = '0:v';
      for (let i = 1; i < n; i++) {
        // Each subsequent offset accounts for previous transitions shortening total
        const offset = (imgDur * (i) - transDur * (i)).toFixed(3);
        const outLabel = i < n - 1 ? `v${i}` : 'outv';

        if (i === n - 1) {
          filterComplex += `[${prevLabel}][${i}:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset},${gradeFilter}[${outLabel}]`;
        } else {
          filterComplex += `[${prevLabel}][${i}:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset}[${outLabel}];`;
          prevLabel = outLabel;
        }
      }
    }

    const mergeCmd = `ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -preset fast -pix_fmt yuv420p -movflags +faststart "${outPath}" 2>&1`;
    execSync(mergeCmd, { timeout: 300000 });
  }

  // ── Step 3: Add text overlay if hook text provided ──
  if (hookText && hookText.trim()) {
    console.log('  📝 Adding text overlay...');
    const textOutPath = path.join(OUTPUT_DIR, `hook_text_${timestamp}.mp4`);
    const fontSize = Math.round(w * 0.055);
    const boxPadding = Math.round(fontSize * 0.5);

    const yPos = hookPosition === 'top' ? `${Math.round(h * 0.08)}` :
                 hookPosition === 'bottom' ? `${Math.round(h * 0.82)}` :
                 '(h-text_h)/2';

    // Escape special characters for FFmpeg drawtext
    const safeText = hookText.replace(/'/g, "'\\''").replace(/:/g, '\\:').replace(/%/g, '%%');

    const textFilter = [
      `drawtext=text='${safeText}':`,
      `fontsize=${fontSize}:`,
      `fontcolor=white:`,
      `x=(w-text_w)/2:y=${yPos}:`,
      `box=1:boxcolor=black@0.5:boxborderw=${boxPadding}:`,
      `enable='gte(t\\,0.3)'`
    ].join('');

    const textCmd = `ffmpeg -y -i "${outPath}" -vf "${textFilter}" -c:v libx264 -preset fast -pix_fmt yuv420p -movflags +faststart "${textOutPath}" 2>&1`;
    execSync(textCmd, { timeout: 60000 });

    // Replace original with text version
    fs.unlinkSync(outPath);
    fs.renameSync(textOutPath, outPath);
  }

  // ── Cleanup temp ──
  clipFiles.forEach(f => { try { fs.unlinkSync(f); } catch(e) {} });

  const totalDuration = imgDur * images.length - transDur * (images.length - 1);
  return {
    video: `/output/${outFile}`,
    filename: outFile,
    duration: `${totalDuration.toFixed(1)}s`,
    resolution: `${w}x${h}`,
    images: images.length
  };
}

// ── HTTP Server ──
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    // ── API Routes ──

    // Upload images
    if (method === 'POST' && pathname === '/api/upload') {
      const files = await parseMultipart(req);
      if (!files.length) return json(res, { error: 'No valid images' }, 400);
      return json(res, { success: true, files });
    }

    // List images
    if (method === 'GET' && pathname === '/api/images') {
      const files = fs.readdirSync(UPLOAD_DIR)
        .filter(f => /\.(jpg|jpeg|png|webp|bmp|tiff)$/i.test(f))
        .map(f => ({ filename: f, path: `/uploads/${f}` }));
      return json(res, { files });
    }

    // Delete image
    if (method === 'DELETE' && pathname.startsWith('/api/images/')) {
      const filename = pathname.split('/').pop();
      const filepath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return json(res, { success: true });
      }
      return json(res, { error: 'Not found' }, 404);
    }

    // Clear all images
    if (method === 'POST' && pathname === '/api/clear') {
      fs.readdirSync(UPLOAD_DIR).forEach(f => {
        try { fs.unlinkSync(path.join(UPLOAD_DIR, f)); } catch(e) {}
      });
      return json(res, { success: true });
    }

    // Generate video
    if (method === 'POST' && pathname === '/api/generate') {
      const body = await parseJSON(req);

      if (!body.images || body.images.length < 2) {
        return json(res, { error: 'Need at least 2 images' }, 400);
      }

      // Validate images exist
      for (const img of body.images) {
        if (!fs.existsSync(path.join(UPLOAD_DIR, img))) {
          return json(res, { error: `Image not found: ${img}` }, 400);
        }
      }

      console.log(`\n  ⚡ Generating ${body.style || 'cinematic'} hook (${body.images.length} images, ${body.aspect || '9:16'})...`);
      const result = generateVideo(body);
      console.log(`  ✅ Done → ${result.filename} (${result.duration})\n`);

      return json(res, { success: true, ...result });
    }

    // List videos
    if (method === 'GET' && pathname === '/api/videos') {
      const files = fs.readdirSync(OUTPUT_DIR)
        .filter(f => /\.(mp4|webm|mov)$/i.test(f))
        .map(f => {
          const ts = f.match(/(\d{13})/)?.[1];
          return {
            filename: f,
            path: `/output/${f}`,
            created: ts ? new Date(parseInt(ts)).toISOString() : new Date().toISOString()
          };
        })
        .sort((a, b) => b.created.localeCompare(a.created));
      return json(res, { files });
    }

    // Delete video
    if (method === 'DELETE' && pathname.startsWith('/api/videos/')) {
      const filename = pathname.split('/').pop();
      const filepath = path.join(OUTPUT_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return json(res, { success: true });
      }
      return json(res, { error: 'Not found' }, 404);
    }

    // ── Static files ──
    serveStatic(req, res, pathname);

  } catch (err) {
    console.error('Error:', err.message);
    json(res, { error: err.message?.slice(0, 500) || 'Internal error' }, 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────┐');
  console.log('  │  🎬  Hook Video Studio              │');
  console.log('  │  ──────────────────────────────────  │');
  console.log(`  │  http://localhost:${PORT}              │`);
  console.log('  │                                      │');
  console.log('  │  Upload images → Generate hooks      │');
  console.log('  │  Powered by FFmpeg                   │');
  console.log('  │  Zero dependencies — pure Node.js   │');
  console.log('  └──────────────────────────────────────┘');
  console.log('');
});
