import { DEBUG } from '../utils/debug.js';
import ErrorHandler from './ErrorHandler.js';
import { showToast } from '../utils/helpers.js';

/**
 * AIdeas - Google Drive Service (Versione semplificata per web pubbliche)
 * Sistema di sincronizzazione robusto e compatibile con applicazioni web pubbliche
 */

const GOOGLE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// Istanza singleton
let _singletonInstance = null;

export default class GoogleDriveService {
  constructor() {
    this.clientId = null;
    this.clientSecret = null;
    this.redirectUri = `${window.location.origin}/auth/google.html`;
    
    // Stato autenticazione
    this.isAuthenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    
    // Configurazione Google Drive
    this.aideasFolderId = null;
    this.syncFileName = 'aideas-sync.json';
    
    // Scopes richiesti (drive invece di drive.file per visibilità cartelle)
    this.scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    // Debug variabili d'ambiente
    DEBUG.log('🔧 GoogleDriveService inizializzato (versione web pubblica)');
    DEBUG.log('📋 Debug variabili d\'ambiente:', {
      hasClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
      hasClientSecret: !!import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      clientIdStart: import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 10) || 'MANCANTE',
      clientSecretStart: import.meta.env.VITE_GOOGLE_CLIENT_SECRET?.substring(0, 10) || 'MANCANTE',
      origin: window.location.origin,
      env: import.meta.env.MODE
    });
  }

  /**
   * Crea un'istanza configurata del servizio Google Drive (Singleton)
   * Usa le variabili d'ambiente per la configurazione automatica
   */
  static createConfiguredInstance() {
    if (_singletonInstance) {
      DEBUG.log('🔧 Riutilizzo istanza singleton GoogleDriveService');
      return _singletonInstance;
    }
    
    const service = new GoogleDriveService();
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    
    if (!clientId) {
      DEBUG.error('❌ VITE_GOOGLE_CLIENT_ID mancante!');
      DEBUG.error('📋 Per risolvere:');
      DEBUG.error('   1. Configura le variabili d\'ambiente negli Environment secrets di GitHub');
      DEBUG.error('   2. Vai su Settings > Environments > github-pages > Environment secrets');
      DEBUG.error('   3. Aggiungi VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_CLIENT_SECRET');
      throw new Error('Configurazione Google OAuth2 mancante');
    }

    service.configure(clientId, clientSecret);
    _singletonInstance = service;
    DEBUG.log('🔧 Creata nuova istanza singleton GoogleDriveService');
    return service;
  }

  /**
   * Configura le credenziali Google
   */
  configure(clientId, clientSecret = null) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    
    DEBUG.log('🔧 Credenziali Google configurate', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MANCANTE',
      hasClientSecret: !!clientSecret,
      appType: clientSecret ? 'confidenziale' : 'pubblica'
    });

    // Verifiche di sicurezza
    if (!clientId) {
      DEBUG.error('❌ Client ID mancante! Verificare configurazione variabili d\'ambiente');
      throw new Error('Client ID Google non configurato');
    }

    if (!clientSecret) {
      DEBUG.warn('⚠️ Client Secret mancante - modalità app web pubblica');
      DEBUG.log('📋 Per app web pubbliche, assicurarsi che:');
      DEBUG.log('   1. Le "Origini JavaScript autorizzate" includano: ' + window.location.origin);
      DEBUG.log('   2. Le "URI di reindirizzamento autorizzati" includano: ' + this.redirectUri);
    }
  }

  /**
   * Avvia il processo di autenticazione OAuth2 (semplificato)
   */
  async authenticate(usePopup = true) {
    try {
      DEBUG.log('🔐 Avvio autenticazione Google Drive...');
      
      if (!this.clientId) {
        throw new Error('Client ID Google non configurato');
      }

      // Prova prima a caricare token esistenti
      const loaded = await this.loadStoredCredentials();
      if (loaded) {
        DEBUG.log('✅ Token esistenti caricati e validi');
        return { success: true, user: this.userInfo };
      }

      // Genera parametri OAuth2 semplificati (senza PKCE)
      const state = this.generateRandomString(32);
      
      // Salva state per verifica
      sessionStorage.setItem('google_auth_state', state);

      const authParams = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        scope: this.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state: state
      });

      const authUrl = `${GOOGLE_OAUTH_BASE}/auth?${authParams.toString()}`;
      
      if (usePopup) {
        return await this.authenticateWithPopup(authUrl);
      } else {
        window.location.href = authUrl;
        return { pending: true };
      }

    } catch (error) {
      DEBUG.error('❌ Errore autenticazione Google:', error);
      throw error;
    }
  }

  /**
   * Autenticazione tramite popup (versione robusta)
   */
  async authenticateWithPopup(authUrl) {
    return new Promise((resolve, reject) => {
      DEBUG.log('🔐 Apertura popup autenticazione...');
      
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup bloccato dal browser'));
        return;
      }

      let checkInterval;
      let messageHandler;

      const cleanup = () => {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
        if (messageHandler) {
          window.removeEventListener('message', messageHandler);
        }
      };

      // Controlla se il popup è chiuso (con gestione Cross-Origin-Opener-Policy)
      checkInterval = setInterval(() => {
        try {
          if (popup.closed) {
            cleanup();
            reject(new Error('Autenticazione annullata dall\'utente'));
          }
        } catch (error) {
          // Ignora errori Cross-Origin-Opener-Policy
          DEBUG.log('⚠️ Cross-Origin-Opener-Policy rilevato (normale)');
        }
      }, 1000);

      // Listener per messaggi dal popup
      messageHandler = async (event) => {
        // Verifica origine per sicurezza
        if (event.origin !== window.location.origin) {
          DEBUG.log('⚠️ Messaggio da origine non valida ignorato:', event.origin);
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          cleanup();
          
          // Chiudi popup in modo sicuro
          try {
            popup.close();
          } catch (error) {
            DEBUG.log('⚠️ Impossibile chiudere popup (Cross-Origin-Opener-Policy)');
          }

          try {
            const result = await this.handleAuthCallback(event.data.code, event.data.state);
            resolve(result);
          } catch (error) {
            DEBUG.error('❌ Errore callback autenticazione:', error);
            reject(error);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          cleanup();
          
          try {
            popup.close();
          } catch (error) {
            DEBUG.log('⚠️ Impossibile chiudere popup (Cross-Origin-Opener-Policy)');
          }
          
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Gestisce il callback OAuth2
   */
  async handleAuthCallback(code, state) {
    try {
      DEBUG.log('🔐 Gestione callback autenticazione...');
      
      // Verifica state parameter
      const savedState = sessionStorage.getItem('google_auth_state');
      if (state !== savedState) {
        throw new Error('State parameter non valido');
      }

      // Scambia authorization code con token
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Salva token e carica info utente
      await this.saveTokens(tokens);
      await this.loadUserInfo();
      
      // Inizializza cartella AIdeas
      await this.initializeAIdeasFolder();
      
      // Pulisci session storage
      sessionStorage.removeItem('google_auth_state');
      
      DEBUG.log('✅ Autenticazione Google completata:', this.userInfo?.name);
      
      return {
        success: true,
        user: this.userInfo,
        tokens: {
          access_token: this.accessToken,
          expires_at: this.tokenExpiry
        }
      };

    } catch (error) {
      DEBUG.error('❌ Errore callback autenticazione:', error);
      throw error;
    }
  }

  /**
   * Scambia il codice di autorizzazione con i token di accesso
   */
  async exchangeCodeForTokens(code) {
    DEBUG.log('🔄 Scambio codice con token...');

    const tokenParams = {
      client_id: this.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri
    };

    // Per app web pubbliche, non aggiungiamo client_secret
    // Solo se esplicitamente configurato (app confidenziali)
    if (this.clientSecret) {
      tokenParams.client_secret = this.clientSecret;
      DEBUG.log('🔄 Usando client_secret per app confidenziale');
    } else {
      DEBUG.log('🔄 Usando configurazione app web pubblica (senza client_secret)');
    }

    DEBUG.log('🔄 Parametri token:', {
      client_id: this.clientId.substring(0, 10) + '...',
      redirect_uri: this.redirectUri,
      hasClientSecret: !!this.clientSecret,
      appType: this.clientSecret ? 'confidenziale' : 'pubblica'
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(tokenParams)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error_description || errorData.error || 'Errore sconosciuto';
      } catch {
        errorMessage = errorText || 'Errore sconosciuto';
      }

      DEBUG.error('❌ Errore exchange token:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });

      // Messaggio di errore specifico per client_secret mancante
      if (errorMessage.includes('client_secret') || errorMessage.includes('Client authentication failed')) {
        throw new Error(`🔧 Configurazione OAuth2 non valida

❌ Il client_secret è mancante o non valido!

📋 Passaggi per risolvere:
1. Vai su Google Cloud Console
2. APIs & Services > Credentials  
3. Crea/Modifica OAuth 2.0 Client ID
4. Tipo: "Web application"
5. COPIA sia Client ID che Client Secret
6. Configura variabili d'ambiente:
   - VITE_GOOGLE_CLIENT_ID
   - VITE_GOOGLE_CLIENT_SECRET

📖 Guida completa: https://github.com/mccoy88f/aideas.run/blob/main/GOOGLE_OAUTH_SETUP.md

🔍 Errore tecnico: ${errorMessage}`);
      }

      // Errore origin_mismatch - il più comune secondo l'utente
      if (errorMessage.includes('origin_mismatch') || errorMessage.includes('Unauthorized')) {
        throw new Error(`🚨 ERRORE PIÙ COMUNE: origin_mismatch

❌ Le "Origini JavaScript autorizzate" NON sono configurate correttamente!

📋 Risolvi così:
1. Vai su Google Cloud Console > Credentials
2. Modifica le credenziali OAuth2 
3. Aggiungi ESATTAMENTE: ${window.location.origin}
4. Salva e riprova

⚠️ ATTENZIONE: NON aggiungere "/" alla fine dell'URL!
✅ Corretto: ${window.location.origin}
❌ Errato: ${window.location.origin}/

🔗 Guida completa: https://github.com/mccoy88f/aideas.run/blob/main/GOOGLE_OAUTH_SETUP.md`);
      }

      throw new Error(`Token exchange failed: ${errorMessage}`);
    }

    const tokens = await response.json();
    DEBUG.log('✅ Token ottenuti con successo');
    
    return tokens;
  }

  /**
   * Salva i token e aggiorna lo stato
   */
  async saveTokens(tokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
    this.isAuthenticated = true;

    // Salva in localStorage
    await this.saveCredentials();
  }

  /**
   * Carica informazioni utente
   */
  async loadUserInfo() {
    try {
      const response = await this.makeAuthenticatedRequest(GOOGLE_USERINFO_URL);
      this.userInfo = await response.json();
      
      DEBUG.log('👤 Info utente caricate:', this.userInfo.name);
    } catch (error) {
      DEBUG.error('❌ Errore caricamento info utente:', error);
      throw error;
    }
  }

  /**
   * Verifica se l'utente è attualmente autenticato
   */
  async checkAuthentication() {
    try {
      // Controlla se abbiamo token validi
      if (!this.accessToken) {
        const loaded = await this.loadStoredCredentials();
        if (!loaded) {
          return false;
        }
      }

      // Verifica se il token è scaduto
      if (this.tokenExpiry && Date.now() >= this.tokenExpiry.getTime()) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          return false;
        }
      }

      // Test della connettività e carica info utente
      const response = await this.makeAuthenticatedRequest(GOOGLE_USERINFO_URL);
      if (!response.ok) {
        return false;
      }

      // Carica le informazioni utente se non le abbiamo
      if (!this.userInfo) {
        await this.loadUserInfo();
      }

      this.isAuthenticated = true;
      return true;

    } catch (error) {
      DEBUG.warn('⚠️ Controllo autenticazione fallito:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Refresh del token di accesso
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('Refresh token non disponibile');
      }

      DEBUG.log('🔄 Refresh token in corso...');

      const tokenParams = {
        client_id: this.clientId,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      };

      // Per app web pubbliche, non aggiungiamo client_secret
      if (this.clientSecret) {
        tokenParams.client_secret = this.clientSecret;
        DEBUG.log('🔄 Refresh con client_secret per app confidenziale');
      } else {
        DEBUG.log('🔄 Refresh per app web pubblica (senza client_secret)');
      }

      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(tokenParams)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error_description || errorData.error || 'Errore sconosciuto';
        } catch {
          errorMessage = errorText || 'Errore sconosciuto';
        }

        DEBUG.error('❌ Errore refresh token:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });

        // Messaggio di errore specifico per client_secret mancante
        if (errorMessage.includes('client_secret') || errorMessage.includes('Client authentication failed')) {
          throw new Error(`🔧 Configurazione OAuth2 non valida

❌ Il client_secret è mancante o non valido durante il refresh!

📋 Passaggi per risolvere:
1. Vai su Google Cloud Console
2. APIs & Services > Credentials  
3. Crea/Modifica OAuth 2.0 Client ID
4. Tipo: "Web application"
5. NON usare client_secret per app web pubbliche
6. Configura origins: https://aideas.run

📖 Guida completa: https://github.com/mccoy88f/aideas.run/blob/main/GOOGLE_OAUTH_SETUP.md

🔍 Errore tecnico: ${errorMessage}`);
        }

        throw new Error(`Token refresh failed: ${errorMessage}`);
      }

      const tokens = await response.json();
      
      this.accessToken = tokens.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
      
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
      }

      await this.saveCredentials();
      
      DEBUG.log('✅ Token aggiornato con successo');
      return true;

    } catch (error) {
      DEBUG.error('❌ Errore refresh token:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Inizializza la cartella AIdeas su Google Drive
   */
  async initializeAIdeasFolder() {
    try {
      DEBUG.log('📁 Inizializzazione cartella AIdeas...');
      
      // Cerca cartella esistente
      const folders = await this.searchFiles({
        name: 'AIdeas',
        mimeType: 'application/vnd.google-apps.folder'
      });

      if (folders.length > 0) {
        this.aideasFolderId = folders[0].id;
        DEBUG.log('📁 Cartella AIdeas trovata:', this.aideasFolderId);
      } else {
        // Crea nuova cartella
        const folderData = {
          name: 'AIdeas',
          mimeType: 'application/vnd.google-apps.folder'
        };

        const response = await this.makeAuthenticatedRequest(`${GOOGLE_API_BASE}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(folderData)
        });

        if (!response.ok) {
          throw new Error('Errore creazione cartella AIdeas');
        }

        const folder = await response.json();
        this.aideasFolderId = folder.id;
        
        DEBUG.log('📁 Cartella AIdeas creata:', this.aideasFolderId);
      }

    } catch (error) {
      DEBUG.error('❌ Errore inizializzazione cartella:', error);
      throw error;
    }
  }

  /**
   * Carica dati di sincronizzazione da Google Drive
   */
  async downloadSyncData() {
    return await ErrorHandler.withRetry(async () => {
      DEBUG.log('⬇️ Download dati sincronizzazione...');
      
      if (!await this.checkAuthentication()) {
        throw new Error('Autenticazione richiesta');
      }

      if (!this.aideasFolderId) {
        await this.initializeAIdeasFolder();
      }

      // Cerca file di sincronizzazione
      const files = await this.searchFiles({
        name: this.syncFileName,
        parents: [this.aideasFolderId]
      });

      if (files.length === 0) {
        throw new Error('File di sincronizzazione non trovato');
      }

      const syncFile = files[0];
      
      // Verifica se il file ha dimensioni valide
      if (syncFile.size === 0 || syncFile.size === '0') {
        DEBUG.warn('⚠️ File di sincronizzazione vuoto rilevato');
        throw new Error('File di sincronizzazione vuoto - probabilmente corrotto');
      }
      
      // Scarica contenuto file
      const response = await this.makeAuthenticatedRequest(
        `${GOOGLE_API_BASE}/files/${syncFile.id}?alt=media`
      );

      if (!response.ok) {
        throw new Error(`Errore download file: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      
      // Validazione contenuto prima del parsing
      if (!content || content.trim().length === 0) {
        DEBUG.warn('⚠️ Contenuto file vuoto dopo download');
        throw new Error('File di sincronizzazione vuoto - impossibile procedere');
      }

      let syncData;
      try {
        syncData = JSON.parse(content);
      } catch (parseError) {
        DEBUG.error('❌ Errore parsing JSON:', parseError);
        DEBUG.error('📄 Contenuto ricevuto (primi 200 caratteri):', content.substring(0, 200));
        
        // Verifica se il contenuto sembra essere HTML di errore
        if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
          throw new Error('Ricevuto contenuto HTML invece di JSON - possibile errore di autenticazione');
        }
        
        // Verifica se il contenuto è troncato
        if (content.length > 0 && !content.trim().endsWith('}')) {
          throw new Error('File di sincronizzazione troncato o corrotto - riprova la sincronizzazione');
        }
        
        throw new Error(`Errore parsing dati sincronizzazione: ${parseError.message}`);
      }

      // Validazione struttura dati
      if (!syncData || typeof syncData !== 'object') {
        throw new Error('Formato dati sincronizzazione non valido - oggetto root mancante');
      }

      if (!syncData.settings || typeof syncData.settings !== 'object') {
        throw new Error('Formato dati sincronizzazione non valido - settings mancanti');
      }

      if (!syncData.apps || !Array.isArray(syncData.apps)) {
        throw new Error('Formato dati sincronizzazione non valido - apps mancanti o non array');
      }

      if (!syncData.timestamp) {
        throw new Error('Formato dati sincronizzazione non valido - timestamp mancante');
      }

      if (!syncData.version) {
        throw new Error('Formato dati sincronizzazione non valido - version mancante');
      }

      DEBUG.log('✅ Dati sincronizzazione scaricati e validati:', {
        apps: syncData.apps.length,
        settingsCount: Object.keys(syncData.settings).length,
        timestamp: syncData.timestamp,
        version: syncData.version,
        fileSize: syncFile.size
      });

      return {
        success: true,
        data: syncData,
        fileInfo: {
          id: syncFile.id,
          name: syncFile.name,
          modifiedTime: syncFile.modifiedTime,
          size: syncFile.size
        }
      };

    }, {
      operationName: 'Download sincronizzazione Google Drive',
      retryStrategy: 'NETWORK_ERROR',
      maxRetries: 3,
      timeout: 30000,
      validateResult: (result) => {
        // Validazione aggiuntiva del risultato
        return result && result.success && result.data && result.data.settings && result.data.apps;
      }
    });
  }

  /**
   * Carica dati di sincronizzazione su Google Drive
   */
  async uploadSyncData(data) {
    return await ErrorHandler.withRetry(async () => {
      DEBUG.log('⬆️ Upload dati sincronizzazione...');
      
      if (!await this.checkAuthentication()) {
        throw new Error('Autenticazione richiesta');
      }

      if (!this.aideasFolderId) {
        await this.initializeAIdeasFolder();
      }

      // Usa direttamente il formato di backup manuale
      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });

      // Cerca file esistente
      const existingFiles = await this.searchFiles({
        name: this.syncFileName,
        parents: [this.aideasFolderId]
      });

      let response;
      
      if (existingFiles.length > 0) {
        // Aggiorna file esistente
        const fileId = existingFiles[0].id;
        response = await this.makeAuthenticatedRequest(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: content
          }
        );
      } else {
        // Crea nuovo file
        const metadata = {
          name: this.syncFileName,
          parents: [this.aideasFolderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        response = await this.makeAuthenticatedRequest(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            body: form
          }
        );
      }

      if (!response.ok) {
        throw new Error('Errore upload file');
      }

      const result = await response.json();

      DEBUG.log('✅ Dati sincronizzazione caricati:', {
        fileId: result.id,
        apps: data.apps?.length || 0,
        hasSettings: !!data.settings,
        timestamp: data.timestamp
      });

      return {
        success: true,
        fileId: result.id,
        uploadedAt: new Date().toISOString()
      };

    }, {
      operationName: 'Upload sincronizzazione Google Drive',
      retryStrategy: 'NETWORK_ERROR',
      maxRetries: 3,
      timeout: 60000
    });
  }

  /**
   * Cerca file su Google Drive
   */
  async searchFiles(criteria) {
    let query = '';
    
    if (criteria.name) {
      query += `name='${criteria.name}'`;
    }
    
    if (criteria.mimeType) {
      query += (query ? ' and ' : '') + `mimeType='${criteria.mimeType}'`;
    }
    
    if (criteria.parents) {
      query += (query ? ' and ' : '') + criteria.parents.map(p => `'${p}' in parents`).join(' and ');
    }

    const response = await this.makeAuthenticatedRequest(
      `${GOOGLE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size)`
    );

    if (!response.ok) {
      throw new Error('Errore ricerca file');
    }

    const result = await response.json();
    return result.files || [];
  }

  /**
   * Effettua una richiesta autenticata
   */
  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.accessToken) {
      throw new Error('Token di accesso non disponibile');
    }

    return await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      }
    });
  }

  /**
   * Salva le credenziali in localStorage
   */
  async saveCredentials() {
    try {
      const credentials = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry?.toISOString(),
        userInfo: this.userInfo,
        aideasFolderId: this.aideasFolderId
      };

      localStorage.setItem('google_drive_credentials', JSON.stringify(credentials));
      DEBUG.log('💾 Credenziali salvate');
    } catch (error) {
      DEBUG.error('❌ Errore salvataggio credenziali:', error);
    }
  }

  /**
   * Carica le credenziali da localStorage
   */
  async loadStoredCredentials() {
    try {
      const stored = localStorage.getItem('google_drive_credentials');
      if (!stored) {
        return false;
      }

      const credentials = JSON.parse(stored);
      
      this.accessToken = credentials.accessToken;
      this.refreshToken = credentials.refreshToken;
      this.tokenExpiry = credentials.tokenExpiry ? new Date(credentials.tokenExpiry) : null;
      this.userInfo = credentials.userInfo;
      this.aideasFolderId = credentials.aideasFolderId;

      // Verifica se i token sono ancora validi
      if (this.tokenExpiry && Date.now() >= this.tokenExpiry.getTime()) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          return false;
        }
      }

      this.isAuthenticated = true;
      DEBUG.log('✅ Credenziali caricate da storage');
      return true;

    } catch (error) {
      DEBUG.error('❌ Errore caricamento credenziali:', error);
      return false;
    }
  }

  /**
   * Logout e pulizia credenziali
   */
  async logout() {
    DEBUG.log('🔐 Logout Google Drive...');
    
    this.isAuthenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    this.aideasFolderId = null;
    
    localStorage.removeItem('google_drive_credentials');
    
    // Reset singleton
    _singletonInstance = null;
    DEBUG.log('🔧 Singleton reset');
    
    DEBUG.log('✅ Logout completato');
  }

  /**
   * Ottieni informazioni utente corrente
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * Verifica se questo dispositivo ha mai sincronizzato
   */
  hasDeviceEverSynced() {
    const syncStatus = localStorage.getItem('aideas_device_sync_status');
    return syncStatus === 'true';
  }

  /**
   * Marca il dispositivo come sincronizzato
   */
  markDeviceAsSynced() {
    localStorage.setItem('aideas_device_sync_status', 'true');
    DEBUG.log('✅ Dispositivo marcato come sincronizzato');
  }

  /**
   * Confronta le app locali e remote in modo granulare
   */
  compareAppsGranular(localApps, remoteApps) {
    const localMap = new Map();
    const remoteMap = new Map();
    
    // Crea mappe per confronto efficiente
    (localApps || []).forEach(app => {
      localMap.set(app.id, app);
    });
    
    (remoteApps || []).forEach(app => {
      remoteMap.set(app.id, app);
    });
    
    const comparison = {
      onlyLocal: [],     // App presenti solo in locale
      onlyRemote: [],    // App presenti solo in remoto
      conflicts: [],     // App presenti in entrambi ma diverse
      identical: [],     // App identiche
      totalLocal: localApps?.length || 0,
      totalRemote: remoteApps?.length || 0
    };
    
    // Analizza app locali
    localMap.forEach((localApp, id) => {
      if (remoteMap.has(id)) {
        const remoteApp = remoteMap.get(id);
        // Confronta timestamp di installazione/modifica
        const localTime = new Date(localApp.installDate || localApp.createdAt || 0).getTime();
        const remoteTime = new Date(remoteApp.installDate || remoteApp.createdAt || 0).getTime();
        
        if (localTime !== remoteTime || localApp.name !== remoteApp.name) {
          comparison.conflicts.push({
            id,
            local: localApp,
            remote: remoteApp,
            localTime,
            remoteTime
          });
        } else {
          comparison.identical.push(id);
        }
      } else {
        comparison.onlyLocal.push(localApp);
      }
    });
    
    // Analizza app remote non ancora processate
    remoteMap.forEach((remoteApp, id) => {
      if (!localMap.has(id)) {
        comparison.onlyRemote.push(remoteApp);
      }
    });
    
    DEBUG.log('📊 Confronto granulare app:', {
      onlyLocal: comparison.onlyLocal.length,
      onlyRemote: comparison.onlyRemote.length,
      conflicts: comparison.conflicts.length,
      identical: comparison.identical.length
    });
    
    return comparison;
  }

  /**
   * Rileva se è la prima sincronizzazione del dispositivo
   */
  isFirstDeviceSync(localData, remoteData) {
    // Se il dispositivo non ha mai sincronizzato
    if (!this.hasDeviceEverSynced()) {
      const localApps = localData.apps?.length || 0;
      const remoteApps = remoteData?.apps?.length || 0;
      
      // Prima sincronizzazione del dispositivo con dati sia locali che remoti
      if (localApps > 0 && remoteApps > 0) {
        return true;
      }
      
      // Prima sincronizzazione con solo dati locali (remoto vuoto o inesistente)
      if (localApps > 0 && remoteApps === 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Crea dati sincronizzati combinando intelligentemente locale e remoto
   */
  mergeAppsIntelligently(localData, remoteData, userChoices = {}) {
    const comparison = this.compareAppsGranular(localData.apps, remoteData.apps);
    const mergedApps = [];
    
    // Aggiungi app identiche
    comparison.identical.forEach(id => {
      const app = localData.apps.find(a => a.id === id);
      if (app) mergedApps.push(app);
    });
    
    // Aggiungi app solo locali (se non escluse dall'utente)
    comparison.onlyLocal.forEach(app => {
      if (userChoices.excludeLocal !== true) {
        mergedApps.push(app);
      }
    });
    
    // Aggiungi app solo remote (se non escluse dall'utente)
    comparison.onlyRemote.forEach(app => {
      if (userChoices.excludeRemote !== true) {
        mergedApps.push(app);
      }
    });
    
    // Gestisci conflitti
    comparison.conflicts.forEach(conflict => {
      const useLocal = userChoices.preferLocal === true || 
                      (userChoices.preferLocal !== false && conflict.localTime > conflict.remoteTime);
      
      mergedApps.push(useLocal ? conflict.local : conflict.remote);
    });
    
    // Combina settings (priorità a locale se non specificato diversamente)
    const mergedSettings = userChoices.preferRemoteSettings === true ? 
                          (remoteData.settings || localData.settings) : 
                          (localData.settings || remoteData.settings);
    
    return {
      ...localData,
      apps: mergedApps,
      settings: mergedSettings,
      timestamp: new Date().toISOString(),
      syncedAt: new Date().toISOString()
    };
  }

  /**
   * Controlla se è il primo avvio e se ci sono backup disponibili
   */
  async checkFirstTimeSetup() {
    try {
      DEBUG.log('🔍 Controllo setup iniziale...');
      
      // Controlla se il dispositivo è già stato sincronizzato
      const hasSynced = this.hasDeviceEverSynced();
      
      if (hasSynced) {
        DEBUG.log('✅ Dispositivo già sincronizzato in precedenza');
        return { isFirstTime: false, hasBackup: false };
      }
      
      // Controlla se ci sono app locali
      const localApps = await StorageService.getAllApps();
      const hasLocalApps = localApps && localApps.length > 0;
      
      DEBUG.log(`📱 App locali trovate: ${localApps.length}`);
      
      // Se ci sono app locali, non è il primo avvio
      if (hasLocalApps) {
        DEBUG.log('✅ App locali presenti, non è il primo avvio');
        return { isFirstTime: false, hasBackup: false };
      }
      
      // Controlla se ci sono backup su Google Drive
      let hasBackup = false;
      let backupData = null;
      
      try {
        if (await this.checkAuthentication()) {
          const result = await this.downloadSyncData();
          hasBackup = result && result.data && result.data.apps && result.data.apps.length > 0;
          if (hasBackup) {
            backupData = result.data;
            DEBUG.log(`📦 Backup trovato con ${result.data.apps.length} app`);
          } else {
            DEBUG.log('📦 Nessun backup valido trovato su Google Drive');
          }
        }
      } catch (error) {
        DEBUG.warn('⚠️ Errore controllo backup:', error.message);
        hasBackup = false;
      }
      
      DEBUG.log(`🔍 Risultato controllo setup: isFirstTime=true, hasBackup=${hasBackup}`);
      return { 
        isFirstTime: true, 
        hasBackup, 
        backupData 
      };
      
    } catch (error) {
      DEBUG.error('❌ Errore controllo setup iniziale:', error);
      return { isFirstTime: false, hasBackup: false };
    }
  }

  /**
   * Ripristina backup da Google Drive
   */
  async restoreBackup() {
    try {
      DEBUG.log('🔄 Ripristino backup da Google Drive...');
      
      if (!await this.checkAuthentication()) {
        throw new Error('Autenticazione richiesta per ripristino backup');
      }
      
      const result = await this.downloadSyncData();
      if (!result || !result.data) {
        throw new Error('Nessun backup trovato su Google Drive');
      }
      
      // Verifica che i dati siano validi
      if (!result.data.apps || !Array.isArray(result.data.apps)) {
        throw new Error('Formato backup non valido');
      }
      
      // Controlla la dimensione del backup per evitare errori di quota
      const backupSize = JSON.stringify(result.data).length;
      const maxSize = 50 * 1024 * 1024; // 50MB limite
      
      if (backupSize > maxSize) {
        throw new Error(`Backup troppo grande (${Math.round(backupSize / 1024 / 1024)}MB). Dimensione massima: 50MB`);
      }
      
      DEBUG.log(`📦 Backup valido: ${result.data.apps.length} app, ${Math.round(backupSize / 1024)}KB`);
      
      // Pulisci i dati locali esistenti prima del ripristino
      try {
        await StorageService.clearAllData();
        DEBUG.log('🧹 Dati locali puliti prima del ripristino');
      } catch (clearError) {
        DEBUG.warn('⚠️ Errore pulizia dati locali:', clearError.message);
      }
      
      // Importa i dati del backup
      await StorageService.importBackupData(result.data);
      
      // Marca il dispositivo come sincronizzato
      this.markDeviceAsSynced();
      
      DEBUG.log('✅ Backup ripristinato con successo');
      return { success: true, data: result.data };
      
    } catch (error) {
      DEBUG.error('❌ Errore ripristino backup:', error);
      
      // Gestisci errori specifici
      if (error.name === 'QuotaExceededError' || error.message.includes('QuotaExceededError')) {
        throw new Error('Spazio di archiviazione insufficiente. Libera spazio nel browser e riprova.');
      } else if (error.name === 'AbortError') {
        throw new Error('Operazione annullata. Riprova.');
      }
      
      throw error;
    }
  }

  /**
   * Sostituisce il backup su Google Drive con i dati locali
   */
  async replaceBackup(localData) {
    try {
      DEBUG.log('⬆️ Sostituzione backup su Google Drive...');
      
      if (!await this.checkAuthentication()) {
        throw new Error('Autenticazione richiesta per sostituzione backup');
      }
      
      // Carica tutti i dati locali se non forniti
      if (!localData) {
        const apps = await StorageService.getAllApps();
        const settings = await StorageService.getAllSettings();
        localData = {
          apps,
          settings,
          timestamp: new Date().toISOString(),
          deviceId: this.getDeviceId(),
          version: '1.0'
        };
      }
      
      // Verifica che i dati siano validi
      if (!localData.apps || !Array.isArray(localData.apps)) {
        throw new Error('Dati locali non validi');
      }
      
      // Controlla la dimensione dei dati per evitare errori di quota
      const dataSize = JSON.stringify(localData).length;
      const maxSize = 50 * 1024 * 1024; // 50MB limite
      
      if (dataSize > maxSize) {
        throw new Error(`Dati troppo grandi (${Math.round(dataSize / 1024 / 1024)}MB). Dimensione massima: 50MB`);
      }
      
      DEBUG.log(`📦 Dati locali validi: ${localData.apps.length} app, ${Math.round(dataSize / 1024)}KB`);
      
      // Carica i dati su Google Drive
      await this.uploadSyncData(localData);
      
      // Marca il dispositivo come sincronizzato
      this.markDeviceAsSynced();
      
      DEBUG.log('✅ Backup sostituito con successo');
      return { success: true };
      
    } catch (error) {
      DEBUG.error('❌ Errore sostituzione backup:', error);
      
      // Gestisci errori specifici
      if (error.name === 'QuotaExceededError' || error.message.includes('QuotaExceededError')) {
        throw new Error('Spazio di archiviazione insufficiente. Libera spazio nel browser e riprova.');
      } else if (error.name === 'AbortError') {
        throw new Error('Operazione annullata. Riprova.');
      }
      
      throw error;
    }
  }

  /**
   * Ottiene ID univoco del dispositivo
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('aideas_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('aideas_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Sincronizzazione bidirezionale con gestione app cancellate
   */
  async syncBidirectional(options = {}) {
    try {
      DEBUG.log('🔄 Avvio sincronizzazione bidirezionale...');
      
      if (!await this.checkAuthentication()) {
        throw new Error('Autenticazione richiesta');
      }

      // Controlla se è il primo avvio
      const setup = await this.checkFirstTimeSetup();
      if (setup.isFirstTime && setup.hasBackup) {
        DEBUG.log('🆕 Primo avvio rilevato con backup disponibile');
        throw new Error('FIRST_TIME_SETUP_REQUIRED');
      }

      // Carica dati locali
      const localApps = await StorageService.getAllApps();
      const localSettings = await StorageService.getAllSettings();
      const localData = {
        apps: localApps,
        settings: localSettings,
        timestamp: new Date().toISOString(),
        deviceId: this.getDeviceId()
      };

      // Carica dati remoti
      let remoteData = null;
      try {
        const result = await this.downloadSyncData();
        remoteData = result?.data;
      } catch (error) {
        DEBUG.warn('⚠️ Nessun dato remoto trovato:', error.message);
        remoteData = null;
      }

      // Se non ci sono dati remoti, carica i dati locali
      if (!remoteData) {
        DEBUG.log('📤 Nessun dato remoto, caricamento dati locali...');
        await this.uploadSyncData(localData);
        return { success: true, action: 'upload', appsCount: localApps.length };
      }

      // Gestione app cancellate
      const deletedApps = await this.getDeletedApps();
      const mergedData = await this.mergeDataWithDeletedApps(localData, remoteData, deletedApps);

      // Carica i dati uniti
      await this.uploadSyncData(mergedData);

      // Aggiorna i dati locali se necessario
      if (options.updateLocal !== false) {
        await StorageService.importBackupData(mergedData);
      }

      DEBUG.log('✅ Sincronizzazione completata');
      return { 
        success: true, 
        action: 'sync', 
        appsCount: mergedData.apps.length,
        deletedCount: deletedApps.length
      };

    } catch (error) {
      DEBUG.error('❌ Errore sincronizzazione:', error);
      throw error;
    }
  }

  /**
   * Ottiene la lista delle app cancellate
   */
  async getDeletedApps() {
    try {
      const deletedApps = localStorage.getItem('aideas_deleted_apps');
      return deletedApps ? JSON.parse(deletedApps) : [];
    } catch (error) {
      DEBUG.error('❌ Errore caricamento app cancellate:', error);
      return [];
    }
  }

  /**
   * Aggiunge un'app alla lista delle cancellate
   */
  async markAppAsDeleted(appId) {
    try {
      const deletedApps = await this.getDeletedApps();
      if (!deletedApps.includes(appId)) {
        deletedApps.push(appId);
        localStorage.setItem('aideas_deleted_apps', JSON.stringify(deletedApps));
        DEBUG.log(`🗑️ App ${appId} marcata come cancellata`);
      }
    } catch (error) {
      DEBUG.error('❌ Errore marcatura app cancellata:', error);
    }
  }

  /**
   * Rimuove un'app dalla lista delle cancellate
   */
  async unmarkAppAsDeleted(appId) {
    try {
      const deletedApps = await this.getDeletedApps();
      const filteredApps = deletedApps.filter(id => id !== appId);
      localStorage.setItem('aideas_deleted_apps', JSON.stringify(filteredApps));
      DEBUG.log(`✅ App ${appId} rimossa dalla lista cancellate`);
    } catch (error) {
      DEBUG.error('❌ Errore rimozione app dalla lista cancellate:', error);
    }
  }

  /**
   * Unisce i dati considerando le app cancellate
   */
  async mergeDataWithDeletedApps(localData, remoteData, deletedApps) {
    try {
      DEBUG.log('🔄 Unione dati con gestione app cancellate...');
      
      // Filtra le app cancellate dai dati remoti
      const filteredRemoteApps = remoteData.apps.filter(app => 
        !deletedApps.includes(app.id)
      );
      
      DEBUG.log(`📊 App remote filtrate: ${remoteData.apps.length} -> ${filteredRemoteApps.length} (${deletedApps.length} cancellate)`);
      
      // Unisce le app locali con quelle remote filtrate
      const mergedApps = this.mergeAppsIntelligently(
        { ...localData, apps: localData.apps },
        { ...remoteData, apps: filteredRemoteApps }
      );
      
      return {
        ...mergedApps,
        timestamp: new Date().toISOString(),
        deviceId: this.getDeviceId(),
        lastSync: new Date().toISOString()
      };
      
    } catch (error) {
      DEBUG.error('❌ Errore unione dati:', error);
      throw error;
    }
  }

  /**
   * Rileva conflitti di sincronizzazione (mantenuto per compatibilità)
   */
  detectSyncConflict(localData, remoteData) {
    if (!localData || !remoteData) return false;
    
    const comparison = this.compareAppsGranular(localData.apps, remoteData.apps);
    
    // Conflitto se ci sono differenze significative
    return comparison.conflicts.length > 0 || 
           comparison.onlyLocal.length > 0 || 
           comparison.onlyRemote.length > 0;
  }

  /**
   * Tenta di recuperare un file di sincronizzazione corrotto
   */
  async recoverSyncFile() {
    try {
      DEBUG.log('🔧 Tentativo di recupero file sincronizzazione...');
      
      if (!this.aideasFolderId) {
        await this.initializeAIdeasFolder();
      }

      // Cerca tutti i file nella cartella AIdeas
      const files = await this.searchFiles({
        parents: [this.aideasFolderId]
      });

      DEBUG.log('📂 File trovati nella cartella AIdeas:', files.length);

      // Cerca file di backup o versioni precedenti
      const backupFiles = files.filter(file => 
        file.name.includes('aideas-sync') || 
        file.name.includes('backup') ||
        file.name.includes('.json')
      );

      if (backupFiles.length === 0) {
        DEBUG.warn('⚠️ Nessun file di backup trovato');
        return { success: false, reason: 'NO_BACKUP_FILES' };
      }

      // Ordina per data di modifica (più recente prima)
      backupFiles.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

      // Prova a recuperare dal file più recente
      for (const file of backupFiles) {
        try {
          DEBUG.log('🔄 Tentativo recupero da:', file.name);
          
          const response = await this.makeAuthenticatedRequest(
            `${GOOGLE_API_BASE}/files/${file.id}?alt=media`
          );

          if (!response.ok) continue;

          const content = await response.text();
          if (!content || content.trim().length === 0) continue;

          const data = JSON.parse(content);
          
          // Verifica che abbia la struttura corretta del backup manuale
          if (data.settings && typeof data.settings === 'object' && 
              data.apps && Array.isArray(data.apps) && 
              data.timestamp && data.version) {
            DEBUG.log('✅ Dati validi trovati in:', file.name);
            
            // Ricrea il file di sincronizzazione principale
            await this.uploadSyncData(data);
            
            return { 
              success: true, 
              recoveredFrom: file.name,
              apps: data.apps.length,
              settings: Object.keys(data.settings).length,
              version: data.version
            };
          }
          
        } catch (parseError) {
          DEBUG.warn('⚠️ File non valido:', file.name, parseError.message);
          continue;
        }
      }

      DEBUG.warn('⚠️ Nessun file di recupero valido trovato');
      return { success: false, reason: 'NO_VALID_BACKUP' };

    } catch (error) {
      DEBUG.error('❌ Errore durante recupero:', error);
      return { success: false, reason: 'RECOVERY_ERROR', error: error.message };
    }
  }

  /**
   * Genera stringa random
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Diagnostica configurazione OAuth2
   * Fornisce informazioni dettagliate sulla configurazione corrente
   */
  async diagnoseConfiguration() {
    const diagnosis = {
      status: 'unknown',
      issues: [],
      recommendations: [],
      configuration: {},
      checks: {}
    };

    try {
      // Verifica Client ID
      diagnosis.configuration.clientId = this.clientId ? `${this.clientId.substring(0, 15)}...` : 'NON_CONFIGURATO';
      diagnosis.configuration.hasClientSecret = !!this.clientSecret;
      diagnosis.configuration.redirectUri = this.redirectUri;
      diagnosis.configuration.currentOrigin = window.location.origin;

      // Check 1: Client ID presente
      if (!this.clientId) {
        diagnosis.issues.push('❌ Client ID Google non configurato');
        diagnosis.recommendations.push('Configura VITE_GOOGLE_CLIENT_ID nelle variabili d\'ambiente');
        diagnosis.checks.clientId = false;
      } else if (!this.clientId.endsWith('.apps.googleusercontent.com')) {
        diagnosis.issues.push('❌ Client ID formato non valido');
        diagnosis.recommendations.push('Il Client ID deve terminare con .apps.googleusercontent.com');
        diagnosis.checks.clientId = false;
      } else {
        diagnosis.checks.clientId = true;
      }

      // Check 2: Client Secret (dovrebbe essere assente per app pubbliche)
              if (this.clientSecret) {
          diagnosis.checks.clientSecret = true;
        } else {
          diagnosis.issues.push('❌ Client Secret mancante');
          diagnosis.recommendations.push('Configura VITE_GOOGLE_CLIENT_SECRET - necessario per AIdeas');
          diagnosis.checks.clientSecret = false;
        }

      // Check 3: Redirect URI valido
      if (!this.redirectUri.includes(window.location.origin)) {
        diagnosis.issues.push('⚠️ Redirect URI potrebbe non corrispondere all\'origin corrente');
        diagnosis.recommendations.push(`Verifica che ${this.redirectUri} sia configurato in Google Cloud Console`);
        diagnosis.checks.redirectUri = false;
      } else {
        diagnosis.checks.redirectUri = true;
      }

      // Check 4: HTTPS in produzione
      if (window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
        diagnosis.issues.push('⚠️ Connessione HTTP non sicura in produzione');
        diagnosis.recommendations.push('Google OAuth2 richiede HTTPS per domini pubblici');
        diagnosis.checks.https = false;
      } else {
        diagnosis.checks.https = true;
      }

      // Determina status generale
      const criticalIssues = diagnosis.issues.filter(issue => issue.startsWith('❌')).length;
      const warnings = diagnosis.issues.filter(issue => issue.startsWith('⚠️')).length;

      if (criticalIssues > 0) {
        diagnosis.status = 'error';
      } else if (warnings > 0) {
        diagnosis.status = 'warning';
      } else {
        diagnosis.status = 'ok';
      }

      // Aggiungi informazioni sulla configurazione Google Cloud Console
      diagnosis.recommendations.push(
        '📖 Guida completa: https://github.com/mccoy88f/aideas.run/blob/main/GOOGLE_OAUTH_SETUP.md'
      );

      DEBUG.log('🔍 Diagnostica OAuth2 completata:', diagnosis);
      
      return diagnosis;

    } catch (error) {
      DEBUG.error('❌ Errore durante diagnostica:', error);
      diagnosis.status = 'error';
      diagnosis.issues.push(`❌ Errore durante diagnostica: ${error.message}`);
      return diagnosis;
    }
  }

  /**
   * Test di connettività OAuth2 (senza autenticazione completa)
   */
  async testOAuthConfiguration() {
    try {
      const diagnosis = await this.diagnoseConfiguration();
      
      if (diagnosis.status === 'error') {
        throw new Error(`Configurazione non valida: ${diagnosis.issues.join(', ')}`);
      }

      // Test URL OAuth2 (senza eseguire l'autenticazione)
      const state = this.generateRandomString(32);
      const authParams = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        scope: this.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state: state
      });

      const authUrl = `${GOOGLE_OAUTH_BASE}/auth?${authParams.toString()}`;
      
      DEBUG.log('✅ Test configurazione OAuth2 - URL generato correttamente');
      
      return {
        success: true,
        authUrl: authUrl,
        diagnosis: diagnosis,
        message: 'Configurazione OAuth2 valida. URL di autenticazione generato correttamente.'
      };

    } catch (error) {
      DEBUG.error('❌ Test configurazione OAuth2 fallito:', error);
      return {
        success: false,
        error: error.message,
        diagnosis: await this.diagnoseConfiguration()
      };
    }
  }
}