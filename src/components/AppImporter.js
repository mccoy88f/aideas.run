/**
 * SAKAI - App Importer Component
 * Gestisce l'importazione di applicazioni da varie fonti (ZIP, URL, GitHub)
 */

import StorageService from '../services/StorageService.js';
import ProxyService from '../services/ProxyService.js';
import { showToast, showModal, hideModal, escapeHtml, generateId, isValidUrl, extractDomain, formatFileSize } from '../utils/helpers.js';
import JSZip from 'jszip';

/**
 * Classe per gestire l'importazione delle applicazioni
 */
export default class AppImporter {
  constructor() {
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.supportedFormats = ['zip'];
    this.categories = [
      'productivity', 'entertainment', 'communication', 'development', 
      'design', 'finance', 'health', 'news', 'shopping', 'travel',
      'ai', 'social', 'education', 'business', 'utility', 'pwa'
    ];

    // Inizializza il proxy service
    this.proxyService = new ProxyService();

    // Bind methods - solo se esistono
    if (this.init) this.init = this.init.bind(this);
    if (this.showModal) this.showModal = this.showModal.bind(this);
    if (this.importFromZip) this.importFromZip = this.importFromZip.bind(this);
    if (this.importFromUrl) this.importFromUrl = this.importFromUrl.bind(this);
    if (this.importFromGitHub) this.importFromGitHub = this.importFromGitHub.bind(this);
    if (this.validateAppData) this.validateAppData = this.validateAppData.bind(this);
    if (this.extractAppMetadata) this.extractAppMetadata = this.extractAppMetadata.bind(this);
    if (this.setupDropZone) this.setupDropZone = this.setupDropZone.bind(this);
  }

  /**
   * Inizializza l'importatore
   */
  async init() {
    console.log('🔧 Inizializzazione AppImporter...');
    this.setupDropZone();
    this.setupKeyboardShortcuts();
  }

  /**
   * Mostra il modal di importazione
   */
  showModal() {
    const modalContent = this.createImportModal();
    showModal('app-import-modal', modalContent, {
      size: 'modal-xl',
      disableBackdropClose: false
    });

    // Setup event listeners dopo che il modal è stato creato
    setTimeout(() => {
      this.setupModalEventListeners();
      
      // Imposta il form HTML come attivo di default
      const htmlForm = document.getElementById('form-html');
      if (htmlForm) {
        htmlForm.classList.add('active');
      }
      
      // Imposta il pulsante HTML come attivo di default
      const htmlBtn = document.querySelector('[data-section="html"]');
      if (htmlBtn) {
        htmlBtn.classList.add('active');
      }
    }, 100);
  }

  /**
   * Crea il contenuto del modal di importazione
   */
  createImportModal() {
    return `
      <div class="modal-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="currentColor" class="header-icon">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          Aggiungi Nuova App
        </h2>
        <button class="modal-close">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Import Layout (come settings) -->
        <div class="settings-layout">
          <!-- Import Navigation -->
          <nav class="settings-nav">
            <ul class="settings-nav-list">
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary active" type="button" data-section="html">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  File HTML
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="url">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7C4.24,7 2,9.24 2,12C2,14.76 4.24,17 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17C19.76,17 22,14.76 22,12C22,9.24 19.76,7 17,7Z"/>
                  </svg>
                  Importa da URL
                </button>
              </li>
              <li class="settings-nav-item">
                <button class="settings-nav-btn btn btn-secondary" type="button" data-section="github">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                  Repository GitHub
                </button>
              </li>
            </ul>
          </nav>

          <!-- Import Content -->
          <div class="settings-content">
          
            <!-- HTML Import Section -->
            <div class="settings-section active" id="section-html">
              <h3>Importa da File HTML</h3>
              
              <div class="settings-group">
                <h4>Carica File</h4>
                
                <div class="setting-item">
                  <label for="html-file-input">File HTML</label>
                  <input type="file" id="html-file-input" accept=".html,text/html" class="form-input">
                  <p class="setting-description">Carica un file HTML standalone (senza risorse esterne)</p>
                </div>
              </div>
            </div>

            <!-- URL Import Section -->
            <div class="settings-section" id="section-url">
              <h3>Importa da URL</h3>
              
              <div class="settings-group">
                <h4>URL dell'Applicazione</h4>
              
                <div class="setting-item">
                  <label for="url-input">URL</label>
                  <div class="input-with-button">
                    <input 
                      type="url" 
                      id="url-input" 
                      class="form-input" 
                      placeholder="https://esempio.com/app"
                      required
                    >
                    <button class="btn btn-secondary" id="test-url-btn">Test</button>
                  </div>
                  <p class="setting-description">Inserisci l'URL dell'applicazione web. Il sistema rileverà automaticamente se è una PWA o un sito normale.</p>
                </div>
              
                <div class="setting-item" id="url-preview-container" style="display: none;">
                  <label>Anteprima del sito</label>
                  <div class="url-preview" id="url-preview">
                    <div class="preview-content">
                      <div class="preview-info">
                        <h5>Anteprima del sito:</h5>
                        <div class="preview-details">
                          <div class="preview-favicon">🌐</div>
                          <div class="preview-text">
                            <p class="preview-title">Caricamento...</p>
                            <p class="preview-url"></p>
                          </div>
                        </div>
                      </div>
                      <div class="preview-status">
                        <span class="status-badge">Verificando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- GitHub Import Section -->
            <div class="settings-section" id="section-github">
              <h3>Importa da GitHub</h3>
              
              <div class="settings-group">
                <h4>Repository GitHub</h4>
              
                <div class="setting-item">
                  <label for="github-url-input">URL del Repository</label>
                  <input 
                    type="url" 
                    id="github-url-input" 
                    class="form-input" 
                    placeholder="https://github.com/username/repository"
                    required
                  >
                  <p class="setting-description">Inserisci l'URL di un repository GitHub. Il sistema cercherà automaticamente i file di build o demo.</p>
                </div>
              
                <div class="setting-item" id="github-preview-container" style="display: none;">
                  <label>Anteprima del Repository</label>
                  <div class="github-preview" id="github-preview">
                    <div class="preview-content">
                      <div class="preview-info">
                        <h5>Repository GitHub:</h5>
                        <div class="preview-details">
                          <div class="preview-favicon">📦</div>
                          <div class="preview-text">
                            <p class="preview-title">Caricamento...</p>
                            <p class="preview-description"></p>
                          </div>
                        </div>
                      </div>
                      <div class="preview-status">
                        <span class="status-badge">Verificando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- App Metadata Section (Comune per tutti i tipi) -->
            <div class="settings-section" id="section-metadata" style="display: none;">
              <h3>Informazioni App</h3>
              
              <div class="settings-group">
                <h4>Dettagli Base</h4>
              
                <div class="setting-item">
                  <label for="app-name">Nome App *</label>
                  <input 
                    type="text" 
                    id="app-name" 
                    class="form-input" 
                    placeholder="Il mio Tool Fantastico"
                    required
                    maxlength="50"
                  >
                  <p class="setting-description">Nome dell'applicazione che verrà visualizzato</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-version">Versione</label>
                  <input 
                    type="text" 
                    id="app-version" 
                    class="form-input" 
                    placeholder="1.0.0"
                    value="1.0.0"
                  >
                  <p class="setting-description">Versione dell'applicazione</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-description">Descrizione</label>
                  <textarea 
                    id="app-description" 
                    class="form-input" 
                    rows="3"
                    placeholder="Descrivi cosa fa questa app..."
                    maxlength="200"
                  ></textarea>
                  <div class="char-count">
                    <span id="desc-char-count">0</span>/200
                  </div>
                  <p class="setting-description">Breve descrizione dell'applicazione</p>
                </div>
              </div>
              
              <div class="settings-group">
                <h4>Categorizzazione</h4>
                
                <div class="setting-item">
                  <label for="app-category">Categoria</label>
                  <select id="app-category" class="form-input">
                    <option value="">Seleziona categoria...</option>
                    ${this.categories.map(cat => 
                      `<option value="${cat}">${this.getCategoryLabel(cat)}</option>`
                    ).join('')}
                  </select>
                  <p class="setting-description">Categoria per organizzare le app</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-tags">Tag (separati da virgola)</label>
                  <input 
                    type="text" 
                    id="app-tags" 
                    class="form-input" 
                    placeholder="ai, produttività, strumento"
                  >
                  <p class="setting-description">Tag per facilitare la ricerca</p>
                </div>
              </div>

              <div class="settings-group">
                <h4>Personalizzazione</h4>
                
                <div class="setting-item">
                  <label for="app-icon">Icona App (URL o carica file)</label>
                  <div class="icon-input-group">
                    <input 
                      type="url" 
                      id="app-icon" 
                      class="form-input" 
                      placeholder="https://esempio.com/icon.png"
                    >
                    <button class="btn btn-secondary" id="upload-icon-btn">Carica</button>
                    <input type="file" id="icon-file-input" accept="image/*" style="display: none;">
                  </div>
                  <div class="icon-preview" id="icon-preview" style="display: none;">
                    <img src="" alt="Preview icona" id="icon-preview-img">
                  </div>
                  <p class="setting-description">Icona personalizzata per l'app</p>
                </div>
              
                <div class="setting-item">
                  <label for="app-launch-mode">Modalità di apertura</label>
                  <select id="app-launch-mode" class="form-input">
                    <option value="">Usa impostazione globale</option>
                    <option value="iframe">Sempre in finestra modale</option>
                    <option value="newpage">Sempre in nuova pagina</option>
                  </select>
                  <p class="setting-description">Scegli come questa app dovrebbe aprirsi di default</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <div class="import-progress" id="import-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p class="progress-text" id="progress-text">Importazione in corso...</p>
        </div>
        
        <div class="modal-actions" id="modal-actions">
          <button class="btn btn-secondary" id="cancel-import" type="button">Annulla</button>
          <button class="btn btn-primary" id="start-import" type="button" disabled>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Importa App
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners per il modal
   */
  setupModalEventListeners() {
    const modal = document.getElementById('app-import-modal');
    if (!modal) return;

    // Import section navigation (come settings)
    const navButtons = modal.querySelectorAll('.settings-nav-btn');
    const sections = modal.querySelectorAll('.settings-section');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionName = btn.dataset.section;
        
        // Aggiorna UI buttons
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Mostra sezione corrispondente
        sections.forEach(section => {
          section.style.display = 'none';
          section.classList.remove('active');
          if (section.id === `section-${sectionName}`) {
            section.style.display = 'block';
            section.classList.add('active');
          }
        });
      });
    });

    // Setup form specifici
    this.setupHtmlImport(modal);
    this.setupUrlImport(modal);
    this.setupGitHubImport(modal);
    this.setupMetadataForm(modal);

    // Start import button
    const startImportBtn = modal.querySelector('#start-import');
    startImportBtn?.addEventListener('click', () => {
      this.startImport();
    });

    // Cancel button
    const cancelBtn = modal.querySelector('#cancel-import');
    cancelBtn?.addEventListener('click', () => {
      hideModal('app-import-modal');
    });

    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => {
      hideModal('app-import-modal');
    });

    // Keyboard shortcuts
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideModal('app-import-modal');
      }
    });
  }

  /**
   * Setup ZIP import
   */
  setupZipImport(modal) {
    const dropZone = modal.querySelector('#zip-drop-zone');
    const fileInput = modal.querySelector('#zip-file-input');
    const selectBtn = modal.querySelector('#select-zip-btn');

    // Click su pulsante selezione
    selectBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    // File selection
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleZipFile(file);
      }
    });

    // Drag & Drop
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });

    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.zip')) {
        this.handleZipFile(file);
      } else {
        showToast('Per favore seleziona un file ZIP valido', 'error');
      }
    });
  }

  /**
   * Setup URL import
   */
  setupUrlImport(modal) {
    const urlInput = modal.querySelector('#url-input');
    const testBtn = modal.querySelector('#test-url-btn');
    const previewContainer = modal.querySelector('#url-preview-container');

    // Test URL button
    testBtn?.addEventListener('click', async () => {
      const url = urlInput?.value.trim();
      if (!url) {
        showToast('Inserisci un URL valido', 'error');
        return;
      }

      if (!isValidUrl(url)) {
        showToast('URL non valido', 'error');
        return;
      }

      try {
        testBtn.disabled = true;
        testBtn.textContent = 'Testando...';
        
        await this.testUrl(url, previewContainer);
        
        testBtn.textContent = 'Test';
        testBtn.disabled = false;
      } catch (error) {
        console.error('Errore test URL:', error);
        showToast('Errore durante il test dell\'URL', 'error');
        testBtn.textContent = 'Test';
        testBtn.disabled = false;
      }
    });

    // URL input change
    urlInput?.addEventListener('input', () => {
      const url = urlInput.value.trim();
      if (url && isValidUrl(url)) {
        this.enableImportButton();
      } else {
        this.disableImportButton();
      }
    });
  }

  /**
   * Setup GitHub import
   */
  setupGitHubImport(modal) {
    const githubInput = modal.querySelector('#github-url-input');
    const previewContainer = modal.querySelector('#github-preview-container');

    // GitHub URL input change
    githubInput?.addEventListener('input', async () => {
      const url = githubInput.value.trim();
      if (url && this.isGitHubUrl(url)) {
        try {
          await this.fetchGitHubInfo(url, previewContainer);
          this.enableImportButton();
        } catch (error) {
          console.error('Errore fetch GitHub:', error);
          showToast('Errore durante il recupero delle informazioni GitHub', 'error');
        }
      } else {
        this.disableImportButton();
        if (previewContainer) {
          previewContainer.style.display = 'none';
        }
      }
    });
  }

  /**
   * Setup metadata form
   */
  setupMetadataForm(modal) {
    const descTextarea = modal.querySelector('#app-description');
    const charCount = modal.querySelector('#desc-char-count');
    const iconInput = modal.querySelector('#app-icon');
    const uploadIconBtn = modal.querySelector('#upload-icon-btn');
    const iconFileInput = modal.querySelector('#icon-file-input');
    const iconPreview = modal.querySelector('#icon-preview');

    // Character count for description
    descTextarea?.addEventListener('input', () => {
      const count = descTextarea.value.length;
      if (charCount) {
        charCount.textContent = count;
        charCount.style.color = count > 180 ? 'var(--color-error)' : 'var(--color-gray-500)';
      }
    });

    // Icon upload
    uploadIconBtn?.addEventListener('click', () => {
      iconFileInput?.click();
    });

    iconFileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleIconUpload(file, iconInput, iconPreview);
      }
    });

    // Icon URL preview
    iconInput?.addEventListener('blur', () => {
      const url = iconInput.value.trim();
      if (url) {
        this.showIconPreview(url, iconPreview);
      }
    });
  }

  /**
   * Setup HTML import
   */
  setupHtmlImport(modal) {
    const fileInput = modal.querySelector('#html-file-input');

    // File selection
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleHtmlFile(file);
      }
    });
  }

  /**
   * Gestisce il file ZIP caricato
   */
  async handleZipFile(file) {
    try {
      // Validazione dimensione
      if (file.size > this.maxFileSize) {
        showToast(`File troppo grande. Massimo: ${formatFileSize(this.maxFileSize)}`, 'error');
        return;
      }

      showToast('Analizzando file ZIP...', 'info');

      // Leggi ZIP
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      // Estrai file
      const files = [];
      let manifest = null;

      for (const [filename, fileObj] of Object.entries(contents.files)) {
        if (fileObj.dir) continue;

        const content = await fileObj.async('text');
        const fileData = {
          filename,
          content,
          size: content.length,
          mimeType: this.getMimeType(filename)
        };

        files.push(fileData);

        // Cerca manifest SAKAI
        if (filename === 'sakai.json') {
          try {
            manifest = JSON.parse(content);
          } catch (e) {
            console.warn('Manifest sakai.json non valido:', e);
          }
        }
      }

      // Validazione contenuto
      const hasHTML = files.some(f => f.filename.endsWith('.html'));
      if (!hasHTML) {
        showToast('Il ZIP deve contenere almeno un file HTML', 'error');
        return;
      }

      // Estrai metadati
      const metadata = this.extractZipMetadata(files, manifest);
      
      // Popola form con metadati estratti
      this.populateMetadataForm(metadata);
      
      // Mostra form metadata
      const metadataSection = document.getElementById('section-metadata');
      if (metadataSection) {
        metadataSection.style.display = 'block';
      }

      // Salva dati per l'importazione
      this.currentImportData = {
        type: 'zip',
        files,
        manifest,
        metadata,
        originalFile: file
      };

      // Abilita pulsante importazione
      const importBtn = document.getElementById('start-import');
      if (importBtn) {
        importBtn.disabled = false;
      }

      showToast('ZIP analizzato con successo!', 'success');

    } catch (error) {
      console.error('Errore durante l\'analisi del ZIP:', error);
      showToast('Errore durante l\'analisi del file ZIP', 'error');
    }
  }

  /**
   * Testa un URL e mostra anteprima
   */
  async testUrl(url, previewElement) {
    if (!previewElement) return;

    previewElement.style.display = 'block';
    const statusBadge = previewElement.querySelector('.status-badge');
    const titleEl = previewElement.querySelector('.preview-title');
    const urlEl = previewElement.querySelector('.preview-url');

    // Reset stato
    statusBadge.textContent = 'Verificando...';
    statusBadge.className = 'status-badge';
    titleEl.textContent = 'Caricamento...';
    urlEl.textContent = url;

    try {
      // Estrai metadati avanzati
      const metadata = await this.extractUrlMetadata(url);
      
      // Aggiorna preview
      titleEl.textContent = metadata.title || metadata.name || extractDomain(url);
      statusBadge.textContent = metadata.isPWA ? '✓ PWA Rilevata' : '✓ Sito Web';
      statusBadge.className = metadata.isPWA ? 'status-badge badge-success' : 'status-badge badge-info';

      // Popola form metadata
      this.populateMetadataForm(metadata);
      
      // Mostra form metadata
      const metadataSection = document.getElementById('section-metadata');
      if (metadataSection) {
        metadataSection.style.display = 'block';
      }

      // Salva dati per importazione
      this.currentImportData = {
        type: metadata.isPWA ? 'pwa' : 'url',
        url,
        metadata
      };

      // Abilita importazione
      const importBtn = document.getElementById('start-import');
      if (importBtn) {
        importBtn.disabled = false;
      }

    } catch (error) {
      console.error('Errore test URL:', error);
      statusBadge.textContent = '⚠ Errore';
      statusBadge.className = 'status-badge badge-error';
      titleEl.textContent = 'Impossibile verificare il sito';
    }
  }

  /**
   * Fetch informazioni repository GitHub
   */
  async fetchGitHubInfo(url, previewElement) {
    if (!previewElement) return;

    const repoInfo = this.parseGitHubUrl(url);
    if (!repoInfo) {
      showToast('URL GitHub non valido', 'error');
      return;
    }

    try {
      // Chiamata API GitHub
      const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Repository non trovato o non accessibile');
      }

      const repoData = await response.json();

      // Mostra info repository
      previewElement.style.display = 'block';
      previewElement.querySelector('#repo-avatar').src = repoData.owner.avatar_url;
      previewElement.querySelector('#repo-name').textContent = repoData.full_name;
      previewElement.querySelector('#repo-description').textContent = repoData.description || 'Nessuna descrizione';
      previewElement.querySelector('#repo-stars').textContent = repoData.stargazers_count;
      previewElement.querySelector('#repo-forks').textContent = repoData.forks_count;
      previewElement.querySelector('#repo-updated').textContent = new Date(repoData.updated_at).toLocaleDateString();

      // Popola metadata form
      const metadata = {
        name: repoData.name,
        description: repoData.description,
        category: 'tools',
        version: '1.0.0',
        githubUrl: url
      };

      this.populateMetadataForm(metadata);

      // Mostra form metadata
      const metadataSection = document.getElementById('section-metadata');
      if (metadataSection) {
        metadataSection.style.display = 'block';
      }

      // Salva dati
      this.currentImportData = {
        type: 'github',
        url,
        githubUrl: url,
        repoData,
        metadata
      };

      // Abilita importazione
      const importBtn = document.getElementById('start-import');
      if (importBtn) {
        importBtn.disabled = false;
      }

    } catch (error) {
      console.error('Errore fetch GitHub:', error);
      showToast(`Errore: ${error.message}`, 'error');
    }
  }

  /**
   * Avvia il processo di importazione
   */
  async startImport() {
    if (!this.currentImportData) {
      showToast('Nessun dato da importare', 'error');
      return;
    }

    try {
      // Mostra progress
      this.showImportProgress(true);

      // Raccogli dati dal form
      const formData = this.collectFormData();
      
      // Valida dati
      const validation = this.validateAppData(formData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Combina dati
      const appData = {
        ...this.currentImportData.metadata,
        ...formData,
        type: this.currentImportData.type,
        url: this.currentImportData.url,
        githubUrl: this.currentImportData.githubUrl,
        files: this.currentImportData.files
      };

      // Aggiorna progress
      this.updateImportProgress(50, 'Salvando app...');

      // Salva nel database
      const appId = await StorageService.installApp(appData);

      // Aggiorna progress
      this.updateImportProgress(100, 'Importazione completata!');

      // Successo
      setTimeout(() => {
        hideModal('app-import-modal');
        showToast(`App "${appData.name}" importata con successo!`, 'success');
        
        // Ricarica la lista app (se disponibile)
        if (window.sakaiApp && window.sakaiApp.loadApps) {
          window.sakaiApp.loadApps();
        }
      }, 1000);

    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      showToast(`Errore importazione: ${error.message}`, 'error');
      this.showImportProgress(false);
    }
  }

  /**
   * Utility methods
   */

  // Estrai metadati da ZIP
  extractZipMetadata(files, manifest) {
    const metadata = {
      name: manifest?.name || 'App Importata',
      description: manifest?.description || '',
      version: manifest?.version || '1.0.0',
      category: manifest?.category || 'tools',
      tags: manifest?.tags || [],
      icon: manifest?.icon || null,
      permissions: manifest?.permissions || []
    };

    // Cerca icona nei file se non specificata nel manifest
    if (!metadata.icon) {
      const iconFile = files.find(f => 
        f.filename.match(/^(icon|logo|app-icon)\.(png|jpg|jpeg|svg)$/i)
      );
      if (iconFile) {
        const blob = new Blob([iconFile.content], { type: iconFile.mimeType });
        metadata.icon = URL.createObjectURL(blob);
      }
    }

    return metadata;
  }

  // Estrai metadati da URL
  async extractUrlMetadata(url) {
    const domain = extractDomain(url);
    const baseUrl = new URL(url).origin;
    
    try {
      // Prima prova a ottenere il manifest per verificare se è una PWA
      const manifestData = await this.fetchManifest(url);
      
      if (manifestData) {
        // È una PWA - usa i dati del manifest
        return {
          name: manifestData.name || manifestData.short_name || domain,
          title: manifestData.name || manifestData.short_name || domain,
          description: manifestData.description || `Progressive Web App da ${domain}`,
          category: 'pwa',
          url: url,
          icon: this.getBestIcon(manifestData.icons, baseUrl),
          isPWA: true,
          manifest: manifestData,
          version: manifestData.version || '1.0.0',
          theme_color: manifestData.theme_color,
          background_color: manifestData.background_color
        };
      }
      
      // Non è una PWA - prova a estrarre metadati dalla pagina HTML
      const htmlMetadata = await this.fetchHtmlMetadata(url);
      
      if (htmlMetadata) {
        // Usa apple-touch-icon come fallback se disponibile
        const icon = htmlMetadata.icon || htmlMetadata.appleTouchIcon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        
        return {
          name: htmlMetadata.title || htmlMetadata.ogTitle || domain,
          title: htmlMetadata.title || htmlMetadata.ogTitle || domain,
          description: htmlMetadata.description || htmlMetadata.ogDescription || `App web da ${domain}`,
          category: 'tools',
          url: url,
          icon: icon,
          isPWA: false,
          version: '1.0.0'
        };
      }
      
      // Fallback - usa solo il dominio
      return {
        name: domain,
        title: domain,
        description: `App web da ${domain}`,
        category: 'tools',
        url: url,
        icon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        isPWA: false,
        version: '1.0.0'
      };
      
    } catch (error) {
      console.error('Errore estrazione metadati:', error);
      // Fallback in caso di errore
      return {
        name: domain,
        title: domain,
        description: `App web da ${domain}`,
        category: 'tools',
        url: url,
        icon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        isPWA: false,
        version: '1.0.0'
      };
    }
  }

  /**
   * Prova a ottenere il manifest.json di una PWA
   */
  async fetchManifest(url) {
    try {
      const baseUrl = new URL(url).origin;
      const manifestUrl = `${baseUrl}/manifest.json`;
      
      const response = await fetch(manifestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const manifest = await response.json();
        
        // Valida che sia un manifest valido
        if (manifest.name || manifest.short_name) {
          return manifest;
        }
      }
      
      return null;
    } catch (error) {
      console.log('Manifest non trovato:', error);
      return null;
    }
  }

  /**
   * Estrae metadati da una pagina HTML
   */
  async fetchHtmlMetadata(url) {
    try {
      // Usa il proxy service per estrarre metadati
      const metadata = await this.proxyService.extractMetadata(url);
      
      return {
        title: metadata.title || metadata.ogTitle,
        description: metadata.description || metadata.ogDescription,
        icon: metadata.icon,
        appleTouchIcon: metadata.appleTouchIcon,
        keywords: metadata.keywords,
        author: metadata.author,
        ogImage: metadata.ogImage,
        ogTitle: metadata.ogTitle,
        ogDescription: metadata.ogDescription
      };
      
    } catch (error) {
      console.log('Impossibile estrarre metadati HTML con proxy, provo approccio diretto:', error);
      
      // Fallback: prova approccio diretto
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/html'
          }
        });
        
        if (!response.ok) {
          throw new Error('Pagina non accessibile');
        }
        
        const html = await response.text();
        
        // Estrai metadati usando regex (approccio semplificato)
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
        const appleIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
        
        const baseUrl = new URL(url).origin;
        
        return {
          title: titleMatch ? titleMatch[1].trim() : null,
          description: descriptionMatch ? descriptionMatch[1].trim() : null,
          icon: iconMatch ? new URL(iconMatch[1], baseUrl).href : null,
          appleTouchIcon: appleIconMatch ? new URL(appleIconMatch[1], baseUrl).href : null
        };
        
      } catch (fallbackError) {
        console.log('Anche l\'approccio diretto è fallito:', fallbackError);
        return null;
      }
    }
  }

  /**
   * Seleziona la migliore icona dal manifest
   */
  getBestIcon(icons, baseUrl) {
    if (!icons || !Array.isArray(icons)) {
      return null;
    }
    
    // Cerca un'icona di dimensioni adeguate (preferibilmente 192x192 o 512x512)
    const preferredSizes = ['512x512', '192x192', '144x144', '96x96'];
    
    for (const size of preferredSizes) {
      const icon = icons.find(icon => 
        icon.sizes === size || 
        (icon.sizes && icon.sizes.includes(size))
      );
      
      if (icon) {
        return new URL(icon.src, baseUrl).href;
      }
    }
    
    // Fallback alla prima icona disponibile
    if (icons.length > 0) {
      return new URL(icons[0].src, baseUrl).href;
    }
    
    return null;
  }

  // Parsing URL GitHub
  parseGitHubUrl(url) {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /([^\/]+)\.github\.io\/([^\/]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', '')
        };
      }
    }
    return null;
  }

  // Validazione URL GitHub
  isGitHubUrl(url) {
    return url.includes('github.com') || url.includes('github.io');
  }

  // Get MIME type
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

  // Get category label
  getCategoryLabel(category) {
    const labels = {
      'productivity': 'Produttività',
      'entertainment': 'Intrattenimento',
      'tools': 'Strumenti',
      'games': 'Giochi',
      'ai': 'Intelligenza Artificiale',
      'social': 'Social',
      'education': 'Educazione',
      'business': 'Business',
      'utility': 'Utilità',
      'pwa': 'Progressive Web App'
    };
    return labels[category] || category;
  }

  // Popola form metadata
  populateMetadataForm(metadata) {
    const fields = {
      'app-name': metadata.name || metadata.title,
      'app-description': metadata.description,
      'app-version': metadata.version,
      'app-category': metadata.category,
      'app-tags': Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags,
      'app-icon': metadata.icon
    };

    for (const [fieldId, value] of Object.entries(fields)) {
      const field = document.getElementById(fieldId);
      if (field && value) {
        field.value = value;
        
        // Trigger events
        field.dispatchEvent(new Event('input'));
        field.dispatchEvent(new Event('change'));
      }
    }

    // Gestione speciale per PWA
    if (metadata.isPWA && metadata.manifest) {
      // Aggiungi informazioni PWA specifiche se disponibili
      if (metadata.theme_color) {
        const themeColorField = document.getElementById('app-theme-color');
        if (themeColorField) {
          themeColorField.value = metadata.theme_color;
        }
      }
      
      if (metadata.background_color) {
        const bgColorField = document.getElementById('app-bg-color');
        if (bgColorField) {
          bgColorField.value = metadata.background_color;
        }
      }
    }
  }

  // Raccogli dati dal form
  collectFormData() {
    const nameEl = document.getElementById('app-name');
    const descEl = document.getElementById('app-description');
    const versionEl = document.getElementById('app-version');
    const categoryEl = document.getElementById('app-category');
    const launchModeEl = document.getElementById('app-launch-mode');
    const tagsEl = document.getElementById('app-tags');
    const iconEl = document.getElementById('app-icon');

    const tags = tagsEl?.value ? 
      tagsEl.value.split(',').map(tag => tag.trim()).filter(tag => tag) : 
      [];

    const formData = {
      name: nameEl?.value.trim() || '',
      description: descEl?.value.trim() || '',
      version: versionEl?.value.trim() || '1.0.0',
      category: categoryEl?.value || 'tools',
      tags,
      icon: iconEl?.value.trim() || null
    };

    // Aggiungi modalità di lancio ai metadata se specificata
    if (launchModeEl && launchModeEl.value) {
      formData.metadata = formData.metadata || {};
      formData.metadata.launchMode = launchModeEl.value;
    }

    return formData;
  }

  // Validazione dati app
  validateAppData(data) {
    if (!data.name) {
      return { valid: false, error: 'Nome app richiesto' };
    }

    if (data.name.length > 50) {
      return { valid: false, error: 'Nome app troppo lungo (max 50 caratteri)' };
    }

    if (data.description && data.description.length > 200) {
      return { valid: false, error: 'Descrizione troppo lunga (max 200 caratteri)' };
    }

    return { valid: true };
  }

  // Gestione progress importazione
  showImportProgress(show) {
    const progress = document.getElementById('import-progress');
    const actions = document.getElementById('modal-actions');
    
    if (progress && actions) {
      progress.style.display = show ? 'block' : 'none';
      actions.style.display = show ? 'none' : 'flex';
    }
  }

  updateImportProgress(percent, text) {
    const fill = document.getElementById('progress-fill');
    const textEl = document.getElementById('progress-text');
    
    if (fill) fill.style.width = `${percent}%`;
    if (textEl) textEl.textContent = text;
  }

  // Abilita/disabilita pulsante importazione
  enableImportButton() {
    const importBtn = document.getElementById('start-import');
    if (importBtn) {
      importBtn.disabled = false;
    }
  }

  disableImportButton() {
    const importBtn = document.getElementById('start-import');
    if (importBtn) {
      importBtn.disabled = true;
    }
  }

  // Setup drag & drop globale
  setupDropZone() {
    // Previeni drop su tutta la pagina
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    // Mostra modal su drop globale
    document.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.zip')) {
        this.showModal();
        setTimeout(() => {
          this.handleZipFile(file);
        }, 200);
      }
    });
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + I per importare
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        this.showModal();
      }
    });
  }

  // Handle icon upload
  async handleIconUpload(file, iconInput, iconPreview) {
    if (!file.type.startsWith('image/')) {
      showToast('Per favore seleziona un file immagine', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      showToast('Immagine troppo grande (max 2MB)', 'error');
      return;
    }

    try {
      // Converti in base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        iconInput.value = dataUrl;
        this.showIconPreview(dataUrl, iconPreview);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Errore upload icona:', error);
      showToast('Errore durante l\'upload dell\'icona', 'error');
    }
  }

  // Mostra preview icona
  showIconPreview(url, previewElement) {
    if (!previewElement) return;
    
    const img = previewElement.querySelector('#icon-preview-img');
    if (img) {
      img.src = url;
      img.onload = () => {
        previewElement.style.display = 'block';
      };
      img.onerror = () => {
        previewElement.style.display = 'none';
        showToast('Impossibile caricare l\'icona', 'warning');
      };
    }
  }

  // Handle HTML file
  async handleHtmlFile(file) {
    if (!file.type.startsWith('text/html')) {
      showToast('Per favore seleziona un file HTML', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      showToast('File troppo grande (max 2MB)', 'error');
      return;
    }

    try {
      const content = await file.text();
      const metadata = {
        name: extractDomain(file.name),
        description: 'App web standalone',
        category: 'tools',
        type: 'html',
        content: content
      };

      this.populateMetadataForm(metadata);

      // Mostra sezione metadata
      const metadataSection = document.getElementById('section-metadata');
      if (metadataSection) {
        metadataSection.style.display = 'block';
        metadataSection.classList.add('active');
      }

      // Salva dati
      this.currentImportData = {
        type: 'html',
        content: content,
        metadata: metadata
      };

      // Abilita importazione
      this.enableImportButton();

      showToast('File HTML importato con successo!', 'success');

    } catch (error) {
      console.error('Errore durante l\'importazione del file HTML:', error);
      showToast('Errore durante l\'importazione del file HTML', 'error');
    }
  }
}