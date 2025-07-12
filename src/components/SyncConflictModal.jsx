import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export default function SyncConflictModal({ 
  open, 
  onClose, 
  localData, 
  remoteData, 
  provider,
  onResolve 
}) {
  const localAppsCount = localData?.length || 0;
  const remoteAppsCount = remoteData?.data?.apps?.length || 0;
  const lastRemoteSync = remoteData?.metadata?.timestamp ? new Date(remoteData.metadata.timestamp) : null;

  const handleResolve = (resolution) => {
    onResolve(resolution);
    onClose();
  };

  const getProviderIcon = () => {
    return provider === 'github' ? '🐙' : '🌐';
  };

  const getProviderName = () => {
    return provider === 'github' ? 'GitHub Gist' : 'Google Drive';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Conflitto di Sincronizzazione Rilevato
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Sono stati trovati dati sia localmente che su {getProviderName()}. 
            Scegli come risolvere il conflitto:
          </Typography>
        </Alert>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {/* Dati Locali */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                📱 Dati Locali
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label={`${localAppsCount} app installate`} 
                  color="primary" 
                  size="small" 
                />
                <Chip 
                  label="Dispositivo corrente" 
                  variant="outlined" 
                  size="small" 
                />
              </Box>

              {localAppsCount > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    App più recenti:
                  </Typography>
                  <List dense>
                    {localData.slice(0, 3).map((app, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={app.name}
                          secondary={app.category || 'Senza categoria'}
                        />
                      </ListItem>
                    ))}
                    {localAppsCount > 3 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`...e altre ${localAppsCount - 3} app`}
                          sx={{ fontStyle: 'italic' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Dati Remoti */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getProviderIcon()} Dati {getProviderName()}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label={`${remoteAppsCount} app salvate`} 
                  color="secondary" 
                  size="small" 
                />
                {lastRemoteSync && (
                  <Chip 
                    label={`Ultimo sync: ${lastRemoteSync.toLocaleDateString()}`}
                    variant="outlined" 
                    size="small" 
                  />
                )}
              </Box>

              {remoteAppsCount > 0 && remoteData.data.apps && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    App salvate:
                  </Typography>
                  <List dense>
                    {remoteData.data.apps.slice(0, 3).map((app, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={app.name}
                          secondary={app.category || 'Senza categoria'}
                        />
                      </ListItem>
                    ))}
                    {remoteAppsCount > 3 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`...e altre ${remoteAppsCount - 3} app`}
                          sx={{ fontStyle: 'italic' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            💡 <strong>Suggerimento:</strong> Se non sei sicuro, scegli "Sostituisci con {getProviderName()}" 
            se vuoi ripristinare un backup precedente, oppure "Sostituisci {getProviderName()}" 
            se vuoi salvare le tue modifiche recenti.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          startIcon={<CancelIcon />}
          color="inherit"
        >
          Annulla
        </Button>
        
        <Button
          onClick={() => handleResolve('download')}
          startIcon={<DownloadIcon />}
          variant="outlined"
          color="secondary"
        >
          Sostituisci con {getProviderName()}
          <Typography variant="caption" sx={{ ml: 1 }}>
            ({remoteAppsCount} app)
          </Typography>
        </Button>
        
        <Button
          onClick={() => handleResolve('upload')}
          startIcon={<UploadIcon />}
          variant="contained"
          color="primary"
        >
          Sostituisci {getProviderName()}
          <Typography variant="caption" sx={{ ml: 1 }}>
            ({localAppsCount} app)
          </Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
} 