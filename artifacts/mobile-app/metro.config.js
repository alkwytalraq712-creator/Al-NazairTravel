const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude native binary temp dirs that Metro cannot watch
// (e.g. sharp's libvips temp dir created and removed during install)
config.resolver = config.resolver ?? {};
config.resolver.blockList = [
  /node_modules[/\\]\.pnpm[/\\]@img\+sharp.*/,
  /node_modules[/\\]\.pnpm[/\\]tesseract\.js.*/,
];

module.exports = config;
