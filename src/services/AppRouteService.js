/**
 * App Route Service - Gestisce le route /app/:id per servire app come PWA standalone
 * Intercetta le richieste per /app/:id e serve i file PWA generati
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
    this.childWindows = new Set(); // Teniamo traccia delle finestre child aperte
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
    
    // Gestisci la navigazione programmatica
    this.handleProgrammaticNavigation();
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
      // Se siamo nella finestra child, richiediamo i file alla finestra parent
      if (!window.opener) {
        return new Response('Questa pagina deve essere aperta dalla finestra principale', { status: 400 });
      }

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

      // Se l'app è di tipo URL, reindirizza all'URL esterno
      if (app.type === 'url' && app.url) {
        return Response.redirect(app.url, 302);
      }

      // Recupera i file dell'app se è di tipo ZIP
      if (app.type === 'zip') {
        const appFiles = await this.storageService.getAppFiles(appId);
        const requestedFileContent = appFiles.find(f => f.filename === requestedFile);
        
        if (requestedFileContent) {
          return new Response(requestedFileContent.content, {
            status: 200,
            headers: {
              'Content-Type': requestedFileContent.mimeType || 'text/plain',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      }
      
      // Se non troviamo il file richiesto o l'app non è di tipo supportato,
      // mostriamo una pagina informativa
      const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.name} - AIdeas</title>
    <link rel="icon" href="/assets/icons/favicon.png" type="image/png">
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
            color: #333;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 12px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .header h1 {
            margin: 0;
            color: #1976d2;
        }
        .app-info { 
            margin-bottom: 20px; 
            line-height: 1.6;
        }
        .app-content { 
            border: 1px solid #e0e0e0; 
            padding: 20px; 
            border-radius: 8px; 
            background: #fafafa; 
            margin-top: 20px;
        }
        .app-type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            background: #e3f2fd;
            color: #1976d2;
            font-size: 14px;
            margin-top: 10px;
        }
        .action-button {
            display: inline-block;
            padding: 10px 20px;
            background: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            transition: background 0.2s;
        }
        .action-button:hover {
            background: #1565c0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${app.name}</h1>
            <div class="app-type-badge">${app.type || 'App'}</div>
        </div>
        <div class="app-info">
            <p><strong>Descrizione:</strong> ${app.description || 'Nessuna descrizione disponibile'}</p>
            <p><strong>Categoria:</strong> ${app.category || 'Non categorizzata'}</p>
            ${app.url ? `<p><strong>URL:</strong> <a href="${app.url}" target="_blank">${app.url}</a></p>` : ''}
        </div>
        <div class="app-content">
            <h3>Stato dell'app</h3>
            ${app.type === 'url' ? 
              `<p>Questa è un'app esterna. Clicca il pulsante sotto per aprirla.</p>
               <a href="${app.url}" class="action-button" target="_blank">Apri App</a>` :
              app.type === 'zip' ? 
              `<p>Questa è un'app locale. Il file richiesto "${requestedFile}" non è stato trovato.</p>` :
              `<p>Questa app è in fase di sviluppo. Le funzionalità complete saranno disponibili a breve.</p>`
            }
        </div>
    </div>
</body>
</html>`;

      // Crea una Promise che si risolverà quando riceviamo la risposta dal parent
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
                  'Cache-Control': 'public, max-age=3600'
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

      // Se è un'app URL, apri direttamente l'URL esterno
      if (app.type === 'url' && app.url) {
        window.open(app.url, `app-${appId}`);
        return;
      }
      
      // Altrimenti, apri la versione PWA dell'app
      const appUrl = `/app/${appId}/`;
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

      // Se è un'app URL, mostra un messaggio informativo
      if (app.type === 'url' && app.url) {
        console.log('Le app di tipo URL non possono essere installate come PWA');
        return;
      }
      
      // Apri l'app in una nuova finestra per permettere l'installazione PWA
      const appUrl = `/app/${appId}/`;
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
    return `/app/${appId}/`;
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
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + appUrl)}`;
    return qrCodeUrl;
  }
}

export default AppRouteService; 