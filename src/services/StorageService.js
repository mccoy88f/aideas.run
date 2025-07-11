import Dexie from 'dexie';
import { getEmojiByCategory } from '../utils/constants.js';

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
      apps: '++id, name, description, category, version, url, type, githubUrl, installDate, lastUsed, favorite, *tags',
      
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
    try {
      // Assegna automaticamente un'emoji se non c'è icona
      let icon = appData.icon;
      if (!icon) {
        icon = getEmojiByCategory(appData.category);
        console.log(`🎨 Assegnata emoji automatica per ${appData.name}: ${icon}`);
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
        openMode: appData.openMode || (window?.appSettings?.defaultOpenMode || 'modal') // Nuovo campo
      };

      const appId = await this.db.apps.add(app);
      
      // Salva i file se è un'app ZIP
      if (appData.files && appData.files.length > 0) {
        await this.saveAppFiles(appId, appData.files);
      }

      // Genera automaticamente i file PWA (tranne per app URL importate)
      // La generazione PWA verrà gestita dal componente principale per evitare dipendenze circolari
      if (appData.type !== 'url' || !appData.url) {
        // Emetti un evento per notificare la generazione PWA
        window.dispatchEvent(new CustomEvent('app-installed', { 
          detail: { appId, app } 
        }));
      }

      // Registra evento sync
      await this.addSyncEvent('app_installed', { appId, app });

      return appId;
    } catch (error) {
      console.error('Errore installazione app:', error);
      throw new Error(`Impossibile installare l'app: ${error.message}`);
    }
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
      console.error('Errore recupero app:', error);
      return [];
    }
  }

  // Ottieni app per ID
  async getApp(appId) {
    try {
      return await this.db.apps.get(appId);
    } catch (error) {
      console.error('Errore recupero app:', error);
      return null;
    }
  }

  // Aggiorna app
  async updateApp(appId, updates) {
    try {
      await this.db.apps.update(appId, updates);
      await this.addSyncEvent('app_updated', { appId, updates });
      return true;
    } catch (error) {
      console.error('Errore aggiornamento app:', error);
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
      console.log(`✅ Metadati aggiornati per app ${appId}:`, metadata);
      return true;
    } catch (error) {
      console.error('Errore aggiornamento metadati app:', error);
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
      console.error('Errore recupero metadati app:', error);
      return null;
    }
  }

  // Migra app esistenti per aggiungere campo content se mancante
  async migrateAppsForContent() {
    try {
      console.log('🔄 Inizio migrazione app HTML...');
      const apps = await this.db.apps.toArray();
      console.log(`📊 Trovate ${apps.length} app totali`);
      
      let migrated = 0;
      
      for (const app of apps) {
        console.log(`🔍 Controllo app: ${app.name} (tipo: ${app.type})`);
        
        if (app.type === 'html' && !app.content) {
          console.log(`📝 App HTML senza contenuto trovata: ${app.name}`);
          
          // Per le app HTML senza contenuto, prova a recuperarlo dai file
          const files = await this.getAppFiles(app.id);
          console.log(`📁 Trovati ${files.length} file per app ${app.name}`);
          
          const htmlFile = files.find(f => f.filename.endsWith('.html'));
          
          if (htmlFile) {
            console.log(`✅ File HTML trovato: ${htmlFile.filename}`);
            await this.db.apps.update(app.id, { content: htmlFile.content });
            migrated++;
            console.log(`✅ App ${app.name} migrata con successo`);
          } else {
            console.log(`⚠️ Nessun file HTML trovato per app ${app.name}`);
          }
        }
      }
      
      if (migrated > 0) {
        console.log(`✅ Migrate ${migrated} app HTML per aggiungere campo content`);
      } else {
        console.log('ℹ️ Nessuna app HTML da migrare');
      }
      
      return migrated;
    } catch (error) {
      console.error('❌ Errore migrazione app:', error);
      console.error('Stack trace:', error.stack);
      return 0;
    }
  }

  // Elimina app
  async deleteApp(appId) {
    try {
      await this.db.transaction('rw', [this.db.apps, this.db.appFiles], async () => {
        await this.db.apps.delete(appId);
        await this.db.appFiles.where('appId').equals(appId).delete();
      });

      await this.addSyncEvent('app_deleted', { appId });
      return true;
    } catch (error) {
      console.error('Errore eliminazione app:', error);
      return false;
    }
  }

  // Aggiorna ultimo utilizzo
  async updateLastUsed(appId) {
    try {
      await this.db.apps.update(appId, { lastUsed: new Date() });
    } catch (error) {
      console.error('Errore aggiornamento ultimo utilizzo:', error);
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
      console.error('Errore toggle preferito:', error);
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
      console.error('Errore salvataggio file app:', error);
      return false;
    }
  }

  // Ottieni file di un'app
  async getAppFiles(appId) {
    try {
      return await this.db.appFiles.where('appId').equals(appId).toArray();
    } catch (error) {
      console.error('Errore recupero file app:', error);
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
      console.error('Errore recupero impostazione:', error);
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
      console.error('Errore salvataggio impostazione:', error);
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
      console.error('Errore recupero impostazioni:', error);
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
      console.error('Errore salvataggio impostazioni:', error);
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
      console.error('Errore aggiunta evento sync:', error);
    }
  }

  // Ottieni eventi non sincronizzati
  async getUnsyncedEvents() {
    try {
      return await this.db.syncEvents.where('synced').equals(false).toArray();
    } catch (error) {
      console.error('Errore recupero eventi non sincronizzati:', error);
      return [];
    }
  }

  // Marca eventi come sincronizzati
  async markEventsSynced(eventIds) {
    try {
      await this.db.syncEvents.where('id').anyOf(eventIds).modify({ synced: true });
    } catch (error) {
      console.error('Errore aggiornamento eventi sync:', error);
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
      console.error('Errore aggiornamento catalogo:', error);
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
      console.error('Errore ricerca catalogo:', error);
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
      console.error('Errore export dati:', error);
      throw error;
    }
  }

  // Importa dati
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
      console.error('Errore import dati:', error);
      throw error;
    }
  }

  // Assicura che il database sia aperto
  async ensureDbOpen() {
    if (!this.db.isOpen()) {
      try {
        await this.db.open();
        console.log('📂 Database riaperto con successo');
      } catch (err) {
        console.error('❌ Errore riapertura database:', err);
      }
    }
  }

  // Ottieni statistiche
  async getStats() {
    try {
      await this.ensureDbOpen();
      // Verifica che il database sia inizializzato
      if (!this.db || !this.db.isOpen()) {
        console.warn('Database non inizializzato');
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
      console.error('Errore recupero statistiche:', error);
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