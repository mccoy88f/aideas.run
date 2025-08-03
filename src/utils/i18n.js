/**
 * Sistema di internazionalizzazione per AIdeas
 * Gestisce le traduzioni e la lingua dell'applicazione
 */

// Traduzioni disponibili
const TRANSLATIONS = {
  it: {
    // Impostazioni generali
    settings: {
      general: 'Generali',
      appearance: 'Aspetto',
      notifications: 'Notifiche',
      backup: 'Backup/Ripristino',
      cloudsync: 'Sincronizzazione Cloud',
      github: 'GitHub',
      security: 'Sicurezza',
      ai: 'Intelligenza Artificiale'
    },
    
    // Impostazioni generali
    general: {
      username: 'Nome utente',
      language: 'Lingua',
      autoSave: 'Salvataggio automatico',
      debugMode: 'Modalità debug',
      verboseLogging: 'Logging verboso',
      defaultOpenMode: 'Modalità di apertura predefinita'
    },
    
    // Modalità di apertura
    openModes: {
      modal: 'Modale (in-app)',
      newWindow: 'Nuova finestra/tab'
    },
    
    // Lingue
    languages: {
      it: 'Italiano',
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch'
    },
    
    // Temi
    themes: {
      light: 'Chiaro',
      dark: 'Scuro',
      system: 'Sistema'
    },
    
    // Modalità visualizzazione
    viewModes: {
      grid: 'Griglia',
      list: 'Lista',
      compact: 'Compatta'
    },
    
    // Azioni
    actions: {
      save: 'Salva',
      cancel: 'Annulla',
      reset: 'Reset',
      export: 'Esporta',
      import: 'Importa',
      delete: 'Elimina',
      edit: 'Modifica',
      add: 'Aggiungi',
      search: 'Cerca',
      filter: 'Filtra',
      sort: 'Ordina',
      close: 'Chiudi',
      open: 'Apri',
      launch: 'Avvia',
      install: 'Installa',
      uninstall: 'Disinstalla',
      favorite: 'Preferiti',
      share: 'Condividi',
      settings: 'Impostazioni',
      help: 'Aiuto',
      about: 'Informazioni'
    },
    
    // Messaggi
    messages: {
      loading: 'Caricamento...',
      saving: 'Salvataggio...',
      error: 'Errore',
      success: 'Operazione completata',
      warning: 'Attenzione',
      info: 'Informazione',
      confirm: 'Conferma',
      cancel: 'Annulla',
      yes: 'Sì',
      no: 'No',
      ok: 'OK'
    },
    
    // Errori
    errors: {
      networkError: 'Errore di rete',
      serverError: 'Errore del server',
      fileNotFound: 'File non trovato',
      permissionDenied: 'Permesso negato',
      invalidInput: 'Input non valido',
      unknownError: 'Errore sconosciuto'
    }
  },
  
  en: {
    // Settings
    settings: {
      general: 'General',
      appearance: 'Appearance',
      notifications: 'Notifications',
      backup: 'Backup/Restore',
      cloudsync: 'Cloud Sync',
      github: 'GitHub',
      security: 'Security',
      ai: 'Artificial Intelligence'
    },
    
    // General settings
    general: {
      username: 'Username',
      language: 'Language',
      autoSave: 'Auto save',
      debugMode: 'Debug mode',
      verboseLogging: 'Verbose logging',
      defaultOpenMode: 'Default open mode'
    },
    
    // Open modes
    openModes: {
      modal: 'Modal (in-app)',
      newWindow: 'New window/tab'
    },
    
    // Languages
    languages: {
      it: 'Italiano',
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch'
    },
    
    // Themes
    themes: {
      light: 'Light',
      dark: 'Dark',
      system: 'System'
    },
    
    // View modes
    viewModes: {
      grid: 'Grid',
      list: 'List',
      compact: 'Compact'
    },
    
    // Actions
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      reset: 'Reset',
      export: 'Export',
      import: 'Import',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      close: 'Close',
      open: 'Open',
      launch: 'Launch',
      install: 'Install',
      uninstall: 'Uninstall',
      favorite: 'Favorite',
      share: 'Share',
      settings: 'Settings',
      help: 'Help',
      about: 'About'
    },
    
    // Messages
    messages: {
      loading: 'Loading...',
      saving: 'Saving...',
      error: 'Error',
      success: 'Operation completed',
      warning: 'Warning',
      info: 'Information',
      confirm: 'Confirm',
      cancel: 'Cancel',
      yes: 'Yes',
      no: 'No',
      ok: 'OK'
    },
    
    // Errors
    errors: {
      networkError: 'Network error',
      serverError: 'Server error',
      fileNotFound: 'File not found',
      permissionDenied: 'Permission denied',
      invalidInput: 'Invalid input',
      unknownError: 'Unknown error'
    }
  }
};

// Lingua corrente
let currentLanguage = 'it';

/**
 * Imposta la lingua corrente
 * @param {string} language - Codice lingua (it, en, es, fr, de)
 */
export const setLanguage = (language) => {
  if (TRANSLATIONS[language]) {
    currentLanguage = language;
    console.log(`🌍 Lingua impostata: ${language}`);
  } else {
    console.warn(`⚠️ Lingua non supportata: ${language}, uso italiano`);
    currentLanguage = 'it';
  }
};

/**
 * Ottiene la lingua corrente
 * @returns {string} Codice lingua corrente
 */
export const getCurrentLanguage = () => {
  return currentLanguage;
};

/**
 * Traduce una chiave
 * @param {string} key - Chiave di traduzione (es: 'settings.general')
 * @param {string} fallback - Testo di fallback se la traduzione non esiste
 * @returns {string} Testo tradotto
 */
export const t = (key, fallback = key) => {
  const keys = key.split('.');
  let translation = TRANSLATIONS[currentLanguage];
  
  for (const k of keys) {
    if (translation && translation[k]) {
      translation = translation[k];
    } else {
      // Fallback alla lingua italiana
      let fallbackTranslation = TRANSLATIONS['it'];
      for (const fk of keys) {
        if (fallbackTranslation && fallbackTranslation[fk]) {
          fallbackTranslation = fallbackTranslation[fk];
        } else {
          return fallback;
        }
      }
      return fallbackTranslation;
    }
  }
  
  return translation || fallback;
};

/**
 * Inizializza il sistema di internazionalizzazione
 * @param {string} language - Lingua iniziale
 */
export const initI18n = (language = 'it') => {
  setLanguage(language);
  console.log('🌍 Sistema di internazionalizzazione inizializzato');
};

/**
 * Ottiene tutte le lingue disponibili
 * @returns {Object} Oggetto con le lingue disponibili
 */
export const getAvailableLanguages = () => {
  return TRANSLATIONS['it'].languages;
};

export default {
  setLanguage,
  getCurrentLanguage,
  t,
  initI18n,
  getAvailableLanguages
}; 