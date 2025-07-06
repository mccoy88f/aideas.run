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
    this.uiMode = 'auto';
    this.fallbackAttempted = false;
    this.loadingTimeout = null;
  }

  /**
   * Inizializza il caricamento dell'interfaccia
   */
  async init() {
    try {
      console.log('🎨 Inizializzazione UI Loader...');
      
      // Inizializza storage
      await StorageService.ensureDbOpen();
      
      // Carica impostazione UI mode
      this.uiMode = await StorageService.getSetting('uiMode', 'auto');
      console.log(`📱 Modalità UI configurata: ${this.uiMode}`);
      
      // Determina quale UI caricare
      const targetUI = await this.determineTargetUI();
      
      // Carica l'interfaccia appropriata
      await this.loadUI(targetUI);
      
    } catch (error) {
      console.error('❌ Errore inizializzazione UI Loader:', error);
      // Fallback di emergenza su vanilla
      await this.loadVanillaUI();
    }
  }

  /**
   * Determina quale interfaccia caricare basandosi sulle impostazioni
   */
  async determineTargetUI() {
    switch (this.uiMode) {
      case 'vanilla':
        return 'vanilla';
      case 'material':
        return 'material';
      case 'auto':
      default:
        return await this.detectBestUI();
    }
  }

  /**
   * Rileva automaticamente la migliore UI da utilizzare
   */
  async detectBestUI() {
    console.log('🔍 Rilevamento automatico UI...');
    
    // Controlla se Material UI è supportato
    const materialSupported = await this.checkMaterialUISupport();
    
    if (materialSupported) {
      console.log('✅ Material UI supportato, tentativo di caricamento...');
      return 'material';
    } else {
      console.log('⚠️ Material UI non supportato, uso vanilla');
      return 'vanilla';
    }
  }

  /**
   * Verifica se Material UI è supportato dal browser
   */
  async checkMaterialUISupport() {
    try {
      // Controlla supporto ES6 modules
      if (!window.import) {
        console.log('❌ ES6 modules non supportati');
        return false;
      }

      // Controlla se React è disponibile
      const reactCheck = await this.testModuleImport('react');
      if (!reactCheck) {
        console.log('❌ React non disponibile');
        return false;
      }

      // Controlla se Material UI è disponibile
      const muiCheck = await this.testModuleImport('@mui/material');
      if (!muiCheck) {
        console.log('❌ Material UI non disponibile');
        return false;
      }

      return true;
    } catch (error) {
      console.log('❌ Errore verifica Material UI:', error);
      return false;
    }
  }

  /**
   * Testa l'importazione di un modulo
   */
  async testModuleImport(moduleName) {
    try {
      // Timeout per evitare blocchi
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 3000);
      });

      const importPromise = import(moduleName);
      await Promise.race([importPromise, timeoutPromise]);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Carica l'interfaccia specificata
   */
  async loadUI(targetUI) {
    console.log(`🚀 Caricamento UI: ${targetUI}`);
    
    try {
      if (targetUI === 'material') {
        await this.loadMaterialUI();
      } else {
        await this.loadVanillaUI();
      }
    } catch (error) {
      console.error(`❌ Errore caricamento ${targetUI} UI:`, error);
      
      // Se è il primo tentativo e stiamo caricando Material UI, prova fallback
      if (!this.fallbackAttempted && targetUI === 'material') {
        console.log('🔄 Tentativo fallback su vanilla...');
        this.fallbackAttempted = true;
        await this.handleFallback();
      } else {
        // Fallback di emergenza
        await this.loadVanillaUI();
      }
    }
  }

  /**
   * Carica l'interfaccia Material UI
   */
  async loadMaterialUI() {
    console.log('🎨 Caricamento Material UI...');
    
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
      
      // Cancella timeout
      clearTimeout(this.loadingTimeout);
      
      console.log('✅ Material UI caricata con successo');
      
    } catch (error) {
      clearTimeout(this.loadingTimeout);
      console.error('❌ Errore durante caricamento Material UI:', error);
      throw error;
    }
  }

  /**
   * Carica l'interfaccia Vanilla
   */
  async loadVanillaUI() {
    console.log('🎨 Caricamento Vanilla UI...');
    
    try {
      // Carica il modulo vanilla
      const { default: AIdeasApp } = await import('./main.js');
      
      // Inizializza l'app
      const app = new AIdeasApp();
      
      // Rendi globale per debugging
      window.aideasApp = app;
      
      // Avvia applicazione
      await app.init();
      
      console.log('✅ Vanilla UI caricata con successo');
      
    } catch (error) {
      console.error('❌ Errore caricamento Vanilla UI:', error);
      throw error;
    }
  }

  /**
   * Gestisce il fallback da Material UI a Vanilla
   */
  async handleFallback() {
    try {
      console.log('🔄 Esecuzione fallback su Vanilla UI...');
      
      // Aggiorna impostazione per evitare futuri tentativi
      await StorageService.setSetting('uiMode', 'vanilla');
      
      // Mostra notifica all'utente
      showToast('Material UI non disponibile, passaggio a interfaccia classica', 'info');
      
      // Carica vanilla
      await this.loadVanillaUI();
      
    } catch (error) {
      console.error('❌ Errore durante fallback:', error);
      // Ultimo tentativo di caricamento vanilla
      await this.loadVanillaUI();
    }
  }

  /**
   * Cambia modalità UI (per uso esterno)
   */
  async changeUIMode(newMode) {
    try {
      console.log(`🔄 Cambio modalità UI da ${this.uiMode} a ${newMode}`);
      
      // Salva nuova impostazione
      await StorageService.setSetting('uiMode', newMode);
      this.uiMode = newMode;
      
      // Ricarica la pagina per applicare il cambio
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Errore cambio modalità UI:', error);
      showToast('Errore durante il cambio di interfaccia', 'error');
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