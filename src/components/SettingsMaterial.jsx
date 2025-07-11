import React, { useState, useEffect } from 'react';
import StorageService from '../services/StorageService.js';
import GoogleDriveService from '../services/GoogleDriveService.js';
import { showToast } from '../utils/helpers.js';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  Alert,
  IconButton,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandMoreIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { useSyncStatus } from '../utils/useSyncStatus.js';

/**
 * Componente Settings Material UI con aspetto glossy
 */
const SettingsMaterial = ({
  open,
  onClose,
  settings = {},
  onSettingsChange,
  onExport,
  onImport,
  onReset,
  defaultOpenMode,
  onDefaultOpenModeChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Hook per lo stato di sincronizzazione
  const {
    isEnabled, provider, isInProgress, lastSync, nextSync, error, intervalMinutes, syncHistory,
    setProvider, setIsEnabled, setIntervalMinutes, manualSync
  } = useSyncStatus();

  // Stato per informazioni utente
  const [userInfo, setUserInfo] = useState({
    github: null,
    googledrive: null
  });

  const sections = [
    {
      id: 'general',
      title: 'Generale',
      icon: <SettingsIcon />,
      description: 'Impostazioni generali dell\'applicazione'
    },
    {
      id: 'appearance',
      title: 'Aspetto',
      icon: <PaletteIcon />,
      description: 'Tema, colori e personalizzazione'
    },
    {
      id: 'notifications',
      title: 'Notifiche',
      icon: <NotificationsIcon />,
      description: 'Gestione notifiche e avvisi'
    },
    {
      id: 'backup',
      title: 'Backup/Ripristino',
      icon: <StorageIcon />,
      description: 'Backup e ripristino locale'
    },
    {
      id: 'cloudsync',
      title: 'Cloud Sync',
      icon: <SyncIcon />,
      description: 'Sincronizzazione cloud'
    },
    {
      id: 'security',
      title: 'Sicurezza',
      icon: <SecurityIcon />,
      description: 'Impostazioni di sicurezza e privacy'
    }
  ];

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setHasChanges(false);
    onClose();
  };

  const handleExportData = async () => {
    try {
      const data = {
        settings: localSettings,
        apps: await StorageService.getAllApps(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aideas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Backup esportato con successo', 'success');
    } catch (error) {
      console.error('Errore export dati:', error);
      showToast('Errore durante l\'esportazione', 'error');
    }
  };

  const handleImportData = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // Validazione dati
          if (!data.settings || !data.apps) {
            throw new Error('Formato file non valido');
          }
          
          // Importa impostazioni
          await StorageService.setAllSettings(data.settings);
          
          // Importa app
          for (const app of data.apps) {
            await StorageService.installApp(app);
          }
          
          showToast('Dati importati con successo', 'success');
          
          // Ricarica le impostazioni
          setLocalSettings(data.settings);
          
        } catch (error) {
          console.error('Errore import dati:', error);
          showToast('Errore durante l\'importazione', 'error');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Errore lettura file:', error);
      showToast('Errore durante la lettura del file', 'error');
    }
  };

  const handleResetSettings = async () => {
    try {
      // Reset impostazioni
      await StorageService.setAllSettings({});
      
      // Reset app (opzionale - chiedi conferma)
      const confirmed = window.confirm('Vuoi anche eliminare tutte le app?');
      if (confirmed) {
        await StorageService.clearAllApps();
      }
      
      showToast('Impostazioni ripristinate', 'success');
      setLocalSettings({});
      
    } catch (error) {
      console.error('Errore reset impostazioni:', error);
      showToast('Errore durante il reset', 'error');
    }
  };

  // Carica informazioni utente
  const loadUserInfo = async () => {
    try {
      // Carica info GitHub
      const githubToken = await StorageService.getSetting('githubToken');
      if (githubToken) {
        const githubService = new GitHubService();
        const testResult = await githubService.testConnection();
        if (testResult.success && testResult.user) {
          setUserInfo(prev => ({
            ...prev,
            github: testResult.user
          }));
        }
      }

      // Carica info Google Drive
      const googleService = new GoogleDriveService();
      if (await googleService.isAuthenticated()) {
        const userInfo = await googleService.getUserInfo();
        setUserInfo(prev => ({
          ...prev,
          googledrive: userInfo
        }));
      }
    } catch (error) {
      console.error('Errore caricamento info utente:', error);
    }
  };

  // Carica info utente all'apertura
  useEffect(() => {
    if (open) {
      loadUserInfo();
    }
  }, [open]);

  const handleProviderChange = async (newProvider) => {
    setProvider(newProvider);
    setHasChanges(true); // Marca come modificato
    
    // Se la sincronizzazione è abilitata, gestisci l'autenticazione
    if (isEnabled) {
      try {
        if (newProvider === 'github') {
          // Per GitHub Gist, mostra istruzioni per inserire il codice
          const gistCode = prompt('Inserisci il codice Gist per la sincronizzazione:');
          if (gistCode) {
            // Salva il codice Gist
            await StorageService.setSetting('githubGistCode', gistCode);
            showToast('Codice Gist salvato', 'success');
          }
        } else if (newProvider === 'googledrive') {
          // Per Google Drive, avvia il processo di autenticazione
          try {
            const googleService = new GoogleDriveService();
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            
            if (!clientId) {
              showToast('Client ID Google non configurato. Contatta l\'amministratore.', 'error');
              return;
            }
            
            googleService.configure(clientId);
            await googleService.authenticate();
            showToast('Autenticazione Google avviata. Completa il processo nel browser.', 'info');
          } catch (error) {
            console.error('Errore autenticazione Google:', error);
            showToast('Errore avvio autenticazione Google: ' + error.message, 'error');
          }
        }
      } catch (error) {
        console.error('Errore configurazione provider:', error);
        showToast('Errore durante la configurazione del provider', 'error');
      }
    }
  };



  const renderGeneralSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Impostazioni Generali
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nome utente"
            value={localSettings.username || ''}
            onChange={(e) => handleSettingChange('username', e.target.value)}
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Lingua</InputLabel>
            <Select
              value={localSettings.language || 'it'}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              label="Lingua"
            >
              <MenuItem value="it">Italiano</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.autoSave || false}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              />
            }
            label="Salvataggio automatico"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.startupLaunch || false}
                onChange={(e) => handleSettingChange('startupLaunch', e.target.checked)}
              />
            }
            label="Avvia all'avvio del sistema"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Modalità di apertura predefinita per nuove app
          </Typography>
          <TextField
            select
            fullWidth
            label="Modalità di apertura"
            value={defaultOpenMode || 'modal'}
            onChange={e => onDefaultOpenModeChange(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="modal">Modale (in-app)</option>
            <option value="window">Nuova finestra/tab</option>
            <option value="pwa">PWA (standalone)</option>
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAppearanceSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Personalizzazione Aspetto
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Tema</InputLabel>
            <Select
              value={localSettings.theme || 'system'}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              label="Tema"
            >
              <MenuItem value="light">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightModeIcon />
                  Chiaro
                </Box>
              </MenuItem>
              <MenuItem value="dark">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DarkModeIcon />
                  Scuro
                </Box>
              </MenuItem>
              <MenuItem value="system">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesomeIcon />
                  Sistema
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Modalità visualizzazione</InputLabel>
            <Select
              value={localSettings.viewMode || 'grid'}
              onChange={(e) => handleSettingChange('viewMode', e.target.value)}
              label="Modalità visualizzazione"
            >
              <MenuItem value="grid">Griglia</MenuItem>
              <MenuItem value="list">Lista</MenuItem>
              <MenuItem value="compact">Compatta</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography gutterBottom>
            Dimensione card: {localSettings.cardSize || 1}
          </Typography>
          <Slider
            value={localSettings.cardSize || 1}
            onChange={(e, value) => handleSettingChange('cardSize', value)}
            min={0.5}
            max={2}
            step={0.1}
            marks
            valueLabelDisplay="auto"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enableAnimations !== false}
                onChange={(e) => handleSettingChange('enableAnimations', e.target.checked)}
              />
            }
            label="Animazioni"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.glossy || true}
                onChange={(e) => handleSettingChange('glossy', e.target.checked)}
              />
            }
            label="Effetto glossy"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.enableDebugMode || false}
                onChange={(e) => handleSettingChange('enableDebugMode', e.target.checked)}
              />
            }
            label="Modalità debug"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.bottomBar || false}
                onChange={(e) => handleSettingChange('bottomBar', e.target.checked)}
              />
            }
            label={localSettings.bottomBar ? 'Barra in basso' : 'Barra in alto'}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderNotificationSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Gestione Notifiche
      </Typography>
      
      <List>
        <ListItem>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notifiche push"
            secondary="Ricevi notifiche per aggiornamenti e attività"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={localSettings.pushNotifications || false}
              onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notifiche sistema"
            secondary="Mostra notifiche nel sistema operativo"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={localSettings.systemNotifications || true}
              onChange={(e) => handleSettingChange('systemNotifications', e.target.checked)}
            />
          </ListItemSecondaryAction>
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <SyncIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notifiche sincronizzazione"
            secondary="Avvisi per backup e sincronizzazione"
          />
          <ListItemSecondaryAction>
            <Switch
              checked={localSettings.syncNotifications || true}
              onChange={(e) => handleSettingChange('syncNotifications', e.target.checked)}
            />
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </Box>
  );

  const renderBackupSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Backup & Ripristino Locale
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Salva i tuoi dati localmente per backup e ripristino
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Esporta Dati
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Scarica una copia di tutti i tuoi dati
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={handleExportData}
              fullWidth
            >
              Esporta Dati
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Importa Dati
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ripristina i dati da un backup
            </Typography>
            <input
              accept=".json"
              style={{ display: 'none' }}
              id="import-data-input"
              type="file"
              onChange={handleImportData}
            />
            <label htmlFor="import-data-input">
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                component="span"
                fullWidth
              >
                Importa Dati
              </Button>
            </label>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="error">
              Reset Impostazioni
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ripristina tutte le impostazioni ai valori predefiniti
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RestoreIcon />}
              onClick={handleResetSettings}
              fullWidth
            >
              Reset Impostazioni
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCloudSyncSettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sincronizzazione Cloud
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sincronizza i tuoi dati con servizi cloud
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Configurazione
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={isEnabled} 
                    onChange={e => {
                      setIsEnabled(e.target.checked);
                      setHasChanges(true);
                    }} 
                  />
                }
                label="Abilita sincronizzazione cloud"
              />
              
              <TextField
                select
                label="Provider"
                value={provider}
                onChange={e => handleProviderChange(e.target.value)}
                fullWidth
                disabled={!isEnabled}
              >
                <MenuItem value="github">GitHub Gist</MenuItem>
                <MenuItem value="googledrive">Google Drive</MenuItem>
              </TextField>
              
              <TextField
                label="Intervallo (minuti)"
                type="number"
                value={intervalMinutes}
                onChange={e => {
                  setIntervalMinutes(Number(e.target.value));
                  setHasChanges(true);
                }}
                inputProps={{ min: 1, max: 60 }}
                fullWidth
                disabled={!isEnabled}
              />
              
              {provider === 'googledrive' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    🔐 Google Drive richiede autenticazione OAuth per la sincronizzazione.
                  </Typography>
                  <Typography variant="caption" display="block">
                    Clicca su "Salva" per avviare il processo di autenticazione.
                  </Typography>
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Stato Sincronizzazione
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              
              {/* Informazioni utente */}
              {isEnabled && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {provider === 'github' && userInfo.github && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ✅ Connesso come: <strong>{userInfo.github.login}</strong>
                      </Typography>
                      <Typography variant="caption" display="block">
                        {userInfo.github.name || userInfo.github.login}
                      </Typography>
                    </Alert>
                  )}
                  
                  {provider === 'googledrive' && userInfo.googledrive && (
                    <Alert severity="success" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ✅ Connesso come: <strong>{userInfo.googledrive.emailAddress}</strong>
                      </Typography>
                      <Typography variant="caption" display="block">
                        {userInfo.googledrive.displayName}
                      </Typography>
                    </Alert>
                  )}
                  
                  {provider === 'github' && !userInfo.github && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ⚠️ Non autenticato con GitHub
                      </Typography>
                      <Typography variant="caption" display="block">
                        Inserisci il token GitHub per sincronizzare
                      </Typography>
                    </Alert>
                  )}
                  
                  {provider === 'googledrive' && !userInfo.googledrive && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        ⚠️ Non autenticato con Google Drive
                      </Typography>
                      <Typography variant="caption" display="block">
                        Completa l'autenticazione OAuth
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
              
              {/* Stato sincronizzazione */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label={`Ultimo sync: ${lastSync ? new Date(lastSync).toLocaleString() : 'N/A'}`} 
                  variant="outlined" 
                  size="small"
                  color={lastSync ? "success" : "default"}
                />
                <Chip 
                  label={`Prossimo sync: ${nextSync ? nextSync.toLocaleTimeString() : 'N/A'}`} 
                  variant="outlined" 
                  size="small"
                  color={nextSync ? "info" : "default"}
                />
                {error && (
                  <Chip 
                    label={`Errore: ${error}`} 
                    variant="outlined" 
                    size="small"
                    color="error"
                  />
                )}
              </Box>
              
              <Button 
                onClick={manualSync} 
                disabled={isInProgress || !isEnabled} 
                startIcon={<SyncIcon />}
                variant="contained"
                fullWidth
              >
                {isInProgress ? 'Sincronizzando...' : 'Sincronizza ora'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSecuritySettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sicurezza e Privacy
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.analytics || false}
                onChange={(e) => handleSettingChange('analytics', e.target.checked)}
              />
            }
            label="Analytics e telemetria"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.crashReports || true}
                onChange={(e) => handleSettingChange('crashReports', e.target.checked)}
              />
            }
            label="Invia report di crash"
          />
        </Grid>
        

      </Grid>
    </Box>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'backup':
        return renderBackupSettings();
      case 'cloudsync':
        return renderCloudSyncSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.background.paper,
          backdropFilter: 'blur(20px)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2">
            Impostazioni
          </Typography>
          <IconButton onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        {hasChanges && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Hai modifiche non salvate
          </Alert>
        )}

        <Box sx={{ display: 'flex', height: '60vh' }}>
          {/* Sidebar per desktop */}
          {!isMobile && (
            <Box sx={{ width: 240, borderRight: `1px solid ${theme.palette.divider}`, pr: 2, background: theme.palette.background.default }}>
              <List>
                {sections.map((section) => (
                  <ListItem
                    key={section.id}
                    button
                    selected={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                        }
                      }
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: activeSection === section.id ? theme.palette.primary.contrastText : 'inherit',
                        minWidth: 40
                      }}
                    >
                      {section.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={section.title}
                      primaryTypographyProps={{
                        fontWeight: activeSection === section.id ? 600 : 400
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Contenuto principale */}
          <Box sx={{ flex: 1, pl: isMobile ? 0 : 3 }}>
            {isMobile ? (
              <Box>
                {sections.map((section) => (
                  <Accordion key={section.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {section.icon}
                        <Typography variant="subtitle1">
                          {section.title}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {section.id === 'general' && renderGeneralSettings()}
                      {section.id === 'appearance' && renderAppearanceSettings()}
                      {section.id === 'notifications' && renderNotificationSettings()}
                      {section.id === 'backup' && renderBackupSettings()}
                      {section.id === 'cloudsync' && renderCloudSyncSettings()}
                      {section.id === 'security' && renderSecuritySettings()}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              renderSectionContent()
            )}
          </Box>
        </Box>


      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleCancel}>
          Annulla
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges}
          startIcon={<SaveIcon />}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
            }
          }}
        >
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsMaterial; 