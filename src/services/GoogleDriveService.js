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
   * Sincronizzazione bidirezionale con Google Drive e gestione conflitti
   */
  async syncBidirectional(options = {}) {
    try {
      DEBUG.log('🔄 Avvio sincronizzazione bidirezionale Google Drive...');
      
      if (!await this.checkAuthentication()) {
        throw new Error('Autenticazione richiesta');
      }

      // Carica dati locali usando il formato di backup manuale
      const StorageService = (await import('./StorageService.js')).default;
      const localData = await StorageService.exportBackupData();

      let remoteData = null;
      let syncMessage = '';
      let conflictResolution = options.conflictResolution || 'auto'; // 'auto', 'local', 'remote', 'ask'

      try {
        // Prova a scaricare dati remoti
        const downloadResult = await this.downloadSyncData();
        remoteData = downloadResult.data;
        
        DEBUG.log('📥 Dati remoti scaricati:', {
          apps: remoteData.apps?.length || 0,
          hasSettings: !!remoteData.settings,
          timestamp: remoteData.timestamp
        });

      } catch (downloadError) {
        DEBUG.warn('⚠️ Errore download dati remoti:', downloadError.message);
        
        // Verifica che downloadError.message esista prima di usare includes()
        // Gestisce anche errori strutturati dall'ErrorHandler
        let errorMessage = downloadError.message || downloadError.toString() || 'Errore sconosciuto';
        
        // Se è un errore strutturato dall'ErrorHandler, prova a estrarre il messaggio tecnico
        if (downloadError.technicalMessage) {
          errorMessage = downloadError.technicalMessage;
        } else if (downloadError.originalError && downloadError.originalError.message) {
          errorMessage = downloadError.originalError.message;
        }
        
        DEBUG.log('🔍 Messaggio errore estratto:', errorMessage);
        
        // Gestione errori specifici
        if (errorMessage.includes('File di sincronizzazione non trovato')) {
          DEBUG.log('📤 Prima sincronizzazione rilevata');
          
          // Se ci sono dati locali e questa è la prima sincronizzazione, interroga l'utente
          const localApps = localData.apps?.length || 0;
          if (localApps > 0) {
            DEBUG.log('⚠️ Prima sincronizzazione con dati locali esistenti - richiesta conferma utente');
            
            // Forza la modalità 'ask' per interrogare l'utente
            if (conflictResolution === 'auto') {
              return {
                conflict: true,
                isFirstSync: true,
                localData: localData,
                remoteData: null,
                localTimestamp: localData.timestamp,
                remoteTimestamp: null,
                message: 'Prima sincronizzazione: scegli se caricare i dati locali su Google Drive o mantenere vuoto il cloud'
              };
            }
          }
          
          syncMessage = 'Prima sincronizzazione: dati locali caricati su Google Drive';
          
        } else if (errorMessage.includes('vuoto') || errorMessage.includes('corrotto')) {
          DEBUG.warn('🔧 File corrotto rilevato - tentativo di recupero');
          
          // Prova a recuperare il file di sincronizzazione
          const recoveryResult = await this.recoverSyncFile();
          if (recoveryResult.success) {
            DEBUG.log('✅ Recupero completato, riprovo download');
            const retryResult = await this.downloadSyncData();
            remoteData = retryResult.data;
            syncMessage = 'Dati recuperati e sincronizzati';
          } else {
            DEBUG.log('📤 Recupero fallito - ricreazione file con dati locali');
            syncMessage = 'File corrotto sostituito con dati locali';
            // Non imposta remoteData, quindi userà i dati locali
          }
          
        } else {
          // Altri errori - rilancia
          throw downloadError;
        }
      }

      // Gestione conflitti e decisione di sincronizzazione
      let finalData = localData;
      
      if (remoteData) {
        const localTimestamp = localData.timestamp ? new Date(localData.timestamp).getTime() : 0;
        const remoteTimestamp = remoteData.timestamp ? new Date(remoteData.timestamp).getTime() : 0;
        const localApps = localData.apps?.length || 0;
        const remoteApps = remoteData.apps?.length || 0;

        // Rileva conflitti (differenza significativa nei dati)
        const hasConflict = this.detectSyncConflict(localData, remoteData);
        
        if (hasConflict && conflictResolution === 'ask') {
          // Ritorna informazioni per permettere all'utente di scegliere
          return {
            conflict: true,
            localData: localData,
            remoteData: remoteData,
            localTimestamp: new Date(localTimestamp).toISOString(),
            remoteTimestamp: new Date(remoteTimestamp).toISOString()
          };
        }

        // Logica di risoluzione migliorata
        let useRemoteData = false;
        
        if (conflictResolution === 'remote') {
          useRemoteData = true;
        } else if (conflictResolution === 'local') {
          useRemoteData = false;
        } else if (conflictResolution === 'auto') {
          // Logica intelligente per nuove sessioni
          if (localApps === 0 && remoteApps > 0) {
            // Database locale vuoto e remoto ha dati -> usa remoto
            useRemoteData = true;
            DEBUG.log('🔄 Database locale vuoto, ripristino da remoto');
          } else if (localApps > 0 && remoteApps === 0) {
            // Database locale ha dati e remoto è vuoto -> usa locale
            useRemoteData = false;
            DEBUG.log('🔄 Database remoto vuoto, caricamento dati locali');
          } else if (Math.abs(localApps - remoteApps) > 5) {
            // Grande differenza nel numero di app -> usa quello con più dati
            useRemoteData = remoteApps > localApps;
            DEBUG.log(`🔄 Grande differenza nel numero di app (${localApps} vs ${remoteApps}), uso quello con più dati`);
          } else {
            // Usa timestamp solo se entrambi hanno dati significativi
            useRemoteData = remoteTimestamp > localTimestamp;
            DEBUG.log(`🔄 Confronto timestamp: locale=${new Date(localTimestamp).toISOString()}, remoto=${new Date(remoteTimestamp).toISOString()}`);
          }
        }

        if (useRemoteData) {
          DEBUG.log('📥 Uso dati remoti');
          finalData = remoteData;
          syncMessage = syncMessage || 'Dati scaricati da Google Drive';
          
          // Aggiorna dati locali
          await StorageService.importBackupData(finalData);
          
        } else {
          DEBUG.log('📤 Uso dati locali');
          finalData = localData;
          syncMessage = syncMessage || 'Dati caricati su Google Drive';
        }
      }

      // Carica dati aggiornati
      await this.uploadSyncData(finalData);

      DEBUG.log('✅ Sincronizzazione bidirezionale completata:', {
        apps: finalData.apps?.length || 0,
        hasSettings: !!finalData.settings,
        message: syncMessage
      });

      return {
        success: true,
        message: syncMessage,
        syncedAt: new Date().toISOString(),
        apps: finalData.apps?.length || 0,
        conflict: false
      };

    } catch (error) {
      DEBUG.error('❌ Errore sincronizzazione bidirezionale Google Drive:', error);
      throw error;
    }
  }

  /**
   * Rileva conflitti di sincronizzazione
   */
  detectSyncConflict(localData, remoteData) {
    if (!localData || !remoteData) return false;
    
    // Confronta numero di app
    const localApps = localData.apps?.length || 0;
    const remoteApps = remoteData.apps?.length || 0;
    
    // Conflitto se differenza significativa nel numero di app
    if (Math.abs(localApps - remoteApps) > 2) {
      return true;
    }
    
    // Confronta timestamp (conflitto se molto vicini nel tempo)
    const localTime = localData.timestamp ? new Date(localData.timestamp).getTime() : 0;
    const remoteTime = remoteData.timestamp ? new Date(remoteData.timestamp).getTime() : 0;
    const timeDiff = Math.abs(localTime - remoteTime);
    
    // Conflitto se modificati nell'ultima ora (3600000 ms)
    if (timeDiff < 3600000 && localApps !== remoteApps) {
      return true;
    }
    
    return false;
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