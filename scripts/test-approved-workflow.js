#!/usr/bin/env node

/**
 * Script per testare il workflow di approvazione automatica
 * Simula il processo di estrazione e aggiunta di un'app approvata
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione di test
const TEST_ISSUE = {
  title: '[SUBMISSION] Test App',
  body: `
    App submission test
    
    ZIP URL: https://file.io/test123
    App Name: Test App
    Description: Test app for workflow
  `
};

const TEST_APP_ID = 'test-app';
const TEST_APP_NAME = 'Test App';

/**
 * Simula l'estrazione delle informazioni dall'issue
 */
function extractAppInfo(issueBody, issueTitle) {
  // Extract ZIP URL from file.io link
  const zipUrlMatch = issueBody.match(/https:\/\/file\.io\/[^\s]*/);
  const zipUrl = zipUrlMatch ? zipUrlMatch[0] : null;
  
  // Extract app name from issue title (remove [SUBMISSION] prefix)
  const appName = issueTitle.replace('[SUBMISSION] ', '').toLowerCase().replace(/\s+/g, '-');
  
  // Generate app ID (sanitize name)
  const appId = appName.replace(/[^a-z0-9-]/g, '');
  
  return {
    appName,
    appId,
    zipUrl
  };
}

/**
 * Crea la struttura dell'app
 */
function createAppStructure(appId, appName) {
  const appDir = path.join('apps', appId);
  
  // Crea directory dell'app
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  
  // Crea file HTML di esempio
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>${appName}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${appName}</h1>
        <p>Questa è un'app di test per il workflow di approvazione automatica.</p>
        <p>App ID: ${appId}</p>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(path.join(appDir, 'index.html'), htmlContent);
  
  // Crea manifest aideas.json
  const manifest = {
    name: appName,
    description: 'App submitted via AIdeas Store',
    author: 'Unknown',
    version: '1.0.0',
    category: 'utility',
    tags: [],
    icon: '📱',
    appFormat: 'unzipped'
  };
  
  fs.writeFileSync(path.join(appDir, 'aideas.json'), JSON.stringify(manifest, null, 2));
  
  console.log(`✅ App structure created: ${appDir}`);
}

/**
 * Aggiorna il catalog
 */
function updateCatalog(appId, appName) {
  const catalogPath = 'catalog.json';
  
  let catalog = { apps: [], lastUpdated: new Date().toISOString() };
  
  if (fs.existsSync(catalogPath)) {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  }
  
  // Check if app already exists
  const existingAppIndex = catalog.apps.findIndex(app => app.id === appId);
  
  const appInfo = {
    id: appId,
    name: appName,
    description: 'App submitted via AIdeas Store',
    author: 'Unknown',
    version: '1.0.0',
    category: 'utility',
    tags: [],
    icon: '📱',
    githubUrl: `https://github.com/mccoy88f/aideas.store/tree/main/apps/${appId}`,
    downloadUrl: 'https://github.com/mccoy88f/aideas.store/archive/refs/heads/main.zip',
    installDate: new Date().toISOString(),
    lastUsed: null,
    favorite: false,
    type: 'store',
    storeId: appId,
    lastModified: new Date().toISOString()
  };
  
  if (existingAppIndex >= 0) {
    catalog.apps[existingAppIndex] = appInfo;
  } else {
    catalog.apps.push(appInfo);
  }
  
  catalog.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  console.log(`✅ Catalog updated with app: ${appId}`);
}

/**
 * Valida la struttura dell'app
 */
function validateAppStructure(appId) {
  const appDir = path.join('apps', appId);
  
  // Check if required files exist
  if (!fs.existsSync(path.join(appDir, 'index.html'))) {
    throw new Error('index.html is required');
  }
  
  // Validate aideas.json if exists
  const manifestPath = path.join(appDir, 'aideas.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log('✅ Manifest validated:', manifest.name);
    } catch (e) {
      throw new Error(`Invalid aideas.json: ${e.message}`);
    }
  }
  
  console.log('✅ App structure validated successfully');
}

/**
 * Funzione principale
 */
function main() {
  try {
    console.log('🧪 Testing approved workflow...');
    
    // Simula estrazione info dall'issue
    const { appName, appId, zipUrl } = extractAppInfo(TEST_ISSUE.body, TEST_ISSUE.title);
    console.log('📋 Extracted info:', { appName, appId, zipUrl });
    
    // Crea struttura app
    createAppStructure(appId, appName);
    
    // Valida struttura
    validateAppStructure(appId);
    
    // Aggiorna catalog
    updateCatalog(appId, appName);
    
    console.log('✅ Workflow test completed successfully!');
    console.log(`📁 App created at: apps/${appId}/`);
    console.log(`📋 Catalog updated: catalog.json`);
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  extractAppInfo,
  createAppStructure,
  validateAppStructure,
  updateCatalog
}; 