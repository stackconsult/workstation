const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const publicDir = path.join(__dirname, '../public');
const manifestPath = path.join(__dirname, '../manifest.json');

// Copy manifest.json
console.log('Copying manifest.json...');
fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));

// Copy icons directory
console.log('Copying icons...');
const iconsSourceDir = path.join(publicDir, 'icons');
const iconsDestDir = path.join(distDir, 'icons');

if (!fs.existsSync(iconsDestDir)) {
  fs.mkdirSync(iconsDestDir, { recursive: true });
}

const iconFiles = fs.readdirSync(iconsSourceDir);
iconFiles.forEach(file => {
  if (file.endsWith('.png')) {
    fs.copyFileSync(
      path.join(iconsSourceDir, file),
      path.join(iconsDestDir, file)
    );
  }
});

// Move HTML files to dist root
console.log('Moving HTML files...');
const htmlFiles = ['popup/index.html', 'sidepanel/index.html'];
htmlFiles.forEach(file => {
  const sourcePath = path.join(distDir, 'src', file);
  const destPath = path.join(distDir, path.basename(file).replace('index.html', file.split('/')[0] + '.html'));
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
  }
});

// Clean up src directory in dist
const srcDir = path.join(distDir, 'src');
if (fs.existsSync(srcDir)) {
  fs.rmSync(srcDir, { recursive: true, force: true });
}

console.log('Post-build complete!');

