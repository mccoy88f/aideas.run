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
  const [submitInstructionsOpen, setSubmitInstructionsOpen] = useState(false);
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
        console.log('📦 App dello store rilevata, uso metadati disponibili...');
        
        // Crea un oggetto app temporaneo per l'analisi con i dati dello store
        appToAnalyze = {
          ...app,
          id: app.storeId || app.githubUrl, // Usa storeId o githubUrl come ID temporaneo
          type: 'github', // Le app dello store sono su GitHub
          url: app.githubUrl,
          source: 'store', // Marca esplicitamente come app dello store
          // Mantieni i metadati originali
          name: app.name,
          description: app.description,
          author: app.author,
          category: app.category,
          tags: app.tags,
          icon: app.icon,
          version: app.version,
          lastModified: app.lastModified
        };
        
        console.log('🔗 Uso dati GitHub per analisi:', appToAnalyze.url);
      }
      
      const result = await analyzer.analyzeApp(appToAnalyze);
      setAnalysis(result);
      console.log('✅ Analisi completata:', result);
    } catch (err) {
      console.error('❌ Errore analisi:', err);
      
      // Per le app dello store, crea un'analisi di fallback con i metadati disponibili
      if (!app.id && app.githubUrl) {
        console.log('🔄 Creazione analisi di fallback per app dello store...');
        setAnalysis({
          appId: app.storeId || app.githubUrl,
          appName: app.name,
          appType: 'github',
          timestamp: new Date().toISOString(),
          summary: {
            totalFiles: 0,
            totalSize: 0,
            htmlFiles: 0,
            scriptFiles: 0,
            styleFiles: 0,
            imageFiles: 0,
            otherFiles: 0,
            externalReferences: 0,
            localReferences: 0
          },
          files: [],
          externalReferences: [],
          localReferences: [],
          permissions: ['internet-access', 'external-content'],
          security: {
            risks: [],
            warnings: [`Impossibile analizzare il repository: ${err.message}`],
            info: ['Analisi limitata ai metadati disponibili']
          },
          metadata: {
            githubUrl: app.githubUrl,
            source: 'store',
            hasMainFile: false
          }
        });
        setError(null); // Non mostrare errore se abbiamo un fallback
      } else {
        setError(err.message || 'Errore durante l\'analisi dell\'app');
      }
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
    
    // Invece di tentare l'automazione, mostra le istruzioni manuali
    setSubmitInstructionsOpen(true);
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
    const storeUrl = `${window.location.origin}/store?search=${encodeURIComponent(searchTerm)}`;
    
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
        appFormat: app.type === 'zip' ? 'unzipped' : app.type,
        ...app.manifest
      };
      zip.file('aideas.json', JSON.stringify(manifest, null, 2));
      
      // Gestisci diversi tipi di app
      if (app.source === 'store' && app.githubUrl) {
        // App dello store - scarica file originali da GitHub
        console.log(`🔗 Scaricando file da GitHub: ${app.githubUrl}`);
        
        // Importa GitHubService
        const GitHubService = (await import('../services/GitHubService.js')).default;
        const githubService = new GitHubService();
        
        // Estrai owner/repo dall'URL GitHub
        const githubInfo = githubService.parseGitHubUrl(app.githubUrl);
        if (!githubInfo) {
          throw new Error('URL GitHub non valido');
        }
        
        // Scarica tutti i file del repository
        const repositoryBlob = await githubService.downloadRepositoryZip(
          githubInfo.owner, 
          githubInfo.repo, 
          githubInfo.ref || 'main'
        );
        
        // Converti il blob JSON in oggetto
        const repositoryData = JSON.parse(await repositoryBlob.text());
        
        // Aggiungi tutti i file al ZIP
        for (const [filePath, fileData] of Object.entries(repositoryData.files)) {
          if (fileData.decodedContent) {
            zip.file(filePath, fileData.decodedContent);
          } else if (fileData.content) {
            // Se il contenuto è ancora in base64, decodificalo
            const binaryString = atob(fileData.content.replace(/\n/g, ''));
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const decodedContent = new TextDecoder('utf-8').decode(bytes);
            zip.file(filePath, decodedContent);
          }
        }
        
        console.log(`✅ Scaricati ${Object.keys(repositoryData.files).length} file da GitHub`);
        
      } else if (app.type === 'zip') {
        // App ZIP con file salvati localmente
        const appData = await StorageService.getAppWithFiles(app.id);
        if (appData && appData.files && appData.files.length > 0) {
          appData.files.forEach(file => {
            zip.file(file.filename, file.content);
          });
        } else {
          throw new Error('Nessun file disponibile per il download');
        }
      } else if (app.type === 'url' && app.url) {
        // App URL - crea un file HTML che reindirizza all'URL
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${app.name}</title>
    <meta name="description" content="${app.description || ''}">
    <meta name="author" content="${app.author || 'Unknown'}">
    <meta http-equiv="refresh" content="0; url=${app.url}">
</head>
<body>
    <p>Reindirizzamento a <a href="${app.url}">${app.url}</a>...</p>
    <script>
        window.location.href = "${app.url}";
    </script>
</body>
</html>`;
        zip.file('index.html', htmlContent);
      } else if (app.content) {
        // App con contenuto HTML diretto
        zip.file('index.html', app.content);
      } else {
        throw new Error('Tipo di app non supportato per il download');
      }
      
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
                            File totali
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
                        <Tooltip title="Riferimenti a file locali dell'app">
                          <Typography variant="body2" sx={{ cursor: 'help' }}>
                            Riferimenti locali
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
                          app.source === 'store' || (!app.id && app.githubUrl) ? 'Store AIdeas' : 
                          app.source === 'manual' ? 'Installazione Manuale' :
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
                      {app.version && (
                        <Chip label={`v${app.version}`} variant="outlined" size="small" />
                      )}
                    </Box>
                    {(app.originalGithubUrl || app.githubUrl) && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Repository{!app.id && app.githubUrl ? '' : ' originale'}: 
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 1,
                          mt: 0.5
                        }}>
                          <Button 
                            size="small" 
                            startIcon={<LinkIcon />}
                            onClick={() => window.open(app.originalGithubUrl || app.githubUrl, '_blank')}
                            sx={{ 
                              minWidth: 0,
                              textTransform: 'none',
                              textAlign: 'left',
                              justifyContent: 'flex-start',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              '& .MuiButton-startIcon': {
                                marginRight: { xs: 0.5, sm: 1 }
                              }
                            }}
                          >
                            <Box 
                              component="span" 
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}
                            >
                              {app.originalGithubUrl || app.githubUrl}
                            </Box>
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* File di installazione */}
              <Accordion 
                expanded={expandedSections.files}
                onChange={() => handleSectionToggle('files')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    File di installazione ({analysis.files.length})
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
          {/* Pulsante "Sottometti allo Store" solo per app installate manualmente */}
          {app && app.source === 'manual' && (
            <Button
              onClick={handleSubmitToStore}
              variant="contained"
              startIcon={<StoreIcon />}
              color="secondary"
            >
              Sottometti allo Store
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
            {/* Link Store solo per app dello store */}
            {app && app.source === 'store' && (
              <MenuItem onClick={handleShareStoreLink}>
                <ListItemIcon>
                  <LinkIcon />
                </ListItemIcon>
                <ListItemText primary="Link Store" secondary="Copia link per cercare nello store" />
              </MenuItem>
            )}
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

      {/* Modal istruzioni sottomissione manuale */}
      <Dialog
        open={submitInstructionsOpen}
        onClose={() => setSubmitInstructionsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StoreIcon color="secondary" />
            <Typography variant="h6">
              Sottometti App allo Store - Istruzioni Manuali
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Per sottomettere la tua app allo store AIdeas, segui questi passaggi manuali:
              </Typography>
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Passo 1: Scarica il file ZIP
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Usa il pulsante "Download ZIP" dal menu Condividi per scaricare la tua app come file ZIP.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Passo 2: Fork del repository
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Vai su <a href="https://github.com/mccoy88f/aideas.store" target="_blank" rel="noopener noreferrer">github.com/mccoy88f/aideas.store</a> e clicca su "Fork" per creare una copia del repository nel tuo account GitHub.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Passo 3: Crea una nuova cartella
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Nel tuo fork, vai nella cartella <code>apps/</code> e crea una nuova cartella con un nome univoco per la tua app (es. <code>mia-app-nome</code>).
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Passo 4: Carica i file
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Estrai il contenuto del file ZIP nella nuova cartella. Assicurati che ci sia un file <code>aideas.json</code> con i metadati dell'app.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Passo 5: Commit e Push
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Fai commit delle modifiche e push al tuo fork con un messaggio descrittivo come "Add app: [Nome App]".
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Passo 6: Crea Pull Request
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Vai sul tuo fork su GitHub e clicca su "Compare & pull request" per creare una pull request al repository originale.
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Passo 7: Attendi l'approvazione
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              La tua app verrà revisionata e, se approvata, sarà aggiunta allo store AIdeas.
            </Typography>
          </Box>
          
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Nota:</strong> Assicurati che la tua app sia funzionante e non contenga contenuti inappropriati o dannosi.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitInstructionsOpen(false)}>
            Ho capito
          </Button>
          <Button 
            onClick={() => {
              setSubmitInstructionsOpen(false);
              handleDownloadZip();
            }}
            variant="contained"
            startIcon={<GetAppIcon />}
          >
            Scarica ZIP ora
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppInfoModal; 