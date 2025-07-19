/**
 * AIdeas - UI Loader Moderno
 * Gestisce il caricamento dell'interfaccia Material UI con animazioni moderne
 */

import StorageService from './services/StorageService.js';
import { showToast } from './utils/helpers.js';
import { DEBUG } from './utils/debug.js';

/**
 * Classe per gestire il caricamento dell'interfaccia Material UI
 */
class UILoader {
  constructor() {
    this.loadingTimeout = null;
    this.initialized = false;
  }

  /**
   * Inizializza il caricamento dell'interfaccia Material UI
   */
  async init() {
    try {
      DEBUG.log('🎨 Inizializzazione UI Loader...');
      
      // Mostra loading screen moderno
      this.showLoadingScreen();
      
      // Assicura che il database sia aperto
      await StorageService.ensureDbOpen();
      
      // Carica Material UI
      await this.loadMaterialUI();
      
      DEBUG.success('✅ UI Loader inizializzato con successo');
      
    } catch (error) {
      DEBUG.error('❌ Errore inizializzazione UI Loader:', error);
      showToast('Impossibile caricare l\'interfaccia', 'error');
      this.showErrorScreen(error);
    }
  }

  /**
   * Mostra loading screen moderno
   */
  showLoadingScreen() {
    // Usa il loading screen esistente dall'HTML
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
      loadingScreen.style.opacity = '1';
      
      // Aggiorna il messaggio per l'inizializzazione
      const subtitle = loadingScreen.querySelector('.loading-subtitle');
      if (subtitle) {
        subtitle.textContent = 'Inizializzazione Material UI...';
      }
    }
  }

  /**
   * Aggiunge stili moderni per il loading screen
   */
  addLoadingStyles() {
    if (document.getElementById('loading-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      #loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        opacity: 1;
        transition: opacity 0.5s ease-out;
      }

      .loading-container {
        text-align: center;
        color: white;
        animation: fadeInUp 0.8s ease-out;
      }

      .aideas-logo {
        margin-bottom: 40px;
        animation: pulse 2s infinite;
      }

      .logo-icon {
        font-size: 60px;
        margin-bottom: 10px;
        animation: bounce 2s infinite;
      }

      .logo-text {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 2px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      }

      .loading-spinner {
        position: relative;
        margin: 30px auto;
        width: 80px;
        height: 80px;
      }

      .spinner-ring {
        position: absolute;
        border: 3px solid transparent;
        border-top: 3px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .spinner-ring:nth-child(1) {
        width: 80px;
        height: 80px;
        animation-delay: 0s;
      }

      .spinner-ring:nth-child(2) {
        width: 60px;
        height: 60px;
        top: 10px;
        left: 10px;
        animation-delay: -0.3s;
        border-top-color: rgba(255,255,255,0.7);
      }

      .spinner-ring:nth-child(3) {
        width: 40px;
        height: 40px;
        top: 20px;
        left: 20px;
        animation-delay: -0.6s;
        border-top-color: rgba(255,255,255,0.4);
      }

      .loading-text {
        font-size: 18px;
        font-weight: 600;
        margin: 20px 0 10px 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      }

      .loading-subtitle {
        font-size: 14px;
        opacity: 0.8;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .loading-fade-out {
        opacity: 0;
        transform: translateY(-20px);
      }

      .error-screen {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      }

      .error-screen .loading-text {
        color: #ffffff;
      }

      .error-screen .loading-subtitle {
        color: rgba(255,255,255,0.9);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Carica l'interfaccia Material UI
   */
  async loadMaterialUI() {
    DEBUG.log('🎨 Caricamento Material UI...');
    
    // Controlla se è già stato inizializzato
    if (this.initialized) {
      DEBUG.log('⚠️ Material UI già inizializzato, skip');
      return;
    }
    
    // Nascondi il loading screen HTML IMMEDIATAMENTE
    // Questo evita conflitti visivi tra il loading screen HTML e il componente React
    this.hideLoadingScreen();
    
    // Mostra il container dell'app
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.style.display = '';
      DEBUG.log('🎯 Container app reso visibile');
    }
    
    // Timeout per evitare blocchi
    this.loadingTimeout = setTimeout(() => {
      throw new Error('Timeout caricamento Material UI (10s)');
    }, 10000);

    try {
      // Importa il modulo Material UI
      const { initializeAIdeasWithMaterialUI } = await import('./main-material.jsx');
      
      DEBUG.log('🔧 Funzione di inizializzazione ottenuta:', typeof initializeAIdeasWithMaterialUI);
      
      // Inizializza l'app
      DEBUG.log('🚀 Avvio inizializzazione Material UI...');
      await initializeAIdeasWithMaterialUI();
      
      // Marca come inizializzato
      this.initialized = true;
      
      // Cancella timeout
      clearTimeout(this.loadingTimeout);
      
      DEBUG.success('✅ Material UI caricata con successo');
      
    } catch (error) {
      clearTimeout(this.loadingTimeout);
      DEBUG.error('❌ Errore durante caricamento Material UI:', error);
      throw error;
    }
  }

  /**
   * Aggiorna il testo del loading screen
   */
  updateLoadingText(mainText, subText) {
    const loadingText = document.querySelector('.loading-text');
    const loadingSubtitle = document.querySelector('.loading-subtitle');
    
    if (loadingText) loadingText.textContent = mainText;
    if (loadingSubtitle) loadingSubtitle.textContent = subText;
  }

  /**
   * Mostra schermata di errore
   */
  showErrorScreen(error) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('error-screen');
      this.updateLoadingText('Errore caricamento interfaccia', error.message || 'Errore sconosciuto');
      
      // Rimuovi spinner e mostra icona errore
      const spinner = loadingScreen.querySelector('.loading-spinner');
      if (spinner) {
        spinner.innerHTML = '<div style="font-size: 60px; color: white;">❌</div>';
      }
    }
  }

  /**
   * Nasconde il loading screen con animazione
   */
  hideLoadingScreen() {
    try {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        // Nascondi immediatamente senza animazione per evitare conflitti
        loadingScreen.style.display = 'none';
        DEBUG.log('🎯 Loading screen nascosto immediatamente');
      }
    } catch (error) {
      DEBUG.error('❌ Errore nascondere loading screen:', error);
    }
  }

  /**
   * Cleanup risorse
   */
  cleanup() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    
    // Rimuovi stili se necessario
    const loadingStyles = document.getElementById('loading-styles');
    if (loadingStyles) {
      loadingStyles.remove();
    }
  }
}

// Esporta per uso esterno
window.UILoader = UILoader;

// Auto-inizializzazione
const uiLoader = new UILoader();

// Inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => uiLoader.init());
} else {
  uiLoader.init();
}

export default UILoader; 