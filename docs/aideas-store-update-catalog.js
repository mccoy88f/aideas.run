const fs = require('fs');
const path = require('path');

const appsDir = './apps';
const catalogPath = './catalog.json';

// Read all app directories
const apps = fs.readdirSync(appsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => {
    const appPath = path.join(appsDir, dirent.name);
    const manifestPath = path.join(appPath, 'aideas.json');
    
    let manifest = {
      name: dirent.name,
      title: dirent.name,
      description: '',
      version: '1.0.0'
    };
    
    if (fs.existsSync(manifestPath)) {
      manifest = { ...manifest, ...JSON.parse(fs.readFileSync(manifestPath, 'utf8')) };
    }
    
    return {
      id: dirent.name,
      ...manifest,
      path: `apps/${dirent.name}/`,
      publishedAt: new Date().toISOString()
    };
  });

// Write catalog
fs.writeFileSync(catalogPath, JSON.stringify({ apps, updatedAt: new Date().toISOString() }, null, 2));
console.log(`Updated catalog with ${apps.length} apps`); 