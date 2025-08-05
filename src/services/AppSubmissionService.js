import { DEBUG } from '../utils/debug.js';
import ErrorHandler from './ErrorHandler.js';
import GitHubService from './GitHubService.js';
import StorageService from './StorageService.js';
import SecurityService from './SecurityService.js';

/**
 * AIdeas App Submission Service
 * Gestisce la sottomissione delle app allo store tramite GitHub Issues
 * Combina l'approccio issues con il sistema di sicurezza esistente
 */
export default class AppSubmissionService {
  constructor() {
    this.githubService = new GitHubService();
    this.securityService = new SecurityService();
    this.storeRepo = {
      owner: 'mccoy88f',
      repo: 'aideas.store'
    };
    this.submissionCache = new Map();
  }

  /**
   * Prepara e valida un'app per la sottomissione
   * @param {Object} app - App da sottomettere
   * @returns {Promise<Object>} App validata e preparata
   */
  async prepareAppForSubmission(app) {
    return await ErrorHandler.withRetry(async () => {
      DEBUG.log(`🔍 Preparazione app ${app.name} per sottomissione...`);

      // Verifica autenticazione GitHub
      if (!await this.githubService.isAuthenticated()) {
        throw new Error('Autenticazione GitHub richiesta per sottomettere app. Vai nelle impostazioni e configura GitHub.');
      }

      // Validazione base
      if (!app.name || !app.name.trim()) {
        throw new Error('Nome app richiesto');
      }

      if (!app.description || !app.description.trim()) {
        throw new Error('Descrizione app richiesta');
      }

      // Analisi di sicurezza
      const securityReport = await this.securityService.performSecurityScan(app);
      if (securityReport.issues && securityReport.issues.length > 0) {
        DEBUG.warn('⚠️ Problemi di sicurezza rilevati:', securityReport.issues);
        // Non blocchiamo la sottomissione, ma aggiungiamo warning
      }

      // Prepara i file dell'app
      const appFiles = await this.prepareAppFiles(app);
      
      // Crea manifest per lo store
      const manifest = this.createStoreManifest(app, securityReport);

      // Crea ZIP dell'app
      const zipBlob = await this.createAppZip(appFiles, manifest);

      const submissionData = {
        app: app,
        manifest: manifest,
        files: appFiles,
        zipBlob: zipBlob,
        securityReport: securityReport,
        submissionId: this.generateSubmissionId(app),
        timestamp: new Date().toISOString()
      };

      DEBUG.success(`✅ App ${app.name} preparata per sottomissione`);
      return submissionData;

    }, {
      operationName: `Preparazione app ${app.name} per sottomissione`,
      retryStrategy: 'NETWORK_ERROR',
      timeout: 30000
    });
  }

  /**
   * Sottomette un'app tramite GitHub Issues
   * @param {Object} submissionData - Dati della submission preparata
   * @returns {Promise<Object>} Risultato della sottomissione
   */
  async submitAppViaIssues(submissionData) {
    return await ErrorHandler.withRetry(async () => {
      DEBUG.log(`📤 Sottomissione app ${submissionData.app.name} tramite issues...`);

      // Verifica autenticazione GitHub
      if (!await this.githubService.isAuthenticated()) {
        throw new Error('Autenticazione GitHub richiesta per sottomettere app');
      }

      // Upload ZIP come Gist su GitHub
      const zipUrl = await this.uploadZipToFileIO(submissionData.zipBlob);
      
      // Crea issue su GitHub
      const issueData = await this.createSubmissionIssue(submissionData, zipUrl);

      // Salva submission nel cache locale
      this.submissionCache.set(issueData.number, {
        ...submissionData,
        issueNumber: issueData.number,
        issueUrl: issueData.html_url,
        zipUrl: zipUrl,
        status: 'pending'
      });

      DEBUG.success(`✅ App ${submissionData.app.name} sottomessa: Issue #${issueData.number}`);
      
      return {
        success: true,
        issueNumber: issueData.number,
        issueUrl: issueData.html_url,
        zipUrl: zipUrl,
        message: 'App sottomessa con successo. In attesa di approvazione.'
      };

    }, {
      operationName: `Sottomissione app ${submissionData.app.name} via issues`,
      retryStrategy: 'NETWORK_ERROR',
      timeout: 60000
    });
  }

  /**
   * Upload ZIP come Gist su GitHub
   * @param {Blob} zipBlob - File ZIP da uploadare
   * @returns {Promise<string>} URL del Gist creato
   */
  async uploadZipToFileIO(zipBlob) {
    try {
      DEBUG.log('📤 Upload ZIP come Gist su GitHub...');
      const githubService = new GitHubService();
      const isAuthenticated = await githubService.isAuthenticated();

      if (!isAuthenticated) {
        throw new Error('Autenticazione GitHub richiesta per l\'upload del Gist.');
      }

      const fileName = `app-${Date.now()}.zip`;
      const description = `AIdeas App Submission: ${fileName}`;
      const isPublic = false; // Gist privato

      const gistUrl = await githubService.createGistWithFile(fileName, zipBlob, description, isPublic);

      DEBUG.success(`✅ ZIP uploadato come Gist: ${gistUrl}`);
      return gistUrl;

    } catch (error) {
      DEBUG.error('❌ Errore upload ZIP come Gist:', error);
      throw new Error(`Impossibile uploadare il file: ${error.message}`);
    }
  }

  /**
   * Crea issue di sottomissione su GitHub
   * @param {Object} submissionData - Dati della submission
   * @param {string} zipUrl - URL del ZIP uploadato
   * @returns {Promise<Object>} Dati dell'issue creato
   */
  async createSubmissionIssue(submissionData, zipUrl) {
    try {
      const { app, manifest, securityReport } = submissionData;
      
      const issueBody = this.generateIssueBody(app, manifest, zipUrl, securityReport);
      
      const response = await this.githubService.makeRequest(
        `/repos/${this.storeRepo.owner}/${this.storeRepo.repo}/issues`,
        {
          method: 'POST',
          headers: {
            ...await this.githubService.getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: `[SUBMISSION] ${app.name}`,
            body: issueBody,
            labels: ['app-submission', 'pending-review', 'ai-generated']
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Errore creazione issue: ${response.statusText}`);
      }

      const issueData = await response.json();
      DEBUG.success(`✅ Issue creata: #${issueData.number}`);
      return issueData;

    } catch (error) {
      DEBUG.error('❌ Errore creazione issue:', error);
      throw new Error(`Impossibile creare l'issue: ${error.message}`);
    }
  }

  /**
   * Genera il corpo dell'issue di sottomissione
   * @param {Object} app - App da sottomettere
   * @param {Object} manifest - Manifest dell'app
   * @param {string} zipUrl - URL del ZIP
   * @param {Object} securityReport - Report di sicurezza
   * @returns {string} Corpo dell'issue
   */
  generateIssueBody(app, manifest, zipUrl, securityReport) {
    const userInfo = this.githubService.userInfo;
    
    return `## App Submission: ${app.name}

**Descrizione:** ${app.description || 'Nessuna descrizione'}

**Categoria:** ${app.category || 'altro'}

**Tag:** ${(app.tags || []).join(', ')}

**Autore:** ${app.author || 'Unknown'}

**Versione:** ${app.version || '1.0.0'}

**Tipo:** ${app.type || 'html'}

**ZIP Download:** ${zipUrl}

**Sottomesso da:** ${userInfo?.login || 'Unknown'}

**Data sottomissione:** ${new Date().toISOString()}

---

### Manifest
\`\`\`json
${JSON.stringify(manifest, null, 2)}
\`\`\`

### Report Sicurezza
${securityReport.hasIssues ? 
  `⚠️ **Problemi rilevati:**\n${securityReport.issues.map(issue => `- ${issue}`).join('\n')}` : 
  '✅ **Nessun problema di sicurezza rilevato**'
}

### Note
- App ID: ${app.id}
- Unique ID: ${app.uniqueId}
- Source: ${app.source || 'manual'}
- Generata con AI: ${app.source === 'ai-generated' ? 'Sì' : 'No'}

---

**Istruzioni per la review:**
1. Scarica il ZIP dal link sopra
2. Verifica il contenuto dell'app
3. Testa la funzionalità
4. Se approvata, aggiungi label 'approved'
5. Se rifiutata, aggiungi label 'rejected' e commenta il motivo

*Questa è una submission automatizzata tramite AIdeas.*`;
  }

  /**
   * Prepara i file dell'app per la sottomissione
   * @param {Object} app - App da preparare
   * @returns {Promise<Array>} Lista dei file preparati
   */
  async prepareAppFiles(app) {
    const files = [];

    if (app.type === 'zip' && app.files) {
      // App ZIP esistente
      files.push(...app.files);
    } else if (app.content) {
      // App HTML singola
      files.push({
        filename: 'index.html',
        content: app.content,
        size: app.content.length,
        mimeType: 'text/html'
      });
    } else {
      throw new Error('Nessun contenuto trovato per l\'app');
    }

    return files;
  }

  /**
   * Crea manifest per lo store
   * @param {Object} app - App
   * @param {Object} securityReport - Report di sicurezza
   * @returns {Object} Manifest per lo store
   */
  createStoreManifest(app, securityReport) {
    return {
      name: app.name,
      title: app.name,
      description: app.description || '',
      author: app.author || 'Unknown',
      version: app.version || '1.0.0',
      category: app.category || 'altro',
      tags: app.tags || [],
      icon: app.icon || null,
      githubUrl: app.githubUrl || null,
      permissions: app.permissions || [],
      metadata: {
        ...app.metadata,
        source: app.source || 'manual',
        uniqueId: app.uniqueId,
        securityReport: securityReport,
        submittedAt: new Date().toISOString(),
        submittedBy: this.githubService.userInfo?.login || 'Unknown'
      }
    };
  }

  /**
   * Crea ZIP dell'app
   * @param {Array} files - File dell'app
   * @param {Object} manifest - Manifest
   * @returns {Promise<Blob>} ZIP dell'app
   */
  async createAppZip(files, manifest) {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Aggiungi manifest
      zip.file('aideas.json', JSON.stringify(manifest, null, 2));
      
      // Aggiungi file dell'app
      for (const file of files) {
        zip.file(file.filename, file.content);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      DEBUG.success(`✅ ZIP creato: ${zipBlob.size} bytes`);
      return zipBlob;

    } catch (error) {
      DEBUG.error('❌ Errore creazione ZIP:', error);
      throw new Error(`Impossibile creare il ZIP: ${error.message}`);
    }
  }

  /**
   * Genera ID univoco per la submission
   * @param {Object} app - App
   * @returns {string} ID della submission
   */
  generateSubmissionId(app) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `submission-${app.id}-${timestamp}-${random}`;
  }

  /**
   * Controlla lo stato di una submission
   * @param {number} issueNumber - Numero dell'issue
   * @returns {Promise<Object>} Stato della submission
   */
  async checkSubmissionStatus(issueNumber) {
    try {
      const response = await this.githubService.makeRequest(
        `/repos/${this.storeRepo.owner}/${this.storeRepo.repo}/issues/${issueNumber}`,
        {
          headers: await this.githubService.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Errore recupero issue: ${response.statusText}`);
      }

      const issue = await response.json();
      const labels = issue.labels.map(label => label.name);
      
      let status = 'pending';
      if (labels.includes('approved')) {
        status = 'approved';
      } else if (labels.includes('rejected')) {
        status = 'rejected';
      }

      return {
        issueNumber: issue.number,
        status: status,
        labels: labels,
        title: issue.title,
        url: issue.html_url,
        updatedAt: issue.updated_at
      };

    } catch (error) {
      DEBUG.error('❌ Errore controllo stato submission:', error);
      throw error;
    }
  }

  /**
   * Ottiene la cronologia delle submission dell'utente
   * @returns {Promise<Array>} Lista delle submission
   */
  async getUserSubmissions() {
    try {
      const userLogin = this.githubService.userInfo?.login;
      if (!userLogin) {
        throw new Error('Utente non autenticato');
      }

      const response = await this.githubService.makeRequest(
        `/repos/${this.storeRepo.owner}/${this.storeRepo.repo}/issues?creator=${userLogin}&labels=submission`,
        {
          headers: await this.githubService.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Errore recupero submission: ${response.statusText}`);
      }

      const issues = await response.json();
      
      return issues.map(issue => {
        const labels = issue.labels.map(label => label.name);
        let status = 'pending';
        if (labels.includes('approved')) {
          status = 'approved';
        } else if (labels.includes('rejected')) {
          status = 'rejected';
        }

        return {
          issueNumber: issue.number,
          status: status,
          title: issue.title,
          url: issue.html_url,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          labels: labels
        };
      });

    } catch (error) {
      DEBUG.error('❌ Errore recupero submission utente:', error);
      throw error;
    }
  }

  /**
   * Verifica se un'app è già stata submittata dall'utente
   * @param {Object} app - App da verificare
   * @returns {Promise<Object|null>} Submission esistente o null
   */
  async checkAppAlreadySubmitted(app) {
    try {
      const userLogin = this.githubService.userInfo?.login;
      if (!userLogin) {
        throw new Error('Utente non autenticato');
      }

      // Ottieni tutte le issue dell'utente (non solo quelle con label submission)
      const response = await this.githubService.makeRequest(
        `/repos/${this.storeRepo.owner}/${this.storeRepo.repo}/issues?creator=${userLogin}&state=all`,
        {
          headers: await this.githubService.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Errore recupero issues: ${response.statusText}`);
      }

      const issues = await response.json();
      const appName = app.name.toLowerCase().trim();
      
      DEBUG.log(`🔍 Cercando app: "${appName}"`);
      DEBUG.log(`📋 Issues trovate: ${issues.length}`);
      
      // Debug: mostra tutte le issue dell'utente
      issues.forEach(issue => {
        const cleanTitle = issue.title
          .replace(/^\[SUBMISSION\]\s*/i, '')
          .replace(/^\[APP\]\s*/i, '')
          .toLowerCase()
          .trim();
        DEBUG.log(`  - "${issue.title}" -> "${cleanTitle}" (state: ${issue.state})`);
      });
      
      // Cerca issue con lo stesso nome dell'app
      const existingIssue = issues.find(issue => {
        // Rimuovi prefissi comuni dal titolo
        const cleanTitle = issue.title
          .replace(/^\[SUBMISSION\]\s*/i, '')
          .replace(/^\[APP\]\s*/i, '')
          .toLowerCase()
          .trim();
        
        return cleanTitle === appName;
      });
      
      if (existingIssue) {
        DEBUG.log(`✅ Issue esistente trovata: #${existingIssue.number} - "${existingIssue.title}" (state: ${existingIssue.state})`);
      } else {
        DEBUG.log(`❌ Nessuna issue esistente trovata per "${appName}"`);
      }
      
      if (existingIssue) {
        const labels = existingIssue.labels.map(label => label.name);
        let status = 'pending';
        if (labels.includes('approved')) {
          status = 'approved';
        } else if (labels.includes('rejected')) {
          status = 'rejected';
        }

        // Determina il tipo di submission esistente
        let submissionType = 'new';
        if (existingIssue.state === 'open') {
          submissionType = 'pending';
        } else if (existingIssue.state === 'closed') {
          if (labels.includes('approved')) {
            submissionType = 'approved';
          } else if (labels.includes('rejected')) {
            submissionType = 'rejected';
          } else {
            submissionType = 'closed';
          }
        }

        return {
          issueNumber: existingIssue.number,
          status: status,
          title: existingIssue.title,
          url: existingIssue.html_url,
          createdAt: existingIssue.created_at,
          updatedAt: existingIssue.updated_at,
          labels: labels,
          state: existingIssue.state, // 'open' o 'closed'
          submissionType: submissionType // 'pending', 'approved', 'rejected', 'closed'
        };
      }
      
      return null;
    } catch (error) {
      DEBUG.error('❌ Errore verifica submission esistente:', error);
      return null;
    }
  }

  /**
   * Ottiene submission dal cache locale
   * @param {number} issueNumber - Numero dell'issue
   * @returns {Object|null} Submission dal cache
   */
  getSubmissionFromCache(issueNumber) {
    return this.submissionCache.get(issueNumber) || null;
  }

  /**
   * Pulisce il cache delle submission
   */
  clearSubmissionCache() {
    this.submissionCache.clear();
  }
}

// Esporta singleton
export const appSubmissionService = new AppSubmissionService(); 