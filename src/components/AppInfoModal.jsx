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
  Grid,
  Menu,
  MenuItem
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
  GetApp as GetAppIcon,
  Store as StoreIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import AppAnalyzer from '../services/AppAnalyzer.js';
import { storeService } from '../services/StoreService.js';
import { showToast } from '../utils/helpers.js';
import StorageService from '../services/StorageService.js';

/**
 * Modal per visualizzare informazioni dettagliate sull'app
 */
const AppInfoModal = ({ open, onClose, app }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileViewOpen, setFileViewOpen] = useState(false);
  const [submittingToStore, setSubmittingToStore] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState(null);
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
      
      // Verifica se è un'app dello store (non ha un id locale ma ha githubUrl)
      const isStoreApp = !app.id && app.githubUrl;
      
      let appToAnalyze = app;
      
      if (isStoreApp) {
        console.log('📦 App dello store rilevata, scarico dati completi...');
        // Scarica i dati completi dell'app dallo store
        const { storeService } = await import('../services/StoreService.js');
        
        try {
          // Crea un oggetto app temporaneo per l'analisi con i dati dello store
          appToAnalyze = {
            ...app,
            type: 'github', // Le app dello store sono su GitHub
            url: app.githubUrl,
            // Mantieni i metadati originali
            name: app.name,
            description: app.description,
            author: app.author,
            category: app.category,
            tags: app.tags,
            icon: app.icon
          };
          
          console.log('🔗 Uso dati GitHub per analisi:', appToAnalyze.url);
        } catch (error) {
          console.warn('⚠️ Errore scaricamento dati store, uso metadati disponibili:', error);
          // In caso di errore, usa i metadati disponibili
        }
      }
      
      const result = await analyzer.analyzeApp(appToAnalyze);
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

  const handleSubmitToStore = async () => {
    if (!app) return;
    
    setSubmittingToStore(true);
    
    try {
      console.log(`📤 Sottomissione app ${app.name} allo store...`);
      const prData = await storeService.submitAppToStore(app);
      
      showToast(`App ${app.name} sottoposta allo store! Pull request creata.`, 'success');
      
      // Apri la pull request in una nuova finestra
      if (prData.html_url) {
        window.open(prData.html_url, '_blank');
      }
      
    } catch (error) {
      console.error('❌ Errore sottomissione store:', error);
      showToast(`Errore sottomissione: ${error.message}`, 'error');
    } finally {
      setSubmittingToStore(false);
    }
  };

  const handleShareMenuOpen = (event) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };

  const handleShareStoreLink = () => {
    if (!app) return;
    
    // Genera link di ricerca nello store basato su uniqueId o nome
    const searchTerm = app.uniqueId || `${app.name} ${app.author || ''}`.trim();
    const storeUrl = `${window.location.origin}${window.location.pathname}#/store?search=${encodeURIComponent(searchTerm)}`;
    
    // Copia negli appunti
    navigator.clipboard.writeText(storeUrl).then(() => {
      showToast('Link dello store copiato negli appunti!', 'success');
    }).catch(() => {
      showToast('Errore copia link', 'error');
    });
    
    handleShareMenuClose();
  };

  const handleDownloadZip = async () => {
    if (!app) return;
    
    try {
      console.log(`📦 Download ZIP per app ${app.name}...`);
      
      // Ottieni i dati dell'app con i file
      const appData = await StorageService.getAppWithFiles(app.id);
      if (!appData || !appData.files || appData.files.length === 0) {
        throw new Error('Nessun file disponibile per il download');
      }
      
      // Crea ZIP usando JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Aggiungi manifest dell'app
      const manifest = {
        name: app.name,
        description: app.description,
        author: app.author || 'Unknown',
        version: app.version,
        category: app.category,
        tags: app.tags || [],
        icon: app.icon,
        appFormat: 'unzipped',
        ...app.manifest
      };
      zip.file('aideas.json', JSON.stringify(manifest, null, 2));
      
      // Aggiungi tutti i file dell'app
      appData.files.forEach(file => {
        zip.file(file.filename, file.content);
      });
      
      // Genera e scarica il ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${app.name.replace(/[^a-z0-9]/gi, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast(`App ${app.name} scaricata come ZIP!`, 'success');
      
    } catch (error) {
      console.error('❌ Errore download ZIP:', error);
      showToast(`Errore download: ${error.message}`, 'error');
    }
    
    handleShareMenuClose();
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
                        <Tooltip title="Numero totale di file che compongono l'applicazione">
                          <Typography variant="body2" sx={{ cursor: 'help' }}>
                            File app
                          </Typography>
                        </Tooltip>
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
                        <Tooltip title="Risorse esterne caricate da internet (CDN, API, ecc.)">
                          <Typography variant="body2" sx={{ cursor: 'help' }}>
                            Risorse esterne
                          </Typography>
                        </Tooltip>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {analysis.summary.localReferences}
                        </Typography>
                        <Tooltip title="File interni dell'app memorizzati localmente">
                          <Typography variant="body2" sx={{ cursor: 'help' }}>
                            File interni
                          </Typography>
                        </Tooltip>
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

                  {/* Informazioni origine app */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Origine app:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <Chip 
                        label={
                          app.source === 'store' ? 'Store AIdeas' : 
                          (!app.id && app.githubUrl) ? 'Store AIdeas (Non installata)' : 
                          'Installazione Manuale'
                        } 
                        color={
                          app.source === 'store' || (!app.id && app.githubUrl) ? 'secondary' : 'default'
                        } 
                        size="small" 
                        icon={
                          app.source === 'store' || (!app.id && app.githubUrl) ? <StoreIcon /> : <UploadIcon />
                        }
                      />
                      {app.author && (
                        <Chip label={`Autore: ${app.author}`} variant="outlined" size="small" />
                      )}
                      {app.uniqueId && (
                        <Chip label={`ID: ${app.uniqueId}`} variant="outlined" size="small" />
                      )}
                    </Box>
                    {(app.originalGithubUrl || app.githubUrl) && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Repository{!app.id && app.githubUrl ? '' : ' originale'}: 
                        </Typography>
                        <Button 
                          size="small" 
                          startIcon={<LinkIcon />}
                          onClick={() => window.open(app.originalGithubUrl || app.githubUrl, '_blank')}
                          sx={{ ml: 1 }}
                        >
                          {app.originalGithubUrl || app.githubUrl}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* File interni */}
              <Accordion 
                expanded={expandedSections.files}
                onChange={() => handleSectionToggle('files')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    File interni ({analysis.files.length})
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
          <Button
            onClick={handleShareMenuOpen}
            variant="outlined"
            startIcon={<ShareIcon />}
            color="info"
          >
            Condividi
          </Button>
          {app && app.type !== 'store' && (
            <Button
              onClick={handleSubmitToStore}
              variant="contained"
              startIcon={submittingToStore ? <CircularProgress size={16} /> : <StoreIcon />}
              disabled={submittingToStore}
              color="secondary"
            >
              {submittingToStore ? 'Sottomissione...' : 'Sottometti allo Store'}
            </Button>
          )}

          {/* Menu condivisione */}
          <Menu
            anchorEl={shareMenuAnchor}
            open={Boolean(shareMenuAnchor)}
            onClose={handleShareMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleShareStoreLink}>
              <ListItemIcon>
                <LinkIcon />
              </ListItemIcon>
              <ListItemText primary="Link Store" secondary="Copia link per cercare nello store" />
            </MenuItem>
            <MenuItem onClick={handleDownloadZip}>
              <ListItemIcon>
                <GetAppIcon />
              </ListItemIcon>
              <ListItemText primary="Download ZIP" secondary="Scarica app come file ZIP" />
            </MenuItem>
          </Menu>
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