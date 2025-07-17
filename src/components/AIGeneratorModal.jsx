import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
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
  useMediaQuery
} from '@mui/material';
import StorageService from '../services/StorageService.js';
import { showToast } from '../utils/helpers.js';
import {
  Close as CloseIcon,
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
  Info as InfoIcon
} from '@mui/icons-material';

/**
 * Componente per la generazione di app tramite AI usando Puter.js
 */
const AIGeneratorModal = ({ open, onClose, onAppGenerated }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State per il form
  const [formData, setFormData] = useState({
    appName: '',
    appDescription: '',
    appType: '',
    aiModel: 'gpt-4o'
  });
  
  // State per l'autenticazione Puter
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  
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
  
  // Modelli AI disponibili
  const aiModels = [
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', group: '🔥 Consigliati' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)', group: '🔥 Consigliati' },
    { value: 'openrouter:deepseek/deepseek-r1', label: 'DeepSeek R1 (Gratuito)', group: '🔥 Consigliati' },
    { value: 'openrouter:openai/o1-mini', label: 'o1-mini (Reasoning)', group: '🔥 Consigliati' },
    { value: 'openrouter:microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini (Microsoft)', group: '⚡ Gratuiti' },
    { value: 'openrouter:microsoft/phi-3-medium-128k-instruct:free', label: 'Phi-3 Medium (Microsoft)', group: '⚡ Gratuiti' },
    { value: 'openrouter:mistralai/mistral-7b-instruct:free', label: 'Mistral 7B', group: '⚡ Gratuiti' },
    { value: 'openrouter:google/gemma-7b-it:free', label: 'Gemma 7B (Google)', group: '⚡ Gratuiti' },
    { value: 'openrouter:meta-llama/llama-3-8b-instruct:free', label: 'Llama 3 8B (Meta)', group: '⚡ Gratuiti' },
    { value: 'openrouter:qwen/qwen-2-7b-instruct:free', label: 'Qwen 2 7B', group: '⚡ Gratuiti' }
  ];
  
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

  // Inizializzazione Puter.js solo quando l'utente clicca su login
  const [puterInitialized, setPuterInitialized] = useState(false);

  // Inizializza Puter.js
  const initializePuter = async () => {
    try {
      // Carica Puter.js se non è già caricato
      if (typeof puter === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.onload = () => {
          setPuterInitialized(true);
          checkAuthStatus();
        };
        script.onerror = () => {
          console.error('Errore caricamento Puter.js');
        };
        document.head.appendChild(script);
      } else {
        setPuterInitialized(true);
        checkAuthStatus();
      }
    } catch (error) {
      console.error('Errore inizializzazione Puter:', error);
    }
  };

  // Controlla stato autenticazione
  const checkAuthStatus = async () => {
    if (!puterInitialized || typeof puter === 'undefined') return;
    
    try {
      const isSignedIn = puter.auth.isSignedIn();
      
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        setUserInfo(user);
        setIsAuthenticated(true);
        loadGeneratedApps();
      } else {
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Errore controllo auth:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Login con Puter
  const handleSignIn = async () => {
    if (!puterInitialized) {
      setAuthLoading(true);
      try {
        await initializePuter();
        setPuterInitialized(true);
        await checkAuthStatus();
      } catch (error) {
        showToast('Errore caricamento Puter: ' + error.message, 'error');
        setAuthLoading(false);
        return;
      }
    } else {
      setAuthLoading(true);
      await checkAuthStatus();
    }

    try {
      const currentURL = window.location.href;
      
      // Prova prima popup, poi redirect
      try {
        await puter.auth.signIn({ 
          mode: 'popup',
          redirectURL: currentURL
        });
      } catch (popupError) {
        console.log('Popup fallito, uso redirect:', popupError);
        await puter.auth.signIn({ 
          mode: 'redirect',
          redirectURL: currentURL
        });
      }
    } catch (error) {
      console.error('Errore login:', error);
      showToast('Errore durante il login: ' + error.message, 'error');
    }
  };

  // Logout
  const handleSignOut = async () => {
    try {
      await puter.auth.signOut();
      setIsAuthenticated(false);
      setUserInfo(null);
      setGeneratedApps([]);
    } catch (error) {
      console.error('Errore logout:', error);
    }
  };

  // Carica app generate
  const loadGeneratedApps = async () => {
    try {
      const savedApps = await puter.kv.get('ai-launcher-apps');
      if (savedApps) {
        setGeneratedApps(JSON.parse(savedApps));
      }
    } catch (error) {
      console.error('Errore caricamento app:', error);
    }
  };

  // Salva app generate
  const saveGeneratedApps = async (apps) => {
    try {
      await puter.kv.set('ai-launcher-apps', JSON.stringify(apps));
    } catch (error) {
      console.error('Errore salvataggio app:', error);
    }
  };

  // Genera app
  const handleGenerateApp = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast('Per usare l\'AI devi prima fare il login con Puter.', 'warning');
      return;
    }
    
    const { appName, appDescription, appType, aiModel } = formData;
    
    if (!appName || !appDescription || !appType) {
      showToast('Per favore compila tutti i campi richiesti', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `Crea una app web HTML completa chiamata "${appName}".

DESCRIZIONE: ${appDescription}
TIPO: ${appType}

REQUISITI SPECIFICI:
- File HTML singolo autocontenuto
- Design moderno e responsive  
- Funzionalità completamente implementate
- Solo tecnologie client-side (HTML, CSS, JS)
- Usa Material Design o design moderno
- Colori e stile coerenti con il tema dell'app

Implementa tutte le funzionalità richieste senza usare placeholder.`;

      const response = await puter.ai.chat(prompt, {
        model: aiModel
      });

      let generatedCode = response.message.content;
      
      // Pulisci il codice da eventuali markdown
      generatedCode = generatedCode.replace(/```html\n?/g, '').replace(/```\n?/g, '');
      
      const newApp = {
        id: Date.now(),
        name: appName,
        description: appDescription,
        type: appType,
        model: aiModel,
        code: generatedCode,
        icon: getIconForType(appType),
        createdAt: new Date().toISOString()
      };

      setCurrentApp(newApp);
      setPreviewOpen(true);
      
      // Inizializza chat history
      setChatMessages([
        { role: 'user', content: prompt },
        { role: 'assistant', content: response.message.content }
      ]);

    } catch (error) {
      console.error('Errore generazione:', error);
      showToast('Errore durante la generazione dell\'app: ' + error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Importa app in AIdeas
  const handleImportApp = async () => {
    if (!currentApp) return;
    
    try {
      // Aggiungi l'app alla lista generate
      const updatedApps = [currentApp, ...generatedApps];
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
      
      // Chiama la callback per importare in AIdeas
      if (onAppGenerated) {
        await onAppGenerated({
          name: currentApp.name,
          description: currentApp.description,
          icon: currentApp.icon,
          htmlContent: currentApp.code,
          source: 'ai-generated',
          metadata: {
            aiModel: currentApp.model,
            generatedAt: currentApp.createdAt,
            type: currentApp.type
          }
        });
      }
      
      // Reset form e chiudi preview
      setFormData({
        appName: '',
        appDescription: '',
        appType: '',
        aiModel: 'gpt-4o'
      });
      setPreviewOpen(false);
      setChatOpen(false);
      setCurrentApp(null);
      
    } catch (error) {
      console.error('Errore importazione:', error);
      showToast('Errore durante l\'importazione: ' + error.message, 'error');
    }
  };

  // Rigenera app
  const handleRegenerateApp = () => {
    setPreviewOpen(false);
    setChatOpen(false);
    setCurrentApp(null);
    // Il form mantiene i dati, quindi può essere riutilizzato
  };

  // Modifica app via chat
  const handleModifyApp = async () => {
    if (!currentApp) return;
    
    setChatOpen(true);
    setChatInput('');
  };

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

Modifica il codice HTML in base alla richiesta, mantenendo tutte le funzionalità esistenti e aggiungendo le modifiche richieste. Restituisci SOLO il codice HTML completo modificato.`;

      const response = await puter.ai.chat(modifyPrompt, {
        model: formData.aiModel
      });

      const newCode = response.message.content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
      
      // Aggiorna app con nuovo codice
      const updatedApp = { ...currentApp, code: newCode };
      setCurrentApp(updatedApp);
      
      // Aggiorna chat
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'App modificata con successo! 🎉' }]);
      
      // Aggiorna nella lista generate
      const updatedApps = generatedApps.map(app => 
        app.id === currentApp.id ? updatedApp : app
      );
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
      
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

  // Elimina app generata
  const handleDeleteApp = async (appId) => {
    if (confirm('Sei sicuro di voler eliminare questa app?')) {
      const updatedApps = generatedApps.filter(app => app.id !== appId);
      setGeneratedApps(updatedApps);
      await saveGeneratedApps(updatedApps);
    }
  };

  // Utility functions
  const getIconForType = (type) => {
    const typeInfo = appTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : '⚡';
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Raggruppa modelli AI per select
  const groupedModels = aiModels.reduce((groups, model) => {
    if (!groups[model.group]) {
      groups[model.group] = [];
    }
    groups[model.group].push(model);
    return groups;
  }, {});

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(20px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Genera App con AI
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ height: '100%' }}>
          {/* Pannello sinistro - Form e App generate */}
          <Box sx={{ 
            flex: { md: 1 }, 
            p: 3, 
            borderRight: { md: 1 }, 
            borderColor: 'divider',
            minWidth: { md: '50%' }
          }}>
            {/* Sezione autenticazione */}
            <Paper sx={{ p: 2, mb: 3, background: theme.palette.background.default }}>
              {authLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress sx={{ flexGrow: 1 }} />
                  <Typography variant="body2">Controllo autenticazione...</Typography>
                </Box>
              ) : isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={userInfo?.picture} sx={{ width: 32, height: 32 }}>
                      {userInfo?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">
                      Connesso come: {userInfo?.name || userInfo?.email}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={handleSignOut} variant="outlined">
                    Logout
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Per usare l'AI, devi fare il login gratuito con Puter
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={handleSignIn}
                    startIcon={<AIIcon />}
                  >
                    Accedi con Puter
                  </Button>
                </Box>
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
                
                <FormControl fullWidth sx={{ mb: 3 }} disabled={!isAuthenticated}>
                  <InputLabel>Modello AI</InputLabel>
                  <Select
                    value={formData.aiModel}
                    onChange={(e) => handleFormChange('aiModel', e.target.value)}
                    label="Modello AI"
                    required
                  >
                    {Object.entries(groupedModels).map(([group, models]) => [
                      <MenuItem key={group} disabled sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                        {group}
                      </MenuItem>,
                      ...models.map(model => (
                        <MenuItem key={model.value} value={model.value} sx={{ pl: 4 }}>
                          {model.label}
                        </MenuItem>
                      ))
                    ])}
                  </Select>
                </FormControl>
                
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!isAuthenticated || isGenerating}
                  startIcon={isGenerating ? <LinearProgress /> : <AIIcon />}
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
                          {app.icon}
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
            flex: { md: 1 }, 
            p: 3,
            minWidth: { md: '50%' }
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
                    
                    <Box sx={{ height: 200, overflowY: 'auto', mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      {chatMessages.map((msg, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            background: msg.role === 'user' ? 'primary.main' : 'background.default',
                            color: msg.role === 'user' ? 'white' : 'text.primary',
                            ml: msg.role === 'user' ? 'auto' : 0,
                            mr: msg.role === 'user' ? 0 : 'auto',
                            maxWidth: '80%'
                          }}
                        >
                          <Typography variant="body2">
                            <strong>{msg.role === 'user' ? '👤 Tu' : '🤖 AI'}:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {msg.content}
                          </Typography>
                        </Box>
                      ))}
                      {isModifying && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                          <LinearProgress sx={{ flexGrow: 1 }} />
                          <Typography variant="body2">Modifica in corso...</Typography>
                        </Box>
                      )}
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
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        background: theme.palette.mode === 'dark' 
          ? 'rgba(30, 41, 59, 0.8)'
          : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(20px)'
      }}>
        <Button onClick={onClose} variant="outlined">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIGeneratorModal; 