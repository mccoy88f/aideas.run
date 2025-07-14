import { DEBUG } from '../utils/debug.js';
/**
 * AIdeas - App Analyzer Service
 * Analizza le app senza modificarle per fornire informazioni dettagliate
 */

/**
 * Servizio per l'analisi non-invasiva delle applicazioni
 */
export default class AppAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minuti
  }

  /**
   * Analizza un'app e restituisce informazioni dettagliate
   * @param {Object} app - App da analizzare
   * @returns {Promise<Object>} Risultato dell'analisi
   */
  async analyzeApp(app) {
    try {
      DEBUG.log(`🔍 Analisi app: ${app.name}`);

      // Controlla cache
      const cacheKey = `app:${app.id}:${app.lastModified || Date.now()}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        DEBUG.log(`♻️ Usando analisi cached per ${app.name}`);
        return cached;
      }

      const analysis = {
        appId: app.id,
        appName: app.name,
        appType: app.type,
        timestamp: new Date().toISOString(),
        summary: {
          totalFiles: 0,
          totalSize: 0,
          htmlFiles: 0,
          scriptFiles: 0,
          styleFiles: 0,
          imageFiles: 0,
          otherFiles: 0,
          externalReferences: 0,
          localReferences: 0
        },
        files: [],
        externalReferences: [],
        localReferences: [],
        permissions: [],
        security: {
          risks: [],
          warnings: [],
          info: []
        },
        metadata: {}
      };

      // Analizza in base al tipo di app
      switch (app.type) {
        case 'zip':
          await this.analyzeZipApp(app, analysis);
          break;
        case 'html':
          await this.analyzeHtmlApp(app, analysis);
          break;
        case 'url':
          await this.analyzeUrlApp(app, analysis);
          break;
        case 'github':
          await this.analyzeGitHubApp(app, analysis);
          break;
        default:
          analysis.security.info.push('Tipo di app non supportato per l\'analisi dettagliata');
      }

      // Salva in cache
      this.setCache(cacheKey, analysis);

      DEBUG.log(`✅ Analisi completata per ${app.name}:`, {
        files: analysis.summary.totalFiles,
        external: analysis.summary.externalReferences,
        local: analysis.summary.localReferences
      });

      return analysis;

    } catch (error) {
      DEBUG.error('Errore durante l\'analisi app:', error);
      return {
        appId: app.id,
        appName: app.name,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analizza un'app di tipo ZIP
   * @param {Object} app - App ZIP
   * @param {Object} analysis - Oggetto analisi da riempire
   */
  async analyzeZipApp(app, analysis) {
    if (!app.files || app.files.length === 0) {
      analysis.security.warnings.push('App ZIP senza file associati');
      return;
    }

    analysis.summary.totalFiles = app.files.length;

    // Analizza ogni file
    for (const file of app.files) {
      const fileAnalysis = await this.analyzeFile(file);
      analysis.files.push(fileAnalysis);

      // Aggiorna contatori
      this.updateSummaryCounters(analysis.summary, fileAnalysis);

      // Estrai riferimenti esterni e locali
      if (fileAnalysis.references) {
        analysis.externalReferences.push(...fileAnalysis.references.external);
        analysis.localReferences.push(...fileAnalysis.references.local);
      }

      // Aggiungi permessi richiesti
      if (fileAnalysis.permissions) {
        analysis.permissions.push(...fileAnalysis.permissions);
      }

      // Aggiungi problemi di sicurezza
      if (fileAnalysis.security) {
        analysis.security.risks.push(...fileAnalysis.security.risks);
        analysis.security.warnings.push(...fileAnalysis.security.warnings);
        analysis.security.info.push(...fileAnalysis.security.info);
      }
    }

    // Rimuovi duplicati
    analysis.externalReferences = [...new Set(analysis.externalReferences)];
    analysis.localReferences = [...new Set(analysis.localReferences)];
    analysis.permissions = [...new Set(analysis.permissions)];
    analysis.summary.externalReferences = analysis.externalReferences.length;
    analysis.summary.localReferences = analysis.localReferences.length;

    // Trova file principale
    const mainFile = app.files.find(f => 
      f.filename.toLowerCase() === 'index.html' ||
      f.filename.toLowerCase().endsWith('/index.html')
    );

    if (mainFile) {
      analysis.metadata.mainFile = mainFile.filename;
      analysis.metadata.hasMainFile = true;
    } else {
      analysis.security.warnings.push('Nessun file index.html trovato');
      analysis.metadata.hasMainFile = false;
    }
  }

  /**
   * Analizza un'app HTML
   * @param {Object} app - App HTML
   * @param {Object} analysis - Oggetto analisi da riempire
   */
  async analyzeHtmlApp(app, analysis) {
    if (!app.content) {
      analysis.security.warnings.push('App HTML senza contenuto');
      return;
    }

    analysis.summary.totalFiles = 1;
    analysis.summary.htmlFiles = 1;
    analysis.summary.totalSize = app.content.length;

    // Analizza il contenuto HTML
    const htmlAnalysis = await this.analyzeHtmlContent(app.content, 'main.html');
    htmlAnalysis.size = app.content.length; // Assicura che la dimensione sia inclusa
    analysis.files.push(htmlAnalysis);

    // Estrai riferimenti
    if (htmlAnalysis.references) {
      analysis.externalReferences = htmlAnalysis.references.external;
      analysis.localReferences = htmlAnalysis.references.local;
      analysis.summary.externalReferences = analysis.externalReferences.length;
      analysis.summary.localReferences = analysis.localReferences.length;
    }

    // Aggiungi permessi e sicurezza
    if (htmlAnalysis.permissions) {
      analysis.permissions = htmlAnalysis.permissions;
    }

    if (htmlAnalysis.security) {
      analysis.security = htmlAnalysis.security;
    }
  }

  /**
   * Analizza un'app URL
   * @param {Object} app - App URL
   * @param {Object} analysis - Oggetto analisi da riempire
   */
  async analyzeUrlApp(app, analysis) {
    if (!app.url) {
      analysis.security.warnings.push('App URL senza URL definito');
      return;
    }

    analysis.summary.totalFiles = 1;
    analysis.externalReferences = [app.url];
    analysis.summary.externalReferences = 1;

    // Analizza URL
    try {
      const urlObj = new URL(app.url);
      analysis.metadata.domain = urlObj.hostname;
      analysis.metadata.protocol = urlObj.protocol;
      analysis.metadata.isSecure = urlObj.protocol === 'https:';

      if (!analysis.metadata.isSecure) {
        analysis.security.warnings.push('URL non sicuro (HTTP invece di HTTPS)');
      }

      // Controlla dominio
      if (this.isKnownCDN(urlObj.hostname)) {
        analysis.security.info.push(`URL punta a CDN conosciuto: ${urlObj.hostname}`);
      } else {
        analysis.security.info.push(`URL punta a dominio esterno: ${urlObj.hostname}`);
      }

      // Permessi richiesti per app URL
      analysis.permissions = ['internet-access', 'external-content'];

    } catch (error) {
      analysis.security.risks.push('URL malformato o non valido');
    }
  }

  /**
   * Analizza un'app GitHub
   * @param {Object} app - App GitHub
   * @param {Object} analysis - Oggetto analisi da riempire
   */
  async analyzeGitHubApp(app, analysis) {
    try {
      const githubUrl = app.url || app.githubUrl;
      if (!githubUrl) {
        analysis.security.warnings.push('App GitHub senza URL del repository');
        return;
      }

      // Estrai owner e repo dall'URL GitHub
      const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        analysis.security.risks.push('URL GitHub non valido');
        return;
      }

      const [, owner, repo] = match;
      analysis.metadata.githubOwner = owner;
      analysis.metadata.githubRepo = repo;
      analysis.metadata.githubUrl = githubUrl;

      DEBUG.log(`🔍 Analisi app GitHub: ${owner}/${repo}`);

      // Importa GitHubService dinamicamente
      const { default: GitHubService } = await import('./GitHubService.js');
      const githubService = new GitHubService();

      // Scarica la lista dei file del repository
      const files = await this.downloadGitHubFiles(githubService, owner, repo);
      
      if (!files || files.length === 0) {
        analysis.security.warnings.push('Repository GitHub vuoto o inaccessibile');
        return;
      }

      analysis.summary.totalFiles = files.length;

      // Analizza ogni file scaricato
      for (const file of files) {
        const fileAnalysis = await this.analyzeFile(file);
        analysis.files.push(fileAnalysis);

        // Aggiorna contatori
        this.updateSummaryCounters(analysis.summary, fileAnalysis);

        // Estrai riferimenti esterni e locali
        if (fileAnalysis.references) {
          analysis.externalReferences.push(...fileAnalysis.references.external);
          analysis.localReferences.push(...fileAnalysis.references.local);
        }

        // Aggiungi permessi richiesti
        if (fileAnalysis.permissions) {
          analysis.permissions.push(...fileAnalysis.permissions);
        }

        // Aggiungi problemi di sicurezza
        if (fileAnalysis.security) {
          analysis.security.risks.push(...fileAnalysis.security.risks);
          analysis.security.warnings.push(...fileAnalysis.security.warnings);
          analysis.security.info.push(...fileAnalysis.security.info);
        }
      }

      // Rimuovi duplicati
      analysis.externalReferences = [...new Set(analysis.externalReferences)];
      analysis.localReferences = [...new Set(analysis.localReferences)];
      analysis.permissions = [...new Set(analysis.permissions)];
      analysis.summary.externalReferences = analysis.externalReferences.length;
      analysis.summary.localReferences = analysis.localReferences.length;

      // Trova file principale
      const mainFile = files.find(f => 
        f.filename.toLowerCase() === 'index.html' ||
        f.filename.toLowerCase().endsWith('/index.html')
      );

      if (mainFile) {
        analysis.metadata.mainFile = mainFile.filename;
        analysis.metadata.hasMainFile = true;
      } else {
        analysis.security.warnings.push('Nessun file index.html trovato nel repository');
        analysis.metadata.hasMainFile = false;
      }

      // Aggiungi permessi specifici GitHub
      analysis.permissions.push('internet-access', 'external-content');

      DEBUG.log(`✅ Analisi GitHub completata: ${files.length} file analizzati`);

    } catch (error) {
      DEBUG.error('Errore analisi app GitHub:', error);
      analysis.security.risks.push(`Errore accesso repository GitHub: ${error.message}`);
    }
  }

  /**
   * Analizza un singolo file
   * @param {Object} file - File da analizzare
   * @returns {Promise<Object>} Analisi del file
   */
  async analyzeFile(file) {
    const fileAnalysis = {
      filename: file.filename,
      size: file.size || (file.content ? file.content.length : 0),
      mimeType: file.mimeType || this.getMimeType(file.filename),
      type: this.getFileType(file.filename),
      content: file.content, // Include il contenuto del file per la visualizzazione
      references: { external: [], local: [] },
      permissions: [],
      security: { risks: [], warnings: [], info: [] }
    };

    // Analizza in base al tipo di file
    if (fileAnalysis.type === 'html') {
      const htmlAnalysis = await this.analyzeHtmlContent(file.content, file.filename);
      Object.assign(fileAnalysis, htmlAnalysis);
    } else if (fileAnalysis.type === 'script') {
      const scriptAnalysis = await this.analyzeScriptContent(file.content, file.filename);
      Object.assign(fileAnalysis, scriptAnalysis);
    } else if (fileAnalysis.type === 'style') {
      const styleAnalysis = await this.analyzeStyleContent(file.content, file.filename);
      Object.assign(fileAnalysis, styleAnalysis);
    }

    return fileAnalysis;
  }

  /**
   * Analizza contenuto HTML
   * @param {string} content - Contenuto HTML
   * @param {string} filename - Nome del file
   * @returns {Promise<Object>} Analisi HTML
   */
  async analyzeHtmlContent(content, filename) {
    const analysis = {
      filename,
      type: 'html',
      references: { external: [], local: [] },
      permissions: [],
      security: { risks: [], warnings: [], info: [] }
    };

    if (!content) return analysis;

    // Cerca script esterni
    const scriptMatches = content.match(/<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi);
    if (scriptMatches) {
      for (const match of scriptMatches) {
        const srcMatch = match.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch) {
          const src = srcMatch[1];
          if (this.isExternalReference(src)) {
            analysis.references.external.push(src);
            analysis.permissions.push('external-scripts');
          } else {
            analysis.references.local.push(src);
          }
        }
      }
    }

    // Cerca CSS esterni
    const cssMatches = content.match(/<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi);
    if (cssMatches) {
      for (const match of cssMatches) {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
        if (hrefMatch) {
          const href = hrefMatch[1];
          if (this.isExternalReference(href)) {
            analysis.references.external.push(href);
            analysis.permissions.push('external-styles');
          } else {
            analysis.references.local.push(href);
          }
        }
      }
    }

    // Cerca immagini
    const imgMatches = content.match(/<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi);
    if (imgMatches) {
      for (const match of imgMatches) {
        const srcMatch = match.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch) {
          const src = srcMatch[1];
          if (this.isExternalReference(src)) {
            analysis.references.external.push(src);
            analysis.permissions.push('external-images');
          } else {
            analysis.references.local.push(src);
          }
        }
      }
    }

    // Cerca iframe
    const iframeMatches = content.match(/<iframe[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi);
    if (iframeMatches) {
      for (const match of iframeMatches) {
        const srcMatch = match.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch) {
          const src = srcMatch[1];
          if (this.isExternalReference(src)) {
            analysis.references.external.push(src);
            analysis.permissions.push('iframe-access');
            analysis.security.info.push(`Iframe esterno: ${src}`);
          } else {
            analysis.references.local.push(src);
          }
        }
      }
    }

    // Cerca API calls inline
    const fetchMatches = content.match(/fetch\s*\(\s*["']([^"']+)["']/gi);
    if (fetchMatches) {
      for (const match of fetchMatches) {
        const urlMatch = match.match(/fetch\s*\(\s*["']([^"']+)["']/i);
        if (urlMatch) {
          const url = urlMatch[1];
          if (this.isExternalReference(url)) {
            analysis.references.external.push(url);
            analysis.permissions.push('api-access');
            analysis.security.info.push(`API call: ${url}`);
          }
        }
      }
    }

    // Cerca localStorage/sessionStorage
    if (content.includes('localStorage') || content.includes('sessionStorage')) {
      analysis.permissions.push('local-storage');
      analysis.security.info.push('Utilizza storage locale');
    }

    // Cerca geolocation
    if (content.includes('navigator.geolocation')) {
      analysis.permissions.push('geolocation');
      analysis.security.info.push('Richiede accesso alla posizione');
    }

    // Cerca camera/microfono
    if (content.includes('getUserMedia') || content.includes('mediaDevices')) {
      analysis.permissions.push('media-devices');
      analysis.security.info.push('Richiede accesso a camera/microfono');
    }

    // Cerca notification
    if (content.includes('Notification')) {
      analysis.permissions.push('notifications');
      analysis.security.info.push('Può inviare notifiche');
    }

    // Rimuovi duplicati
    analysis.references.external = [...new Set(analysis.references.external)];
    analysis.references.local = [...new Set(analysis.references.local)];
    analysis.permissions = [...new Set(analysis.permissions)];

    return analysis;
  }

  /**
   * Analizza contenuto JavaScript
   * @param {string} content - Contenuto JavaScript
   * @param {string} filename - Nome del file
   * @returns {Promise<Object>} Analisi JavaScript
   */
  async analyzeScriptContent(content, filename) {
    const analysis = {
      filename,
      type: 'script',
      references: { external: [], local: [] },
      permissions: [],
      security: { risks: [], warnings: [], info: [] }
    };

    if (!content) return analysis;

    // Cerca importazioni
    const importMatches = content.match(/import\s+.*?from\s+["']([^"']+)["']/gi);
    if (importMatches) {
      for (const match of importMatches) {
        const moduleMatch = match.match(/from\s+["']([^"']+)["']/i);
        if (moduleMatch) {
          const module = moduleMatch[1];
          if (this.isExternalReference(module)) {
            analysis.references.external.push(module);
          } else {
            analysis.references.local.push(module);
          }
        }
      }
    }

    // Cerca require
    const requireMatches = content.match(/require\s*\(\s*["']([^"']+)["']\s*\)/gi);
    if (requireMatches) {
      for (const match of requireMatches) {
        const moduleMatch = match.match(/require\s*\(\s*["']([^"']+)["']/i);
        if (moduleMatch) {
          const module = moduleMatch[1];
          if (this.isExternalReference(module)) {
            analysis.references.external.push(module);
          } else {
            analysis.references.local.push(module);
          }
        }
      }
    }

    // Cerca API calls
    const fetchMatches = content.match(/fetch\s*\(\s*["']([^"']+)["']/gi);
    if (fetchMatches) {
      for (const match of fetchMatches) {
        const urlMatch = match.match(/fetch\s*\(\s*["']([^"']+)["']/i);
        if (urlMatch) {
          const url = urlMatch[1];
          if (this.isExternalReference(url)) {
            analysis.references.external.push(url);
            analysis.permissions.push('api-access');
          }
        }
      }
    }

    // Controlla permessi
    if (content.includes('localStorage') || content.includes('sessionStorage')) {
      analysis.permissions.push('local-storage');
    }

    if (content.includes('navigator.geolocation')) {
      analysis.permissions.push('geolocation');
    }

    if (content.includes('getUserMedia') || content.includes('mediaDevices')) {
      analysis.permissions.push('media-devices');
    }

    if (content.includes('Notification')) {
      analysis.permissions.push('notifications');
    }

    // Controlla codice potenzialmente pericoloso
    if (content.includes('eval(')) {
      analysis.security.risks.push('Utilizza eval() - potenzialmente pericoloso');
    }

    if (content.includes('innerHTML') && content.includes('=')) {
      analysis.security.warnings.push('Modifica innerHTML - possibile XSS');
    }

    if (content.includes('document.write')) {
      analysis.security.warnings.push('Utilizza document.write - deprecato');
    }

    // Rimuovi duplicati
    analysis.references.external = [...new Set(analysis.references.external)];
    analysis.references.local = [...new Set(analysis.references.local)];
    analysis.permissions = [...new Set(analysis.permissions)];

    return analysis;
  }

  /**
   * Analizza contenuto CSS
   * @param {string} content - Contenuto CSS
   * @param {string} filename - Nome del file
   * @returns {Promise<Object>} Analisi CSS
   */
  async analyzeStyleContent(content, filename) {
    const analysis = {
      filename,
      type: 'style',
      references: { external: [], local: [] },
      permissions: [],
      security: { risks: [], warnings: [], info: [] }
    };

    if (!content) return analysis;

    // Cerca @import
    const importMatches = content.match(/@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi);
    if (importMatches) {
      for (const match of importMatches) {
        const urlMatch = match.match(/@import\s+(?:url\()?["']?([^"')]+)["']?\)?/i);
        if (urlMatch) {
          const url = urlMatch[1];
          if (this.isExternalReference(url)) {
            analysis.references.external.push(url);
          } else {
            analysis.references.local.push(url);
          }
        }
      }
    }

    // Cerca url() in CSS
    const urlMatches = content.match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi);
    if (urlMatches) {
      for (const match of urlMatches) {
        const urlMatch = match.match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/i);
        if (urlMatch) {
          const url = urlMatch[1];
          if (this.isExternalReference(url)) {
            analysis.references.external.push(url);
            analysis.permissions.push('external-fonts');
          } else {
            analysis.references.local.push(url);
          }
        }
      }
    }

    // Rimuovi duplicati
    analysis.references.external = [...new Set(analysis.references.external)];
    analysis.references.local = [...new Set(analysis.references.local)];
    analysis.permissions = [...new Set(analysis.permissions)];

    return analysis;
  }

  /**
   * Utilities
   */

  /**
   * Determina se un riferimento è esterno
   * @param {string} ref - Riferimento da controllare
   * @returns {boolean} True se esterno
   */
  isExternalReference(ref) {
    if (!ref) return false;
    return ref.startsWith('http://') || 
           ref.startsWith('https://') || 
           ref.startsWith('//');
  }

  /**
   * Determina il tipo di file
   * @param {string} filename - Nome del file
   * @returns {string} Tipo di file
   */
  getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    const types = {
      html: ['html', 'htm'],
      script: ['js', 'jsx', 'ts', 'tsx', 'mjs'],
      style: ['css', 'scss', 'sass', 'less'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'],
      font: ['woff', 'woff2', 'ttf', 'otf', 'eot'],
      json: ['json', 'jsonld'],
      xml: ['xml', 'xhtml'],
      text: ['txt', 'md', 'readme']
    };

    for (const [type, extensions] of Object.entries(types)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }

    return 'other';
  }

  /**
   * Determina il MIME type di un file
   * @param {string} filename - Nome del file
   * @returns {string} MIME type
   */
  getMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    const mimeTypes = {
      'html': 'text/html',
      'htm': 'text/html',
      'js': 'application/javascript',
      'jsx': 'application/javascript',
      'ts': 'application/typescript',
      'tsx': 'application/typescript',
      'css': 'text/css',
      'scss': 'text/css',
      'sass': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'xml': 'application/xml',
      'pdf': 'application/pdf',
      'zip': 'application/zip'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Verifica se un dominio è un CDN noto
   * @param {string} domain - Dominio da verificare
   * @returns {boolean} True se è un CDN noto
   */
  isKnownCDN(domain) {
    const knownCDNs = [
      'unpkg.com',
      'cdnjs.cloudflare.com',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'ajax.googleapis.com',
      'code.jquery.com',
      'maxcdn.bootstrapcdn.com',
      'stackpath.bootstrapcdn.com',
      'use.fontawesome.com',
      'cdn.tailwindcss.com'
    ];

    return knownCDNs.some(cdn => domain.includes(cdn));
  }

  /**
   * Aggiorna i contatori del sommario
   * @param {Object} summary - Oggetto sommario
   * @param {Object} fileAnalysis - Analisi del file
   */
  updateSummaryCounters(summary, fileAnalysis) {
    // Aggiorna dimensione totale
    summary.totalSize += fileAnalysis.size || 0;

    // Aggiorna contatori per tipo
    switch (fileAnalysis.type) {
      case 'html':
        summary.htmlFiles++;
        break;
      case 'script':
        summary.scriptFiles++;
        break;
      case 'style':
        summary.styleFiles++;
        break;
      case 'image':
        summary.imageFiles++;
        break;
      default:
        summary.otherFiles++;
    }
  }

  /**
   * Gestione cache
   */
  getFromCache(key) {
    const cached = this.analysisCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.analysisCache.clear();
  }

  /**
   * Scarica i file principali da un repository GitHub per l'analisi
   * @param {GitHubService} githubService - Servizio GitHub
   * @param {string} owner - Proprietario del repository
   * @param {string} repo - Nome del repository
   * @returns {Promise<Array>} Lista file scaricati
   */
  async downloadGitHubFiles(githubService, owner, repo) {
    try {
      DEBUG.log(`📥 Download file da GitHub: ${owner}/${repo}`);

      // Ottieni la lista dei contenuti del repository
      const contents = await githubService.getDirectoryContents(owner, repo);
      
      if (!contents || contents.length === 0) {
        DEBUG.warn('Repository vuoto o inaccessibile');
        return [];
      }

      const files = [];
      const importantFiles = ['index.html', 'main.html', 'app.html', 'index.js', 'main.js', 'app.js', 'style.css', 'main.css', 'app.css'];
      
      // Prima cerca i file importanti nella root
      for (const item of contents) {
        if (item.type === 'file' && this.isImportantFile(item.name, importantFiles)) {
          try {
            const fileContent = await githubService.getFileContent(owner, repo, item.path);
            files.push({
              filename: item.name,
              content: fileContent.decodedContent || fileContent.content,
              size: fileContent.size,
              mimeType: this.getMimeType(item.name)
            });
            DEBUG.log(`📄 Scaricato file importante: ${item.name}`);
          } catch (error) {
            DEBUG.warn(`⚠️ Errore download ${item.name}:`, error.message);
          }
        }
      }

      // Se non ci sono file importanti, scarica almeno index.html se esiste
      if (files.length === 0) {
        const indexFile = contents.find(item => item.type === 'file' && item.name.toLowerCase() === 'index.html');
        if (indexFile) {
          try {
            const fileContent = await githubService.getFileContent(owner, repo, indexFile.path);
            files.push({
              filename: indexFile.name,
              content: fileContent.decodedContent || fileContent.content,
              size: fileContent.size,
              mimeType: this.getMimeType(indexFile.name)
            });
            DEBUG.log(`📄 Scaricato index.html di fallback`);
          } catch (error) {
            DEBUG.warn(`⚠️ Errore download index.html:`, error.message);
          }
        }
      }

      // Se ancora non ci sono file, scarica i primi 5 file di testo dalla root
      if (files.length === 0) {
        let downloaded = 0;
        for (const item of contents) {
          if (downloaded >= 5) break;
          if (item.type === 'file' && this.isTextFile(item.name)) {
            try {
              const fileContent = await githubService.getFileContent(owner, repo, item.path);
              files.push({
                filename: item.name,
                content: fileContent.decodedContent || fileContent.content,
                size: fileContent.size,
                mimeType: this.getMimeType(item.name)
              });
              downloaded++;
              DEBUG.log(`📄 Scaricato file di fallback: ${item.name}`);
            } catch (error) {
              DEBUG.warn(`⚠️ Errore download ${item.name}:`, error.message);
            }
          }
        }
      }

      DEBUG.log(`✅ Download completato: ${files.length} file scaricati`);
      return files;

    } catch (error) {
      DEBUG.error('Errore download file GitHub:', error);
      return [];
    }
  }

  /**
   * Verifica se un file è considerato importante per l'analisi
   * @param {string} filename - Nome del file
   * @param {Array} importantFiles - Lista file importanti
   * @returns {boolean} Se il file è importante
   */
  isImportantFile(filename, importantFiles) {
    const lowerName = filename.toLowerCase();
    return importantFiles.some(important => lowerName === important) || 
           lowerName.endsWith('.html') || 
           lowerName.endsWith('.js') || 
           lowerName.endsWith('.css');
  }

  /**
   * Verifica se un file è di tipo testo
   * @param {string} filename - Nome del file
   * @returns {boolean} Se il file è di testo
   */
  isTextFile(filename) {
    const textExtensions = ['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'sass', 'json', 'xml', 'txt', 'md', 'readme'];
    const extension = filename.split('.').pop().toLowerCase();
    return textExtensions.includes(extension);
  }
} 