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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Folder as FolderIcon,
  Code as CodeIcon,
  Style as StyleIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import AppAnalyzer from '../services/AppAnalyzer.js';

/**
 * Modal per visualizzare informazioni dettagliate sull'app
 */
const AppInfoModal = ({ open, onClose, app }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileViewOpen, setFileViewOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    files: false,
    external: false,
    permissions: false,
    security: false
  });

  const analyzer = new AppAnalyzer();

  useEffect(() => {
    if (open && app) {
      analyzeApp();
    }
  }, [open, app]);

  const analyzeApp = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Avvio analisi app:', app.name);
      const result = await analyzer.analyzeApp(app);
      setAnalysis(result);
      console.log('✅ Analisi completata:', result);
    } catch (err) {
      console.error('❌ Errore analisi:', err);
      setError(err.message || 'Errore durante l\'analisi dell\'app');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'html':
        return <CodeIcon color="primary" />;
      case 'script':
        return <CodeIcon color="warning" />;
      case 'style':
        return <StyleIcon color="info" />;
      case 'image':
        return <ImageIcon color="success" />;
      default:
        return <DescriptionIcon color="action" />;
    }
  };

  const getSecurityIcon = (level) => {
    switch (level) {
      case 'risk':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewFile = (file) => {
    setSelectedFile(file);
    setFileViewOpen(true);
  };

  const getPermissionColor = (permission) => {
    const colors = {
      'external-scripts': 'warning',
      'external-styles': 'info',
      'external-images': 'success',
      'api-access': 'error',
      'local-storage': 'primary',
      'geolocation': 'warning',
      'media-devices': 'error',
      'notifications': 'info',
      'iframe-access': 'warning'
    };
    return colors[permission] || 'default';
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      'external-scripts': 'Script esterni',
      'external-styles': 'Stili esterni',
      'external-images': 'Immagini esterne',
      'api-access': 'Accesso API',
      'local-storage': 'Storage locale',
      'geolocation': 'Posizione',
      'media-devices': 'Camera/Microfono',
      'notifications': 'Notifiche',
      'iframe-access': 'Iframe esterni',
      'external-fonts': 'Font esterni',
      'internet-access': 'Accesso internet',
      'external-content': 'Contenuti esterni'
    };
    return labels[permission] || permission;
  };

  if (!app) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '70vh',
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
            <Avatar sx={{ 
              width: 48, 
              height: 48,
              bgcolor: 'primary.main'
            }}>
              {app.icon && app.icon.length === 2 ? app.icon : app.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="h2">
                Informazioni App
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {app.name}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Analisi in corso...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {analysis && (
            <Box>
              {/* Panoramica */}
              <Accordion 
                expanded={expandedSections.overview}
                onChange={() => handleSectionToggle('overview')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Panoramica</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {analysis.summary.totalFiles}
                        </Typography>
                        <Typography variant="body2">File totali</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="secondary.main">
                          {formatFileSize(analysis.summary.totalSize || 0)}
                        </Typography>
                        <Typography variant="body2">Spazio occupato</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {analysis.summary.externalReferences}
                        </Typography>
                        <Typography variant="body2">Riferimenti esterni</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {analysis.summary.localReferences}
                        </Typography>
                        <Typography variant="body2">File locali</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {analysis.permissions.length}
                        </Typography>
                        <Typography variant="body2">Permessi richiesti</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Distribuzione tipi di file */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Distribuzione file:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {analysis.summary.htmlFiles > 0 && (
                        <Chip label={`${analysis.summary.htmlFiles} HTML`} color="primary" size="small" />
                      )}
                      {analysis.summary.scriptFiles > 0 && (
                        <Chip label={`${analysis.summary.scriptFiles} Script`} color="warning" size="small" />
                      )}
                      {analysis.summary.styleFiles > 0 && (
                        <Chip label={`${analysis.summary.styleFiles} CSS`} color="info" size="small" />
                      )}
                      {analysis.summary.imageFiles > 0 && (
                        <Chip label={`${analysis.summary.imageFiles} Immagini`} color="success" size="small" />
                      )}
                      {analysis.summary.otherFiles > 0 && (
                        <Chip label={`${analysis.summary.otherFiles} Altri`} color="default" size="small" />
                      )}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* File locali */}
              <Accordion 
                expanded={expandedSections.files}
                onChange={() => handleSectionToggle('files')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    File locali ({analysis.files.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {analysis.files.map((file, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          {getFileIcon(file.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.filename}
                          secondary={`${file.type} • ${formatFileSize(file.size)}`}
                        />
                        <Tooltip title="Visualizza contenuto">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewFile(file)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Riferimenti esterni */}
              <Accordion 
                expanded={expandedSections.external}
                onChange={() => handleSectionToggle('external')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Risorse esterne ({analysis.externalReferences.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {analysis.externalReferences.map((ref, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <LanguageIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={ref}
                          secondary="Risorsa esterna"
                        />
                        <Tooltip title="Apri in nuova finestra">
                          <IconButton 
                            size="small" 
                            onClick={() => window.open(ref, '_blank')}
                          >
                            <GetAppIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>

              {/* Permessi */}
              <Accordion 
                expanded={expandedSections.permissions}
                onChange={() => handleSectionToggle('permissions')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Permessi richiesti ({analysis.permissions.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {analysis.permissions.map((permission, index) => (
                      <Chip
                        key={index}
                        label={getPermissionLabel(permission)}
                        color={getPermissionColor(permission)}
                        size="small"
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Sicurezza */}
              <Accordion 
                expanded={expandedSections.security}
                onChange={() => handleSectionToggle('security')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Analisi sicurezza
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {analysis.security.risks.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Rischi di sicurezza:
                      </Typography>
                      <List>
                        {analysis.security.risks.map((risk, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {getSecurityIcon('risk')}
                            </ListItemIcon>
                            <ListItemText primary={risk} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {analysis.security.warnings.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="warning.main" gutterBottom>
                        Avvisi:
                      </Typography>
                      <List>
                        {analysis.security.warnings.map((warning, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {getSecurityIcon('warning')}
                            </ListItemIcon>
                            <ListItemText primary={warning} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {analysis.security.info.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="info.main" gutterBottom>
                        Informazioni:
                      </Typography>
                      <List>
                        {analysis.security.info.map((info, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {getSecurityIcon('info')}
                            </ListItemIcon>
                            <ListItemText primary={info} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {analysis.security.risks.length === 0 && 
                   analysis.security.warnings.length === 0 && 
                   analysis.security.info.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="body2" color="success.main">
                        Nessun problema di sicurezza rilevato
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="outlined">
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal per visualizzare file */}
      <Dialog
        open={fileViewOpen}
        onClose={() => setFileViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Contenuto file: {selectedFile?.filename}
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tipo: {selectedFile.type} • Dimensione: {formatFileSize(selectedFile.size)}
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: '400px', overflow: 'auto' }}>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}>
                  {selectedFile.content || 'Contenuto non disponibile'}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileViewOpen(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppInfoModal; 