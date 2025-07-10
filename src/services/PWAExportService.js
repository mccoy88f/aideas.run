/**
 * PWA Export Service - Genera PWA standalone dalle app installate
 * Permette agli utenti di esportare le loro app come PWA indipendenti
 */

import StorageService from './StorageService.js';
import { APP_TYPES, CATEGORIES } from '../utils/constants.js';

class PWAExportService {
  constructor() {
    if (PWAExportService.instance) {
      return PWAExportService.instance;
    }
    PWAExportService.instance = this;
    this.storageService = new StorageService();
  }

  /**
   * Genera una PWA completa per un'app installata
   * @param {number} appId - ID dell'app da esportare
   * @returns {Promise<Object>} Dati della PWA generata
   */
  async generatePWA(appId) {
    try {
      console.log(`🚀 Generazione PWA per app ${appId}...`);
      
      // Recupera i dati dell'app
      const app = await this.storageService.getApp(appId);
      if (!app) {
        throw new Error('App non trovata');
      }

      // Recupera i file dell'app se presenti
      const files = await this.storageService.getAppFiles(appId);
      
      // Genera il manifest PWA
      const manifest = this.generateManifest(app, files);
      
      // Genera il service worker
      const serviceWorker = this.generateServiceWorker(app, files);
      
      // Genera l'HTML wrapper
      const htmlWrapper = this.generateHTMLWrapper(app, files);
      
      // Genera le icone se necessario
      const icons = await this.generateIcons(app, files);
      
      const pwaData = {
        appId,
        appName: app.name,
        manifest,
        serviceWorker,
        htmlWrapper,
        icons,
        files: files.map(f => ({
          filename: f.filename,
          content: f.content,
          mimeType: f.mimeType
        })),
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          sourceApp: app.name,
          sourceAppId: appId
        }
      };

      console.log(`✅ PWA generata per ${app.name}:`, pwaData);
      return pwaData;
      
    } catch (error) {
      console.error('Errore generazione PWA:', error);
      throw error;
    }
  }

  /**
   * Genera il manifest PWA per l'app
   * @param {Object} app - Dati dell'app
   * @param {Array} files - File dell'app
   * @returns {Object} Manifest PWA
   */
  generateManifest(app, files) {
    const manifest = {
      name: app.name,
      short_name: app.name.substring(0, 12),
      description: app.description || `PWA generata da ${app.name}`,
      version: app.version || '1.0.0',
      manifest_version: 3,
      
      start_url: './index.html',
      scope: './',
      display: 'standalone',
      orientation: 'any',
      
      theme_color: '#2563eb',
      background_color: '#ffffff',
      
      categories: [app.category || 'productivity'],
      
      icons: this.generateIconManifest(app, files),
      
      shortcuts: [
        {
          name: app.name,
          short_name: app.name.substring(0, 12),
          description: `Apri ${app.name}`,
          url: './index.html',
          icons: this.generateIconManifest(app, files).slice(0, 1)
        }
      ]
    };

    // Aggiungi funzionalità specifiche per tipo di app
    if (app.type === 'zip' || app.type === 'html') {
      manifest.file_handlers = [
        {
          action: './index.html',
          accept: {
            'text/html': ['.html', '.htm'],
            'application/json': ['.json'],
            'text/plain': ['.txt', '.md']
          }
        }
      ];
    }

    return manifest;
  }

  /**
   * Genera le icone per il manifest
   * @param {Object} app - Dati dell'app
   * @param {Array} files - File dell'app
   * @returns {Array} Array di icone
   */
  generateIconManifest(app, files) {
    const icons = [];
    
    // Cerca icone nei file dell'app
    const iconFiles = files.filter(f => 
      f.filename.toLowerCase().includes('icon') ||
      f.filename.toLowerCase().includes('favicon') ||
      f.filename.toLowerCase().includes('logo')
    );

    // Se l'app ha un'icona personalizzata
    if (app.icon && app.icon.startsWith('data:')) {
      // Icona inline - genera dimensioni multiple
      const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
      sizes.forEach(size => {
        icons.push({
          src: app.icon,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'maskable any'
        });
      });
    } else if (iconFiles.length > 0) {
      // Usa le icone trovate nei file
      iconFiles.forEach(file => {
        const size = this.extractIconSize(file.filename);
        if (size) {
          icons.push({
            src: `./${file.filename}`,
            sizes: `${size}x${size}`,
            type: file.mimeType,
            purpose: 'any'
          });
        }
      });
    } else {
      // Icona di fallback
      icons.push({
        src: './assets/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      });
    }

    return icons;
  }

  /**
   * Estrae la dimensione dell'icona dal filename
   * @param {string} filename - Nome del file
   * @returns {number|null} Dimensione dell'icona
   */
  extractIconSize(filename) {
    const match = filename.match(/(\d+)x(\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    return null;
  }

  /**
   * Genera il service worker per la PWA
   * @param {Object} app - Dati dell'app
   * @param {Array} files - File dell'app
   * @returns {string} Codice del service worker
   */
  generateServiceWorker(app, files) {
    const cacheName = `pwa-${app.name.toLowerCase().replace(/\s+/g, '-')}-v1`;
    const staticFiles = files.map(f => `./${f.filename}`);
    
    return `
// Service Worker per ${app.name}
const CACHE_NAME = '${cacheName}';
const STATIC_FILES = ${JSON.stringify(staticFiles)};

// Installazione
self.addEventListener('install', (event) => {
  console.log('📦 Installing PWA for ${app.name}');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
});

// Attivazione
self.addEventListener('activate', (event) => {
  console.log('🚀 PWA ${app.name} activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
    `.trim();
  }

  /**
   * Genera l'HTML wrapper per la PWA
   * @param {Object} app - Dati dell'app
   * @param {Array} files - File dell'app
   * @returns {string} HTML wrapper
   */
  generateHTMLWrapper(app, files) {
    // Trova il file HTML principale
    const mainHtmlFile = files.find(f => 
      f.filename.toLowerCase() === 'index.html' ||
      f.filename.toLowerCase().endsWith('/index.html')
    );

    if (mainHtmlFile) {
      // Se c'è già un index.html, lo wrappa
      return this.wrapExistingHTML(mainHtmlFile.content, app);
    } else {
      // Genera un HTML wrapper generico
      return this.generateGenericHTML(app, files);
    }
  }

  /**
   * Wrappa un HTML esistente con meta tag PWA
   * @param {string} htmlContent - Contenuto HTML originale
   * @param {Object} app - Dati dell'app
   * @returns {string} HTML wrappato
   */
  wrapExistingHTML(htmlContent, app) {
    // Aggiungi meta tag PWA
    const pwaMetaTags = `
    <meta name="theme-color" content="#2563eb">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="${app.name}">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="msapplication-TileColor" content="#2563eb">
    <link rel="manifest" href="./manifest.json">
    `;

    // Inserisci i meta tag nell'head
    const headRegex = /<head[^>]*>/i;
    if (headRegex.test(htmlContent)) {
      return htmlContent.replace(headRegex, `$&${pwaMetaTags}`);
    } else {
      // Se non c'è head, aggiungi tutto
      return htmlContent.replace('<html', `<html><head>${pwaMetaTags}</head>`);
    }
  }

  /**
   * Genera un HTML generico per app senza HTML
   * @param {Object} app - Dati dell'app
   * @param {Array} files - File dell'app
   * @returns {string} HTML generico
   */
  generateGenericHTML(app, files) {
    const iconUrl = app.icon || './assets/icon-192x192.png';
    
    return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>${app.name}</title>
  <meta name="description" content="${app.description || ''}">
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#2563eb">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="${app.name}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="msapplication-TileColor" content="#2563eb">
  
  <link rel="manifest" href="./manifest.json">
  <link rel="icon" href="${iconUrl}">
  <link rel="apple-touch-icon" href="${iconUrl}">
  
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      display: block;
    }
    h1 {
      color: #2563eb;
      margin: 0 0 10px;
    }
    .description {
      color: #666;
      margin-bottom: 30px;
    }
    .content {
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${iconUrl}" alt="${app.name}" class="icon">
      <h1>${app.name}</h1>
      <p class="description">${app.description || 'App generata da AIdeas'}</p>
    </div>
    
    <div class="content">
      <p>Questa è una PWA generata da AIdeas per l'app <strong>${app.name}</strong>.</p>
      <p>L'app è stata installata il ${new Date(app.installDate).toLocaleDateString('it-IT')}.</p>
      
      ${files.length > 0 ? `
      <h3>File inclusi:</h3>
      <ul>
        ${files.map(f => `<li>${f.filename} (${f.size} bytes)</li>`).join('')}
      </ul>
      ` : ''}
    </div>
  </div>
  
  <script>
    // Registra service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(error => {
            console.log('SW registration failed: ', error);
          });
      });
    }
  </script>
</body>
</html>`;
  }

  /**
   * Genera le icone per la PWA
   * @param {Object} app - Dati dell'app
   * @param {Array} files - File dell'app
   * @returns {Array} Array di icone generate
   */
  async generateIcons(app, files) {
    const icons = [];
    
    // Se l'app ha un'icona inline, la converte in file
    if (app.icon && app.icon.startsWith('data:')) {
      try {
        const response = await fetch(app.icon);
        const blob = await response.blob();
        icons.push({
          filename: 'icon-192x192.png',
          content: await blob.arrayBuffer(),
          mimeType: 'image/png'
        });
      } catch (error) {
        console.warn('Errore conversione icona inline:', error);
      }
    }
    
    // Cerca icone nei file dell'app
    const iconFiles = files.filter(f => 
      f.filename.toLowerCase().includes('icon') ||
      f.filename.toLowerCase().includes('favicon') ||
      f.filename.toLowerCase().includes('logo')
    );
    
    iconFiles.forEach(file => {
      icons.push({
        filename: file.filename,
        content: file.content,
        mimeType: file.mimeType
      });
    });
    
    return icons;
  }

  /**
   * Esporta la PWA come file ZIP
   * @param {number} appId - ID dell'app da esportare
   * @returns {Promise<Blob>} File ZIP della PWA
   */
  async exportPWAAsZIP(appId) {
    try {
      console.log(`📦 Esportazione PWA come ZIP per app ${appId}...`);
      
      const pwaData = await this.generatePWA(appId);
      
      // Importa JSZip dinamicamente
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Aggiungi manifest
      zip.file('manifest.json', JSON.stringify(pwaData.manifest, null, 2));
      
      // Aggiungi service worker
      zip.file('sw.js', pwaData.serviceWorker);
      
      // Aggiungi HTML wrapper
      zip.file('index.html', pwaData.htmlWrapper);
      
      // Aggiungi icone
      pwaData.icons.forEach(icon => {
        zip.file(icon.filename, icon.content);
      });
      
      // Aggiungi file dell'app
      pwaData.files.forEach(file => {
        zip.file(file.filename, file.content);
      });
      
      // Aggiungi README
      const readme = this.generateREADME(pwaData);
      zip.file('README.md', readme);
      
      // Genera il ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      console.log(`✅ PWA esportata come ZIP: ${zipBlob.size} bytes`);
      return zipBlob;
      
    } catch (error) {
      console.error('Errore esportazione PWA ZIP:', error);
      throw error;
    }
  }

  /**
   * Genera un README per la PWA esportata
   * @param {Object} pwaData - Dati della PWA
   * @returns {string} Contenuto README
   */
  generateREADME(pwaData) {
    return `# ${pwaData.appName} - PWA

Questa è una Progressive Web App (PWA) generata da AIdeas.

## Informazioni

- **App originale**: ${pwaData.appName}
- **Generata il**: ${new Date(pwaData.metadata.generatedAt).toLocaleString('it-IT')}
- **Versione**: ${pwaData.metadata.version}

## Installazione

1. Estrai tutti i file in una cartella
2. Apri \`index.html\` in un browser moderno
3. Installa la PWA dal browser

## File inclusi

- \`manifest.json\` - Configurazione PWA
- \`sw.js\` - Service Worker per funzionalità offline
- \`index.html\` - Pagina principale
- File dell'app originale

## Funzionalità

- ✅ Funziona offline
- ✅ Installabile come app
- ✅ Icone personalizzate
- ✅ Meta tag ottimizzati

## Note

Questa PWA è stata generata automaticamente da AIdeas.
Per modifiche, edita i file sorgente e rigenera la PWA.

---
Generato da AIdeas - https://aideas.run
`;
  }

  /**
   * Ottieni lista delle app che possono essere esportate come PWA
   * @returns {Promise<Array>} Lista delle app esportabili
   */
  async getExportableApps() {
    try {
      const apps = await this.storageService.getAllApps();
      
      return apps.filter(app => {
        // Tutte le app possono essere esportate come PWA
        return true;
      });
    } catch (error) {
      console.error('Errore recupero app esportabili:', error);
      return [];
    }
  }
}

export default PWAExportService; 