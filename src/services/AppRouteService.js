/**
 * App Route Service - Gestisce le route /app/:id per servire app in nuova scheda
 * Intercetta le richieste per /app/:id e serve i file dallo storage locale
 */

import StorageService from './StorageService.js';

class AppRouteService {
  constructor() {
    if (AppRouteService.instance) {
      return AppRouteService.instance;
    }
    AppRouteService.instance = this;
    this.storageService = StorageService;
    this.initialized = false;
    this.blobUrls = new Map(); // Mappa per tenere traccia dei blob URLs
  }

  /**
   * Inizializza i servizi in modo lazy
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.initialized = true;
      console.log('✅ AppRouteService inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione AppRouteService:', error);
      this.initialized = true;
    }
  }

  /**
   * Crea un blob URL per un file
   */
  createBlobUrl(content, mimeType, isText = true) {
    let blob;
    if (isText) {
      blob = new Blob([content], { type: mimeType });
    } else {
      // Gestione file binari (base64)
      const binaryString = atob(content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: mimeType });
    }
    return URL.createObjectURL(blob);
  }

  /**
   * Pulisce i blob URLs creati
   */
  cleanupBlobUrls() {
    for (const url of this.blobUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls.clear();
  }

  /**
   * Apri un'app in una nuova finestra
   */
  async openAppInNewTab(appId) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const app = await this.storageService.getApp(appId);
      if (!app) {
        console.error('App non trovata:', appId);
        return;
      }

      // Se è un'app URL, apri direttamente l'URL esterno
      if (app.type === 'url' && app.url) {
        const features = 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no';
        window.open(app.url, `app-${appId}`, features);
        return;
      }

      // Pulisci eventuali blob URLs precedenti
      this.cleanupBlobUrls();

      // Recupera tutti i file dell'app
      const appFiles = await this.storageService.getAppFiles(appId);
      
      // Crea blob URLs per tutti i file
      const blobUrlMap = new Map();
      for (const file of appFiles) {
        const isText = this.isTextFile(file.filename);
        const blobUrl = this.createBlobUrl(file.content, file.mimeType, isText);
        blobUrlMap.set(file.filename, blobUrl);
        this.blobUrls.set(file.filename, blobUrl);
      }

      // Modifica l'HTML per usare i blob URLs
      let indexHtml = app.content;
      
      // Sostituisci tutti i riferimenti relativi con blob URLs
      for (const [filename, blobUrl] of blobUrlMap.entries()) {
        if (filename !== 'index.html') {
          // Sostituisci sia con che senza "./" all'inizio
          const patterns = [
            new RegExp(`(href|src)=["']${filename}["']`, 'g'),
            new RegExp(`(href|src)=["']\\./${filename}["']`, 'g'),
            new RegExp(`(href|src)=["']app://${filename}["']`, 'g')
          ];
          
          patterns.forEach(pattern => {
            indexHtml = indexHtml.replace(pattern, `$1="${blobUrl}"`);
          });
        }
      }

      // Apri la nuova finestra con dimensioni e opzioni specifiche
      const features = 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no';
      const appWindow = window.open('', `app-${appId}`, features);
      
      if (appWindow) {
        appWindow.document.write(indexHtml);
        appWindow.document.close();
        
        // Cleanup URLs dopo 60 secondi
        setTimeout(() => this.cleanupBlobUrls(), 60000);
      } else {
        console.error('Impossibile aprire la finestra. Controlla le impostazioni popup.');
      }

    } catch (error) {
      console.error('Errore apertura app:', error);
      this.cleanupBlobUrls();
    }
  }

  /**
   * Verifica se un file è un file di testo
   */
  isTextFile(filename) {
    const textExtensions = ['.html', '.htm', '.css', '.js', '.txt', '.json', '.xml', '.svg', '.md'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Ottieni il MIME type di un file
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'txt': 'text/plain',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Ottieni l'URL di un'app
   */
  getAppUrl(appId) {
    return `/app/${appId}`;
  }
}

export default new AppRouteService(); 