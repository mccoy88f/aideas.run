/**
 * App Route Service - Gestisce le route /app/:id per servire app come PWA standalone
 * Intercetta le richieste per /app/:id e serve i file PWA generati
 */

import StorageService from './StorageService.js';
import PWAGeneratorService from './PWAGeneratorService.js';

class AppRouteService {
  constructor() {
    if (AppRouteService.instance) {
      return AppRouteService.instance;
    }
    AppRouteService.instance = this;
    this.storageService = null;
    this.pwaGenerator = null;
    this.initialized = false;
  }

  /**
   * Inizializza i servizi in modo lazy
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Inizializza i servizi in modo sicuro
      if (!this.storageService) {
        this.storageService = new StorageService();
      }
      
      // Inizializza PWAGeneratorService in modo sicuro
      if (!this.pwaGenerator) {
        try {
          this.pwaGenerator = new PWAGeneratorService();
          await this.pwaGenerator.initialize();
        } catch (pwaError) {
          console.warn('PWAGeneratorService non disponibile:', pwaError);
          this.pwaGenerator = null;
        }
      }
      
      // Inizializza solo il routing, non i servizi
      this.init();
      this.initialized = true;
      
      console.log('✅ AppRouteService inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione AppRouteService:', error);
      // Non bloccare l'inizializzazione se c'è un errore
      this.initialized = true;
    }
  }

  /**
   * Inizializza il servizio di routing
   */
  init() {
    // Intercetta le richieste per /app/:id
    this.interceptAppRoutes();
    
    // Gestisci la navigazione programmatica
    this.handleProgrammaticNavigation();
  }

  /**
   * Intercetta le richieste per le route delle app
   */
  interceptAppRoutes() {
    // Intercetta fetch per le route /app/:id
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      const urlObj = new URL(url, window.location.origin);
      
      // Se la richiesta è per una route app
      if (urlObj.pathname.startsWith('/app/')) {
        return this.handleAppRoute(urlObj, options);
      }
      
      return originalFetch(url, options);
    };

    // Intercetta anche le richieste XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      const urlObj = new URL(url, window.location.origin);
      
      if (urlObj.pathname.startsWith('/app/')) {
        // Gestisci la richiesta app
        this._appRouteUrl = urlObj;
        this._appRouteOptions = { method, ...args };
      }
      
      return originalXHROpen.call(this, method, url, ...args);
    };
  }

  /**
   * Gestisci una richiesta per una route app
   */
  async handleAppRoute(urlObj, options = {}) {
    try {
      // Assicurati che i servizi siano inizializzati
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Verifica che i servizi siano disponibili
      if (!this.storageService) {
        console.warn('StorageService non disponibile per AppRouteService');
        return new Response('Servizio non disponibile', { status: 503 });
      }
      
      const pathParts = urlObj.pathname.split('/');
      const appId = parseInt(pathParts[2]); // /app/:id/...
      const requestedFile = pathParts.slice(3).join('/') || 'index.html';
      
      console.log(`📱 Richiesta app route: ${appId} - ${requestedFile}`);
      
      // Recupera i dati dell'app
      const app = await this.storageService.getApp(appId);
      if (!app) {
        return new Response('App non trovata', { status: 404 });
      }
      
      // Gestisci file PWA se disponibile
      if (this.pwaGenerator) {
        const hasPWA = await this.pwaGenerator.hasPWAFiles(appId);
        if (!hasPWA) {
          // Genera i file PWA se non esistono
          await this.pwaGenerator.generatePWAForApp(appId, app);
        }
        
        // Ottieni i file PWA
        const pwaFiles = await this.pwaGenerator.getPWAFiles(appId);
        if (pwaFiles) {
          // Servi il file richiesto
          const file = pwaFiles[requestedFile];
          if (file) {
            // Crea la risposta
            const response = new Response(file.content, {
              status: 200,
              headers: {
                'Content-Type': file.mimeType,
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*'
              }
            });
            return response;
          }
        }
      }
      
      // Fallback: se non ci sono file PWA, mostra una pagina di errore
      return new Response('File PWA non trovati', { status: 404 });
      
    } catch (error) {
      console.error('Errore gestione route app:', error);
      return new Response('Errore interno', { status: 500 });
    }
  }

  /**
   * Gestisci la navigazione programmatica
   */
  handleProgrammaticNavigation() {
    // Intercetta i click sui link che puntano a /app/:id
    document.addEventListener('click', async (event) => {
      const link = event.target.closest('a');
      if (link && link.href && link.href.includes('/app/')) {
        event.preventDefault();
        
        const url = new URL(link.href);
        const appId = url.pathname.split('/')[2];
        
        // Apri l'app in una nuova finestra/tab
        this.openAppAsPWA(appId);
      }
    });
  }

  /**
   * Apri un'app come PWA standalone
   */
  async openAppAsPWA(appId) {
    try {
      // Assicurati che i servizi siano inizializzati
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Verifica che i servizi siano disponibili
      if (!this.storageService) {
        console.error('StorageService non disponibile per AppRouteService (openAppAsPWA)');
        return;
      }
      
      const app = await this.storageService.getApp(appId);
      if (!app) {
        console.error('App non trovata:', appId);
        return;
      }
      
      // Genera i file PWA se necessario
      if (this.pwaGenerator) {
        const hasPWA = await this.pwaGenerator.hasPWAFiles(appId);
        if (!hasPWA) {
          await this.pwaGenerator.generatePWAForApp(appId, app);
        }
      }
      
      // Apri l'app in una nuova finestra
      const appUrl = `${window.location.origin}/app/${appId}/`;
      console.log(`🚀 Apertura app PWA: ${appUrl}`);
      
      const newWindow = window.open(appUrl, `app-${appId}`, 
        'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!newWindow) {
        // Fallback: apri in nuova tab
        window.open(appUrl, '_blank');
      }
    } catch (error) {
      console.error('Errore apertura app PWA:', error);
    }
  }

  /**
   * Installa un'app come PWA sul dispositivo
   * Apre la pagina PWA per permettere l'installazione dal browser
   */
  async installAppAsPWA(appId) {
    try {
      // Assicurati che i servizi siano inizializzati
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Verifica che i servizi siano disponibili
      if (!this.storageService) {
        console.error('StorageService non disponibile per AppRouteService (installAppAsPWA)');
        return;
      }
      
      const app = await this.storageService.getApp(appId);
      if (!app) {
        console.error('App non trovata:', appId);
        return;
      }
      
      // Genera i file PWA se necessario
      if (this.pwaGenerator) {
        const hasPWA = await this.pwaGenerator.hasPWAFiles(appId);
        if (!hasPWA) {
          await this.pwaGenerator.generatePWAForApp(appId, app);
        }
      }
      
      // Apri l'app in una nuova finestra per permettere l'installazione PWA
      const appUrl = `${window.location.origin}/app/${appId}/`;
      console.log(`🚀 Apertura app PWA per installazione: ${appUrl}`);
      
      const newWindow = window.open(appUrl, `app-${appId}`, 
        'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!newWindow) {
        // Fallback: apri in nuova tab
        window.open(appUrl, '_blank');
      }
      
      // Mostra istruzioni per l'installazione
      console.log('📱 Per installare l\'app come PWA:');
      console.log('1. Apri la pagina appena aperta');
      console.log('2. Clicca sull\'icona di installazione nel browser (🔧 o 📱)');
      console.log('3. Segui le istruzioni per installare l\'app');
      
    } catch (error) {
      console.error('Errore installazione app PWA:', error);
    }
  }

  /**
   * Ottieni l'URL PWA per un'app
   */
  getAppPWAUrl(appId) {
    return `${window.location.origin}/app/${appId}/`;
  }

  /**
   * Verifica se un'app può essere aperta come PWA
   */
  async canOpenAsPWA(appId) {
    try {
      const app = await this.storageService.getApp(appId);
      if (!app) return false;
      
      // App URL non possono essere PWA standalone
      if (app.type === 'url' && app.url) return false;
      
      return true;
    } catch (error) {
      console.error('Errore verifica PWA:', error);
      return false;
    }
  }

  /**
   * Genera un QR code per l'URL PWA di un'app
   */
  generateAppQRCode(appId) {
    const appUrl = this.getAppPWAUrl(appId);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;
    return qrCodeUrl;
  }
}

export default AppRouteService; 