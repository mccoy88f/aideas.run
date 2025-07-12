import { DEBUG } from '../utils/debug.js';
import ErrorHandler from './ErrorHandler.js';
/**
 * AIdeas - GitHub Service
 * Gestione sincronizzazione con GitHub Gists
 */

import { API_ENDPOINTS, REGEX_PATTERNS } from '../utils/constants.js';
import { showToast } from '../utils/helpers.js';

/**
 * Servizio per interazioni con GitHub API
 */
export default class GitHubService {
  constructor() {
    this.baseUrl = API_ENDPOINTS.GITHUB.BASE;
    this.rateLimitRemaining = 5000;
    this.rateLimitReset = null;
    this.authenticated = false;
    this.userInfo = null;
    
    // Cache per ridurre chiamate API
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minuti
  }

  /**
   * Autentica con GitHub usando Personal Access Token
   * @param {string} token - GitHub Personal Access Token
   * @returns {Promise<Object>} User info se successo
   */
  async authenticate(token) {
    try {
      if (!token || !token.startsWith('ghp_')) {
        throw new Error('Token GitHub non valido');
      }

      const response = await this.makeRequest('/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Autenticazione fallita: ${response.statusText}`);
      }

      this.userInfo = await response.json();
      this.authenticated = true;
      
      // Salva token in modo sicuro
      await this.saveToken(token);
      
      DEBUG.log('✅ GitHub autenticato:', this.userInfo.login);
      return this.userInfo;

    } catch (error) {
      DEBUG.error('❌ Errore autenticazione GitHub:', error);
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Verifica se l'utente è autenticato
   * @returns {Promise<boolean>} Stato autenticazione
   */
  async isAuthenticated() {
    if (this.authenticated && this.userInfo) {
      return true;
    }

    try {
      const token = await this.getToken();
      if (token) {
        await this.authenticate(token);
        return this.authenticated;
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
    this.userInfo = null;
    await this.clearToken();
    this.cache.clear();
  }

  /**
   * Ottiene informazioni su un repository
   * @param {string} owner - Proprietario del repo
   * @param {string} repo - Nome del repository
   * @returns {Promise<Object>} Info repository
   */
  async getRepository(owner, repo) {
    try {
      const cacheKey = `repo:${owner}/${repo}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const endpoint = `/repos/${owner}/${repo}`;
      const response = await this.makeRequest(endpoint);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository non trovato');
        }
        throw new Error(`Errore API GitHub: ${response.statusText}`);
      }

      const repoData = await response.json();
      this.setCache(cacheKey, repoData);
      
      return repoData;

    } catch (error) {
      DEBUG.error('Errore recupero repository:', error);
      throw error;
    }
  }

  /**
   * Ottiene il contenuto di un file dal repository
   * @param {string} owner - Proprietario del repo
   * @param {string} repo - Nome del repository
   * @param {string} path - Percorso del file
   * @param {string} ref - Branch/commit ref (default: main)
   * @returns {Promise<Object>} Contenuto del file
   */
  async getFileContent(owner, repo, path, ref = 'main') {
    try {
      const cacheKey = `file:${owner}/${repo}/${path}@${ref}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const endpoint = `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
      const response = await this.makeRequest(endpoint);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`File ${path} non trovato`);
        }
        throw new Error(`Errore recupero file: ${response.statusText}`);
      }

      const fileData = await response.json();
      
      // Decodifica contenuto se è base64
      if (fileData.encoding === 'base64') {
        fileData.decodedContent = atob(fileData.content.replace(/\n/g, ''));
      }

      this.setCache(cacheKey, fileData);
      return fileData;

    } catch (error) {
      DEBUG.error('Errore recupero file:', error);
      throw error;
    }
  }

  /**
   * Ottiene la lista dei file del repository
   * @param {string} owner - Proprietario del repo
   * @param {string} repo - Nome del repository
   * @param {string} path - Percorso directory (default: root)
   * @param {string} ref - Branch/commit ref
   * @returns {Promise<Array>} Lista file e directory
   */
  async getDirectoryContents(owner, repo, path = '', ref = 'main') {
    try {
      const cacheKey = `dir:${owner}/${repo}/${path}@${ref}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const endpoint = `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
      const response = await this.makeRequest(endpoint);

      if (!response.ok) {
        throw new Error(`Errore recupero directory: ${response.statusText}`);
      }

      const contents = await response.json();
      this.setCache(cacheKey, contents);
      
      return contents;

    } catch (error) {
      DEBUG.error('Errore recupero directory:', error);
      throw error;
    }
  }

  /**
   * Scarica tutto il repository come ZIP
   * @param {string} owner - Proprietario del repo
   * @param {string} repo - Nome del repository
   * @param {string} ref - Branch/commit ref
   * @returns {Promise<Blob>} ZIP del repository
   */
  async downloadRepositoryZip(owner, repo, ref = 'main') {
    try {
      const endpoint = `/repos/${owner}/${repo}/zipball/${ref}`;
      const response = await this.makeRequest(endpoint, {
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Errore download repository: ${response.statusText}`);
      }

      return await response.blob();

    } catch (error) {
      DEBUG.error('Errore download repository:', error);
      throw error;
    }
  }

  /**
   * Cerca repository pubblici
   * @param {string} query - Query di ricerca
   * @param {Object} options - Opzioni di ricerca
   * @returns {Promise<Object>} Risultati ricerca
   */
  async searchRepositories(query, options = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        sort: options.sort || 'stars',
        order: options.order || 'desc',
        per_page: options.perPage || 20,
        page: options.page || 1
      });

      const endpoint = `/search/repositories?${params.toString()}`;
      const response = await this.makeRequest(endpoint);

      if (!response.ok) {
        throw new Error(`Errore ricerca: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      DEBUG.error('Errore ricerca repository:', error);
      throw error;
    }
  }

  /**
   * GIST MANAGEMENT per sincronizzazione
   */

  /**
   * Crea un nuovo Gist
   * @param {Object} gistData - Dati del Gist
   * @returns {Promise<Object>} Gist creato
   */
  async createGist(gistData) {
    try {
      const response = await this.makeRequest('/gists', {
        method: 'POST',
        headers: {
          ...await this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: gistData.description || 'AIdeas Sync Data',
          public: gistData.public || false,
          files: gistData.files
        })
      });

      if (!response.ok) {
        throw new Error(`Errore creazione Gist: ${response.statusText}`);
      }

      const gist = await response.json();
      DEBUG.log('✅ Gist creato:', gist.id);
      return gist;

    } catch (error) {
      DEBUG.error('Errore creazione Gist:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un Gist esistente
   * @param {string} gistId - ID del Gist
   * @param {Object} gistData - Nuovi dati del Gist
   * @returns {Promise<Object>} Gist aggiornato
   */
  async updateGist(gistId, gistData) {
    try {
      const response = await this.makeRequest(`/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          ...await this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: gistData.description,
          files: gistData.files
        })
      });

      if (!response.ok) {
        throw new Error(`Errore aggiornamento Gist: ${response.statusText}`);
      }

      const gist = await response.json();
      DEBUG.log('✅ Gist aggiornato:', gist.id);
      return gist;

    } catch (error) {
      DEBUG.error('Errore aggiornamento Gist:', error);
      throw error;
    }
  }

  /**
   * Ottiene un Gist
   * @param {string} gistId - ID del Gist
   * @returns {Promise<Object>} Dati del Gist
   */
  async getGist(gistId) {
    try {
      const cacheKey = `gist:${gistId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await this.makeRequest(`/gists/${gistId}`, {
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Gist non trovato');
        }
        throw new Error(`Errore recupero Gist: ${response.statusText}`);
      }

      const gist = await response.json();
      this.setCache(cacheKey, gist, 60000); // Cache più breve per Gist
      
      return gist;

    } catch (error) {
      DEBUG.error('Errore recupero Gist:', error);
      throw error;
    }
  }

  /**
   * Elimina un Gist
   * @param {string} gistId - ID del Gist
   * @returns {Promise<boolean>} Successo operazione
   */
  async deleteGist(gistId) {
    try {
      const response = await this.makeRequest(`/gists/${gistId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Errore eliminazione Gist: ${response.statusText}`);
      }

      DEBUG.log('✅ Gist eliminato:', gistId);
      return true;

    } catch (error) {
      DEBUG.error('Errore eliminazione Gist:', error);
      throw error;
    }
  }

  /**
   * Lista i Gist dell'utente
   * @param {Object} options - Opzioni di listaggio
   * @returns {Promise<Array>} Lista Gist
   */
  async listGists(options = {}) {
    try {
      const params = new URLSearchParams({
        per_page: options.perPage || 30,
        page: options.page || 1
      });

      const endpoint = `/gists?${params.toString()}`;
      const response = await this.makeRequest(endpoint, {
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Errore lista Gist: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      DEBUG.error('Errore lista Gist:', error);
      throw error;
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Parsa URL GitHub per estrarre owner e repo
   * @param {string} url - URL GitHub
   * @returns {Object|null} {owner, repo, branch}
   */
  parseGitHubUrl(url) {
    // Pattern per repository normale
    const repoMatch = url.match(REGEX_PATTERNS.GITHUB_URL);
    if (repoMatch) {
      return {
        owner: repoMatch[1],
        repo: repoMatch[2].replace('.git', ''),
        branch: 'main'
      };
    }

    // Pattern per GitHub Pages
    const pagesMatch = url.match(REGEX_PATTERNS.GITHUB_PAGES);
    if (pagesMatch) {
      return {
        owner: pagesMatch[1],
        repo: pagesMatch[2],
        branch: 'gh-pages',
        isPages: true
      };
    }

    return null;
  }

  /**
   * Verifica se un repository ha GitHub Pages attivo
   * @param {string} owner - Proprietario del repo
   * @param {string} repo - Nome del repository
   * @returns {Promise<Object|null>} Info Pages se attivo
   */
  async getGitHubPages(owner, repo) {
    try {
      const endpoint = `/repos/${owner}/${repo}/pages`;
      const response = await this.makeRequest(endpoint, {
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        return null; // Pages non attivo
      }

      return await response.json();

    } catch (error) {
      return null;
    }
  }

  /**
   * Ottiene le release del repository
   * @param {string} owner - Proprietario del repo
   * @param {string} repo - Nome del repository
   * @returns {Promise<Array>} Lista release
   */
  async getReleases(owner, repo) {
    try {
      const endpoint = `/repos/${owner}/${repo}/releases`;
      const response = await this.makeRequest(endpoint);

      if (!response.ok) {
        throw new Error(`Errore recupero release: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      DEBUG.error('Errore recupero release:', error);
      throw error;
    }
  }

  /**
   * PRIVATE METHODS
   */

  /**
   * Effettua richiesta HTTP con gestione rate limit
   * @param {string} endpoint - Endpoint API
   * @param {Object} options - Opzioni fetch
   * @returns {Promise<Response>} Response
   */
  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    // Controllo rate limit
    if (this.rateLimitRemaining <= 10) {
      const resetTime = new Date(this.rateLimitReset * 1000);
      const waitTime = resetTime - new Date();
      
      if (waitTime > 0) {
        DEBUG.warn(`⏳ Rate limit GitHub, attesa ${Math.ceil(waitTime / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'AIdeas-App/1.0.0',
        ...options.headers
      }
    });

    // Aggiorna info rate limit
    this.updateRateLimit(response);

    return response;
  }

  /**
   * Aggiorna informazioni rate limit
   * @param {Response} response - Response della richiesta
   */
  updateRateLimit(response) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining) this.rateLimitRemaining = parseInt(remaining);
    if (reset) this.rateLimitReset = parseInt(reset);

    if (this.rateLimitRemaining <= 50) {
      DEBUG.warn(`⚠️ Rate limit GitHub basso: ${this.rateLimitRemaining} rimanenti`);
    }
  }

  /**
   * Ottiene headers di autenticazione
   * @returns {Promise<Object>} Headers con token
   */
  async getAuthHeaders() {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Token GitHub non trovato');
    }

    return {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  /**
   * Salva token in modo sicuro
   * @param {string} token - GitHub token
   */
  async saveToken(token) {
    // In produzione, usa un sistema più sicuro
    const encrypted = btoa(token); // Crittografia base64 semplice
    localStorage.setItem('aideas_github_token', encrypted);
  }

  /**
   * Recupera token salvato
   * @returns {Promise<string|null>} Token se presente
   */
  async getToken() {
    const encrypted = localStorage.getItem('aideas_github_token');
    if (!encrypted) return null;

    try {
      return atob(encrypted);
    } catch (error) {
      DEBUG.error('Errore decrittazione token:', error);
      return null;
    }
  }

  /**
   * Rimuove token salvato
   */
  async clearToken() {
    localStorage.removeItem('aideas_github_token');
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
   * @param {number} timeout - Timeout custom (opzionale)
   */
  setCache(key, data, timeout = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout: timeout || this.cacheTimeout
    });
  }

  /**
   * Pulisce cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * SYNC INTEGRATION
   */

  /**
   * Upload dati di sync su Gist
   * @param {Object} syncData - Dati da sincronizzare (formato backup manuale)
   * @param {string} gistId - ID del Gist esistente (opzionale)
   * @returns {Promise<Object>} Risultato dell'upload
   */
  async uploadSyncData(syncData, gistId = null) {
    return await ErrorHandler.withRetry(async () => {
      // Validazione dati (formato backup manuale)
      if (!syncData || typeof syncData !== 'object') {
        throw new Error('Dati sync non validi');
      }

      if (!syncData.apps || !Array.isArray(syncData.apps)) {
        throw new Error('Dati sync incompleti: mancano le app');
      }

      if (!syncData.settings || typeof syncData.settings !== 'object') {
        throw new Error('Dati sync incompleti: mancano le settings');
      }

      // Crea backup automatico prima dell'upload
      const backupId = await ErrorHandler.createBackup('GitHub Upload', syncData);

      const gistContent = {
        description: 'AIdeas Sync Data',
        public: false,
        files: {
          'aideas-sync.json': {
            content: JSON.stringify(syncData, null, 2)
          },
          'aideas-meta.json': {
            content: JSON.stringify({
              version: syncData.version || '1.0.0',
              timestamp: syncData.timestamp || new Date().toISOString(),
              device: navigator.userAgent,
              checksum: await this.generateChecksum(syncData),
              backupId: backupId
            }, null, 2)
          }
        }
      };

      let result;
      if (gistId) {
        // Verifica che il Gist esista prima di aggiornarlo
        try {
          await this.getGist(gistId);
        } catch (error) {
          if (error.status === 404) {
            DEBUG.warn('Gist non trovato, creazione nuovo Gist');
            result = await this.createGist(gistContent);
          } else {
            throw error;
          }
        }
        
        if (!result) {
          result = await this.updateGist(gistId, gistContent);
        }
      } else {
        result = await this.createGist(gistContent);
      }

      // Validazione risultato
      if (!result || !result.id) {
        throw new Error('Risposta Gist non valida');
      }

      DEBUG.success(`✅ Dati sincronizzati su GitHub Gist: ${result.id}`);
      
      return {
        success: true,
        gistId: result.id,
        url: result.html_url,
        size: JSON.stringify(syncData).length,
        backupId: backupId
      };

    }, {
      operationName: `Upload sincronizzazione GitHub${gistId ? ' (aggiornamento)' : ' (nuovo)'}`,
      retryStrategy: 'RATE_LIMIT',
      timeout: 45000,
      context: { 
        gistId: gistId,
        dataSize: JSON.stringify(syncData || {}).length,
        appsCount: syncData?.apps?.length || 0
      },
      rollbackFn: async (error, context) => {
        DEBUG.warn(`🔄 Rollback upload GitHub - tentativo ripristino backup`);
        // Il backup viene mantenuto per recovery manuale
      },
      validateResult: (result) => {
        return result && result.success && result.gistId;
      }
    });
  }

  /**
   * Download dati di sync da Gist
   * @param {string} gistId - ID del Gist
   * @returns {Promise<Object>} Dati scaricati
   */
  async downloadSyncData(gistId) {
    return await ErrorHandler.withRetry(async () => {
      // Validazione parametri
      if (!gistId || typeof gistId !== 'string') {
        throw new Error('ID Gist non valido');
      }

      const gist = await this.getGist(gistId);
      
      // Verifica integrità Gist
      if (!gist || !gist.files) {
        throw new Error('Gist non valido o corrotto');
      }

      const syncFile = gist.files['aideas-sync.json'];
      const metaFile = gist.files['aideas-meta.json'];

      if (!syncFile) {
        throw new Error('File sync non trovato nel Gist');
      }

      // Parsing sicuro dei dati
      let syncData;
      try {
        syncData = JSON.parse(syncFile.content);
      } catch (parseError) {
        throw new Error('Dati sync corrotti o non validi');
      }

      // Validazione struttura dati (formato backup manuale)
      if (!syncData || typeof syncData !== 'object') {
        throw new Error('Formato dati sync non valido');
      }

      if (!syncData.apps || !Array.isArray(syncData.apps)) {
        throw new Error('Dati sync incompleti: mancano le app');
      }

      if (!syncData.settings || typeof syncData.settings !== 'object') {
        throw new Error('Dati sync incompleti: mancano le settings');
      }

      if (!syncData.timestamp) {
        throw new Error('Dati sync incompleti: mancante timestamp');
      }

      if (!syncData.version) {
        throw new Error('Dati sync incompleti: mancante version');
      }

      let metadata = null;
      let checksumValid = true;

      if (metaFile) {
        try {
          metadata = JSON.parse(metaFile.content);
          
          // Verifica checksum per integrità dati
          const currentChecksum = await this.generateChecksum(syncData);
          if (metadata.checksum && metadata.checksum !== currentChecksum) {
            checksumValid = false;
            DEBUG.warn('⚠️ Checksum sync data non corrisponde - possibile corruzione');
          }
        } catch (metaError) {
          DEBUG.warn('⚠️ Errore parsing metadati, continuo senza validazione');
        }
      }

      // Validazione aggiuntiva sui dati delle app
      if (syncData.apps && Array.isArray(syncData.apps)) {
        const invalidApps = syncData.apps.filter(app => !app.name || !app.type);
        if (invalidApps.length > 0) {
          DEBUG.warn(`⚠️ Trovate ${invalidApps.length} app con dati incompleti`);
        }
      }

      DEBUG.success(`✅ Scaricati dati sync da GitHub Gist: ${syncData.apps.length} app, ${Object.keys(syncData.settings).length} settings`);

      return {
        success: true,
        data: syncData,
        metadata,
        gistInfo: {
          id: gist.id,
          url: gist.html_url,
          updatedAt: gist.updated_at
        },
        validation: {
          checksumValid,
          appsCount: syncData.apps.length,
          settingsCount: Object.keys(syncData.settings).length,
          hasMetadata: !!metadata
        }
      };

    }, {
      operationName: `Download sincronizzazione GitHub (${gistId})`,
      retryStrategy: 'RATE_LIMIT',
      timeout: 30000,
      context: { 
        gistId: gistId
      },
      rollbackFn: async (error, context) => {
        DEBUG.warn(`⚠️ Errore download da GitHub - Gist: ${context.gistId}`);
        // Non c'è rollback per un download, ma possiamo loggare per debug
      },
      validateResult: (result) => {
        return result && result.success && result.data && result.data.apps && result.data.settings;
      }
    });
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
   * Ottiene statistiche rate limit
   * @returns {Object} Info rate limit
   */
  getRateLimitInfo() {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset ? new Date(this.rateLimitReset * 1000) : null,
      authenticated: this.authenticated
    };
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

      const endpoint = '/user';
      const response = await this.makeRequest(endpoint, {
        headers: await this.getAuthHeaders()
      });

      return {
        success: response.ok,
        user: response.ok ? await response.json() : null,
        rateLimit: this.getRateLimitInfo()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sincronizzazione bidirezionale
   * @returns {Promise<Object>} Risultato sincronizzazione
   */
  async syncBidirectional() {
    try {
      DEBUG.log('🔄 Avvio sincronizzazione bidirezionale GitHub...');
      
      if (!await this.isAuthenticated()) {
        throw new Error('Autenticazione richiesta');
      }

      // Carica dati locali usando il formato di backup manuale
      const StorageService = (await import('./StorageService.js')).default;
      const localData = await StorageService.exportBackupData();

      // Ottieni il gistId salvato
      const gistId = await StorageService.getSetting('githubGistId');
      
      let remoteData = null;
      let syncMessage = '';

      try {
        // Prova a scaricare dati remoti se esiste un gistId
        if (gistId) {
          const downloadResult = await this.downloadSyncData(gistId);
          remoteData = downloadResult.data;
          
          DEBUG.log('📥 Dati remoti scaricati:', {
            apps: remoteData.apps?.length || 0,
            hasSettings: !!remoteData.settings,
            timestamp: remoteData.timestamp
          });
        }

      } catch (downloadError) {
        DEBUG.warn('⚠️ Errore download dati remoti:', downloadError.message);
        
        // Gestione errori specifici
        if (downloadError.message.includes('ID Gist non valido') || 
            downloadError.message.includes('Gist non valido') || 
            downloadError.status === 404) {
          DEBUG.log('📤 Primo sync o Gist non trovato - caricamento dati locali');
          syncMessage = 'Primo sync: dati locali caricati su GitHub';
          
        } else if (downloadError.message.includes('corrotti') || downloadError.message.includes('non validi')) {
          DEBUG.warn('🔧 Dati corrotti rilevati - ricreazione');
          syncMessage = 'Dati corrotti sostituiti con dati locali';
          
        } else {
          // Altri errori - rilancia
          throw downloadError;
        }
      }

      // Determina strategia di sincronizzazione
      let finalData = localData;
      
      if (remoteData) {
        // Confronta timestamp per determinare quale versione è più recente
        const localTimestamp = localData.timestamp ? new Date(localData.timestamp).getTime() : 0;
        const remoteTimestamp = remoteData.timestamp ? new Date(remoteData.timestamp).getTime() : 0;

        if (remoteTimestamp > localTimestamp) {
          DEBUG.log('📥 Dati remoti più recenti - download');
          finalData = remoteData;
          syncMessage = syncMessage || 'Dati scaricati da GitHub';
          
          // Aggiorna dati locali
          await StorageService.importBackupData(finalData);
          
        } else {
          DEBUG.log('📤 Dati locali più recenti - upload');
          finalData = localData;
          syncMessage = syncMessage || 'Dati caricati su GitHub';
        }
      }

      // Carica dati aggiornati
      const uploadResult = await this.uploadSyncData(finalData, gistId);
      
      // Salva il gistId se è nuovo
      if (uploadResult.gistId && !gistId) {
        await StorageService.setSetting('githubGistId', uploadResult.gistId);
      }

      DEBUG.log('✅ Sincronizzazione bidirezionale completata:', {
        apps: finalData.apps?.length || 0,
        hasSettings: !!finalData.settings,
        message: syncMessage,
        gistId: uploadResult.gistId
      });

      return {
        success: true,
        message: syncMessage,
        syncedAt: new Date().toISOString(),
        apps: finalData.apps?.length || 0,
        gistId: uploadResult.gistId
      };

    } catch (error) {
      DEBUG.error('❌ Errore sincronizzazione bidirezionale GitHub:', error);
      throw error;
    }
  }
}