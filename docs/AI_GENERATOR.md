# Generatore App con AI

## Panoramica

Il **Generatore App con AI** è una nuova funzionalità integrata in AIdeas che permette di creare applicazioni web utilizzando l'intelligenza artificiale tramite Puter.js e OpenRouter.

## Come Funziona

### 1. Accesso alla Funzionalità

La funzionalità è accessibile in due modi:

- **Pulsante nella barra di ricerca**: Icona 🤖 (SmartToy) accanto al pulsante dello store
- **Menu laterale**: Voce "Genera App con AI" nel drawer di navigazione
- **Scorciatoia da tastiera**: `Ctrl/Cmd + G`

### 2. Autenticazione

Per utilizzare il generatore AI è necessario:

1. Fare login con Puter.js (gratuito)
2. Cliccare su "Accedi con Puter" nel modale
3. Completare l'autenticazione tramite popup o redirect

### 3. Generazione di un'App

#### Campi Richiesti:
- **Nome App**: Nome dell'applicazione da creare
- **Descrizione Dettagliata**: Descrizione completa delle funzionalità desiderate
- **Tipo di App**: Categoria dell'app (Utility, Gioco, Produttività, etc.)
- **Modello AI**: Seleziona il modello AI da utilizzare

#### Modelli AI Disponibili:

**🔥 Consigliati:**
- GPT-4o (OpenAI) - Modello più avanzato
- Claude 3.5 Sonnet (Anthropic) - Ottimo per ragionamento
- DeepSeek R1 (Gratuito) - Buon compromesso qualità/prezzo
- o1-mini (Reasoning) - Specializzato in ragionamento

**⚡ Gratuiti (OpenRouter):**
- Phi-3 Mini/Medium (Microsoft)
- Mistral 7B
- Gemma 7B (Google)
- Llama 3 8B (Meta)
- Qwen 2 7B

### 4. Funzionalità Avanzate

#### Preview in Tempo Reale
- Visualizzazione immediata dell'app generata
- Test delle funzionalità direttamente nel modale

#### Chat per Modifiche
- Sistema di chat integrato per modificare l'app
- Richieste di modifica in linguaggio naturale
- Aggiornamento in tempo reale del codice

#### Gestione App Generate
- Salvataggio delle app generate nel cloud di Puter
- Lista delle app create con possibilità di:
  - Aprire in nuova finestra
  - Eliminare
  - Modificare via chat

#### Importazione in AIdeas
- Importazione diretta dell'app generata in AIdeas
- Categorizzazione automatica come "AI Generated"
- Metadati completi (modello AI, data generazione, tipo)

## Caratteristiche Tecniche

### Tecnologie Utilizzate
- **Puter.js**: Per autenticazione e storage cloud
- **OpenRouter**: Per accesso a modelli AI multipli
- **Material UI**: Interfaccia utente coerente con il resto dell'app

### Formato App Generate
Le app generate sono file HTML singoli autocontenuti con:
- HTML5 semantico
- CSS moderno e responsive
- JavaScript vanilla (no dipendenze esterne)
- Design Material Design compatibile

### Sicurezza
- Sandbox per preview delle app
- Validazione del codice generato
- Isolamento delle app generate

## Esempi di Utilizzo

### App di Produttività
```
Nome: Calcolatrice Avanzata
Descrizione: Una calcolatrice con funzioni scientifiche, conversione unità e cronologia calcoli
Tipo: Utility
Modello: GPT-4o
```

### App Creativa
```
Nome: Generatore di Colori
Descrizione: App per generare palette di colori, con preview, export e salvataggio preferiti
Tipo: Creativo
Modello: Claude 3.5 Sonnet
```

### App di Gioco
```
Nome: Memory Game
Descrizione: Gioco della memoria con carte, timer, punteggio e livelli di difficoltà
Tipo: Gioco
Modello: DeepSeek R1
```

## Limitazioni

- Richiede connessione internet per l'autenticazione e generazione
- Le app generate sono limitate a tecnologie client-side
- Non supporta database o backend complessi
- Dipende dalla qualità del modello AI selezionato

## Problemi Risolti ✅

### 1. Content Security Policy (CSP)
- **Problema**: `Refused to load the script 'https://js.puter.com/v2/'`
- **Soluzione**: Aggiunti domini Puter alla CSP in `index.html`
- **Domini configurati**: `js.puter.com`, `puter.com`, `api.puter.com`, `openrouter.ai`

### 2. MUI Grid v2 Migration
- **Problema**: Warning `MUI Grid: The 'item' prop has been removed`
- **Soluzione**: Migrato da `Grid` a `Stack` per compatibilità MUI v2
- **Benefici**: Nessun warning, layout responsive migliorato

### 3. Stile Inconsistente
- **Problema**: Modale non coerente con il design di AIdeas
- **Soluzione**: Header e footer aggiornati con gradiente e backdrop blur
- **Miglioramenti**: Colori e tipografia allineati al design system

### 4. Controllo Autenticazione Automatico
- **Problema**: Puter.js si inizializzava automaticamente all'apertura
- **Soluzione**: Inizializzazione solo al click su "Accedi con Puter"
- **Benefici**: Migliore UX e gestione errori

## Risoluzione Problemi

### Problemi di Autenticazione
1. Verificare che i popup non siano bloccati
2. Provare il metodo redirect se il popup fallisce
3. Controllare la connessione internet

### Errori di Generazione
1. Provare un modello AI diverso
2. Rendere la descrizione più dettagliata
3. Verificare che l'account Puter sia attivo

### App Non Funzionanti
1. Controllare la console del browser per errori
2. Verificare che l'app sia stata generata completamente
3. Provare a rigenerare con descrizione più specifica

## Sviluppi Futuri

- Supporto per template predefiniti
- Integrazione con più modelli AI
- Sistema di rating delle app generate
- Condivisione di app generate con la community
- Export in formati multipli (PWA, ZIP, etc.) 