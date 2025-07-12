import { DEBUG } from '../utils/debug.js';
/**
 * PWA Generator Service - Genera i file necessari per le PWA
 */

import Dexie from 'dexie';
import { APP_TYPES, CATEGORIES } from '../utils/constants.js';

class PWAGeneratorService {
  constructor() {
    if (PWAGeneratorService.instance) {
      return PWAGeneratorService.instance;
    }
    PWAGeneratorService.instance = this;
    this.initialized = false;
  }

  /**
   * Inizializza il servizio
   */
  async initialize() {
    if (this.initialized) return;
      this.initialized = true;
  }

  /**
   * Genera automaticamente i file PWA per un'app appna installata
   * @param {number} appId - ID dell'app installata
   * @param {Object} appData - Dati dell'app
   */
  async generatePWAForApp(appId, appData) {
    try {
      // Assicurati che il servizio sia inizializzato
      if (!this.initialized) {
        await this.initialize();
      }
      
      DEBUG.log(`🚀 Generazione PWA automatica per app ${appId}: ${appData.name}`);
      
      // Genera il manifest PWA
      const manifest = this.generateManifest(appId, appData);
      
      // Genera il service worker
      const serviceWorker = this.generateServiceWorker(appId, appData);
      
      // Genera l'HTML wrapper PWA
      const htmlWrapper = this.generateHTMLWrapper(appId, appData);
      
      // Salva i file PWA nel database usando IndexedDB direttamente
      await this.savePWAFiles(appId, {
        manifest,
        serviceWorker,
        htmlWrapper
      });
      
      DEBUG.log(`✅ PWA generata per app ${appId}`);
      
    } catch (error) {
      DEBUG.error('Errore generazione PWA:', error);
    }
  }

  /**
   * Genera il manifest.json per l'app
   */
  generateManifest(appId, appData) {
    const manifest = {
      name: appData.name,
      short_name: appData.name.substring(0, 12),
      description: appData.description || `App ${appData.name}`,
      start_url: '.',  // URL relativo alla directory corrente
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#1976d2',
      orientation: 'any',
      scope: './',  // Scope relativo alla directory corrente
      lang: 'it',
      dir: 'ltr',
      categories: [appData.category || 'productivity'],
      icons: this.generateIcons(appData.icon),
      screenshots: [],
      shortcuts: [
        {
          name: appData.name,
          short_name: appData.name.substring(0, 12),
          description: appData.description || `Avvia ${appData.name}`,
          url: '.', // URL relativo alla directory corrente
          icons: this.generateIcons(appData.icon, '96x96')
        }
      ]
    };

    return manifest;
  }

  /**
   * Genera le icone per il manifest
   */
  generateIcons(icon, size = '192x192') {
    if (!icon) {
      return [{
        src: '/assets/icons/icon-192x192.png',
        sizes: size,
        type: 'image/png'
      }];
    }

    // Se è un'emoji, usa l'icona di default
    if (icon.startsWith('data:image/') || icon.startsWith('http')) {
      return [{
        src: icon,
        sizes: size,
        type: 'image/png'
      }];
    }

    // Per emoji, usa l'icona di default
    return [{
      src: '/assets/icons/icon-192x192.png',
      sizes: size,
      type: 'image/png'
    }];
  }

  /**
   * Genera il service worker per l'app
   */
  generateServiceWorker(appId, appData) {
    return `
// Service Worker per ${appData.name}
const CACHE_NAME = 'aideas-app-${appId}-v1';
const STATIC_CACHE = 'aideas-static-${appId}-v1';

// File da cacheare
const STATIC_FILES = [
  '/app/${appId}/',
  '/app/${appId}/index.html',
  '/app/${appId}/manifest.json'
];

// Installa il service worker
self.addEventListener('install', (event) => {
  DEBUG.log('Service Worker installato per ${appData.name}');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
  );
});

// Attiva il service worker
self.addEventListener('activate', (event) => {
  DEBUG.log('Service Worker attivato per ${appData.name}');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercetta le richieste
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Gestisci richieste per file locali dell'app
  if (url.pathname.startsWith('/app/${appId}/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request);
        })
    );
  }
});

// Gestisci messaggi dal main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
    `.trim();
  }

  /**
   * Genera l'HTML wrapper PWA per l'app
   */
  generateHTMLWrapper(appId, appData) {
    const isHTMLApp = appData.type === 'html' && appData.content;
    const isURLApp = appData.type === 'url' && appData.url;
    
    let content = '';
    
    if (isHTMLApp) {
      // Per app HTML, inserisci il contenuto direttamente
      content = appData.content;
    } else if (isURLApp) {
      // Per app URL, crea un iframe
      content = `
        <iframe 
          src="${appData.url}" 
          style="width:100%;height:100%;border:none;" 
          title="${appData.name}"
          allow="fullscreen; camera; microphone; geolocation"
        ></iframe>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appData.name}</title>
  <meta name="description" content="${appData.description || ''}">
  <meta name="theme-color" content="#1976d2">
  <link rel="manifest" href="/app/${appId}/manifest.json">
  <link rel="icon" href="${appData.icon || '/assets/icons/favicon.png'}">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      overflow: hidden;
    }
    
    #app-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    #app-header {
      background: #1976d2;
      color: white;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    #app-title {
      font-weight: 500;
    }
    
    #app-content {
      flex: 1;
      overflow: hidden;
    }
    
    .back-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .back-button:hover {
      background: rgba(255,255,255,0.1);
    }
    
    @media (display-mode: standalone) {
      #app-header {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div id="app-container">
    <div id="app-header">
      <button class="back-button" onclick="window.close()">← Chiudi</button>
      <div id="app-title">${appData.name}</div>
      <div></div>
    </div>
    <div id="app-content">
      ${content}
    </div>
  </div>
  
  <script>
    // Registra il service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/app/${appId}/sw.js')
        .then((registration) => {
          DEBUG.log('Service Worker registrato:', registration);
        })
        .catch((error) => {
          DEBUG.error('Errore registrazione Service Worker:', error);
        });
    }
    
    // Gestisci installazione PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });
    
    // Gestisci messaggi dal service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'RELOAD') {
        window.location.reload();
      }
    });
  </script>
</body>
</html>
    `.trim();
  }

  /**
   * Salva i file PWA nel database
   */
  async savePWAFiles(appId, files) {
    try {
      // Assicurati che il servizio sia inizializzato
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Usa IndexedDB direttamente per evitare dipendenze circolari
      const db = new Dexie('AIdeas_DB');
      db.version(1).stores({
        appFiles: '++id, appId, filename, content, size, mimeType'
      });
      
      // Salva manifest.json
      await db.appFiles.add({
        appId,
        filename: 'manifest.json',
        content: JSON.stringify(files.manifest, null, 2),
        mimeType: 'application/json',
        size: JSON.stringify(files.manifest).length
      });

      // Salva service worker
      await db.appFiles.add({
        appId,
        filename: 'sw.js',
        content: files.serviceWorker,
        mimeType: 'application/javascript',
        size: files.serviceWorker.length
      });

      // Salva HTML wrapper
      await db.appFiles.add({
        appId,
        filename: 'index.html',
        content: files.htmlWrapper,
        mimeType: 'text/html',
        size: files.htmlWrapper.length
      });

      await db.close();
      DEBUG.log(`✅ File PWA salvati per app ${appId}`);
    } catch (error) {
      DEBUG.error('Errore salvataggio file PWA:', error);
    }
  }

  /**
   * Ottieni i file PWA per un'app
   */
  async getPWAFiles(appId) {
    try {
      // Assicurati che il servizio sia inizializzato
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Usa IndexedDB direttamente per evitare dipendenze circolari
      const db = new Dexie('AIdeas_DB');
      db.version(1).stores({
        appFiles: '++id, appId, filename, content, size, mimeType'
      });
      
      const files = await db.appFiles
        .where('appId')
        .equals(appId)
        .toArray();

      const pwaFiles = {};
      files.forEach(file => {
        if (['manifest.json', 'sw.js', 'index.html'].includes(file.filename)) {
          pwaFiles[file.filename] = {
            content: file.content,
            mimeType: file.mimeType
          };
        }
      });

      await db.close();
      return pwaFiles;
    } catch (error) {
      DEBUG.error('Errore recupero file PWA:', error);
      return null;
    }
  }

  /**
   * Verifica se un'app ha i file PWA generati
   */
  async hasPWAFiles(appId) {
    try {
      // Assicurati che il servizio sia inizializzato
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Usa IndexedDB direttamente per evitare dipendenze circolari
      const db = new Dexie('AIdeas_DB');
      db.version(1).stores({
        appFiles: '++id, appId, filename, content, size, mimeType'
      });
      
      const files = await db.appFiles
        .where('appId')
        .equals(appId)
        .and(file => ['manifest.json', 'sw.js', 'index.html'].includes(file.filename))
        .count();

      await db.close();
      return files >= 3; // Deve avere almeno manifest, sw e html
    } catch (error) {
      DEBUG.error('Errore verifica file PWA:', error);
      return false;
    }
  }
}

export default PWAGeneratorService; 