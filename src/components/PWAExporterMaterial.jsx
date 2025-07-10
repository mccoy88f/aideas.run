import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Download as DownloadIcon,
  GetApp as GetAppIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Folder as FolderIcon,
  Web as WebIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import PWAExportService from '../services/PWAExportService.js';

/**
 * Componente per esportare app come PWA standalone
 */
export default function PWAExporterMaterial({ open, onClose, apps = [] }) {
  const [exportableApps, setExportableApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const pwaExportService = new PWAExportService();

  useEffect(() => {
    if (open) {
      loadExportableApps();
    }
  }, [open]);

  const loadExportableApps = async () => {
    try {
      setLoading(true);
      const apps = await pwaExportService.getExportableApps();
      setExportableApps(apps);
    } catch (error) {
      console.error('Errore caricamento app esportabili:', error);
      setError('Errore nel caricamento delle app');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPWA = async (appId) => {
    try {
      setExporting(appId);
      setError(null);
      setSuccess(null);

      console.log(`🚀 Esportazione PWA per app ${appId}...`);
      
      // Genera la PWA come ZIP
      const zipBlob = await pwaExportService.exportPWAAsZIP(appId);
      
      // Crea un link per il download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pwa-${exportableApps.find(app => app.id === appId)?.name || 'app'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(`PWA esportata con successo!`);
      console.log('✅ PWA esportata con successo');
      
    } catch (error) {
      console.error('Errore esportazione PWA:', error);
      setError(`Errore nell'esportazione: ${error.message}`);
    } finally {
      setExporting(null);
    }
  };

  const getAppTypeIcon = (type) => {
    switch (type) {
      case 'zip':
        return <FolderIcon />;
      case 'url':
        return <WebIcon />;
      case 'html':
        return <CodeIcon />;
      default:
        return <WebIcon />;
    }
  };

  const getAppTypeLabel = (type) => {
    switch (type) {
      case 'zip':
        return 'App ZIP';
      case 'url':
        return 'URL Esterno';
      case 'html':
        return 'HTML';
      default:
        return 'App';
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setExporting(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GetAppIcon color="primary" />
          <Typography variant="h6">
            Esporta App come PWA
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Esporta le tue app come Progressive Web App (PWA) standalone. 
          Ogni PWA includerà manifest, service worker e tutti i file necessari.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              App Disponibili ({exportableApps.length})
            </Typography>

            {exportableApps.length === 0 ? (
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <InfoIcon color="info" />
                    <Typography>
                      Nessuna app disponibile per l'esportazione PWA.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <List>
                {exportableApps.map((app) => (
                  <React.Fragment key={app.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getAppTypeIcon(app.type)}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {app.name}
                            </Typography>
                            <Chip 
                              label={getAppTypeLabel(app.type)} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {app.description || 'Nessuna descrizione'}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              {app.tags?.map((tag, index) => (
                                <Chip 
                                  key={index} 
                                  label={tag} 
                                  size="small" 
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        <Button
                          variant="contained"
                          startIcon={exporting === app.id ? <CircularProgress size={16} /> : <DownloadIcon />}
                          onClick={() => handleExportPWA(app.id)}
                          disabled={exporting === app.id}
                          size="small"
                        >
                          {exporting === app.id ? 'Esportando...' : 'Esporta PWA'}
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
} 