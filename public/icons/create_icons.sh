#!/bin/bash
# Create simple SVG icons as placeholders
for size in 16 32 48 128; do
  cat > "icon${size}.png" << EOI
<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#667eea"/>
  <text x="50%" y="50%" font-size="${size/2}" fill="white" text-anchor="middle" dominant-baseline="middle">🤖</text>
</svg>
EOI
done
