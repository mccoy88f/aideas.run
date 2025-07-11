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
    }
  }

  /**
   * Restituisce il MIME type per un file in base all'estensione
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
   * Verifica se un file è un file di testo in base all'estensione
   */
  isTextFile(filename) {
    const textExtensions = ['.html', '.htm', '.css', '.js', '.txt', '.json', '.xml', '.svg', '.md'];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Crea un blob URL per un file
   */
  createBlobUrl(content, isText, mimeType) {
    let blob;
    if (isText) {
      blob = new Blob([content], { type: mimeType });
    } else {
      // File binario (base64)
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
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls.clear();
  }

  /**
   * Apre l'app in una nuova finestra
   */
  async openAppInNewTab(appId) {
    try {
      // Recupera i file dell'app
      const appFiles = await this.storageService.getAppFiles(appId);
      if (!appFiles || !appFiles.files || !appFiles.files['index.html']) {
        throw new Error('File index.html non trovato!');
      }

      // Crea blob URLs per tutti i file
      const blobUrls = {};
      for (const [filename, fileData] of Object.entries(appFiles.files)) {
        const isText = this.isTextFile(filename);
        const mimeType = this.getMimeType(filename);
        blobUrls[filename] = this.createBlobUrl(fileData.content, isText, mimeType);
        this.blobUrls.set(filename, blobUrls[filename]);
      }

      // Modifica l'HTML principale per usare i blob URLs
      let indexHtml = appFiles.files['index.html'].content;
      
      // Sostituisci tutti i riferimenti relativi con blob URLs
      for (const [filename, blobUrl] of Object.entries(blobUrls)) {
        if (filename !== 'index.html') {
          // Sostituisci sia con che senza "./" all'inizio
          const patterns = [
            new RegExp(`(href|src)=["']${filename}["']`, 'g'),
            new RegExp(`(href|src)=["']\\./${filename}["']`, 'g'),
            new RegExp(`(href|src)=["']\\.\\.\/${filename}["']`, 'g'),
            new RegExp(`(href|src)=["']\\/${filename}["']`, 'g'),
            new RegExp(`(href|src)=["']app:\\/\\/${filename}["']`, 'g')
          ];
          
          patterns.forEach(pattern => {
            indexHtml = indexHtml.replace(pattern, `$1="${blobUrl}"`);
          });
        }
      }

      // Apri la nuova finestra
      const subAppWindow = window.open('', 'subapp', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes');
      
      if (subAppWindow) {
        subAppWindow.document.write(indexHtml);
        subAppWindow.document.close();
        
        // Cleanup URLs dopo un po' di tempo
        setTimeout(() => this.cleanupBlobUrls(), 60000);
        
        return true;
      } else {
        throw new Error('Impossibile aprire la finestra. Controlla le impostazioni popup.');
      }
    } catch (error) {
      console.error('❌ Errore apertura app:', error);
      throw error;
    }
  }
}

export default new AppRouteService(); 