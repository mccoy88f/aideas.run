# Sistema di Analisi CSP Automatica - AIdeas

## Panoramica

Il sistema di analisi CSP automatica di AIdeas risolve il problema di dover conoscere in anticipo quali CDN e risorse esterne un'app HTML potrebbe utilizzare. Invece di utilizzare una CSP completamente permissiva, il sistema:

1. **Analizza automaticamente** il contenuto HTML per trovare CDN e risorse esterne
2. **Genera una CSP personalizzata** che include solo i domini necessari
3. **Memorizza le informazioni** nel database per riutilizzo futuro
4. **Aggiorna automaticamente** la CSP quando l'HTML cambia

## Come Funziona

### 1. Analisi HTML

Il metodo `analyzeHTMLForExternalResources()` analizza il contenuto HTML per trovare:

- **Scripts**: `<script src="...">` tags
- **CSS**: `<link rel="stylesheet">` tags  
- **Fonts**: `<link rel="preload" as="font">` tags
- **Images**: `<img src="...">` tags
- **Frames**: `<iframe src="...">` tags
- **Connections**: `fetch()` e `XMLHttpRequest()` calls

### 2. Estrazione Domini

Per ogni URL trovato, il sistema:
- Converte URL relativi in assoluti
- Estrae il dominio hostname
- Categorizza il dominio per tipo di risorsa

### 3. Generazione CSP

Il metodo `generateCustomCSP()` crea una CSP che include:
- Domini trovati nell'analisi
- Direttive di sicurezza appropriate per ogni tipo di risorsa
- Fallback sicuri per risorse locali

### 4. Caching Intelligente

Le informazioni vengono memorizzate nel database con:
- CSP generata
- Domini trovati
- Timestamp dell'ultima analisi
- Scadenza automatica (24 ore)

## Vantaggi

### 🔒 Sicurezza Migliorata
- CSP personalizzata invece di completamente permissiva
- Solo i domini necessari sono autorizzati
- Riduce la superficie di attacco

### ⚡ Performance Ottimizzate
- Analisi eseguita una sola volta per app
- Cache per 24 ore
- Ri-analisi automatica solo quando necessario

### 🛠️ Facilità d'Uso
- Nessuna configurazione manuale richiesta
- Funziona automaticamente con qualsiasi app HTML
- Compatibilità massima con CDN popolari

### 🔄 Manutenzione Automatica
- Aggiornamento automatico quando l'HTML cambia
- Gestione intelligente delle scadenze
- Logging dettagliato per debugging

## Implementazione Tecnica

### File Modificati

1. **`src/components/AppLauncher.js`**
   - `analyzeHTMLForExternalResources()` - Analisi HTML
   - `generateCustomCSP()` - Generazione CSP
   - `injectCSPForHTMLApp()` - Iniezione CSP con caching

2. **`src/services/StorageService.js`**
   - `setAppMetadata()` - Memorizzazione metadati
   - `getAppMetadata()` - Recupero metadati

### Flusso di Esecuzione

```
1. Lancio App HTML
   ↓
2. Controllo Cache CSP
   ↓
3. Se Cache Valida → Usa CSP Cached
   ↓
4. Se Cache Scaduta → Analizza HTML
   ↓
5. Genera CSP Personalizzata
   ↓
6. Memorizza in Cache
   ↓
7. Inietta CSP nell'HTML
   ↓
8. Crea Blob URL
   ↓
9. Lancia App
```

## Esempi di Utilizzo

### App HTML Semplice
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
</head>
<body>
    <h1>App Test</h1>
</body>
</html>
```

**CSP Generata:**
```
default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; 
script-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval' unpkg.com; 
style-src 'self' data: blob: 'unsafe-inline' fonts.googleapis.com; 
font-src 'self' data: blob: fonts.gstatic.com; 
...
```

### App HTML Complessa
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
</head>
<body>
    <img src="https://via.placeholder.com/300x200" alt="Test">
    <script>
        fetch('https://api.example.com/data');
    </script>
</body>
</html>
```

**CSP Generata:**
```
default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; 
script-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval' cdnjs.cloudflare.com unpkg.com; 
style-src 'self' data: blob: 'unsafe-inline' cdn.jsdelivr.net fonts.googleapis.com; 
font-src 'self' data: blob: fonts.gstatic.com; 
img-src 'self' data: blob: via.placeholder.com; 
connect-src 'self' data: blob: api.example.com; 
...
```

## Test e Debugging

### File di Test Creati

1. **`test-csp-analysis.html`** - Test interattivo dell'analisi CSP
2. **`test-app-with-cdn.html`** - App HTML con vari CDN per test reali

### Logging

Il sistema fornisce log dettagliati:
```
🔍 Analisi HTML per app 123...
📊 Domini trovati: {scripts: ["unpkg.com"], styles: ["fonts.googleapis.com"]}
💾 CSP cached per app 123
♻️ Usando CSP cached per app 123 (analizzata 2.3 ore fa)
```

### Debugging

Per debug, controllare:
- Console browser per errori CSP
- Log del sistema per dettagli analisi
- Database per metadati memorizzati

## Configurazione

### Scadenza Cache
La cache CSP scade dopo 24 ore. Modificabile in:
```javascript
const hoursSinceAnalysis = (Date.now() - lastAnalyzed) / (1000 * 60 * 60);
if (hoursSinceAnalysis < 24) { // ← Modifica qui
```

### Fallback CSP
Se l'analisi fallisce, viene usata una CSP completamente permissiva:
```javascript
const fallbackCSP = "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; ...";
```

## Compatibilità

### CDN Supportati
- **unpkg.com** - React, Vue, altre librerie
- **cdnjs.cloudflare.com** - jQuery, Font Awesome, Bootstrap
- **cdn.jsdelivr.net** - Bootstrap, altre librerie
- **fonts.googleapis.com** - Google Fonts
- **fonts.gstatic.com** - Google Fonts (font files)
- **via.placeholder.com** - Immagini placeholder
- **jsonplaceholder.typicode.com** - API di test

### Browser Supportati
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Sicurezza

### Considerazioni
- La CSP generata è più restrittiva di quella completamente permissiva
- Solo i domini effettivamente utilizzati sono autorizzati
- Fallback sicuro in caso di errori di analisi

### Limitazioni
- L'analisi è basata su regex e potrebbe non catturare tutti i casi
- Script dinamici aggiunti via JavaScript non vengono analizzati
- URL generati dinamicamente potrebbero non essere rilevati

## Manutenzione

### Pulizia Cache
La cache viene pulita automaticamente dopo 24 ore. Per pulizia manuale:
```javascript
await StorageService.setAppMetadata(appId, { 
  customCSP: null,
  externalDomains: null,
  lastAnalyzed: null
});
```

### Aggiornamento Regex
Le regex di analisi possono essere aggiornate in `analyzeHTMLForExternalResources()` per supportare nuovi pattern.

## Conclusioni

Il sistema di analisi CSP automatica risolve efficacemente il problema di dover conoscere in anticipo i CDN utilizzati dalle app HTML, fornendo:

- **Sicurezza migliorata** con CSP personalizzate
- **Performance ottimizzate** con caching intelligente  
- **Facilità d'uso** con funzionamento automatico
- **Compatibilità massima** con CDN popolari

Il sistema è progettato per essere robusto, scalabile e facilmente manutenibile. 