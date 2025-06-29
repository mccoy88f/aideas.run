/**
 * AIdeas - Main Entry Point
 * Punto di ingresso principale dell'applicazione
 */

import StorageService from './services/StorageService.js';
import AppLauncher from './components/AppLauncher.js';
import AppImporter from './components/AppImporter.js';
import AppCard from './components/AppCard.js';
import SyncManager from './components/SyncManager.js';
import SettingPanel from './components/SettingPanel.js';
import { 
  showToast, 
  hideToast, 
  showModal,
  hideModal,
  showConfirmPopup,
  showDeleteAppConfirm,
  showImportAppConfirm,
  showResetSettingsConfirm
} from './utils/helpers.js';
import { DEBUG, ErrorTracker, PerformanceMonitor } from './utils/debug.js';

/**
 * Classe principale dell'applicazione AIdeas
 * Gestisce l'inizializzazione e il ciclo di vita dell'app
 */
class AIdeasApp {
  constructor() {
    this.currentView = 'all';
    this.currentSort = 'lastUsed';
    this.currentViewMode = 'grid';
    this.searchQuery = '';
    this.apps = [];
    this.filteredApps = [];
    
    // Componenti
    this.storage = StorageService;
    this.appLauncher = new AppLauncher();
    this.appImporter = new AppImporter();
    this.settingsPanel = new SettingPanel();
    // this.syncManager = new SyncManager(); // DISABILITATO TEMPORANEAMENTE
    
    // Inizializza debug
    ErrorTracker.init(); // Inizializza il tracker di errori
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.loadApps = this.loadApps.bind(this);
    this.renderApps = this.renderApps.bind(this);
    this.filterApps = this.filterApps.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleCategoryChange = this.handleCategoryChange.bind(this);
    this.handleSortChange = this.handleSortChange.bind(this);
    this.handleViewChange = this.handleViewChange.bind(this);
    this.showAppMenu = this.showAppMenu.bind(this);
  }

  /**
   * Inizializza l'applicazione
   */
  async init() {
    try {
      console.log('🚀 Inizializzazione AIdeas...');
      
      // Inizializza storage
      await this.storage.ensureDbOpen();
      
      // Verifica e correggi impostazioni critiche
      await this.verifyCriticalSettings();
      
      // Test impostazioni (solo in debug)
      if (localStorage.getItem('aideas_debug') === 'true') {
        await this.testSettings();
      }
      
      // Inizializza componenti
      await this.appLauncher.init();
      await this.appImporter.init();
      await this.settingsPanel.init();
      // await this.syncManager.init(); // DISABILITATO TEMPORANEAMENTE
      
      // Carica app
      await this.loadApps();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Nascondi loading screen
      this.hideLoadingScreen();
      
      console.log('✅ AIdeas inizializzata con successo');
      
    } catch (error) {
      console.error('❌ Errore inizializzazione AIdeas:', error);
      this.showErrorScreen(error);
    }
  }

  /**
   * Verifica e correggi le impostazioni critiche all'avvio
   */
  async verifyCriticalSettings() {
    console.log('🔍 Verifica impostazioni critiche...');
    
    // Verifica defaultLaunchMode
    const currentLaunchMode = await this.storage.getSetting('defaultLaunchMode');
    if (!currentLaunchMode || !['iframe', 'newpage'].includes(currentLaunchMode)) {
      console.log('⚠️ defaultLaunchMode non valido, correzione a "newpage"');
      await this.storage.setSetting('defaultLaunchMode', 'newpage');
    }
    
    // Verifica altre impostazioni critiche
    const criticalSettings = {
      maxConcurrentApps: { min: 1, max: 10, default: 5 },
      language: { valid: ['it', 'en'], default: 'it' },
      theme: { valid: ['light', 'dark', 'auto'], default: 'auto' }
    };
    
    for (const [key, validation] of Object.entries(criticalSettings)) {
      const value = await this.storage.getSetting(key);
      
      if (validation.min !== undefined && validation.max !== undefined) {
        // Validazione numerica
        if (typeof value !== 'number' || value < validation.min || value > validation.max) {
          console.log(`⚠️ ${key} non valido (${value}), correzione a ${validation.default}`);
          await this.storage.setSetting(key, validation.default);
        }
      } else if (validation.valid) {
        // Validazione enum
        if (!validation.valid.includes(value)) {
          console.log(`⚠️ ${key} non valido (${value}), correzione a ${validation.default}`);
          await this.storage.setSetting(key, validation.default);
        }
      }
    }
    
    console.log('✅ Impostazioni critiche verificate');
  }

  /**
   * Mostra loading screen
   */
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app');
    
    if (loadingScreen && appContainer) {
      loadingScreen.style.display = 'flex';
      appContainer.style.display = 'none';
    }
  }

  /**
   * Nascondi loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app');
    
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }
    
    if (appContainer) {
      appContainer.style.display = 'block';
    }
  }

  /**
   * Mostra schermata di errore
   */
  showErrorScreen(error) {
    console.error('Errore critico:', error);
    
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="error-screen">
          <div class="error-icon">⚠️</div>
          <h1>Errore di Inizializzazione</h1>
          <p>Si è verificato un errore durante l'avvio dell'applicazione.</p>
          <p class="error-details">${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Riprova</button>
        </div>
      `;
    }
  }

  /**
   * Mostra messaggio di benvenuto se abilitato
   */
  async showWelcomeMessage() {
    const showWelcome = await this.storage.getSetting('showWelcomeMessage', true);
    if (showWelcome) {
      // Mostra messaggio di benvenuto
      showToast('Benvenuto in AIdeas! 🎉', 'success', 3000);
    }
  }

  /**
   * Inizializza il database storage
   */
  async initializeStorage() {
    try {
      // Il StorageService è già inizializzato come singleton
      const stats = await StorageService.getStats();
      console.log('📊 Database stats:', stats);
    } catch (error) {
      console.error('Errore inizializzazione storage:', error);
      throw error;
    }
  }

  /**
   * Carica impostazioni utente
   */
  async loadUserSettings() {
    try {
      const settings = await StorageService.getAllSettings();
      
      // Applica impostazioni
      this.currentViewMode = settings.viewMode || 'grid';
      this.currentSort = settings.sortBy || 'lastUsed';
      
      // Applica tema
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      
      // Applica lingua
      if (settings.language) {
        document.documentElement.setAttribute('lang', settings.language);
      }
      
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
      // Forza comunque il tema scuro in caso di errore
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const layout = document.querySelector('.app-layout');
    
    sidebarToggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('sidebar-open');
      // Aggiungi/rimuovi classe al layout per gestire l'espansione del contenuto
      if (sidebar?.classList.contains('sidebar-open')) {
        layout?.classList.remove('sidebar-collapsed');
      } else {
        layout?.classList.add('sidebar-collapsed');
      }
    });

    // Mobile search toggle
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileSearchClose = document.getElementById('mobile-search-close');
    const searchContainer = document.querySelector('.search-container');
    const headerSearch = document.querySelector('.header-search');
    const searchInput = document.getElementById('search-input');
    
    mobileSearchToggle?.addEventListener('click', () => {
      headerSearch?.classList.toggle('search-active');
      if (headerSearch?.classList.contains('search-active')) {
        // Focus sull'input quando si apre
        setTimeout(() => {
          searchInput?.focus();
        }, 100);
      }
    });

    mobileSearchClose?.addEventListener('click', () => {
      headerSearch?.classList.remove('search-active');
      searchInput?.blur();
    });

    // Chiudi ricerca mobile quando si clicca fuori
    document.addEventListener('click', (e) => {
      if (!searchContainer?.contains(e.target) && !mobileSearchToggle?.contains(e.target)) {
        headerSearch?.classList.remove('search-active');
      }
    });

    // Search input
    const searchInputEl = document.getElementById('search-input');
    searchInputEl?.addEventListener('input', this.handleSearch);
    searchInputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Chiudi ricerca mobile su ESC
        headerSearch?.classList.remove('search-active');
        searchInputEl.blur();
      }
    });

    // Category navigation
    const categoryNavs = document.querySelectorAll('[data-category]');
    categoryNavs.forEach(nav => {
      nav.addEventListener('click', this.handleCategoryChange);
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    sortSelect?.addEventListener('change', this.handleSortChange);

    // View toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', this.handleViewChange);
    });

    // Add app buttons
    const addAppBtns = document.querySelectorAll('#add-app-btn, #fab-add, #empty-add-btn');
    addAppBtns.forEach(btn => {
      btn.addEventListener('click', () => this.showAddAppModal());
    });

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn?.addEventListener('click', () => {
      this.showSettingsModal();
    });

    // User menu
    const userBtn = document.getElementById('user-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    userBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown?.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      userDropdown?.classList.remove('show');
    });

    // User menu actions
    document.getElementById('settings-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showSettingsModal();
    });

    document.getElementById('export-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.exportData();
    });

    document.getElementById('import-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.importData();
    });

    document.getElementById('about-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAboutModal();
    });

    // Sync button
    document.getElementById('sync-btn')?.addEventListener('click', () => {
      this.syncManager.showSyncModal();
    });

    // App store button
    document.getElementById('app-store-btn')?.addEventListener('click', () => {
      this.showAppStoreModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

    // Resize handler
    window.addEventListener('resize', this.handleResize.bind(this));

    // Chiudi sidebar su click esterno
    document.addEventListener('click', (e) => {
      if (!sidebar?.contains(e.target) && !sidebarToggle?.contains(e.target)) {
        sidebar?.classList.remove('sidebar-open');
        layout?.classList.add('sidebar-collapsed');
      }
    });
  }

  /**
   * Carica tutte le app dal database
   */
  async loadApps() {
    try {
      this.apps = await StorageService.getAllApps();
      this.filterApps();
      this.updateCategoryCounts();
    } catch (error) {
      console.error('Errore caricamento apps:', error);
      showToast('Errore durante il caricamento delle app', 'error');
    }
  }

  /**
   * Filtra e ordina le app
   */
  filterApps() {
    let filtered = [...this.apps];

    // Filtra per categoria
    if (this.currentView === 'favorites') {
      filtered = filtered.filter(app => app.favorite);
    } else if (this.currentView === 'recent') {
      // Ultimi 30 giorni
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(app => new Date(app.lastUsed) > thirtyDaysAgo);
    } else if (this.currentView !== 'all') {
      filtered = filtered.filter(app => app.category === this.currentView);
    }

    // Filtra per ricerca
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Ordina
    filtered.sort((a, b) => {
      switch (this.currentSort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'installDate':
        return new Date(b.installDate) - new Date(a.installDate);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'lastUsed':
      default:
        return new Date(b.lastUsed) - new Date(a.lastUsed);
      }
    });

    this.filteredApps = filtered;
    this.renderApps();
  }

  /**
   * Renderizza le app nella UI
   */
  renderApps() {
    const appsGrid = document.getElementById('apps-grid');
    const emptyState = document.getElementById('empty-state');

    if (!appsGrid) return;

    // Aggiorna classe per view mode
    appsGrid.className = `apps-${this.currentViewMode}`;

    if (this.filteredApps.length === 0) {
      appsGrid.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    
    // Imposta display corretto per ogni modalità
    if (this.currentViewMode === 'launcher') {
      appsGrid.style.display = 'grid';
      appsGrid.innerHTML = this.filteredApps.map(app => 
        this.renderLauncherItem(app)
      ).join('');
    } else {
      appsGrid.style.display = this.currentViewMode === 'list' ? 'flex' : 'grid';
      appsGrid.innerHTML = this.filteredApps.map(app => 
        AppCard.render(app)
      ).join('');
    }

    // Aggiungi event listeners alle app cards
    this.setupAppCardListeners();
  }

  /**
   * Renderizza un elemento della vista launcher
   */
  renderLauncherItem(app) {
    const iconHtml = app.icon ? 
      `<img src="${app.icon}" alt="${app.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
      '';
    
    const defaultIcon = `
      <svg viewBox="0 0 24 24" fill="currentColor" style="display: ${app.icon ? 'none' : 'flex'};">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
      </svg>
    `;

    const badgeHtml = app.type ? `
      <div class="app-launcher-badge">
        <svg viewBox="0 0 24 24" fill="currentColor">
          ${app.type === 'pwa' ? '<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>' : 
            app.type === 'zip' ? '<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>' :
            '<path d="M3.27,1L2,2.27L5.18,5.44L5.64,6H21L19.73,7L21,8.27L19,10.27V20A1,1 0 0,1 18,21H6A1,1 0 0,1 5,20V10L3.27,8.27L1,6L2.28,4.73L3.27,1M7,18H17V10H7V18Z"/>'}
        </svg>
      </div>
    ` : '';

    return `
      <div class="app-launcher-item" data-app-id="${app.id}" data-app-name="${app.name}">
        <div class="app-launcher-icon">
          ${iconHtml}
          ${defaultIcon}
          ${badgeHtml}
        </div>
        <div class="app-launcher-name">${app.name}</div>
      </div>
    `;
  }

  /**
   * Setup event listeners per le app cards
   */
  setupAppCardListeners() {
    // Launch app
    document.querySelectorAll('.app-card-launch').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const appId = parseInt(btn.dataset.appId);
        await this.launchApp(appId);
      });
    });

    // Toggle favorite
    document.querySelectorAll('.app-card-favorite').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const appId = parseInt(btn.dataset.appId);
        await this.toggleFavorite(appId);
      });
    });

    // App menu
    document.querySelectorAll('.app-card-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const appId = parseInt(btn.dataset.appId);
        this.showAppMenu(appId, e.target);
      });
    });

    // Card click to launch
    document.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', async () => {
        const appId = parseInt(card.dataset.appId);
        await this.launchApp(appId);
      });
    });

    // Launcher view items
    document.querySelectorAll('.app-launcher-item').forEach(item => {
      let pressTimer;
      let isLongPress = false;

      // Click per avviare
      item.addEventListener('click', async (e) => {
        if (!isLongPress) {
          const appId = parseInt(item.dataset.appId);
          await this.launchApp(appId);
        }
        isLongPress = false;
      });

      // Long press per informazioni
      item.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => {
          isLongPress = true;
          const appId = parseInt(item.dataset.appId);
          this.showLauncherAppInfo(appId, item);
        }, 500); // 500ms per long press
      });

      item.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });

      item.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
      });

      // Touch events per mobile
      item.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
          isLongPress = true;
          const appId = parseInt(item.dataset.appId);
          this.showLauncherAppInfo(appId, item);
        }, 500);
      });

      item.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      });

      item.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
      });
    });
  }

  /**
   * Lancia un'app
   */
  async launchApp(appId) {
    try {
      const app = await StorageService.getApp(appId);
      if (!app) {
        showToast('App non trovata', 'error');
        return;
      }

      // Aggiorna ultimo utilizzo
      await StorageService.updateLastUsed(appId);
      
      // Lancia l'app
      await this.appLauncher.launch(app);
      
      // Aggiorna la lista
      await this.loadApps();
      
    } catch (error) {
      console.error('Errore lancio app:', error);
      showToast('Errore durante il lancio dell\'app', 'error');
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(appId) {
    try {
      const newStatus = await StorageService.toggleFavorite(appId);
      showToast(newStatus ? 'Aggiunta ai preferiti' : 'Rimossa dai preferiti', 'success');
      await this.loadApps();
    } catch (error) {
      console.error('Errore toggle favorite:', error);
      showToast('Errore durante l\'operazione', 'error');
    }
  }

  /**
   * Handlers per eventi UI
   */
  handleSearch(e) {
    this.searchQuery = e.target.value.trim();
    this.filterApps();
  }

  handleCategoryChange(e) {
    e.preventDefault();
    const category = e.target.dataset.category || e.target.closest('[data-category]').dataset.category;
    
    // Aggiorna UI navigazione
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    e.target.closest('.nav-link').classList.add('active');
    
    // Aggiorna view
    this.currentView = category;
    this.updateSectionTitle();
    this.filterApps();
  }

  handleSortChange(e) {
    this.currentSort = e.target.value;
    StorageService.setSetting('sortBy', this.currentSort);
    this.filterApps();
  }

  handleViewChange(e) {
    const viewMode = e.target.dataset.view || e.target.closest('[data-view]').dataset.view;
    
    // Aggiorna UI buttons - rimuovi active da tutti i pulsanti di vista
    document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Aggiungi active solo al pulsante cliccato
    const clickedBtn = e.target.closest('.view-btn[data-view]');
    if (clickedBtn) {
      clickedBtn.classList.add('active');
    }
    
    // Aggiorna view
    this.currentViewMode = viewMode;
    StorageService.setSetting('viewMode', this.currentViewMode);
    this.renderApps();
  }

  /**
   * Gestione keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K per focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
    
    // Ctrl/Cmd + N per nuova app
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      this.showAddAppModal();
    }
    
    // Escape per chiudere modals
    if (e.key === 'Escape') {
      this.closeAllModals();
    }
  }

  /**
   * Gestione resize
   */
  handleResize() {
    const sidebar = document.getElementById('sidebar');
    const layout = document.querySelector('.app-layout');
    
    // Chiudi sidebar su resize se mobile e sidebar è aperta
    if (window.innerWidth > 768) {
      // Su desktop, mantieni lo stato della sidebar
      // Non chiudere automaticamente
    } else {
      // Su mobile, chiudi la sidebar se è aperta
      if (sidebar?.classList.contains('sidebar-open')) {
        sidebar.classList.remove('sidebar-open');
        layout?.classList.add('sidebar-collapsed');
      }
    }
  }

  /**
   * Aggiorna titolo sezione
   */
  updateSectionTitle() {
    const sectionTitle = document.getElementById('section-title');
    const sectionSubtitle = document.getElementById('section-subtitle');
    
    const titles = {
      'all': { title: 'Tutte le App', subtitle: 'Gestisci le tue applicazioni web' },
      'favorites': { title: 'App Preferite', subtitle: 'Le tue app più amate' },
      'recent': { title: 'App Recenti', subtitle: 'Utilizzate negli ultimi 30 giorni' }
    };
    
    const titleData = titles[this.currentView] || { 
      title: this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1), 
      subtitle: `App della categoria ${this.currentView}` 
    };
    
    if (sectionTitle) sectionTitle.textContent = titleData.title;
    if (sectionSubtitle) sectionSubtitle.textContent = titleData.subtitle;
  }

  /**
   * Aggiorna contatori categorie
   */
  updateCategoryCounts() {
    // Contatore app totali
    const allCount = document.getElementById('all-count');
    if (allCount) allCount.textContent = this.apps.length;
    
    // Contatore preferiti
    const favoritesCount = document.getElementById('favorites-count');
    const favorites = this.apps.filter(app => app.favorite).length;
    if (favoritesCount) favoritesCount.textContent = favorites;
    
    // Aggiorna categorie dinamiche
    this.updateDynamicCategories();
  }

  /**
   * Aggiorna categorie dinamiche nella sidebar
   */
  updateDynamicCategories() {
    const dynamicCategories = document.getElementById('dynamic-categories');
    if (!dynamicCategories) return;
    
    // Raggruppa per categoria
    const categoryMap = new Map();
    this.apps.forEach(app => {
      const category = app.category || 'uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    // Renderizza categorie
    const categoryItems = Array.from(categoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, count]) => `
        <li class="nav-item">
          <a href="#" class="nav-link" data-category="${category}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/>
            </svg>
            ${category}
            <span class="nav-badge">${count}</span>
          </a>
        </li>
      `).join('');
    
    dynamicCategories.innerHTML = categoryItems;
    
    // Riattacca event listeners
    dynamicCategories.querySelectorAll('[data-category]').forEach(nav => {
      nav.addEventListener('click', this.handleCategoryChange);
    });
  }

  /**
   * Mostra modal aggiungi app
   */
  showAddAppModal() {
    console.log('🔧 Tentativo apertura modal aggiungi app...');
    if (this.appImporter && typeof this.appImporter.showModal === 'function') {
      this.appImporter.showModal();
    } else {
      console.error('❌ AppImporter non disponibile o showModal non è una funzione');
      showToast('Errore: componente importazione non disponibile', 'error');
    }
  }

  /**
   * Mostra modal impostazioni
   */
  showSettingsModal() {
    this.settingsPanel.showModal();
  }

  /**
   * Mostra modal about
   */
  showAboutModal() {
    showModal('about-modal', `
      <div class="modal-header">
        <h2>Su AIdeas</h2>
        <button class="modal-close" onclick="hideModal('about-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="about-content">
          <div class="about-logo">
            <svg viewBox="0 0 100 100" class="about-icon">
              <defs>
                <linearGradient id="aboutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#2563eb"/>
                  <stop offset="100%" style="stop-color:#1d4ed8"/>
                </linearGradient>
              </defs>
              <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#aboutGradient)"/>
              <text x="50" y="65" text-anchor="middle" fill="white" font-size="32" font-weight="bold">S</text>
            </svg>
          </div>
          <h3>AIdeas v1.0.0</h3>
          <p><strong>Swiss Army Knife by AI</strong></p>
          <p>Launcher per applicazioni web generate da AI</p>
          <div class="about-features">
            <h4>Caratteristiche:</h4>
            <ul>
              <li>✅ 100% Client-side</li>
              <li>✅ Funziona offline</li>
              <li>✅ Sincronizzazione cloud opzionale</li>
              <li>✅ Sandbox sicuro per le app</li>
              <li>✅ Import/Export profili</li>
            </ul>
          </div>
          <div class="about-links">
            <a href="https://github.com/aideas-run/aideas-run" target="_blank" rel="noopener">GitHub</a>
            <a href="https://aideas.run/docs" target="_blank" rel="noopener">Documentazione</a>
          </div>
        </div>
      </div>
    `);
  }

  /**
   * Mostra modal app store
   */
  showAppStoreModal() {
    showModal('app-store-modal', `
      <div class="modal-header">
        <h2>AIdeas App Store</h2>
        <button class="modal-close" onclick="hideModal('app-store-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <p>App Store in arrivo nella prossima versione...</p>
        <p>Nel frattempo puoi aggiungere app tramite:</p>
        <ul>
          <li>File ZIP</li>
          <li>URL diretto</li>
          <li>Repository GitHub</li>
        </ul>
      </div>
    `);
  }

  /**
   * Esporta dati
   */
  async exportData() {
    try {
      const data = await StorageService.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `aideas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Dati esportati con successo', 'success');
    } catch (error) {
      console.error('Errore export:', error);
      showToast('Errore durante l\'esportazione', 'error');
    }
  }

  /**
   * Importa dati
   */
  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        
        const text = await file.text();
        const data = JSON.parse(text);
        
        await StorageService.importData(data);
        await this.loadApps();
        
        showToast('Dati importati con successo', 'success');
      } catch (error) {
        console.error('Errore import:', error);
        showToast('Errore durante l\'importazione', 'error');
      }
    };
    
    input.click();
  }

  /**
   * Inizializza componenti
   */
  async initializeComponents() {
    await this.appImporter.init();
    await this.settingsPanel.init();
  }

  /**
   * Inizializza sync
   */
  async initializeSync() {
    // DISABILITATO TEMPORANEAMENTE - SyncManager non disponibile
    /*
    // Inizializza sync solo se configurato
    const syncEnabled = await StorageService.getSetting('syncEnabled', false);
    if (syncEnabled) {
      await this.syncManager.autoSync();
    }
    */
  }

  /**
   * Controlla se è la prima esecuzione
   */
  async checkFirstRun() {
    const isFirstRun = await StorageService.getSetting('firstRun', true);
    if (isFirstRun) {
      await StorageService.setSetting('firstRun', false);
      showToast('Benvenuto in AIdeas! Inizia aggiungendo la tua prima app.', 'info', 5000);
    }
  }

  /**
   * Aggiorna UI generale
   */
  updateUI() {
    this.updateSectionTitle();
    this.updateCategoryCounts();
    
    // Applica view mode - rimuovi active da tutti i pulsanti di vista
    document.querySelectorAll('.view-btn[data-view]').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Aggiungi active solo al pulsante della vista corrente
    const currentViewBtn = document.querySelector(`[data-view="${this.currentViewMode}"]`);
    if (currentViewBtn) {
      currentViewBtn.classList.add('active');
    }
    
    // Applica sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = this.currentSort;
    
    // Inizializza stato sidebar
    const sidebar = document.getElementById('sidebar');
    const layout = document.querySelector('.app-layout');
    if (sidebar && layout) {
      if (!sidebar.classList.contains('sidebar-open')) {
        layout.classList.add('sidebar-collapsed');
      } else {
        layout.classList.remove('sidebar-collapsed');
      }
    }
  }

  /**
   * Chiudi tutti i modals
   */
  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      hideModal(modal.id);
    });
  }

  /**
   * Mostra errore
   */
  showError(message) {
    showToast(message, 'error');
  }

  /**
   * Mostra il menu contestuale per una app (con opzione Modifica)
   */
  async showAppMenu(appId, targetEl) {
    const app = await StorageService.getApp(appId);
    if (!app) return;
    
    // Genera menu contestuale usando le classi CSS
    const menuHtml = `
      <div class="app-context-menu">
        <div class="context-menu-item" data-action="edit">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
          </svg>
          Modifica
        </div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item context-menu-danger" data-action="delete">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
          </svg>
          Elimina
        </div>
      </div>
    `;
    
    // Rimuovi eventuali menu già aperti
    document.querySelectorAll('.app-context-menu').forEach(el => el.remove());
    
    // Inserisci menu nel DOM
    const menuDiv = document.createElement('div');
    menuDiv.innerHTML = menuHtml;
    document.body.appendChild(menuDiv.firstElementChild);
    const menu = document.querySelector('.app-context-menu');
    
    // Posiziona il menu vicino al target
    const rect = targetEl.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    
    // Calcola posizione ottimale
    let top = rect.bottom + window.scrollY + 4;
    let left = rect.left + window.scrollX;
    
    // Evita che il menu esca dallo schermo
    if (top + menuRect.height > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - menuRect.height - 4;
    }
    
    if (left + menuRect.width > window.innerWidth + window.scrollX) {
      left = rect.right + window.scrollX - menuRect.width;
    }
    
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    
    // Listener click fuori dal menu per chiuderlo
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('mousedown', closeMenu);
      }
    };
    
    setTimeout(() => document.addEventListener('mousedown', closeMenu), 10);
    
    // Listener click su Modifica
    menu.querySelector('[data-action="edit"]').addEventListener('click', async () => {
      menu.remove();
      await this.showEditAppModal(app);
    });
    
    // Listener per Elimina
    menu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      menu.remove();
      if (await showDeleteAppConfirm(app.name)) {
        await StorageService.deleteApp(appId);
        showToast('App eliminata', 'success');
        this.loadApps();
      }
    });
  }

  /**
   * Mostra il modale di modifica app (riutilizza la form di AppImporter)
   */
  async showEditAppModal(app) {
    // Crea una copia dei dati per non modificarli direttamente
    const appData = { ...app };
    // Genera la form di metadati (come in AppImporter)
    const modalContent = `
      <div class="modal-header">
        <h2>
          <svg viewBox="0 0 24 24" fill="currentColor" class="header-icon"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
          Modifica App
        </h2>
        <button class="modal-close" id="close-edit-modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="edit-app-form">
          <div class="form-group">
            <label for="edit-app-name">Nome App</label>
            <input type="text" id="edit-app-name" class="form-input" value="${appData.name || ''}" maxlength="50" required>
          </div>
          <div class="form-group">
            <label for="edit-app-description">Descrizione</label>
            <textarea id="edit-app-description" class="form-input" rows="3" maxlength="200">${appData.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="edit-app-version">Versione</label>
            <input type="text" id="edit-app-version" class="form-input" value="${appData.version || '1.0.0'}">
          </div>
          <div class="form-group">
            <label for="edit-app-category">Categoria</label>
            <input type="text" id="edit-app-category" class="form-input" value="${appData.category || ''}">
          </div>
          <div class="form-group">
            <label for="edit-app-tags">Tag (separati da virgola)</label>
            <input type="text" id="edit-app-tags" class="form-input" value="${(appData.tags || []).join(', ')}">
          </div>
          <div class="form-group">
            <label for="edit-app-icon">Icona (URL)</label>
            <input type="url" id="edit-app-icon" class="form-input" value="${appData.icon || ''}">
          </div>
          <div class="form-group">
            <label for="edit-app-launch-mode">Modalità di apertura predefinita</label>
            <select id="edit-app-launch-mode" class="form-input">
              <option value="">Usa impostazione globale</option>
              <option value="iframe" ${appData.metadata?.launchMode === 'iframe' ? 'selected' : ''}>Sempre in finestra modale</option>
              <option value="newpage" ${appData.metadata?.launchMode === 'newpage' ? 'selected' : ''}>Sempre in nuova pagina</option>
            </select>
            <p class="setting-description">Scegli come questa app dovrebbe aprirsi di default</p>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-edit-app">Annulla</button>
        <button class="btn btn-primary" id="save-edit-app">Salva Modifiche</button>
      </div>
    `;
    showModal('edit-app-modal', modalContent, { size: 'modal-md' });
    
    // Listener per chiudere il modal
    setTimeout(() => {
      // Listener per il pulsante Annulla
      document.getElementById('cancel-edit-app')?.addEventListener('click', () => {
        hideModal('edit-app-modal');
      });
      
      // Listener per il pulsante X
      document.getElementById('close-edit-modal')?.addEventListener('click', () => {
        hideModal('edit-app-modal');
      });
      
      // Listener salvataggio
      document.getElementById('save-edit-app').addEventListener('click', async (e) => {
        e.preventDefault();
        // Raccogli dati
        const updates = {
          name: document.getElementById('edit-app-name').value.trim(),
          description: document.getElementById('edit-app-description').value.trim(),
          version: document.getElementById('edit-app-version').value.trim(),
          category: document.getElementById('edit-app-category').value.trim(),
          tags: document.getElementById('edit-app-tags').value.split(',').map(t => t.trim()).filter(Boolean),
          icon: document.getElementById('edit-app-icon').value.trim()
        };
        
        // Gestione modalità di lancio
        const launchModeEl = document.getElementById('edit-app-launch-mode');
        if (launchModeEl && launchModeEl.value) {
          if (!updates.metadata) updates.metadata = {};
          updates.metadata.launchMode = launchModeEl.value;
        } else if (appData.metadata?.launchMode) {
          // Rimuovi la modalità specifica se è vuota
          if (!updates.metadata) updates.metadata = {};
          updates.metadata.launchMode = null;
        }
        
        // Validazione base
        if (!updates.name) {
          showToast('Il nome è obbligatorio', 'error');
          return;
        }
        // Aggiorna nel database
        await StorageService.updateApp(app.id, updates);
        hideModal('edit-app-modal');
        showToast('App modificata con successo', 'success');
        await this.loadApps();
      });
    }, 200);
  }

  /**
   * Mostra informazioni dell'app nella vista launcher
   */
  async showLauncherAppInfo(appId, targetElement) {
    const app = await StorageService.getApp(appId);
    if (!app) return;

    // Crea modal con informazioni dell'app
    const modalContent = `
      <div class="modal-header">
        <div class="app-modal-title">
          <div class="app-modal-icon">
            ${app.icon ? `<img src="${app.icon}" alt="${app.name}">` : '📱'}
          </div>
          <div>
            <h2>${app.name}</h2>
            <p class="app-modal-subtitle">${app.description || ''}</p>
          </div>
        </div>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="app-info-grid">
          <div class="app-info-section">
            <h4>Informazioni</h4>
            <div class="app-info-item">
              <span class="info-label">Versione:</span>
              <span class="info-value">${app.version || 'N/A'}</span>
            </div>
            <div class="app-info-item">
              <span class="info-label">Categoria:</span>
              <span class="info-value">${app.category || 'Non categorizzata'}</span>
            </div>
            <div class="app-info-item">
              <span class="info-label">Tipo:</span>
              <span class="info-value">${app.type || 'URL'}</span>
            </div>
            <div class="app-info-item">
              <span class="info-label">Ultimo utilizzo:</span>
              <span class="info-value">${app.lastUsed ? new Date(app.lastUsed).toLocaleDateString('it-IT') : 'Mai'}</span>
            </div>
          </div>
          
          ${app.tags && app.tags.length > 0 ? `
            <div class="app-info-section">
              <h4>Tag</h4>
              <div class="app-tags">
                ${app.tags.map(tag => `<span class="app-tag">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="app-actions">
          <button class="btn btn-primary" id="launch-app-btn" data-app-id="${app.id}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8,5V19L19,12M19,5V19H21V5M2,5V19H4V5H2Z"/>
            </svg>
            Avvia App
          </button>
          <button class="btn btn-secondary" id="edit-app-btn" data-app-id="${app.id}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
            </svg>
            Modifica
          </button>
        </div>
      </div>
    `;

    const modal = showModal('launcher-app-info', modalContent, {
      size: 'modal-md',
      disableBackdropClose: false,
      disableEscapeClose: false
    });

    // Event listeners per i pulsanti
    modal.querySelector('#launch-app-btn')?.addEventListener('click', async () => {
      hideModal('launcher-app-info');
      await this.launchApp(appId);
    });

    modal.querySelector('#edit-app-btn')?.addEventListener('click', async () => {
      hideModal('launcher-app-info');
      await this.showEditAppModal(app);
    });
  }

  /**
   * Testa il funzionamento delle impostazioni
   */
  async testSettings() {
    console.log('🧪 Test impostazioni...');
    
    try {
      // Test salvataggio e caricamento
      const testKey = 'test_setting';
      const testValue = 'test_value_' + Date.now();
      
      await this.storage.setSetting(testKey, testValue);
      const loadedValue = await this.storage.getSetting(testKey);
      
      if (loadedValue === testValue) {
        console.log('✅ Test salvataggio/caricamento impostazioni: PASS');
      } else {
        console.log('❌ Test salvataggio/caricamento impostazioni: FAIL');
      }
      
      // Pulisci test
      await this.storage.setSetting(testKey, null);
      
      // Mostra impostazioni attuali
      const currentSettings = await this.storage.getAllSettings();
      console.log('📋 Impostazioni attuali:', currentSettings);
      
      // Verifica impostazioni critiche
      const criticalSettings = ['defaultLaunchMode', 'language', 'theme'];
      for (const setting of criticalSettings) {
        const value = await this.storage.getSetting(setting);
        console.log(`🔍 ${setting}: ${value}`);
      }
      
    } catch (error) {
      console.error('❌ Errore test impostazioni:', error);
    }
  }
}

/**
 * Bootstrap dell'applicazione
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Inizializza app
  const app = new AIdeasApp();
  
  // Rendi globale per debugging
  window.aideasApp = app;
  
  // Avvia applicazione
  await app.init();
});

// Gestione errori globali
window.addEventListener('error', (e) => {
  console.error('Errore globale:', e.error);
  showToast('Si è verificato un errore imprevisto', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rejections non gestita:', e.reason);
  showToast('Errore durante un\'operazione asincrona', 'error');
});

// Esporta per debug
export default AIdeasApp;