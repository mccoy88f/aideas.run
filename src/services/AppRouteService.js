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
    this.storageService = StorageService; // Uso l'istanza singleton invece di crearne una nuova
    this.initialized = false;
  }

  /**
   * Inizializza i servizi in modo lazy
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
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
      
      // Per ora, serviamo una pagina HTML semplice per le app
      // In futuro, potremo implementare la generazione PWA qui
      const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.name} - AIdeas</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .app-info { 
            margin-bottom: 20px; 
        }
        .app-content { 
            border: 1px solid #ddd; 
            padding: 20px; 
            border-radius: 4px; 
            background: #fafafa; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${app.name}</h1>
            <p>App gestita da AIdeas</p>
        </div>
        <div class="app-info">
            <p><strong>Descrizione:</strong> ${app.description || 'Nessuna descrizione disponibile'}</p>
            <p><strong>Categoria:</strong> ${app.category || 'Non categorizzata'}</p>
            <p><strong>Tipo:</strong> ${app.type || 'Sconosciuto'}</p>
        </div>
        <div class="app-content">
            <h3>Contenuto dell'app</h3>
            <p>Questa è una pagina temporanea per l'app "${app.name}".</p>
            <p>La funzionalità PWA completa sarà implementata in futuro.</p>
        </div>
    </div>
</body>
</html>`;

      return new Response(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
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
      
      // Per ora, non generiamo file PWA - serviamo la pagina HTML semplice
      
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
      
      // Per ora, non generiamo file PWA - serviamo la pagina HTML semplice
      
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