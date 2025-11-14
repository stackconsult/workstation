const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple gradient background with robot emoji
const createIcon = async (size) => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad1)" rx="${size * 0.2}"/>
      <text x="50%" y="50%" font-size="${size * 0.6}" text-anchor="middle" dominant-baseline="middle">🤖</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(iconsDir, `icon${size}.png`));
};

(async () => {
  console.log('Generating icons...');
  await Promise.all([
    createIcon(16),
    createIcon(32),
    createIcon(48),
    createIcon(128),
  ]);
  console.log('Icons generated successfully!');
})();
