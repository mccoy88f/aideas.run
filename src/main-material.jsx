/**
 * AIdeas - Main Entry Point con Material UI
 * Punto di ingresso principale dell'applicazione con Material Design
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './theme/ThemeProvider.jsx';
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
  useTheme,
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
  Close as CloseIcon
} from '@mui/icons-material';

import StorageService from './services/StorageService.js';
import { showToast, hideToast } from './utils/helpers.js';
import { DEBUG, ErrorTracker } from './utils/debug.js';
import AppCardMaterial from './components/AppCardMaterial.jsx';
import AppImporterMaterial from './components/AppImporterMaterial.jsx';
import NavigationMaterial from './components/NavigationMaterial.jsx';
import SettingsMaterial from './components/SettingsMaterial.jsx';

/**
 * Componente principale dell'applicazione AIdeas con Material UI
 * Gestisce il layout e la navigazione dell'app
 */
function AIdeasApp() {
  const theme = useTheme();
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
  const [mode, setMode] = React.useState('light');

  // Inizializzazione
  React.useEffect(() => {
    initializeApp();
  }, []);

  // Filtra apps quando cambia la query di ricerca
  React.useEffect(() => {
    filterApps();
  }, [searchQuery, currentView, apps]);

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
      
      console.log('🎯 Impostazione loading a false...');
      setLoading(false);
      console.log('✅ AIdeas inizializzato con successo');
      
      // Debug: verifica se il componente si re-renderizza
      setTimeout(() => {
        console.log('🔍 Debug: Stato loading dopo 1s:', loading);
        console.log('🔍 Debug: Apps dopo 1s:', apps.length);
      }, 1000);
      
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
              id: 'google',
              name: 'Google',
              url: 'https://www.google.com',
              icon: 'https://www.google.com/favicon.ico',
              category: 'Search',
              favorite: true,
              lastUsed: Date.now()
            },
            {
              id: 'github',
              name: 'GitHub',
              url: 'https://github.com',
              icon: 'https://github.com/favicon.ico',
              category: 'Development',
              favorite: true,
              lastUsed: Date.now()
            },
            {
              id: 'stackoverflow',
              name: 'Stack Overflow',
              url: 'https://stackoverflow.com',
              icon: 'https://stackoverflow.com/favicon.ico',
              category: 'Development',
              favorite: false,
              lastUsed: Date.now()
            }
          ];
          
          for (const app of defaultApps) {
            await StorageService.addApp(app);
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
      console.log('⚙️ Inizio caricamento impostazioni...');
      const settings = await StorageService.getAllSettings();
      console.log('⚙️ Impostazioni caricate:', settings);
      setCurrentViewMode(settings.viewMode || 'grid');
      setCurrentSort(settings.sortBy || 'lastUsed');
      console.log('⚙️ State impostazioni aggiornato');
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);
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
        window.open(app.url, '_blank');
        
        showToast(`Avviata: ${app.name}`, 'success');
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
      const newApp = await StorageService.addApp(appData);
      setApps(prev => [...prev, newApp]);
      setImporterOpen(false);
      showToast('Applicazione aggiunta con successo', 'success');
    } catch (error) {
      console.error('Errore aggiunta app:', error);
      showToast('Errore nell\'aggiunta dell\'applicazione', 'error');
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
    // Qui puoi anche salvare su StorageService
  };

  // Aggiorna tema
  const handleThemeToggle = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Aggiorna view
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  if (loading) {
    console.log('🔄 Rendering loading state...');
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  console.log('🎨 Rendering main interface...');
  console.log('📱 Apps count:', apps.length);
  console.log('🔍 Filtered apps count:', filteredApps.length);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
      <Typography variant="h4" sx={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, color: 'red' }}>
        DEBUG: Material UI Loaded - Apps: {apps.length}
      </Typography>
      
      {/* NavigationMaterial */}
      <NavigationMaterial
        drawerOpen={drawerOpen}
        onDrawerToggle={() => setDrawerOpen((open) => !open)}
        onSettingsOpen={() => setSettingsDialogOpen(true)}
        onThemeToggle={handleThemeToggle}
        currentView={currentView}
        onViewChange={handleViewChange}
        favoriteCount={apps.filter(a => a.favorite).length}
        totalApps={apps.length}
        theme={theme}
        mode={mode}
      />

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 4 }, mt: '64px', ml: { sm: '280px' } }}>
        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Cerca applicazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        {/* Apps Grid con AppCardMaterial */}
        <Grid container spacing={3}>
          {filteredApps.map(app => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={app.id}>
              <AppCardMaterial
                app={app}
                onLaunch={handleLaunchApp}
                onToggleFavorite={handleToggleFavorite}
                onEdit={setSelectedApp}
                onDelete={handleDeleteApp}
                onShowMenu={() => {}}
              />
            </Grid>
          ))}
        </Grid>

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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setImporterOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
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