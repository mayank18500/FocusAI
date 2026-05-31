// ============================================================
// FocusGuard AI — High Quality Icon Generator
// Uses local Chrome in headless mode to render pixel-perfect
// premium vector shield/emerald-check icons via HTML5 Canvas.
// ============================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find Chrome on Windows
function getChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

const PORT = 38992;
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #000; margin: 0; padding: 20px; color: #fff; font-family: sans-serif; }
    canvas { background: transparent; margin: 10px; border: 1px dashed #333; }
  </style>
</head>
<body>
  <h3>Generating FocusGuard AI Premium Icons...</h3>
  <canvas id="canvas16" width="16" height="16"></canvas>
  <canvas id="canvas32" width="32" height="32"></canvas>
  <canvas id="canvas48" width="48" height="48"></canvas>
  <canvas id="canvas128" width="128" height="128"></canvas>

  <script>
    function draw(canvas, size) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      
      // High-quality rendering settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Sleek Gradient Squircle Background (Violet-Indigo)
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#8b5cf6'); // Premium violet
      grad.addColorStop(1, '#4f46e5'); // Premium indigo
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      
      const r = size * 0.24; // Curved corners
      const pad = size * 0.04;
      const w = size - 2 * pad;
      ctx.roundRect(pad, pad, w, w, r);
      ctx.fill();

      // 2. Subtle outer glowing border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = Math.max(1, size * 0.03);
      ctx.stroke();

      // 3. Central Shield Emblem (White with low opacity fill)
      const cx = size / 2;
      const cy = size / 2;
      const s = size * 0.44; // size of the shield emblem

      ctx.beginPath();
      ctx.moveTo(cx, cy - s/2);
      ctx.quadraticCurveTo(cx + s/2, cy - s/2, cx + s/2, cy);
      ctx.quadraticCurveTo(cx + s/2, cy + s/3, cx, cy + s/2);
      ctx.quadraticCurveTo(cx - s/2, cy + s/3, cx - s/2, cy);
      ctx.quadraticCurveTo(cx - s/2, cy - s/2, cx, cy - s/2);
      ctx.closePath();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1.2, size * 0.045);
      ctx.stroke();

      // 4. Emerald Green Glowing Checkmark (Task Complete / Protected)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981'; // Emerald-500
      ctx.lineWidth = Math.max(1.8, size * 0.075);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Checkmark drawing points relative to shield center
      const ox = cx - size * 0.02;
      const oy = cy + size * 0.03;
      ctx.moveTo(ox - size * 0.11, oy - size * 0.08);
      ctx.lineTo(ox, oy);
      ctx.lineTo(ox + size * 0.17, oy - size * 0.19);
      ctx.stroke();
    }

    // Draw all sizes
    [16, 32, 48, 128].forEach(size => {
      const canvas = document.getElementById('canvas' + size);
      draw(canvas, size);
    });

    // Extract base64 pngs
    const images = {
      icon16: document.getElementById('canvas16').toDataURL('image/png'),
      icon32: document.getElementById('canvas32').toDataURL('image/png'),
      icon48: document.getElementById('canvas48').toDataURL('image/png'),
      icon128: document.getElementById('canvas128').toDataURL('image/png')
    };

    // Send back to node server to write to file system
    fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(images)
    }).then(() => {
      console.log('Saved successfully!');
      // Close browser page
      window.close();
    }).catch(err => {
      console.error('Failed to save:', err);
    });
  </script>
</body>
</html>
`;

// Start temporary local HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const sizes = {
          'icon-16.png': payload.icon16,
          'icon-32.png': payload.icon32,
          'icon-48.png': payload.icon48,
          'icon-128.png': payload.icon128
        };

        const targetDir = path.resolve(__dirname, '../../public/icons');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        for (const [filename, base64Data] of Object.entries(sizes)) {
          const base64Content = base64Data.replace(/^data:image\/png;base64,/, '');
          const buffer = Buffer.from(base64Content, 'base64');
          const destPath = path.join(targetDir, filename);
          fs.writeFileSync(destPath, buffer);
          console.log(`[Icon Generator] Created pixel-perfect icon: public/icons/${filename} (${buffer.length} bytes)`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));

        console.log('[Icon Generator] Icons generated successfully!');
        
        // Shut down server
        setTimeout(() => {
          server.close(() => {
            console.log('[Icon Generator] Server closed. Exiting.');
            process.exit(0);
          });
        }, 1000);
      } catch (err) {
        console.error('[Icon Generator] Error parsing post body:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error');
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`[Icon Generator] Running temporary server on http://localhost:${PORT}`);

  const chromePath = getChromePath();
  if (!chromePath) {
    console.error('[Icon Generator] Google Chrome installation not found! Please check program files.');
    server.close();
    process.exit(1);
  }

  console.log(`[Icon Generator] Launching Chrome at: ${chromePath}`);
  
  // Launch Chrome headlessly to load the page and save the canvas outputs
  const chromeCmd = `"${chromePath}" --headless --disable-gpu --disable-extensions --no-sandbox http://localhost:${PORT}`;
  exec(chromeCmd, (err) => {
    if (err) {
      console.error('[Icon Generator] Failed to execute chrome command:', err);
      server.close();
      process.exit(1);
    }
  });
});
