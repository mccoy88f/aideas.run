import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  GitHub as GitHubIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { appSubmissionService } from '../services/AppSubmissionService.js';
import { showToast } from '../utils/helpers.js';
import { DEBUG } from '../utils/debug.js';

/**
 * Modal per la sottomissione delle app allo store
 */
const AppSubmissionModal = ({ open, onClose, app, onSubmissionComplete }) => {
  const [step, setStep] = useState('preview'); // preview, preparing, submitting, success, error
  const [submissionData, setSubmissionData] = useState(null);
  const [progress, setProgress] = useState({ show: false, value: 0, text: '' });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);

  // Form data per metadati editabili
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: [],
    author: ''
  });

  // Inizializza form data quando l'app cambia
  useEffect(() => {
    if (app) {
      // Ottieni username GitHub per l'autore in modo asincrono
      const loadGitHubUsername = async () => {
        try {
          const isAuthenticated = await appSubmissionService.githubService.isAuthenticated();
          if (isAuthenticated) {
            const userInfo = appSubmissionService.githubService.getUserInfo();
            const githubUsername = userInfo?.login || '';
            
            setFormData(prev => ({
              ...prev,
              name: app.name || '',
              description: app.description || '',
              category: app.category || 'utility',
              tags: app.tags || [],
              author: githubUsername // Usa sempre username GitHub
            }));
          } else {
            // Se non autenticato, usa un placeholder
            setFormData(prev => ({
              ...prev,
              name: app.name || '',
              description: app.description || '',
              category: app.category || 'utility',
              tags: app.tags || [],
              author: 'GitHub username (configura GitHub nelle impostazioni)'
            }));
          }
        } catch (error) {
          DEBUG.error('❌ Errore caricamento username GitHub:', error);
          setFormData(prev => ({
            ...prev,
            name: app.name || '',
            description: app.description || '',
            category: app.category || 'utility',
            tags: app.tags || [],
            author: 'Unknown'
          }));
        }
      };
      
      loadGitHubUsername();
    }
  }, [app]);

  // Carica submission dell'utente quando il modal si apre
  useEffect(() => {
    if (open) {
      loadUserSubmissions();
    }
  }, [open]);

  // Aggiorna l'autore quando l'autenticazione cambia
  useEffect(() => {
    if (open && isAuthenticated && app) {
      const updateAuthor = async () => {
        try {
          const userInfo = appSubmissionService.githubService.getUserInfo();
          const githubUsername = userInfo?.login || '';
          
          if (githubUsername && githubUsername !== formData.author) {
            setFormData(prev => ({
              ...prev,
              author: githubUsername
            }));
          }
        } catch (error) {
          DEBUG.error('❌ Errore aggiornamento username:', error);
        }
      };
      
      updateAuthor();
    }
  }, [open, isAuthenticated, app]);

  // Carica submission dell'utente
  const loadUserSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      
      // Verifica se l'utente è autenticato prima di caricare le submission
      const isAuthenticated = await appSubmissionService.githubService.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
      
      if (!isAuthenticated) {
        DEBUG.log('ℹ️ Utente non autenticato, salto caricamento submission');
        setUserSubmissions([]);
        return;
      }
      
      const submissions = await appSubmissionService.getUserSubmissions();
      setUserSubmissions(submissions);
      
      // Verifica se l'app corrente è già stata submittata
      if (app) {
        const existing = await appSubmissionService.checkAppAlreadySubmitted(app);
        setExistingSubmission(existing);
        
        if (existing) {
          if (existing.state === 'open') {
            setError(`L'app "${app.name}" è già stata submittata e l'issue è ancora aperta.`);
          } else {
            setError(`L'app "${app.name}" è già stata submittata. Status: ${existing.state}`);
          }
        }
      }
      
      // Determina se l'utente può sottomettere
      setCanSubmit(isAuthenticated && !existingSubmission);
    } catch (error) {
      DEBUG.error('❌ Errore caricamento submission:', error);
      // In caso di errore, imposta array vuoto invece di fallire
      setUserSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Prepara l'app per la sottomissione
  const handlePrepareSubmission = async () => {
    if (!app) return;

    // Verifica autenticazione
    if (!isAuthenticated) {
      setError('Devi configurare GitHub nelle impostazioni prima di sottomettere un\'app.');
      setStep('error');
      return;
    }

    // Verifica se esiste già una submission aperta
    if (existingSubmission && existingSubmission.state === 'open') {
      setError(`L'app "${app.name}" è già stata submittata e l'issue è ancora aperta.`);
      setStep('error');
      return;
    }

    setStep('preparing');
    setProgress({ show: true, value: 0, text: 'Preparazione app...' });
    setError(null);

    try {
      // Verifica che l'autore sia un username GitHub valido
      let author = formData.author;
      if (!author || author === 'Unknown' || author.includes('configura GitHub')) {
        // Prova a ottenere l'username GitHub
        try {
          const isAuthenticated = await appSubmissionService.githubService.isAuthenticated();
          if (isAuthenticated) {
            const userInfo = appSubmissionService.githubService.getUserInfo();
            author = userInfo?.login || 'Unknown';
          } else {
            throw new Error('GitHub non configurato. Vai nelle impostazioni e configura GitHub.');
          }
        } catch (error) {
          throw new Error('Impossibile ottenere username GitHub. Verifica la configurazione nelle impostazioni.');
        }
      }
      
      // Aggiorna l'app con i dati del form
      const updatedApp = {
        ...app,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        author: author
      };

      // Verifica se l'app è già stata submittata
      const existingSubmission = await appSubmissionService.checkAppAlreadySubmitted(updatedApp);
      if (existingSubmission) {
        throw new Error(`L'app "${updatedApp.name}" è già stata submittata. Status: ${existingSubmission.status}`);
      }

      setProgress({ show: true, value: 30, text: 'Validazione app...' });
      
      // Prepara la submission
      const data = await appSubmissionService.prepareAppForSubmission(updatedApp);
      setSubmissionData(data);
      
      setProgress({ show: true, value: 100, text: 'App preparata!' });
      
      // Passa al step di conferma
      setTimeout(() => {
        setStep('confirm');
        setProgress({ show: false, value: 0, text: '' });
      }, 1000);

    } catch (error) {
      DEBUG.error('❌ Errore preparazione submission:', error);
      setError(error.message);
      setStep('error');
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  // Sottomette l'app
  const handleSubmitApp = async () => {
    if (!submissionData) return;

    // Verifica autenticazione
    if (!isAuthenticated) {
      setError('Devi configurare GitHub nelle impostazioni prima di sottomettere un\'app.');
      setStep('error');
      return;
    }

    // Verifica se esiste già una submission aperta
    if (existingSubmission && existingSubmission.state === 'open') {
      setError(`L'app è già stata submittata e l'issue è ancora aperta.`);
      setStep('error');
      return;
    }

    setStep('submitting');
    setProgress({ show: true, value: 0, text: 'Upload ZIP...' });
    setError(null);

    try {
      setProgress({ show: true, value: 30, text: 'Creazione issue...' });
      
      // Sottometti l'app
      const result = await appSubmissionService.submitAppViaIssues(submissionData);
      setResult(result);
      
      setProgress({ show: true, value: 100, text: 'App sottomessa!' });
      
      // Passa al step di successo
      setTimeout(() => {
        setStep('success');
        setProgress({ show: false, value: 0, text: '' });
        
        // Notifica completamento
        if (onSubmissionComplete) {
          onSubmissionComplete(result);
        }
      }, 1000);

    } catch (error) {
      DEBUG.error('❌ Errore sottomissione:', error);
      setError(error.message);
      setStep('error');
      setProgress({ show: false, value: 0, text: '' });
    }
  };

  // Gestione cambiamenti form
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestione tag
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

  // Reset modal
  const handleClose = () => {
    setStep('preview');
    setSubmissionData(null);
    setError(null);
    setResult(null);
    setProgress({ show: false, value: 0, text: '' });
    setExistingSubmission(null);
    setCanSubmit(false);
    onClose();
  };

  // Apre l'issue esistente in una nuova tab
  const handleOpenExistingIssue = () => {
    if (existingSubmission && existingSubmission.html_url) {
      window.open(existingSubmission.html_url, '_blank');
    }
  };

  // Ottieni status color per submission
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // Ottieni status icon per submission
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckIcon />;
      case 'rejected': return <ErrorIcon />;
      case 'pending': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  // Categorie disponibili
  const categories = [
    { value: 'productivity', label: 'Produttività' },
    { value: 'entertainment', label: 'Intrattenimento' },
    { value: 'tools', label: 'Strumenti' },
    { value: 'games', label: 'Giochi' },
    { value: 'ai', label: 'Intelligenza Artificiale' },
    { value: 'social', label: 'Social' },
    { value: 'education', label: 'Educazione' },
    { value: 'business', label: 'Business' },
    { value: 'utility', label: 'Utilità' },
    { value: 'uncategorized', label: 'Altro' }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon color="primary" />
          <Typography variant="h6">
            {step === 'preview' && 'Sottometti App allo Store'}
            {step === 'preparing' && 'Preparazione App'}
            {step === 'confirm' && 'Conferma Sottomissione'}
            {step === 'submitting' && 'Sottomissione in Corso'}
            {step === 'success' && 'App Sottomessa!'}
            {step === 'error' && 'Errore Sottomissione'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Progress bar */}
        {progress.show && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress.value} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              {progress.text}
            </Typography>
          </Box>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <Stack spacing={3}>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2">
                Sottometti la tua app allo store AIdeas per renderla disponibile a tutti gli utenti. 
                La tua app sarà rivista prima della pubblicazione.
                {!isAuthenticated && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="warning.main">
                      ⚠️ Configura GitHub nelle impostazioni per poter sottomettere app.
                    </Typography>
                  </Box>
                )}
              </Typography>
            </Alert>

            {/* Alert per submission esistente */}
            {existingSubmission && (
              <Alert 
                severity={existingSubmission.state === 'open' ? 'warning' : 'info'} 
                icon={<InfoIcon />}
                action={
                  existingSubmission.html_url && (
                    <Button
                      size="small"
                      onClick={handleOpenExistingIssue}
                      startIcon={<OpenIcon />}
                    >
                      Apri Issue
                    </Button>
                  )
                }
              >
                <Typography variant="body2">
                  {existingSubmission.state === 'open' 
                    ? `L'app "${app?.name}" è già stata submittata e l'issue è ancora aperta.`
                    : `L'app "${app?.name}" è già stata submittata (Status: ${existingSubmission.state}).`
                  }
                </Typography>
              </Alert>
            )}

            <Typography variant="h6">Metadati App</Typography>
            
            <TextField
              fullWidth
              label="Nome App"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              label="Descrizione"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              multiline
              rows={3}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                label="Categoria"
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Autore"
              value={formData.author}
              InputProps={{
                readOnly: true,
                sx: { bgcolor: 'action.disabledBackground' }
              }}
              helperText={
                formData.author === 'Unknown' || formData.author.includes('configura GitHub')
                  ? "Configura GitHub nelle impostazioni per ottenere il tuo username"
                  : "Username GitHub (non modificabile)"
              }
              error={formData.author === 'Unknown' || formData.author.includes('configura GitHub')}
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Tag (separati da virgole)
              </Typography>
              <TextField
                fullWidth
                placeholder="es: utility, tool, calculator"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const tag = e.target.value.trim();
                    if (tag) {
                      handleTagAdd(tag);
                      e.target.value = '';
                    }
                  }
                }}
              />
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleTagRemove(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* Le tue submission precedenti */}
            <Divider />
            <Typography variant="h6">Le Tue Submission</Typography>
            
            {loadingSubmissions ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Caricamento submission...
                </Typography>
              </Box>
            ) : userSubmissions.length > 0 ? (
              <List dense>
                {userSubmissions.slice(0, 5).map(submission => (
                  <ListItem key={submission.issueNumber}>
                    <ListItemIcon>
                      {getStatusIcon(submission.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={submission.title.replace('[SUBMISSION] ', '')}
                      secondary={`Status: ${submission.status} • ${new Date(submission.createdAt).toLocaleDateString()}`}
                    />
                    <IconButton
                      size="small"
                      onClick={() => window.open(submission.url, '_blank')}
                    >
                      <OpenIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Nessuna submission precedente
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Le tue submission appariranno qui dopo aver configurato GitHub nelle impostazioni
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && submissionData && (
          <Stack spacing={3}>
            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="body2">
                App preparata con successo! Controlla i dettagli prima della sottomissione.
              </Typography>
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Dettagli Submission
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Nome</Typography>
                    <Typography variant="body1">{submissionData.app.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Categoria</Typography>
                    <Typography variant="body1">{submissionData.app.category}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Autore</Typography>
                    <Typography variant="body1">{submissionData.app.author}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">File</Typography>
                    <Typography variant="body1">{submissionData.files.length} file</Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Descrizione</Typography>
                  <Typography variant="body1">{submissionData.app.description}</Typography>
                </Box>

                {submissionData.app.tags.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">Tag</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {submissionData.app.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Report di sicurezza */}
                {submissionData.securityReport && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon fontSize="small" />
                      Report Sicurezza
                    </Typography>
                    {submissionData.securityReport.hasIssues ? (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {submissionData.securityReport.issues.join(', ')}
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Nessun problema di sicurezza rilevato
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* Step: Success */}
        {step === 'success' && result && (
          <Stack spacing={3} sx={{ textAlign: 'center' }}>
            <Box sx={{ color: 'success.main' }}>
              <CheckIcon sx={{ fontSize: 64 }} />
            </Box>
            
            <Typography variant="h5" color="success.main">
              App Sottomessa con Successo!
            </Typography>
            
            <Typography variant="body1">
              La tua app è stata inviata per la revisione. Riceverai una notifica quando sarà approvata.
            </Typography>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Dettagli Submission
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'left' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Issue #</Typography>
                    <Typography variant="body1">{result.issueNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label="In Revisione" color="warning" size="small" />
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<GitHubIcon />}
                    onClick={() => window.open(result.issueUrl, '_blank')}
                    fullWidth
                  >
                    Visualizza Issue
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* Step: Error */}
        {step === 'error' && error && (
          <Stack spacing={3} sx={{ textAlign: 'center' }}>
            <Box sx={{ color: 'error.main' }}>
              <ErrorIcon sx={{ fontSize: 64 }} />
            </Box>
            
            <Typography variant="h5" color="error.main">
              Errore durante la Sottomissione
            </Typography>
            
            <Alert severity="error">
              <Typography variant="body1">
                {error}
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Riprova più tardi o contatta il supporto se il problema persiste.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {step === 'preview' && (
          <>
            <Button onClick={handleClose}>
              Annulla
            </Button>
            <Button
              variant="contained"
              onClick={handlePrepareSubmission}
              disabled={
                !formData.name || 
                !formData.description || 
                !isAuthenticated || 
                (existingSubmission && existingSubmission.state === 'open')
              }
              startIcon={<UploadIcon />}
            >
              {!isAuthenticated 
                ? 'Configura GitHub Prima' 
                : existingSubmission && existingSubmission.state === 'open'
                ? 'Issue Già Aperta'
                : 'Prepara App'
              }
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Button onClick={() => setStep('preview')}>
              Indietro
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitApp}
              disabled={!isAuthenticated || (existingSubmission && existingSubmission.state === 'open')}
              startIcon={<GitHubIcon />}
            >
              Sottometti App
            </Button>
          </>
        )}

        {step === 'success' && (
          <Button variant="contained" onClick={handleClose}>
            Chiudi
          </Button>
        )}

        {step === 'error' && (
          <>
            <Button onClick={handleClose}>
              Chiudi
            </Button>
            <Button
              variant="outlined"
              onClick={() => setStep('preview')}
              startIcon={<RefreshIcon />}
            >
              Riprova
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AppSubmissionModal; 