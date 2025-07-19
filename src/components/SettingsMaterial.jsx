import React, { useState, useEffect } from 'react';
import StorageService from '../services/StorageService.js';
import GoogleDriveService from '../services/GoogleDriveService.js';
import { aiServiceManager } from '../services/ai/AIServiceManager.js';
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
  AccordionDetails,
  CircularProgress
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
  SmartToy as SmartToyIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Cloud as CloudIcon,
  CheckCircle as CheckCircleIcon,
  CloudOff as CloudOffIcon,
  GitHub as GitHubIcon,
  CloudSync as CloudSyncIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSyncStatus } from '../utils/useSyncStatus.js';
import GitHubService from '../services/GitHubService.js';

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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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

  // Stati per il nuovo flusso di configurazione cloud sync
  const [cloudSyncConfig, setCloudSyncConfig] = useState({
    selectedProvider: provider || 'github',
    githubToken: '',
    isTestingConnection: false,
    testResult: null, // null | 'success' | 'error'
    testError: null,
    isConfigured: false
  });

  // Stati per la configurazione AI
  const [aiConfig, setAiConfig] = useState({
    selectedProvider: 'openrouter',
    openrouterApiKey: '',
    defaultModel: 'openai/gpt-4o-mini', // Modello predefinito
    isTestingConnection: false,
    testResult: null,
    testError: null,
    credits: null,
    isConfigured: false
  });

  // Stato per i modelli AI disponibili
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);

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
      id: 'ai',
      title: 'Intelligenza Artificiale',
      icon: <SmartToyIcon />,
      description: 'Configurazione servizi AI e API key'
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
    
    // Gestione speciale per le impostazioni di debug
    if (key === 'enableDebugMode' || key === 'debugMode') {
      if (value) {
        localStorage.setItem('aideas_debug', 'true');
      } else {
        localStorage.removeItem('aideas_debug');
      }
      showToast(`Modalità debug ${value ? 'attivata' : 'disattivata'}`, 'info');
    }
    
    if (key === 'verboseLogging') {
      if (value) {
        localStorage.setItem('aideas_verbose_logging', 'true');
      } else {
        localStorage.removeItem('aideas_verbose_logging');
      }
      showToast(`Logging verboso ${value ? 'attivato' : 'disattivato'}`, 'info');
    }
    
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
      const data = await StorageService.exportBackupData();
      
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
          
          // Usa la nuova funzione di import che valida il formato
          await StorageService.importBackupData(data);
          
          showToast('Dati importati con successo', 'success');
          
          // Ricarica le impostazioni
          setLocalSettings(data.settings);
          
        } catch (error) {
          console.error('Errore import dati:', error);
          showToast(`Errore durante l'importazione: ${error.message}`, 'error');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Errore lettura file:', error);
      showToast('Errore durante la lettura del file', 'error');
    }
  };

  const handleResetSettings = () => {
    setResetConfirmOpen(true);
  };

  const handleConfirmReset = async (deleteApps = false) => {
    try {
      if (deleteApps) {
        // Reset completo - cancella tutto il database
        await StorageService.clearAllData();
        showToast('Reset completo eseguito - tutte le app e impostazioni sono state cancellate', 'success');
      } else {
        // Reset solo impostazioni
        await StorageService.setAllSettings({});
        showToast('Impostazioni ripristinate', 'success');
      }
      
      setLocalSettings({});
      setResetConfirmOpen(false);
      
      // Ricarica la pagina per applicare completamente il reset
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
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
      try {
        const googleService = GoogleDriveService.createConfiguredInstance();
        const isAuthenticated = await googleService.checkAuthentication();
        if (isAuthenticated) {
          const userInfo = googleService.getUserInfo();
          setUserInfo(prev => ({
            ...prev,
            googledrive: userInfo
          }));
        }
      } catch (error) {
        console.warn('Google Drive non configurato:', error.message);
      }
    } catch (error) {
      console.error('Errore caricamento info utente:', error);
    }
  };

  // Carica info utente all'apertura
  useEffect(() => {
    if (open) {
      loadUserInfo();
      // Carica anche i valori di debug dal localStorage
      loadDebugSettings();
      loadAIConfig();
    }
  }, [open]);

  const loadDebugSettings = () => {
    const debugEnabled = localStorage.getItem('aideas_debug') === 'true';
    const verboseEnabled = localStorage.getItem('aideas_verbose_logging') === 'true';
    
    setLocalSettings(prev => ({
      ...prev,
      debugMode: debugEnabled,
      enableDebugMode: debugEnabled,
      verboseLogging: verboseEnabled
    }));
  };

  const handleProviderChange = async (newProvider) => {
    setProvider(newProvider);
    setHasChanges(true); // Marca come modificato
    
    // Mostra solo messaggi informativi, senza avviare automaticamente l'autenticazione
    if (isEnabled) {
      if (newProvider === 'github') {
        showToast('Provider cambiato a GitHub. Usa il pulsante "Sincronizza ora" per configurare la connessione.', 'info');
      } else if (newProvider === 'googledrive') {
        showToast('Provider cambiato a Google Drive. Usa il pulsante "Sincronizza ora" per configurare la connessione.', 'info');
      }
    }
    
    // Aggiorna le informazioni utente per riflettere il nuovo provider
    await loadUserInfo();
  };

  // === FUNZIONI PER IL NUOVO FLUSSO CLOUD SYNC ===

  const handleCloudProviderChange = (newProvider) => {
    setCloudSyncConfig(prev => ({
      ...prev,
      selectedProvider: newProvider,
      testResult: null,
      testError: null,
      isConfigured: false
    }));
    setProvider(newProvider);
    setHasChanges(true);
  };

  const handleGitHubTokenChange = (token) => {
    setCloudSyncConfig(prev => ({
      ...prev,
      githubToken: token,
      testResult: null,
      testError: null,
      isConfigured: false
    }));
    setHasChanges(true);
  };

  const testCloudConnection = async () => {
    setCloudSyncConfig(prev => ({ ...prev, isTestingConnection: true, testResult: null, testError: null }));
    
    try {
      if (cloudSyncConfig.selectedProvider === 'github') {
        if (!cloudSyncConfig.githubToken.trim()) {
          throw new Error('Token GitHub richiesto');
        }
        
        // Test connessione GitHub
        const githubService = new GitHubService();
        await githubService.authenticate(cloudSyncConfig.githubToken);
        const isAuthenticated = await githubService.isAuthenticated();
        
        if (!isAuthenticated) {
          throw new Error('Token GitHub non valido');
        }
        
        // Salva il token se il test è riuscito
        await StorageService.setSetting('githubToken', cloudSyncConfig.githubToken);
        
        setCloudSyncConfig(prev => ({ 
          ...prev, 
          testResult: 'success', 
          isConfigured: true 
        }));
        
        showToast('✅ Connessione GitHub testata con successo!', 'success');
        
        // Abilita automaticamente la sincronizzazione
        await enableCloudSync();
        
      } else if (cloudSyncConfig.selectedProvider === 'googledrive') {
        // Test/Avvia autenticazione Google Drive
        const googleService = GoogleDriveService.createConfiguredInstance();
        
        // Verifica se è già autenticato
        const alreadyAuthenticated = await googleService.checkAuthentication();
        if (alreadyAuthenticated) {
          setCloudSyncConfig(prev => ({ 
            ...prev, 
            testResult: 'success', 
            isConfigured: true 
          }));
          showToast('✅ Google Drive già autenticato!', 'success');
          await enableCloudSync();
        } else {
          // Avvia processo di autenticazione
          const result = await googleService.authenticate(true);
          if (result.success) {
            setCloudSyncConfig(prev => ({ 
              ...prev, 
              testResult: 'success', 
              isConfigured: true 
            }));
            showToast('✅ Autenticazione Google Drive completata!', 'success');
            await enableCloudSync();
          } else {
            throw new Error('Autenticazione Google Drive fallita');
          }
        }
      }
    } catch (error) {
      console.error('Errore test connessione:', error);
      setCloudSyncConfig(prev => ({ 
        ...prev, 
        testResult: 'error', 
        testError: error.message 
      }));
      showToast(`❌ Test connessione fallito: ${error.message}`, 'error');
    } finally {
      setCloudSyncConfig(prev => ({ ...prev, isTestingConnection: false }));
    }
  };

  const enableCloudSync = async () => {
    try {
      // Assicurati che il provider sia corretto (converte valori obsoleti)
      let finalProvider = cloudSyncConfig.selectedProvider;
      if (finalProvider === 'gist') {
        finalProvider = 'googledrive';
      }
      
      await StorageService.setSetting('syncProvider', finalProvider);
      await StorageService.setSetting('syncEnabled', true);
      setIsEnabled(true);
      showToast('🔄 Sincronizzazione cloud abilitata!', 'success');
      
      // Ricarica le informazioni utente
      await loadUserInfo();
    } catch (error) {
      console.error('Errore abilitazione sync:', error);
      showToast(`❌ Errore abilitazione sincronizzazione: ${error.message}`, 'error');
    }
  };

  const disableCloudSync = async () => {
    try {
      await StorageService.setSetting('syncEnabled', false);
      setIsEnabled(false);
      setCloudSyncConfig(prev => ({ 
        ...prev, 
        testResult: null, 
        isConfigured: false 
      }));
      showToast('⏸️ Sincronizzazione cloud disabilitata', 'info');
    } catch (error) {
      console.error('Errore disabilitazione sync:', error);
      showToast(`❌ Errore disabilitazione sincronizzazione: ${error.message}`, 'error');
    }
  };

  // === FINE FUNZIONI CLOUD SYNC ===

  // === FUNZIONI CONFIGURAZIONE AI ===
  const loadAIConfig = async () => {
    try {
      console.log('🤖 Caricamento configurazione AI...');
      
      const aiSettings = localSettings.ai || {};
      const openrouterSettings = aiSettings.openrouter || {};
      
      setAiConfig({
        selectedProvider: aiSettings.provider || 'openrouter',
        openrouterApiKey: openrouterSettings.apiKey || '',
        defaultModel: openrouterSettings.defaultModel || 'openai/gpt-4o-mini',
        isConfigured: !!openrouterSettings.apiKey,
        testResult: null,
        testError: null,
        isTestingConnection: false,
        credits: null
      });

      // Se c'è un'API key configurata, inizializza il servizio e carica i crediti
      if (openrouterSettings.apiKey) {
        console.log('🤖 Inizializzazione AIServiceManager...');
        await aiServiceManager.initialize({
          openrouter: { apiKey: openrouterSettings.apiKey }
        });
        
        console.log('💰 API key trovata, caricamento crediti...');
        await loadAICredits();
        
        // Carica i modelli disponibili
        await loadAvailableModels();
      }
      
    } catch (error) {
      console.error('Errore caricamento configurazione AI:', error);
    }
  };

  // Carica modelli AI disponibili
  const loadAvailableModels = async () => {
    if (!aiConfig.openrouterApiKey) return;
    
    setModelsLoading(true);
    try {
      console.log('🔍 Caricamento modelli AI da OpenRouter...');
      
      const models = await aiServiceManager.getAvailableModels();
      
      // Converti il formato per il dropdown
      const formattedModels = [];
      Object.entries(models).forEach(([group, groupModels]) => {
        groupModels.forEach(model => {
          formattedModels.push({
            value: model.value,
            label: model.label,
            group: group,
            supportsSystemPrompt: model.supportsSystemPrompt || false
          });
        });
      });
      
      setAvailableModels(formattedModels);
      console.log('✅ Modelli caricati con successo:', formattedModels.length, 'modelli disponibili');
      
    } catch (error) {
      console.error('❌ Errore caricamento modelli:', error);
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleAIProviderChange = (newProvider) => {
    setAiConfig(prev => ({ ...prev, selectedProvider: newProvider }));
  };

  const handleOpenRouterApiKeyChange = (apiKey) => {
    setAiConfig(prev => ({ 
      ...prev, 
      openrouterApiKey: apiKey,
      isConfigured: apiKey.length > 0
    }));
  };

  const handleDefaultModelChange = (model) => {
    setAiConfig(prev => ({ 
      ...prev, 
      defaultModel: model
    }));
  };

  const testAIConnection = async () => {
    if (!aiConfig.openrouterApiKey) {
      showToast('Inserisci prima la tua API key OpenRouter', 'warning');
      return;
    }

    try {
      setAiConfig(prev => ({ ...prev, isTestingConnection: true, testResult: null, testError: null }));
      
      console.log('🧪 Test connessione AI...');
      
      // Inizializza il servizio con la nuova API key
      await aiServiceManager.initialize({
        openrouter: { apiKey: aiConfig.openrouterApiKey }
      });
      
      const result = await aiServiceManager.testConnection();
      
      if (result.success) {
        setAiConfig(prev => ({ 
          ...prev, 
          testResult: 'success', 
          testError: null,
          isConfigured: true
        }));
        showToast('Connessione AI testata con successo!', 'success');

        // Carica i crediti
        await loadAICredits();
      } else {
        setAiConfig(prev => ({ 
          ...prev, 
          testResult: 'error', 
          testError: result.error 
        }));
        showToast(`Errore test connessione: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('❌ Errore durante test connessione:', error);
      setAiConfig(prev => ({ 
        ...prev, 
        testResult: 'error', 
        testError: error.message 
      }));
      showToast(`Errore test connessione: ${error.message}`, 'error');
    } finally {
      setAiConfig(prev => ({ ...prev, isTestingConnection: false }));
    }
  };

  const loadAICredits = async () => {
    try {
      console.log('💰 Caricamento crediti AI...');
      const credits = await aiServiceManager.getCredits();
      setAiConfig(prev => ({ ...prev, credits }));
      console.log('✅ Crediti caricati:', credits);
    } catch (error) {
      console.warn('⚠️ Impossibile caricare i crediti:', error);
      setAiConfig(prev => ({ 
        ...prev, 
        credits: {
          credits: 'N/A',
          usage: {},
          limits: {},
          error: error.message
        }
      }));
    }
  };

  const saveAIConfig = async () => {
    try {
      console.log('💾 Salvataggio configurazione AI:', {
        provider: aiConfig.selectedProvider,
        hasApiKey: !!aiConfig.openrouterApiKey,
        apiKeyLength: aiConfig.openrouterApiKey?.length,
        defaultModel: aiConfig.defaultModel
      });

      const updatedSettings = {
        ...localSettings,
        ai: {
          provider: aiConfig.selectedProvider,
          openrouter: {
            apiKey: aiConfig.openrouterApiKey,
            defaultModel: aiConfig.defaultModel
          }
        }
      };

      await StorageService.setAllSettings(updatedSettings);
      console.log('✅ Impostazioni salvate in StorageService');
      
      // Inizializza il gestore AI
      if (aiConfig.openrouterApiKey) {
        console.log('🤖 Inizializzazione AIServiceManager con API key');
        await aiServiceManager.initialize({
          openrouter: { apiKey: aiConfig.openrouterApiKey }
        });
        console.log('✅ AIServiceManager inizializzato');
      }

      showToast('Configurazione AI salvata con successo!', 'success');
      setHasChanges(true);
    } catch (error) {
      console.error('❌ Errore salvataggio configurazione AI:', error);
      showToast('Errore salvataggio configurazione AI', 'error');
    }
  };
  // === FINE FUNZIONI CONFIGURAZIONE AI ===

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
                checked={localSettings.debugMode || false}
                onChange={(e) => {
                  handleSettingChange('debugMode', e.target.checked);
                  localStorage.setItem('aideas_debug', e.target.checked);
                }}
              />
            }
            label="Modalità debug"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.verboseLogging || false}
                onChange={(e) => {
                  handleSettingChange('verboseLogging', e.target.checked);
                  localStorage.setItem('aideas_verbose_logging', e.target.checked);
                }}
              />
            }
            label="Logging verboso"
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
            onChange={e => {
              onDefaultOpenModeChange(e.target.value);
              handleSettingChange('defaultOpenMode', e.target.value);
            }}
            SelectProps={{ native: true }}
          >
            <option value="modal">Modale (in-app)</option>
            <option value="window">Nuova finestra/tab</option>
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
        Sincronizza i tuoi dati con GitHub Gist o Google Drive
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* 1. SELEZIONE PROVIDER */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudIcon />
          Scegli il Provider Cloud
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Provider di Sincronizzazione</InputLabel>
          <Select
            value={cloudSyncConfig.selectedProvider}
            label="Provider di Sincronizzazione"
            onChange={(e) => handleCloudProviderChange(e.target.value)}
            disabled={isEnabled}
          >
            <MenuItem value="github">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GitHubIcon />
                GitHub Gist
              </Box>
            </MenuItem>
            <MenuItem value="googledrive">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudIcon />
                Google Drive
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* 2. CONFIGURAZIONE SPECIFICA PER PROVIDER */}
        <Divider sx={{ my: 3 }} />
        
        {cloudSyncConfig.selectedProvider === 'github' && (
          <>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GitHubIcon />
              Configurazione GitHub Gist
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Come ottenere un token GitHub:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                1. Vai su GitHub → Settings → Developer settings → Personal access tokens<br/>
                2. Genera un nuovo token (classic)<br/>
                3. Seleziona la scope <code>gist</code><br/>
                4. Copia il token e incollalo qui sotto
              </Typography>
            </Alert>
            
            <TextField
              fullWidth
              label="Token GitHub Personal Access"
              type="password"
              value={cloudSyncConfig.githubToken}
              onChange={(e) => handleGitHubTokenChange(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxx"
              disabled={isEnabled}
              sx={{ mb: 2 }}
              helperText="Il token viene salvato localmente e utilizzato per creare/aggiornare gist"
            />
          </>
        )}

        {cloudSyncConfig.selectedProvider === 'googledrive' && (
          <>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudIcon />
              Configurazione Google Drive
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Autenticazione OAuth2:</strong><br/>
                Clicca il pulsante "Testa Connessione" per avviare l'autenticazione con Google Drive.
                Ti verrà chiesto di autorizzare l'accesso al tuo account Google.
              </Typography>
            </Alert>
            
            <Box sx={{ 
              p: 2, 
              border: '1px dashed', 
              borderColor: 'divider', 
              borderRadius: 1, 
              textAlign: 'center',
              backgroundColor: 'action.hover'
            }}>
              <CloudIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Pronto per l'autenticazione OAuth2
              </Typography>
            </Box>
          </>
        )}

        {/* 3. PULSANTE TEST CONNESSIONE */}
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={cloudSyncConfig.isTestingConnection ? <CircularProgress size={20} /> : <CloudSyncIcon />}
            onClick={testCloudConnection}
            disabled={
              cloudSyncConfig.isTestingConnection || 
              isEnabled || 
              (cloudSyncConfig.selectedProvider === 'github' && !cloudSyncConfig.githubToken.trim())
            }
            sx={{ mb: 2 }}
          >
            {cloudSyncConfig.isTestingConnection 
              ? 'Test in corso...' 
              : cloudSyncConfig.selectedProvider === 'googledrive' 
                ? 'Avvia Autenticazione Google' 
                : 'Testa Connessione GitHub'
            }
          </Button>

          {/* RISULTATO DEL TEST */}
          {cloudSyncConfig.testResult === 'success' && (
            <Alert severity="success">
              <Typography variant="body2">
                ✅ <strong>Connessione riuscita!</strong><br/>
                La sincronizzazione è stata abilitata automaticamente.
              </Typography>
            </Alert>
          )}

          {cloudSyncConfig.testResult === 'error' && (
            <Alert severity="error">
              <Typography variant="body2">
                ❌ <strong>Errore di connessione:</strong><br/>
                {cloudSyncConfig.testError}
              </Typography>
            </Alert>
          )}
        </Box>
      </Paper>

      {/* 4. STATO SINCRONIZZAZIONE (solo se abilitata) */}
      {isEnabled && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: 'success.main' }} />
            Sincronizzazione Attiva
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Chip 
                label={`Provider: ${cloudSyncConfig.selectedProvider === 'github' ? 'GitHub Gist' : 'Google Drive'}`}
                color="primary" 
                sx={{ mb: 1, mr: 1 }}
              />
              <Chip 
                label={`Ultimo sync: ${lastSync ? new Date(lastSync).toLocaleString() : 'Mai'}`} 
                variant="outlined" 
                color={lastSync ? "success" : "default"}
                sx={{ mb: 1, mr: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Chip 
                label={`Prossimo sync: ${nextSync ? nextSync.toLocaleTimeString() : 'N/A'}`} 
                variant="outlined" 
                color={nextSync ? "info" : "default"}
                sx={{ mb: 1, mr: 1 }}
              />
              {error && (
                <Chip 
                  label={`Errore: ${error}`} 
                  variant="outlined" 
                  color="error"
                  sx={{ mb: 1, mr: 1 }}
                />
              )}
            </Grid>
          </Grid>

          {/* Informazioni utente */}
          {((cloudSyncConfig.selectedProvider === 'github' && userInfo.github) || 
            (cloudSyncConfig.selectedProvider === 'googledrive' && userInfo.googledrive)) && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {cloudSyncConfig.selectedProvider === 'github' && userInfo.github && (
                <Typography variant="body2">
                  👤 <strong>Connesso come:</strong> {userInfo.github.login} ({userInfo.github.name || userInfo.github.login})
                </Typography>
              )}
              {cloudSyncConfig.selectedProvider === 'googledrive' && userInfo.googledrive && (
                <Typography variant="body2">
                  👤 <strong>Connesso come:</strong> {userInfo.googledrive.email} ({userInfo.googledrive.name || userInfo.googledrive.given_name || 'Google User'})
                </Typography>
              )}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={manualSync} 
              disabled={isInProgress} 
            >
              {isInProgress ? 'Sincronizzando...' : 'Sincronizza Ora'}
            </Button>
            
            <TextField
              label="Intervallo (minuti)"
              type="number"
              value={intervalMinutes}
              onChange={e => {
                setIntervalMinutes(Number(e.target.value));
                setHasChanges(true);
              }}
              inputProps={{ min: 1, max: 60 }}
              size="small"
              sx={{ width: 150 }}
            />
            
            <Button 
              variant="outlined"
              color="error"
              startIcon={<CloudOffIcon />}
              onClick={disableCloudSync}
            >
              Disabilita Sync
            </Button>
          </Box>
        </Paper>
      )}
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

  const renderAISettings = () => (
    <Box sx={{ space: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configurazione Servizi AI
      </Typography>
      
      <Grid container spacing={3}>
        {/* Selezione Provider */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Provider AI</InputLabel>
            <Select
              value={aiConfig.selectedProvider}
              onChange={(e) => handleAIProviderChange(e.target.value)}
              label="Provider AI"
            >
              <MenuItem value="openrouter">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🌐 OpenRouter
                </Box>
              </MenuItem>
              {/* Futuri provider */}
              {/* <MenuItem value="anthropic">🤖 Anthropic Claude</MenuItem> */}
              {/* <MenuItem value="google">🔍 Google AI</MenuItem> */}
            </Select>
          </FormControl>
        </Grid>

        {/* API Key OpenRouter */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            🌐 OpenRouter API Key
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Ottieni la tua API key gratuita su{' '}
            <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" 
               style={{ color: theme.palette.primary.main }}>
              openrouter.ai
            </a>
          </Typography>
          
          <TextField
            fullWidth
            type="password"
            label="API Key OpenRouter"
            value={aiConfig.openrouterApiKey}
            onChange={(e) => handleOpenRouterApiKeyChange(e.target.value)}
            variant="outlined"
            placeholder="sk-or-v1-..."
            helperText="La tua API key viene salvata localmente e non viene condivisa"
          />
        </Grid>

        {/* Test Connessione */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={testAIConnection}
              disabled={!aiConfig.openrouterApiKey || aiConfig.isTestingConnection}
              startIcon={aiConfig.isTestingConnection ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {aiConfig.isTestingConnection ? 'Test in corso...' : 'Testa Connessione'}
            </Button>
            
            {aiConfig.testResult === 'success' && (
              <Chip 
                label="✅ Connessione OK" 
                color="success" 
                variant="outlined"
              />
            )}
            
            {aiConfig.testResult === 'error' && (
              <Chip 
                label={`❌ Errore: ${aiConfig.testError}`} 
                color="error" 
                variant="outlined"
              />
            )}
          </Box>
        </Grid>

        {/* Modello Predefinito */}
        {aiConfig.isConfigured && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              🤖 Modello AI Predefinito
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Seleziona il modello AI che verrà utilizzato automaticamente quando apri il generatore AI
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Modello Predefinito</InputLabel>
              <Select
                value={aiConfig.defaultModel}
                onChange={(e) => handleDefaultModelChange(e.target.value)}
                label="Modello Predefinito"
                disabled={modelsLoading}
              >
                {availableModels.length === 0 ? (
                  <MenuItem disabled>
                    {modelsLoading ? 'Caricamento modelli...' : 'Nessun modello disponibile'}
                  </MenuItem>
                ) : (
                  availableModels.map(model => (
                    <MenuItem key={model.value} value={model.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <span>{model.label}</span>
                        {model.supportsSystemPrompt && (
                          <Chip 
                            size="small" 
                            label="System" 
                            color="success" 
                            variant="outlined"
                            sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {modelsLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Caricamento modelli...
                  </Typography>
                </Box>
              )}
            </FormControl>
            
            <Button
              variant="outlined"
              size="small"
              onClick={loadAvailableModels}
              disabled={modelsLoading || !aiConfig.openrouterApiKey}
              startIcon={<RefreshIcon />}
              sx={{ mt: 1 }}
            >
              {modelsLoading ? 'Caricamento...' : 
               availableModels.length > 0 ? `Aggiorna Modelli (${availableModels.length})` : 
               'Carica Modelli'}
            </Button>
          </Grid>
        )}

        {/* Informazioni Crediti */}
        {aiConfig.credits && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                💰 Informazioni Crediti
              </Typography>
              
              {/* Crediti disponibili */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Crediti disponibili:</strong> {
                    aiConfig.credits.credits === 'N/A' ? 
                    'Non disponibile' : 
                    typeof aiConfig.credits.credits === 'number' ? 
                    `${aiConfig.credits.credits.toFixed(2)} crediti` : 
                    aiConfig.credits.credits
                  }
                </Typography>
              </Box>

              {/* Utilizzo */}
              {aiConfig.credits.usage && Object.keys(aiConfig.credits.usage).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Utilizzo:</strong>
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {aiConfig.credits.usage.total_requests !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Richieste totali: {aiConfig.credits.usage.total_requests}
                      </Typography>
                    )}
                    {aiConfig.credits.usage.total_tokens !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Token totali: {aiConfig.credits.usage.total_tokens.toLocaleString()}
                      </Typography>
                    )}
                    {aiConfig.credits.usage.total_cost !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Costo totale: ${aiConfig.credits.usage.total_cost.toFixed(4)}
                      </Typography>
                    )}
                    {aiConfig.credits.usage.requests_today !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Richieste oggi: {aiConfig.credits.usage.requests_today}
                      </Typography>
                    )}
                    {aiConfig.credits.usage.tokens_today !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Token oggi: {aiConfig.credits.usage.tokens_today.toLocaleString()}
                      </Typography>
                    )}
                    {aiConfig.credits.usage.cost_today !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Costo oggi: ${aiConfig.credits.usage.cost_today.toFixed(4)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Limiti */}
              {aiConfig.credits.limits && Object.keys(aiConfig.credits.limits).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Limiti:</strong>
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {aiConfig.credits.limits.requests_per_day !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Richieste/giorno: {aiConfig.credits.limits.requests_per_day}
                      </Typography>
                    )}
                    {aiConfig.credits.limits.tokens_per_day !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        • Token/giorno: {aiConfig.credits.limits.tokens_per_day.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Errore se presente */}
              {aiConfig.credits.error && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    Impossibile caricare i crediti: {aiConfig.credits.error}
                  </Typography>
                </Alert>
              )}

              {/* Pulsante per ricaricare i crediti */}
              <Button
                variant="outlined"
                size="small"
                onClick={loadAICredits}
                disabled={!aiConfig.openrouterApiKey}
                startIcon={<RefreshIcon />}
                sx={{ mt: 1 }}
              >
                Aggiorna Crediti
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Salva Configurazione */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={saveAIConfig}
            disabled={!aiConfig.openrouterApiKey}
            startIcon={<SaveIcon />}
          >
            Salva Configurazione AI
          </Button>
        </Grid>

        {/* Stato Configurazione */}
        <Grid item xs={12}>
          {aiConfig.isConfigured ? (
            <Alert severity="success">
              ✅ Configurazione AI attiva - Puoi usare il generatore AI
            </Alert>
          ) : (
            <Alert severity="info">
              ℹ️ Configura la tua API key OpenRouter per usare il generatore AI
            </Alert>
          )}
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
      case 'ai':
        return renderAISettings();
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
    <>
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
                    data-section={section.id}
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

    {/* Dialog conferma reset */}
    <Dialog
      open={resetConfirmOpen}
      onClose={() => setResetConfirmOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DeleteIcon color="warning" />
        Reset Impostazioni
      </DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vuoi anche eliminare tutte le app installate?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setResetConfirmOpen(false)} color="inherit">
          Annulla
        </Button>
        <Button onClick={() => handleConfirmReset(false)} color="warning">
          Solo Impostazioni
        </Button>
        <Button onClick={() => handleConfirmReset(true)} color="error" variant="contained">
          Reset Completo
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default SettingsMaterial; 