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
  }

  /**
   * Inizializza i servizi in modo lazy
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Inizializza il routing e la comunicazione tra finestre
      this.init();
      this.initMessageHandling();
      this.initialized = true;
      
      console.log('✅ AppRouteService inizializzato con successo');
    } catch (error) {
      console.error('❌ Errore inizializzazione AppRouteService:', error);
      this.initialized = true;
    }
  }

  /**
   * Inizializza il servizio di routing
   */
  init() {
    // Intercetta le richieste per /app/:id
    this.interceptAppRoutes();
  }

  /**
   * Inizializza la gestione dei messaggi tra finestre
   */
  initMessageHandling() {
    // Gestisce i messaggi dalle finestre child
    window.addEventListener('message', async (event) => {
      // Verifica che il messaggio provenga dal nostro dominio
      if (event.origin !== window.location.origin) return;

      const { type, appId, filename } = event.data;
      
      if (type === 'REQUEST_APP_FILE') {
        try {
          // Recupera i file dell'app dallo storage
          const app = await this.storageService.getApp(appId);
          if (!app) {
            event.source.postMessage({ type: 'APP_FILE_ERROR', error: 'App non trovata' }, event.origin);
            return;
          }

          // Se è un'app URL, invia l'URL di redirect
          if (app.type === 'url' && app.url) {
            event.source.postMessage({ 
              type: 'APP_REDIRECT', 
              url: app.url 
            }, event.origin);
            return;
          }

          // Recupera il file richiesto
          const appFiles = await this.storageService.getAppFiles(appId);
          const requestedFile = appFiles.find(f => f.filename === filename);

          if (requestedFile) {
            // Invia il file alla finestra child
            event.source.postMessage({
              type: 'APP_FILE_CONTENT',
              filename,
              content: requestedFile.content,
              mimeType: requestedFile.mimeType
            }, event.origin);
          } else {
            event.source.postMessage({ 
              type: 'APP_FILE_ERROR', 
              error: 'File non trovato' 
            }, event.origin);
          }
        } catch (error) {
          console.error('Errore recupero file app:', error);
          event.source.postMessage({ 
            type: 'APP_FILE_ERROR', 
            error: 'Errore interno' 
          }, event.origin);
        }
      }
    });
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
  }

  /**
   * Gestisci una richiesta per una route app
   */
  async handleAppRoute(urlObj, options = {}) {
    try {
      // Se siamo nella finestra child, richiediamo i file alla finestra parent
      if (!window.opener) {
        return new Response('Questa pagina deve essere aperta dalla finestra principale', { status: 400 });
      }

      // Assicurati che i servizi siano inizializzati
      if (!this.initialized) {
        await this.initialize();
      }
      
      const pathParts = urlObj.pathname.split('/');
      const appId = parseInt(pathParts[2]); // /app/:id/...
      const requestedFile = pathParts.slice(3).join('/') || 'index.html';
      
      console.log(`📱 Richiesta app route: ${appId} - ${requestedFile}`);

      // Se è una richiesta per l'index.html, modifica i percorsi dei file per usare URL relativi
      if (requestedFile === 'index.html') {
        const app = await this.storageService.getApp(appId);
        if (app && app.content) {
          // Modifica i percorsi per usare URL relativi invece di app://
          const modifiedContent = app.content.replace(
            /(?:src|href)=["']app:\/\/([^"']*)["']/g,
            (match, path) => `${match.startsWith('src') ? 'src' : 'href'}="${path}"`
          );
          
          return new Response(modifiedContent, {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache'
            }
          });
        }
      }

      // Per altri file, usa il sistema di messaggi
      const responsePromise = new Promise((resolve, reject) => {
        // Handler per i messaggi dal parent
        const messageHandler = (event) => {
          if (event.origin !== window.location.origin) return;
          
          const { type, filename, content, mimeType, error, url } = event.data;
          
          if (filename === requestedFile) {
            window.removeEventListener('message', messageHandler);
            
            if (type === 'APP_FILE_CONTENT') {
              resolve(new Response(content, {
                status: 200,
                headers: {
                  'Content-Type': mimeType || 'text/plain',
                  'Cache-Control': 'no-cache'
                }
              }));
            } else if (type === 'APP_REDIRECT') {
              resolve(Response.redirect(url, 302));
            } else if (type === 'APP_FILE_ERROR') {
              reject(new Error(error));
            }
          }
        };

        // Aggiungi l'handler per i messaggi
        window.addEventListener('message', messageHandler);

        // Richiedi il file al parent
        window.opener.postMessage({
          type: 'REQUEST_APP_FILE',
          appId,
          filename: requestedFile
        }, window.location.origin);

        // Timeout dopo 5 secondi
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Timeout richiesta file'));
        }, 5000);
      });

      return await responsePromise;
      
    } catch (error) {
      console.error('Errore gestione route app:', error);
      return new Response(error.message || 'Errore interno', { status: 500 });
    }
  }

  /**
   * Apri un'app in una nuova scheda
   */
  async openAppInNewTab(appId) {
    try {
      // Assicurati che i servizi siano inizializzati
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
        window.open(app.url, `app-${appId}`);
        return;
      }
      
      // Per app HTML, usa il sistema di routing
      const appUrl = new URL(this.getAppUrl(appId), window.location.origin).href;
      console.log(`🚀 Apertura app in nuova scheda: ${appUrl}`);
      
      // Apri direttamente l'URL per usare il sistema di routing
      window.open(appUrl, `app-${appId}`);
    } catch (error) {
      console.error('Errore apertura app in nuova scheda:', error);
    }
  }

  /**
   * Ottieni l'URL per un'app
   */
  getAppUrl(appId) {
    return `/app/${appId}/`;
  }
}

export default AppRouteService; 