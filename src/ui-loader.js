/**
 * AIdeas - UI Loader Intelligente
 * Gestisce il caricamento dell'interfaccia con fallback automatico
 */

import StorageService from './services/StorageService.js';
import { showToast } from './utils/helpers.js';

/**
 * Classe per gestire il caricamento intelligente dell'UI
 */
class UILoader {
  constructor() {
    this.fallbackAttempted = false;
    this.loadingTimeout = null;
  }

  /**
   * Inizializza il caricamento dell'interfaccia
   */
  async init() {
    try {
      console.log('🎨 Inizializzazione UI Loader...');
      await StorageService.ensureDbOpen();
      // Carica solo Material UI
      await this.loadMaterialUI();
    } catch (error) {
      console.error('❌ Errore inizializzazione UI Loader:', error);
      // Mostra errore all'utente
      showToast('Impossibile caricare l\'interfaccia Material UI', 'error');
    }
  }

  /**
   * Carica l'interfaccia specificata
   */
  async loadUI(targetUI) {
    // Rimosso: ora carica solo Material UI
    await this.loadMaterialUI();
  }

  /**
   * Carica l'interfaccia Material UI
   */
  async loadMaterialUI() {
    console.log('🎨 Caricamento Material UI...');
    
    // Controlla se è già stato inizializzato
    if (window.aideasMaterialUIInitialized) {
      console.log('⚠️ Material UI già inizializzato, skip');
      return;
    }
    
    // Timeout per evitare blocchi
    this.loadingTimeout = setTimeout(() => {
      throw new Error('Timeout caricamento Material UI');
    }, 10000);

    try {
      console.log('📦 Importazione modulo Material UI...');
      // Carica il modulo Material UI
      const { initializeAIdeasWithMaterialUI } = await import('./main-material.jsx');
      
      console.log('🔧 Funzione di inizializzazione ottenuta:', typeof initializeAIdeasWithMaterialUI);
      
      // Inizializza l'app
      console.log('🚀 Avvio inizializzazione Material UI...');
      initializeAIdeasWithMaterialUI();
      
      // Marca come inizializzato
      window.aideasMaterialUIInitialized = true;
      
      // Cancella timeout
      clearTimeout(this.loadingTimeout);
      
      console.log('✅ Material UI caricata con successo');
      
      // Nascondi il loading screen
      this.hideLoadingScreen();
      
    } catch (error) {
      clearTimeout(this.loadingTimeout);
      console.error('❌ Errore durante caricamento Material UI:', error);
      throw error;
    }
  }

  /**
   * Nasconde il loading screen
   */
  hideLoadingScreen() {
    try {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('🎯 Loading screen nascosto');
      }
    } catch (error) {
      console.error('❌ Errore nascondere loading screen:', error);
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