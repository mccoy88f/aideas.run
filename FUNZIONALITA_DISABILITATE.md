# Funzionalità Disabilitate in SAKAI

Questo documento elenca le funzionalità che sono presenti nel codice ma attualmente disabilitate o non implementate.

## Funzionalità Disabilitate

### 1. Sincronizzazione Cloud (SyncManager)
- **Stato**: Disabilitato temporaneamente
- **Posizione**: `src/main.js` linea 40
- **Motivo**: In fase di sviluppo/testing
- **Impatto**: Le impostazioni di sincronizzazione sono visibili ma non funzionanti

### 2. PWA Plugin
- **Stato**: Disabilitato per debug
- **Posizione**: `vite.config.js` linea 106
- **Motivo**: Disabilitato temporaneamente per debug
- **Impatto**: Service Worker e funzionalità offline non disponibili

### 3. Aggiornamento Automatico App
- **Stato**: Non implementato
- **Motivo**: Funzionalità pianificata ma non ancora sviluppata
- **Impatto**: L'opzione è visibile ma disabilitata nelle impostazioni

### 4. Analytics e Telemetria
- **Stato**: Non implementato
- **Motivo**: Funzionalità pianificata ma non ancora sviluppata
- **Impatto**: Le opzioni sono visibili ma disabilitate nelle impostazioni

### 5. Report Errori Automatici
- **Stato**: Non implementato
- **Motivo**: Funzionalità pianificata ma non ancora sviluppata
- **Impatto**: L'opzione è visibile ma disabilitata nelle impostazioni

### 6. Precaricamento App
- **Stato**: Non implementato
- **Motivo**: Funzionalità pianificata ma non ancora sviluppata
- **Impatto**: L'opzione è visibile ma disabilitata nelle impostazioni

### 7. Funzionalità Sperimentali
- **Stato**: Non implementato
- **Motivo**: Funzionalità pianificata ma non ancora sviluppata
- **Impatto**: L'opzione è visibile ma disabilitata nelle impostazioni

## Indicatori Visivi

Nel modale delle impostazioni, le funzionalità disabilitate sono:
- Visualizzate con opacità ridotta
- Contrassegnate con l'etichetta "Funzionalità non disponibile"
- I controlli sono disabilitati e non modificabili

## Come Riabilitare

### SyncManager
```javascript
// In src/main.js, decommentare la linea 40:
this.syncManager = new SyncManager();
```

### PWA Plugin
```javascript
// In vite.config.js, decommentare la sezione PWA:
// PWA Plugin - DISABILITATO TEMPORANEAMENTE PER DEBUG
```

### Altre Funzionalità
Le altre funzionalità richiedono implementazione completa nel codice prima di poter essere abilitate.

## Note per gli Sviluppatori

- Tutte le funzionalità disabilitate sono gestite centralmente nel `SettingPanel.js`
- Il metodo `markDisabledFeatures()` gestisce la visualizzazione delle funzionalità non disponibili
- Le funzionalità disabilitate sono definite nell'oggetto `disabledFeatures` del costruttore 