import Dexie from 'dexie';
import { getEmojiByCategory } from '../utils/constants.js';
import { DEBUG } from '../utils/debug.js';
import ErrorHandler from './ErrorHandler.js';

/**
 * AIdeas Storage Service - Gestione IndexedDB con Dexie.js
 * Classe singleton per gestire tutto lo storage locale dell'applicazione
 */
class StorageService {
  constructor() {
    if (StorageService.instance) {
      return StorageService.instance;
    }

    this.db = new Dexie('AIdeas_DB');
    this.initDatabase();
    StorageService.instance = this;
  }

  /**
   * Inizializza lo schema del database
   */
  initDatabase() {
    this.db.version(1).stores({
      // Apps installate dall'utente
      apps: '++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, source, originalGithubUrl, uniqueId, *tags',
      
      // Files delle app (per ZIP imports) 
      appFiles: '++id, appId, filename, content, size, mimeType',
      
      // Impostazioni utente
      settings: 'key, value, lastModified',
      
      // Eventi per sincronizzazione
      syncEvents: '++id, timestamp, action, data, synced, deviceId',
      
      // Catalogo app store
      catalog: '++id, name, description, author, githubUrl, rating, downloads, featured, *categories'
    });

    // Hook per validazione dati
    this.db.apps.hook('creating', (primKey, obj, trans) => {
      obj.installDate = obj.installDate || new Date();
      obj.lastUsed = obj.lastUsed || new Date();
      obj.favorite = obj.favorite || false;
      obj.tags = obj.tags || [];
      obj.source = obj.source || 'manual'; // 'manual' o 'store'
      obj.originalGithubUrl = obj.originalGithubUrl || null;
      obj.uniqueId = obj.uniqueId || this.generateUniqueId(obj.name, obj.author);
    });

    this.db.syncEvents.hook('creating', (primKey, obj, trans) => {
      obj.timestamp = obj.timestamp || new Date();
      obj.synced = obj.synced || false;
      obj.deviceId = obj.deviceId || this.getDeviceId();
    });
  }

  /**
   * APPS MANAGEMENT
   */

  // Installa una nuova app
  async installApp(appData) {
    return await ErrorHandler.withRetry(async () => {
      // Validazione dati di input
      if (!appData.name || !appData.name.trim()) {
        throw new Error('Nome app richiesto');
      }

      // Controlla se esiste già un'app con lo stesso uniqueId
      const proposedUniqueId = appData.uniqueId || this.generateUniqueId(appData.name, appData.author);
      const existingApp = await this.db.apps.where('uniqueId').equals(proposedUniqueId).first();
      if (existingApp) {
        throw new Error(`App "${appData.name}" di "${appData.author || 'Unknown'}" già installata`);
      }

      // Assegna automaticamente un'emoji se non c'è icona
      let icon = appData.icon;
      if (!icon) {
        icon = getEmojiByCategory(appData.category);
        DEBUG.success(`Assegnata emoji automatica per ${appData.name}: ${icon}`);
      }

      const app = {
        name: appData.name,
        description: appData.description || '',
        category: appData.category || 'uncategorized',
        version: appData.version || '1.0.0',
        url: appData.url || null,
        type: appData.type, // 'zip', 'url', 'github', 'pwa', 'html'
        githubUrl: appData.githubUrl || null,
        icon: icon,
        manifest: appData.manifest || {},
        permissions: appData.permissions || [],
        tags: appData.tags || [],
        metadata: appData.metadata || {},
        content: appData.content || null, // Aggiungi campo per contenuto HTML
        openMode: appData.openMode || (window?.appSettings?.defaultOpenMode || 'modal'), // Nuovo campo
        // Nuovi campi per tracking origine
        source: appData.source || 'manual', // 'manual', 'store'
        originalGithubUrl: appData.originalGithubUrl || null,
        uniqueId: appData.uniqueId || this.generateUniqueId(appData.name, appData.author),
        author: appData.author || 'Unknown'
      };

      const appId = await this.db.apps.add(app);
      
      // Rimuovi l'app dalla lista delle eliminazioni se era stata eliminata prima
      if (app.uniqueId) {
        await this.removeFromDeletedApps(app.uniqueId);
      }
      
      // Salva i file se è un'app ZIP
      if (appData.files && appData.files.length > 0) {
        try {
          await this.saveAppFiles(appId, appData.files);
        } catch (fileError) {
          // Rollback: rimuovi l'app se il salvataggio dei file fallisce
          await this.db.apps.delete(appId);
          throw new Error(`Errore salvataggio file: ${fileError.message}`);
        }
      }

      // Genera automaticamente i file PWA (tranne per app URL importate)
      // La generazione PWA verrà gestita dal componente principale per evitare dipendenze circolari
      if (appData.type !== 'url' || !appData.url) {
        // Emetti un evento per notificare la generazione PWA
        window.dispatchEvent(new CustomEvent('app-installed', { 
          detail: { appId, app } 
        }));
      }

      // Aggiorna timestamp di ultima modifica
      await this.setSetting('lastDataModification', new Date().toISOString());

      // Registra evento sync
      try {
        await this.addSyncEvent('app_installed', { appId, app });
      } catch (syncError) {
        DEBUG.warn('Errore registrazione evento sync:', syncError);
        // Non bloccare l'installazione se il sync fallisce
      }

      DEBUG.success(`✅ App "${appData.name}" installata con successo (ID: ${appId})`);
      return appId;
      
    }, {
      operationName: `Installazione app: ${appData.name}`,
      retryStrategy: 'STORAGE_ERROR',
      timeout: 15000,
      context: { appName: appData.name, appType: appData.type },
      rollbackFn: async (error, context) => {
        DEBUG.warn(`🔄 Rollback installazione app: ${context.appName}`);
        // Il rollback specifico è già gestito nel try-catch dei file
      },
      validateResult: (appId) => {
        return appId && typeof appId === 'number' && appId > 0;
      }
    });
  }

  // Ottieni tutte le app
  async getAllApps(options = {}) {
    try {
      let query = this.db.apps.orderBy('lastUsed').reverse();

      if (options.category) {
        query = query.filter(app => app.category === options.category);
      }

      if (options.search) {
        query = query.filter(app => 
          app.name.toLowerCase().includes(options.search.toLowerCase()) ||
          app.description.toLowerCase().includes(options.search.toLowerCase()) ||
          app.tags.some(tag => tag.toLowerCase().includes(options.search.toLowerCase()))
        );
      }

      if (options.favorite) {
        query = query.filter(app => app.favorite === true);
      }

      return await query.toArray();
    } catch (error) {
      DEBUG.error('Errore recupero app:', error);
      return [];
    }
  }

  // Ottieni app per ID
  async getApp(appId) {
    try {
      return await this.db.apps.get(appId);
    } catch (error) {
      DEBUG.error('Errore recupero app:', error);
      return null;
    }
  }

  // Ottieni dati completi dell'app (app + file)
  async getAppData(appId) {
    try {
      const app = await this.getApp(appId);
      if (!app) {
        return null;
      }

      const files = await this.getAppFiles(appId);
      
      // Converte l'array di file in un oggetto con filename come chiave
      // compatibile con il formato del basecode originale
      const filesObj = {};
      files.forEach(file => {
        filesObj[file.filename] = file.content;
      });

      // Restituisce i dati nel formato compatibile con il basecode
      return {
        ...app,
        files: filesObj
      };
    } catch (error) {
      DEBUG.error('Errore recupero dati app:', error);
      return null;
    }
  }

  // Ottieni app con i suoi file in formato dettagliato
  async getAppWithFiles(appId) {
    try {
      const app = await this.getApp(appId);
      if (!app) {
        return null;
      }

      const files = await this.getAppFiles(appId);
      
      return {
        ...app,
        files: files
      };
    } catch (error) {
      DEBUG.error('Errore recupero app con file:', error);
      return null;
    }
  }

  // Aggiorna app
  async updateApp(appId, updates) {
    try {
      await this.db.apps.update(appId, updates);
      
      // Aggiorna timestamp di ultima modifica
      await this.setSetting('lastDataModification', new Date().toISOString());
      
      await this.addSyncEvent('app_updated', { appId, updates });
      return true;
    } catch (error) {
      DEBUG.error('Errore aggiornamento app:', error);
      return false;
    }
  }

  // Aggiorna metadati specifici di un'app (CSP, domini esterni, ecc.)
  async setAppMetadata(appId, metadata) {
    try {
      const app = await this.getApp(appId);
      if (!app) {
        throw new Error('App non trovata');
      }

      // Unisci i metadati esistenti con quelli nuovi
      const updatedMetadata = {
        ...app.metadata,
        ...metadata
      };

      await this.db.apps.update(appId, { metadata: updatedMetadata });
      DEBUG.success(`Metadati aggiornati per app ${appId}:`, metadata);
      return true;
    } catch (error) {
      DEBUG.error('Errore aggiornamento metadati app:', error);
      return false;
    }
  }

  // Ottieni metadati specifici di un'app
  async getAppMetadata(appId, key = null) {
    try {
      const app = await this.getApp(appId);
      if (!app || !app.metadata) {
        return null;
      }

      if (key) {
        return app.metadata[key] || null;
      }

      return app.metadata;
    } catch (error) {
      DEBUG.error('Errore recupero metadati app:', error);
      return null;
    }
  }

  // Migra app esistenti per aggiungere campo content se mancante
  async migrateAppsForContent() {
    try {
      DEBUG.service('StorageService', 'Inizio migrazione app HTML...');
      const apps = await this.db.apps.toArray();
      DEBUG.info(`Trovate ${apps.length} app totali`);
      
      let migrated = 0;
      
      for (const app of apps) {
        DEBUG.info(`Controllo app: ${app.name} (tipo: ${app.type})`);
        
        if (app.type === 'html' && !app.content) {
          DEBUG.info(`App HTML senza contenuto trovata: ${app.name}`);
          
          // Per le app HTML senza contenuto, prova a recuperarlo dai file
          const files = await this.getAppFiles(app.id);
          DEBUG.info(`Trovati ${files.length} file per app ${app.name}`);
          
          const htmlFile = files.find(f => f.filename.endsWith('.html'));
          
          if (htmlFile) {
            DEBUG.success(`File HTML trovato: ${htmlFile.filename}`);
            await this.db.apps.update(app.id, { content: htmlFile.content });
            migrated++;
            DEBUG.success(`App ${app.name} migrata con successo`);
          } else {
            DEBUG.warn(`Nessun file HTML trovato per app ${app.name}`);
          }
        }
      }
      
      if (migrated > 0) {
        DEBUG.success(`Migrate ${migrated} app HTML per aggiungere campo content`);
      } else {
        DEBUG.info('Nessuna app HTML da migrare');
      }
      
      return migrated;
    } catch (error) {
      DEBUG.error('Errore migrazione app:', error);
      DEBUG.error('Stack trace:', error.stack);
      return 0;
    }
  }

  // Elimina app
  async deleteApp(appId) {
    try {
      const app = await this.getApp(appId);
      if (!app) {
        DEBUG.warn(`App ${appId} non trovata per eliminazione`);
        return false;
      }

      await this.db.transaction('rw', [this.db.apps, this.db.appFiles], async () => {
        await this.db.apps.delete(appId);
        await this.db.appFiles.where('appId').equals(appId).delete();
      });

      // Salva l'eliminazione nella lista delle app eliminate
      await this.addDeletedApp(app.uniqueId || app.name);

      // Aggiorna timestamp di ultima modifica
      await this.setSetting('lastDataModification', new Date().toISOString());

      await this.addSyncEvent('app_deleted', { appId, uniqueId: app.uniqueId, name: app.name });
      return true;
    } catch (error) {
      DEBUG.error('Errore eliminazione app:', error);
      return false;
    }
  }

  // Aggiunge un'app alla lista delle app eliminate
  async addDeletedApp(uniqueId) {
    try {
      const deletedApps = await this.getSetting('deletedApps', []);
      if (!deletedApps.includes(uniqueId)) {
        deletedApps.push(uniqueId);
        await this.setSetting('deletedApps', deletedApps);
        DEBUG.log(`📝 App ${uniqueId} aggiunta alla lista eliminazioni`);
      }
    } catch (error) {
      DEBUG.error('Errore aggiunta app eliminata:', error);
    }
  }

  // Verifica se un'app è stata eliminata localmente
  async isAppDeleted(uniqueId) {
    try {
      const deletedApps = await this.getSetting('deletedApps', []);
      return deletedApps.includes(uniqueId);
    } catch (error) {
      DEBUG.error('Errore verifica app eliminata:', error);
      return false;
    }
  }

  // Pulisce la lista delle app eliminate (per app che vengono reinstallate)
  async removeFromDeletedApps(uniqueId) {
    try {
      const deletedApps = await this.getSetting('deletedApps', []);
      const filtered = deletedApps.filter(id => id !== uniqueId);
      await this.setSetting('deletedApps', filtered);
      DEBUG.log(`🧹 App ${uniqueId} rimossa dalla lista eliminazioni`);
    } catch (error) {
      DEBUG.error('Errore rimozione app eliminata:', error);
    }
  }

  // Cancella tutte le app
  async clearAllApps() {
    try {
      await this.db.transaction('rw', [this.db.apps, this.db.appFiles], async () => {
        await this.db.apps.clear();
        await this.db.appFiles.clear();
      });

      // Pulisci la lista delle app eliminate
      await this.setSetting('deletedApps', []);

      // Aggiorna timestamp di ultima modifica
      await this.setSetting('lastDataModification', new Date().toISOString());

      // Registra evento sync per la cancellazione di tutte le app
      await this.addSyncEvent('all_apps_deleted', { timestamp: new Date().toISOString() });
      
      DEBUG.success('✅ Tutte le app sono state cancellate');
      return true;
    } catch (error) {
      DEBUG.error('Errore cancellazione tutte le app:', error);
      return false;
    }
  }

  // Reset completo del database - cancella tutto
  async clearAllData() {
    try {
      await this.db.transaction('rw', [this.db.apps, this.db.appFiles, this.db.settings, this.db.syncEvents, this.db.catalog], async () => {
        await this.db.apps.clear();
        await this.db.appFiles.clear();
        await this.db.settings.clear();
        await this.db.syncEvents.clear();
        await this.db.catalog.clear();
      });

      // Cancella anche i dati dal localStorage per sicurezza
      const keysToRemove = [
        'aideas_debug',
        'aideas_verbose_logging',
        'githubToken',
        'googleDriveToken',
        'cloudSyncEnabled',
        'selectedProvider',
        'lastDataModification',
        'deletedApps'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          DEBUG.warn(`Errore rimozione localStorage key ${key}:`, e);
        }
      });

      DEBUG.success('✅ Reset completo del database eseguito');
      return true;
    } catch (error) {
      DEBUG.error('Errore reset completo database:', error);
      return false;
    }
  }

  // Aggiorna ultimo utilizzo
  async updateLastUsed(appId) {
    try {
      await this.db.apps.update(appId, { lastUsed: new Date() });
    } catch (error) {
      DEBUG.error('Errore aggiornamento ultimo utilizzo:', error);
    }
  }

  // Toggle preferito
  async toggleFavorite(appId) {
    try {
      const app = await this.db.apps.get(appId);
      if (app) {
        await this.db.apps.update(appId, { favorite: !app.favorite });
        return !app.favorite;
      }
      return false;
    } catch (error) {
      DEBUG.error('Errore toggle preferito:', error);
      return false;
    }
  }

  /**
   * APP FILES MANAGEMENT
   */

  // Salva file di un'app
  async saveAppFiles(appId, files) {
    try {
      const filePromises = files.map(file => 
        this.db.appFiles.add({
          appId,
          filename: file.filename,
          content: file.content,
          size: file.size || file.content.length,
          mimeType: file.mimeType || this.getMimeType(file.filename)
        })
      );

      await Promise.all(filePromises);
      return true;
    } catch (error) {
      DEBUG.error('Errore salvataggio file app:', error);
      return false;
    }
  }

  // Ottieni file di un'app
  async getAppFiles(appId) {
    try {
      return await this.db.appFiles.where('appId').equals(appId).toArray();
    } catch (error) {
      DEBUG.error('Errore recupero file app:', error);
      return [];
    }
  }

  /**
   * SETTINGS MANAGEMENT  
   */

  // Ottieni impostazione
  async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.db.settings.get(key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      DEBUG.error('Errore recupero impostazione:', error);
      return defaultValue;
    }
  }

  // Salva impostazione
  async setSetting(key, value) {
    try {
      await this.db.settings.put({
        key,
        value,
        lastModified: new Date()
      });
      return true;
    } catch (error) {
      DEBUG.error('Errore salvataggio impostazione:', error);
      return false;
    }
  }

  // Ottieni tutte le impostazioni
  async getAllSettings() {
    try {
      const settings = await this.db.settings.toArray();
      const result = {};
      settings.forEach(setting => {
        result[setting.key] = setting.value;
      });
      return result;
    } catch (error) {
      DEBUG.error('Errore recupero impostazioni:', error);
      return {};
    }
  }

  // Salva tutte le impostazioni
  async setAllSettings(settings) {
    try {
      const transactions = [];
      
      for (const [key, value] of Object.entries(settings)) {
        transactions.push(
          this.db.settings.put({
            key,
            value,
            lastModified: new Date()
          })
        );
      }
      
      await Promise.all(transactions);
      return true;
    } catch (error) {
      DEBUG.error('Errore salvataggio impostazioni:', error);
      return false;
    }
  }

  /**
   * SYNC EVENTS MANAGEMENT
   */

  // Aggiungi evento sync
  async addSyncEvent(action, data) {
    try {
      await this.db.syncEvents.add({
        action,
        data,
        timestamp: new Date(),
        synced: false,
        deviceId: await this.getDeviceId()
      });
    } catch (error) {
      DEBUG.error('Errore aggiunta evento sync:', error);
    }
  }

  // Ottieni eventi non sincronizzati
  async getUnsyncedEvents() {
    try {
      return await this.db.syncEvents.where('synced').equals(false).toArray();
    } catch (error) {
      DEBUG.error('Errore recupero eventi non sincronizzati:', error);
      return [];
    }
  }

  // Marca eventi come sincronizzati
  async markEventsSynced(eventIds) {
    try {
      await this.db.syncEvents.where('id').anyOf(eventIds).modify({ synced: true });
    } catch (error) {
      DEBUG.error('Errore aggiornamento eventi sync:', error);
    }
  }

  /**
   * CATALOG MANAGEMENT
   */

  // Aggiorna catalogo
  async updateCatalog(apps) {
    try {
      await this.db.catalog.clear();
      await this.db.catalog.bulkAdd(apps);
      return true;
    } catch (error) {
      DEBUG.error('Errore aggiornamento catalogo:', error);
      return false;
    }
  }

  // Cerca nel catalogo
  async searchCatalog(query, options = {}) {
    try {
      let result = this.db.catalog.orderBy('downloads').reverse();

      if (query) {
        result = result.filter(app =>
          app.name.toLowerCase().includes(query.toLowerCase()) ||
          app.description.toLowerCase().includes(query.toLowerCase()) ||
          app.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
        );
      }

      if (options.category) {
        result = result.filter(app => app.categories.includes(options.category));
      }

      if (options.featured) {
        result = result.filter(app => app.featured === true);
      }

      return await result.limit(options.limit || 50).toArray();
    } catch (error) {
      DEBUG.error('Errore ricerca catalogo:', error);
      return [];
    }
  }

  /**
   * UTILITY METHODS
   */

  // Ottieni ID dispositivo univoco
  async getDeviceId() {
    let deviceId = await this.getSetting('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      await this.setSetting('deviceId', deviceId);
    }
    return deviceId;
  }

  // Genera un ID univoco per l'app nel formato name.author
  generateUniqueId(name, author) {
    const sanitizedName = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'unknown';
    const sanitizedAuthor = author ? author.toLowerCase().replace(/[^a-z0-9]/g, '') : 'unknown';
    return `${sanitizedName}.${sanitizedAuthor}`;
  }

  // Ottieni MIME type da filename
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
      'txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Esporta tutti i dati
  async exportAllData() {
    try {
      const [apps, settings, syncEvents] = await Promise.all([
        this.db.apps.toArray(),
        this.db.settings.toArray(),
        this.db.syncEvents.toArray()
      ]);

      return {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        deviceId: await this.getDeviceId(),
        data: { apps, settings, syncEvents }
      };
    } catch (error) {
      DEBUG.error('Errore export dati:', error);
      throw error;
    }
  }

  // Esporta dati nel formato del backup manuale (compatibile con UI)
  async exportBackupData() {
    try {
      const [apps, settingsArray, allAppFiles] = await Promise.all([
        this.db.apps.toArray(),
        this.db.settings.toArray(),
        this.db.appFiles.toArray() // Aggiungi tutti i file delle app
      ]);

      // Converti array di settings in oggetto
      const settings = {};
      settingsArray.forEach(item => {
        settings[item.key] = item.value;
      });

      // Organizza i file per appId per una migliore struttura
      const appFiles = {};
      allAppFiles.forEach(file => {
        if (!appFiles[file.appId]) {
          appFiles[file.appId] = [];
        }
        appFiles[file.appId].push({
          filename: file.filename,
          content: file.content,
          size: file.size,
          mimeType: file.mimeType
        });
      });

      // Usa timestamp persistente per evitare che i dati locali sembrino sempre più recenti
      let persistentTimestamp = await this.getSetting('lastDataModification');
      if (!persistentTimestamp) {
        // Prima volta: usa timestamp corrente
        persistentTimestamp = new Date().toISOString();
        await this.setSetting('lastDataModification', persistentTimestamp);
      }

      // Ottieni la lista delle app eliminate
      const deletedApps = await this.getSetting('deletedApps', []);

      return {
        settings: settings,
        apps: apps,
        appFiles: appFiles, // Aggiungi i file delle app
        deletedApps: deletedApps, // Aggiungi la lista delle eliminazioni
        timestamp: persistentTimestamp,
        version: '1.0.0'
      };
    } catch (error) {
      DEBUG.error('Errore export backup:', error);
      throw error;
    }
  }

  // Importa dati dal formato del backup manuale
  async importBackupData(backupData) {
    try {
      DEBUG.log('📥 Importazione backup dati:', {
        hasSettings: !!backupData.settings,
        hasApps: !!backupData.apps,
        hasAppFiles: !!backupData.appFiles,
        appsCount: backupData.apps?.length || 0,
        appFilesCount: backupData.appFiles ? Object.keys(backupData.appFiles).length : 0,
        version: backupData.version
      });

      // Validazione formato
      if (!backupData.settings || !backupData.apps) {
        throw new Error('Formato backup non valido - settings o apps mancanti');
      }

      if (!Array.isArray(backupData.apps)) {
        throw new Error('Formato backup non valido - apps deve essere un array');
      }

      // Controlla la dimensione del backup per evitare errori di quota
      const backupSize = JSON.stringify(backupData).length;
      const maxSize = 50 * 1024 * 1024; // 50MB limite
      
      if (backupSize > maxSize) {
        throw new Error(`Backup troppo grande (${Math.round(backupSize / 1024 / 1024)}MB). Dimensione massima: 50MB`);
      }
      
      DEBUG.log(`📦 Backup valido: ${backupData.apps.length} app, ${Math.round(backupSize / 1024)}KB`);

      // Ottieni la lista delle app eliminate localmente e dal backup
      const localDeletedApps = await this.getSetting('deletedApps', []);
      const backupDeletedApps = backupData.deletedApps || [];
      
      // Unisci le liste delle eliminazioni (mantieni entrambe)
      const allDeletedApps = [...new Set([...localDeletedApps, ...backupDeletedApps])];
      await this.setSetting('deletedApps', allDeletedApps);
      
      DEBUG.log('📝 App eliminate localmente:', localDeletedApps);
      DEBUG.log('📝 App eliminate dal backup:', backupDeletedApps);
      DEBUG.log('📝 App eliminate totali:', allDeletedApps);

      await this.db.transaction('rw', [this.db.apps, this.db.settings, this.db.appFiles], async () => {
        // Importa settings
        if (backupData.settings && typeof backupData.settings === 'object') {
          const settingsArray = Object.entries(backupData.settings).map(([key, value]) => ({
            key,
            value,
            lastModified: new Date()
          }));
          
          await this.db.settings.clear();
          await this.db.settings.bulkAdd(settingsArray);
          DEBUG.log('✅ Settings importate:', Object.keys(backupData.settings).length);
        }

        // Importa apps (escludendo quelle eliminate localmente)
        if (backupData.apps && backupData.apps.length > 0) {
          await this.db.apps.clear();
          
          // Mappa gli ID originali con i nuovi ID generati
          const appIdMapping = {};
          let appsImported = 0;
          let appsSkipped = 0;
          
          for (const app of backupData.apps) {
            const originalId = app.id;
            const uniqueId = app.uniqueId || app.name;
            
            // Salta le app che sono state eliminate localmente
            if (allDeletedApps.includes(uniqueId)) {
              DEBUG.log(`⏭️ App ${uniqueId} saltata (eliminata localmente)`);
              appsSkipped++;
              continue;
            }
            
            // Rimuovi l'ID per permettere al database di generarne uno nuovo
            const { id, ...appWithoutId } = app;
            const newId = await this.db.apps.add(appWithoutId);
            appIdMapping[originalId] = newId;
            appsImported++;
          }
          
          DEBUG.log(`✅ Apps importate: ${appsImported}, saltate: ${appsSkipped}`);

          // Importa file delle app se presenti (solo per le app importate)
          if (backupData.appFiles && typeof backupData.appFiles === 'object') {
            await this.db.appFiles.clear();
            
            let totalFilesImported = 0;
            for (const [originalAppId, files] of Object.entries(backupData.appFiles)) {
              const newAppId = appIdMapping[originalAppId];
              if (newAppId && Array.isArray(files)) {
                const filesToAdd = files.map(file => ({
                  appId: newAppId,
                  filename: file.filename,
                  content: file.content,
                  size: file.size || file.content.length,
                  mimeType: file.mimeType || this.getMimeType(file.filename)
                }));
                
                await this.db.appFiles.bulkAdd(filesToAdd);
                totalFilesImported += filesToAdd.length;
              }
            }
            
            DEBUG.log('✅ File delle app importati:', totalFilesImported);
          }
        }
      });

      // Registra evento di sync
      await this.addSyncEvent('backup_imported', {
        appsCount: backupData.apps?.length || 0,
        appFilesCount: backupData.appFiles ? Object.keys(backupData.appFiles).length : 0,
        timestamp: backupData.timestamp,
        version: backupData.version
      });

      DEBUG.log('✅ Backup completo importato con successo');
      return true;
    } catch (error) {
      DEBUG.error('❌ Errore import backup:', error);
      
      // Gestisci errori specifici
      if (error.name === 'QuotaExceededError' || error.message.includes('QuotaExceededError')) {
        throw new Error('Spazio di archiviazione insufficiente. Libera spazio nel browser e riprova.');
      } else if (error.name === 'AbortError') {
        throw new Error('Operazione annullata. Riprova.');
      } else if (error.name === 'ConstraintError') {
        throw new Error('Errore di vincolo del database. Il backup potrebbe contenere dati duplicati.');
      }
      
      throw error;
    }
  }

  // Importa dati (formato legacy per compatibilità)
  async importData(exportData) {
    try {
      if (!exportData.data) {
        throw new Error('Formato dati non valido');
      }

      const { apps, settings, syncEvents } = exportData.data;

      await this.db.transaction('rw', [this.db.apps, this.db.settings, this.db.syncEvents], async () => {
        if (apps) await this.db.apps.bulkPut(apps);
        if (settings) await this.db.settings.bulkPut(settings);
        if (syncEvents) await this.db.syncEvents.bulkPut(syncEvents);
      });

      return true;
    } catch (error) {
      DEBUG.error('Errore import dati:', error);
      throw error;
    }
  }

  // Assicura che il database sia aperto
  async ensureDbOpen() {
    if (!this.db.isOpen()) {
      try {
        await this.db.open();
        DEBUG.log('📂 Database riaperto con successo');
      } catch (err) {
        DEBUG.error('❌ Errore riapertura database:', err);
      }
    }
  }

  // Ottieni statistiche
  async getStats() {
    try {
      await this.ensureDbOpen();
      // Verifica che il database sia inizializzato
      if (!this.db || !this.db.isOpen()) {
        DEBUG.warn('Database non inizializzato');
        return null;
      }
      // Recupera tutte le app per filtrare dati corrotti
      const allApps = await this.db.apps.toArray().catch(() => []);
      // Filtra solo app con campi validi
      const validApps = allApps.filter(app => app && typeof app === 'object');
      const validCategories = validApps.map(app => app.category).filter(cat => typeof cat === 'string' && cat.length > 0);
      const favoriteApps = validApps.filter(app => app.favorite === true).length;
      const totalApps = validApps.length;
      const totalFiles = await this.db.appFiles.count().catch(() => 0);
      const settingsCount = await this.db.settings.count().catch(() => 0);
      const lastInstall = validApps.length > 0 ? validApps.reduce((latest, app) => {
        if (app.installDate && (!latest || new Date(app.installDate) > new Date(latest))) {
          return app.installDate;
        }
        return latest;
      }, null) : null;
      return {
        totalApps,
        totalFiles,
        settingsCount,
        favoriteApps,
        categories: Array.from(new Set(validCategories)).length,
        lastInstall,
        dbSize: await this.estimateDbSize()
      };
    } catch (error) {
      DEBUG.error('Errore recupero statistiche:', error);
      return null;
    }
  }

  // Stima dimensione database
  async estimateDbSize() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Chiudi connessione database
  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Esporta istanza singleton
export default new StorageService();