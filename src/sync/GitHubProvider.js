import SyncProvider from './SyncProvider.js';

export default class GitHubProvider extends SyncProvider {
  constructor() {
    super();
    this.token = null;
    this.gistId = null;
  }

  async authenticate(token) {
    if (!token || !token.startsWith('ghp_')) throw new Error('Token GitHub non valido');
    this.token = token;
    await this.saveCredentials({ token });
    return true;
  }

  async testConnection(credentials = {}) {
    const token = credentials.token || this.token;
    if (!token) return false;
    const res = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${token}` }
    });
    return res.ok;
  }

  async upload(data, credentials = {}) {
    const token = credentials.token || this.token;
    if (!token) throw new Error('Token mancante');
    // Crea o aggiorna un Gist privato con i dati JSON
    const gistData = {
      description: 'AIdeas Sync Data',
      public: false,
      files: {
        'aideas-sync.json': {
          content: JSON.stringify(data, null, 2)
        }
      }
    };
    // ...qui dovresti gestire update/creazione Gist...
    // Placeholder: solo upload
    await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(gistData)
    });
    return true;
  }

  async download(credentials = {}) {
    const token = credentials.token || this.token;
    if (!token) throw new Error('Token mancante');
    // Scarica il Gist più recente con il file 'aideas-sync.json'
    const res = await fetch('https://api.github.com/gists', {
      headers: { 'Authorization': `token ${token}` }
    });
    const gists = await res.json();
    const syncGist = gists.find(g => g.files && g.files['aideas-sync.json']);
    if (!syncGist) throw new Error('Nessun backup trovato');
    const fileUrl = syncGist.files['aideas-sync.json'].raw_url;
    const fileRes = await fetch(fileUrl);
    return await fileRes.json();
  }

  async saveCredentials(credentials) {
    localStorage.setItem('github_sync_token', credentials.token);
  }
  async loadCredentials() {
    this.token = localStorage.getItem('github_sync_token');
    return { token: this.token };
  }
  async clearCredentials() {
    localStorage.removeItem('github_sync_token');
    this.token = null;
  }
} 