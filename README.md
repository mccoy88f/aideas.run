# AIdeas - Run your AI-Ideas!

Un launcher di applicazioni web moderno e intelligente, progettato per trasformare le tue idee in applicazioni funzionanti.

**Run your AI-Ideas!** - Trasforma le tue idee in applicazioni web con il nostro launcher intelligente.

## 🚀 Caratteristiche Principali

### ✨ **Funzionalità Implementate**

- **🎨 Interfaccia Moderna**: Design Material UI con supporto per temi chiari e scuri
- **📱 PWA Ready**: Installabile come applicazione desktop/mobile
- **🛍️ AIdeas Store**: Repository di app condivise e sistema di submission
- **🔍 Ricerca Intelligente**: Ricerca rapida con filtri e ordinamento
- **📊 Gestione App Avanzata**: Organizzazione per categorie, tag e preferiti
- **⚙️ Impostazioni Complete**: Sistema di configurazione avanzato
- **🌍 Internazionalizzazione**: Supporto multi-lingua (IT/EN)
- **🔐 Sicurezza**: Analisi di sicurezza delle app prima dell'installazione
- **☁️ Sincronizzazione**: Backup e ripristino con GitHub Gists

### 🏗️ **Architettura Multi-Repository**

Il progetto utilizza un'architettura a due repository:

- **`aideas.run`** (questo repository): Frontend, servizi e logica di business
- **`aideas.store`**: Repository delle app approvate e workflow automatici

```
┌─────────────────┐    ┌─────────────────┐
│   aideas.run    │    │  aideas.store   │
│   (Frontend)    │◄──►│   (Storage)     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
   ┌─────────────┐        ┌─────────────┐
   │ Submission  │        │   Workflow  │
   │   Service   │        │  Automatic  │
   └─────────────┘        └─────────────┘
```

## 📱 Modal delle Impostazioni - Mobile Optimized

Il modal delle impostazioni è completamente ottimizzato per dispositivi mobili:

### ✅ **Funzionalità Implementate**

- **Header e Footer Fissi**: Barra del titolo e pulsanti sempre visibili
- **Layout Responsive**: Ottimizzato per desktop, tablet e mobile
- **Navigazione Intuitiva**: Scroll orizzontale su mobile
- **Spaziatura Ottimizzata**: Layout compatto per schermi piccoli
- **Gestione Funzionalità**: Indicatori per funzioni in sviluppo

### 🎨 **Impostazioni Disponibili**

#### **Generali** ✅
- **Nome utente**: Personalizzazione del profilo
- **Lingua**: Supporto IT/EN con sistema i18n
- **Salvataggio automatico**: Backup automatico delle app
- **Modalità debug**: Logging avanzato per sviluppatori
- **Modalità di apertura**: Modale o nuova finestra

#### **Aspetto** 🚧 (Parzialmente implementato)
- **Tema**: Chiaro/Scuro/Sistema
- **Modalità visualizzazione**: Griglia/Lista/Compatta
- ~~Dimensione card~~ (rimossa - non implementata)
- ~~Animazioni~~ (rimossa - non implementata)
- ~~Effetto glossy~~ (rimossa - non implementata)
- ~~Barra inferiore~~ (rimossa - non implementata)

#### **Notifiche** 🚧 (In sviluppo)
- Funzionalità in fase di sviluppo

#### **Sicurezza** 🚧 (In sviluppo)
- Funzionalità in fase di sviluppo

## 🛍️ AIdeas Store

### **Sistema di Submission**

1. **Submit App**: Carica app tramite interfaccia web
2. **Review Process**: Issue automatica nel repository `aideas.store`
3. **Approval Workflow**: Label `approved` → aggiunta automatica
4. **Distribution**: App disponibili per tutti gli utenti

### **Workflow Automatico**

```yaml
# .github/workflows/process-approved-apps.yml
on:
  issues:
    types: [labeled, closed]

jobs:
  process-approved-app:
    if: contains(github.event.label.name, 'approved')
    # Scarica ZIP → Estrae file → Aggiunge al repository
```

### **Funzionalità Store**

- **Browse Apps**: Sfoglia app disponibili
- **Install Apps**: Installazione con un click
- **App Categories**: Organizzazione per categorie
- **Search & Filter**: Ricerca avanzata
- **App Info**: Dettagli completi e analisi sicurezza

## 🔧 Installazione e Sviluppo

### **Prerequisiti**

- Node.js 18+
- npm o yarn
- Git

### **Installazione**

```bash
# Clona il repository
git clone https://github.com/mccoy88f/aideas.run.git
cd aideas.run

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

### **Script Disponibili**

```bash
npm run dev          # Avvia server di sviluppo
npm run build        # Build per produzione
npm run preview      # Anteprima build di produzione
```

## 📁 Struttura del Progetto

```
aideas.run/
├── src/
│   ├── components/           # Componenti React
│   │   ├── SettingsMaterial.jsx    # Modal impostazioni
│   │   ├── AppCardMaterial.jsx     # Card applicazioni
│   │   ├── StorePage.jsx           # Pagina store
│   │   └── ...
│   ├── services/            # Servizi
│   │   ├── StorageService.js       # Gestione storage
│   │   ├── StoreService.js         # Gestione store
│   │   ├── AppSubmissionService.js # Submission app
│   │   ├── SecurityService.js      # Analisi sicurezza
│   │   └── ...
│   ├── utils/
│   │   ├── i18n.js                # Internazionalizzazione
│   │   └── ...
│   └── main-material.jsx           # Entry point
├── .github/workflows/       # GitHub Actions
├── docs/                    # Documentazione
└── scripts/                 # Script di utilità
```

## 🎯 Funzionalità Principali

### **Gestione Applicazioni**
- ✅ Aggiunta/rimozione app tramite URL, ZIP o GitHub
- ✅ Organizzazione per categorie e tag
- ✅ Sistema di preferiti
- ✅ Cronologia utilizzo
- ✅ Analisi di sicurezza automatica

### **AIdeas Store**
- ✅ Browse app disponibili
- ✅ Installazione con un click
- ✅ Sistema di submission
- ✅ Workflow di approvazione automatico
- ✅ Categorizzazione e ricerca

### **Personalizzazione**
- ✅ Temi chiari/scuri/automatici
- ✅ Layout a griglia o lista
- ✅ Impostazioni avanzate
- ✅ Internazionalizzazione (IT/EN)

### **Storage e Sincronizzazione**
- ✅ Salvataggio locale con IndexedDB
- ✅ Backup e ripristino con GitHub Gists
- ✅ Statistiche utilizzo
- ✅ Gestione cache

## 🔐 Sicurezza

### **Analisi Automatica**
- **URL Validation**: Controllo sicurezza URL
- **Content Analysis**: Analisi contenuti HTML/JS
- **Permission Check**: Verifica permessi richiesti
- **Security Report**: Report dettagliato per l'utente

### **Funzionalità Sicurezza**
- ✅ Validazione URL prima dell'installazione
- ✅ Analisi contenuti per malware
- ✅ Controllo permessi e accessi
- ✅ Report di sicurezza dettagliato

## 🌍 Internazionalizzazione

### **Lingue Supportate**
- **Italiano** (default)
- **English**

### **Sistema i18n**
```javascript
import { t, setLanguage } from './utils/i18n.js';

// Cambia lingua
setLanguage('en');

// Traduci testo
const message = t('settings.general.username');
```

## 📱 Supporto Mobile

### **Caratteristiche Mobile**
- ✅ Layout responsive ottimizzato
- ✅ Navigazione touch-friendly
- ✅ Modal a schermo intero su mobile
- ✅ Header e footer fissi per navigazione
- ✅ Spaziatura ottimizzata per schermi piccoli

### **Browser Supportati**
- Chrome/Edge (raccomandato)
- Firefox
- Safari
- Mobile browsers

## 🚀 Deployment

### **Build per Produzione**

```bash
npm run build
```

I file ottimizzati saranno generati nella cartella `dist/`.

### **Hosting**

Il progetto può essere deployato su:
- Netlify
- Vercel
- GitHub Pages
- Qualsiasi hosting statico

## 🤝 Contribuire

### **Sistema di Submission**

1. **Fork** del repository `aideas.store`
2. **Crea submission** tramite interfaccia web
3. **Review process** tramite GitHub Issues
4. **Approval** con label `approved`
5. **Automatic deployment** tramite workflow

### **Sviluppo Locale**

1. Fork del repository `aideas.run`
2. Crea un branch per la feature (`git checkout -b feature/nuova-feature`)
3. Commit delle modifiche (`git commit -am 'Aggiungi nuova feature'`)
4. Push del branch (`git push origin feature/nuova-feature`)
5. Crea una Pull Request

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 🐛 Problemi Noti

### **Funzionalità in Sviluppo**

- **Notifiche**: Sistema di notifiche avanzato
- **Sicurezza Avanzata**: Controlli di sicurezza aggiuntivi
- **Aspetto Avanzato**: Opzioni di personalizzazione aggiuntive

### **Funzionalità Rimosse**

- **Sincronizzazione Cloud**: Sostituita con GitHub Gists
- **Alcune opzioni aspetto**: Non implementate, rimosse dall'UI

## 📞 Supporto

Per problemi o domande:
1. Controlla la documentazione in `docs/`
2. Verifica i file di test
3. Apri una issue su GitHub

---

**AIdeas** - Run your AI-Ideas! 🚀

*Trasforma le tue idee in applicazioni web con il nostro launcher intelligente.*