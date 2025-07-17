import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  AppBar,
  Toolbar,
  Button,
  useTheme,
  useMediaQuery,
  Fab,
  Pagination,
  Skeleton,
  Link,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ViewModule as ViewModuleIcon,
  Store as StoreIcon,
  GitHub as GitHubIcon,
  Upload as UploadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { storeService } from '../services/StoreService.js';
import StoreAppCard from './StoreAppCard.jsx';
import AppInfoModal from './AppInfoModal.jsx';
import { showToast } from '../utils/helpers.js';
import { DEBUG } from '../utils/debug.js';

/**
 * Componente principale della pagina Store
 */
const StorePage = ({ onNavigateBack, onAppInstalled, installedApps = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State per le app
  const [storeApps, setStoreApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  
  // State per UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [installingApp, setInstallingApp] = useState(null);
  const [showAppInfo, setShowAppInfo] = useState(null);
  
  // State per filtri e paginazione
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [appsPerPage] = useState(12);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Carica dati all'inizializzazione
  useEffect(() => {
    loadInitialData();
    startStorePolling();
    
    return () => {
      stopStorePolling();
    };
  }, []);

  // Filtra le app quando cambiano i parametri
  useEffect(() => {
    filterApps();
  }, [storeApps, installedApps, searchQuery, selectedCategory, sortBy]);

  // Ascolta eventi di aggiornamento store
  useEffect(() => {
    const handleStoreUpdate = () => {
      DEBUG.log('🔄 Store aggiornato, ricarico app...');
      loadStoreApps();
    };

    window.addEventListener('store-updated', handleStoreUpdate);
    
    return () => {
      window.removeEventListener('store-updated', handleStoreUpdate);
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await loadStoreApps();
      
      // Controlla se c'è un parametro di ricerca nell'URL
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
      
    } catch (error) {
      DEBUG.error('❌ Errore caricamento iniziale store:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreApps = async () => {
    try {
      DEBUG.log('🛍️ Caricamento app dallo store...');
      const apps = await storeService.getAvailableApps();
      setStoreApps(apps);
      
      // Estrai categorie uniche
      const uniqueCategories = [...new Set(apps.map(app => app.category))];
      setCategories(uniqueCategories);
      
      setLastUpdateTime(new Date());
      DEBUG.success(`✅ Caricate ${apps.length} app dallo store`);
    } catch (error) {
      DEBUG.error('❌ Errore caricamento store:', error);
      setError(error.message);
    }
  };

  const startStorePolling = () => {
    storeService.startPolling();
  };

  const stopStorePolling = () => {
    storeService.stopPolling();
  };

  const isAppInstalled = (storeApp) => {
    return installedApps.some(installedApp => 
      installedApp.storeId === storeApp.storeId || 
      (installedApp.githubUrl && storeApp.githubUrl && installedApp.githubUrl === storeApp.githubUrl)
    );
  };

  const filterApps = () => {
    let filtered = [...storeApps];

    // Filtra per ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.tags.some(tag => tag.toLowerCase().includes(query)) ||
        app.author.toLowerCase().includes(query)
      );
    }

    // Filtra per categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    // Ordina le app
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'recent':
          const dateA = new Date(a.lastModified || 0);
          const dateB = new Date(b.lastModified || 0);
          return dateB - dateA;
        default:
          return 0;
      }
    });

    setFilteredApps(filtered);
    setCurrentPage(1); // Reset alla prima pagina quando filtri cambiano
  };

  const handleInstallApp = async (app) => {
    setInstallingApp(app.id);
    
    try {
      DEBUG.log(`📦 Installazione app ${app.name}...`);
      const appId = await storeService.installAppFromStore(app.storeId);
      
      showToast(`App ${app.name} installata con successo!`, 'success');
      
      // Notifica al componente padre
      if (onAppInstalled) {
        onAppInstalled(appId);
      }
      
    } catch (error) {
      DEBUG.error('❌ Errore installazione:', error);
      showToast(`Errore installazione: ${error.message}`, 'error');
    } finally {
      setInstallingApp(null);
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Scroll in alto quando si cambia pagina
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShowAppInfo = (app) => {
    setShowAppInfo(app);
  };

  const handleCloseAppInfo = () => {
    setShowAppInfo(null);
  };

  // Calcola le app da mostrare per la pagina corrente
  const indexOfLastApp = currentPage * appsPerPage;
  const indexOfFirstApp = indexOfLastApp - appsPerPage;
  const currentApps = filteredApps.slice(indexOfFirstApp, indexOfLastApp);
  const totalPages = Math.ceil(filteredApps.length / appsPerPage);

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '1200px', 
      mx: 'auto', // Centra il contenuto come nel resto dell'app
      p: { xs: 2, sm: 4 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header con pulsante di ritorno - Stile simile alla search bar principale */}
      <Box sx={{
        width: '100%',
        mb: 3,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton
          onClick={onNavigateBack}
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
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
            🛍️ AIdeas Store
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scopri app create dalla community AIdeas
          </Typography>
        </Box>
        
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Errore */}
      {error && (
        <Alert severity="error" sx={{ mb: 4, width: '100%' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtri e controlli - Stile uniformato con search bar principale */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        width: '100%'
      }}>
        {/* Barra di ricerca con stile glossy uniforme */}
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
            placeholder="Cerca app, autore, tag..."
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
          {searchQuery && (
            <Box sx={{ pr: 2, pl: 1 }}>
              <IconButton onClick={handleClearSearch} size="small">
                <ClearIcon />
              </IconButton>
            </Box>
          )}
        </Box>
        
        {/* Controlli con stile uniformato */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: 600
        }}>
          {/* Categoria con stile glossy */}
          <Box sx={{
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.3)',
            minWidth: 200,
            flex: 1
          }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'text.secondary' }}>Categoria</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Categoria"
                sx={{
                  '& fieldset': { border: 'none' },
                  '& .MuiSelect-select': {
                    color: 'text.primary'
                  }
                }}
              >
                <MenuItem value="all">Tutte le categorie</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Ordinamento con stile glossy */}
          <Box sx={{
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.3)',
            minWidth: 200,
            flex: 1
          }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'text.secondary' }}>Ordina per</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Ordina per"
                sx={{
                  '& fieldset': { border: 'none' },
                  '& .MuiSelect-select': {
                    color: 'text.primary'
                  }
                }}
              >
                <MenuItem value="name">Nome</MenuItem>
                <MenuItem value="category">Categoria</MenuItem>
                <MenuItem value="author">Autore</MenuItem>
                <MenuItem value="recent">Più recenti</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Statistiche */}
      <Box sx={{ mb: 4, width: '100%' }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip
            icon={<StoreIcon />}
            label={`${filteredApps.length} app trovate`}
            color="primary"
            variant="outlined"
          />
          {lastUpdateTime && (
            <Chip
              label={`Aggiornato: ${lastUpdateTime.toLocaleTimeString('it-IT')}`}
              color="default"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Griglia delle app */}
      {loading ? (
        <Box sx={{ width: '100%' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(300px, 1fr))',
                sm: 'repeat(auto-fill, minmax(320px, 1fr))',
                md: 'repeat(auto-fill, minmax(320px, 1fr))',
                lg: 'repeat(auto-fill, minmax(320px, 1fr))',
                xl: 'repeat(auto-fill, minmax(320px, 1fr))'
              },
              gap: { xs: 2, sm: 3, md: 3, lg: 3 },
              width: '100%',
              alignContent: 'start'
            }}
          >
            {[...Array(8)].map((_, index) => (
              <Skeleton 
                key={index} 
                variant="rectangular" 
                height={300} 
                sx={{ borderRadius: 2 }} 
              />
            ))}
          </Box>
        </Box>
      ) : currentApps.length > 0 ? (
        <>
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(300px, 1fr))',
                  sm: 'repeat(auto-fill, minmax(320px, 1fr))',
                  md: 'repeat(auto-fill, minmax(320px, 1fr))',
                  lg: 'repeat(auto-fill, minmax(320px, 1fr))',
                  xl: 'repeat(auto-fill, minmax(320px, 1fr))'
                },
                gap: { xs: 2, sm: 3, md: 3, lg: 3 },
                width: '100%',
                alignContent: 'start'
              }}
            >
              {currentApps.map((app) => (
                <Box
                  key={app.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: { xs: 320, sm: 340, md: 360 }
                  }}
                >
                  <StoreAppCard
                    app={app}
                    onInstall={handleInstallApp}
                    onShowInfo={handleShowAppInfo}
                    isInstalled={isAppInstalled(app)}
                    isInstalling={installingApp === app.id}
                    isInstallingApp={installingApp}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Paginazione */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, width: '100%' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
          <StoreIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nessuna app trovata
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Lo store è vuoto o si è verificato un errore durante il caricamento'
            }
          </Typography>
        </Box>
      )}

      {/* FAB per tornare in alto */}
      <Fab
        color="primary"
        size="small"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: currentApps.length > 6 ? 'flex' : 'none'
        }}
      >
        <ArrowBackIcon sx={{ transform: 'rotate(90deg)' }} />
      </Fab>

      {/* Modal informazioni app */}
      {showAppInfo && (
        <AppInfoModal
          open={Boolean(showAppInfo)}
          onClose={handleCloseAppInfo}
          app={showAppInfo}
        />
      )}
    </Box>
  );
};

export default StorePage; 