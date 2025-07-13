  import { DEBUG } from '../utils/debug.js';
import ErrorHandler from './ErrorHandler.js';
import GitHubService from './GitHubService.js';
import StorageService from './StorageService.js';

/**
 * AIdeas Store Service
 * Gestisce il download e la gestione delle app dallo store
 */
export default class StoreService {
  constructor() {
    this.githubService = new GitHubService();
    this.storeRepo = {
      owner: 'mccoy88f',
      repo: 'aideas.store',
      branch: 'main'
    };
    this.cacheTimeout = 10 * 60 * 1000; // 10 minuti
    this.cache = new Map();
    this.lastUpdate = null;
    this.pollingEnabled = false;
    this.isStoreOpen = false;
  }

  /**
   * Ottiene la lista delle app disponibili nello store
   * @returns {Promise<Array>} Lista delle app disponibili
   */
  async getAvailableApps() {
    return await ErrorHandler.withRetry(async () => {
      try {
        DEBUG.log('🛍️ Recupero app disponibili dallo store...');
        
        // Ottieni il contenuto della directory apps/
        const contents = await this.githubService.getDirectoryContents(
          this.storeRepo.owner,
          this.storeRepo.repo,
          'apps',
          this.storeRepo.branch
        );

        const apps = [];
        
        for (const item of contents) {
          if (item.type === 'dir') {
            try {
              // Leggi il manifest dell'app
              const manifestContent = await this.githubService.getFileContent(
                this.storeRepo.owner,
                this.storeRepo.repo,
                `apps/${item.name}/aideas.json`,
                this.storeRepo.branch
              );

              if (manifestContent && manifestContent.decodedContent) {
                const manifest = JSON.parse(manifestContent.decodedContent);
                
                apps.push({
                  id: item.name,
                  name: manifest.name || item.name,
                  description: manifest.description || '',
                  author: manifest.author || 'Unknown',
                  version: manifest.version || '1.0.0',
                  category: manifest.category || 'altro',
                  tags: manifest.tags || [],
                  icon: manifest.icon || null,
                  githubUrl: manifest.githubUrl || null,
                  downloadUrl: `https://github.com/${this.storeRepo.owner}/${this.storeRepo.repo}/archive/refs/heads/${this.storeRepo.branch}.zip`,
                  installDate: null,
                  lastUsed: null,
                  favorite: false,
                  type: 'store',
                  storeId: item.name,
                  manifest: manifest
                });
              }
            } catch (error) {
              DEBUG.warn(`⚠️ Errore lettura manifest per ${item.name}:`, error);
            }
          }
        }

        // Aggiorna timestamp ultimo aggiornamento
        this.lastUpdate = new Date();
        
        DEBUG.success(`✅ Trovate ${apps.length} app nello store`);
        return apps;

      } catch (error) {
        DEBUG.error('❌ Errore recupero app store:', error);
        throw new Error('Impossibile recuperare le app dallo store');
      }
    }, {
      operationName: 'Recupero app store',
      retryStrategy: 'NETWORK_ERROR',
      timeout: 30000
    });
  }

  /**
   * Installa un'app dallo store
   * @param {string} storeId - ID dell'app nello store
   * @returns {Promise<string>} ID dell'app installata
   */
  async installAppFromStore(storeId) {
    return await ErrorHandler.withRetry(async () => {
      try {
        DEBUG.log(`📦 Installazione app ${storeId} dallo store...`);

        // Prima ottieni il manifest dallo store per capire da dove scaricare i file
        const manifestContent = await this.githubService.getFileContent(
          this.storeRepo.owner,
          this.storeRepo.repo,
          `apps/${storeId}/aideas.json`,
          this.storeRepo.branch
        );

        if (!manifestContent || !manifestContent.decodedContent) {
          throw new Error(`Manifest non trovato per l'app ${storeId}`);
        }

        const manifest = JSON.parse(manifestContent.decodedContent);
        
        // Controlla se l'app è già installata
        const existingApps = await StorageService.getAllApps();
        const isAlreadyInstalled = existingApps.some(app => 
          app.storeId === storeId || 
          (app.githubUrl && manifest.githubUrl && app.githubUrl === manifest.githubUrl)
        );

        if (isAlreadyInstalled) {
          throw new Error(`App "${manifest.name || storeId}" è già installata`);
        }

        // Determina la sorgente dei file
        let appFiles = [];
        
        if (manifest.githubUrl) {
          // Scarica dalla repo dell'app originale
          DEBUG.log(`📥 Scaricamento file dalla repo originale: ${manifest.githubUrl}`);
          
          // Estrai owner e repo dall'URL GitHub
          const githubMatch = manifest.githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          if (!githubMatch) {
            throw new Error('URL GitHub non valido nel manifest');
          }
          
          const [, owner, repo] = githubMatch;
          
          // Scarica il repository dell'app
          const repoBlob = await this.githubService.downloadRepositoryZip(owner, repo, 'main');
          const repoText = await repoBlob.text();
          const repoData = JSON.parse(repoText);
          
          // Estrai tutti i file del repository
          for (const [filePath, fileContent] of Object.entries(repoData.files)) {
            // Salta file di sistema GitHub
            if (filePath.startsWith('.github/') || 
                filePath === 'README.md' || 
                filePath === '.gitignore' ||
                filePath === 'aideas.json') {
              continue;
            }
            
            const fileData = {
              filename: filePath,
              content: fileContent,
              size: fileContent.length,
              mimeType: this.getMimeType(filePath)
            };
            appFiles.push(fileData);
          }
        } else {
          // Scarica dalla repo dello store (fallback)
          DEBUG.log(`📥 Scaricamento file dalla repo dello store (fallback)`);
          
          const repoBlob = await this.githubService.downloadRepositoryZip(
            this.storeRepo.owner,
            this.storeRepo.repo,
            this.storeRepo.branch
          );

          const repoText = await repoBlob.text();
          const repoData = JSON.parse(repoText);
          
          let appZipFile = null;
          
          for (const [filePath, fileContent] of Object.entries(repoData.files)) {
            if (filePath.includes(`apps/${storeId}/`)) {
              const relativePath = filePath.replace(`apps/${storeId}/`, '');
              
              if (relativePath.endsWith('.zip')) {
                appZipFile = fileContent;
              } else if (relativePath !== 'aideas.json') {
                const fileData = {
                  filename: relativePath,
                  content: fileContent,
                  size: fileContent.length,
                  mimeType: this.getMimeType(relativePath)
                };
                appFiles.push(fileData);
              }
            }
          }

          // Se c'è un file ZIP, estrai i file da quello
          if (appZipFile) {
            DEBUG.log('📦 Estrazione file da ZIP dell\'app...');
            
            const JSZip = (await import('jszip')).default;
            const zipBlob = new Blob([appZipFile], { type: 'application/zip' });
            const appZip = new JSZip();
            const appZipContents = await appZip.loadAsync(zipBlob);
            
            for (const [filename, fileObj] of Object.entries(appZipContents.files)) {
              if (fileObj.dir) continue;
              
              const content = await fileObj.async('text');
              const fileData = {
                filename: filename,
                content: content,
                size: content.length,
                mimeType: this.getMimeType(filename)
              };
              appFiles.push(fileData);
            }
          }
        }

        if (appFiles.length === 0) {
          throw new Error(`Nessun file trovato per l'app ${storeId}`);
        }

        // Estrai metadati dal manifest
        const metadata = this.extractStoreMetadata(appFiles, manifest, storeId);
        
        // Installa l'app
        const appId = await StorageService.installApp({
          ...metadata,
          files: appFiles,
          manifest: manifest || {},
          type: 'zip',
          storeId: storeId
        });

        DEBUG.success(`✅ App ${manifest.name || storeId} installata con successo`);
        return appId;

      } catch (error) {
        DEBUG.error('❌ Errore installazione app store:', error);
        throw new Error(`Impossibile installare l'app: ${error.message}`);
      }
    }, {
      operationName: `Installazione app store ${storeId}`,
      retryStrategy: 'NETWORK_ERROR',
      timeout: 60000
    });
  }

  /**
   * Prepara una pull request per sottomettere un'app allo store
   * @param {Object} app - App da sottomettere
   * @returns {Promise<Object>} Informazioni sulla pull request
   */
  async submitAppToStore(app) {
    return await ErrorHandler.withRetry(async () => {
      try {
        DEBUG.log(`📤 Sottomissione app ${app.name} allo store...`);

        // Verifica autenticazione GitHub
        if (!this.githubService.authenticated) {
          throw new Error('Autenticazione GitHub richiesta per sottomettere app');
        }

        // Prepara i dati dell'app per lo store
        const storeData = await this.prepareAppForStore(app);
        
        // Verifica se esiste già un fork
        let forkData = await this.githubService.getExistingFork(
          this.storeRepo.owner, 
          this.storeRepo.repo
        );
        
        // Se non esiste, crea il fork
        if (!forkData) {
          DEBUG.log('🍴 Creazione fork dello store...');
          forkData = await this.githubService.createFork(
            this.storeRepo.owner, 
            this.storeRepo.repo
          );
        }
        
        const forkOwner = forkData.owner.login;
        const branchName = `add-app-${app.id}-${Date.now()}`;
        
        // Crea un branch nel fork
        await this.githubService.createBranchInFork(
          forkOwner, 
          this.storeRepo.repo, 
          branchName
        );
        
        // Aggiungi i file dell'app nel fork
        await this.addAppFilesToFork(forkOwner, branchName, storeData);
        
        // Crea la pull request dal fork al repository originale
        const prData = await this.githubService.createPullRequestFromFork(
          this.storeRepo.owner,
          this.storeRepo.repo,
          forkOwner,
          branchName,
          `Add app: ${app.name}`,
          this.generatePullRequestBody(app, storeData)
        );
        
        DEBUG.success(`✅ Pull request creata: ${prData.html_url}`);
        return prData;

      } catch (error) {
        DEBUG.error('❌ Errore sottomissione app store:', error);
        throw new Error(`Impossibile sottomettere l'app: ${error.message}`);
      }
    }, {
      operationName: `Sottomissione app ${app.name} allo store`,
      retryStrategy: 'NETWORK_ERROR',
      timeout: 120000
    });
  }

  /**
   * Prepara i dati di un'app per lo store
   * @param {Object} app - App da preparare
   * @returns {Promise<Object>} Dati preparati per lo store
   */
  async prepareAppForStore(app) {
    const storeData = {
      manifest: {
        name: app.name,
        description: app.description || '',
        author: app.author || 'Unknown',
        version: app.version || '1.0.0',
        category: app.category || 'altro',
        tags: app.tags || [],
        icon: app.icon || null,
        githubUrl: app.githubUrl || null,
        permissions: app.permissions || [],
        metadata: app.metadata || {}
      },
      files: []
    };

    // Se è un'app ZIP, usa i file esistenti
    if (app.type === 'zip' && app.files) {
      storeData.files = app.files;
    } else {
      // Per altri tipi, crea un file HTML di base
      const htmlContent = app.content || this.generateBasicHtml(app);
      storeData.files.push({
        filename: 'index.html',
        content: htmlContent,
        size: htmlContent.length,
        mimeType: 'text/html'
      });
    }

    // Aggiungi flag per indicare se creare un file ZIP
    storeData.createZip = app.type === 'zip' || app.files?.length > 1;

    return storeData;
  }

  /**
   * Genera HTML di base per app non-ZIP
   * @param {Object} app - App
   * @returns {string} HTML generato
   */
  generateBasicHtml(app) {
    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.name}</title>
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
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${app.name}</h1>
        <p>${app.description || 'App importata in AIdeas'}</p>
        ${app.content || '<p>Contenuto dell\'app non disponibile.</p>'}
    </div>
</body>
</html>`;
  }



  /**
   * Estrae metadati da un'app dello store
   * @param {Array} files - File dell'app
   * @param {Object} manifest - Manifest dell'app
   * @param {string} storeId - ID dell'app nello store
   * @returns {Object} Metadati estratti
   */
  extractStoreMetadata(files, manifest, storeId) {
    return {
      name: manifest?.name || storeId,
      description: manifest?.description || '',
      author: manifest?.author || 'Unknown',
      version: manifest?.version || '1.0.0',
      category: manifest?.category || 'altro',
      tags: manifest?.tags || [],
      icon: manifest?.icon || null,
      githubUrl: manifest?.githubUrl || null,
      permissions: manifest?.permissions || [],
      metadata: manifest?.metadata || {}
    };
  }

  /**
   * Determina il MIME type di un file
   * @param {string} filename - Nome del file
   * @returns {string} MIME type
   */
  getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'txt': 'text/plain',
      'md': 'text/markdown'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * POLLING E AGGIORNAMENTI AUTOMATICI
   */

  /**
   * Avvia il polling intelligente quando lo store è aperto
   */
  startPolling() {
    this.pollingEnabled = true;
    this.isStoreOpen = true;
    
    // Controlla aggiornamenti ogni 10 minuti
    this.pollingInterval = setInterval(async () => {
      if (this.pollingEnabled && this.isStoreOpen) {
        await this.checkForUpdates();
      }
    }, 10 * 60 * 1000); // 10 minuti
    
    DEBUG.log('🔄 Polling store avviato');
  }

  /**
   * Ferma il polling quando lo store è chiuso
   */
  stopPolling() {
    this.pollingEnabled = false;
    this.isStoreOpen = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    DEBUG.log('⏹️ Polling store fermato');
  }

  /**
   * Controlla se ci sono aggiornamenti nello store
   */
  async checkForUpdates() {
    try {
      DEBUG.log('🔍 Controllo aggiornamenti store...');
      
      // Ottieni la data dell'ultimo commit del repository
      const lastCommitDate = await this.getLastCommitDate();
      
      // Se non abbiamo un timestamp precedente, salva quello corrente
      if (!this.lastUpdate) {
        this.lastUpdate = lastCommitDate;
        return;
      }
      
      // Se la data dell'ultimo commit è più recente del nostro ultimo aggiornamento
      if (lastCommitDate > this.lastUpdate) {
        DEBUG.log('🆕 Aggiornamenti rilevati nello store');
        
        // Pulisci la cache per forzare un refresh
        this.cache.clear();
        
        // Aggiorna il timestamp
        this.lastUpdate = lastCommitDate;
        
        // Emetti evento per aggiornare l'interfaccia
        this.notifyStoreUpdated();
      }
      
    } catch (error) {
      DEBUG.error('❌ Errore controllo aggiornamenti store:', error);
    }
  }

  /**
   * Ottiene la data dell'ultimo commit del repository
   */
  async getLastCommitDate() {
    try {
      const response = await this.githubService.makeRequest(
        `/repos/${this.storeRepo.owner}/${this.storeRepo.repo}/commits?per_page=1`
      );
      
      if (response.ok) {
        const commits = await response.json();
        if (commits.length > 0) {
          return new Date(commits[0].commit.author.date);
        }
      }
      
      return new Date();
    } catch (error) {
      DEBUG.error('❌ Errore recupero ultimo commit:', error);
      return new Date();
    }
  }

  /**
   * Notifica che lo store è stato aggiornato
   */
  notifyStoreUpdated() {
    // Emetti un evento custom per notificare l'interfaccia
    const event = new CustomEvent('store-updated', {
      detail: { timestamp: this.lastUpdate }
    });
    window.dispatchEvent(event);
    
    DEBUG.log('📢 Evento store-updated emesso');
  }

  /**
   * Ottiene il timestamp dell'ultimo aggiornamento
   */
  getLastUpdateTime() {
    return this.lastUpdate;
  }

  /**
   * Aggiunge i file dell'app nel fork
   * @param {string} forkOwner - Proprietario del fork
   * @param {string} branchName - Nome del branch
   * @param {Object} storeData - Dati dell'app
   */
  async addAppFilesToFork(forkOwner, branchName, storeData) {
    const appId = storeData.manifest.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Aggiungi il manifest
    await this.githubService.createFileInFork(
      forkOwner,
      this.storeRepo.repo,
      `apps/${appId}/aideas.json`,
      JSON.stringify(storeData.manifest, null, 2),
      branchName,
      `Add manifest for ${storeData.manifest.name}`
    );

    // Se richiesto, crea un file ZIP con tutti i file dell'app
    if (storeData.createZip && storeData.files.length > 0) {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Aggiungi tutti i file al ZIP
      for (const file of storeData.files) {
        zip.file(file.filename, file.content);
      }
      
      // Genera il contenuto del ZIP
      const zipContent = await zip.generateAsync({ type: 'base64' });
      
      // Aggiungi il file ZIP
      await this.githubService.createFileInFork(
        forkOwner,
        this.storeRepo.repo,
        `apps/${appId}/${appId}.zip`,
        zipContent,
        branchName,
        `Add ZIP file for ${storeData.manifest.name}`,
        true // Indica che è contenuto base64
      );
    } else {
      // Aggiungi i file individuali
      for (const file of storeData.files) {
        await this.githubService.createFileInFork(
          forkOwner,
          this.storeRepo.repo,
          `apps/${appId}/${file.filename}`,
          file.content,
          branchName,
          `Add ${file.filename} for ${storeData.manifest.name}`
        );
      }
    }
  }

  /**
   * Genera il corpo della pull request
   * @param {Object} app - App da sottomettere
   * @param {Object} storeData - Dati dell'app
   * @returns {string} Corpo della pull request
   */
  generatePullRequestBody(app, storeData) {
    return `## Nuova app: ${app.name}

**Descrizione:** ${app.description || 'Nessuna descrizione'}

**Categoria:** ${app.category || 'altro'}

**Tag:** ${(app.tags || []).join(', ')}

**Autore:** ${app.author || 'Unknown'}

**Versione:** ${app.version || '1.0.0'}

**File inclusi:** ${storeData.files.map(f => f.filename).join(', ')}

---

Questa app è stata sottoposta tramite AIdeas Store.

### Checklist
- [x] App funzionante
- [x] File HTML/CSS/JS inclusi
- [x] Manifest aideas.json presente
- [x] Nessun contenuto dannoso

### Note
- App ID: ${app.id}
- Tipo: ${app.type}
- Installata il: ${new Date().toISOString()}
- Sottoposta da: ${this.githubService.userInfo?.login || 'Unknown'}`;
  }
}

// Esporta singleton
export const storeService = new StoreService(); 