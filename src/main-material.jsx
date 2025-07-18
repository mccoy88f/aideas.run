/**
 * AIdeas - Main Entry Point con Material UI
 * Punto di ingresso principale dell'applicazione con Material Design
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, useTheme } from './theme/ThemeProvider.jsx';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  TextField, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Chip,
  Avatar,
  LinearProgress,
  Box,
  useMediaQuery,
  Divider,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Apps as AppsIcon,
  Favorite as FavoriteIcon,
  Launch as LaunchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  List as ListIcon,
    ViewList as ViewListIcon,
  OpenInNew as OpenInNewIcon,
  Store as StoreIcon,
  CheckBox as CheckBoxIcon,
  SelectAll as SelectAllIcon,
  Category as CategoryIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';

import StorageService from './services/StorageService.js';
import { showToast, hideToast, getUserDisplayName } from './utils/helpers.js';
import { DEBUG, ErrorTracker } from './utils/debug.js';
import AppCardMaterial from './components/AppCardMaterial.jsx';
import AppImporterMaterial from './components/AppImporterMaterial.jsx';
import NavigationMaterial from './components/NavigationMaterial.jsx';
import SettingsMaterial from './components/SettingsMaterial.jsx';
import SyncManagerMaterial from './components/SyncManagerMaterial.jsx';
import AppInfoModal from './components/AppInfoModal.jsx';
import StorePage from './components/StorePage.jsx';

import AIGeneratorPage from './components/AIGeneratorPage.jsx';



import EmojiSelector from './components/EmojiSelector.jsx';
import GoogleDriveService from './services/GoogleDriveService.js';
import GitHubService from './services/GitHubService.js';
import AppRouteService from './services/AppRouteService.js';
import { aiServiceManager } from './services/ai/AIServiceManager.js';

/**
 * Componente principale dell'applicazione AIdeas con Material UI
 * Gestisce il layout e la navigazione dell'app
 */
function AIdeasApp() {
  const { theme, mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State per gestione app
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    const isStorePage = path === '/store' || path.endsWith('/store');
    const isAIGeneratorPage = path === '/ai-generator' || path.endsWith('/ai-generator');
    if (isStorePage) return 'store';
    if (isAIGeneratorPage) return 'ai-generator';
    return 'all';
  });
  const [currentSort, setCurrentSort] = useState('lastUsed');
  const [currentViewMode, setCurrentViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addAppDialogOpen, setAddAppDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [importerOpen, setImporterOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [launchingApp, setLaunchingApp] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressApp, setLongPressApp] = useState(null);
  const [syncManagerOpen, setSyncManagerOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emojiSelectorOpen, setEmojiSelectorOpen] = useState(false);
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState('');
  const [appInfoModalOpen, setAppInfoModalOpen] = useState(false);
  const [appInfoData, setAppInfoData] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);

  // State per selezione multipla
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Routing state
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname;
    const isStorePage = path === '/store' || path.endsWith('/store');
    const isAIGeneratorPage = path === '/ai-generator' || path.endsWith('/ai-generator');
    if (isStorePage) return 'store';
    if (isAIGeneratorPage) return 'ai-generator';
    return 'apps';
  });

  // Gestione routing URL
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      console.log('🔄 handlePopState - path:', path);
      
      // Gestisci sia /store che percorsi con base diversa che terminano con /store
      const isStorePage = path === '/store' || path.endsWith('/store');
      const isAIGeneratorPage = path === '/ai-generator' || path.endsWith('/ai-generator');
      
      let newRoute = 'apps';
      if (isStorePage) newRoute = 'store';
      else if (isAIGeneratorPage) newRoute = 'ai-generator';
      
      console.log('🔄 handlePopState - newRoute:', newRoute);
      
      setCurrentRoute(newRoute);
      // Sincronizza currentView con la route per il menu laterale
      if (newRoute === 'store') setCurrentView('store');
      else if (newRoute === 'ai-generator') setCurrentView('ai-generator');
      else setCurrentView('all');
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Inizializzazione
  React.useEffect(() => {
    initializeApp();
  }, []);

  // Filtra apps quando cambia la query di ricerca
  React.useEffect(() => {
    filterApps();
  }, [searchQuery, currentView, apps]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      // Ctrl/Cmd + K per focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Cerca"]');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Ctrl/Cmd + N per nuova app
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setImporterOpen(true);
      }
      
      // Ctrl/Cmd + S per aprire lo store
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        navigateToStore();
      }
      
      // Ctrl/Cmd + G per aprire il generatore AI
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        navigateToAIGenerator();
      }
      
      // Escape per chiudere modals
      if (e.key === 'Escape') {
        setImporterOpen(false);
        setSettingsDialogOpen(false);
        setSelectedApp(null);
        setLaunchModalOpen(false);
        setLaunchingApp(null);
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, []);

  React.useEffect(() => {
    // Gestione posizione toast in base a bottomBar
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      if (settings.bottomBar) {
        toastContainer.classList.remove('material-ui-toast-bottom-left');
        toastContainer.classList.add('material-ui-toast-top-left');
      } else {
        toastContainer.classList.remove('material-ui-toast-top-left');
        toastContainer.classList.add('material-ui-toast-bottom-left');
      }
    }
  }, [settings.bottomBar]);

  // Effect per pulire i blob URLs quando il componente viene smontato
  React.useEffect(() => {
    return () => {
      // Pulisci tutti i blob URLs quando il componente viene smontato
      if (window.aideasBlobUrls) {
        Object.keys(window.aideasBlobUrls).forEach(appId => {
          cleanupBlobUrls(appId);
        });
      }
    };
  }, []);

  // Effect per pulire i blob URLs quando il modale si chiude
  React.useEffect(() => {
    if (!launchModalOpen && launchingApp) {
      // Pulisci i blob URLs dell'app che era in esecuzione
      const appId = launchingApp.id;
      if (appId) {
        cleanupBlobUrls(appId);
      }
    }
  }, [launchModalOpen, launchingApp]);

  React.useEffect(() => {
    // Gestione callback autenticazione Google
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const authState = urlParams.get('state');
    const authError = urlParams.get('error');
    
    if (authCode && authState) {
      // Gestisci callback autenticazione Google
      handleGoogleAuthCallback(authCode, authState);
    } else if (authError) {
      console.error('Errore autenticazione Google:', authError);
      showToast('Errore autenticazione Google', 'error');
    }
    
    // Pulisci URL
    if (authCode || authError) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkGoogleAuthFallback = async () => {
    try {
      // Controlla se c'è un fallback di autenticazione Google nel sessionStorage
      const authResult = sessionStorage.getItem('google_auth_result');
      
      if (authResult) {
        const authData = JSON.parse(authResult);
        
        // Verifica che non sia troppo vecchio (max 5 minuti)
        const age = Date.now() - authData.timestamp;
        if (age > 5 * 60 * 1000) {
          sessionStorage.removeItem('google_auth_result');
          DEBUG.warn('⚠️ Fallback autenticazione Google scaduto');
          return;
        }
        
        DEBUG.log('🔄 Processando fallback autenticazione Google...');
        
        // Processa l'autenticazione
        await handleGoogleAuthCallback(authData.code, authData.state);
        
        // Pulisci sessionStorage
        sessionStorage.removeItem('google_auth_result');
        
        DEBUG.log('✅ Fallback autenticazione Google completato');
      }
      
      // Controlla anche l'URL per il parametro auth=callback
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'callback') {
        // Pulisci URL
        window.history.replaceState({}, document.title, window.location.pathname);
        DEBUG.log('🔄 URL callback pulito');
      }
      
    } catch (error) {
      DEBUG.error('❌ Errore gestione fallback autenticazione Google:', error);
      // Pulisci sessionStorage in caso di errore
      sessionStorage.removeItem('google_auth_result');
    }
  };

  const initializeApp = async () => {
    try {
      console.log('🚀 Inizializzazione AIdeas con Material UI...');
      
      // Inizializza debug
      console.log('🔧 Inizializzazione ErrorTracker...');
      ErrorTracker.init();
      
      // Controlla se c'è un fallback di autenticazione Google
      console.log('🔐 Controllo fallback autenticazione Google...');
      await checkGoogleAuthFallback();
      
      // Inizializza servizio routing app
      console.log('🛣️ Inizializzazione AppRouteService...');
      try {
        // AppRouteService è esportato come singleton, non come classe
        // Inizializza in modo asincrono per evitare errori
        setTimeout(() => {
          AppRouteService.initialize().catch(error => {
            console.error('Errore inizializzazione AppRouteService:', error);
          });
        }, 100);
      } catch (error) {
        console.error('Errore inizializzazione AppRouteService:', error);
      }

      // Removed PWA auto-generation - not needed
      
      // Carica apps
      console.log('📱 Caricamento apps...');
      await loadApps();
      
      // Carica impostazioni
      console.log('⚙️ Caricamento impostazioni...');
      await loadUserSettings();
      await loadUserInfo();
      
      // Inizializza AI Service Manager
      console.log('🤖 Inizializzazione AI Service Manager...');
      try {
        const aiSettings = await StorageService.getSetting('ai', {});
        if (aiSettings.openrouter?.apiKey) {
          await aiServiceManager.initialize({
            openrouter: { apiKey: aiSettings.openrouter.apiKey }
          });
          console.log('✅ AI Service Manager inizializzato con successo');
        } else {
          console.log('ℹ️ AI Service Manager non configurato - nessuna API key trovata');
        }
      } catch (error) {
        console.error('❌ Errore inizializzazione AI Service Manager:', error);
      }
      
      console.log('🎯 Impostazione loading a false...');
      setLoading(false);
      console.log('✅ AIdeas inizializzato con successo');
      
      // Forza un re-render dopo un breve delay
      setTimeout(() => {
        console.log('🔄 Forzatura re-render finale...');
        setLoading(false);
      }, 100);
      
    } catch (error) {
      console.error('❌ Errore inizializzazione AIdeas:', error);
      showToast('Errore durante l\'inizializzazione dell\'applicazione', 'error');
    }
  };

  const loadApps = async () => {
    try {
      console.log('📱 Inizio caricamento apps...');
      const appsData = await StorageService.getAllApps();
      console.log('📱 Apps caricate:', appsData.length, appsData);
      
      // Imposta le app caricate
      setApps(appsData);
      setFilteredApps(appsData);
      
      console.log('📱 State apps aggiornato');
    } catch (error) {
      console.error('Errore caricamento apps:', error);
      showToast('Errore nel caricamento delle applicazioni', 'error');
    }
  };

  const loadUserSettings = async () => {
    try {
      const settingsData = await StorageService.getAllSettings();
      
      // Se non c'è un nome utente, genera un nome casuale e salvalo
      if (!settingsData.username || !settingsData.username.trim()) {
        const randomUsername = getUserDisplayName(settingsData);
        const updatedSettings = { ...settingsData, username: randomUsername };
        await StorageService.setAllSettings(updatedSettings);
        setSettings(updatedSettings);
        console.log('👤 Nome utente generato e salvato:', randomUsername);
      } else {
        setSettings(settingsData);
      }
      
      console.log('⚙️ Impostazioni caricate:', settingsData);
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      // Controlla se la sincronizzazione è abilitata
      const syncEnabled = await StorageService.getSetting('syncEnabled', false);
      let syncProvider = await StorageService.getSetting('syncProvider', 'github');
      
      // Correggi provider obsoleto "gist" -> "googledrive"
      if (syncProvider === 'gist') {
        DEBUG.log('🔧 Correzione provider obsoleto durante caricamento: gist -> googledrive');
        syncProvider = 'googledrive';
        await StorageService.setSetting('syncProvider', 'googledrive');
      }
      
      DEBUG.log('📡 Caricamento info utente:', { syncEnabled, syncProvider });

      if (syncEnabled) {
        if (syncProvider === 'googledrive') {
          try {
            const googleService = GoogleDriveService.createConfiguredInstance();
          
            // Usa checkAuthentication invece di isAuthenticated (obsoleto)
            const authenticated = await googleService.checkAuthentication();
            DEBUG.log('🔐 Google Drive autenticato:', authenticated);
            
            if (authenticated) {
              try {
                const user = await googleService.getUserInfo();
                setUserInfo(user);
                setIsAuthenticated(true);
                DEBUG.success('👤 Utente Google Drive caricato:', user.name);
              } catch (userError) {
                DEBUG.error('❌ Errore caricamento utente Google:', userError);
                // L'autenticazione è valida ma getUserInfo fallisce - problema token
                setIsAuthenticated(false);
              }
            } else {
              DEBUG.warn('⚠️ Google Drive non autenticato - richiesta nuova autenticazione');
              setIsAuthenticated(false);
            }
          } catch (configError) {
            DEBUG.warn('⚠️ Google Drive non configurato:', configError.message);
            setIsAuthenticated(false);
          }
        } else if (syncProvider === 'github') {
          const githubService = new GitHubService();
          const authenticated = await githubService.isAuthenticated();
          DEBUG.log('🔐 GitHub autenticato:', authenticated);
          
          if (authenticated) {
            try {
              const user = await githubService.getUserInfo();
              setUserInfo(user);
              setIsAuthenticated(true);
              DEBUG.success('👤 Utente GitHub caricato:', user.login);
            } catch (userError) {
              DEBUG.error('❌ Errore caricamento utente GitHub:', userError);
              setIsAuthenticated(false);
            }
          } else {
            DEBUG.warn('⚠️ GitHub non autenticato');
            setIsAuthenticated(false);
          }
        }
      } else {
        DEBUG.log('📡 Sincronizzazione disabilitata');
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } catch (error) {
      DEBUG.error('❌ Errore caricamento info utente:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  const filterApps = () => {
    let filtered = [...apps];

    // Filtra per vista speciale
    switch (currentView) {
      case 'all':
        // Mostra tutte le app (nessun filtro)
        break;
      
      case 'favorites':
        // Mostra solo app preferite
        filtered = filtered.filter(app => app.favorite);
        break;
      
      case 'recent':
        // Mostra app usate di recente (ultime 2 settimane)
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        filtered = filtered.filter(app => 
          app.lastUsed && new Date(app.lastUsed) > twoWeeksAgo
        );
        break;
      
      case 'categories':
        // Per ora mostra tutte le app - vista categorie sarà implementata in futuro
        break;
      
      case 'store':
        // Vista store gestita separatamente
        break;
      
      default:
        // Per categorie specifiche (produttività, giochi, etc.)
        filtered = filtered.filter(app => app.category === currentView);
        break;
    }

    // Filtra per ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query) ||
        app.category?.toLowerCase().includes(query)
      );
    }

    // Ordina in base al tipo di vista
    filtered.sort((a, b) => {
      // Per la vista "recent", ordina sempre per lastUsed
      if (currentView === 'recent') {
        return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0);
      }
      
      // Per la vista "favorites", ordina per favorite prima, poi per nome
      if (currentView === 'favorites') {
        if (a.favorite !== b.favorite) {
          return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        }
        return a.name.localeCompare(b.name);
      }
      
      // Ordinamento normale per le altre viste
      switch (currentSort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'lastUsed':
          return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0);
        case 'favorite':
          return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        default:
          return 0;
      }
    });

    setFilteredApps(filtered);
  };

  const handleLaunchApp = async (appId) => {
    try {
      const app = apps.find(a => a.id === appId);
      if (app) {
        // Aggiorna lastUsed
        await StorageService.updateApp(appId, { lastUsed: new Date().toISOString() });
        
        // Determina modalità di apertura
        const openMode = app.openMode || settings.defaultOpenMode || 'modal';
        console.log(`🚀 Avvio app: ${app.name}, modalità: ${openMode}`);
        console.log(`🔧 [DEBUG] Tipo app: "${app.type}", ha files: ${app.files?.length || 0}`);
        
        // Lancia l'app
        if (app.type === 'url' && app.url) {
          if (openMode === 'modal') {
            // Apri in modale (per app URL, crea un iframe)
            setLaunchingApp({
              ...app,
              content: `<iframe src="${app.url}" style="width:100%;height:100%;border:none;" title="${app.name}"></iframe>`
            });
            setLaunchModalOpen(true);
          } else {
            // Apri in nuova finestra
            window.open(app.url, '_blank');
          }
          showToast(`Avviata: ${app.name}`, 'success');
        } else if (app.type === 'html' && app.content) {
          // Se è un'app ZIP con file locali, configura il servizio file
          if (app.files && app.files.length > 0) {
            await setupLocalFileService(appId);
          }
          
          if (openMode === 'modal') {
            // Avvia app HTML in modale
            setLaunchingApp(app);
            setLaunchModalOpen(true);
          } else {
            // Apri HTML in nuova finestra
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(app.content);
              newWindow.document.close();
            } else {
              showToast('Popup bloccato. Abilita i popup per questo sito.', 'error');
            }
          }
        } else if (app.type === 'zip') {
          // Gestisci app ZIP
          if (openMode === 'modal') {
            console.log(`🔧 [DEBUG] Avvio app ZIP in modale: ${app.name}`);
            
            // Carica i file e aggiorna l'app in memoria
            const files = await StorageService.getAppFiles(appId);
            console.log(`🔧 [DEBUG] File caricati per app ${appId}:`, files?.length || 0);
            
            const appWithFiles = { ...app, files };
            
            // Aggiorna l'app in memoria con i file caricati
            const appIndex = apps.findIndex(a => a.id === appId);
            if (appIndex !== -1) {
              apps[appIndex] = appWithFiles;
            }
            
            // Configura il servizio file e ottieni l'HTML modificato
            const modifiedHtml = await setupLocalFileService(appId);
            
            if (modifiedHtml) {
              setLaunchingApp({
                ...appWithFiles,
                content: modifiedHtml
              });
              setLaunchModalOpen(true);
            } else {
              showToast('Errore nel caricamento dell\'app o file index.html non trovato', 'error');
            }
          } else {
            // Per nuova finestra, usa AppRouteService (già importato come singleton)
            try {
              await AppRouteService.openAppInNewTab(appId);
              showToast(`Avviata: ${app.name}`, 'success');
            } catch (error) {
              console.error('Errore apertura app in nuova finestra:', error);
              showToast('Errore nell\'apertura dell\'app', 'error');
            }
          }
        } else {
          console.log(`🔧 [DEBUG] Tipo app non supportato: "${app.type}"`);
          showToast('Tipo di app non supportato', 'error');
        }
      }
    } catch (error) {
      console.error('Errore avvio app:', error);
      showToast('Errore nell\'avvio dell\'applicazione', 'error');
    }
  };

  // Funzione per configurare il servizio file locali per le app ZIP
  const setupLocalFileService = async (appId) => {
    try {
      console.log(`🔧 [DEBUG] Inizio setupLocalFileService per app ${appId}`);
      
      let app = apps.find(a => a.id === appId);
      console.log(`🔧 [DEBUG] App trovata:`, !!app, app ? app.name : 'non trovata');
      
      if (!app) {
        console.error(`❌ App ${appId} non trovata in apps`);
        return null;
      }
      
      console.log(`🔧 [DEBUG] App.files prima del caricamento:`, app.files?.length || 0);
      
      // Se l'app non ha i file caricati, caricali dal database
      if (!app.files || app.files.length === 0) {
        console.log(`🔧 [DEBUG] Caricamento file dal database per app ${appId}`);
        const files = await StorageService.getAppFiles(appId);
        console.log(`🔧 [DEBUG] File caricati dal database:`, files?.length || 0, files);
        app = { ...app, files };
      }
      
      if (!app.files || app.files.length === 0) {
        console.error(`❌ Nessun file trovato per app ${appId}`);
        return null;
      }

      console.log(`📁 Configurando servizio file per app ${appId}:`, app.files.length, 'file');
      console.log(`🔧 [DEBUG] Lista file:`, app.files.map(f => f.filename));

      // Crea blob URLs per tutti i file dell'app (esattamente come nel basecode originale)
      const blobUrls = {};
      for (const file of app.files) {
        try {
          let blob;
          
          // Controlla se il file è di testo o binario
          const isTextFile = file.mimeType && (
            file.mimeType.startsWith('text/') ||
            file.mimeType.includes('javascript') ||
            file.mimeType.includes('json') ||
            file.mimeType.includes('css') ||
            file.mimeType.includes('html') ||
            file.mimeType.includes('xml')
          );
          
          if (isTextFile) {
            blob = new Blob([file.content], { type: file.mimeType });
          } else {
            // Per file binari, gestisci come nel basecode originale
            try {
              const binaryString = atob(file.content);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              blob = new Blob([bytes], { type: file.mimeType });
            } catch (decodeError) {
              // Se non è base64, trattalo come testo
              blob = new Blob([file.content], { type: file.mimeType || 'application/octet-stream' });
            }
          }
          
          blobUrls[file.filename] = URL.createObjectURL(blob);
          console.log(`📄 Blob URL creato per: ${file.filename} (${file.mimeType})`);
        } catch (error) {
          console.error(`Errore creazione blob per ${file.filename}:`, error);
        }
      }

      // Trova il file index.html
      const indexFile = app.files.find(f => f.filename === 'index.html');
      if (!indexFile) {
        console.warn('File index.html non trovato');
        return null;
      }

      // Sostituisce i riferimenti relativi con blob URLs (ESATTAMENTE come nel basecode originale)
      let indexHtml = indexFile.content;
      let replacementCount = 0;
      
      for (const [filename, blobUrl] of Object.entries(blobUrls)) {
        if (filename !== 'index.html') {
          // Usa gli stessi pattern regex del basecode originale
          const patterns = [
            new RegExp(`(href|src)=["']${filename}["']`, 'g'),
            new RegExp(`(href|src)=["']\\./${filename}["']`, 'g')
          ];
          
          patterns.forEach(pattern => {
            const beforeReplace = indexHtml;
            indexHtml = indexHtml.replace(pattern, `$1="${blobUrl}"`);
            if (beforeReplace !== indexHtml) {
              replacementCount++;
              console.log(`🔄 Sostituito riferimento a ${filename} con blob URL`);
            }
          });
        }
      }

      // Salva i blob URLs per la pulizia successiva
      if (!window.aideasBlobUrls) {
        window.aideasBlobUrls = {};
      }
      window.aideasBlobUrls[appId] = blobUrls;

      console.log('✅ Servizio file configurato con successo:', Object.keys(blobUrls).length, 'blob URLs');
      console.log(`🔄 Effettuate ${replacementCount} sostituzioni di URL nell'HTML`);
      
      return indexHtml;
      
    } catch (error) {
      console.error('Errore configurazione servizio file:', error);
      return null;
    }
  };

  // Funzione per pulire i blob URLs quando non sono più necessari
  const cleanupBlobUrls = (appId) => {
    try {
      if (window.aideasBlobUrls && window.aideasBlobUrls[appId]) {
        const blobUrls = window.aideasBlobUrls[appId];
        Object.values(blobUrls).forEach(url => {
          URL.revokeObjectURL(url);
        });
        delete window.aideasBlobUrls[appId];
        console.log(`🧹 Blob URLs puliti per app ${appId}`);
      }
    } catch (error) {
      console.error('Errore pulizia blob URLs:', error);
    }
  };

  const handleToggleFavorite = async (appId) => {
    try {
      const app = apps.find(a => a.id === appId);
      if (app) {
        const updatedApp = { ...app, favorite: !app.favorite };
        await StorageService.updateApp(appId, { favorite: !app.favorite });
        
        // Aggiorna stato locale
        setApps(prev => prev.map(a => a.id === appId ? updatedApp : a));
        
        showToast(
          updatedApp.favorite ? 'Aggiunta ai preferiti' : 'Rimossa dai preferiti', 
          'success'
        );
      }
    } catch (error) {
      console.error('Errore toggle favorite:', error);
      showToast('Errore nell\'aggiornamento dei preferiti', 'error');
    }
  };

  const handleDeleteApp = async (appId) => {
    try {
      await StorageService.deleteApp(appId);
      setApps(prev => prev.filter(a => a.id !== appId));
      showToast('Applicazione eliminata', 'success');
    } catch (error) {
      console.error('Errore eliminazione app:', error);
      showToast('Errore nell\'eliminazione dell\'applicazione', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    
    try {
      await StorageService.deleteApp(appToDelete.id);
      await loadApps(); // Ricarica le app
      setSelectedApp(null);
      setDeleteConfirmOpen(false);
      setAppToDelete(null);
      showToast('App eliminata con successo', 'success');
    } catch (error) {
      console.error('Errore eliminazione app:', error);
      showToast('Errore durante l\'eliminazione', 'error');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setAppToDelete(null);
  };

  // Removed PWA handlers - functionality not implemented

  const handleAddApp = async (appData) => {
    try {
      let processedAppData = { ...appData };
      
      // Gestisci file ZIP
      if (appData.type === 'zip' && appData.zipFile) {
        console.log('📦 Processando file ZIP:', appData.zipFile.name);
        
        // Importa JSZip dinamicamente
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Leggi il contenuto del ZIP
        const contents = await zip.loadAsync(appData.zipFile);
        
        // Estrai tutti i file
        const files = [];
        let manifest = null;
        
        for (const [filename, fileObj] of Object.entries(contents.files)) {
          if (fileObj.dir) continue;
          
          const content = await fileObj.async('text');
          const fileData = {
            filename,
            content,
            size: content.length,
            mimeType: getMimeType(filename)
          };
          
          files.push(fileData);
          
          // Cerca manifest AIdeas
          if (filename === 'aideas.json') {
            try {
              manifest = JSON.parse(content);
            } catch (e) {
              console.warn('Manifest aideas.json non valido:', e);
            }
          }
        }
        
        // Validazione: deve contenere almeno un file HTML
        const hasHTML = files.some(f => f.filename.endsWith('.html'));
        if (!hasHTML) {
          throw new Error('Il file ZIP deve contenere almeno un file HTML');
        }
        
        // Estrai metadati dal manifest o dai file
        const metadata = extractZipMetadata(files, manifest);
        
        // Prepara i dati dell'app - RISPETTA le modifiche dell'utente
        processedAppData = {
          ...appData,
          // Usa i metadati estratti solo se l'utente non ha modificato i campi
          name: appData.name || metadata.name,
          description: appData.description || metadata.description,
          category: appData.category || metadata.category,
          tags: appData.tags?.length > 0 ? appData.tags : metadata.tags,
          icon: appData.icon || metadata.icon,
          author: appData.author || metadata.author,
          files: files,
          manifest: manifest || {}
        };
        
        console.log('✅ ZIP processato con successo:', files.length, 'file estratti');
      }
      
      const appId = await StorageService.installApp(processedAppData);
      await loadApps(); // Ricarica tutte le app
      setImporterOpen(false);
      showToast('Applicazione aggiunta con successo', 'success');
    } catch (error) {
      console.error('Errore aggiunta app:', error);
      showToast(`Errore nell'aggiunta dell'applicazione: ${error.message}`, 'error');
    }
  };

  // Handler per app generate con AI
  const handleAIGeneratedApp = async (appData) => {
    try {
      console.log('🚀 Importazione app AI:', appData);
      
      // Estrai metadati dall'app
      const { name, description, icon, htmlContent, type, category, isModification, originalAppId, originalUniqueId } = appData;
      
      // Se è una modifica di un'app esistente, controlla se esiste già
      if (isModification && originalAppId) {
        console.log('🔄 Modifica app esistente rilevata:', originalAppId);
        
        // Trova l'app originale
        const originalApp = existingApps.find(app => app.id === originalAppId);
        
        if (originalApp) {
          // Mostra sempre il dialog di scelta per le modifiche
          const choice = await showDuplicateAppDialog(originalApp, appData);
          
          if (choice === 'update') {
            // Aggiorna l'app esistente
            await updateExistingApp(originalApp.id, appData);
            showToast('App aggiornata con successo!', 'success');
          } else if (choice === 'new-version') {
            // Crea una nuova versione
            const newVersionApp = await createNewVersionApp(originalApp, appData);
            showToast(`Nuova versione creata: ${newVersionApp.name}`, 'success');
          } else {
            // Annulla
            console.log('Aggiornamento annullato dall\'utente');
            return;
          }
          
          await loadApps();
          setCurrentView('apps');
          return;
        }
      }
      
      // Genera uniqueId per controllare duplicati
      const uniqueId = StorageService.generateUniqueId(name, 'AI Generated');
      
      // Controlla se esiste già un'app con lo stesso uniqueId
      const existingApps = await StorageService.getAllApps();
      const existingApp = existingApps.find(app => app.uniqueId === uniqueId);
      
      if (existingApp) {
        // App duplicata trovata - chiedi all'utente cosa fare
        const choice = await showDuplicateAppDialog(existingApp, appData);
        
        if (choice === 'update') {
          // Aggiorna l'app esistente
          await updateExistingApp(existingApp.id, appData);
          showToast('App aggiornata con successo!', 'success');
        } else if (choice === 'new-version') {
          // Crea una nuova versione
          const newVersionApp = await createNewVersionApp(existingApp, appData);
          showToast(`Nuova versione creata: ${newVersionApp.name}`, 'success');
        } else {
          // Annulla
          console.log('Importazione annullata dall\'utente');
          return;
        }
      } else {
        // Nessuna app duplicata - installa normalmente
        const appToInstall = {
          name: name || 'App AI senza nome',
          description: description || 'App generata con AI',
          icon: icon || '🤖',
          content: htmlContent,
          type: 'html',
          source: 'ai-generated',
          category: category || 'AI Generated',
          metadata: {
            aiModel: appData.model || 'unknown',
            generatedAt: new Date().toISOString(),
            type: type || 'utility',
            originalPrompt: appData.originalPrompt || ''
          },
          tags: ['AI Generated', type || 'utility'],
          permissions: [],
          version: '1.0.0',
          uniqueId: uniqueId
        };
        
        const appId = await StorageService.installApp(appToInstall);
        console.log('✅ App installata con ID:', appId);
        showToast('App AI importata con successo!', 'success');
      }
      
      // Ricarica tutte le app
      await loadApps();
      
      // Torna alla pagina principale
      setCurrentView('apps');
      
    } catch (error) {
      console.error('❌ Errore importazione app AI:', error);
      showToast('Errore durante l\'importazione dell\'app AI: ' + error.message, 'error');
    }
  };

  // Funzione per mostrare dialog di scelta per app duplicate
  const showDuplicateAppDialog = (existingApp, newAppData) => {
    return new Promise((resolve) => {
      // Determina se è una modifica o una nuova app
      const isModification = newAppData.isModification;
      const title = isModification ? 'Modifica App Esistente' : 'App Duplicata Rilevata';
      const description = isModification 
        ? `Stai modificando l'app <strong>"${existingApp.name}"</strong>.`
        : `Esiste già un'app chiamata <strong>"${existingApp.name}"</strong>.`;
      
      const dialogContent = `
        <div style="padding: 20px; max-width: 500px;">
          <h3 style="margin-top: 0; color: #1976d2;">${title}</h3>
          <p>${description}</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin-top: 0;">App Esistente:</h4>
            <p><strong>Nome:</strong> ${existingApp.name}</p>
            <p><strong>Versione:</strong> ${existingApp.version}</p>
            <p><strong>Ultima modifica:</strong> ${new Date(existingApp.timestamp || existingApp.lastUsed).toLocaleDateString()}</p>
            ${isModification ? '<p><strong>Tipo:</strong> Modifica tramite AI</p>' : ''}
          </div>
          
          <p>Cosa vuoi fare?</p>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="update-btn" style="flex: 1; padding: 10px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              🔄 ${isModification ? 'Aggiorna App' : 'Aggiorna App Esistente'}
            </button>
            <button id="new-version-btn" style="flex: 1; padding: 10px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer;">
              ➕ Crea Nuova Versione
            </button>
            <button id="cancel-btn" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
              ❌ Annulla
            </button>
          </div>
        </div>
      `;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;
      
      const dialogBox = document.createElement('div');
      dialogBox.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
      `;
      dialogBox.innerHTML = dialogContent;
      
      dialog.appendChild(dialogBox);
      document.body.appendChild(dialog);

      // Event listeners
      dialog.querySelector('#update-btn').onclick = () => {
        document.body.removeChild(dialog);
        resolve('update');
      };
      
      dialog.querySelector('#new-version-btn').onclick = () => {
        document.body.removeChild(dialog);
        resolve('new-version');
      };
      
      dialog.querySelector('#cancel-btn').onclick = () => {
        document.body.removeChild(dialog);
        resolve('cancel');
      };
      
      // Chiudi con ESC
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          document.body.removeChild(dialog);
          document.removeEventListener('keydown', handleKeyDown);
          resolve('cancel');
        }
      };
      document.addEventListener('keydown', handleKeyDown);
    });
  };

  // Funzione per aggiornare app esistente
  const updateExistingApp = async (appId, newAppData) => {
    const { name, description, icon, htmlContent, type, category } = newAppData;
    
    const updates = {
      description: description || 'App generata con AI',
      icon: icon || '🤖',
      content: htmlContent,
      metadata: {
        aiModel: newAppData.model || 'unknown',
        lastModified: new Date().toISOString(),
        type: type || 'utility',
        originalPrompt: newAppData.originalPrompt || ''
      },
      tags: ['AI Generated', type || 'utility'],
      version: '1.0.0' // Mantieni la versione originale
    };
    
    await StorageService.updateApp(appId, updates);
    console.log('✅ App esistente aggiornata:', appId);
  };

  // Funzione per creare nuova versione
  const createNewVersionApp = async (existingApp, newAppData) => {
    const { name, description, icon, htmlContent, type, category } = newAppData;
    
    // Trova la prossima versione disponibile
    const versionNumber = getNextVersionNumber(existingApp.name);
    const newName = `${existingApp.name} v.${versionNumber}`;
    
    const appToInstall = {
      name: newName,
      description: description || 'App generata con AI',
      icon: icon || '🤖',
      content: htmlContent,
      type: 'html',
      source: 'ai-generated',
      category: category || 'AI Generated',
      metadata: {
        aiModel: newAppData.model || 'unknown',
        generatedAt: new Date().toISOString(),
        type: type || 'utility',
        originalPrompt: newAppData.originalPrompt || '',
        originalAppId: existingApp.id,
        versionNumber: versionNumber
      },
      tags: ['AI Generated', type || 'utility', 'Version'],
      permissions: [],
      version: `${versionNumber}.0.0`,
      uniqueId: StorageService.generateUniqueId(newName, 'AI Generated')
    };
    
    const appId = await StorageService.installApp(appToInstall);
    console.log('✅ Nuova versione creata:', appId);
    
    return appToInstall;
  };

  // Funzione per ottenere il prossimo numero di versione
  const getNextVersionNumber = (baseName) => {
    const existingApps = apps.filter(app => 
      app.name.startsWith(baseName + ' v.') && 
      app.source === 'ai-generated'
    );
    
    if (existingApps.length === 0) {
      return 2; // Prima versione sarà v.2
    }
    
    // Estrai i numeri di versione esistenti
    const versionNumbers = existingApps
      .map(app => {
        const match = app.name.match(/v\.(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    return Math.max(...versionNumbers) + 1;
  };

  // Handler per modificare app generate con AI
  const handleEditAIApp = (app) => {
    console.log('🤖 Modifica app AI:', app);
    // Naviga alla pagina AI Generator e passa l'ID dell'app da modificare
    setCurrentView('ai-generator');
    // Passa l'ID dell'app al componente AI Generator
    if (window.handleEditInstalledApp) {
      window.handleEditInstalledApp(app.id);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'produttività': 'primary',
      'intrattenimento': 'secondary',
      'sviluppo': 'success',
      'social': 'warning',
      'utility': 'info',
      'altro': 'default'
    };
    return colors[category?.toLowerCase()] || 'default';
  };

  // Funzione helper per gestire le icone in modo uniforme
  const getAppIcon = (app) => {
    if (app.icon) {
      // Se è un'emoji (carattere Unicode)
      const isEmoji = (icon) => {
        if (!icon) return false;
        
        // Test più robusto per le emoji
        // Includiamo sia Unicode emoji che simboli speciali
        const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
        
        // Controlla se è una singola emoji o simbolo
        if (icon.length === 1 || icon.length === 2) {
          return emojiRegex.test(icon) || icon.charCodeAt(0) > 255;
        }
        
        return false;
      };
      
      if (isEmoji(app.icon)) {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            {app.icon}
          </div>
        );
      }
      
      // Se è un'icona custom (base64, URL, etc.)
      if (app.icon.startsWith('data:') || app.icon.startsWith('http')) {
        return (
          <img 
            src={app.icon} 
            alt={app.name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        );
      }
      // Se è un'icona SVG inline
      if (app.icon.includes('<svg')) {
        return (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
            dangerouslySetInnerHTML={{ __html: app.icon }}
          />
        );
      }
    }

    // Fallback: iniziali
    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };
    
    return getInitials(app.name);
  };

  // Funzioni helper per gestione ZIP
  const getMimeType = (filename) => {
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
  };

  const extractZipMetadata = (files, manifest) => {
    const metadata = {
      name: manifest?.name || 'App Importata',
      description: manifest?.description || '',
      version: manifest?.version || '1.0.0',
      category: manifest?.category || 'altro',
      tags: manifest?.tags || [],
      icon: manifest?.icon || null,
      permissions: manifest?.permissions || []
    };

    // Cerca il file index.html per estrarre i metadati
    const indexHtmlFile = files.find(f => 
      f.filename.toLowerCase() === 'index.html' || 
      f.filename.toLowerCase().endsWith('/index.html')
    );

    if (indexHtmlFile) {
      console.log('📄 Trovato index.html, estraggo metadati...');
      const htmlMetadata = extractHtmlMetadataFromZip(indexHtmlFile.content);
      
      // Sovrascrivi i metadati con quelli trovati nell'HTML
      if (htmlMetadata.title && !manifest?.name) {
        metadata.name = htmlMetadata.title;
      }
      if (htmlMetadata.description && !manifest?.description) {
        metadata.description = htmlMetadata.description;
      }
      if (htmlMetadata.keywords && !manifest?.tags?.length) {
        metadata.tags = htmlMetadata.keywords.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
      if (htmlMetadata.icon && !manifest?.icon) {
        metadata.icon = htmlMetadata.icon;
      }
      
      // Modifica i percorsi nell'HTML per puntare ai file salvati
      const modifiedHtmlContent = modifyHtmlPaths(htmlMetadata.htmlContent || new TextDecoder().decode(indexHtmlFile.content), files);
      
      // Imposta il contenuto HTML modificato per l'avvio dell'app
      metadata.content = modifiedHtmlContent;
      metadata.type = 'zip'; // Mantieni il tipo ZIP per preservare la gestione dei file
      
      console.log('✅ Metadati estratti da index.html:', {
        name: metadata.name,
        description: metadata.description,
        tags: metadata.tags,
        hasIcon: !!metadata.icon,
        hasContent: !!metadata.content
      });
    }

    // Cerca icona nei file se non specificata nel manifest o nell'HTML
    if (!metadata.icon) {
      const iconFile = files.find(f => 
        f.filename.match(/^(icon|logo|app-icon|favicon)\.(png|jpg|jpeg|svg|ico)$/i)
      );
      if (iconFile) {
        const blob = new Blob([iconFile.content], { type: iconFile.mimeType });
        metadata.icon = URL.createObjectURL(blob);
        console.log('🎨 Icona trovata nei file:', iconFile.filename);
      }
    }

    return metadata;
  };

  // Funzione per estrarre metadati da HTML (simile a quella in AppImporterMaterial)
  const extractHtmlMetadataFromZip = (htmlContent) => {
    const metadata = {
      htmlContent: htmlContent // Aggiungi il contenuto HTML per la modifica percorsi
    };
    
    // Estrai il titolo
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Estrai la descrizione
    const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }
    
    // Estrai le keywords
    const keywordsMatch = htmlContent.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].trim();
    }
    
    // Estrai l'autore
    const authorMatch = htmlContent.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }
    
    // Estrai l'icona/favicon
    const iconMatch = htmlContent.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (iconMatch) {
      const iconUrl = iconMatch[1].trim();
      if (iconUrl.startsWith('data:')) {
        metadata.icon = iconUrl;
      } else if (iconUrl.startsWith('http')) {
        metadata.icon = iconUrl;
      } else {
        // Per icone relative, cerca di estrarre il contenuto inline
        metadata.icon = extractInlineIconFromZip(htmlContent, iconUrl);
      }
    }
    
    // Estrai anche apple-touch-icon
    const appleIconMatch = htmlContent.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    if (appleIconMatch && !metadata.icon) {
      const iconUrl = appleIconMatch[1].trim();
      if (iconUrl.startsWith('data:') || iconUrl.startsWith('http')) {
        metadata.icon = iconUrl;
      } else {
        metadata.icon = extractInlineIconFromZip(htmlContent, iconUrl);
      }
    }
    
    // Se non troviamo icone specifiche, cerca SVG inline
    if (!metadata.icon) {
      const svgMatch = htmlContent.match(/<svg[^>]*>.*?<\/svg>/is);
      if (svgMatch) {
        metadata.icon = `data:image/svg+xml;base64,${btoa(svgMatch[0])}`;
      }
    }
    
    return metadata;
  };

  // Funzione per estrarre icone inline dal file HTML nello ZIP
  const extractInlineIconFromZip = (htmlContent, iconPath) => {
    // Cerca il contenuto dell'icona nel file HTML
    const iconFileName = iconPath.split('/').pop();
    const iconMatch = htmlContent.match(new RegExp(`<link[^>]*href=["'][^"']*${iconFileName}["'][^>]*>`));
    
    if (iconMatch) {
      // Se l'icona è definita inline, estrai il contenuto
      const dataMatch = htmlContent.match(/data:image\/[^;]+;base64,[^"']+/);
      if (dataMatch) {
        return dataMatch[0];
      }
    }
    
    return null;
  };

  // Funzione per modificare i percorsi nell'HTML per puntare ai file salvati
  const modifyHtmlPaths = (htmlContent, files) => {
    let modifiedContent = htmlContent;
    
    // Lista dei file disponibili per il mapping
    const availableFiles = files.map(f => f.filename);
    console.log('📁 File disponibili per il mapping:', availableFiles);
    
    // Modifica percorsi CSS
    modifiedContent = modifiedContent.replace(
      /href=["']([^"']*\.css)["']/gi,
      (match, cssPath) => {
        const fileName = cssPath.split('/').pop();
        const fileExists = availableFiles.some(f => f.endsWith(fileName));
        if (fileExists) {
          console.log(`🎨 CSS trovato: ${cssPath} -> ${fileName}`);
          return `href="${fileName}"`; // Usa percorso relativo invece di app://
        }
        return match;
      }
    );
    
    // Modifica percorsi JavaScript
    modifiedContent = modifiedContent.replace(
      /src=["']([^"']*\.js)["']/gi,
      (match, jsPath) => {
        const fileName = jsPath.split('/').pop();
        const fileExists = availableFiles.some(f => f.endsWith(fileName));
        if (fileExists) {
          console.log(`📜 JS trovato: ${jsPath} -> ${fileName}`);
          return `src="${fileName}"`; // Usa percorso relativo invece di app://
        }
        return match;
      }
    );
    
    // Modifica percorsi immagini
    modifiedContent = modifiedContent.replace(
      /src=["']([^"']*\.(png|jpg|jpeg|gif|svg|ico))["']/gi,
      (match, imgPath) => {
        const fileName = imgPath.split('/').pop();
        const fileExists = availableFiles.some(f => f.endsWith(fileName));
        if (fileExists) {
          console.log(`🖼️ Immagine trovata: ${imgPath} -> ${fileName}`);
          return `src="${fileName}"`; // Usa percorso relativo invece di app://
        }
        return match;
      }
    );
    
    // Modifica percorsi font
    modifiedContent = modifiedContent.replace(
      /src=["']([^"']*\.(woff|woff2|ttf|eot))["']/gi,
      (match, fontPath) => {
        const fileName = fontPath.split('/').pop();
        const fileExists = availableFiles.some(f => f.endsWith(fileName));
        if (fileExists) {
          console.log(`🔤 Font trovato: ${fontPath} -> ${fileName}`);
          return `src="app://${fileName}"`;
        }
        return match;
      }
    );
    
    console.log('✅ Percorsi HTML modificati per file locali');
    return modifiedContent;
  };

  const renderAppCard = (app) => (
    <Card 
      key={app.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
            }}
          >
            {app.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h3" noWrap>
              {app.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {app.description || 'Nessuna descrizione'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={app.category || 'Altro'} 
            color={getCategoryColor(app.category)}
            size="small"
            sx={{ mr: 1 }}
          />
          {app.favorite && (
            <Chip 
              icon={<FavoriteIcon />} 
              label="Preferita" 
              color="secondary" 
              size="small"
            />
          )}
        </Box>
        
        {app.lastUsed && (
          <Typography variant="caption" color="text.secondary">
            Ultimo uso: {new Date(app.lastUsed).toLocaleDateString('it-IT')}
          </Typography>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<LaunchIcon />}
            onClick={() => handleLaunchApp(app.id)}
            size="small"
          >
            Avvia
          </Button>
          
          {/* Removed PWA buttons - functionality not implemented */}
        </Box>
        
        <Box>
          <IconButton
            size="small"
            onClick={() => handleToggleFavorite(app.id)}
            color={app.favorite ? 'secondary' : 'default'}
          >
            <FavoriteIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setSelectedApp(app)}
          >
            <EditIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  // Aggiorna impostazioni utente
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    // Salva le impostazioni su StorageService
    StorageService.setAllSettings(newSettings);
    
    // Se è cambiato il tema, aggiornalo
    if (newSettings.theme && newSettings.theme !== 'system') {
      // Il ThemeProvider gestirà automaticamente il cambio
      console.log('🎨 Tema aggiornato dalle impostazioni:', newSettings.theme);
    }
  };

  // Aggiorna modalità di visualizzazione
  const handleViewModeChange = (newViewMode) => {
    setCurrentViewMode(newViewMode);
    // Salva nelle impostazioni
    const updatedSettings = { ...settings, viewMode: newViewMode };
    setSettings(updatedSettings);
    StorageService.setAllSettings(updatedSettings);
    
    // Mostra messaggio informativo per modalità compatta
    if (newViewMode === 'compact') {
      showToast('Modalità mobile: Click per avviare, tieni premuto per opzioni', 'info');
    }
  };

  // Aggiorna tema
  const handleThemeToggle = () => {
    toggleTheme();
  };

  // Aggiorna view
  const handleViewChange = (view) => {
    if (view === 'store') {
      navigateToStore();
    } else {
      setCurrentView(view);
      // Assicurati che currentRoute sia sincronizzato per tutte le viste non-store
      if (currentRoute !== 'apps') {
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
        window.history.pushState(null, '', baseUrl || '/');
        setCurrentRoute('apps');
      }
    }
  };

  // Navigazione programmatica
  const navigateToStore = () => {
    // Se siamo già su /store, non fare nulla
    const currentPath = window.location.pathname;
    if (currentPath === '/store' || currentPath.endsWith('/store')) {
      setCurrentRoute('store');
      setCurrentView('store');
      return;
    }
    
    // Semplicemente aggiungi /store al path corrente
    const newUrl = `${window.location.origin}/store`;
    console.log('🔄 Navigating to store:', newUrl);
    
    window.history.pushState(null, '', newUrl);
    setCurrentRoute('store');
    setCurrentView('store');
  };

  const navigateToApps = () => {
    // Torna alla home
    const newUrl = window.location.origin;
    console.log('🔄 Navigating to apps:', newUrl);
    
    window.history.pushState(null, '', newUrl);
    setCurrentRoute('apps');
    setCurrentView('all');
  };

  const navigateToAIGenerator = () => {
    // Se siamo già su /ai-generator, non fare nulla
    const currentPath = window.location.pathname;
    if (currentPath === '/ai-generator' || currentPath.endsWith('/ai-generator')) {
      setCurrentRoute('ai-generator');
      setCurrentView('ai-generator');
      return;
    }
    
    // Naviga al generatore AI
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    window.history.pushState(null, '', `${baseUrl}/ai-generator`);
    setCurrentRoute('ai-generator');
    setCurrentView('ai-generator');
  };

  // Handler per app installata dallo store
  const handleStoreAppInstalled = async (appId) => {
    try {
      // Ricarica le app per mostrare i cambiamenti
      await loadApps();
      
      // Se appId è null, significa che è stata disinstallata un'app
      if (appId === null) {
        // Rimani nello store dopo la disinstallazione
        return;
      }
      
      // Naviga alla home per vedere l'app installata
      navigateToApps();
    } catch (error) {
      DEBUG.error('❌ Errore ricaricamento dopo operazione store:', error);
    }
  };

  const handleLongPressStart = (app) => {
    const timer = setTimeout(() => {
      setLongPressApp(app);
      setSelectedApp(app);
    }, 500); // 500ms per long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setLongPressApp(null);
  };

  const handleGoogleAuthCallback = async (code, state) => {
    try {
      const googleService = GoogleDriveService.createConfiguredInstance();
      
      const result = await googleService.handleAuthCallback(code, state);
      
      // Correggi provider obsoleto "gist" -> "googledrive"
      const currentProvider = await StorageService.getSetting('syncProvider', 'github');
      if (currentProvider === 'gist') {
        DEBUG.log('🔧 Correzione provider obsoleto: gist -> googledrive');
        await StorageService.setSetting('syncProvider', 'googledrive');
        await StorageService.setSetting('syncEnabled', true);
      } else if (currentProvider !== 'googledrive') {
        // Se non è Google Drive, imposta Google Drive come provider
        await StorageService.setSetting('syncProvider', 'googledrive');
        await StorageService.setSetting('syncEnabled', true);
      }
      
      showToast('Autenticazione Google completata!', 'success');
      
      // Carica le informazioni dell'utente
      await loadUserInfo();
      
      // Aggiorna lo stato se necessario
      if (syncManagerOpen) {
        // Ricarica lo stato del sync manager
        // Questo verrà gestito dal componente stesso
      }
    } catch (error) {
      console.error('Errore callback Google:', error);
      showToast('Errore autenticazione Google: ' + error.message, 'error');
    }
  };

  const handleShowAppInfo = async (app) => {
    try {
      if (app.type === 'zip') {
        // Carica i file per le app ZIP
        const files = await StorageService.getAppFiles(app.id);
        const appWithFiles = { ...app, files: files || [] };
        setAppInfoData(appWithFiles);
      } else {
        setAppInfoData(app);
      }
      setAppInfoModalOpen(true);
    } catch (error) {
      console.error('Errore caricamento info app:', error);
      showToast('Errore nel caricamento delle informazioni dell\'app', 'error');
    }
  };

  /**
   * Callback chiamato dopo una sincronizzazione riuscita
   * Ricarica le app e le impostazioni per riflettere i cambiamenti
   */
  const handleSyncComplete = async (syncResult) => {
    try {
      DEBUG.log('🔄 Ricaricamento app dopo sincronizzazione:', syncResult);
      
      // Ricarica le app dal database
      await loadApps();
      
      // Ricarica anche le impostazioni in caso siano cambiate
      await loadUserSettings();
      
      // Mostra messaggio di successo se non già mostrato
      if (syncResult?.message) {
        showToast(syncResult.message, 'success');
      }
      
      DEBUG.log('✅ Ricaricamento completato dopo sincronizzazione');
    } catch (error) {
      DEBUG.error('❌ Errore ricaricamento dopo sincronizzazione:', error);
      showToast('Errore nel ricaricamento dopo sincronizzazione', 'error');
    }
  };

  // Funzioni per selezione multipla
  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedApps(new Set());
    }
  };

  const handleSelectApp = (appId) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedApps.size === filteredApps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(filteredApps.map(app => app.id)));
    }
  };

  const handleBulkAction = (actionType) => {
    setBulkActionType(actionType);
    setBulkActionDialogOpen(true);
  };

  const handleConfirmBulkAction = async () => {
    if (selectedApps.size === 0) return;

    try {
      const selectedAppIds = Array.from(selectedApps);
      
      switch (bulkActionType) {
        case 'delete':
          // Elimina le app selezionate
          for (const appId of selectedAppIds) {
            await StorageService.deleteApp(appId);
          }
          showToast(`${selectedAppIds.length} app eliminate con successo`, 'success');
          break;
          
        case 'category':
          // Apri dialog per selezionare categoria
          setCategoryDialogOpen(true);
          return;
          
        default:
          break;
      }
      
      // Ricarica le app e resetta la selezione
      await loadApps();
      setSelectedApps(new Set());
      setSelectionMode(false);
      setBulkActionDialogOpen(false);
      setBulkActionType(null);
      
    } catch (error) {
      DEBUG.error('❌ Errore azione bulk:', error);
      showToast(`Errore durante l'operazione: ${error.message}`, 'error');
    }
  };

  const handleCancelBulkAction = () => {
    setBulkActionDialogOpen(false);
    setBulkActionType(null);
  };

  const handleCategoryChange = async (category) => {
    try {
      const selectedAppIds = Array.from(selectedApps);
      
      // Aggiorna la categoria per tutte le app selezionate
      for (const appId of selectedAppIds) {
        await StorageService.updateApp(appId, { category });
      }
      
      showToast(`Categoria aggiornata per ${selectedAppIds.length} app`, 'success');
      
      // Ricarica le app e resetta la selezione
      await loadApps();
      setSelectedApps(new Set());
      setSelectionMode(false);
      setCategoryDialogOpen(false);
      setBulkActionDialogOpen(false);
      setBulkActionType(null);
      
    } catch (error) {
      DEBUG.error('❌ Errore aggiornamento categoria:', error);
      showToast(`Errore durante l'aggiornamento: ${error.message}`, 'error');
    }
  };

  const handleCancelCategoryChange = () => {
    setCategoryDialogOpen(false);
    setBulkActionDialogOpen(false);
    setBulkActionType(null);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <LinearProgress sx={{ width: '50%' }} />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Caricamento...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: theme.palette.background.default
    }}>
      
      {/* NavigationMaterial */}
      <NavigationMaterial
        drawerOpen={drawerOpen}
        onDrawerToggle={() => setDrawerOpen((open) => !open)}
        onSettingsOpen={() => setSettingsDialogOpen(true)}
        onThemeToggle={handleThemeToggle}
        onSyncManagerOpen={() => setSyncManagerOpen(true)}

        currentView={currentView}
        onViewChange={handleViewChange}
        favoriteCount={apps.filter(a => a.favorite).length}
        recentCount={(() => {
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          return apps.filter(app => app.lastUsed && new Date(app.lastUsed) > twoWeeksAgo).length;
        })()}
        totalApps={apps.length}
        theme={theme}
        mode={mode}
        bottomBar={settings.bottomBar || false}
        userInfo={userInfo}
        isAuthenticated={isAuthenticated}
        settings={settings}
        onAIGeneratorOpen={navigateToAIGenerator}
      />

      {/* Main Content */}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        mt: !settings.bottomBar ? { xs: '56px', sm: '64px' } : 0,
        mb: settings.bottomBar ? { xs: '56px', sm: '64px' } : 0,
        ml: { sm: drawerOpen ? '280px' : 0 },
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        width: { sm: drawerOpen ? 'calc(100vw - 280px)' : '100vw' },
        p: 0
      }}>
        {/* Render condizionale basato sulla route */}
        {currentRoute === 'store' ? (
          <StorePage 
            onNavigateBack={navigateToApps}
            onAppInstalled={handleStoreAppInstalled}
            installedApps={apps}
          />
        ) : currentRoute === 'ai-generator' ? (
          <AIGeneratorPage 
            onNavigateBack={navigateToApps}
            onAppGenerated={handleAIGeneratedApp}
          />
        ) : (
          <Box sx={{ 
            width: '100%',
            maxWidth: '1200px',
            p: { xs: 2, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
        {/* Search Bar e Controlli - Layout fisso e centrato */}
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center',
          width: '100%',
          position: 'sticky',
          top: settings.bottomBar ? 0 : { xs: '56px', sm: '64px' },
          zIndex: 10,
          backgroundColor: 'background.default',
          py: 2,
          borderRadius: 2
        }}>
          {/* Barra di ricerca fissa e centrata con pulsante + integrato - GLOSSY/TRASLUCIDA */}
          <Box sx={{
            width: '100%',
            maxWidth: 600,
            minWidth: 300,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            mb: 2,
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.15)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                : '0 12px 40px rgba(0, 0, 0, 0.15)'
            }
          }}>
            <Box sx={{ pl: 2, pr: 1, display: 'flex', alignItems: 'center' }}>
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </Box>
            <TextField
              variant="outlined"
              placeholder="Cerca applicazioni..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              InputProps={{
                sx: {
                  border: 'none',
                  boxShadow: 'none',
                  background: 'transparent',
                  '& fieldset': { border: 'none' },
                  fontSize: '1rem',
                  px: 0,
                  '& input': {
                    color: 'text.primary',
                    '&::placeholder': {
                      color: 'text.secondary',
                      opacity: 0.7
                    }
                  }
                }
              }}
              sx={{
                flex: 1,
                background: 'transparent',
                minWidth: 0
              }}
            />
            <Box sx={{ pr: 2, pl: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                aria-label="AIdeas Store"
                onClick={navigateToStore}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: theme.shadows[4]
                  },
                  boxShadow: theme.shadows[2]
                }}
              >
                <StoreIcon />
              </IconButton>
              <IconButton
                aria-label="Genera app con AI"
                onClick={navigateToAIGenerator}
                sx={{
                  background: `linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)`,
                    boxShadow: theme.shadows[4]
                  },
                  boxShadow: theme.shadows[2]
                }}
              >
                <AIIcon />
              </IconButton>
              <IconButton
                aria-label="Aggiungi app"
                onClick={() => setImporterOpen(true)}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    boxShadow: theme.shadows[4]
                  },
                  boxShadow: theme.shadows[2]
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Controlli vista centrati e fissi */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            justifyContent: 'center',
            backgroundColor: 'background.paper',
            borderRadius: 2,
            px: 2,
            py: 1
          }}>
            <IconButton
              onClick={() => handleViewModeChange('grid')}
              color={currentViewMode === 'grid' ? 'primary' : 'default'}
              title="Vista griglia"
            >
              <AppsIcon />
            </IconButton>
            <IconButton
              onClick={() => handleViewModeChange('list')}
              color={currentViewMode === 'list' ? 'primary' : 'default'}
              title="Vista lista"
            >
              <ListIcon />
            </IconButton>
            <IconButton
              onClick={() => handleViewModeChange('compact')}
              color={currentViewMode === 'compact' ? 'primary' : 'default'}
              title="Vista compatta (mobile) - Click per avviare, tieni premuto per opzioni"
            >
              <ViewListIcon />
            </IconButton>
            
            {/* Separatore */}
            <Divider orientation="vertical" flexItem />
            
            {/* Pulsante selezione multipla */}
            <IconButton
              onClick={handleToggleSelectionMode}
              color={selectionMode ? 'primary' : 'default'}
              title={selectionMode ? 'Esci dalla selezione multipla' : 'Attiva selezione multipla'}
            >
              <CheckBoxIcon />
            </IconButton>
          </Box>
          
          {/* Controlli azioni bulk quando in modalità selezione */}
          {selectionMode && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'center',
              backgroundColor: 'background.paper',
              borderRadius: 2,
              px: 2,
              py: 1,
              mt: 1
            }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                {selectedApps.size} app selezionate
              </Typography>
              
              <Button
                size="small"
                onClick={handleSelectAll}
                variant="outlined"
                startIcon={<SelectAllIcon />}
              >
                {selectedApps.size === filteredApps.length ? 'Deseleziona tutto' : 'Seleziona tutto'}
              </Button>
              
              <Button
                size="small"
                onClick={() => handleBulkAction('category')}
                variant="outlined"
                startIcon={<CategoryIcon />}
                disabled={selectedApps.size === 0}
              >
                Cambia categoria
              </Button>
              
              <Button
                size="small"
                onClick={() => handleBulkAction('delete')}
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                disabled={selectedApps.size === 0}
              >
                Elimina
              </Button>
            </Box>
          )}
        </Box>

        {/* Apps con visualizzazione condizionale - Griglia vera come vanilla */}
        {currentViewMode === 'grid' && (
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(300px, 1fr))', // Larghezza minima aumentata per mobile
                  sm: 'repeat(auto-fill, minmax(320px, 1fr))',
                  md: 'repeat(auto-fill, minmax(320px, 1fr))',
                  lg: 'repeat(auto-fill, minmax(320px, 1fr))',
                  xl: 'repeat(auto-fill, minmax(320px, 1fr))'
                },
                gap: { xs: 2, sm: 3, md: 3, lg: 3 },
                width: '100%',
                // Assicura che le card abbiano spazio sufficiente
                alignContent: 'start'
              }}
            >
            {filteredApps.map(app => (
              <Box
                key={app.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  // Assicura che ogni card abbia spazio sufficiente
                  minHeight: { xs: 320, sm: 340, md: 360 }
                }}
              >
                <AppCardMaterial
                  app={app}
                  onLaunch={handleLaunchApp}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={app.source === 'ai-generated' ? handleEditAIApp : setSelectedApp}
                  onDelete={handleDeleteApp}
                  onShowMenu={() => {}}
                  onShowInfo={handleShowAppInfo}
                  selectionMode={selectionMode}
                  isSelected={selectedApps.has(app.id)}
                  onSelect={handleSelectApp}
                />
              </Box>
            ))}
            </Box>
          </Box>
        )}

        {currentViewMode === 'list' && (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredApps.map(app => (
              <Card key={app.id} sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                {/* Checkbox per selezione multipla */}
                {selectionMode && (
                  <Checkbox
                    checked={selectedApps.has(app.id)}
                    onChange={() => handleSelectApp(app.id)}
                    sx={{ mr: 1 }}
                  />
                )}
                
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2,
                    background: 'transparent',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                  onClick={() => handleLaunchApp(app.id)}
                >
                  {getAppIcon(app)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3">
                    {app.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {app.description || 'Nessuna descrizione'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={app.category || 'Altro'} 
                      color={getCategoryColor(app.category)}
                      size="small"
                    />
                    {app.favorite && (
                      <Chip 
                        icon={<FavoriteIcon />} 
                        label="Preferita" 
                        color="secondary" 
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => handleToggleFavorite(app.id)}
                    color={app.favorite ? 'secondary' : 'default'}
                  >
                    <FavoriteIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setSelectedApp(app)}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {currentViewMode === 'compact' && (
          <Box sx={{ 
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: 2,
            p: 2
          }}>
            {filteredApps.map(app => (
              <Box
                key={app.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                    transform: 'scale(1.05)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  ...(longPressApp?.id === app.id && {
                    backgroundColor: theme.palette.action.selected,
                    transform: 'scale(0.9)',
                    boxShadow: theme.shadows[8]
                  })
                }}
                onClick={() => handleLaunchApp(app.id)}
                onMouseDown={() => handleLongPressStart(app)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(app)}
                onTouchEnd={handleLongPressEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedApp(app);
                }}
              >
                {/* Checkbox per selezione multipla */}
                {selectionMode && (
                  <Checkbox
                    checked={selectedApps.has(app.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectApp(app.id);
                    }}
                    sx={{ 
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      zIndex: 2,
                      '&.Mui-checked': {
                        color: theme.palette.primary.main
                      }
                    }}
                  />
                )}
                
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background: 'transparent',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    position: 'relative'
                  }}
                >
                  {getAppIcon(app)}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    color: app.favorite ? theme.palette.secondary.main : 'text.primary',
                    fontWeight: app.favorite ? 'bold' : 'normal'
                  }}
                >
                  {app.name}
                </Typography>
                {app.favorite && (
                  <FavoriteIcon 
                    sx={{ 
                      fontSize: 16, 
                      color: theme.palette.secondary.main,
                      position: 'absolute',
                      top: 4,
                      right: 4
                    }} 
                  />
                )}
                {longPressApp?.id === app.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}
                  >
                    <EditIcon sx={{ fontSize: 24, color: 'white' }} />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            color: 'text.secondary'
          }}>
            <AppsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              Nessuna applicazione trovata
            </Typography>
            <Typography variant="body2">
              {searchQuery ? 'Prova a modificare i criteri di ricerca' : 'Aggiungi la tua prima applicazione'}
            </Typography>
          </Box>
        )}
        </Box>
        )}
      </Box> {/* Chiusura del main content */}

      {/* SyncManagerMaterial */}
      <SyncManagerMaterial
        open={syncManagerOpen}
        onClose={() => setSyncManagerOpen(false)}
        onSyncComplete={handleSyncComplete}
      />

      {/* AppImporterMaterial come modale di importazione */}
      <AppImporterMaterial
        open={importerOpen}
        onClose={() => setImporterOpen(false)}
        onImport={handleAddApp}
      />



      {/* SettingsMaterial */}
      <SettingsMaterial
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onExport={() => {}}
        onImport={() => {}}
        onReset={() => {}}
        defaultOpenMode={settings.defaultOpenMode || 'modal'}
        onDefaultOpenModeChange={mode => {
          setSettings({ ...settings, defaultOpenMode: mode });
          StorageService.setAllSettings({ ...settings, defaultOpenMode: mode });
        }}
      />

      {/* Modale per modificare app */}
      {selectedApp && (
        <Dialog
          open={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Modifica App: {selectedApp.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="ID"
                value={selectedApp.id}
                disabled
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Nome"
                value={selectedApp.name}
                onChange={(e) => setSelectedApp({...selectedApp, name: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Descrizione"
                value={selectedApp.description}
                onChange={(e) => setSelectedApp({...selectedApp, description: e.target.value})}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                fullWidth
                label=""
                value={selectedApp.category || ''}
                onChange={(e) => setSelectedApp({...selectedApp, category: e.target.value})}
                sx={{ mb: 2 }}
                placeholder="Categoria"
                SelectProps={{ native: true }}
              >
                <option value="" disabled>
                  Categoria
                </option>
                <option value="Produttività">Produttività</option>
                <option value="Intrattenimento">Intrattenimento</option>
                <option value="Sviluppo">Sviluppo</option>
                <option value="Social">Social</option>
                <option value="Utility">Utility</option>
                <option value="Altro">Altro</option>
              </TextField>
              <TextField
                fullWidth
                label="URL"
                value={selectedApp.url}
                onChange={(e) => setSelectedApp({...selectedApp, url: e.target.value})}
                sx={{ mb: 2 }}
              />
              
              {/* Tag modificabili */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Tag
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                  {(selectedApp.tags || []).map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => {
                        const newTags = selectedApp.tags.filter((_, i) => i !== index);
                        setSelectedApp({ ...selectedApp, tags: newTags });
                      }}
                      size="small"
                    />
                  ))}
                </Box>
                <TextField
                  label="Aggiungi tag"
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newTag = e.target.value.trim();
                      const newTags = [...(selectedApp.tags || []), newTag];
                      setSelectedApp({ ...selectedApp, tags: newTags });
                      e.target.value = '';
                    }
                  }}
                  fullWidth
                  variant="outlined"
                />
              </Box>
              {/* Cambio icona */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Icona</Typography>
                
                {/* Mostra icona corrente */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 2, 
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    bgcolor: 'background.paper',
                    overflow: 'hidden'
                  }}>
                    {selectedApp.icon && (selectedApp.icon.startsWith('data:') || selectedApp.icon.startsWith('http')) ? (
                      <img 
                        src={selectedApp.icon} 
                        alt="Icona app" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                        onError={(e) => {
                          // Se l'immagine non carica, mostra emoji di fallback
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Box sx={{ 
                      display: selectedApp.icon && (selectedApp.icon.startsWith('data:') || selectedApp.icon.startsWith('http')) ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      {selectedApp.icon || '📱'}
                    </Box>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIconSelectorOpen(true)}
                  >
                    Cambia Icona
                  </Button>
                </Box>
              </Box>
              {/* Modalità apertura */}
              <TextField
                select
                fullWidth
                label="Modalità di apertura"
                value={selectedApp.openMode || settings.defaultOpenMode || 'modal'}
                onChange={e => setSelectedApp({ ...selectedApp, openMode: e.target.value })}
                sx={{ mb: 2 }}
                SelectProps={{ native: true }}
              >
                <option value="modal">Modale (in-app)</option>
                <option value="window">Nuova finestra/tab</option>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              color="error"
              onClick={() => {
                setAppToDelete(selectedApp);
                setDeleteConfirmOpen(true);
              }}
            >
              Elimina
            </Button>
            
            <Box sx={{ flex: '1 1 auto' }} />
            
            <Button onClick={() => setSelectedApp(null)}>
              Annulla
            </Button>
            <Button 
              onClick={async () => {
                try {
                  await StorageService.updateApp(selectedApp.id, selectedApp);
                  await loadApps(); // Ricarica le app
                  setSelectedApp(null);
                  showToast('App aggiornata con successo', 'success');
                } catch (error) {
                  console.error('Errore aggiornamento app:', error);
                  showToast('Errore durante l\'aggiornamento', 'error');
                }
              }}
              variant="contained"
            >
              Salva
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Modale per avvio app HTML */}
      {launchingApp && (
        <Dialog
          open={launchModalOpen}
          onClose={() => {
            setLaunchModalOpen(false);
            setLaunchingApp(null);
          }}
          fullScreen
          sx={{
            '& .MuiDialog-paper': {
              margin: 0,
              borderRadius: 0
            }
          }}
        >
          <DialogTitle>
            {launchingApp.name}
            <IconButton
              aria-label="close"
              onClick={() => {
                setLaunchModalOpen(false);
                setLaunchingApp(null);
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'grey.500',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <iframe
              srcDoc={launchingApp.content}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title={launchingApp.name}
              onLoad={(e) => {
                // Configura l'intercettazione delle richieste di file locali
                if (launchingApp.files && launchingApp.files.length > 0) {
                  const iframe = e.target;
                  try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    
                    // Intercetta le richieste di file
                    const originalFetch = iframe.contentWindow.fetch;
                    iframe.contentWindow.fetch = async (url, options) => {
                      // Gestisci sia percorsi relativi che app://
                      const fileName = url.startsWith('app://') ? url.replace('app://', '') : url;
                      const file = launchingApp.files.find(f => f.filename.endsWith(fileName));
                      
                      if (file) {
                        console.log(`📄 Servendo file locale in iframe: ${fileName}`);
                        return new Response(file.content, {
                          headers: {
                            'Content-Type': file.mimeType || 'application/octet-stream',
                            'Access-Control-Allow-Origin': '*'
                          }
                        });
                      }
                      return originalFetch(url, options);
                    };
                    
                    console.log('✅ Intercettazione file locali configurata per iframe');
                  } catch (error) {
                    console.warn('Impossibile configurare intercettazione file per iframe:', error);
                  }
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* EmojiSelector */}
      <EmojiSelector
        open={emojiSelectorOpen}
        onClose={() => setEmojiSelectorOpen(false)}
        onSelect={(emoji) => {
          setSelectedApp({ ...selectedApp, icon: emoji });
          setEmojiSelectorOpen(false);
        }}
        currentEmoji={selectedApp?.icon}
        category={selectedApp?.category}
      />

      {/* IconSelector */}
      <Dialog
        open={iconSelectorOpen}
        onClose={() => {
          setIconSelectorOpen(false);
          setFaviconUrl(''); // Pulisci lo state quando chiudi
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cambia Icona: {selectedApp?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Mostra icona corrente */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Icona Attuale
              </Typography>
              <Box sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: 2, 
                border: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                mx: 'auto'
              }}>
                {selectedApp?.icon && (selectedApp.icon.startsWith('data:') || selectedApp.icon.startsWith('http')) ? (
                  <img 
                    src={selectedApp.icon} 
                    alt="Icona app" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <Box sx={{ 
                  display: selectedApp?.icon && (selectedApp.icon.startsWith('data:') || selectedApp.icon.startsWith('http')) ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                }}>
                  {selectedApp?.icon || '📱'}
                </Box>
              </Box>
            </Box>

            {/* Opzione 1: Carica favicon da URL */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Carica Favicon da URL
              </Typography>
              <Box sx={{ 
                display: 'flex',
                gap: 1,
                alignItems: 'center'
              }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="https://esempio.com/favicon.ico"
                  value={faviconUrl || ''}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={async () => {
                    if (!faviconUrl) {
                      showToast('Inserisci un URL valido', 'error');
                      return;
                    }
                    try {
                      // Prova a caricare la favicon
                      const iconUrl = faviconUrl.endsWith('/favicon.ico') 
                        ? faviconUrl 
                        : `${faviconUrl.replace(/\/$/, '')}/favicon.ico`;
                      
                      setSelectedApp({ ...selectedApp, icon: iconUrl });
                      showToast('Favicon caricata con successo', 'success');
                      setFaviconUrl('');
                    } catch (error) {
                      showToast('Errore nel caricamento della favicon', 'error');
                    }
                  }}
                >
                  Carica
                </Button>
              </Box>
            </Box>

            {/* Opzione 2: Carica file immagine */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Carica File Immagine
              </Typography>
              <Box sx={{ 
                position: 'relative',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}>
                <input
                  type="file"
                  accept="image/*,image/svg+xml"
                  style={{ 
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        showToast('File troppo grande. Dimensione massima: 2MB', 'error');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setSelectedApp({ ...selectedApp, icon: ev.target.result });
                        showToast('Immagine caricata con successo', 'success');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 1,
                  pointerEvents: 'none'
                }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 1,
                    backgroundColor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                    </svg>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Clicca per selezionare un'immagine
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    PNG, JPG, SVG fino a 2MB
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Opzione 2: URL immagine */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                URL Immagine
              </Typography>
              <TextField
                fullWidth
                placeholder="https://esempio.com/icona.png"
                size="small"
                onChange={(e) => {
                  const url = e.target.value.trim();
                  if (url && (url.startsWith('http') || url.startsWith('data:'))) {
                    setSelectedApp({ ...selectedApp, icon: url });
                    showToast('URL icona impostato', 'success');
                  }
                }}
                helperText="Inserisci l'URL di un'immagine o favicon"
              />
            </Box>

            {/* Opzione 3: Seleziona emoji */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Seleziona Emoji
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setIconSelectorOpen(false);
                  setEmojiSelectorOpen(true);
                }}
                startIcon={<span style={{ fontSize: '1.2rem' }}>😊</span>}
              >
                Scegli Emoji
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIconSelectorOpen(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal informazioni app */}
      <AppInfoModal
        open={appInfoModalOpen}
        onClose={() => {
          setAppInfoModalOpen(false);
          setAppInfoData(null);
        }}
        app={appInfoData}
      />

      {/* Dialog conferma cancellazione */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" />
          Elimina App
        </DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare "{appToDelete?.name}"? Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Annulla
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog conferma azione bulk */}
      <Dialog
        open={bulkActionDialogOpen}
        onClose={handleCancelBulkAction}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" />
          Azione Bulk
        </DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eseguire questa azione su {selectedApps.size} app selezionate?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBulkAction} color="inherit">
            Annulla
          </Button>
          <Button onClick={handleConfirmBulkAction} color="error" variant="contained">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per selezione categoria */}
      <Dialog
        open={categoryDialogOpen}
        onClose={handleCancelCategoryChange}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" />
          Seleziona Categoria
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Categoria"
            value={selectedApp?.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            sx={{ mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="" disabled>
              Seleziona una categoria
            </option>
            <option value="Produttività">Produttività</option>
            <option value="Intrattenimento">Intrattenimento</option>
            <option value="Sviluppo">Sviluppo</option>
            <option value="Social">Social</option>
            <option value="Utility">Utility</option>
            <option value="Altro">Altro</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCategoryChange} color="inherit">
            Annulla
          </Button>
          <Button onClick={handleConfirmBulkAction} color="error" variant="contained">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

/**
 * Inizializza l'applicazione con Material UI
 */
function initializeAIdeasWithMaterialUI() {
  console.log('🎯 Inizializzazione Material UI iniziata...');
  
  // Controlla se è già stato inizializzato
  if (window.aideasMaterialUIRoot) {
    console.log('⚠️ Material UI root già esistente, skip');
    return;
  }
  
  const appContainer = document.getElementById('app');
        console.log('📦 Container app trovato:', !!appContainer);
      
      if (appContainer) {
        // Rimuovi display: none dal container
        appContainer.style.display = '';
        console.log('🔧 Display none rimosso dal container');
        
            // Svuota il container per permettere a React di renderizzare
    appContainer.innerHTML = '';
    // Rimuovi aria-hidden per evitare problemi di accessibilità
    appContainer.removeAttribute('aria-hidden');
    console.log('🧹 Container svuotato per React');
        
    // Posiziona i toast in basso a sinistra per Material UI
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      toastContainer.classList.add('material-ui-toast-bottom-left');
    }

    try {
      console.log('🌳 Creazione React root...');
      // Usa createRoot per React 18+
      const root = createRoot(appContainer);
      
      // Salva il root per evitare duplicazioni
      window.aideasMaterialUIRoot = root;
      
      console.log('🎨 Rendering componente Material UI...');
      

      
      root.render(
        <ThemeProvider>
          <AIdeasApp />
        </ThemeProvider>
      );
      
      // Debug finale
      setTimeout(() => {
        console.log('✅ Material UI inizializzato correttamente');
      }, 100);
      
      console.log('✅ Material UI renderizzato con successo');
    } catch (error) {
      console.error('❌ Errore durante il rendering Material UI:', error);
      throw error;
    }
  } else {
    console.error('Container #app non trovato');
    throw new Error('Container #app non trovato');
  }
}

// Esporta per uso esterno (sia ES6 che window)
export { initializeAIdeasWithMaterialUI };
window.initializeAIdeasWithMaterialUI = initializeAIdeasWithMaterialUI; 