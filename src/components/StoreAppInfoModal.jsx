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
  MenuItem,
  LinearProgress
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
  Link as LinkIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import AppAnalyzer from '../services/AppAnalyzer.js';
import { showToast } from '../utils/helpers.js';
import { DEBUG } from '../utils/debug.js';

/**
 * Modal specifico per visualizzare informazioni dettagliate sulle app dello store
 * Gestisce il download temporaneo e l'analisi sandboxed
 */
const StoreAppInfoModal = ({ open, onClose, app, onInstall }) => {
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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');

  const analyzer = new AppAnalyzer();

  useEffect(() => {
    if (open && app) {
      analyzeStoreApp();
    }
  }, [open, app]);

  // Funzione per installazione temporanea sandboxed
  const installAppTemporarily = async (appData) => {
    try {
      setDownloadStatus('Scaricando file dal repository...');
      setDownloadProgress(10);
      
      // Importa GitHubService
      const GitHubService = (await import('../services/GitHubService.js')).default;
      const githubService = new GitHubService();
      
      // Estrai info GitHub
      const githubInfo = githubService.parseGitHubUrl(appData.githubUrl);
      if (!githubInfo) {
        throw new Error('URL GitHub non valido');
      }
      
      setDownloadProgress(20);
      setDownloadStatus('Analizzando struttura repository...');
      
      // Scarica tutti i file del repository
      const repositoryBlob = await githubService.downloadRepositoryZip(
        githubInfo.owner, 
        githubInfo.repo, 
        githubInfo.ref || 'main'
      );
      
      setDownloadProgress(50);
      setDownloadStatus('Estraendo contenuti...');
      
      // Converti il blob JSON in oggetto
      const repositoryData = JSON.parse(await repositoryBlob.text());
      
      setDownloadProgress(70);
      setDownloadStatus('Processando file...');
      
      // Crea un oggetto app temporaneo con i file scaricati
      const tempApp = {
        ...appData,
        id: appData.storeId || appData.githubUrl, // Usa storeId come ID temporaneo
        type: 'zip',
        source: 'store',
        files: Object.entries(repositoryData.files).map(([filePath, fileData]) => {
          let content;
          if (fileData.decodedContent) {
            content = fileData.decodedContent;
          } else if (fileData.content) {
            // Decodifica base64 se necessario
            const binaryString = atob(fileData.content.replace(/\n/g, ''));
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            content = new TextDecoder('utf-8').decode(bytes);
          } else {
            content = '';
          }
          
          return {
            filename: filePath,
            content: content,
            size: content.length,
            mimeType: getMimeType(filePath)
          };
        })
      };
      
      setDownloadProgress(90);
      setDownloadStatus('Analizzando app...');
      
      return tempApp;
      
    } catch (error) {
      console.error('❌ Errore installazione temporanea:', error);
      throw error;
    }
  };

  // Funzione helper per determinare MIME type
  const getMimeType = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'txt': 'text/plain',
      'md': 'text/markdown'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  const analyzeStoreApp = async () => {
    setLoading(true);
    setError(null);
    setDownloadProgress(0);
    setDownloadStatus('');
    
    try {
      console.log('🔍 Avvio analisi app dello store:', app.name);
      
      let appToAnalyze = app;
      
      try {
        // Installa temporaneamente l'app per l'analisi
        const tempApp = await installAppTemporarily(app);
        
        setDownloadProgress(100);
        setDownloadStatus('Analisi completata!');
        
        // Usa l'app temporanea per l'analisi
        appToAnalyze = tempApp;
        
        console.log(`✅ App temporanea creata con ${tempApp.files.length} file`);
        
      } catch (downloadError) {
        console.warn('⚠️ Fallback a metadati per errore download:', downloadError);
        
        // Fallback ai metadati disponibili
        appToAnalyze = {
          ...app,
          id: app.storeId || app.githubUrl,
          type: 'github',
          url: app.githubUrl,
          source: 'store',
          name: app.name,
          description: app.description,
          author: app.author,
          category: app.category,
          tags: app.tags,
          icon: app.icon,
          version: app.version,
          lastModified: app.lastModified
        };
        
        setDownloadStatus('Analisi con metadati limitati');
      }
      
      const result = await analyzer.analyzeApp(appToAnalyze);
      setAnalysis(result);
      console.log('✅ Analisi completata:', result);
      
    } catch (error) {
      console.error('❌ Errore analisi app dello store:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (section) => (event, isExpanded) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: isExpanded
    }));
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setFileViewOpen(true);
  };

  const handleInstall = () => {
    if (onInstall) {
      onInstall(app);
    }
  };

  const getAppIcon = (app) => {
    if (app.icon) {
      if (app.icon.startsWith('data:') || app.icon.startsWith('http')) {
        return <img src={app.icon} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
      }
      return app.icon;
    }
    return <StoreIcon />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'produttività': 'primary',
      'intrattenimento': 'secondary',
      'sviluppo': 'success',
      'social': 'info',
      'giochi': 'warning',
      'utility': 'default'
    };
    return colors[category?.toLowerCase()] || 'default';
  };

  const getPermissionColor = (permission) => {
    const colors = {
      'external-scripts': 'warning',
      'external-styles': 'warning',
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar
              sx={{ 
                width: 48, 
                height: 48,
                background: 'transparent',
                fontSize: '1.5rem'
              }}
            >
              {getAppIcon(app)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="h2">
                Informazioni App
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {app.name} {app.author ? `di ${app.author}` : ''}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Analisi in corso...
              </Typography>
              {downloadStatus && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {downloadStatus}
                </Typography>
              )}
              {downloadProgress > 0 && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={downloadProgress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    {downloadProgress}% completato
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Errore durante l'analisi: {error}
            </Alert>
          )}

          {!loading && !error && analysis && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Sezione Panoramica */}
              <Accordion 
                expanded={expandedSections.overview} 
                onChange={handleSectionChange('overview')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Panoramica</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Statistiche principali */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {analysis.files ? analysis.files.length : 0}
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
                          {analysis.files ? formatFileSize(analysis.files.reduce((total, file) => total + (file.size || 0), 0)) : '0 KB'}
                        </Typography>
                        <Typography variant="body2">Spazio occupato</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {analysis.permissions ? analysis.permissions.filter(p => p.includes('external')).length : 0}
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
                          {analysis.files ? analysis.files.filter(f => f.filename.match(/\.(html|css|js)$/i)).length : 0}
                        </Typography>
                        <Tooltip title="Riferimenti a file locali dell'app">
                          <Typography variant="body2" sx={{ cursor: 'help' }}>
                            File principali
                          </Typography>
                        </Tooltip>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {analysis.permissions ? analysis.permissions.length : 0}
                        </Typography>
                        <Typography variant="body2">Permessi richiesti</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main">
                          {analysis.security && analysis.security.externalScripts ? 'Sì' : 'No'}
                        </Typography>
                        <Typography variant="body2">Script esterni</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Distribuzione tipi di file */}
                  {analysis.files && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Distribuzione file:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysis.files.filter(f => f.filename.match(/\.html?$/i)).length > 0 && (
                          <Chip 
                            label={`${analysis.files.filter(f => f.filename.match(/\.html?$/i)).length} HTML`} 
                            color="primary" 
                            size="small" 
                          />
                        )}
                        {analysis.files.filter(f => f.filename.match(/\.js$/i)).length > 0 && (
                          <Chip 
                            label={`${analysis.files.filter(f => f.filename.match(/\.js$/i)).length} Script`} 
                            color="warning" 
                            size="small" 
                          />
                        )}
                        {analysis.files.filter(f => f.filename.match(/\.css$/i)).length > 0 && (
                          <Chip 
                            label={`${analysis.files.filter(f => f.filename.match(/\.css$/i)).length} CSS`} 
                            color="info" 
                            size="small" 
                          />
                        )}
                        {analysis.files.filter(f => f.filename.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i)).length > 0 && (
                          <Chip 
                            label={`${analysis.files.filter(f => f.filename.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i)).length} Immagini`} 
                            color="success" 
                            size="small" 
                          />
                        )}
                        {analysis.files.filter(f => !f.filename.match(/\.(html?|js|css|png|jpg|jpeg|gif|svg|ico)$/i)).length > 0 && (
                          <Chip 
                            label={`${analysis.files.filter(f => !f.filename.match(/\.(html?|js|css|png|jpg|jpeg|gif|svg|ico)$/i)).length} Altri`} 
                            color="default" 
                            size="small" 
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Informazioni origine app */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Origine app:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <Chip 
                        label="Store AIdeas" 
                        color="secondary" 
                        size="small" 
                        icon={<StoreIcon />}
                      />
                      {app.author && (
                        <Chip label={`Autore: ${app.author}`} variant="outlined" size="small" />
                      )}
                      {app.storeId && (
                        <Chip label={`ID: ${app.storeId}`} variant="outlined" size="small" />
                      )}
                      {app.version && (
                        <Chip label={`v${app.version}`} variant="outlined" size="small" />
                      )}
                      {app.category && (
                        <Chip label={app.category} variant="outlined" size="small" />
                      )}
                    </Box>
                  </Box>

                  {/* Descrizione */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Descrizione:
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {app.description || 'Nessuna descrizione disponibile'}
                    </Typography>
                  </Box>

                  {/* Tag */}
                  {app.tags && app.tags.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Tag:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {app.tags.map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Sezione File */}
              {analysis.files && analysis.files.length > 0 && (
                <Accordion 
                  expanded={expandedSections.files} 
                  onChange={handleSectionChange('files')}
                >
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">File ({analysis.files.length})</Typography>
                </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {analysis.files.map((file, index) => (
                        <ListItem 
                          key={index} 
                          button 
                          onClick={() => handleFileClick(file)}
                          sx={{ borderRadius: 1, mb: 0.5 }}
                        >
                          <ListItemIcon>
                            {file.filename.endsWith('.html') && <LanguageIcon />}
                            {file.filename.endsWith('.css') && <StyleIcon />}
                            {file.filename.endsWith('.js') && <CodeIcon />}
                            {file.filename.match(/\.(png|jpg|jpeg|gif|svg)$/i) && <ImageIcon />}
                            {file.filename.endsWith('.json') && <DescriptionIcon />}
                            {!file.filename.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|json)$/i) && <DescriptionIcon />}
                          </ListItemIcon>
                          <ListItemText
                            primary={file.filename}
                            secondary={`${(file.size / 1024).toFixed(1)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Sezione Permessi */}
              {analysis.permissions && analysis.permissions.length > 0 && (
                <Accordion 
                  expanded={expandedSections.permissions} 
                  onChange={handleSectionChange('permissions')}
                >
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Permessi ({analysis.permissions.length})</Typography>
                </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {analysis.permissions.map((permission, index) => (
                        <Chip
                          key={index}
                          label={getPermissionLabel(permission)}
                          color={getPermissionColor(permission)}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Sezione Sicurezza */}
              {analysis.security && (
                <Accordion 
                  expanded={expandedSections.security} 
                  onChange={handleSectionChange('security')}
                >
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Sicurezza</Typography>
                </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {analysis.security.externalScripts && (
                        <Alert severity="warning" icon={<WarningIcon />}>
                          L'app carica script da fonti esterne
                        </Alert>
                      )}
                      {analysis.security.externalStyles && (
                        <Alert severity="info" icon={<InfoIcon />}>
                          L'app carica stili da fonti esterne
                        </Alert>
                      )}
                      {analysis.security.apiAccess && (
                        <Alert severity="error" icon={<ErrorIcon />}>
                          L'app richiede accesso a API esterne
                        </Alert>
                      )}
                      {!analysis.security.externalScripts && !analysis.security.externalStyles && !analysis.security.apiAccess && (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                          L'app sembra sicura e non carica risorse esterne
                        </Alert>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={onClose} color="inherit">
            Chiudi
          </Button>
          {onInstall && (
            <Button
              onClick={handleInstall}
              variant="contained"
              startIcon={<GetAppIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                }
              }}
            >
              Installa App
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal per visualizzare il contenuto dei file */}
      <Dialog
        open={fileViewOpen}
        onClose={() => setFileViewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon />
            {selectedFile?.filename}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper 
            sx={{ 
              p: 2, 
              backgroundColor: '#f5f5f5',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: '60vh',
              overflow: 'auto'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {selectedFile?.content || 'Contenuto non disponibile'}
            </pre>
          </Paper>
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

export default StoreAppInfoModal; 