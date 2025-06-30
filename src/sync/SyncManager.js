import GitHubProvider from './GitHubProvider.js';
import GoogleDriveProvider from './GoogleDriveProvider.js';
import StorageService from '../services/StorageService.js';

export default class SyncManager {
  constructor() {
    this.providers = {
      github: new GitHubProvider(),
      googledrive: new GoogleDriveProvider()
    };
    this.activeProvider = null;
    this.status = { isEnabled: false, lastSync: null, inProgress: false };
  }

  setProvider(name) {
    if (!this.providers[name]) throw new Error('Provider non supportato');
    this.activeProvider = this.providers[name];
  }

  async enableSync(providerName, credentials) {
    this.setProvider(providerName);
    await this.activeProvider.authenticate(credentials);
    this.status.isEnabled = true;
  }

  async disableSync() {
    if (this.activeProvider) await this.activeProvider.clearCredentials();
    this.status.isEnabled = false;
    this.activeProvider = null;
  }

  async sync(direction = 'bidirectional') {
    if (!this.activeProvider) throw new Error('Provider non selezionato');
    this.status.inProgress = true;
    let result;
    // Ottieni dati reali
    const settings = await StorageService.getAllSettings();
    const apps = await StorageService.getAllApps();
    const syncData = { settings, apps };
    if (direction === 'upload') {
      result = await this.activeProvider.upload(syncData);
    } else if (direction === 'download') {
      result = await this.activeProvider.download();
      // Se download ha successo, importa i dati
      if (result && result.settings && result.apps) {
        await StorageService.importData({ data: { settings: result.settings, apps: result.apps } });
      }
    } else {
      // Bidirezionale: upload e poi download
      await this.activeProvider.upload(syncData);
      result = await this.activeProvider.download();
      if (result && result.settings && result.apps) {
        await StorageService.importData({ data: { settings: result.settings, apps: result.apps } });
      }
    }
    this.status.lastSync = new Date();
    this.status.inProgress = false;
    return result;
  }
} 