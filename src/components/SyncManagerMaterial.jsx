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

export default function SyncManagerMaterial({ open, onClose, onSyncComplete }) {
  const [setupMode, setSetupMode] = useState(false);
  const [credentials, setCredentials] = useState({
    github: { token: '' },
    googledrive: { 
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
      // Non usiamo più client_secret per app web pubbliche
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

  // State per il setup iniziale
  const [firstTimeSetup, setFirstTimeSetup] = useState(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const [githubService] = useState(new GitHubService());
  const [googleService] = useState(() => {
    try {
      return GoogleDriveService.createConfiguredInstance();
    } catch (error) {
      console.warn('Google Drive non configurato:', error.message);
      return new GoogleDriveService(); // Istanza non configurata come fallback
    }
  });

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
      checkFirstTimeSetup();
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
        // Il servizio è già configurato tramite createConfiguredInstance
        newStatus.googledrive = await googleService.checkAuthentication();
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
      
      DEBUG.log('🔐 Avvio autenticazione Google Drive...');
      
      // Il servizio è già configurato tramite createConfiguredInstance
      
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
        
        googleService.configure(clientId);
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
          hasRemoteData = remoteData && remoteData.data && remoteData.data.apps;
        } else if (provider === 'github') {
          if (gistId) {
            remoteData = await githubService.downloadSyncData(gistId);
            hasRemoteData = remoteData && remoteData.data && remoteData.data.apps;
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
          remoteData: remoteData.data, // Ora è direttamente il formato backup
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

      if (result && result.data && result.data.apps) {
        await StorageService.importBackupData(result.data);
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
        
        googleService.configure(clientId);
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
          // Verifica autenticazione prima di sincronizzare
          const isAuthenticated = await googleService.checkAuthentication();
          if (!isAuthenticated) {
            throw new Error('Autenticazione Google Drive richiesta');
          }
          
          DEBUG.log('🔄 Avvio sincronizzazione Google Drive con rilevamento conflitti...');
          
          // Prima prova con rilevamento conflitti
          result = await googleService.syncBidirectional({ conflictResolution: 'ask' });
          
          DEBUG.log('📋 Risultato sincronizzazione Google Drive:', result);
          
          // Se c'è un conflitto, mostra il modal di risoluzione
          if (result.conflict) {
            DEBUG.log('⚠️ Conflitto rilevato, apertura modal:', { 
              isFirstSync: result.isFirstSync, 
              hasLocalData: !!result.localData,
              hasRemoteData: !!result.remoteData 
            });
            
            setProgress({ show: false, value: 0, text: '' });
            setConflictData(result);
            setConflictModalOpen(true);
            return; // Esce dalla funzione, la risoluzione continuerà nel modal
          }
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

      // Notifica il componente principale della sincronizzazione completata
      if (onSyncComplete) {
        await onSyncComplete(result || { message: `Sincronizzazione ${direction} completata con successo!` });
      }

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
      const data = await StorageService.exportBackupData();
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
          await StorageService.importBackupData(result.data);
          
          // Notifica il componente principale del download completato
          if (onSyncComplete) {
            await onSyncComplete({ 
              message: `Dati scaricati da GitHub (${result.data.apps?.length || 0} app)` 
            });
          }
        }
      }
    }
  };

  const performGoogleDriveSync = async (direction) => {
    try {
      const clientId = credentials.googledrive.clientId;
      if (!clientId) throw new Error('Client ID Google richiesto');
      
      googleService.configure(clientId);
      
      // Verifica autenticazione
      const isAuthenticated = await googleService.checkAuthentication();
      if (!isAuthenticated) {
        throw new Error('Autenticazione Google Drive richiesta');
      }
      
      if (direction === 'upload') {
        setProgress({ show: true, value: 30, text: 'Caricamento dati su Google Drive...' });
        const data = await StorageService.exportBackupData();
        await googleService.uploadSyncData(data);
        setProgress({ show: false, value: 100, text: '' });
        setSuccess('Dati caricati su Google Drive con successo!');
      } else if (direction === 'download') {
        setProgress({ show: true, value: 70, text: 'Scaricamento dati da Google Drive...' });
        const result = await googleService.downloadSyncData();
        if (result && result.data) {
          await StorageService.importBackupData(result.data);
        }
        setProgress({ show: false, value: 100, text: '' });
        setSuccess('Dati scaricati da Google Drive con successo!');
      } else if (direction === 'bidirectional') {
        setProgress({ show: true, value: 0, text: 'Sincronizzazione bidirezionale...' });
        
        try {
          const result = await googleService.syncBidirectional();
          setProgress({ show: false, value: 100, text: '' });
          setSuccess(`Sincronizzazione completata! ${result.appsCount} app sincronizzate.`);
          
          // Notifica il completamento
          if (onSyncComplete) {
            onSyncComplete(result);
          }
        } catch (error) {
          if (error.message === 'FIRST_TIME_SETUP_REQUIRED') {
            // Gestisci il primo avvio
            setProgress({ show: false, value: 0, text: '' });
            
            // Controlla il setup iniziale
            const setup = await googleService.checkFirstTimeSetup();
            if (setup.isFirstTime && setup.hasBackup) {
              setFirstTimeSetup(setup);
              setSetupModalOpen(true);
              return;
            }
          } else {
            throw error;
          }
        }
      }
      
      // Ricarica lo stato della sincronizzazione
      await loadSyncStatus();
      
    } catch (error) {
      DEBUG.error('❌ Errore sincronizzazione Google Drive:', error);
      setError(`Errore sincronizzazione Google Drive: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
      
      // Aggiungi alla cronologia
      await addToSyncHistory('error', `Errore sincronizzazione Google Drive: ${error.message}`);
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

  const handleConflictResolution = async (resolution) => {
    try {
      setProgress({ show: true, value: 0, text: 'Risoluzione conflitto in corso...' });
      setConflictModalOpen(false);

      let result;

      if (resolution === 'cancel') {
        // Prima sincronizzazione: mantieni solo locale, non sincronizzare
        setProgress({ show: false, value: 100, text: '' });
        setSuccess('Sincronizzazione annullata. I dati rimangono solo locali.');
        setConflictData(null);
        await addToSyncHistory('info', 'Prima sincronizzazione annullata: dati mantenuti solo locali');
        // Non chiamare onSyncComplete qui perché non ci sono stati cambiamenti
        return;
      }

      if (resolution === 'local') {
        // Usa dati locali
        setProgress({ show: true, value: 50, text: 'Caricamento dati locali...' });
        
        if (provider === 'googledrive') {
          result = await googleService.syncBidirectional({ conflictResolution: 'local' });
        } else if (provider === 'github') {
          const localData = await StorageService.exportBackupData();
          result = await githubService.uploadSyncData(localData, gistId);
        }
        
        setSuccess('Dati locali caricati con successo!');
        await addToSyncHistory('sync', `Conflitto risolto: usati dati locali`);
        
      } else if (resolution === 'remote') {
        // Usa dati remoti
        setProgress({ show: true, value: 50, text: 'Importazione dati remoti...' });
        
        if (provider === 'googledrive') {
          result = await googleService.syncBidirectional({ conflictResolution: 'remote' });
        } else if (provider === 'github') {
          if (gistId) {
            const remoteResult = await githubService.downloadSyncData(gistId);
            if (remoteResult.data) {
              await StorageService.importBackupData(remoteResult.data);
            }
          }
        }
        
        setSuccess('Dati remoti importati con successo!');
        await addToSyncHistory('sync', `Conflitto risolto: usati dati remoti`);
        
      } else if (resolution === 'merge') {
        // Unisci dati usando la logica granulare migliorata
        setProgress({ show: true, value: 50, text: 'Unione intelligente dati in corso...' });
        
        if (provider === 'googledrive') {
          // Usa la nuova logica granulare del GoogleDriveService
          result = await googleService.syncBidirectional({ 
            conflictResolution: 'merge',
            mergeOptions: {
              preferLocal: true,  // Privilegi i dati locali in caso di conflitto
              preferRemoteSettings: false  // Usa impostazioni locali
            }
          });
        } else if (provider === 'github') {
          // Usa il metodo legacy per GitHub
          const mergedData = await mergeConflictData(conflictData);
          result = await githubService.uploadSyncData(mergedData, gistId);
          await StorageService.importBackupData(mergedData);
        }
        
        setSuccess('Dati combinati intelligentemente con successo!');
        await addToSyncHistory('sync', `Conflitto risolto: dati combinati intelligentemente`);
      }

      setProgress({ show: false, value: 100, text: '' });
      setConflictData(null);

      // Notifica il componente principale della sincronizzazione completata
      // Solo se ci sono stati cambiamenti effettivi (non per 'cancel')
      if (onSyncComplete && result) {
        await onSyncComplete(result);
      }

    } catch (error) {
      DEBUG.error('Errore risoluzione conflitto:', error);
      setError(`Errore durante la risoluzione del conflitto: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  // Funzione per unire i dati in caso di conflitto (legacy per GitHub)
  const mergeConflictData = async (conflictData) => {
    const { localData, remoteData, appComparison } = conflictData;
    
    // Se abbiamo il confronto granulare, usalo
    if (appComparison) {
      return mergeConflictDataGranular(localData, remoteData, appComparison);
    }
    
    // Fallback per compatibilità con il metodo legacy
    return mergeConflictDataLegacy(localData, remoteData);
  };

  // Funzione per unire i dati usando il confronto granulare
  const mergeConflictDataGranular = async (localData, remoteData, appComparison) => {
    const mergedData = {
      version: localData.version || remoteData.version || '1.0.0',
      timestamp: new Date().toISOString(),
      settings: {
        ...remoteData.settings,
        ...localData.settings // I dati locali hanno precedenza per le impostazioni
      },
      apps: [],
      appFiles: {}
    };

    // Aggiungi app identiche
    appComparison.identical.forEach(id => {
      const app = localData.apps.find(a => a.id === id);
      if (app) mergedData.apps.push(app);
    });

    // Aggiungi app solo locali
    appComparison.onlyLocal.forEach(app => {
      mergedData.apps.push(app);
    });

    // Aggiungi app solo remote
    appComparison.onlyRemote.forEach(app => {
      mergedData.apps.push(app);
    });

    // Gestisci conflitti: privilegi app locali (più recenti)
    appComparison.conflicts.forEach(conflict => {
      const useLocal = conflict.localTime > conflict.remoteTime;
      mergedData.apps.push(useLocal ? conflict.local : conflict.remote);
    });

    // Unisci i file delle app
    const allAppFiles = {};
    
    // Aggiungi file remoti
    if (remoteData.appFiles) {
      Object.assign(allAppFiles, remoteData.appFiles);
    }
    
    // Sovrascrivi/aggiungi file locali (hanno precedenza)
    if (localData.appFiles) {
      Object.assign(allAppFiles, localData.appFiles);
    }
    
    mergedData.appFiles = allAppFiles;
    
    DEBUG.log('📋 Dati uniti con logica granulare:', {
      apps: mergedData.apps.length,
      onlyLocal: appComparison.onlyLocal.length,
      onlyRemote: appComparison.onlyRemote.length,
      conflicts: appComparison.conflicts.length,
      identical: appComparison.identical.length
    });
    
    return mergedData;
  };

  // Funzione per unire i dati (metodo legacy)
  const mergeConflictDataLegacy = async (localData, remoteData) => {
    const mergedData = {
      version: localData.version || remoteData.version || '1.0.0',
      timestamp: new Date().toISOString(),
      settings: {
        ...remoteData.settings,
        ...localData.settings // I dati locali hanno precedenza per le impostazioni
      },
      apps: [],
      appFiles: {}
    };

    // Unisci le app evitando duplicati per nome
    const appsByName = new Map();
    
    // Aggiungi app remote
    if (remoteData.apps) {
      remoteData.apps.forEach(app => {
        appsByName.set(app.name, { ...app, source: 'remote' });
      });
    }
    
    // Sovrascrivi/aggiungi app locali (hanno precedenza)
    if (localData.apps) {
      localData.apps.forEach(app => {
        appsByName.set(app.name, { ...app, source: 'local' });
      });
    }
    
    mergedData.apps = Array.from(appsByName.values());
    
    // Unisci i file delle app
    const allAppFiles = {};
    
    // Aggiungi file remoti
    if (remoteData.appFiles) {
      Object.assign(allAppFiles, remoteData.appFiles);
    }
    
    // Sovrascrivi/aggiungi file locali (hanno precedenza)
    if (localData.appFiles) {
      Object.assign(allAppFiles, localData.appFiles);
    }
    
    mergedData.appFiles = allAppFiles;
    
    DEBUG.log('📋 Dati uniti con logica legacy:', {
      apps: mergedData.apps.length,
      settings: Object.keys(mergedData.settings).length,
      appFiles: Object.keys(mergedData.appFiles).length
    });
    
    return mergedData;
  };

  const checkFirstTimeSetup = async () => {
    try {
      if (provider === 'googledrive' && googleService) {
        const setup = await googleService.checkFirstTimeSetup();
        if (setup.isFirstTime && setup.hasBackup) {
          setFirstTimeSetup(setup);
          setSetupModalOpen(true);
        }
      }
    } catch (error) {
      DEBUG.error('Errore controllo setup iniziale:', error);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      setProgress({ show: true, value: 0, text: 'Ripristino backup da Google Drive...' });
      
      const result = await googleService.restoreBackup();
      
      setProgress({ show: false, value: 100, text: '' });
      setSuccess(`Backup ripristinato con successo! ${result.data.apps.length} app caricate.`);
      
      setSetupModalOpen(false);
      setFirstTimeSetup(null);
      
      // Ricarica lo stato della sincronizzazione
      await loadSyncStatus();
      
      // Notifica il completamento
      if (onSyncComplete) {
        onSyncComplete({ success: true, action: 'restore', appsCount: result.data.apps.length });
      }
      
    } catch (error) {
      DEBUG.error('Errore ripristino backup:', error);
      setError(`Errore ripristino backup: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  const handleReplaceBackup = async () => {
    try {
      setProgress({ show: true, value: 0, text: 'Sostituzione backup su Google Drive...' });
      
      const result = await googleService.replaceBackup();
      
      setProgress({ show: false, value: 100, text: '' });
      setSuccess('Backup sostituito con successo! I dati locali sono ora su Google Drive.');
      
      setSetupModalOpen(false);
      setFirstTimeSetup(null);
      
      // Ricarica lo stato della sincronizzazione
      await loadSyncStatus();
      
      // Notifica il completamento
      if (onSyncComplete) {
        onSyncComplete({ success: true, action: 'replace' });
      }
      
    } catch (error) {
      DEBUG.error('Errore sostituzione backup:', error);
      setError(`Errore sostituzione backup: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  const handleSkipSetup = () => {
    setSetupModalOpen(false);
    setFirstTimeSetup(null);
    setSuccess('Setup iniziale saltato. Puoi configurare la sincronizzazione in seguito.');
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
                Configurazione Sincronizzazione
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
        conflictData={conflictData}
        onResolve={handleConflictResolution}
        loading={progress.show}
      />

      {/* Dialog di setup iniziale */}
      <Dialog
        open={setupModalOpen}
        onClose={handleSkipSetup}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BackupIcon color="primary" />
          Backup Trovato su Google Drive
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Primo avvio rilevato!</strong> Non ci sono app installate localmente, ma è stato trovato un backup su Google Drive.
            </Typography>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            È stato trovato un backup su Google Drive con <strong>{firstTimeSetup?.backupData?.apps?.length || 0} app</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cosa vuoi fare?
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RestoreIcon />}
              onClick={handleRestoreBackup}
              fullWidth
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Ripristina Backup
                </Typography>
                <Typography variant="caption" color="inherit">
                  Carica le {firstTimeSetup?.backupData?.apps?.length || 0} app dal backup di Google Drive
                </Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleReplaceBackup}
              fullWidth
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Sostituisci Backup
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Sostituisci il backup con i dati locali attuali (nessuna app)
                </Typography>
              </Box>
            </Button>
            
            <Button
              variant="text"
              onClick={handleSkipSetup}
              fullWidth
              sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Box>
                <Typography variant="body1">
                  Salta per ora
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Configura la sincronizzazione in seguito
                </Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
} 