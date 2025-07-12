import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Switch
} from '@mui/material';
import {
  Sync as SyncIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  GitHub as GitHubIcon,
  Google as GoogleIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import GitHubService from '../services/GitHubService.js';
import GoogleDriveService from '../services/GoogleDriveService.js';
import StorageService from '../services/StorageService.js';
import ErrorHandler from '../services/ErrorHandler.js';
import SyncConflictModal from './SyncConflictModal.jsx';
import { useTheme } from '@mui/material/styles';
import { useSyncStatus } from '../utils/useSyncStatus.js';
import { DEBUG } from '../utils/debug.js';

export default function SyncManagerMaterial({ open, onClose }) {
  const [setupMode, setSetupMode] = useState(false);
  const [credentials, setCredentials] = useState({
    github: { token: '' },
    googledrive: { 
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '', 
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '' 
    }
  });

  const [progress, setProgress] = useState({ show: false, value: 0, text: '' });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [gistId, setGistId] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [authenticationStatus, setAuthenticationStatus] = useState({
    github: false,
    googledrive: false
  });

  const [githubService] = useState(new GitHubService());
  const [googleService] = useState(new GoogleDriveService());

  const theme = useTheme();

  const {
    isEnabled, provider, isInProgress, lastSync, nextSync, intervalMinutes, syncHistory, 
    setProvider, setIsEnabled, setIntervalMinutes, manualSync
  } = useSyncStatus();

  useEffect(() => {
    if (open) {
      loadSyncStatus();
      loadSyncHistory();
      checkAuthenticationStatus();
    }
  }, [open]);

  const loadSyncStatus = async () => {
    try {
      const isEnabled = await StorageService.getSetting('syncEnabled', false);
      const provider = await StorageService.getSetting('syncProvider', 'github');
      const savedGistId = await StorageService.getSetting('githubGistId', null);

      setGistId(savedGistId);
      await loadCredentials();
    } catch (error) {
      DEBUG.error('Errore caricamento stato sync:', error);
      setError('Errore caricamento configurazione sincronizzazione');
    }
  };

  const loadCredentials = async () => {
    try {
      const savedCredentials = await StorageService.getSetting('syncCredentials', {});
      setCredentials(prev => ({
        ...prev,
        ...savedCredentials
      }));
    } catch (error) {
      DEBUG.error('Errore caricamento credenziali:', error);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const history = await StorageService.getSetting('syncHistory', []);
      // setSyncHistory(history.slice(-10)); // Ultimi 10 sync
    } catch (error) {
      DEBUG.error('Errore caricamento cronologia:', error);
    }
  };

  const checkAuthenticationStatus = async () => {
    try {
      DEBUG.log('🔍 Controllo stato autenticazione...');
      
      const newStatus = {
        github: false,
        googledrive: false
      };

      // Controlla GitHub
      try {
        const githubToken = await StorageService.getSetting('githubToken');
        if (githubToken) {
          await githubService.authenticate(githubToken);
          newStatus.github = await githubService.isAuthenticated();
        }
      } catch (error) {
        DEBUG.warn('GitHub non autenticato:', error.message);
      }

      // Controlla Google Drive
      try {
        const clientId = credentials.googledrive.clientId;
        if (clientId) {
          googleService.configure(clientId, credentials.googledrive.clientSecret);
          newStatus.googledrive = await googleService.checkAuthentication();
        }
      } catch (error) {
        DEBUG.warn('Google Drive non autenticato:', error.message);
      }

      setAuthenticationStatus(newStatus);
      
      DEBUG.log('✅ Stato autenticazione aggiornato:', newStatus);
    } catch (error) {
      DEBUG.error('Errore controllo autenticazione:', error);
    }
  };

  const handleProviderChange = (event) => {
    setProvider(event.target.value);
  };

  const handleCredentialChange = (provider, field, value) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const authenticateGoogleDrive = async () => {
    try {
      setProgress({ show: true, value: 0, text: 'Autenticazione Google Drive...' });
      setError(null);
      
      const clientId = credentials.googledrive.clientId;
      if (!clientId) {
        throw new Error('Client ID Google richiesto');
      }
      
      DEBUG.log('🔐 Avvio autenticazione Google Drive...');
      
      googleService.configure(clientId, credentials.googledrive.clientSecret);
      
      // Prova prima a verificare se è già autenticato
      const alreadyAuthenticated = await googleService.checkAuthentication();
      if (alreadyAuthenticated) {
        const userInfo = googleService.getUserInfo();
        setProgress({ show: false, value: 100, text: '' });
        setSuccess(`Google Drive già autenticato! Benvenuto ${userInfo?.name || 'Utente'}`);
        
        setAuthenticationStatus(prev => ({
          ...prev,
          googledrive: true
        }));
        
        return true;
      }
      
      // Avvia autenticazione con popup migliorato
      setProgress({ show: true, value: 25, text: 'Apertura finestra autenticazione...' });
      
      const result = await googleService.authenticate(true); // Usa popup
      
      if (result.success) {
        setProgress({ show: true, value: 75, text: 'Completamento autenticazione...' });
        
        // Verifica che l'autenticazione sia effettivamente completata
        const verified = await googleService.checkAuthentication();
        if (!verified) {
          throw new Error('Verifica autenticazione fallita');
        }
        
        setProgress({ show: false, value: 100, text: '' });
        setSuccess(`Autenticazione Google Drive completata! Benvenuto ${result.user?.name || 'Utente'}`);
        
        // Aggiorna stato autenticazione
        setAuthenticationStatus(prev => ({
          ...prev,
          googledrive: true
        }));
        
        // Salva credenziali
        await StorageService.setSetting('syncCredentials', credentials);
        
        await addToSyncHistory('info', `Autenticazione Google Drive completata per ${result.user?.name || 'Utente'}`);
        
        DEBUG.log('✅ Autenticazione Google Drive completata');
        return true;
      } else if (result.pending) {
        setProgress({ show: false, value: 100, text: '' });
        setSuccess('Autenticazione in corso... Controlla la finestra del browser.');
        return false;
      } else {
        throw new Error('Autenticazione fallita o annullata');
      }
    } catch (error) {
      DEBUG.error('Errore autenticazione Google:', error);
      
      let errorMessage = error.message;
      if (errorMessage.includes('Popup bloccato')) {
        errorMessage = 'Popup bloccato dal browser. Abilita i popup per questo sito e riprova.';
      } else if (errorMessage.includes('annullata dall\'utente')) {
        errorMessage = 'Autenticazione annullata dall\'utente.';
      }
      
      setError(`Errore autenticazione Google Drive: ${errorMessage}`);
      setProgress({ show: false, value: 0, text: '' });
      
      setAuthenticationStatus(prev => ({
        ...prev,
        googledrive: false
      }));
      
      await addToSyncHistory('error', `Errore autenticazione Google Drive: ${errorMessage}`);
      
      return false;
    }
  };

  const testConnection = async () => {
    const currentProvider = provider;
    setProgress({ show: true, value: 0, text: 'Test connessione...' });
    setError(null);

    try {
      let isConnected = false;

      if (currentProvider === 'github') {
        const token = credentials.github.token;
        if (!token) throw new Error('Token GitHub richiesto');
        
        await githubService.authenticate(token);
        isConnected = await githubService.isAuthenticated();
      } else if (currentProvider === 'googledrive') {
        const clientId = credentials.googledrive.clientId;
        if (!clientId) throw new Error('Client ID Google richiesto');
        
        googleService.configure(clientId, credentials.googledrive.clientSecret);
        isConnected = await googleService.checkAuthentication();
      }

      setProgress({ show: false, value: 100, text: '' });
      
      if (isConnected) {
        setSuccess(`Connessione ${currentProvider} testata con successo!`);
        
        // Aggiorna stato autenticazione
        setAuthenticationStatus(prev => ({
          ...prev,
          [currentProvider]: true
        }));
        
        return true;
      } else {
        throw new Error('Connessione fallita');
      }
    } catch (error) {
      DEBUG.error('Errore test connessione:', error);
      setError(`Errore connessione: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
      
      // Aggiorna stato autenticazione
      setAuthenticationStatus(prev => ({
        ...prev,
        [currentProvider]: false
      }));
      
      return false;
    }
  };

  const addToSyncHistory = async (type, message) => {
    try {
      const history = await StorageService.getSetting('syncHistory', []);
      const newEntry = {
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toISOString(),
        provider
      };
      
      history.unshift(newEntry);
      
      // Mantieni solo gli ultimi 20 entry
      const trimmedHistory = history.slice(0, 20);
      await StorageService.setSetting('syncHistory', trimmedHistory);
      
      DEBUG.log('📝 Aggiunta alla cronologia:', message);
    } catch (error) {
      DEBUG.error('Errore aggiunta cronologia sync:', error);
    }
  };

  const checkForSyncConflicts = async () => {
    try {
      setProgress({ show: true, value: 0, text: 'Controllo conflitti di sincronizzazione...' });
      
      // Controlla se ci sono dati locali
      const localApps = await StorageService.getAllApps();
      const hasLocalData = localApps && localApps.length > 0;
      
      if (!hasLocalData) {
        // Nessun dato locale, prova a scaricare da remoto
        await downloadDataIfAvailable();
        return;
      }

      // Controlla se ci sono dati remoti
      let remoteData = null;
      let hasRemoteData = false;

      try {
        if (provider === 'googledrive') {
          remoteData = await googleService.downloadSyncData();
          hasRemoteData = remoteData && remoteData.data && remoteData.data.data && remoteData.data.data.apps;
        } else if (provider === 'github') {
          if (gistId) {
            remoteData = await githubService.downloadSyncData(gistId);
            hasRemoteData = remoteData && remoteData.data && remoteData.data.data && remoteData.data.data.apps;
          }
        }
      } catch (error) {
        DEBUG.warn('Nessun dato remoto trovato o errore download:', error.message);
        hasRemoteData = false;
      }

      setProgress({ show: false, value: 100, text: '' });

      if (hasRemoteData) {
        // Conflitto rilevato - mostra modal di risoluzione
        setConflictData({
          localData: localApps,
          remoteData: remoteData,
          provider: provider
        });
        setConflictModalOpen(true);
      } else {
        // Nessun conflitto, solo dati locali
        setSuccess('Sincronizzazione abilitata! Solo dati locali presenti.');
      }

    } catch (error) {
      DEBUG.error('Errore controllo conflitti:', error);
      setProgress({ show: false, value: 0, text: '' });
      setSuccess('Sincronizzazione abilitata! Errore nel controllo conflitti, dati locali preservati.');
    }
  };

  const downloadDataIfAvailable = async () => {
    try {
      setProgress({ show: true, value: 30, text: 'Scaricamento dati da remoto...' });
      
      let result = null;
      if (provider === 'googledrive') {
        result = await googleService.downloadSyncData();
      } else if (provider === 'github' && gistId) {
        result = await githubService.downloadSyncData(gistId);
      }

      if (result && result.data && result.data.data && result.data.data.apps) {
        await StorageService.importData(result.data);
        setProgress({ show: false, value: 100, text: '' });
        setSuccess(`Sincronizzazione abilitata e dati scaricati da ${provider === 'github' ? 'GitHub' : 'Google Drive'}!`);
        await addToSyncHistory('sync', `Dati scaricati automaticamente da ${provider}`);
      } else {
        setProgress({ show: false, value: 100, text: '' });
        setSuccess(`Sincronizzazione abilitata! Nessun dato trovato su ${provider === 'github' ? 'GitHub' : 'Google Drive'}.`);
      }
    } catch (error) {
      DEBUG.warn('Errore download automatico:', error);
      setProgress({ show: false, value: 100, text: '' });
      setSuccess('Sincronizzazione abilitata! Errore nel download automatico dei dati.');
    }
  };

  const handleConflictResolution = async (resolution) => {
    try {
      setProgress({ show: true, value: 0, text: 'Risoluzione conflitto in corso...' });

      if (resolution === 'download') {
        // Sostituisci dati locali con quelli remoti
        setProgress({ show: true, value: 50, text: 'Importazione dati da remoto...' });
        await StorageService.importData(conflictData.remoteData.data);
        setSuccess(`Dati locali sostituiti con quelli da ${provider === 'github' ? 'GitHub' : 'Google Drive'}!`);
        await addToSyncHistory('sync', `Conflitto risolto: importati dati da ${provider}`);
      } else if (resolution === 'upload') {
        // Sostituisci dati remoti con quelli locali
        setProgress({ show: true, value: 50, text: 'Caricamento dati locali...' });
        const localData = await StorageService.exportAllData();
        
        if (provider === 'googledrive') {
          await googleService.uploadSyncData(localData);
        } else if (provider === 'github') {
          await githubService.uploadSyncData(localData, gistId);
        }
        
        setSuccess(`Dati da ${provider === 'github' ? 'GitHub' : 'Google Drive'} sostituiti con quelli locali!`);
        await addToSyncHistory('sync', `Conflitto risolto: caricati dati locali su ${provider}`);
      }

      setProgress({ show: false, value: 100, text: '' });
      setConflictData(null);

    } catch (error) {
      DEBUG.error('Errore risoluzione conflitto:', error);
      setError(`Errore durante la risoluzione del conflitto: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  const enableSync = async () => {
    try {
      setProgress({ show: true, value: 0, text: 'Abilitazione sincronizzazione...' });
      
      // Verifica che il provider sia autenticato
      const currentProvider = provider;
      let isAuthenticated = false;

      if (currentProvider === 'github') {
        const token = credentials.github.token;
        if (!token) throw new Error('Token GitHub richiesto');
        
        await githubService.authenticate(token);
        isAuthenticated = await githubService.isAuthenticated();
      } else if (currentProvider === 'googledrive') {
        const clientId = credentials.googledrive.clientId;
        if (!clientId) throw new Error('Client ID Google richiesto');
        
        googleService.configure(clientId, credentials.googledrive.clientSecret);
        isAuthenticated = await googleService.checkAuthentication();
      }

      if (!isAuthenticated) {
        throw new Error(`Autenticazione ${currentProvider} richiesta`);
      }

      // Salva configurazione
      await StorageService.setSetting('syncProvider', currentProvider);
      await StorageService.setSetting('syncCredentials', credentials);
      await StorageService.setSetting('syncEnabled', true);
      setIsEnabled(true);
      
      setProgress({ show: false, value: 100, text: '' });
      setSetupMode(false);
      setSuccess(`Sincronizzazione abilitata con ${currentProvider}! Usa i pulsanti sotto per sincronizzare manualmente.`);
      
      await addToSyncHistory('info', `Sincronizzazione abilitata con ${currentProvider}`);
      
    } catch (error) {
      DEBUG.error('Errore abilitazione sync:', error);
      setError(`Errore abilitazione sincronizzazione: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  const disableSync = async () => {
    try {
      await StorageService.setSetting('syncEnabled', false);
      setIsEnabled(false);
      setSuccess('Sincronizzazione disabilitata');
      await addToSyncHistory('info', 'Sincronizzazione disabilitata');
    } catch (error) {
      DEBUG.error('Errore disabilitazione sync:', error);
      setError(`Errore disabilitazione sincronizzazione: ${error.message}`);
    }
  };

  const performSync = async (direction = 'bidirectional') => {
    try {
      setProgress({ show: true, value: 0, text: 'Sincronizzazione in corso...' });
      setError(null);

      let result;
      
      if (direction === 'bidirectional') {
        // Usa il nuovo metodo syncBidirectional per sincronizzazione intelligente
        if (provider === 'github') {
          await githubService.authenticate(credentials.github.token);
          result = await githubService.syncBidirectional();
        } else if (provider === 'googledrive') {
          googleService.configure(credentials.googledrive.clientId, credentials.googledrive.clientSecret);
          result = await googleService.syncBidirectional();
        }
      } else {
        // Usa i metodi individuali per upload/download
        if (provider === 'github') {
          await performGitHubSync(direction);
        } else if (provider === 'googledrive') {
          await performGoogleDriveSync(direction);
        }
      }

      setProgress({ show: false, value: 100, text: '' });
      
      if (result && result.message) {
        setSuccess(result.message);
      } else {
        setSuccess(`Sincronizzazione ${direction} completata con successo!`);
      }
      
      await addToSyncHistory('sync', `Sincronizzazione ${direction} completata`);

    } catch (error) {
      DEBUG.error('Errore sincronizzazione:', error);
      setError(`Errore sincronizzazione: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
      await addToSyncHistory('error', `Errore sincronizzazione: ${error.message}`);
    }
  };

  const performGitHubSync = async (direction) => {
    const token = credentials.github.token;
    if (!token) throw new Error('Token GitHub richiesto');
    
    await githubService.authenticate(token);
    
    if (direction === 'upload' || direction === 'bidirectional') {
      setProgress({ show: true, value: 30, text: 'Caricamento dati su GitHub...' });
      const data = await StorageService.exportAllData();
      const result = await githubService.uploadSyncData(data, gistId);
      
      if (result.gistId && !gistId) {
        setGistId(result.gistId);
        await StorageService.setSetting('githubGistId', result.gistId);
      }
    }
    
    if (direction === 'download' || direction === 'bidirectional') {
      setProgress({ show: true, value: 70, text: 'Scaricamento dati da GitHub...' });
      if (gistId) {
        const result = await githubService.downloadSyncData(gistId);
        if (result.data) {
          await StorageService.importData(result.data);
        }
      }
    }
  };

  const performGoogleDriveSync = async (direction) => {
    const clientId = credentials.googledrive.clientId;
    if (!clientId) throw new Error('Client ID Google richiesto');
    
    googleService.configure(clientId, credentials.googledrive.clientSecret);
    
    // Verifica autenticazione
    const isAuthenticated = await googleService.checkAuthentication();
    if (!isAuthenticated) {
      throw new Error('Autenticazione Google Drive richiesta');
    }
    
    if (direction === 'upload' || direction === 'bidirectional') {
      setProgress({ show: true, value: 30, text: 'Caricamento dati su Google Drive...' });
      const data = await StorageService.exportAllData();
      await googleService.uploadSyncData(data);
    }
    
    if (direction === 'download' || direction === 'bidirectional') {
      setProgress({ show: true, value: 70, text: 'Scaricamento dati da Google Drive...' });
      const result = await googleService.downloadSyncData();
      if (result.data) {
        await StorageService.importData(result.data);
      }
    }
  };

  const createBackup = async () => {
    try {
      setProgress({ show: true, value: 0, text: 'Creazione backup...' });
      
      const data = await StorageService.exportAllData();
      const backupId = await ErrorHandler.createBackup('Manual Backup', data);
      
      setProgress({ show: false, value: 100, text: '' });
      setSuccess(`Backup creato: ${backupId}`);
      await addToSyncHistory('backup', `Backup creato: ${backupId}`);
      
    } catch (error) {
      DEBUG.error('Errore creazione backup:', error);
      setError(`Errore creazione backup: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  const addToHistory = (type, message) => {
    // Implementazione placeholder per compatibilità
    addToSyncHistory(type, message);
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'sync':
        return <SyncIcon color="primary" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      case 'backup':
        return <BackupIcon color="success" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'sync':
        return 'primary';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'backup':
        return 'success';
      default:
        return 'success';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px',
          maxHeight: '90vh',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SyncIcon />
          <Typography variant="h6">Gestione Sincronizzazione</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {progress.show && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {progress.text}
            </Typography>
            <LinearProgress variant="determinate" value={progress.value} />
          </Box>
        )}

        {/* Stato Sincronizzazione */}
        <Card sx={{ mb: 3, background: theme.palette.background.default, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              Stato Sincronizzazione
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                label={isEnabled ? 'Abilitata' : 'Disabilitata'}
                color={isEnabled ? 'success' : 'default'}
                icon={isEnabled ? <CheckIcon /> : <WarningIcon />}
              />
              <Chip 
                label={provider === 'github' ? 'GitHub Gist' : 'Google Drive'}
                icon={provider === 'github' ? <GitHubIcon /> : <GoogleIcon />}
              />
              {lastSync && (
                <Chip 
                  label={`Ultimo sync: ${
                    (typeof lastSync === 'string' ? new Date(lastSync) : lastSync).toLocaleDateString()
                  }`}
                  variant="outlined"
                />
              )}
              {/* Stato autenticazione */}
              {provider === 'github' && (
                <Chip 
                  label={authenticationStatus.github ? 'GitHub Autenticato' : 'GitHub Non Autenticato'}
                  color={authenticationStatus.github ? 'success' : 'warning'}
                  icon={authenticationStatus.github ? <CheckIcon /> : <WarningIcon />}
                  variant="outlined"
                />
              )}
              {provider === 'googledrive' && (
                <Chip 
                  label={authenticationStatus.googledrive ? 'Google Drive Autenticato' : 'Google Drive Non Autenticato'}
                  color={authenticationStatus.googledrive ? 'success' : 'warning'}
                  icon={authenticationStatus.googledrive ? <CheckIcon /> : <WarningIcon />}
                  variant="outlined"
                />
              )}
            </Box>

            {!isEnabled && (
              <Button
                variant="contained"
                startIcon={<SettingsIcon />}
                onClick={() => setSetupMode(true)}
                sx={{ mr: 1 }}
              >
                Configura Sincronizzazione
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Setup Sincronizzazione */}
        {setupMode && (
          <Card sx={{ mb: 3, background: theme.palette.background.default, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configura Sincronizzazione
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Scegli Provider
                </Typography>
                <RadioGroup
                  value={provider}
                  onChange={handleProviderChange}
                  row
                >
                  <FormControlLabel
                    value="github"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GitHubIcon />
                        GitHub Gist
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="googledrive"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GoogleIcon />
                        Google Drive
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Configurazione GitHub */}
              {provider === 'github' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Configurazione GitHub
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      📝 Per utilizzare GitHub Gist, devi creare un Personal Access Token
                    </Typography>
                    <Typography variant="caption" display="block">
                      1. Vai su <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">GitHub Settings → Tokens</a><br/>
                      2. Clicca "Generate new token (classic)"<br/>
                      3. Seleziona lo scope "gist"<br/>
                      4. Copia il token e incollalo qui sotto
                    </Typography>
                  </Alert>
                  
                  <TextField
                    fullWidth
                    label="Personal Access Token"
                    type="password"
                    value={credentials.github.token}
                    onChange={(e) => handleCredentialChange('github', 'token', e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    helperText="Il token verrà salvato localmente in modo sicuro"
                    sx={{ mb: 2 }}
                  />
                  
                  {gistId && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        📋 Gist ID configurato: {gistId}
                      </Typography>
                      <Typography variant="caption" display="block">
                        I dati verranno sincronizzati con questo Gist specifico
                      </Typography>
                    </Alert>
                  )}
                  
                  <Button
                    variant="outlined"
                    onClick={testConnection}
                    disabled={!credentials.github.token}
                    startIcon={<GitHubIcon />}
                  >
                    Test Connessione GitHub
                  </Button>
                </Box>
              )}

              {/* Configurazione Google Drive */}
              {provider === 'googledrive' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Configurazione Google Drive
                  </Typography>
                  
                  {credentials.googledrive.clientId ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        ✅ Credenziali Google Drive pre-configurate
                      </Typography>
                      <Typography variant="caption" display="block">
                        Client ID: {credentials.googledrive.clientId.substring(0, 10)}...
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        ⚠️ Credenziali Google Drive non configurate
                      </Typography>
                      <Typography variant="caption" display="block">
                        VITE_GOOGLE_CLIENT_ID non trovato. Controlla le variabili d'ambiente.
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Debug: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Presente' : 'Mancante'}
                      </Typography>
                    </Alert>
                  )}
                  
                  {authenticationStatus.googledrive && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        ✅ Google Drive autenticato
                      </Typography>
                      <Typography variant="caption" display="block">
                        Pronto per la sincronizzazione
                      </Typography>
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={authenticateGoogleDrive}
                      disabled={!credentials.googledrive.clientId}
                      startIcon={<LoginIcon />}
                    >
                      Autentica Google Drive
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={testConnection}
                      disabled={!credentials.googledrive.clientId}
                      startIcon={<GoogleIcon />}
                    >
                      Test Connessione
                    </Button>
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={enableSync}
                  disabled={
                    (provider === 'github' && !credentials.github.token) ||
                    (provider === 'googledrive' && !credentials.googledrive.clientId)
                  }
                >
                  Abilita Sincronizzazione
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSetupMode(false)}
                >
                  Annulla
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Azioni Sincronizzazione */}
        {isEnabled && (
          <Card sx={{ mb: 3, background: theme.palette.background.default, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Azioni Sincronizzazione
              </Typography>
              
              {/* Stato Connessione */}
              <Box sx={{ mb: 2 }}>
                {provider === 'github' && (
                  <>
                    <Chip 
                      label={authenticationStatus.github ? 'GitHub Connesso' : 'GitHub Non Connesso'}
                      color={authenticationStatus.github ? 'success' : 'error'}
                      icon={authenticationStatus.github ? <CheckIcon /> : <WarningIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {gistId && (
                      <Chip 
                        label={`Gist: ${gistId.substring(0, 8)}...`}
                        color="info"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </>
                )}
                {provider === 'googledrive' && (
                  <Chip 
                    label={authenticationStatus.googledrive ? 'Google Drive Connesso' : 'Google Drive Non Connesso'}
                    color={authenticationStatus.googledrive ? 'success' : 'error'}
                    icon={authenticationStatus.googledrive ? <CheckIcon /> : <WarningIcon />}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>

              {/* Mostrar azioni solo se autenticato */}
              {((provider === 'github' && authenticationStatus.github) || 
                (provider === 'googledrive' && authenticationStatus.googledrive)) ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      🔄 <strong>Sincronizzazione Intelligente:</strong> La sincronizzazione bidirezionale confronta automaticamente i dati locali e remoti, mantenendo la versione più recente.
                    </Typography>
                  </Alert>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SyncIcon />}
                      onClick={() => performSync('bidirectional')}
                      disabled={isInProgress}
                      sx={{ 
                        minWidth: 200,
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                      }}
                    >
                      Sincronizzazione Intelligente
                    </Button>
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Azioni Avanzate:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => performSync('upload')}
                      disabled={isInProgress}
                    >
                      Solo Upload
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => performSync('download')}
                      disabled={isInProgress}
                    >
                      Solo Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<BackupIcon />}
                      onClick={createBackup}
                    >
                      Crea Backup
                    </Button>
                  </Box>
                </>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ⚠️ <strong>Connessione Richiesta:</strong> Devi prima autenticarti con {provider === 'github' ? 'GitHub' : 'Google Drive'} per utilizzare la sincronizzazione.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {provider === 'github' ? (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setSetupMode(true)}
                        startIcon={<GitHubIcon />}
                      >
                        Configura GitHub
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={authenticateGoogleDrive}
                        disabled={!credentials.googledrive.clientId}
                        startIcon={<GoogleIcon />}
                      >
                        Autentica Google Drive
                      </Button>
                    )}
                  </Box>
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={disableSync}
                >
                  Disabilita Sync
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Cronologia Sincronizzazioni */}
        <Card sx={{ background: theme.palette.background.default, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              Cronologia Sincronizzazioni
            </Typography>
            
            {syncHistory.length > 0 ? (
              <List dense>
                {syncHistory.map((entry) => (
                  <ListItem key={entry.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getStatusIcon(entry.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.message}
                      secondary={new Date(entry.timestamp).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nessuna sincronizzazione effettuata
              </Typography>
            )}
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Chiudi
        </Button>
      </DialogActions>

      {/* Modal di gestione conflitti */}
      <SyncConflictModal
        open={conflictModalOpen}
        onClose={() => {
          setConflictModalOpen(false);
          setConflictData(null);
        }}
        localData={conflictData?.localData}
        remoteData={conflictData?.remoteData}
        provider={conflictData?.provider}
        onResolve={handleConflictResolution}
      />
    </Dialog>
  );
} 