import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Fab,
  useTheme,
  useMediaQuery,
  CircularProgress,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import StorageService from '../services/StorageService.js';
import { aiServiceManager } from '../services/ai/AIServiceManager.js';
import { showToast } from '../utils/helpers.js';
import {
  ArrowBack as ArrowBackIcon,
  SmartToy as AIIcon,
  Apps as AppsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * Pagina per la generazione di app tramite AI usando OpenRouter
 */
const AIGeneratorPage = ({ onNavigateBack, onAppGenerated, onEditInstalledApp, onOpenSettings }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State per il form
  const [formData, setFormData] = useState({
    appName: '',
    appDescription: '',
    appType: '',
    aiModel: 'openai/gpt-4o-mini'
  });
  
  // State per l'autenticazione AI
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // State per la generazione
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [generatedApps, setGeneratedApps] = useState([]);
  
  // State per la chat di modifica
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  
  // State per preview
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // State per i modelli AI dinamici
  const [dynamicModels, setDynamicModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  
  // Tipi di app
  const appTypes = [
    { value: 'utility', label: 'Utility / Strumento', icon: '🔧' },
    { value: 'game', label: 'Gioco', icon: '🎮' },
    { value: 'productivity', label: 'Produttività', icon: '📊' },
    { value: 'calculator', label: 'Calcolatrice', icon: '🧮' },
    { value: 'dashboard', label: 'Dashboard', icon: '📈' },
    { value: 'form', label: 'Form / Modulo', icon: '📝' },
    { value: 'creative', label: 'Creativo', icon: '🎨' },
    { value: 'other', label: 'Altro', icon: '⚡' }
  ];

  // Carica modelli AI quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableModels();
    }
  }, [isAuthenticated]);

    // Controlla autenticazione quando la pagina si carica
  useEffect(() => {
    console.log('🚪 Pagina caricata, controllo stato autenticazione AI...');
    checkAuthStatus();
  }, []);

  // Controlla stato autenticazione AI
  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Controllo stato autenticazione AI...');
      
      // Verifica se il servizio AI è configurato
      const isConfigured = aiServiceManager.isCurrentProviderConfigured();
      console.log('🔐 Stato configurazione AI:', isConfigured);
      
      if (isConfigured) {
        setIsAuthenticated(true);
        
        // Carica le app generate
        await loadGeneratedApps();
      } else {
        console.log('❌ Servizio AI non configurato');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Errore controllo autenticazione AI:', error);
      setIsAuthenticated(false);
    }
  };



  // Carica app generate
  const loadGeneratedApps = async () => {
    try {
      const savedApps = localStorage.getItem('aideas-ai-generated-apps');
      if (savedApps) {
        setGeneratedApps(JSON.parse(savedApps));
        console.log(`📱 Caricate ${JSON.parse(savedApps).length} app generate`);
      }
    } catch (error) {
      console.error('❌ Errore caricamento app generate:', error);
    }
  };

  // Salva app generate
  const saveGeneratedApps = async (apps) => {
    try {
      localStorage.setItem('aideas-ai-generated-apps', JSON.stringify(apps));
      console.log(`💾 Salvate ${apps.length} app generate`);
    } catch (error) {
      console.error('❌ Errore salvataggio app generate:', error);
    }
  };

  // Ottieni modelli AI disponibili da OpenRouter
  const fetchAvailableModels = async () => {
    if (!isAuthenticated) return;
    
    setModelsLoading(true);
    try {
      console.log('🔍 Caricamento modelli AI da OpenRouter...');
      
      const models = await aiServiceManager.getAvailableModels();
      
      // Converti il formato per il dropdown
      const formattedModels = [];
      Object.entries(models).forEach(([group, groupModels]) => {
        groupModels.forEach(model => {
          formattedModels.push({
            value: model.value,
            label: model.label,
            group: group
          });
        });
      });
      
      setDynamicModels(formattedModels);
      console.log('✅ Modelli caricati con successo:', formattedModels.length, 'modelli disponibili');
      
    } catch (error) {
      console.error('❌ Errore caricamento modelli:', error);
      setDynamicModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  // Genera app con AI
  const handleGenerateApp = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast('Configura la tua API key OpenRouter nelle impostazioni', 'warning');
      return;
    }
    
    const { appName, appDescription, appType, aiModel } = formData;
    
    if (!appName.trim() || !appDescription.trim() || !appType || !aiModel) {
      showToast('Compila tutti i campi richiesti', 'warning');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      console.log('🚀 Avvio generazione app con AI...');
      console.log('📋 Parametri:', { appName, appDescription, appType, aiModel });
      
      const prompt = `Crea una app web HTML completa chiamata "${appName}".

DESCRIZIONE: ${appDescription}
TIPO: ${appType}

REQUISITI:
- Crea un'app HTML completa e funzionante
- Usa HTML5, CSS3 e JavaScript moderno
- Includi tutti gli stili CSS necessari
- Aggiungi funzionalità JavaScript interattive
- Rendi l'app responsive e user-friendly
- Usa un design moderno e accattivante
- Includi icone e elementi visivi appropriati
- Assicurati che l'app sia completamente autonoma

Implementa tutte le funzionalità richieste senza usare placeholder.`;

      const response = await aiServiceManager.generateResponse(prompt, {
        model: aiModel,
        temperature: 0.7,
        maxTokens: 4000
      });

      let generatedCode = response;
      
      // Estrai il codice HTML dalla risposta
      const htmlMatch = generatedCode.match(/```html\n?([\s\S]*?)\n?```/);
      if (htmlMatch) {
        generatedCode = htmlMatch[1];
      } else {
        // Se non c'è un blocco HTML, cerca di estrarre il codice HTML
        const htmlStart = generatedCode.indexOf('<html');
        const htmlEnd = generatedCode.lastIndexOf('</html>') + 7;
        if (htmlStart !== -1 && htmlEnd !== -1) {
          generatedCode = generatedCode.substring(htmlStart, htmlEnd);
        }
      }
      
      // Crea l'oggetto app
      const app = {
        id: Date.now().toString(),
        name: appName,
        description: appDescription,
        icon: getIconForType(appType),
        code: generatedCode,
        type: appType,
        model: aiModel,
        createdAt: new Date().toISOString(),
        uniqueId: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'ai-generated'
      };
      
      setCurrentApp(app);
      setPreviewOpen(true);
      
      // Inizializza la chat con il prompt e la risposta
      setChatMessages([
        { role: 'system', content: 'Sei un assistente per modificare app generate con AI. L\'utente può chiederti di modificare l\'app corrente.' },
        { role: 'user', content: prompt },
        { role: 'assistant', content: response }
      ]);
      
      console.log('✅ App generata con successo!');
      showToast('App generata con successo!', 'success');
      
    } catch (error) {
      console.error('❌ Errore generazione:', error);
      showToast('Errore durante la generazione: ' + error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Importa app in AIdeas
  const handleImportApp = async () => {
    if (!currentApp) return;
    
    try {
      console.log('📤 Avvio importazione app:', currentApp);
      
      // Se è una modifica di un'app esistente, aggiorna quella nella lista
      if (currentApp.isModification && currentApp.originalAppId) {
        const updatedApps = generatedApps.map(app => 
          app.id === currentApp.originalAppId ? currentApp : app
        );
        setGeneratedApps(updatedApps);
        await saveGeneratedApps(updatedApps);
      } else {
        // Aggiungi l'app alla lista generate (nuova app)
        const updatedApps = [currentApp, ...generatedApps];
        setGeneratedApps(updatedApps);
        await saveGeneratedApps(updatedApps);
      }
      
      // Chiama la callback per importare in AIdeas
      if (onAppGenerated) {
        const appData = {
          name: currentApp.name,
          description: currentApp.description,
          icon: currentApp.icon,
          htmlContent: currentApp.code, // Il contenuto HTML pulito
          type: currentApp.type || 'utility',
          category: 'AI Generated',
          model: currentApp.model,
          originalPrompt: `Crea una app web HTML completa chiamata "${currentApp.name}". DESCRIZIONE: ${currentApp.description} TIPO: ${currentApp.type}`,
          // Aggiungi informazioni per il controllo duplicati
          isModification: currentApp.isModification || false,
          originalAppId: currentApp.originalAppId || null,
          originalUniqueId: currentApp.originalUniqueId || null
        };
        
        console.log('📦 Dati app da passare:', appData);
        onAppGenerated(appData);
      }
      
      showToast('✅ App importata in AIdeas!', 'success');
      
    } catch (error) {
      console.error('❌ Errore importazione:', error);
      showToast('Errore durante l\'importazione: ' + error.message, 'error');
    }
  };

  // Rigenera app
  const handleRegenerateApp = () => {
    if (!currentApp) return;
    
    setFormData({
      appName: currentApp.name,
      appDescription: currentApp.description,
      appType: currentApp.type,
      aiModel: currentApp.model
    });
    
    setCurrentApp(null);
    setPreviewOpen(false);
    setChatOpen(false);
  };

  // Modifica app corrente
  const handleModifyApp = async () => {
    if (!currentApp) return;
    
    setChatOpen(true);
    setChatMessages([
      { role: 'system', content: 'Sei un assistente per modificare app generate con AI. L\'utente può chiederti di modificare l\'app corrente.' }
    ]);
  };

  // Modifica app dalla lista generate
  const handleEditGeneratedApp = (app) => {
    setCurrentApp(app);
    setPreviewOpen(true);
    setChatOpen(true);
    setChatMessages([
      { role: 'system', content: 'Sei un assistente per modificare app generate con AI. L\'utente può chiederti di modificare l\'app corrente.' }
    ]);
  };

  // Modifica app installata in AIdeas (chiamata dal main)
  const handleEditInstalledApp = async (appId) => {
    try {
      // Ottieni i dati dell'app da StorageService
      const appData = await StorageService.getApp(appId);
      if (!appData) {
        showToast('App non trovata', 'error');
        return;
      }

      // Crea un oggetto app compatibile con il formato delle app generate
      const app = {
        id: appData.id,
        name: appData.name,
        description: appData.description,
        icon: appData.icon,
        code: appData.content, // Il contenuto HTML
        type: appData.metadata?.type || 'utility',
        model: appData.metadata?.aiModel || 'unknown',
        createdAt: appData.timestamp || new Date().toISOString(),
        uniqueId: appData.uniqueId,
        isInstalled: true,
        originalAppId: appData.id
      };

      setCurrentApp(app);
      setPreviewOpen(true);
      setChatOpen(true);
      setChatMessages([
        { role: 'system', content: 'Sei un assistente per modificare app generate con AI. L\'utente può chiederti di modificare l\'app corrente.' }
      ]);

    } catch (error) {
      console.error('Errore caricamento app per modifica:', error);
      showToast('Errore nel caricamento dell\'app', 'error');
    }
  };

  // State per conferma aggiornamento
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false);
  const [appToUpdate, setAppToUpdate] = useState(null);

  // Aggiorna app nella lista generate con le modifiche
  const handleUpdateGeneratedApp = async (app) => {
    if (!currentApp || !currentApp.isModification) {
      showToast('Nessuna modifica da applicare', 'warning');
      return;
    }

    setAppToUpdate(app);
    setUpdateConfirmOpen(true);
  };

  // Conferma aggiornamento app
  const handleConfirmUpdate = async () => {
    if (!appToUpdate || !currentApp) return;

    try {
      // Aggiorna l'app nella lista generate
      const updatedApps = generatedApps.map(generatedApp => 
        generatedApp.id === appToUpdate.id ? currentApp : generatedApp
      );
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
      
      showToast('App aggiornata nella lista generate', 'success');
    } catch (error) {
      console.error('❌ Errore aggiornamento app:', error);
      showToast('Errore aggiornamento app', 'error');
    } finally {
      setUpdateConfirmOpen(false);
      setAppToUpdate(null);
    }
  };

  // Annulla aggiornamento
  const handleCancelUpdate = () => {
    setUpdateConfirmOpen(false);
    setAppToUpdate(null);
  };

  // Esponi la funzione globalmente quando il componente è montato
  useEffect(() => {
    window.handleEditInstalledApp = handleEditInstalledApp;
    
    return () => {
      delete window.handleEditInstalledApp;
    };
  }, []);

  // Invia messaggio chat
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !currentApp) return;
    
    const message = chatInput.trim();
    setChatInput('');
    setIsModifying(true);
    
    try {
      // Aggiungi messaggio utente
      setChatMessages(prev => [...prev, { role: 'user', content: message }]);
      
      const modifyPrompt = `RICHIESTA DI MODIFICA: ${message}

CODICE ATTUALE DELL'APP:
${currentApp.code}

Modifica il codice HTML in base alla richiesta, mantenendo tutte le funzionalità esistenti e aggiungendo le 
modifiche richieste. Restituisci SOLO il codice HTML completo modificato.`;

      const response = await aiServiceManager.generateResponse(modifyPrompt, {
        model: currentApp.model || 'openai/gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000
      });

      const fullResponse = response;
      
      // Estrai il codice HTML dalla risposta
      const htmlMatch = fullResponse.match(/```html\n?([\s\S]*?)\n?```/);
      const newCode = htmlMatch ? htmlMatch[1] : fullResponse.replace(/```html\n?/g, '').replace(/```\n?/g, '');
      
      // Aggiorna app con nuovo codice e marca come modifica
      const updatedApp = { 
        ...currentApp, 
        code: newCode,
        isModification: true,
        originalAppId: currentApp.originalAppId || currentApp.id,
        originalUniqueId: currentApp.originalUniqueId || currentApp.uniqueId
      };
      setCurrentApp(updatedApp);
      
      // Mostra la risposta completa dell'AI (senza il codice HTML)
      const aiResponse = htmlMatch ? 
        fullResponse.replace(/```html\n?[\s\S]*?\n?```/, '[Codice HTML aggiornato automaticamente]') :
        fullResponse;
      
      // Aggiorna chat
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // NON aggiornare la lista generate qui - verrà fatto solo quando si clicca su "Importa"
      // Questo evita che tutte le app mostrino il nuovo codice
      
    } catch (error) {
      console.error('Errore modifica:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Errore nella modifica: ' + error.message }]);
    } finally {
      setIsModifying(false);
    }
  };

  // Scarica app
  const handleDownloadApp = () => {
    if (!currentApp) return;
    
    const blob = new Blob([currentApp.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentApp.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lancia app in preview
  const handleLaunchApp = (app) => {
    try {
      const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!newWindow) {
        showToast('Il popup è stato bloccato. Abilita i popup per questo sito.', 'warning');
        return;
      }
      
      newWindow.document.write(app.code);
      newWindow.document.close();
      newWindow.document.title = app.name;
      
    } catch (error) {
      showToast('Errore nell\'apertura dell\'app: ' + error.message, 'error');
    }
  };

  // Elimina app
  const handleDeleteApp = async (appId) => {
    try {
      const updatedApps = generatedApps.filter(app => app.id !== appId);
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
      showToast('App eliminata', 'success');
    } catch (error) {
      console.error('❌ Errore eliminazione app:', error);
      showToast('Errore durante l\'eliminazione', 'error');
    }
  };

  // Ottieni icona per tipo
  const getIconForType = (type) => {
    const appType = appTypes.find(t => t.value === type);
    return appType ? appType.icon : '⚡';
  };

  // Gestione cambiamenti form
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Raggruppa modelli AI per select (usa solo modelli dinamici)
  const groupedModels = dynamicModels.reduce((groups, model) => {
    const group = model.group || '🆓 Modelli Gratuiti';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(model);
    return groups;
  }, {});

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '1200px', 
      mx: 'auto',
      p: { xs: 2, sm: 4 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header con pulsante di ritorno - Stile come StorePage */}
      <Box sx={{
        width: '100%',
        mb: 3,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <IconButton
          onClick={onNavigateBack}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              boxShadow: theme.shadows[4]
            },
            boxShadow: theme.shadows[2]
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
            🤖 Generatore AI
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea app intelligenti con l'aiuto dell'intelligenza artificiale
          </Typography>
        </Box>
        
        <IconButton
          onClick={loadGeneratedApps}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)'
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Contenuto principale - Layout come modale originale */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ width: '100%' }}>
        {/* Pannello sinistro - Form e App generate */}
        <Box sx={{ 
          flex: { lg: 1 }, 
          minWidth: { lg: '50%' }
        }}>
          {/* Sezione configurazione API */}
          <Paper sx={{ p: 3, mb: 3 }}>
            {!isAuthenticated ? (
              <Stack spacing={2}>
                <Typography variant="h6" color="primary">
                  🔑 Configurazione API Key
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configura la tua API key OpenRouter nelle impostazioni per generare app AI
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (onOpenSettings) {
                      onOpenSettings();
                    } else {
                      showToast('Apri le impostazioni e vai alla sezione AI', 'info');
                    }
                  }}
                  startIcon={<SettingsIcon />}
                  sx={{ 
                    width: '100%',
                    height: 48,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  Configura API Key
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h6" color="success.main">
                  ✅ API Key Configurata
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pronto per generare app AI con OpenRouter
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (onOpenSettings) {
                      onOpenSettings();
                    }
                  }}
                  startIcon={<SettingsIcon />}
                  sx={{ 
                    width: '100%',
                    height: 48,
                    fontSize: '1rem'
                  }}
                >
                  Modifica Configurazione
                </Button>
              </Stack>
            )}
          </Paper>

          {/* Form generazione */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              Genera Nuova App
            </Typography>
            
            <Box component="form" onSubmit={handleGenerateApp}>
              <TextField
                fullWidth
                label="Nome App"
                value={formData.appName}
                onChange={(e) => handleFormChange('appName', e.target.value)}
                placeholder="Es: Calcolatrice Avanzata"
                sx={{ mb: 2 }}
                disabled={!isAuthenticated}
                required
              />
              
              <TextField
                fullWidth
                label="Descrizione Dettagliata"
                value={formData.appDescription}
                onChange={(e) => handleFormChange('appDescription', e.target.value)}
                placeholder="Descrivi cosa deve fare l'app, che funzionalità deve avere, come deve apparire..."
                multiline
                rows={4}
                sx={{ mb: 2 }}
                disabled={!isAuthenticated}
                required
              />
              
              <FormControl fullWidth sx={{ mb: 2 }} disabled={!isAuthenticated}>
                <InputLabel>Tipo di App</InputLabel>
                <Select
                  value={formData.appType}
                  onChange={(e) => handleFormChange('appType', e.target.value)}
                  label="Tipo di App"
                  required
                >
                  {appTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{type.icon}</span>
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }} disabled={!isAuthenticated}>
                <InputLabel>Modello AI</InputLabel>
                <Select
                  value={formData.aiModel}
                  onChange={(e) => handleFormChange('aiModel', e.target.value)}
                  label="Modello AI"
                  required
                  disabled={modelsLoading}
                >
                  {Object.keys(groupedModels).length === 0 ? (
                    <MenuItem disabled>
                      {modelsLoading ? 'Caricamento modelli...' : 'Nessun modello disponibile'}
                    </MenuItem>
                  ) : (
                    Object.entries(groupedModels).map(([group, models]) => [
                      <MenuItem key={group} disabled sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        {group}
                      </MenuItem>,
                      ...models.map(model => (
                        <MenuItem key={model.value} value={model.value} sx={{ pl: 4 }}>
                          {model.label}
                        </MenuItem>
                      ))
                    ])
                  )}
                </Select>
                {modelsLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Caricamento modelli...
                    </Typography>
                  </Box>
                )}
              </FormControl>
              
              <Button
                variant="outlined"
                size="small"
                onClick={fetchAvailableModels}
                disabled={modelsLoading || !isAuthenticated}
                startIcon={<RefreshIcon />}
                sx={{ mb: 3 }}
                fullWidth
              >
                {modelsLoading ? 'Caricamento...' : 
                 dynamicModels.length > 0 ? `Aggiorna Modelli AI (${dynamicModels.length})` : 
                 'Carica Modelli AI'}
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={!isAuthenticated || isGenerating}
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AIIcon />}
              >
                {isGenerating ? 'Generazione in corso...' : '🎨 Genera App'}
              </Button>
            </Box>
          </Paper>

          {/* App generate */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AppsIcon color="secondary" />
              Le Tue App Generate ({generatedApps.length})
            </Typography>
            
            {generatedApps.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <AIIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2">
                  Nessuna app ancora generata
                </Typography>
              </Box>
            ) : (
              <List>
                {generatedApps.map(app => (
                  <ListItem key={app.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getIconForType(app.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={app.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {app.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip size="small" label={app.model} variant="outlined" />
                            <Chip size="small" label={new Date(app.createdAt).toLocaleDateString()} variant="outlined" />
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleLaunchApp(app)} title="Apri">
                        <PlayIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditGeneratedApp(app)} title="Modifica">
                        <ChatIcon />
                      </IconButton>
                      {currentApp && currentApp.isModification && currentApp.originalAppId === app.id && (
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdateGeneratedApp(app)} 
                          title="Aggiorna con modifiche"
                          color="primary"
                        >
                          <CheckIcon />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleDeleteApp(app.id)} title="Elimina">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>

        {/* Pannello destro - Preview e Chat */}
        <Box sx={{ 
          flex: { lg: 1 },
          minWidth: { lg: '50%' }
        }}>
          {previewOpen && currentApp ? (
            <>
              {/* Preview app */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AppsIcon color="primary" />
                  App Generata: {currentApp.name}
                </Typography>
                
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, height: 300, mb: 2, overflow: 'hidden' }}>
                  <iframe
                    srcDoc={currentApp.code}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    sandbox="allow-scripts allow-same-origin"
                    title="App Preview"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleImportApp}
                  >
                    Importa in AIdeas
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRegenerateApp}
                  >
                    Rigenera
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ChatIcon />}
                    onClick={handleModifyApp}
                  >
                    Modifica
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadApp}
                  >
                    Scarica
                  </Button>
                </Box>
              </Paper>

              {/* Chat per modifiche */}
              {chatOpen && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChatIcon color="secondary" />
                    Chat per Modifiche
                  </Typography>
                  
                  <Box sx={{ 
                    height: 200, 
                    overflowY: 'auto', 
                    mb: 2, 
                    p: 1, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    {chatMessages.map((msg, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: msg.role === 'user' 
                            ? theme.palette.primary.main 
                            : theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.08)' 
                              : 'rgba(0, 0, 0, 0.04)',
                          color: msg.role === 'user' 
                            ? 'white' 
                            : theme.palette.text.primary,
                          maxWidth: '85%',
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          wordBreak: 'break-word',
                          boxShadow: theme.shadows[1]
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold',
                            color: msg.role === 'user' ? 'white' : theme.palette.text.primary
                          }}>
                            {msg.role === 'user' ? '👤 Tu' : '🤖 AI'}:
                          </Typography>
                          {msg.role === 'user' && isModifying && index === chatMessages.length - 1 && (
                            <CircularProgress size={16} sx={{ color: 'white' }} />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{
                          color: msg.role === 'user' ? 'white' : theme.palette.text.primary,
                          lineHeight: 1.4
                        }}>
                          {msg.content}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Descrivi le modifiche che vuoi fare all'app..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      disabled={isModifying}
                      size="small"
                    />
                    <IconButton
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || isModifying}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Paper>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <AIIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Genera la tua prima app
              </Typography>
              <Typography variant="body2">
                Compila il form a sinistra e clicca "Genera App" per iniziare
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>

      {/* Dialog di conferma aggiornamento */}
      <Dialog
        open={updateConfirmOpen}
        onClose={handleCancelUpdate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Conferma Aggiornamento
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler aggiornare l'app "{appToUpdate?.name}" con le modifiche correnti?
            Questa azione sovrascriverà la versione precedente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpdate}>
            Annulla
          </Button>
          <Button onClick={handleConfirmUpdate} variant="contained" color="primary">
            Aggiorna
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIGeneratorPage; 