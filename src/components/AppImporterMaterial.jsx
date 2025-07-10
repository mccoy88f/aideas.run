import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  GitHub as GitHubIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

/**
 * Componente AppImporter con Material UI e aspetto glossy
 */
const AppImporterMaterial = ({ 
  open, 
  onClose, 
  onImport,
  onError 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [importType, setImportType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedZip, setUploadedZip] = useState(null);
  const [customIcon, setCustomIcon] = useState(null);
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);

  const steps = [
    {
      label: 'Tipo di importazione',
      description: 'Scegli come vuoi importare l\'applicazione'
    },
    {
      label: 'Dettagli applicazione',
      description: 'Inserisci le informazioni dell\'app'
    },
    {
      label: 'Conferma',
      description: 'Rivedi e conferma l\'importazione'
    }
  ];

  const importTypes = [
    {
      id: 'url',
      title: 'Importa da URL',
      description: 'Aggiungi un\'applicazione web tramite URL',
      icon: <LinkIcon />,
      color: 'primary'
    },
    {
      id: 'html',
      title: 'Importa da HTML',
      description: 'Crea un\'app da codice HTML personalizzato',
      icon: <CodeIcon />,
      color: 'secondary'
    },
    {
      id: 'file',
      title: 'Carica file HTML',
      description: 'Carica un file HTML direttamente',
      icon: <CodeIcon />,
      color: 'info'
    },
    {
      id: 'zip',
      title: 'Carica ZIP',
      description: 'Carica un file ZIP con HTML, CSS, JS',
      icon: <CodeIcon />,
      color: 'warning'
    },
    {
      id: 'github',
      title: 'Importa da GitHub',
      description: 'Importa un\'app da un repository GitHub',
      icon: <GitHubIcon />,
      color: 'success'
    }
  ];

  const categories = [
    'Produttività',
    'Intrattenimento', 
    'Sviluppo',
    'Social',
    'Utility',
    'Altro'
  ];

  const handleNext = () => {
    if (activeStep === 0 && !importType) {
      setError('Seleziona un tipo di importazione');
      return;
    }
    
    if (activeStep === 1) {
      if (!formData.name.trim()) {
        setError('Il nome è obbligatorio');
        return;
      }
      
      // Validazione specifica per tipo
      if (importType === 'url' && !formData.url.trim()) {
        setError('URL è obbligatorio per importazione da URL');
        return;
      }
      
      if (importType === 'html' && !htmlContent.trim()) {
        setError('Il contenuto HTML è obbligatorio');
        return;
      }
      
      if (importType === 'file' && !uploadedFile) {
        setError('Devi caricare un file HTML');
        return;
      }
      
      if (importType === 'zip' && !uploadedZip) {
        setError('Devi caricare un file ZIP');
        return;
      }
      
      if (importType === 'github' && !githubUrl.trim()) {
        setError('URL GitHub è obbligatorio');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleReset = () => {
    setActiveStep(0);
    setImportType('');
    setFormData({
      name: '',
      url: '',
      description: '',
      category: '',
      tags: []
    });
    setHtmlContent('');
    setGithubUrl('');
    setUploadedFile(null);
    setUploadedZip(null);
    setCustomIcon(null);
    setError('');
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    
    try {
      let appData = { ...formData };
      
      // Aggiungi icona personalizzata se specificata
      if (customIcon) {
        appData.icon = customIcon;
      }
      
      // Gestisci i diversi tipi di importazione
      switch (importType) {
        case 'html':
          appData.content = htmlContent;
          appData.type = 'html';
          break;
        case 'file':
          appData.content = htmlContent;
          appData.type = 'html';
          appData.filename = uploadedFile.name;
          break;
        case 'zip':
          appData.type = 'zip';
          appData.zipFile = uploadedZip;
          appData.filename = uploadedZip.name;
          break;
        case 'github':
          appData.url = githubUrl;
          appData.type = 'github';
          break;
        default:
          appData.type = 'url';
      }
      
      await onImport(appData);
      handleReset();
      onClose();
      
    } catch (err) {
      setError(err.message || 'Errore durante l\'importazione');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagAdd = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === 'html') {
        setUploadedFile(file);
        
        // Leggi automaticamente i metadati dal file HTML
        try {
          const content = await file.text();
          setHtmlContent(content); // Imposta il contenuto HTML
          const metadata = extractHtmlMetadata(content);
          
          // Aggiorna i campi del form con i metadati trovati
          if (metadata.title) {
            handleInputChange('name', metadata.title);
          }
          if (metadata.description) {
            handleInputChange('description', metadata.description);
          }
          if (metadata.icon) {
            setCustomIcon(metadata.icon);
          }
          if (metadata.keywords) {
            const tags = metadata.keywords.split(',').map(tag => tag.trim()).filter(tag => tag);
            setFormData(prev => ({
              ...prev,
              tags: tags
            }));
          }
          
        } catch (error) {
          console.warn('Errore nella lettura metadati HTML:', error);
        }
        
      } else if (type === 'zip') {
        setUploadedZip(file);
        
        // Leggi automaticamente i metadati dal file ZIP
        try {
          console.log('📦 Processando file ZIP per metadati...');
          
          // Importa JSZip dinamicamente
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          
          // Leggi il contenuto del ZIP
          const contents = await zip.loadAsync(file);
          
          // Estrai tutti i file
          const files = [];
          let manifest = null;
          
          for (const [filename, fileObj] of Object.entries(contents.files)) {
            if (fileObj.dir) continue;
            
            const content = await fileObj.async('text');
            const fileData = {
              filename,
              content,
              size: content.length,
              mimeType: getMimeType(filename)
            };
            
            files.push(fileData);
            
            // Cerca manifest AIdeas
            if (filename === 'aideas.json') {
              try {
                manifest = JSON.parse(content);
              } catch (e) {
                console.warn('Manifest aideas.json non valido:', e);
              }
            }
          }
          
          // Cerca il file index.html per estrarre i metadati
          const indexHtmlFile = files.find(f => 
            f.filename.toLowerCase() === 'index.html' || 
            f.filename.toLowerCase().endsWith('/index.html')
          );

          if (indexHtmlFile) {
            console.log('📄 Trovato index.html nel ZIP, estraggo metadati...');
            const htmlMetadata = extractHtmlMetadataFromZip(indexHtmlFile.content);
            
            // Aggiorna i campi del form con i metadati trovati
            if (htmlMetadata.title) {
              handleInputChange('name', htmlMetadata.title);
            }
            if (htmlMetadata.description) {
              handleInputChange('description', htmlMetadata.description);
            }
            if (htmlMetadata.icon) {
              setCustomIcon(htmlMetadata.icon);
            }
            if (htmlMetadata.keywords) {
              const tags = htmlMetadata.keywords.split(',').map(tag => tag.trim()).filter(tag => tag);
              setFormData(prev => ({
                ...prev,
                tags: tags
              }));
            }
            
            console.log('✅ Metadati estratti dal ZIP:', {
              title: htmlMetadata.title,
              description: htmlMetadata.description,
              hasIcon: !!htmlMetadata.icon,
              tags: htmlMetadata.keywords
            });
          }
          
        } catch (error) {
          console.warn('Errore nella lettura metadati ZIP:', error);
        }
      }
    }
  };

  // Funzione per estrarre metadati da HTML
  const extractHtmlMetadata = (htmlContent) => {
    const metadata = {};
    
    // Estrai il titolo
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Estrai la descrizione
    const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }
    
    // Estrai le keywords
    const keywordsMatch = htmlContent.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].trim();
    }
    
    // Estrai l'autore
    const authorMatch = htmlContent.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }
    
    // Estrai l'icona/favicon
    const iconMatch = htmlContent.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (iconMatch) {
      const iconUrl = iconMatch[1].trim();
      if (iconUrl.startsWith('data:')) {
        metadata.icon = iconUrl;
      } else if (iconUrl.startsWith('http')) {
        metadata.icon = iconUrl;
      } else {
        // Per icone relative, cerca di estrarre il contenuto inline
        metadata.icon = extractInlineIcon(htmlContent, iconUrl);
      }
    }
    
    // Estrai anche apple-touch-icon
    const appleIconMatch = htmlContent.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    if (appleIconMatch && !metadata.icon) {
      const iconUrl = appleIconMatch[1].trim();
      if (iconUrl.startsWith('data:') || iconUrl.startsWith('http')) {
        metadata.icon = iconUrl;
      } else {
        metadata.icon = extractInlineIcon(htmlContent, iconUrl);
      }
    }
    
    // Se non troviamo icone specifiche, cerca SVG inline
    if (!metadata.icon) {
      const svgMatch = htmlContent.match(/<svg[^>]*>.*?<\/svg>/is);
      if (svgMatch) {
        metadata.icon = `data:image/svg+xml;base64,${btoa(svgMatch[0])}`;
      }
    }
    
    return metadata;
  };

  // Funzione per estrarre icone inline dal file HTML
  const extractInlineIcon = (htmlContent, iconPath) => {
    // Cerca il contenuto dell'icona nel file HTML
    const iconFileName = iconPath.split('/').pop();
    const iconMatch = htmlContent.match(new RegExp(`<link[^>]*href=["'][^"']*${iconFileName}["'][^>]*>`));
    
    if (iconMatch) {
      // Se l'icona è definita inline, estrai il contenuto
      const dataMatch = htmlContent.match(/data:image\/[^;]+;base64,[^"']+/);
      if (dataMatch) {
        return dataMatch[0];
      }
    }
    
    return null;
  };

  // Funzione per ottenere MIME type da filename
  const getMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'html': 'text/html',
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

  // Funzione per estrarre metadati da HTML nei file ZIP
  const extractHtmlMetadataFromZip = (htmlContent) => {
    const metadata = {};
    
    // Estrai il titolo
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Estrai la descrizione
    const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }
    
    // Estrai le keywords
    const keywordsMatch = htmlContent.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].trim();
    }
    
    // Estrai l'autore
    const authorMatch = htmlContent.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }
    
    // Estrai l'icona/favicon
    const iconMatch = htmlContent.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (iconMatch) {
      const iconUrl = iconMatch[1].trim();
      if (iconUrl.startsWith('data:')) {
        metadata.icon = iconUrl;
      } else if (iconUrl.startsWith('http')) {
        metadata.icon = iconUrl;
      } else {
        // Per icone relative, cerca di estrarre il contenuto inline
        metadata.icon = extractInlineIconFromZip(htmlContent, iconUrl);
      }
    }
    
    // Estrai anche apple-touch-icon
    const appleIconMatch = htmlContent.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    if (appleIconMatch && !metadata.icon) {
      const iconUrl = appleIconMatch[1].trim();
      if (iconUrl.startsWith('data:') || iconUrl.startsWith('http')) {
        metadata.icon = iconUrl;
      } else {
        metadata.icon = extractInlineIconFromZip(htmlContent, iconUrl);
      }
    }
    
    // Se non troviamo icone specifiche, cerca SVG inline
    if (!metadata.icon) {
      const svgMatch = htmlContent.match(/<svg[^>]*>.*?<\/svg>/is);
      if (svgMatch) {
        metadata.icon = `data:image/svg+xml;base64,${btoa(svgMatch[0])}`;
      }
    }
    
    return metadata;
  };

  // Funzione per estrarre icone inline dal file HTML nello ZIP
  const extractInlineIconFromZip = (htmlContent, iconPath) => {
    // Cerca il contenuto dell'icona nel file HTML
    const iconFileName = iconPath.split('/').pop();
    const iconMatch = htmlContent.match(new RegExp(`<link[^>]*href=["'][^"']*${iconFileName}["'][^>]*>`));
    
    if (iconMatch) {
      // Se l'icona è definita inline, estrai il contenuto
      const dataMatch = htmlContent.match(/data:image\/[^;]+;base64,[^"']+/);
      if (dataMatch) {
        return dataMatch[0];
      }
    }
    
    return null;
  };

  const handleIconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validazione dimensione file (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('File icona troppo grande. Dimensione massima: 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomIcon(ev.target.result);
        setError(''); // Pulisci errori precedenti
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scegli il metodo di importazione più adatto alle tue esigenze
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gap: 2, 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))'
            }}>
              {importTypes.map((type) => (
                <Paper
                  key={type.id}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: importType === type.id ? `2px solid ${theme.palette[type.color].main}` : `2px solid ${theme.palette.divider}`,
                    background: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                  onClick={() => setImportType(type.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${type.color}.light`,
                        color: `${type.color}.main`,
                        mr: 2
                      }}
                    >
                      {type.icon}
                    </Box>
                    <Typography variant="h6" component="h3">
                      {type.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {type.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Inserisci i dettagli dell'applicazione
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gap: 2
            }}>
              <TextField
                label="Nome applicazione *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                fullWidth
                variant="outlined"
                required
              />
              
              {importType === 'url' && (
                <TextField
                  label="URL *"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  fullWidth
                  variant="outlined"
                  required
                  placeholder="https://esempio.com"
                />
              )}
              
              {importType === 'html' && (
                <TextField
                  label="Codice HTML"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  fullWidth
                  multiline
                  rows={6}
                  variant="outlined"
                  placeholder="<html><body><h1>La mia app</h1></body></html>"
                />
              )}
              
              {importType === 'file' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Carica file HTML
                  </Typography>
                  <input
                    accept=".html"
                    style={{ display: 'none' }}
                    id="html-file-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'html')}
                  />
                  <label htmlFor="html-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Scegli file HTML
                    </Button>
                  </label>
                  {uploadedFile && (
                    <Typography variant="body2" color="success.main">
                      ✓ File caricato: {uploadedFile.name}
                    </Typography>
                  )}
                </Box>
              )}
              
              {importType === 'zip' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Carica file ZIP
                  </Typography>
                  <input
                    accept=".zip"
                    style={{ display: 'none' }}
                    id="zip-file-upload"
                    type="file"
                    onChange={(e) => handleFileUpload(e, 'zip')}
                  />
                  <label htmlFor="zip-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Scegli file ZIP
                    </Button>
                  </label>
                  {uploadedZip && (
                    <Typography variant="body2" color="success.main">
                      ✓ File caricato: {uploadedZip.name}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Il file ZIP deve contenere un index.html nella root
                  </Typography>
                </Box>
              )}
              
              {importType === 'github' && (
                <TextField
                  label="URL Repository GitHub"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="https://github.com/username/repository"
                />
              )}
              
              <TextField
                label="Descrizione"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
              />
              
              <TextField
                select
                label=""
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Categoria"
                SelectProps={{ native: true }}
              >
                <option value="" disabled>
                  Categoria
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </TextField>
              
              {/* Icona personalizzata */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Icona personalizzata (opzionale)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Se non specificata, verrà utilizzato il favicon del sito o un'emoji generata automaticamente
                </Typography>
                
                {/* Mostra icona corrente */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 2, 
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    bgcolor: 'background.paper',
                    overflow: 'hidden'
                  }}>
                    {customIcon && (customIcon.startsWith('data:') || customIcon.startsWith('http')) ? (
                      <img 
                        src={customIcon} 
                        alt="Icona app" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Box sx={{ 
                      display: customIcon && (customIcon.startsWith('data:') || customIcon.startsWith('http')) ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      {customIcon || '📱'}
                    </Box>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIconSelectorOpen(true)}
                  >
                    Cambia Icona
                  </Button>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Tag
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleTagRemove(tag)}
                      size="small"
                    />
                  ))}
                </Box>
                <TextField
                  label="Aggiungi tag"
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTagAdd(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  fullWidth
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Rivedi i dettagli prima di importare
            </Typography>
            
            <Paper sx={{ 
              p: 3, 
              mb: 2
            }}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nome
                  </Typography>
                  <Typography variant="body1">
                    {formData.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    URL/Tipo
                  </Typography>
                  <Typography variant="body1">
                    {importType === 'html' ? 'HTML personalizzato' : 
                     importType === 'github' ? 'Repository GitHub' : 
                     formData.url}
                  </Typography>
                </Box>
                
                {formData.description && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Descrizione
                    </Typography>
                    <Typography variant="body1">
                      {formData.description}
                    </Typography>
                  </Box>
                )}
                
                {formData.category && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Categoria
                    </Typography>
                    <Chip label={formData.category} size="small" />
                  </Box>
                )}
                
                {formData.tags.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tag
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                      {formData.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {customIcon && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Icona personalizzata
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      mt: 1 
                    }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 1,
                        border: '2px solid',
                        borderColor: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        backgroundColor: 'background.paper'
                      }}>
                        <img 
                          src={customIcon} 
                          alt="Icona personalizzata" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }} 
                        />
                      </Box>
                      <Typography variant="body2" color="success.main">
                        ✓ Icona personalizzata selezionata
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          background: theme.palette.background.paper,
          backdropFilter: 'blur(20px)',
          maxHeight: isMobile ? '100vh' : '85vh',
          height: isMobile ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2">
            Importa Applicazione
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        pb: 0, 
        overflow: 'auto',
        flex: 1,
        minHeight: 0
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              {isMobile && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ my: 3 }} />

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2,
        flexShrink: 0,
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Indietro
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckIcon />}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
              }
            }}
          >
            {loading ? 'Importazione...' : 'Importa'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'
              }
            }}
          >
            Avanti
          </Button>
        )}
      </DialogActions>

      {/* IconSelector */}
      <Dialog
        open={iconSelectorOpen}
        onClose={() => setIconSelectorOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cambia Icona
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Mostra icona corrente */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Icona Attuale
              </Typography>
              <Box sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: 2, 
                border: '1px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                mx: 'auto'
              }}>
                {customIcon && (customIcon.startsWith('data:') || customIcon.startsWith('http')) ? (
                  <img 
                    src={customIcon} 
                    alt="Icona app" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <Box sx={{ 
                  display: customIcon && (customIcon.startsWith('data:') || customIcon.startsWith('http')) ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%'
                }}>
                  {customIcon || '📱'}
                </Box>
              </Box>
            </Box>

            {/* Opzione 1: Carica file immagine */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Carica Immagine
              </Typography>
              <Box sx={{ 
                position: 'relative',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}>
                <input
                  type="file"
                  accept="image/*,image/svg+xml"
                  style={{ 
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                  onChange={handleIconUpload}
                />
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 1,
                  pointerEvents: 'none'
                }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 1,
                    backgroundColor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                    </svg>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Clicca per selezionare un'immagine
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    PNG, JPG, SVG fino a 2MB
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Opzione 2: URL immagine */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                URL Immagine
              </Typography>
              <TextField
                fullWidth
                placeholder="https://esempio.com/icona.png"
                size="small"
                onChange={(e) => {
                  const url = e.target.value.trim();
                  if (url && (url.startsWith('http') || url.startsWith('data:'))) {
                    setCustomIcon(url);
                    showToast('URL icona impostato', 'success');
                  }
                }}
                helperText="Inserisci l'URL di un'immagine o favicon"
              />
            </Box>

            {/* Opzione 3: Seleziona emoji */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Seleziona Emoji
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setIconSelectorOpen(false);
                  // TODO: Apri selettore emoji
                }}
                startIcon={<span style={{ fontSize: '1.2rem' }}>😊</span>}
              >
                Scegli Emoji
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIconSelectorOpen(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AppImporterMaterial; 