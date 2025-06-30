export default class SyncProvider {
  async testConnection(credentials) { throw new Error('Not implemented'); }
  async upload(data, credentials) { throw new Error('Not implemented'); }
  async download(credentials) { throw new Error('Not implemented'); }
  async authenticate() { throw new Error('Not implemented'); }
  async saveCredentials(credentials) { throw new Error('Not implemented'); }
  async loadCredentials() { throw new Error('Not implemented'); }
  async clearCredentials() { throw new Error('Not implemented'); }
} 