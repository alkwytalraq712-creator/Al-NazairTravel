const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver ?? {};
config.resolver.blockList = [
  // Sharp / tesseract native temp dirs
  /node_modules[/\\]\.pnpm[/\\]@img\+sharp.*/,
  /node_modules[/\\]\.pnpm[/\\]tesseract\.js.*/,

  // Vite temp dirs created/deleted during admin-dashboard dev server startup
  /\.vite[/\\]deps_temp_.*/,
  /\.vite[/\\]deps[/\\]/,

  // Exclude node_modules of sibling artifacts entirely — Metro has no business
  // watching admin-dashboard, api-server, or mockup-sandbox dependencies.
  /artifacts[/\\]admin-dashboard[/\\]node_modules[/\\].*/,
  /artifacts[/\\]api-server[/\\]node_modules[/\\].*/,
  /artifacts[/\\]mockup-sandbox[/\\]node_modules[/\\].*/,
];

module.exports = config;
