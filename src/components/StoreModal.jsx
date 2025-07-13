import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Store as StoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  GitHub as GitHubIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { storeService } from '../services/StoreService.js';
import { showToast } from '../utils/helpers.js';
import { DEBUG } from '../utils/debug.js';

/**
 * Modal per l'AIdeas Store
 */
const StoreModal = ({ open, onClose, onAppInstalled, installedApps = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [storeApps, setStoreApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [installingApp, setInstallingApp] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  useEffect(() => {
    if (open) {
      loadStoreApps();
      // Avvia polling quando lo store è aperto
      storeService.startPolling();
    } else {
      // Ferma polling quando lo store è chiuso
      storeService.stopPolling();
    }
  }, [open]);

  useEffect(() => {
    filterApps();
  }, [storeApps, searchQuery, selectedCategory]);

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

  const loadStoreApps = async () => {
    setLoading(true);
    setError(null);
    
    try {
      DEBUG.log('🛍️ Caricamento app dallo store...');
      const apps = await storeService.getAvailableApps();
      setStoreApps(apps);
      
      // Estrai categorie uniche
      const uniqueCategories = [...new Set(apps.map(app => app.category))];
      setCategories(uniqueCategories);
      
      DEBUG.success(`✅ Caricate ${apps.length} app dallo store`);
      
      // Aggiorna timestamp ultimo aggiornamento
      setLastUpdateTime(new Date());
    } catch (error) {
      DEBUG.error('❌ Errore caricamento store:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
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

    setFilteredApps(filtered);
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
      
      // Ricarica le app dello store
      await loadStoreApps();
      
    } catch (error) {
      DEBUG.error('❌ Errore installazione:', error);
      showToast(`Errore installazione: ${error.message}`, 'error');
    } finally {
      setInstallingApp(null);
    }
  };

  const handleSubmitApp = () => {
    // Cambia alla tab di sottomissione
    setActiveTab(1);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'utility': <CodeIcon />,
      'game': <StarIcon />,
      'productivity': <CheckCircleIcon />,
      'social': <PersonIcon />,
      'altro': <InfoIcon />
    };
    return icons[category] || <InfoIcon />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'utility': 'primary',
      'game': 'secondary',
      'productivity': 'success',
      'social': 'warning',
      'altro': 'default'
    };
    return colors[category] || 'default';
  };

  // Funzione per rilevare se un'icona è un'emoji
  const isEmoji = (icon) => {
    return icon && (icon.length === 1 || icon.length === 2) && icon.charCodeAt(0) > 255;
  };

  // Funzione per renderizzare l'icona dell'app
  const renderAppIcon = (app) => {
    if (app.icon) {
      // Se è un'emoji (carattere Unicode)
      if (isEmoji(app.icon)) {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.5rem'
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
      
      // Fallback per altre icone
      return (
        <span role="img" aria-label="app icon">
          {app.icon}
        </span>
      );
    }

    // Fallback: iniziali
    return app.name.charAt(0);
  };

  const renderStoreApps = () => (
    <Box>
      {/* Barra di ricerca e filtri */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Cerca app..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />
        
        {/* Filtri categoria */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="Tutte"
            color={selectedCategory === 'all' ? 'primary' : 'default'}
            onClick={() => setSelectedCategory('all')}
            size="small"
          />
          {categories.map(category => (
            <Chip
              key={category}
              label={category}
              color={selectedCategory === category ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(category)}
              size="small"
              icon={getCategoryIcon(category)}
            />
          ))}
        </Box>
      </Box>

      {/* Lista app */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Caricamento app...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : filteredApps.length === 0 ? (
        <Box textAlign="center" py={4}>
          <StoreIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nessuna app trovata
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Lo store è vuoto al momento'
            }
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredApps.map((app) => (
            <Grid item xs={12} sm={6} md={4} key={app.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      width: 48, 
                      height: 48,
                      bgcolor: app.icon && !isEmoji(app.icon) ? 'transparent' : `${getCategoryColor(app.category)}.main`,
                      mr: 2,
                      fontSize: '1.5rem'
                    }}>
                      {renderAppIcon(app)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" noWrap>
                        {app.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        di {app.author}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {app.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    <Chip
                      label={app.category}
                      color={getCategoryColor(app.category)}
                      size="small"
                      icon={getCategoryIcon(app.category)}
                    />
                    {app.tags.slice(0, 2).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {app.tags.length > 2 && (
                      <Chip
                        label={`+${app.tags.length - 2}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      v{app.version}
                    </Typography>
                    {app.githubUrl && (
                      <Tooltip title="Vedi su GitHub">
                        <IconButton
                          size="small"
                          onClick={() => window.open(app.githubUrl, '_blank')}
                        >
                          <GitHubIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>

                <CardActions>
                  {isAppInstalled(app) ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      disabled
                    >
                      Già Installata
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={installingApp === app.id ? <CircularProgress size={16} /> : <DownloadIcon />}
                      onClick={() => handleInstallApp(app)}
                      disabled={installingApp === app.id}
                    >
                      {installingApp === app.id ? 'Installazione...' : 'Installa'}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderSubmitApp = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Per sottomettere un'app allo store, usa il pulsante "Sottometti allo Store" 
          nel modale delle informazioni dell'app.
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom>
        Come funziona la sottomissione
      </Typography>

      <List>
        <ListItem>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <CodeIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Prepara la tua app"
            secondary="Assicurati che la tua app sia funzionante e contenga tutti i file necessari"
          />
        </ListItem>

        <ListItem>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <UploadIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Sottometti allo Store"
            secondary="Usa il pulsante nel modale delle informazioni dell'app per creare una pull request"
          />
        </ListItem>

        <ListItem>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <CheckCircleIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="Revisione e approvazione"
            secondary="La tua app verrà revisionata e, se approvata, aggiunta allo store"
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Requisiti per l'approvazione
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2">App funzionante senza errori</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2">File HTML/CSS/JS inclusi</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2">Manifest aideas.json presente</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2">Nessun contenuto dannoso</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2">Descrizione chiara e completa</Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
              <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StoreIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" component="h2">
                AIdeas Store
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scopri e installa nuove app
                {lastUpdateTime && (
                  <span style={{ marginLeft: 8, fontSize: '0.75rem' }}>
                    • Aggiornato {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
          >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon />
                <span>App Disponibili</span>
                {activeTab === 0 && (
                  <Badge badgeContent={storeApps.length} color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
            } 
          />
                      <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadIcon />
                  <span>Sottometti App</span>
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {activeTab === 0 ? renderStoreApps() : renderSubmitApp()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Chiudi
        </Button>
        {activeTab === 0 && (
          <Button 
            onClick={handleSubmitApp}
            variant="contained"
            startIcon={<UploadIcon />}
          >
            Sottometti App
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default StoreModal; 