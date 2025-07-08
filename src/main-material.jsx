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
  ViewList as ViewListIcon
} from '@mui/icons-material';

import StorageService from './services/StorageService.js';
import { showToast, hideToast } from './utils/helpers.js';
import { DEBUG, ErrorTracker } from './utils/debug.js';
import AppCardMaterial from './components/AppCardMaterial.jsx';
import AppImporterMaterial from './components/AppImporterMaterial.jsx';
import NavigationMaterial from './components/NavigationMaterial.jsx';
import SettingsMaterial from './components/SettingsMaterial.jsx';
import SyncManagerMaterial from './components/SyncManagerMaterial.jsx';
import GoogleDriveService from './services/GoogleDriveService.js';
import GitHubService from './services/GitHubService.js';

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
        
        // Lancia l'app
        if (app.type === 'url' && app.url) {
          window.open(app.url, '_blank');
          showToast(`Avviata: ${app.name}`, 'success');
        } else if (app.type === 'html' && app.content) {
          // Avvia app HTML in modale
          setLaunchingApp(app);
          setLaunchModalOpen(true);
        } else {
          showToast('Tipo di app non supportato', 'error');
        }
      }
    } catch (error) {
      console.error('Errore avvio app:', error);
      showToast('Errore nell\'avvio dell\'applicazione', 'error');
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
        <Button
          variant="contained"
          startIcon={<LaunchIcon />}
          onClick={() => handleLaunchApp(app.id)}
          size="small"
        >
          Avvia
        </Button>
        
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
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteApp(app.id)}
          >
            <DeleteIcon />
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
          top: 0,
          zIndex: 10,
          backgroundColor: 'background.default',
          py: 2,
          borderRadius: 2
        }}>
          {/* Barra di ricerca fissa e centrata */}
          <TextField
            sx={{ 
              width: '100%',
              maxWidth: 600,
              minWidth: 300,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              },
              '& .MuiFormControl-root': {
                width: '100%',
                maxWidth: 600,
                minWidth: 300
              }
            }}
            variant="outlined"
            placeholder="Cerca applicazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
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
                  xs: 'repeat(auto-fill, minmax(280px, 1fr))',
                  sm: 'repeat(auto-fill, minmax(320px, 1fr))',
                  md: 'repeat(auto-fill, minmax(320px, 1fr))',
                  lg: 'repeat(auto-fill, minmax(320px, 1fr))',
                  xl: 'repeat(auto-fill, minmax(320px, 1fr))'
                },
                gap: { xs: 2, sm: 3, md: 3, lg: 3 },
                width: '100%'
              }}
            >
            {filteredApps.map(app => (
              <Box
                key={app.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <AppCardMaterial
                  app={app}
                  onLaunch={handleLaunchApp}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={setSelectedApp}
                  onDelete={handleDeleteApp}
                  onShowMenu={() => {}}
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
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                  }}
                >
                  {app.name.charAt(0).toUpperCase()}
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
                    onClick={() => handleLaunchApp(app.id)}
                    color="primary"
                  >
                    <LaunchIcon />
                  </IconButton>
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
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteApp(app.id)}
                  >
                    <DeleteIcon />
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
                    background: app.icon ? 'transparent' : (app.favorite 
                      ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`),
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    border: app.favorite ? `2px solid ${theme.palette.secondary.main}` : 'none',
                    position: 'relative'
                  }}
                >
                  {app.icon ? (
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
                  ) : null}
                  {!app.icon && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="Aggiungi app"
        onClick={() => setImporterOpen(true)}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: settings.bottomBar ? 'auto' : 24,
          top: settings.bottomBar ? 24 : 'auto',
          zIndex: theme.zIndex.fab,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            transform: 'scale(1.05)'
          },
          boxShadow: theme.shadows[8]
        }}
      >
        <AddIcon />
      </Fab>

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
                fullWidth
                label="Categoria"
                value={selectedApp.category}
                onChange={(e) => setSelectedApp({...selectedApp, category: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="URL"
                value={selectedApp.url}
                onChange={(e) => setSelectedApp({...selectedApp, url: e.target.value})}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedApp(null)}>
              Annulla
            </Button>
            <Button 
              onClick={async () => {
                try {
                  await StorageService.updateApp(selectedApp.id, selectedApp);
                  await loadApps(); // Ricarica le app
                  setSelectedApp(null);
                } catch (error) {
                  console.error('Errore aggiornamento app:', error);
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
          maxWidth="lg"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              height: '80vh'
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
            />
          </DialogContent>
        </Dialog>
      )}
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