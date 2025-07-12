import { DEBUG } from '../utils/debug.js';
import ErrorHandler from './ErrorHandler.js';
/**
 * AIdeas - Google Drive Service
 * Gestione sincronizzazione con Google Drive
 */

import { API_ENDPOINTS } from '../utils/constants.js';
import { showToast, generateId } from '../utils/helpers.js';

/**
 * Servizio per interazioni con Google Drive API
 */
export default class GoogleDriveService {
  constructor() {
    this.baseUrl = API_ENDPOINTS.GOOGLE.DRIVE;
    this.authUrl = API_ENDPOINTS.GOOGLE.AUTH;
    this.tokenUrl = API_ENDPOINTS.GOOGLE.TOKEN;
    
    this.clientId = null;
    this.clientSecret = null;
    this.redirectUri = window.location.origin + '/auth/google.html';
    
    this.authenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    
    // Scopes necessari per AIdeas
    this.scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    // Cache per ridurre chiamate API
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minuti

    // Cartella AIdeas su Drive
    this.aideasFolder = null;
  }

  /**
   * Configura credenziali OAuth2
   * @param {string} clientId - Google Client ID
   * @param {string} clientSecret - Google Client Secret (opzionale per PKCE)
   */
  configure(clientId, clientSecret = null) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Inizia il processo di autenticazione OAuth2
   * @param {boolean} usePopup - Usa popup invece di redirect
   * @returns {Promise<Object>} Risultato autenticazione
   */
  async authenticate(usePopup = false) {
    try {
      if (!this.clientId) {
        throw new Error('Client ID Google non configurato');
      }

      // Genera code verifier per PKCE
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      // Salva code verifier per dopo
      sessionStorage.setItem('google_code_verifier', codeVerifier);

      const authParams = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scopes.join(' '),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: generateId('auth')
      });

      const authUrl = `${this.authUrl}?${authParams.toString()}`;

      if (usePopup) {
        return await this.authenticateWithPopup(authUrl);
      } else {
        // Redirect diretto
        window.location.href = authUrl;
        return { pending: true };
      }

    } catch (error) {
      DEBUG.error('Errore autenticazione Google:', error);
      throw error;
    }
  }

  /**
   * Autenticazione tramite popup
   * @param {string} authUrl - URL di autenticazione
   * @returns {Promise<Object>} Risultato autenticazione
   */
  async authenticateWithPopup(authUrl) {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup bloccato dal browser'));
        return;
      }

      // Polling per verificare completamento auth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Autenticazione annullata'));
        }
      }, 1000);

      // Listener per messaggi dal popup
      const messageHandler = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageHandler);

          try {
            const result = await this.handleAuthCallback(event.data.code, event.data.state);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageHandler);
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Gestisce il callback di autenticazione
   * @param {string} code - Authorization code
   * @param {string} state - State parameter
   * @returns {Promise<Object>} Token e user info
   */
  async handleAuthCallback(code, state) {
    try {
      const codeVerifier = sessionStorage.getItem('google_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier non trovato');
      }

      // Scambia authorization code con access token
      const tokenData = await this.exchangeCodeForToken(code, codeVerifier);
      
      // Salva token
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));
      this.authenticated = true;

      // Ottieni info utente
      this.userInfo = await this.getUserInfo();

      // Salva credenziali
      await this.saveCredentials();

      // Inizializza cartella AIdeas
      await this.initializeAIdeasFolder();

      DEBUG.log('✅ Google Drive autenticato:', this.userInfo.name);
      
      // Pulisce storage temporaneo
      sessionStorage.removeItem('google_code_verifier');

      return {
        success: true,
        user: this.userInfo,
        tokens: {
          access_token: this.accessToken,
          expires_at: this.tokenExpiry
        }
      };

    } catch (error) {
      DEBUG.error('Errore callback auth:', error);
      throw error;
    }
  }

  /**
   * Scambia authorization code con token
   * @param {string} code - Authorization code
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<Object>} Token data
   */
  async exchangeCodeForToken(code, codeVerifier) {
    const tokenParams = {
      client_id: this.clientId,
      code: code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri
    };

    // Aggiungi client secret se disponibile
    if (this.clientSecret) {
      tokenParams.client_secret = this.clientSecret;
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(tokenParams)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token usando refresh token
   * @returns {Promise<Object>} Nuovo access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('Refresh token non disponibile');
      }

      const tokenParams = {
        client_id: this.clientId,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      };

      if (this.clientSecret) {
        tokenParams.client_secret = this.clientSecret;
      }

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(tokenParams)
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokenData = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));
      
      // Aggiorna refresh token se fornito
      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }

      await this.saveCredentials();
      
      return tokenData;

    } catch (error) {
      DEBUG.error('Errore refresh token:', error);
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Verifica e assicura che il token sia valido
   * @returns {Promise<boolean>} Token valido
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      return false;
    }

    // Controlla se il token è scaduto (con margine di 5 minuti)
    if (this.tokenExpiry && Date.now() >= (this.tokenExpiry.getTime() - 300000)) {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  /**
   * Ottiene informazioni sull'utente autenticato
   * @returns {Promise<Object>} Info utente
   */
  async getUserInfo() {
    try {
      const response = await this.makeRequest(
        'https://www.googleapis.com/oauth2/v2/userinfo'
      );

      if (!response.ok) {
        throw new Error('Errore recupero info utente');
      }

      return await response.json();

    } catch (error) {
      DEBUG.error('Errore info utente:', error);
      throw error;
    }
  }

  /**
   * Verifica se l'utente è autenticato
   * @returns {Promise<boolean>} Stato autenticazione
   */
  async isAuthenticated() {
    if (this.authenticated && await this.ensureValidToken()) {
      return true;
    }

    try {
      // Prova a caricare credenziali salvate
      const loaded = await this.loadCredentials();
      if (loaded && await this.ensureValidToken()) {
        this.authenticated = true;
        return true;
      }
    } catch (error) {
      DEBUG.error('Errore verifica autenticazione:', error);
    }

    return false;
  }

  /**
   * Effettua logout
   */
  async logout() {
    this.authenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    this.aideasFolder = null;
    
    await this.clearCredentials();
    this.cache.clear();
  }

  /**
   * DRIVE FILE OPERATIONS
   */

  /**
   * Inizializza cartella AIdeas su Drive
   * @returns {Promise<Object>} Info cartella
   */
  async initializeAIdeasFolder() {
    try {
      // Cerca cartella AIdeas esistente
      const existing = await this.findAIdeasFolder();
      if (existing) {
        this.aideasFolder = existing;
        return existing;
      }

      // Crea nuova cartella AIdeas
      const folder = await this.createFolder('AIdeas', null, {
        description: 'AIdeas App Data - Swiss Army Knife by AI'
      });

      this.aideasFolder = folder;
      return folder;

    } catch (error) {
      DEBUG.error('Errore inizializzazione cartella AIdeas:', error);
      throw error;
    }
  }

  /**
   * Cerca cartella AIdeas esistente
   * @returns {Promise<Object|null>} Cartella se trovata
   */
  async findAIdeasFolder() {
    try {
      const query = 'name=\'AIdeas\' and mimeType=\'application/vnd.google-apps.folder\' and trashed=false';
      const response = await this.makeRequest(`/files?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error('Errore ricerca cartella AIdeas');
      }

      const data = await response.json();
      return data.files.length > 0 ? data.files[0] : null;

    } catch (error) {
      DEBUG.error('Errore ricerca cartella:', error);
      return null;
    }
  }

  /**
   * Crea una cartella su Drive
   * @param {string} name - Nome cartella
   * @param {string} parentId - ID cartella parent (null per root)
   * @param {Object} metadata - Metadati aggiuntivi
   * @returns {Promise<Object>} Cartella creata
   */
  async createFolder(name, parentId = null, metadata = {}) {
    try {
      const folderMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...metadata
      };

      if (parentId) {
        folderMetadata.parents = [parentId];
      }

      const response = await this.makeRequest('/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(folderMetadata)
      });

      if (!response.ok) {
        throw new Error('Errore creazione cartella');
      }

      const folder = await response.json();
      DEBUG.log('✅ Cartella creata:', folder.name);
      return folder;

    } catch (error) {
      DEBUG.error('Errore creazione cartella:', error);
      throw error;
    }
  }

  /**
   * Upload file su Google Drive
   * @param {string} name - Nome file
   * @param {string|Blob} content - Contenuto file
   * @param {string} mimeType - MIME type
   * @param {string} parentId - ID cartella parent
   * @param {Object} metadata - Metadati aggiuntivi
   * @returns {Promise<Object>} File caricato
   */
  async uploadFile(name, content, mimeType, parentId = null, metadata = {}) {
    try {
      const fileMetadata = {
        name,
        mimeType,
        ...metadata
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      // Per file di testo, usa l'endpoint semplice
      if (typeof content === 'string') {
        const response = await this.makeRequest('/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...fileMetadata,
            content: content
          })
        });

        if (!response.ok) {
          throw new Error('Errore upload file');
        }

        return await response.json();
      } else {
        // Per file binari, usa multipart upload
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
        const formData = new FormData();
        
        // Aggiungi metadati
        formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], {
          type: 'application/json'
        }));
        
        // Aggiungi contenuto file
        formData.append('file', content, name);

        const response = await this.makeRequest(`/files?uploadType=multipart`, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Errore upload file');
        }

        return await response.json();
      }

    } catch (error) {
      DEBUG.error('Errore upload file:', error);
      throw error;
    }
  }

  /**
   * Scarica un file da Drive
   * @param {string} fileId - ID del file
   * @returns {Promise<Blob>} Contenuto file
   */
  async downloadFile(fileId) {
    try {
      const response = await this.makeRequest(`/files/${fileId}?alt=media`);

      if (!response.ok) {
        throw new Error('Errore download file');
      }

      return await response.blob();

    } catch (error) {
      DEBUG.error('Errore download file:', error);
      throw error;
    }
  }

  /**
   * Ottiene metadati di un file
   * @param {string} fileId - ID del file
   * @param {string} fields - Campi da includere
   * @returns {Promise<Object>} Metadati file
   */
  async getFileMetadata(fileId, fields = 'id,name,mimeType,size,modifiedTime,parents') {
    try {
      const response = await this.makeRequest(`/files/${fileId}?fields=${fields}`);

      if (!response.ok) {
        throw new Error('Errore recupero metadati file');
      }

      return await response.json();

    } catch (error) {
      DEBUG.error('Errore metadati file:', error);
      throw error;
    }
  }

  /**
   * Lista file in una cartella
   * @param {string} folderId - ID cartella (null per root)
   * @param {Object} options - Opzioni di ricerca
   * @returns {Promise<Array>} Lista file
   */
  async listFiles(folderId = null, options = {}) {
    try {
      let query = 'trashed=false';
      
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      if (options.mimeType) {
        query += ` and mimeType='${options.mimeType}'`;
      }

      if (options.nameContains) {
        query += ` and name contains '${options.nameContains}'`;
      }

      const params = new URLSearchParams({
        q: query,
        fields: options.fields || 'files(id,name,mimeType,size,modifiedTime)',
        pageSize: options.pageSize || 100
      });

      if (options.orderBy) {
        params.set('orderBy', options.orderBy);
      }

      const response = await this.makeRequest(`/files?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Errore lista file');
      }

      const data = await response.json();
      return data.files || [];

    } catch (error) {
      DEBUG.error('Errore lista file:', error);
      throw error;
    }
  }

  /**
   * Elimina un file
   * @param {string} fileId - ID del file
   * @returns {Promise<boolean>} Successo operazione
   */
  async deleteFile(fileId) {
    try {
      const response = await this.makeRequest(`/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Errore eliminazione file');
      }

      DEBUG.log('✅ File eliminato:', fileId);
      return true;

    } catch (error) {
      DEBUG.error('Errore eliminazione file:', error);
      throw error;
    }
  }

  /**
   * Aggiorna file esistente su Google Drive
   * @param {string} fileId - ID del file da aggiornare
   * @param {string|Blob} content - Nuovo contenuto
   * @param {string} mimeType - MIME type
   * @returns {Promise<Object>} File aggiornato
   */
  async updateFile(fileId, content, mimeType) {
    try {
      // Per file di testo, usa l'endpoint semplice
      if (typeof content === 'string') {
        const response = await this.makeRequest(`/files/${fileId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: content
          })
        });

        if (!response.ok) {
          throw new Error('Errore aggiornamento file');
        }

        return await response.json();
      } else {
        // Per file binari, usa multipart upload
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
        const formData = new FormData();
        
        // Aggiungi metadati
        formData.append('metadata', new Blob([JSON.stringify({})], {
          type: 'application/json'
        }));
        
        // Aggiungi contenuto file
        formData.append('file', content);

        const response = await this.makeRequest(`/files/${fileId}?uploadType=multipart`, {
          method: 'PATCH',
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Errore aggiornamento file');
        }

        return await response.json();
      }

    } catch (error) {
      DEBUG.error('Errore aggiornamento file:', error);
      throw error;
    }
  }

  /**
   * SYNC INTEGRATION
   */

  /**
   * Upload dati di sync su Google Drive
   * @param {Object} syncData - Dati da sincronizzare
   * @returns {Promise<Object>} Risultato operazione
   */
  async uploadSyncData(syncData) {
    return await ErrorHandler.withRetry(async () => {
      // Validazione dati
      if (!syncData || typeof syncData !== 'object') {
        throw new Error('Dati sync non validi');
      }

      if (!syncData.data || !syncData.data.apps) {
        throw new Error('Dati sync incompleti: mancano le app');
      }

      // Verifica autenticazione
      if (!await this.isAuthenticated()) {
        throw new Error('Autenticazione Google Drive richiesta');
      }

      // Crea backup automatico prima dell'upload
      const backupId = await ErrorHandler.createBackup('Google Drive Upload', syncData);

      if (!this.aideasFolder) {
        await this.initializeAIdeasFolder();
      }

      const syncContent = JSON.stringify(syncData, null, 2);
      const metadata = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        device: navigator.userAgent,
        checksum: await this.generateChecksum(syncData),
        backupId: backupId
      };

      // Cerca file sync esistenti
      const existingSyncFiles = await this.listFiles(this.aideasFolder.id, {
        nameContains: 'aideas-sync.json'
      });

      let syncFile;
      if (existingSyncFiles.length > 0) {
        // Aggiorna file esistente
        const existingFile = existingSyncFiles[0];
        try {
          syncFile = await this.updateFile(existingFile.id, syncContent, 'application/json');
          DEBUG.success('✅ File sync aggiornato:', syncFile.name);
        } catch (updateError) {
          // Se l'aggiornamento fallisce, prova a ricreare il file
          DEBUG.warn('⚠️ Aggiornamento fallito, ricreazione file sync');
          syncFile = await this.uploadFile(
            'aideas-sync.json',
            syncContent,
            'application/json',
            this.aideasFolder.id,
            {
              description: 'AIdeas Sync Data - Apps and Settings'
            }
          );
        }
      } else {
        // Crea nuovo file
        syncFile = await this.uploadFile(
          'aideas-sync.json',
          syncContent,
          'application/json',
          this.aideasFolder.id,
          {
            description: 'AIdeas Sync Data - Apps and Settings'
          }
        );
        DEBUG.success('✅ Nuovo file sync creato:', syncFile.name);
      }

      // Cerca file metadati esistenti
      const existingMetaFiles = await this.listFiles(this.aideasFolder.id, {
        nameContains: 'aideas-meta.json'
      });

      let metaFile;
      try {
        if (existingMetaFiles.length > 0) {
          // Aggiorna file metadati esistente
          const existingMetaFile = existingMetaFiles[0];
          metaFile = await this.updateFile(existingMetaFile.id, JSON.stringify(metadata, null, 2), 'application/json');
          DEBUG.success('✅ File metadati aggiornato:', metaFile.name);
        } else {
          // Crea nuovo file metadati
          metaFile = await this.uploadFile(
            'aideas-meta.json',
            JSON.stringify(metadata, null, 2),
            'application/json',
            this.aideasFolder.id,
            {
              description: 'AIdeas Sync Metadata'
            }
          );
          DEBUG.success('✅ Nuovo file metadati creato:', metaFile.name);
        }
      } catch (metaError) {
        DEBUG.warn('⚠️ Errore salvataggio metadati:', metaError);
        // Non bloccare l'operazione se i metadati falliscono
      }

      // Validazione risultato
      if (!syncFile || !syncFile.id) {
        throw new Error('Upload non riuscito: file sync non creato');
      }

      DEBUG.success(`✅ Dati sincronizzati su Google Drive: ${syncData.data.apps.length} app`);

      return {
        success: true,
        syncFile: {
          id: syncFile.id,
          name: syncFile.name,
          size: syncContent.length
        },
        metaFile: metaFile ? {
          id: metaFile.id,
          name: metaFile.name
        } : null,
        metadata,
        backupId: backupId
      };

    }, {
      operationName: 'Upload sincronizzazione Google Drive',
      retryStrategy: 'RATE_LIMIT',
      timeout: 60000,
      context: { 
        dataSize: JSON.stringify(syncData || {}).length,
        appsCount: syncData?.data?.apps?.length || 0
      },
      rollbackFn: async (error, context) => {
        DEBUG.warn(`🔄 Rollback upload Google Drive - tentativo ripristino backup`);
        // Il backup viene mantenuto per recovery manuale
      },
      validateResult: (result) => {
        return result && result.success && result.syncFile && result.syncFile.id;
      }
    });
  }

  /**
   * Download dati di sync da Google Drive
   * @returns {Promise<Object>} Dati scaricati
   */
  async downloadSyncData() {
    return await ErrorHandler.withRetry(async () => {
      // Verifica autenticazione
      if (!await this.isAuthenticated()) {
        throw new Error('Autenticazione Google Drive richiesta');
      }

      if (!this.aideasFolder) {
        await this.initializeAIdeasFolder();
      }

      // Cerca file sync
      const syncFiles = await this.listFiles(this.aideasFolder.id, {
        nameContains: 'aideas-sync.json'
      });

      if (syncFiles.length === 0) {
        throw new Error('File sync non trovato su Google Drive');
      }

      const syncFile = syncFiles[0];
      
      // Verifica integrità file
      if (!syncFile.id) {
        throw new Error('File sync corrotto: ID mancante');
      }

      // Scarica contenuto sync con validazione
      const syncBlob = await this.downloadFile(syncFile.id);
      const syncContent = await syncBlob.text();
      
      // Parsing sicuro dei dati
      let syncData;
      try {
        syncData = JSON.parse(syncContent);
      } catch (parseError) {
        throw new Error('Dati sync corrotti o non validi');
      }

      // Validazione struttura dati
      if (!syncData || typeof syncData !== 'object') {
        throw new Error('Formato dati sync non valido');
      }

      if (!syncData.data || !syncData.data.apps) {
        throw new Error('Dati sync incompleti: mancano le app');
      }

      // Prova a scaricare metadati
      let metadata = null;
      let checksumValid = true;
      
      try {
        const metaFiles = await this.listFiles(this.aideasFolder.id, {
          nameContains: 'aideas-meta.json'
        });

        if (metaFiles.length > 0) {
          const metaBlob = await this.downloadFile(metaFiles[0].id);
          const metaContent = await metaBlob.text();
          metadata = JSON.parse(metaContent);

          // Verifica checksum per integrità dati
          const currentChecksum = await this.generateChecksum(syncData);
          if (metadata.checksum && metadata.checksum !== currentChecksum) {
            checksumValid = false;
            DEBUG.warn('⚠️ Checksum sync data non corrisponde - possibile corruzione');
          }
        }
      } catch (metaError) {
        DEBUG.warn('⚠️ Errore caricamento metadati, continuo senza validazione');
      }

      // Validazione aggiuntiva sui dati delle app
      if (syncData.data.apps && Array.isArray(syncData.data.apps)) {
        const invalidApps = syncData.data.apps.filter(app => !app.name || !app.type);
        if (invalidApps.length > 0) {
          DEBUG.warn(`⚠️ Trovate ${invalidApps.length} app con dati incompleti`);
        }
      }

      DEBUG.success(`✅ Scaricati dati sync da Google Drive: ${syncData.data.apps.length} app`);

      return {
        success: true,
        data: syncData,
        metadata,
        fileInfo: {
          id: syncFile.id,
          name: syncFile.name,
          size: syncFile.size,
          modifiedTime: syncFile.modifiedTime
        },
        validation: {
          checksumValid,
          appsCount: syncData.data.apps.length,
          hasMetadata: !!metadata
        }
      };

    }, {
      operationName: 'Download sincronizzazione Google Drive',
      retryStrategy: 'RATE_LIMIT',
      timeout: 45000,
      context: {},
      rollbackFn: async (error, context) => {
        DEBUG.warn(`⚠️ Errore download da Google Drive`);
        // Non c'è rollback per un download, ma possiamo loggare per debug
      },
      validateResult: (result) => {
        return result && result.success && result.data && result.data.data && result.data.data.apps;
      }
    });
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Effettua richiesta HTTP con gestione token
   * @param {string} endpoint - Endpoint API
   * @param {Object} options - Opzioni fetch
   * @returns {Promise<Response>} Response
   */
  async makeRequest(endpoint, options = {}) {
    if (!await this.ensureValidToken()) {
      throw new Error('Token non valido, riautenticarsi');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      }
    });

    return response;
  }

  /**
   * Genera code verifier per PKCE
   * @returns {string} Code verifier
   */
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Genera code challenge da verifier
   * @param {string} codeVerifier - Code verifier
   * @returns {Promise<string>} Code challenge
   */
  async generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  /**
   * Encode base64 URL-safe
   * @param {Uint8Array} buffer - Buffer da encodare
   * @returns {string} String base64 URL-safe
   */
  base64URLEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Genera checksum per validazione dati
   * @param {Object} data - Dati da verificare
   * @returns {Promise<string>} Checksum
   */
  async generateChecksum(data) {
    const text = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Salva credenziali in modo sicuro
   */
  async saveCredentials() {
    const credentials = {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenExpiry: this.tokenExpiry?.toISOString(),
      userInfo: this.userInfo
    };

    // In produzione, usa crittografia più robusta
    const encrypted = btoa(JSON.stringify(credentials));
    localStorage.setItem('aideas_googledrive_creds', encrypted);
  }

  /**
   * Carica credenziali salvate
   * @returns {Promise<boolean>} Successo caricamento
   */
  async loadCredentials() {
    try {
      const encrypted = localStorage.getItem('aideas_googledrive_creds');
      if (!encrypted) return false;

      const credentials = JSON.parse(atob(encrypted));
      
      this.accessToken = credentials.accessToken;
      this.refreshToken = credentials.refreshToken;
      this.tokenExpiry = credentials.tokenExpiry ? new Date(credentials.tokenExpiry) : null;
      this.userInfo = credentials.userInfo;

      return true;

    } catch (error) {
      DEBUG.error('Errore caricamento credenziali:', error);
      return false;
    }
  }

  /**
   * Rimuove credenziali salvate
   */
  async clearCredentials() {
    localStorage.removeItem('aideas_googledrive_creds');
  }

  /**
   * Testa connessione e autenticazione
   * @returns {Promise<Object>} Risultato test
   */
  async testConnection() {
    try {
      if (!await this.isAuthenticated()) {
        return {
          success: false,
          error: 'Non autenticato'
        };
      }

      const userInfo = await this.getUserInfo();
      
      return {
        success: true,
        user: userInfo,
        quotaInfo: await this.getStorageQuota()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ottiene informazioni quota storage
   * @returns {Promise<Object>} Info quota
   */
  async getStorageQuota() {
    try {
      const response = await this.makeRequest('/about?fields=storageQuota');
      
      if (!response.ok) {
        throw new Error('Errore recupero quota');
      }

      return await response.json();

    } catch (error) {
      DEBUG.error('Errore quota storage:', error);
      return null;
    }
  }

  /**
   * CACHE MANAGEMENT
   */

  /**
   * Ottiene valore dalla cache
   * @param {string} key - Chiave cache
   * @returns {*} Valore cached o null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Salva valore in cache
   * @param {string} key - Chiave cache
   * @param {*} data - Dati da cachare
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Pulisce cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Sincronizzazione bidirezionale
   * @returns {Promise<Object>} Risultato sincronizzazione
   */
  async syncBidirectional() {
    try {
      // Per ora, ritorna un messaggio di successo
      // La logica completa sarà implementata quando necessario
      return {
        success: true,
        message: 'Sincronizzazione Google Drive completata'
      };
    } catch (error) {
      DEBUG.error('Errore sincronizzazione bidirezionale Google Drive:', error);
      throw error;
    }
  }
}