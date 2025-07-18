import React, { useState, useEffect, useRef } from 'react';
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
  useMediaQuery,
  CircularProgress
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
  Info as InfoIcon,
  Person as PersonIcon,
  Logout as LogoutIcon
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
  
  // Inizializzazione Puter.js solo quando l'utente clicca su login
  const [puterInitialized, setPuterInitialized] = useState(false);
  
  // Ref per mantenere l'istanza Puter
  const puterRef = useRef(null);
  
  // Flag per indicare se il login è in corso
  const [loginInProgress, setLoginInProgress] = useState(false);

  // Modelli AI disponibili (solo quelli supportati da Puter)
  const aiModels = [
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI)', group: '🔥 Consigliati' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)', group: '🔥 Consigliati' },
    { value: 'openrouter:deepseek/deepseek-r1', label: 'DeepSeek R1 (Gratuito)', group: '🔥 Consigliati' },
    { value: 'openrouter:openai/o1-mini', label: 'o1-mini (Reasoning)', group: '🔥 Consigliati' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)', group: '⚡ Altri' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)', group: '⚡ Altri' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku (Anthropic)', group: '⚡ Altri' },
    { value: 'gemini-pro', label: 'Gemini Pro (Google)', group: '⚡ Altri' }
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

  // Controlla stato autenticazione quando Puter è inizializzato
  useEffect(() => {
    // Non controllare automaticamente l'autenticazione quando Puter viene inizializzato
    // Il controllo verrà fatto solo quando l'utente clicca su login o quando torna da un redirect
  }, [puterInitialized]);

  // Controlla autenticazione quando il modale si apre
  useEffect(() => {
    if (open) {
      console.log('🚪 Modale aperto, controllo stato autenticazione...');
      
      // Prima prova a caricare lo stato salvato (come Google Drive)
      const loaded = loadAuthState();
      if (loaded) {
        console.log('✅ Stato autenticazione caricato da localStorage');
      }
      
      // Se Puter è già disponibile globalmente, controlla lo stato
      if (window.puter && !puterInitialized) {
        console.log('✅ Puter già disponibile globalmente');
        puterRef.current = window.puter;
        setPuterInitialized(true);
        // Controlla subito l'autenticazione se Puter è disponibile
        setTimeout(() => {
          checkAuthStatus();
        }, 500);
      }
      
      // Controlla se c'è un parametro di ritorno dall'autenticazione
      const urlParams = new URLSearchParams(window.location.search);
      const authReturn = urlParams.get('auth_return');
      
      if (authReturn === 'success') {
        console.log('🔄 Rilevato ritorno da autenticazione');
        // Rimuovi il parametro dall'URL
        const newURL = new URL(window.location);
        newURL.searchParams.delete('auth_return');
        window.history.replaceState({}, '', newURL);
        
        // Controlla l'autenticazione dopo un breve delay
        setTimeout(() => {
          if (window.puter) {
            puterRef.current = window.puter;
            setPuterInitialized(true);
            checkAuthStatus();
          }
        }, 1000);
      }
    }
  }, [open]);

  // Listener intelligente per cambiamenti di stato Puter
  useEffect(() => {
    // Listener per cambiamenti di visibilità della pagina
    const handleVisibilityChange = () => {
      // Non controllare se il login è in corso
      if (loginInProgress) {
        console.log('⏳ Login in corso, salto controllo visibility');
        return;
      }
      
      if (!document.hidden && window.puter && !isAuthenticated && puterInitialized) {
        puterRef.current = window.puter;
        // Aspetta un momento prima di controllare l'autenticazione
        setTimeout(() => {
          checkAuthStatus();
        }, 1000);
      }
    };

    // Listener per messaggi da Puter (se supportato)
    const handleMessage = (event) => {
      if (event.origin === 'https://puter.com' && event.data?.type === 'auth') {
        // Non controllare se il login è in corso
        if (loginInProgress) {
          console.log('⏳ Login in corso, salto controllo messaggio');
          return;
        }
        
        if (window.puter && !isAuthenticated && puterInitialized) {
          puterRef.current = window.puter;
          // Aspetta un momento prima di controllare l'autenticazione
          setTimeout(() => {
            checkAuthStatus();
          }, 1000);
        }
      }
    };

    // Controllo periodico per autenticazione (solo se non autenticato)
    const authCheckInterval = setInterval(() => {
      if (!loginInProgress && !isAuthenticated && puterInitialized && window.puter) {
        puterRef.current = window.puter;
        checkAuthStatus();
      }
    }, 3000); // Controlla ogni 3 secondi

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('message', handleMessage);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('message', handleMessage);
      clearInterval(authCheckInterval);
    };
  }, [isAuthenticated, puterInitialized, loginInProgress]);

  // Salva stato quando cambia (come Google Drive)
  useEffect(() => {
    if (puterInitialized) {
      saveAuthState();
    }
  }, [isAuthenticated, userInfo]);

  // Inizializza Puter.js
  const initializePuter = async () => {
    try {
      console.log('🔄 Inizializzazione Puter...');
      
      // Carica Puter.js se non è già caricato
      if (typeof window.puter === 'undefined') {
        console.log('📥 Caricamento script Puter...');
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('✅ Script Puter caricato');
            // Aspetta un momento per assicurarsi che Puter sia completamente caricato
            setTimeout(() => {
              if (window.puter) {
                puterRef.current = window.puter;
                setPuterInitialized(true);
                console.log('✅ Puter inizializzato con successo');
                resolve();
              } else {
                console.error('❌ Puter non disponibile dopo il caricamento');
                reject(new Error('Puter non disponibile dopo il caricamento'));
              }
            }, 500); // Aumentato il timeout
          };
          script.onerror = (error) => {
            console.error('❌ Errore caricamento script Puter:', error);
            reject(error);
          };
          document.head.appendChild(script);
        });
      } else {
        // Puter è già caricato
        console.log('✅ Puter già disponibile');
        puterRef.current = window.puter;
        setPuterInitialized(true);
      }
    } catch (error) {
      console.error('❌ Errore inizializzazione Puter:', error);
      throw error;
    }
  };

  // Controlla stato autenticazione (approccio intelligente)
  const checkAuthStatus = async () => {
    if (!puterInitialized || !puterRef.current) {
      console.log('⏳ Puter non ancora inizializzato');
      return;
    }
    
    try {
      console.log('🔍 Controllo stato autenticazione...');
      
      // Controlla se siamo già autenticati per evitare controlli inutili
      if (isAuthenticated && userInfo) {
        console.log('✅ Già autenticato');
        return;
      }

      const isSignedIn = puterRef.current.auth.isSignedIn();
      console.log('🔐 Stato autenticazione:', isSignedIn);
      
      if (isSignedIn) {
        const user = await puterRef.current.auth.getUser();
        console.log('👤 Utente completo:', user);
        
        // Verifica che l'utente abbia un username valido (non utente temporaneo)
        if (user && user.username && !user.is_temp && user.username !== '') {
          // Aggiorna solo se i dati sono cambiati
          if (!userInfo || userInfo.uuid !== user.uuid) {
            setUserInfo(user);
            setIsAuthenticated(true);
            await loadGeneratedApps();
            saveAuthState(); // Salva stato come Google Drive
            showToast(`✅ Autenticazione completata come ${user.username}`, 'success');
          }
        } else {
          console.log('⚠️ Utente temporaneo o senza username, non considerare autenticato');
          console.log('👤 Dettagli utente:', { username: user?.username, is_temp: user?.is_temp });
          // Non considerare autenticato se è un utente temporaneo
          if (isAuthenticated) {
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        }
      } else {
        // Aggiorna solo se lo stato è cambiato
        if (isAuthenticated) {
          setIsAuthenticated(false);
          setUserInfo(null);
          setGeneratedApps([]);
        }
      }
    } catch (error) {
      console.error('❌ Errore controllo auth:', error);
      // Non aggiornare lo stato se c'è un errore temporaneo
      if (isAuthenticated) {
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Login con Puter
  const handleSignIn = async () => {
    setAuthLoading(true);
    setLoginInProgress(true);
    
    try {
      console.log('🚀 Avvio processo di login...');
      
      // Controlla se Puter è già disponibile globalmente
      if (window.puter && !puterInitialized) {
        console.log('✅ Puter già disponibile globalmente');
        puterRef.current = window.puter;
        setPuterInitialized(true);
      }
      
      // Inizializza Puter se necessario
      if (!puterInitialized) {
        console.log('🔄 Inizializzazione Puter necessaria...');
        await initializePuter();
      }
      
      if (!puterRef.current) {
        throw new Error('Puter non inizializzato');
      }

      const currentURL = window.location.href;
      const redirectURL = new URL(currentURL);
      redirectURL.searchParams.set('auth_return', 'success');
      
      console.log('🌐 URL corrente:', currentURL);
      console.log('🔄 URL di redirect:', redirectURL.toString());
      
      // Prova prima popup, poi redirect
      try {
        console.log('🪟 Tentativo login con popup...');
        await puterRef.current.auth.signIn({ 
          mode: 'popup',
          redirectURL: redirectURL.toString()
        });
        console.log('✅ Login popup completato');
        
        // Aspetta un momento prima di controllare l'autenticazione
        // per dare tempo al popup di completare il processo
        setTimeout(() => {
          setLoginInProgress(false);
          checkAuthStatus();
        }, 3000); // Aumentato a 3 secondi
        
      } catch (popupError) {
        console.log('⚠️ Popup fallito, uso redirect:', popupError);
        await puterRef.current.auth.signIn({ 
          mode: 'redirect',
          redirectURL: redirectURL.toString()
        });
        console.log('✅ Login redirect completato');
        setLoginInProgress(false);
        // Per il redirect, il controllo verrà fatto quando la pagina si ricarica
      }
    } catch (error) {
      console.error('❌ Errore login:', error);
      showToast('Errore durante il login: ' + error.message, 'error');
      setLoginInProgress(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleSignOut = async () => {
    if (!puterRef.current) return;
    
    try {
      await puterRef.current.auth.signOut();
      setIsAuthenticated(false);
      setUserInfo(null);
      setGeneratedApps([]);
      saveAuthState(); // Salva lo stato come Google Drive
      showToast('👋 Disconnesso da Puter', 'info');
    } catch (error) {
      console.error('Errore logout:', error);
    }
  };

  // Carica app generate
  const loadGeneratedApps = async () => {
    if (!puterRef.current) return;
    
    try {
      const savedApps = await puterRef.current.kv.get('ai-launcher-apps');
      if (savedApps) {
        setGeneratedApps(JSON.parse(savedApps));
      }
    } catch (error) {
      console.error('Errore caricamento app:', error);
    }
  };

  // Salva app generate
  const saveGeneratedApps = async (apps) => {
    if (!puterRef.current) return;
    
    try {
      await puterRef.current.kv.set('ai-launcher-apps', JSON.stringify(apps));
    } catch (error) {
      console.error('Errore salvataggio app:', error);
    }
  };

  // Salva stato autenticazione (come Google Drive)
  const saveAuthState = () => {
    try {
      const authState = {
        isAuthenticated,
        userInfo,
        timestamp: Date.now()
      };
      localStorage.setItem('puter_auth_state', JSON.stringify(authState));
    } catch (error) {
      console.error('Errore salvataggio stato auth:', error);
    }
  };

  // Carica stato autenticazione (come Google Drive)
  const loadAuthState = () => {
    try {
      const saved = localStorage.getItem('puter_auth_state');
      if (saved) {
        const authState = JSON.parse(saved);
        // Verifica che i dati non siano troppo vecchi (24 ore)
        if (Date.now() - authState.timestamp < 24 * 60 * 60 * 1000) {
          setIsAuthenticated(authState.isAuthenticated);
          setUserInfo(authState.userInfo);
          return true;
        }
      }
    } catch (error) {
      console.error('Errore caricamento stato auth:', error);
    }
    return false;
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
      if (!puterRef.current) {
        throw new Error('Puter non inizializzato');
      }

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

      const response = await puterRef.current.ai.chat(prompt, {
        model: aiModel
      });

      let generatedCode = response.message.content;
      
      console.log('📄 Codice grezzo ricevuto:', generatedCode.substring(0, 200) + '...');
      
      // Pulisci il codice da eventuali markdown e testo extra
      generatedCode = generatedCode.replace(/```html\n?/g, '').replace(/```\n?/g, '');
      
      // Rimuovi tutto il testo prima del primo tag HTML
      const htmlStartIndex = generatedCode.search(/<!DOCTYPE html>|<html/i);
      if (htmlStartIndex !== -1) {
        generatedCode = generatedCode.substring(htmlStartIndex);
        console.log('✅ Trovato inizio HTML a posizione:', htmlStartIndex);
      } else {
        console.log('⚠️ Tag HTML non trovato, uso tutto il codice');
      }
      
      // Rimuovi tutto il testo dopo l'ultimo tag di chiusura HTML
      const htmlEndIndex = generatedCode.lastIndexOf('</html>');
      if (htmlEndIndex !== -1) {
        generatedCode = generatedCode.substring(0, htmlEndIndex + 7); // +7 per includere </html>
        console.log('✅ Trovata fine HTML a posizione:', htmlEndIndex);
      } else {
        console.log('⚠️ Tag di chiusura HTML non trovato');
      }
      
      // Rimuovi eventuali spiegazioni o testo extra rimanente
      generatedCode = generatedCode.replace(/###.*?(?=<!DOCTYPE html>|<html)/gis, '');
      generatedCode = generatedCode.replace(/###.*?(?=<\/html>)/gis, '');
      generatedCode = generatedCode.replace(/Spiegazione.*$/gis, '');
      generatedCode = generatedCode.replace(/Note.*$/gis, '');
      generatedCode = generatedCode.replace(/Come Utilizzare.*$/gis, '');
      generatedCode = generatedCode.replace(/Caratteristiche.*$/gis, '');
      generatedCode = generatedCode.replace(/Codice Completo:.*$/gis, '');
      generatedCode = generatedCode.replace(/Spero che questa soluzione.*$/gis, '');
      generatedCode = generatedCode.replace(/Se hai ulteriori domande.*$/gis, '');
      
      // Rimuovi righe vuote multiple e spazi extra
      generatedCode = generatedCode.replace(/\n\s*\n\s*\n/g, '\n\n');
      generatedCode = generatedCode.trim();
      
      console.log('🧹 Codice HTML pulito:', generatedCode.substring(0, 200) + '...');
      console.log('📏 Lunghezza codice finale:', generatedCode.length);
      
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
          type: currentApp.type || 'utility', // Assicura che il tipo sia sempre definito
          category: 'ai-generated'
        });
      }
      
      showToast('✅ App importata con successo!', 'success');
      onClose();
    } catch (error) {
      console.error('Errore importazione app:', error);
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
    if (!chatInput.trim() || !currentApp || !puterRef.current) return;
    
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

      const response = await puterRef.current.ai.chat(modifyPrompt, {
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
            <Box sx={{ mb: 3 }}>
              {!isAuthenticated ? (
                <Stack spacing={2}>
                  <Typography variant="h6" color="primary">
                    🔐 Autenticazione Puter
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accedi con il tuo account Puter per generare app AI
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleSignIn}
                    disabled={authLoading}
                    startIcon={authLoading ? <CircularProgress size={20} /> : <PersonIcon />}
                    sx={{ 
                      width: '100%',
                      height: 48,
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {authLoading ? 'Accesso in corso...' : 'Accedi con Puter'}
                  </Button>
                  {authLoading && (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <LinearProgress 
                        sx={{ 
                          height: 4, 
                          borderRadius: 2,
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 'primary.main'
                          }
                        }} 
                      />
                    </Box>
                  )}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="h6" color="success.main">
                    ✅ Autenticato come {userInfo?.username || 'Utente'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pronto per generare app AI
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleSignOut}
                    startIcon={<LogoutIcon />}
                    sx={{ 
                      width: '100%',
                      height: 48,
                      fontSize: '1rem'
                    }}
                  >
                    Disconnetti
                  </Button>
                </Stack>
              )}
            </Box>

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