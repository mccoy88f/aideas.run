#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Test installazione app da ZIP...\n');

// Simula i dati estratti dall'issue
const issueData = {
  appName: 'Test App',
  appId: 'test-app',
  zipUrl: path.resolve('./test-app.zip'),
  description: 'App di test per verificare il workflow AIdeas Store',
  author: 'Test User',
  category: 'test',
  tags: 'test,demo,aideas'
};

console.log('📋 Dati estratti dall\'issue:');
console.log(JSON.stringify(issueData, null, 2));
console.log('');

// Step 1: Verifica file ZIP
console.log('📦 Step 1: Verifica file ZIP...');
if (!fs.existsSync(issueData.zipUrl)) {
  console.error('❌ File ZIP non trovato:', issueData.zipUrl);
  process.exit(1);
}

const zipStats = fs.statSync(issueData.zipUrl);
console.log(`✅ File ZIP trovato: ${zipStats.size} bytes`);

// Step 2: Estrai ZIP
console.log('\n📂 Step 2: Estrazione ZIP...');
const appDir = `apps/${issueData.appId}`;

// Crea directory se non esiste
if (!fs.existsSync('apps')) {
  fs.mkdirSync('apps');
}
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

try {
  execSync(`unzip -j "${issueData.zipUrl}" -d "${appDir}/"`, { stdio: 'inherit' });
  console.log('✅ ZIP estratto con successo');
} catch (error) {
  console.error('❌ Errore estrazione ZIP:', error.message);
  process.exit(1);
}

// Step 3: Verifica struttura app
console.log('\n🔍 Step 3: Verifica struttura app...');
const files = fs.readdirSync(appDir);
console.log('📁 File estratti:', files);

if (!files.includes('index.html')) {
  console.error('❌ index.html mancante');
  process.exit(1);
}
console.log('✅ index.html trovato');

// Step 4: Verifica/Crea aideas.json
console.log('\n📝 Step 4: Verifica manifest...');
const manifestPath = path.join(appDir, 'aideas.json');
let manifest = null;

if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ aideas.json esistente:', manifest.name);
  } catch (error) {
    console.error('❌ aideas.json non valido:', error.message);
    process.exit(1);
  }
} else {
  console.log('📝 Creazione aideas.json...');
  manifest = {
    name: issueData.appName,
    description: issueData.description,
    author: issueData.author,
    version: '1.0.0',
    category: issueData.category,
    tags: issueData.tags.split(',').filter(tag => tag.trim()),
    icon: '📱',
    appFormat: 'unzipped'
  };
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ aideas.json creato');
}

// Step 5: Verifica contenuto HTML
console.log('\n🌐 Step 5: Verifica contenuto HTML...');
const htmlPath = path.join(appDir, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Estrai metadati dall'HTML
const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
const authorMatch = htmlContent.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);

console.log('📄 Metadati HTML:');
console.log('  Titolo:', titleMatch ? titleMatch[1] : 'Non trovato');
console.log('  Descrizione:', descMatch ? descMatch[1] : 'Non trovata');
console.log('  Autore:', authorMatch ? authorMatch[1] : 'Non trovato');

// Step 6: Aggiorna catalog
console.log('\n📚 Step 6: Aggiorna catalog...');
const catalogPath = 'catalog.json';
let catalog = { apps: [], lastUpdated: new Date().toISOString() };

if (fs.existsSync(catalogPath)) {
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (error) {
    console.error('❌ catalog.json non valido, creazione nuovo');
  }
}

// Cerca app esistente
const existingAppIndex = catalog.apps.findIndex(app => app.id === issueData.appId);

const appInfo = {
  id: issueData.appId,
  name: issueData.appName,
  description: issueData.description,
  author: issueData.author,
  version: '1.0.0',
  category: issueData.category,
  tags: issueData.tags.split(',').filter(tag => tag.trim()),
  icon: '📱',
  githubUrl: `https://github.com/mccoy88f/aideas.store/tree/main/apps/${issueData.appId}`,
  downloadUrl: 'https://github.com/mccoy88f/aideas.store/archive/refs/heads/main.zip',
  installDate: new Date().toISOString(),
  lastUsed: null,
  favorite: false,
  type: 'store',
  storeId: issueData.appId,
  lastModified: new Date().toISOString()
};

if (existingAppIndex >= 0) {
  catalog.apps[existingAppIndex] = appInfo;
  console.log('🔄 App aggiornata nel catalog');
} else {
  catalog.apps.push(appInfo);
  console.log('➕ App aggiunta al catalog');
}

catalog.lastUpdated = new Date().toISOString();
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

console.log('✅ Catalog aggiornato');

// Step 7: Riepilogo finale
console.log('\n🎉 Test completato con successo!');
console.log('📊 Riepilogo:');
console.log(`  App: ${issueData.appName}`);
console.log(`  ID: ${issueData.appId}`);
console.log(`  Directory: ${appDir}`);
console.log(`  File: ${files.join(', ')}`);
console.log(`  Catalog entries: ${catalog.apps.length}`);

console.log('\n✅ Tutti i test superati! L\'app è pronta per essere pubblicata.'); 