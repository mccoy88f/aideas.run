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
    setError('');
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    
    try {
      let appData = { ...formData };
      
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

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    if (type === 'html') {
      if (!file.name.endsWith('.html')) {
        setError('Devi caricare un file HTML');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setHtmlContent(e.target.result);
        setUploadedFile(file);
        setError('');
      };
      reader.readAsText(file);
    } else if (type === 'zip') {
      if (!file.name.endsWith('.zip')) {
        setError('Devi caricare un file ZIP');
        return;
      }
      setUploadedZip(file);
      setError('');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Scegli il metodo di importazione più adatto alle tue esigenze
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {importTypes.map((type) => (
                <Paper
                  key={type.id}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: importType === type.id ? `2px solid ${theme.palette[type.color].main}` : '2px solid transparent',
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Inserisci i dettagli dell'applicazione
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 3 }}>
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
                label="Categoria"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                fullWidth
                variant="outlined"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </TextField>
              
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
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Rivedi i dettagli prima di importare
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
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
          borderRadius: isMobile ? 0 : 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)'
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

      <DialogContent sx={{ pb: 0 }}>
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

      <DialogActions sx={{ p: 3, pt: 2 }}>
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
    </Dialog>
  );
};

export default AppImporterMaterial; 