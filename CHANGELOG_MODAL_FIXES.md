# Changelog - Fix Avvio App nel Modale

## Versione 1.1.0 - Fix Modal Launch

### 🔧 Correzioni Principali

#### 1. Impostazione di Default Sicura
- **PRIMA**: `defaultLaunchMode` era impostato su `'iframe'`
- **DOPO**: `defaultLaunchMode` è ora impostato su `'newpage'`
- **Motivo**: Evita problemi di sicurezza con siti che bloccano iframe

#### 2. Controllo Compatibilità Iframe Migliorato
- **NUOVO**: Funzione `checkIframeCompatibility()` completamente riscritta
- **Miglioramenti**:
  - Controllo header HTTP più robusto
  - Gestione timeout (5 secondi)
  - Supporto per blob URLs e data URLs
  - Logging dettagliato per debug
  - Gestione errori migliorata

#### 3. Fallback Automatico
- **NUOVO**: Fallback automatico a nuova finestra quando iframe non funziona
- **Comportamento**:
  - Rileva automaticamente siti che bloccano iframe
  - Apre automaticamente in nuova finestra
  - Mostra toast informativo all'utente
  - Logging dettagliato per debug

#### 4. Verifica Impostazioni Critiche
- **NUOVO**: Funzione `verifyCriticalSettings()` in main.js
- **Funzionalità**:
  - Verifica automatica all'avvio
  - Correzione automatica di valori non validi
  - Validazione per `defaultLaunchMode`, `maxConcurrentApps`, etc.
  - Logging per debug

#### 5. Logging Durante Installazione
- **NUOVO**: Logging dettagliato durante l'installazione delle app
- **Informazioni tracciate**:
  - Modalità di lancio app-specifica
  - Modalità di lancio globale
  - Modalità finale determinata
  - Conferma salvataggio nei metadata

#### 6. Indicazione Visiva Modalità Default
- **NUOVO**: Indicazione della modalità di default corrente nel form di importazione
- **Funzionalità**:
  - Mostra "(Impostazione globale corrente: Nuova pagina/Finestra modale)"
  - Aggiornamento automatico quando cambiano le impostazioni
  - Aiuta l'utente a capire il comportamento predefinito

### 🚀 Miglioramenti UX

#### 1. Feedback Immediato
- **NUOVO**: Toast informativi per fallback automatico
- **Messaggi**:
  - "Questo sito non supporta iframe, apertura in nuova finestra"
  - "Errore caricamento iframe, apertura in nuova finestra"
  - "App aperta in nuova finestra"

#### 2. Gestione Errori Migliorata
- **MIGLIORATO**: Messaggi di errore più chiari
- **NUOVO**: Gestione specifica per popup bloccati
- **NUOVO**: Retry automatico con modalità alternativa

#### 3. Debug e Monitoraggio
- **NUOVO**: Console logging dettagliato
- **Informazioni**:
  - Modalità di lancio scelta per ogni app
  - Fallback automatico quando necessario
  - Errori di compatibilità iframe
  - Verifica impostazioni all'avvio

### 🔧 Manutenzione

#### 1. Correzione Automatica
- **NUOVO**: Correzione automatica di impostazioni non valide
- **Validazioni**:
  - `defaultLaunchMode`: deve essere 'iframe' o 'newpage'
  - `maxConcurrentApps`: deve essere tra 1 e 10
  - `language`: deve essere 'it' o 'en'
  - `theme`: deve essere 'light', 'dark' o 'auto'

#### 2. Test delle Impostazioni
- **NUOVO**: Funzione `testSettings()` per debug
- **Test**:
  - Salvataggio e caricamento impostazioni
  - Verifica integrità dati
  - Log delle impostazioni attuali

### 📁 File Modificati

#### 1. `src/utils/constants.js`
```javascript
// Cambiato default da 'iframe' a 'newpage'
defaultLaunchMode: LAUNCH_MODES.NEW_PAGE,
```

#### 2. `src/components/AppLauncher.js`
```javascript
// Migliorata funzione checkIframeCompatibility
async checkIframeCompatibility(url) {
  // Controllo header HTTP con timeout
  // Gestione errori migliorata
  // Supporto per blob/data URLs
}

// Aggiunto fallback automatico
if (!canUseIframe) {
  console.log('🔄 Fallback automatico a nuova finestra');
  return this.openInNewWindow(targetUrl, app.id);
}
```

#### 3. `src/components/SettingPanel.js`
```javascript
// Aggiunta validazione automatica
async validateAndFixSettings() {
  // Verifica e correggi impostazioni critiche
  // Logging per debug
}
```

#### 4. `src/components/AppImporter.js`
```javascript
// Aggiunto logging durante installazione
console.log(`🚀 Installazione app: ${appData.name}`);
console.log(`📋 Modalità app-specifica: ${appData.metadata?.launchMode}`);
console.log(`🌐 Modalità globale: ${globalLaunchMode}`);
console.log(`✅ Modalità finale: ${finalLaunchMode}`);

// Aggiunta indicazione visiva
<span id="current-default-mode">(Impostazione globale corrente: Nuova pagina)</span>
```

#### 5. `src/main.js`
```javascript
// Aggiunta verifica critica all'avvio
async verifyCriticalSettings() {
  // Verifica defaultLaunchMode
  // Correzione automatica se necessario
  // Logging per debug
}
```

### 🧪 Test Implementati

#### 1. Test Impostazioni
- ✅ Verifica che `defaultLaunchMode` sia `'newpage'` all'avvio
- ✅ Verifica salvataggio/caricamento impostazioni
- ✅ Test correzione automatica valori non validi

#### 2. Test Fallback
- ✅ Test con siti che bloccano iframe (Google, Facebook)
- ✅ Verifica apertura automatica in nuova finestra
- ✅ Test toast informativi

#### 3. Test Installazione
- ✅ Verifica che modalità di default venga rispettata
- ✅ Test logging durante installazione
- ✅ Verifica salvataggio modalità app-specifica

### 🔍 Debug e Monitoraggio

#### Modalità Debug
Per abilitare debug completo:
```javascript
localStorage.setItem('aideas_debug', 'true');
```

#### Log Console
I log mostrano:
- 🚀 Lancio app con modalità scelta
- 🔍 Controllo compatibilità iframe
- 🔄 Fallback automatico
- ⚙️ Verifica impostazioni
- 📝 Installazione app con modalità

### 📊 Risultati

#### ✅ Problemi Risolti
1. **Sicurezza**: Iframe non funzionanti rilevati automaticamente
2. **Default Sicuro**: Modalità di default è ora `'newpage'`
3. **Fallback Automatico**: Transizione fluida iframe → nuova finestra
4. **Trasparenza**: Logging completo per debug
5. **Verifica**: Controllo modalità durante installazione

#### 🚀 Miglioramenti
- **UX**: Feedback immediato per fallback
- **Debug**: Console logging dettagliato
- **Manutenzione**: Correzione automatica impostazioni
- **Trasparenza**: Indicazione modalità corrente

#### 🔧 Stabilità
- **Robustezza**: Gestione errori migliorata
- **Validazione**: Controlli integrità dati
- **Fallback**: Alternative automatiche quando necessario
- **Monitoraggio**: Tracciamento completo per troubleshooting

### 🛡️ Sicurezza

- **Iframe Sandbox**: Mantenuti permessi sicuri
- **CSP**: Rispettate le policy dei siti
- **Fallback**: Preferita apertura in nuova finestra in caso di dubbi
- **Validazione**: Tutti gli input validati

### 📊 Compatibilità

- ✅ Chrome/Chromium
- ✅ Firefox  
- ✅ Safari
- ✅ Edge
- ⚠️ Browser mobili (limitazioni popup)

### 🚀 Prossimi Miglioramenti

1. **Rilevamento Automatico**: Migliorare rilevamento modalità ottimale
2. **Preferenze per Sito**: Salvare preferenze specifiche per sito
3. **Performance**: Ottimizzare controlli compatibilità
4. **UI**: Migliorare messaggi informativi

### 🔄 Rollback

Se necessario, per tornare al comportamento precedente:
```javascript
// Imposta defaultLaunchMode su 'iframe'
await StorageService.setSetting('defaultLaunchMode', 'iframe');
```

### 📝 Note per Sviluppatori

- Le modifiche sono retrocompatibili
- Le impostazioni esistenti vengono migrate automaticamente
- Il debug è disponibile tramite localStorage
- Tutti i cambiamenti sono documentati e testabili 