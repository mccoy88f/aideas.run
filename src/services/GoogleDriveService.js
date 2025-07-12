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
    
    // Scopes richiesti
    this.scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    DEBUG.log('🔧 GoogleDriveService inizializzato (versione web pubblica)');
  }

  /**
   * Configura le credenziali Google
   */
  configure(clientId, clientSecret = null) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    
    DEBUG.log('🔧 Credenziali Google configurate', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MANCANTE',
      hasClientSecret: !!clientSecret
    });
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

❌ La tua app Google deve essere configurata come "Web application" per applicazioni pubbliche.

📋 Passaggi per risolvere:
1. Vai su Google Cloud Console
2. APIs & Services > Credentials  
3. Crea/Modifica OAuth 2.0 Client ID
4. Tipo: "Web application" (NON Desktop/Mobile)
5. NON usare client_secret per app web pubbliche
6. Configura origins: https://aideas.run

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

      // Test della connettività
      const response = await this.makeAuthenticatedRequest(GOOGLE_USERINFO_URL);
      if (!response.ok) {
        return false;
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

❌ La tua app Google deve essere configurata come "Web application" per applicazioni pubbliche.

📋 Passaggi per risolvere:
1. Vai su Google Cloud Console
2. APIs & Services > Credentials  
3. Crea/Modifica OAuth 2.0 Client ID
4. Tipo: "Web application" (NON Desktop/Mobile)
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
      
      // Scarica contenuto file
      const response = await this.makeAuthenticatedRequest(
        `${GOOGLE_API_BASE}/files/${syncFile.id}?alt=media`
      );

      if (!response.ok) {
        throw new Error('Errore download file');
      }

      const content = await response.text();
      const syncData = JSON.parse(content);

      // Validazione dati
      if (!syncData.data || !syncData.data.apps) {
        throw new Error('Formato dati non valido');
      }

      DEBUG.log('✅ Dati sincronizzazione scaricati:', {
        apps: syncData.data.apps.length,
        timestamp: syncData.timestamp
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
      retryStrategy: 'EXPONENTIAL_BACKOFF',
      maxRetries: 3,
      timeout: 30000
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

      // Prepara dati con metadata
      const syncData = {
        timestamp: new Date().toISOString(),
        user: this.userInfo?.name || 'Unknown',
        data: data
      };

      const content = JSON.stringify(syncData, null, 2);
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
        apps: data.apps.length
      });

      return {
        success: true,
        fileId: result.id,
        uploadedAt: new Date().toISOString()
      };

    }, {
      operationName: 'Upload sincronizzazione Google Drive',
      retryStrategy: 'EXPONENTIAL_BACKOFF',
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
    
    DEBUG.log('✅ Logout completato');
  }

  /**
   * Ottieni informazioni utente corrente
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * Sincronizzazione bidirezionale con Google Drive
   */
  async syncBidirectional() {
    try {
      DEBUG.log('🔄 Avvio sincronizzazione bidirezionale Google Drive...');
      
      if (!this.isAuthenticated) {
        throw new Error('Non autenticato con Google Drive');
      }

      // 1. Scarica dati remoti
      const remoteData = await this.downloadSyncData();
      
      // 2. Ottieni dati locali
      const StorageService = (await import('../services/StorageService.js')).default;
      const localData = await StorageService.exportData();
      
      // 3. Determina quale sia più recente
      let finalData = localData;
      let syncMessage = 'Dati locali caricati su Google Drive';
      
      if (remoteData && remoteData.data && remoteData.lastModified) {
        const remoteDate = new Date(remoteData.lastModified);
        const localDate = new Date(localData.exportedAt || 0);
        
        if (remoteDate > localDate) {
          // Dati remoti più recenti - importa
          await StorageService.importData(remoteData.data);
          finalData = remoteData.data;
          syncMessage = 'Dati più recenti scaricati da Google Drive';
        }
      }
      
      // 4. Carica la versione finale su Google Drive
      await this.uploadSyncData(finalData);
      
      DEBUG.log('✅ Sincronizzazione bidirezionale completata');
      
      return {
        success: true,
        message: syncMessage,
        syncedAt: new Date().toISOString(),
        apps: finalData.apps?.length || 0
      };

    } catch (error) {
      DEBUG.error('❌ Errore sincronizzazione bidirezionale Google Drive:', error);
      throw error;
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
        diagnosis.issues.push('⚠️ Client Secret configurato per app pubblica');
        diagnosis.recommendations.push('Rimuovi VITE_GOOGLE_CLIENT_SECRET - non necessario per SPA');
        diagnosis.checks.clientSecret = false;
      } else {
        diagnosis.checks.clientSecret = true;
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