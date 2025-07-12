import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  CloudDownload as CloudIcon,
  Storage as LocalIcon,
  Merge as MergeIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Modal per la risoluzione dei conflitti di sincronizzazione
 * Mostra le differenze tra dati locali e remoti e permette all'utente di scegliere
 */
export default function SyncConflictModal({ 
  open, 
  onClose, 
  conflictData, 
  onResolve, 
  loading = false 
}) {
  const [selectedResolution, setSelectedResolution] = useState(null);

  if (!conflictData) return null;

  const { 
    localData, 
    remoteData, 
    localTimestamp, 
    remoteTimestamp, 
    isFirstSync, 
    isFirstDeviceSync,
    appComparison 
  } = conflictData;

  // Statistiche dei dati
  const localStats = {
    apps: localData?.apps?.length || 0,
    settings: localData?.settings ? Object.keys(localData.settings).length : 0,
    timestamp: new Date(localTimestamp),
    version: localData?.version || 'N/A'
  };

  const remoteStats = {
    apps: remoteData?.apps?.length || 0,
    settings: remoteData?.settings ? Object.keys(remoteData.settings).length : 0,
    timestamp: remoteTimestamp ? new Date(remoteTimestamp) : null,
    version: remoteData?.version || 'N/A'
  };

  // Differenze nelle app (usa appComparison se disponibile, altrimenti calcola manualmente)
  const getAppDifferences = () => {
    if (appComparison) {
      return {
        onlyLocal: appComparison.onlyLocal.map(app => app.name),
        onlyRemote: appComparison.onlyRemote.map(app => app.name),
        common: appComparison.identical.map(id => {
          const app = localData?.apps?.find(a => a.id === id);
          return app ? app.name : id;
        }),
        conflicts: appComparison.conflicts
      };
    }
    
    // Fallback per compatibilità
    const localApps = new Set((localData?.apps || []).map(app => app.name));
    const remoteApps = new Set((remoteData?.apps || []).map(app => app.name));
    
    const onlyLocal = [...localApps].filter(name => !remoteApps.has(name));
    const onlyRemote = [...remoteApps].filter(name => !localApps.has(name));
    const common = [...localApps].filter(name => remoteApps.has(name));

    return { onlyLocal, onlyRemote, common, conflicts: [] };
  };

  const appDiffs = getAppDifferences();

  const handleResolve = (resolution) => {
    setSelectedResolution(resolution);
    onResolve(resolution);
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(timestamp, { 
        addSuffix: true, 
        locale: it 
      });
    } catch (error) {
      return timestamp.toLocaleString('it-IT');
    }
  };

  // Determina il tipo di sincronizzazione
  const getModalTitle = () => {
    if (isFirstSync) return 'Prima Sincronizzazione';
    if (isFirstDeviceSync) return 'Prima Sincronizzazione Dispositivo';
    return 'Conflitto di Sincronizzazione Rilevato';
  };

  const getModalDescription = () => {
    if (isFirstSync) {
      return 'Hai app installate localmente ma Google Drive è vuoto. Scegli se caricare i dati locali su Google Drive o mantenere solo i dati locali.';
    }
    if (isFirstDeviceSync) {
      return 'Hai attivato la sincronizzazione dopo aver installato app, ma Google Drive contiene già dei dati. Scegli come combinare i dati locali con quelli di Google Drive.';
    }
    return 'Sono stati rilevati dati sia locali che remoti con modifiche recenti. Scegli quale versione mantenere o unisci i dati.';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            {getModalTitle()}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity={isFirstSync || isFirstDeviceSync ? "info" : "warning"} sx={{ mb: 3 }}>
          <Typography variant="body2">
            {getModalDescription()}
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Statistiche Generali */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Confronto Dati
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Aspetto</TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <LocalIcon fontSize="small" />
                        Locale
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <CloudIcon fontSize="small" />
                        Google Drive
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Numero App</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={localStats.apps} 
                        color={localStats.apps > remoteStats.apps ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={remoteStats.apps} 
                        color={remoteStats.apps > localStats.apps ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Impostazioni</TableCell>
                    <TableCell align="center">
                      <Chip label={localStats.settings} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={remoteStats.settings} size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ultima Modifica</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatTime(localStats.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {(isFirstSync || !remoteStats.timestamp) ? 'Mai sincronizzato' : formatTime(remoteStats.timestamp)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Versione</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{localStats.version}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{remoteStats.version}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Dettagli Granulari delle Differenze */}
          {appComparison && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Dettagli Differenze App
              </Typography>
              
              <Grid container spacing={2}>
                {appDiffs.onlyLocal.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          <LocalIcon fontSize="small" sx={{ mr: 1 }} />
                          Solo in Locale ({appDiffs.onlyLocal.length})
                        </Typography>
                        <Box>
                          {appDiffs.onlyLocal.map((appName, index) => (
                            <Chip 
                              key={index} 
                              label={appName} 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }}
                              color="primary"
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {appDiffs.onlyRemote.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="secondary" gutterBottom>
                          <CloudIcon fontSize="small" sx={{ mr: 1 }} />
                          Solo in Google Drive ({appDiffs.onlyRemote.length})
                        </Typography>
                        <Box>
                          {appDiffs.onlyRemote.map((appName, index) => (
                            <Chip 
                              key={index} 
                              label={appName} 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }}
                              color="secondary"
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {appDiffs.conflicts.length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="warning" gutterBottom>
                          <WarningIcon fontSize="small" sx={{ mr: 1 }} />
                          App con Conflitti ({appDiffs.conflicts.length})
                        </Typography>
                        <Box>
                          {appDiffs.conflicts.map((conflict, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Chip 
                                label={conflict.local.name} 
                                size="small" 
                                color="warning"
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                (Locale: {formatTime(new Date(conflict.localTime))}, 
                                Remote: {formatTime(new Date(conflict.remoteTime))})
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {appDiffs.common.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>App identiche:</strong> {appDiffs.common.length} app presenti in entrambe le versioni senza conflitti
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}

          {/* Differenze nelle App (legacy per compatibilità) */}
          {!appComparison && !isFirstSync && (appDiffs.onlyLocal.length > 0 || appDiffs.onlyRemote.length > 0) && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Differenze nelle App
              </Typography>
              
              <Grid container spacing={2}>
                {appDiffs.onlyLocal.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          <LocalIcon fontSize="small" sx={{ mr: 1 }} />
                          Solo in Locale ({appDiffs.onlyLocal.length})
                        </Typography>
                        <Box>
                          {appDiffs.onlyLocal.map((appName, index) => (
                            <Chip 
                              key={index} 
                              label={appName} 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }}
                              color="primary"
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {appDiffs.onlyRemote.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="secondary" gutterBottom>
                          <CloudIcon fontSize="small" sx={{ mr: 1 }} />
                          Solo in Google Drive ({appDiffs.onlyRemote.length})
                        </Typography>
                        <Box>
                          {appDiffs.onlyRemote.map((appName, index) => (
                            <Chip 
                              key={index} 
                              label={appName} 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }}
                              color="secondary"
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {appDiffs.common.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>App in comune:</strong> {appDiffs.common.length} app presenti in entrambe le versioni
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isFirstSync || isFirstDeviceSync ? 'Scegli Azione' : 'Scegli Risoluzione'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isFirstSync 
                ? 'Vuoi caricare i tuoi dati locali su Google Drive?'
                : isFirstDeviceSync
                ? 'Come vuoi combinare i dati locali con quelli di Google Drive?'
                : 'Seleziona come vuoi risolvere il conflitto:'
              }
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={(isFirstSync || isFirstDeviceSync) ? 6 : 4}>
            <Button
              fullWidth
              variant={selectedResolution === 'local' ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<LocalIcon />}
              onClick={() => handleResolve('local')}
              disabled={loading}
              sx={{ minHeight: 56 }}
            >
              <Box textAlign="center">
                <Typography variant="body2" fontWeight="bold">
                  {isFirstSync ? 'Carica su Google Drive' : 'Usa Solo Locale'}
                </Typography>
                <Typography variant="caption">
                  {isFirstSync ? `${localStats.apps} app → Google Drive` : `${localStats.apps} app locali`}
                </Typography>
              </Box>
            </Button>
          </Grid>

          {!isFirstSync && (
            <Grid item xs={12} md={isFirstDeviceSync ? 6 : 4}>
              <Button
                fullWidth
                variant={selectedResolution === 'remote' ? 'contained' : 'outlined'}
                color="secondary"
                startIcon={<CloudIcon />}
                onClick={() => handleResolve('remote')}
                disabled={loading}
                sx={{ minHeight: 56 }}
              >
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold">
                    Usa Solo Google Drive
                  </Typography>
                  <Typography variant="caption">
                    {remoteStats.apps} app remote
                  </Typography>
                </Box>
              </Button>
            </Grid>
          )}

          {!isFirstSync && (
            <Grid item xs={12} md={isFirstDeviceSync ? 12 : 4}>
              <Button
                fullWidth
                variant={selectedResolution === 'merge' ? 'contained' : 'outlined'}
                color="info"
                startIcon={<MergeIcon />}
                onClick={() => handleResolve('merge')}
                disabled={loading}
                sx={{ minHeight: 56 }}
              >
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold">
                    Combina Intelligentemente
                  </Typography>
                  <Typography variant="caption">
                    {appDiffs.onlyLocal.length + appDiffs.onlyRemote.length + appDiffs.common.length} app totali
                  </Typography>
                </Box>
              </Button>
            </Grid>
          )}

          {isFirstSync && (
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant={selectedResolution === 'cancel' ? 'contained' : 'outlined'}
                color="secondary"
                startIcon={<CancelIcon />}
                onClick={() => handleResolve('cancel')}
                disabled={loading}
                sx={{ minHeight: 56 }}
              >
                <Box textAlign="center">
                  <Typography variant="body2" fontWeight="bold">
                    Mantieni solo locale
                  </Typography>
                  <Typography variant="caption">
                    Non sincronizzare
                  </Typography>
                </Box>
              </Button>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between">
              <Button 
                onClick={onClose}
                disabled={loading}
              >
                Annulla
              </Button>
              {loading && (
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  Risoluzione in corso...
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
} 