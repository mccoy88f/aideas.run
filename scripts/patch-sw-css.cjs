const fs = require('fs');
const path = require('path');

const distCssDir = path.join(__dirname, '../dist/css');
const distSw = path.join(__dirname, '../dist/sw.js');

// Trova il file CSS generato da Vite
const cssFile = fs.readdirSync(distCssDir).find(f => f.startsWith('main-') && f.endsWith('.css'));
if (!cssFile) {
  throw new Error('CSS file non trovato in dist/css');
}

// Sostituisci il placeholder nel Service Worker
let swContent = fs.readFileSync(distSw, 'utf8');
swContent = swContent.replace('__CSS_FILE__', `/css/${cssFile}`);
fs.writeFileSync(distSw, swContent);

console.log(`Service Worker aggiornato con il CSS: /css/${cssFile}`); 