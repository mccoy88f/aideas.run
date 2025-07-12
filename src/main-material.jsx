/**
 * AIdeas - Main Entry Point con Material UI
 * Punto di ingresso principale dell'applicazione con Material Design
 */

import React from 'react';
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
  useMediaQuery
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
  List as ListIcon,
    ViewList as ViewListIcon,
  OpenInNew as OpenInNewIcon,
  InstallMobile as InstallMobileIcon
} from '@mui/icons-material';

import StorageService from './services/StorageService.js';
import { showToast, hideToast } from './utils/helpers.js';
import { DEBUG, ErrorTracker } from './utils/debug.js';
import AppCardMaterial from './components/AppCardMaterial.jsx';
import AppImporterMaterial from './components/AppImporterMaterial.jsx';
import NavigationMaterial from './components/NavigationMaterial.jsx';
import SettingsMaterial from './components/SettingsMaterial.jsx';
import SyncManagerMaterial from './components/SyncManagerMaterial.jsx';
import AppInfoModal from './components/AppInfoModal.jsx';
import PWAGeneratorService from './services/PWAGeneratorService.js';

import EmojiSelector from './components/EmojiSelector.jsx';
import GoogleDriveService from './services/GoogleDriveService.js';
import GitHubService from './services/GitHubService.js';
import AppRouteService from './services/AppRouteService.js';

/**
 * Componente principale dell'applicazione AIdeas con Material UI
 * Gestisce il layout e la navigazione dell'app
 */
function AIdeasApp() {
  const { theme, mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [apps, setApps] = React.useState([]);
  const [filteredApps, setFilteredApps] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentView, setCurrentView] = React.useState('all');
  const [currentSort, setCurrentSort] = React.useState('lastUsed');
  const [currentViewMode, setCurrentViewMode] = React.useState('grid');
  const [loading, setLoading] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [addAppDialogOpen, setAddAppDialogOpen] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState(null);
  const [importerOpen, setImporterOpen] = React.useState(false);
  const [settings, setSettings] = React.useState({});
  const [launchModalOpen, setLaunchModalOpen] = React.useState(false);
  const [launchingApp, setLaunchingApp] = React.useState(null);
  const [longPressTimer, setLongPressTimer] = React.useState(null);
  const [longPressApp, setLongPressApp] = React.useState(null);
  const [syncManagerOpen, setSyncManagerOpen] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [emojiSelectorOpen, setEmojiSelectorOpen] = React.useState(false);
  const [iconSelectorOpen, setIconSelectorOpen] = React.useState(false);
  const [faviconUrl, setFaviconUrl] = React.useState('');
  const [appInfoModalOpen, setAppInfoModalOpen] = React.useState(false);
  const [appInfoData, setAppInfoData] = React.useState(null);


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

  const initializeApp = async () => {
    try {
      console.log('🚀 Inizializzazione AIdeas con Material UI...');
      
      // Inizializza debug
      console.log('🔧 Inizializzazione ErrorTracker...');
      ErrorTracker.init();
      
      // Inizializza servizio routing app
      console.log('🛣️ Inizializzazione AppRouteService...');
      try {
        const appRouteService = new AppRouteService();
        // Inizializza in modo asincrono per evitare errori
        setTimeout(() => {
          appRouteService.initialize().catch(error => {
            console.error('Errore inizializzazione AppRouteService:', error);
          });
        }, 100);
      } catch (error) {
        console.error('Errore creazione AppRouteService:', error);
      }

      // Gestisci generazione automatica PWA per app installate
      window.addEventListener('app-installed', async (event) => {
        const { appId, app } = event.detail;
        try {
          // Usa l'istanza singleton di PWAGeneratorService
          const pwaGenerator = PWAGeneratorService.instance || new PWAGeneratorService();
          await pwaGenerator.initialize(); // Assicurati che il servizio sia inizializzato
          await pwaGenerator.generatePWAForApp(appId, app);
        } catch (error) {
          console.error('Errore generazione PWA automatica:', error);
        }
      });
      
      // Carica apps
      console.log('📱 Caricamento apps...');
      await loadApps();
      
      // Carica impostazioni
      console.log('⚙️ Caricamento impostazioni...');
      await loadUserSettings();
      await loadUserInfo();
      
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
      
      // Se non ci sono app, importa quelle di default
      if (appsData.length === 0) {
        console.log('📱 Database vuoto, importazione app di default...');
        try {
          // Importa le app di default dal file di configurazione
          const defaultApps = [
            {
              name: 'Google',
              description: 'Motore di ricerca Google',
              url: 'https://www.google.com',
              icon: 'https://www.google.com/favicon.ico',
              category: 'Search',
              type: 'url',
              favorite: true,
              tags: ['search', 'web']
            },
            {
              name: 'GitHub',
              description: 'Piattaforma di sviluppo software',
              url: 'https://github.com',
              icon: 'https://github.com/favicon.ico',
              category: 'Development',
              type: 'url',
              favorite: true,
              tags: ['development', 'code', 'git']
            },
            {
              name: 'Stack Overflow',
              description: 'Community di programmatori',
              url: 'https://stackoverflow.com',
              icon: 'https://stackoverflow.com/favicon.ico',
              category: 'Development',
              type: 'url',
              favorite: false,
              tags: ['development', 'qa', 'help']
            }
          ];
          
          for (const app of defaultApps) {
            await StorageService.installApp(app);
          }
          
          console.log('📱 App di default importate');
          const updatedApps = await StorageService.getAllApps();
          setApps(updatedApps);
          setFilteredApps(updatedApps);
        } catch (importError) {
          console.error('Errore importazione app di default:', importError);
        }
      } else {
        setApps(appsData);
        setFilteredApps(appsData);
      }
      
      console.log('📱 State apps aggiornato');
    } catch (error) {
      console.error('Errore caricamento apps:', error);
      showToast('Errore nel caricamento delle applicazioni', 'error');
    }
  };

  const loadUserSettings = async () => {
    try {
      const settingsData = await StorageService.getAllSettings();
      setSettings(settingsData);
      console.log('⚙️ Impostazioni caricate:', settingsData);
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      // Controlla se la sincronizzazione è abilitata
      const syncEnabled = await StorageService.getSetting('syncEnabled', false);
      const syncProvider = await StorageService.getSetting('syncProvider', 'github');
      
      if (syncEnabled) {
        if (syncProvider === 'googledrive') {
          const googleService = new GoogleDriveService();
          googleService.configure(import.meta.env.VITE_GOOGLE_CLIENT_ID, import.meta.env.VITE_GOOGLE_CLIENT_SECRET);
          
          const authenticated = await googleService.isAuthenticated();
          if (authenticated) {
            const user = await googleService.getUserInfo();
            setUserInfo(user);
            setIsAuthenticated(true);
            console.log('👤 Utente Google Drive caricato:', user);
          }
        } else if (syncProvider === 'github') {
          const githubService = new GitHubService();
          const authenticated = await githubService.isAuthenticated();
          if (authenticated) {
            const user = await githubService.getUserInfo();
            setUserInfo(user);
            setIsAuthenticated(true);
            console.log('👤 Utente GitHub caricato:', user);
          }
        }
      }
    } catch (error) {
      console.error('Errore caricamento info utente:', error);
    }
  };

  const filterApps = () => {
    let filtered = [...apps];

    // Filtra per categoria
    if (currentView !== 'all') {
      filtered = filtered.filter(app => app.category === currentView);
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

    // Ordina
    filtered.sort((a, b) => {
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
        } else {
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
      const app = apps.find(a => a.id === appId);
      if (!app || !app.files || app.files.length === 0) return;

      console.log(`📁 Configurando servizio file per app ${appId}:`, app.files.length, 'file');

      // Crea un handler per le richieste di file locali
      const fileHandler = (request) => {
        const url = new URL(request.url);
        if (url.protocol === 'app:') {
          const fileName = url.pathname.substring(1); // Rimuovi lo slash iniziale
          const file = app.files.find(f => f.filename.endsWith(fileName));
          
          if (file) {
            console.log(`📄 Servendo file locale: ${fileName}`);
            return new Response(file.content, {
              headers: {
                'Content-Type': file.mimeType || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }
        return null;
      };

      // Registra l'handler per questa sessione
      window.aideasFileHandler = fileHandler;
      
    } catch (error) {
      console.error('Errore configurazione servizio file:', error);
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

  const handleOpenAsPWA = async (appId) => {
    try {
      // Usa l'istanza singleton di AppRouteService
      const appRouteService = AppRouteService.instance || new AppRouteService();
      await appRouteService.openAppAsPWA(appId);
      showToast('App aperta come PWA standalone', 'success');
    } catch (error) {
      console.error('Errore apertura PWA:', error);
      showToast('Errore nell\'apertura dell\'app come PWA', 'error');
    }
  };

  const handleInstallAsPWA = async (appId) => {
    try {
      // Usa l'istanza singleton di AppRouteService
      const appRouteService = AppRouteService.instance || new AppRouteService();
      await appRouteService.installAppAsPWA(appId);
      showToast('App installata come PWA sul dispositivo', 'success');
    } catch (error) {
      console.error('Errore installazione PWA:', error);
      showToast('Errore nell\'installazione dell\'app come PWA', 'error');
    }
  };

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
        
        // Prepara i dati dell'app
        processedAppData = {
          ...appData,
          ...metadata,
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
      if (app.icon.length === 2 && app.icon.charCodeAt(0) > 255) {
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
              objectFit: 'cover',
              borderRadius: '50%'
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
      metadata.type = 'html';
      
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
          
          {/* Pulsante "Apri come PWA" - solo per app non-URL */}
          {app.type !== 'url' && (
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={() => handleOpenAsPWA(app.id)}
              size="small"
              title="Apri come PWA standalone"
            >
              PWA
            </Button>
          )}
          
          {/* Pulsante "Installa come PWA" - solo per app non-URL */}
          {app.type !== 'url' && (
            <Button
              variant="outlined"
              startIcon={<InstallMobileIcon />}
              onClick={() => handleInstallAsPWA(app.id)}
              size="small"
              title="Installa come PWA sul dispositivo"
            >
              Installa
            </Button>
          )}
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
    setCurrentView(view);
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
      const googleService = new GoogleDriveService();
      googleService.configure(import.meta.env.VITE_GOOGLE_CLIENT_ID, import.meta.env.VITE_GOOGLE_CLIENT_SECRET);
      
      const result = await googleService.handleAuthCallback(code, state);
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
      console.log('🔍 Richiesta informazioni app:', app.name);
      
      // Carica i file dell'app dal database se è di tipo ZIP
      let appWithFiles = { ...app };
      
      if (app.type === 'zip') {
        const files = await StorageService.getAppFiles(app.id);
        appWithFiles.files = files;
        console.log(`📁 Caricati ${files.length} file per app ${app.name}`);
      }
      
      setAppInfoData(appWithFiles);
      setAppInfoModalOpen(true);
      
    } catch (error) {
      console.error('Errore caricamento informazioni app:', error);
      showToast('Errore durante il caricamento delle informazioni', 'error');
    }
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
        onSyncManagerOpen={() => setSyncManagerOpen(true)}
        onThemeToggle={handleThemeToggle}
        currentView={currentView}
        onViewChange={handleViewChange}
        favoriteCount={apps.filter(a => a.favorite).length}
        totalApps={apps.length}
        theme={theme}
        mode={mode}
        bottomBar={settings.bottomBar || false}
        userInfo={userInfo}
        isAuthenticated={isAuthenticated}
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
        {/* Container centrale con padding */}
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
            <Box sx={{ pr: 2, pl: 1, display: 'flex', alignItems: 'center' }}>
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

          </Box>
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
                  onEdit={setSelectedApp}
                  onDelete={handleDeleteApp}
                  onShowMenu={() => {}}
                  onShowInfo={handleShowAppInfo}
                  onOpenPWA={handleOpenAsPWA}
                  onInstallPWA={handleInstallAsPWA}
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
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2,
                    background: app.icon && !app.icon.startsWith('http') && !app.icon.startsWith('data:') ? 'transparent' : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    cursor: 'pointer', // Aggiungi cursore pointer per indicare che è cliccabile
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                  onClick={() => handleLaunchApp(app.id)} // L'icona avvia sempre l'app
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
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background: app.icon && !app.icon.startsWith('http') && !app.icon.startsWith('data:') ? 'transparent' : (app.favorite 
                      ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`),
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    border: app.favorite ? `2px solid ${theme.palette.secondary.main}` : 'none',
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
        </Box> {/* Chiusura del container centrale */}
      </Box> {/* Chiusura del main content */}

      {/* SyncManagerMaterial */}
      <SyncManagerMaterial
        open={syncManagerOpen}
        onClose={() => setSyncManagerOpen(false)}
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
              onClick={async () => {
                const confirmed = window.confirm(`Sei sicuro di voler eliminare l'app "${selectedApp.name}"? Questa azione non può essere annullata.`);
                if (confirmed) {
                  try {
                    await StorageService.deleteApp(selectedApp.id);
                    await loadApps(); // Ricarica le app
                    setSelectedApp(null);
                    showToast('App eliminata con successo', 'success');
                  } catch (error) {
                    console.error('Errore eliminazione app:', error);
                    showToast('Errore durante l\'eliminazione', 'error');
                  }
                }
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