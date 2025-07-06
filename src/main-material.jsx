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
      console.log('⚙️ Inizio caricamento impostazioni...');
      const settings = await StorageService.getAllSettings();
      console.log('⚙️ Impostazioni caricate:', settings);
      setCurrentViewMode(settings.viewMode || 'grid');
      setCurrentSort(settings.sortBy || 'lastUsed');
      setSettings(settings);
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
      const appId = await StorageService.installApp(appData);
      await loadApps(); // Ricarica tutte le app
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
  };

  // Aggiorna tema
  const handleThemeToggle = () => {
    toggleTheme();
  };

  // Aggiorna view
  const handleViewChange = (view) => {
    setCurrentView(view);
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
        currentView={currentView}
        onViewChange={handleViewChange}
        favoriteCount={apps.filter(a => a.favorite).length}
        totalApps={apps.length}
        theme={theme}
        mode={mode}
      />

      {/* Main Content */}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: { xs: 2, sm: 4 }, 
        mt: '64px', 
        ml: { sm: drawerOpen ? '280px' : 0 },
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Search Bar e Controlli */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            sx={{ flexGrow: 1, minWidth: 200 }}
            variant="outlined"
            placeholder="Cerca applicazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          {/* Controlli vista */}
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              title="Vista compatta"
            >
              <ViewListIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Apps con visualizzazione condizionale */}
        {currentViewMode === 'grid' && (
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
        )}

        {currentViewMode === 'list' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filteredApps.map(app => (
              <Chip
                key={app.id}
                label={app.name}
                onClick={() => handleLaunchApp(app.id)}
                onDelete={() => handleDeleteApp(app.id)}
                color={app.favorite ? 'secondary' : 'default'}
                variant={app.favorite ? 'filled' : 'outlined'}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              />
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