# AIdeas.run
(fase alpha)

Un launcher di applicazioni moderno e personalizzabile, progettato per offrire un'esperienza utente fluida e intuitiva.

**Run your Ideas** - Trasforma le tue idee in applicazioni web con il nostro launcher intelligente.

## 🚀 Caratteristiche Principali

- **Interfaccia Moderna**: Design pulito e responsive con supporto per temi chiari e scuri
- **Gestione App Avanzata**: Organizzazione per categorie, tag e preferiti
- **Ricerca Intelligente**: Ricerca rapida con filtri e ordinamento
- **Personalizzazione**: Temi, layout e impostazioni completamente personalizzabili
- **Storage Locale**: Salvataggio sicuro dei dati con IndexedDB
- **PWA Ready**: Installabile come applicazione desktop/mobile

## 📱 Modal delle Impostazioni - Mobile Optimized

Il modal delle impostazioni è stato completamente ottimizzato per dispositivi mobili con le seguenti migliorie:

### ✅ Correzioni Implementate

1. **Bullet Points Rimossi**
   - Eliminati i punti colorati dai titoli delle sezioni su tutti i dispositivi
   - Design più pulito e minimalista

2. **Header e Footer Fissi**
   - Barra del titolo e pulsanti sempre visibili durante lo scroll
   - Navigazione più intuitiva su mobile

3. **Spaziatura Ottimizzata**
   - Ridotta la spaziatura generale per mostrare più contenuto
   - Layout più compatto su schermi piccoli
   - Padding e margin ottimizzati per mobile

4. **Layout Responsive Migliorato**
   - Navigazione orizzontale su mobile con scroll
   - Pulsanti di navigazione più piccoli e compatti
   - Icone ridimensionate per schermi touch

5. **Gestione Funzionalità Disabilitate**
   - Indicatori visivi per funzioni non disponibili
   - Controlli disabilitati con feedback chiaro
   - Messaggi informativi per funzionalità in sviluppo

### 📐 Breakpoint Responsive

- **Desktop (>768px)**: Layout a due colonne con navigazione verticale
- **Tablet (≤768px)**: Layout ottimizzato con spaziatura ridotta
- **Mobile (≤480px)**: Layout ultra-compatto con elementi ridimensionati

### 🎨 Stili Mobile

```css
/* Esempio delle ottimizzazioni mobile */
@media (max-width: 768px) {
  .settings-layout {
    height: calc(100vh - 200px);
    gap: var(--space-3);
  }
  
  .settings-nav-btn {
    min-width: 100px;
    font-size: var(--font-size-sm);
    padding: var(--space-2) var(--space-3);
  }
  
  .modal.modal-xl .modal-header,
  .modal.modal-xl .modal-footer {
    position: sticky;
    background: var(--color-bg-modal);
    z-index: 10;
  }
}
```

## 🎯 Popup di Conferma - Design Coerente

Il popup di conferma è stato aggiornato per seguire lo stesso design pattern del modal delle impostazioni:

### ✨ Nuove Caratteristiche

1. **Header e Footer Fissi**
   - Titolo e icona sempre visibili nell'header
   - Pulsanti di azione sempre accessibili nel footer
   - Scroll solo nella sezione contenuto

2. **Design Coerente**
   - Stesso stile del modal delle impostazioni
   - Utilizzo delle stesse variabili CSS
   - Animazioni e transizioni uniformi

3. **Layout Responsive**
   - Ottimizzato per mobile e desktop
   - Pulsanti a larghezza piena su mobile
   - Spaziatura adattiva

4. **Tipi di Popup**
   - **Domanda**: Per conferme generali
   - **Avviso**: Per azioni con conseguenze
   - **Pericolo**: Per eliminazioni definitive
   - **Info**: Per informazioni dettagliate

### 🎨 Stili del Popup

```css
.confirm-popup-content {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.confirm-popup-header {
  position: sticky;
  top: 0;
  background: var(--color-bg-modal);
  z-index: 10;
}

.confirm-popup-body {
  overflow-y: auto;
  flex: 1;
}

.confirm-popup-footer {
  position: sticky;
  bottom: 0;
  background: var(--color-bg-modal);
  z-index: 10;
}
```

### 📱 Responsive Mobile

```css
@media (max-width: 768px) {
  .confirm-popup-content {
    max-width: 95%;
    max-height: 90vh;
  }
  
  .confirm-popup-footer {
    flex-direction: column;
  }
  
  .confirm-popup-btn {
    width: 100%;
  }
}
```

## 📥 Modal di Importazione App - Corretto

Il modal di importazione app è stato corretto per risolvere i problemi di layout e responsività:

### ✅ Correzioni Applicate

1. **Header e Footer Effettivamente Fissi**
   - Utilizzo di `position: sticky` invece di margini negativi
   - `flex-shrink: 0` per evitare ridimensionamenti
   - Header e footer non si muovono durante lo scroll

2. **Pulsanti dei Tipi Corretti**
   - Larghezza 100% su mobile per tutti i pulsanti
   - Layout coerente tra i diversi tipi di importazione
   - Spaziatura uniforme e responsive

3. **Layout Flex Ottimizzato**
   - Scroll solo nella sezione `import-forms`
   - I pulsanti dei tipi rimangono sempre visibili
   - Contenuto principale scrollabile indipendentemente

4. **CSS Pulito**
   - Rimozione delle definizioni duplicate
   - Media queries corrette e specifiche
   - Padding e margin ottimizzati

### 🎨 Stili del Modal di Importazione

```css
.modal.modal-lg .modal-body {
  display: flex;
  flex-direction: column;
  height: calc(80vh - 140px);
  overflow: hidden;
  padding: 0;
}

.modal.modal-lg .modal-header {
  position: sticky;
  top: 0;
  background: var(--color-bg-modal);
  z-index: 10;
  flex-shrink: 0;
}

.modal.modal-lg .modal-footer {
  position: sticky;
  bottom: 0;
  background: var(--color-bg-modal);
  z-index: 10;
  flex-shrink: 0;
}

.import-types {
  flex-shrink: 0;
  margin-bottom: var(--space-4);
}

.import-forms {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-6);
  margin: 0 calc(-1 * var(--space-6));
}
```

### 📱 Responsive Mobile

```css
@media (max-width: 768px) {
  .import-type-btn {
    width: 100%;
    flex-direction: row;
    align-items: center;
  }
  
  .modal.modal-lg .modal-body {
    height: calc(100vh - 200px);
  }
  
  .import-forms {
    padding: 0 var(--space-4);
    margin: 0 calc(-1 * var(--space-4));
  }
}

@media (max-width: 480px) {
  .import-type-btn {
    width: 100%;
    padding: var(--space-2);
  }
  
  .modal.modal-lg .modal-body {
    height: calc(100vh - 180px);
  }
}
```

## 🧪 Test del Modal e Popup

Sono disponibili diversi file di test per verificare il funzionamento:

- **`test-settings.html`**: Test completo del modal con tutte le funzionalità
- **`test-settings-quick.html`**: Test rapido per verifiche veloci
- **`test-settings-mobile.html`**: Test specifico per ottimizzazioni mobile
- **`test-confirm-popup.html`**: Test del nuovo popup di conferma
- **`test-import-modal.html`**: Test del modal di importazione corretto

### Come Testare

1. Apri uno dei file di test nel browser
2. Riduci la finestra o usa gli strumenti di sviluppo per simulare mobile
3. Verifica che header e footer rimangano fissi durante lo scroll
4. Controlla che i bullet points siano rimossi dai titoli
5. Testa la navigazione tra le sezioni
6. Prova tutti i tipi di popup di conferma

### Test Modal di Importazione

```bash
# Apri il file di test
open test-import-modal.html

# Test da eseguire:
# - Verifica header e footer fissi (non si muovono)
# - Controlla che i pulsanti dei tipi abbiano larghezza 100% su mobile
# - Testa lo scroll del contenuto (solo la parte centrale)
# - Verifica la navigazione tra i tipi di importazione
# - Controlla il responsive su diversi dispositivi
# - Testa le animazioni e transizioni
```

### Test Popup di Conferma

```bash
# Apri il file di test
open test-confirm-popup.html

# Test da eseguire:
# - Prova tutti i tipi (domanda, avviso, pericolo, info)
# - Verifica header e footer fissi
# - Testa su mobile per responsive
# - Controlla animazioni e transizioni
# - Verifica gestione tasti (Esc, Enter)
```

## 🛠️ Installazione e Sviluppo

### Prerequisiti

- Node.js 18+ 
- npm o yarn

### Installazione

```bash
# Clona il repository
git clone <repository-url>
cd sakai-reborn

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

### Script Disponibili

```bash
npm run dev          # Avvia server di sviluppo con proxy
npm run build        # Build per produzione
npm run preview      # Anteprima build di produzione
npm run dev:proxy    # Solo server proxy
npm run dev:vite     # Solo server Vite
```

## 📁 Struttura del Progetto

```
sakai-reborn/
├── src/
│   ├── components/
│   │   ├── SettingPanel.js      # Modal impostazioni
│   │   ├── AppCard.js           # Card applicazioni
│   │   ├── AppLauncher.js       # Launcher principale
│   │   └── ...
│   ├── styles/
│   │   ├── main.css             # Stili principali (mobile optimized)
│   │   └── variables.scss       # Variabili CSS
│   ├── services/
│   │   ├── StorageService.js    # Gestione storage
│   │   └── ...
│   └── main.js                  # Entry point
├── public/                      # Asset pubblici
├── meta-proxy/                  # Server proxy per metadati
└── test-*.html                  # File di test
```

## 🎯 Funzionalità Principali

### Gestione Applicazioni
- Aggiunta/rimozione app tramite URL o file
- Organizzazione per categorie e tag
- Sistema di preferiti
- Cronologia utilizzo

### Personalizzazione
- Temi chiari/scuri/automatici
- Layout a griglia o lista
- Colori personalizzabili
- Impostazioni avanzate

### Storage e Sincronizzazione
- Salvataggio locale con IndexedDB
- Backup e ripristino dati
- Statistiche utilizzo
- Gestione cache

## 🔧 Configurazione

### Variabili CSS Personalizzabili

```css
:root {
  --color-primary: #007bff;
  --color-bg-surface: #ffffff;
  --color-text: #333333;
  --radius-lg: 12px;
  --space-4: 1rem;
  /* ... altre variabili */
}
```

### Impostazioni Avanzate

Il modal delle impostazioni permette di configurare:
- Comportamento app (avvio automatico, preferiti)
- Aspetto (tema, colori, stile card)
- Storage (pulizia cache, backup)
- Sistema (aggiornamenti, log)

## 📱 Supporto Mobile

### Caratteristiche Mobile
- Layout responsive ottimizzato
- Navigazione touch-friendly
- Modal a schermo intero su mobile
- Header e footer fissi per navigazione
- Spaziatura ottimizzata per schermi piccoli

### Browser Supportati
- Chrome/Edge (raccomandato)
- Firefox
- Safari
- Mobile browsers

## 🚀 Deployment

### Build per Produzione

```bash
npm run build
```

I file ottimizzati saranno generati nella cartella `dist/`.

### Hosting

Il progetto può essere deployato su:
- Netlify
- Vercel
- GitHub Pages
- Qualsiasi hosting statico

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/nuova-feature`)
3. Commit delle modifiche (`git commit -am 'Aggiungi nuova feature'`)
4. Push del branch (`git push origin feature/nuova-feature`)
5. Crea una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 🐛 Problemi Noti

### Funzionalità Disabilitate

Alcune funzionalità sono attualmente disabilitate o in sviluppo:

- **Sincronizzazione Cloud**: In sviluppo
- **SyncManager**: Commentato nel codice
- **Alcune opzioni avanzate**: Non ancora implementate

Vedi `FUNZIONALITA_DISABILITATE.md` per la lista completa.

### Problemi Risolti

- ✅ Modal impostazioni ottimizzato per mobile
- ✅ Header e footer fissi durante lo scroll
- ✅ Bullet points rimossi dai titoli
- ✅ Spaziatura ottimizzata per schermi piccoli
- ✅ Gestione funzionalità disabilitate
- ✅ Layout responsive migliorato

Vedi `PROBLEMS_FIXED.md` per i dettagli delle correzioni.

## 📞 Supporto

Per problemi o domande:
1. Controlla la documentazione
2. Verifica i file di test
3. Apri una issue su GitHub

---

**SAKAI Reborn** - Un launcher moderno per un'esperienza utente straordinaria! 🚀