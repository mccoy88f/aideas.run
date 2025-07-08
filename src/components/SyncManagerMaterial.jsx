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
import { useTheme } from '@mui/material/styles';

export default function SyncManagerMaterial({ open, onClose }) {
  const [syncStatus, setSyncStatus] = useState({
    isEnabled: false,
    provider: 'github',
    lastSync: null,
    isInProgress: false,
    autoSync: false
  });

  const [setupMode, setSetupMode] = useState(false);
  const [credentials, setCredentials] = useState({
    github: { token: '' },
    googledrive: { 
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '', 
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '' 
    }
  });

  const [syncHistory, setSyncHistory] = useState([]);
  const [progress, setProgress] = useState({ show: false, value: 0, text: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [gistId, setGistId] = useState(null);

  const [githubService] = useState(new GitHubService());
  const [googleService] = useState(new GoogleDriveService());

  const theme = useTheme();

  useEffect(() => {
    if (open) {
      loadSyncStatus();
      loadSyncHistory();
    }
  }, [open]);

  const loadSyncStatus = async () => {
    try {
      const isEnabled = await StorageService.getSetting('syncEnabled', false);
      const provider = await StorageService.getSetting('syncProvider', 'github');
      const lastSync = await StorageService.getSetting('lastSyncTime', null);
      const autoSync = await StorageService.getSetting('autoSyncEnabled', false);
      const savedGistId = await StorageService.getSetting('githubGistId', null);

      setSyncStatus({
        isEnabled,
        provider,
        lastSync: lastSync ? new Date(lastSync) : null,
        isInProgress: false,
        autoSync
      });

      setGistId(savedGistId);

      // Carica credenziali salvate
      await loadCredentials();
    } catch (error) {
      console.error('Errore caricamento stato sync:', error);
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
      console.error('Errore caricamento credenziali:', error);
    }
  };

  const loadSyncHistory = async () => {
    try {
      const history = await StorageService.getSetting('syncHistory', []);
      setSyncHistory(history.slice(-10)); // Ultimi 10 sync
    } catch (error) {
      console.error('Errore caricamento cronologia:', error);
    }
  };

  const handleProviderChange = (event) => {
    setSyncStatus(prev => ({ ...prev, provider: event.target.value }));
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
      
      const clientId = credentials.googledrive.clientId;
      if (!clientId) throw new Error('Client ID Google richiesto');
      
      googleService.configure(clientId, credentials.googledrive.clientSecret);
      
      const result = await googleService.authenticate(true); // Usa popup
      
      if (result.success) {
        setProgress({ show: false, value: 100, text: '' });
        setSuccess(`Autenticazione Google Drive completata! Benvenuto ${result.user.name}`);
        return true;
      } else {
        throw new Error('Autenticazione fallita');
      }
    } catch (error) {
      console.error('Errore autenticazione Google:', error);
      setError(`Errore autenticazione Google: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
      return false;
    }
  };

  const testConnection = async () => {
    const provider = syncStatus.provider;
    setProgress({ show: true, value: 0, text: 'Test connessione...' });

    try {
      let isConnected = false;

      if (provider === 'github') {
        const token = credentials.github.token;
        if (!token) throw new Error('Token GitHub richiesto');
        
        await githubService.authenticate(token);
        isConnected = await githubService.isAuthenticated();
      } else if (provider === 'googledrive') {
        const clientId = credentials.googledrive.clientId;
        if (!clientId) throw new Error('Client ID Google richiesto');
        
        googleService.configure(clientId, credentials.googledrive.clientSecret);
        isConnected = await googleService.isAuthenticated();
      }

      setProgress({ show: false, value: 100, text: '' });
      
      if (isConnected) {
        setSuccess(`Connessione ${provider} testata con successo!`);
        return true;
      } else {
        throw new Error('Connessione fallita');
      }
    } catch (error) {
      console.error('Errore test connessione:', error);
      setError(`Errore connessione: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
      return false;
    }
  };

  const enableSync = async () => {
    if (!await testConnection()) return;

    try {
      setProgress({ show: true, value: 50, text: 'Abilitazione sincronizzazione...' });

      // Salva credenziali
      await StorageService.setSetting('syncCredentials', credentials);
      await StorageService.setSetting('syncEnabled', true);
      await StorageService.setSetting('syncProvider', syncStatus.provider);

      setSyncStatus(prev => ({ ...prev, isEnabled: true }));
      setProgress({ show: false, value: 100, text: '' });
      setSuccess('Sincronizzazione abilitata con successo!');
      setSetupMode(false);

      // Aggiungi alla cronologia
      addToHistory('enabled', 'Sincronizzazione abilitata');
    } catch (error) {
      console.error('Errore abilitazione sync:', error);
      setError(`Errore abilitazione: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  const disableSync = async () => {
    try {
      await StorageService.setSetting('syncEnabled', false);
      setSyncStatus(prev => ({ ...prev, isEnabled: false }));
      setSuccess('Sincronizzazione disabilitata');
      addToHistory('disabled', 'Sincronizzazione disabilitata');
    } catch (error) {
      console.error('Errore disabilitazione sync:', error);
      setError(`Errore disabilitazione: ${error.message}`);
    }
  };

  const performSync = async (direction = 'bidirectional') => {
    if (syncStatus.isInProgress) {
      setError('Sincronizzazione già in corso');
      return;
    }

    setSyncStatus(prev => ({ ...prev, isInProgress: true }));
    setProgress({ show: true, value: 0, text: 'Preparazione sincronizzazione...' });

    try {
      const provider = syncStatus.provider;
      let result;

      if (provider === 'github') {
        result = await performGitHubSync(direction);
      } else if (provider === 'googledrive') {
        result = await performGoogleDriveSync(direction);
      }

      setProgress({ show: false, value: 100, text: '' });
      setSuccess(`Sincronizzazione completata: ${result.message}`);
      
      // Aggiorna ultimo sync
      const now = new Date();
      await StorageService.setSetting('lastSyncTime', now.toISOString());
      setSyncStatus(prev => ({ ...prev, lastSync: now, isInProgress: false }));

      addToHistory('sync', `Sincronizzazione ${direction}: ${result.message}`);

    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      setError(`Errore sincronizzazione: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
      setSyncStatus(prev => ({ ...prev, isInProgress: false }));
    }
  };

  const performGitHubSync = async (direction) => {
    const token = credentials.github.token;
    if (!token) throw new Error('Token GitHub non configurato');

    await githubService.authenticate(token);
    
    if (direction === 'upload' || direction === 'bidirectional') {
      const data = await StorageService.exportAllData();
      const result = await githubService.uploadSyncData(data, gistId);
      
      // Salva Gist ID per future sincronizzazioni
      if (result.gistId && result.gistId !== gistId) {
        setGistId(result.gistId);
        await StorageService.setSetting('githubGistId', result.gistId);
      }
      
      return { message: 'Dati caricati su GitHub Gist', gistId: result.gistId };
    }
    
    if (direction === 'download' || direction === 'bidirectional') {
      if (!gistId) throw new Error('Gist ID non trovato. Esegui prima un upload.');
      
      const result = await githubService.downloadSyncData(gistId);
      
      // Aggiorna i dati locali con quelli scaricati
      if (result.data && result.data.data && result.data.data.apps) {
        await StorageService.importData(result.data);
        return { message: 'Dati scaricati e aggiornati da GitHub Gist' };
      } else {
        throw new Error('Dati non validi nel Gist');
      }
    }
    
    return { message: 'Sincronizzazione GitHub completata' };
  };

  const performGoogleDriveSync = async (direction) => {
    const clientId = credentials.googledrive.clientId;
    if (!clientId) throw new Error('Client ID Google non configurato');

    if (!await googleService.isAuthenticated()) {
      // Richiedi autenticazione
      await googleService.authenticate();
    }

    if (direction === 'upload' || direction === 'bidirectional') {
      const data = await StorageService.exportAllData();
      const result = await googleService.uploadSyncData(data);
      return { message: 'Dati caricati su Google Drive', fileId: result.syncFile.id };
    }

    if (direction === 'download' || direction === 'bidirectional') {
      const result = await googleService.downloadSyncData();
      
      // Aggiorna i dati locali con quelli scaricati
      if (result.data && result.data.data && result.data.data.apps) {
        await StorageService.importData(result.data);
        return { message: 'Dati scaricati e aggiornati da Google Drive' };
      } else {
        throw new Error('Dati non validi su Google Drive');
      }
    }

    return { message: 'Sincronizzazione Google Drive completata' };
  };

  const createBackup = async () => {
    try {
      setProgress({ show: true, value: 0, text: 'Creazione backup...' });
      
      const backupData = await StorageService.exportAllData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aideas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setProgress({ show: false, value: 100, text: '' });
      setSuccess('Backup creato con successo');
      addToHistory('backup', 'Backup locale creato');
    } catch (error) {
      console.error('Errore creazione backup:', error);
      setError(`Errore backup: ${error.message}`);
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  const addToHistory = (type, message) => {
    const entry = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString()
    };

    setSyncHistory(prev => {
      const newHistory = [entry, ...prev.slice(0, 9)];
      StorageService.setSetting('syncHistory', newHistory);
      return newHistory;
    });
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'enabled':
      case 'sync':
      case 'backup':
        return <CheckIcon color="success" />;
      case 'disabled':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'enabled':
      case 'sync':
      case 'backup':
        return 'success';
      case 'disabled':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
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
                label={syncStatus.isEnabled ? 'Abilitata' : 'Disabilitata'}
                color={syncStatus.isEnabled ? 'success' : 'default'}
                icon={syncStatus.isEnabled ? <CheckIcon /> : <WarningIcon />}
              />
              <Chip 
                label={syncStatus.provider === 'github' ? 'GitHub Gist' : 'Google Drive'}
                icon={syncStatus.provider === 'github' ? <GitHubIcon /> : <GoogleIcon />}
              />
              {syncStatus.lastSync && (
                <Chip 
                  label={`Ultimo sync: ${syncStatus.lastSync.toLocaleDateString()}`}
                  variant="outlined"
                />
              )}
            </Box>

            {!syncStatus.isEnabled && (
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
                  value={syncStatus.provider}
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
              {syncStatus.provider === 'github' && (
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
              {syncStatus.provider === 'googledrive' && (
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
                        Client ID configurato tramite variabili d'ambiente
                      </Typography>
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        ⚠️ Credenziali Google Drive non configurate
                      </Typography>
                      <Typography variant="caption" display="block">
                        Configura VITE_GOOGLE_CLIENT_ID nelle variabili d'ambiente
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
                    (syncStatus.provider === 'github' && !credentials.github.token) ||
                    (syncStatus.provider === 'googledrive' && !credentials.googledrive.clientId)
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
        {syncStatus.isEnabled && (
          <Card sx={{ mb: 3, background: theme.palette.background.default, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Azioni Sincronizzazione
              </Typography>
              
              {syncStatus.provider === 'github' && gistId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    📋 Sincronizzazione con Gist: {gistId}
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SyncIcon />}
                  onClick={() => performSync('bidirectional')}
                  disabled={syncStatus.isInProgress}
                >
                  Sincronizza Ora
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => performSync('upload')}
                  disabled={syncStatus.isInProgress}
                >
                  Solo Upload
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => performSync('download')}
                  disabled={syncStatus.isInProgress}
                >
                  Solo Download
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  onClick={createBackup}
                >
                  Crea Backup
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RestoreIcon />}
                  onClick={() => {/* TODO: Implementa ripristino */}}
                >
                  Ripristina Backup
                </Button>
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
    </Dialog>
  );
} 