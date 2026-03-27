const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const outDir = path.join(__dirname, 'public', 'icons');

sizes.forEach((size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;

  // Background circle - indigo
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fill();

  // Van body (white rectangle)
  const vx = s * 0.12, vy = s * 0.45, vw = s * 0.62, vh = s * 0.28;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(vx, vy, vw, vh, s * 0.05);
  ctx.fill();

  // Windshield (light indigo)
  ctx.fillStyle = '#c7d2fe';
  ctx.beginPath();
  ctx.moveTo(s * 0.44, s * 0.45);
  ctx.lineTo(s * 0.74, s * 0.45);
  ctx.lineTo(s * 0.74, s * 0.35);
  ctx.lineTo(s * 0.52, s * 0.35);
  ctx.closePath();
  ctx.fill();

  // Front cabin (white)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(s * 0.62, s * 0.35, s * 0.12, s * 0.10, s * 0.02);
  ctx.fill();

  // Wheels
  [s * 0.28, s * 0.62].forEach((wx) => {
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(wx, s * 0.74, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a5b4fc';
    ctx.beginPath();
    ctx.arc(wx, s * 0.74, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
  });

  // Cross on van side (indigo)
  ctx.fillStyle = '#6366f1';
  // Vertical bar
  ctx.beginPath();
  ctx.roundRect(s * 0.28, s * 0.51, s * 0.03, s * 0.14, s * 0.01);
  ctx.fill();
  // Horizontal bar
  ctx.beginPath();
  ctx.roundRect(s * 0.23, s * 0.56, s * 0.13, s * 0.03, s * 0.01);
  ctx.fill();

  // Location pin (amber/yellow) top right
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(s * 0.80, s * 0.22, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.80, s * 0.13);
  ctx.bezierCurveTo(s * 0.71, s * 0.13, s * 0.71, s * 0.28, s * 0.80, s * 0.36);
  ctx.bezierCurveTo(s * 0.89, s * 0.28, s * 0.89, s * 0.13, s * 0.80, s * 0.13);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(s * 0.80, s * 0.22, s * 0.04, 0, Math.PI * 2);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buffer);
  console.log(`Generated icon-${size}.png`);
});
