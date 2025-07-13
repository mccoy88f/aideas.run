# AIdeas Store

L'AIdeas Store è un sistema per condividere e installare mini-app basate su HTML, CSS e JavaScript nella piattaforma AIdeas.

## Come Funziona

### Per gli Utenti

1. **Accedi allo Store**: Clicca sul pulsante "Store" nella barra di ricerca o usa la scorciatoia `Ctrl/Cmd + S`

2. **Sfoglia le App**: Lo store mostra tutte le app disponibili con:
   - Nome e descrizione
   - Autore e versione
   - Categoria e tag
   - Anteprima dell'icona

3. **Installa App**: Clicca su "Installa" per scaricare e installare l'app localmente

4. **Filtra e Cerca**: Usa la barra di ricerca e i filtri per categoria per trovare app specifiche

### Per gli Sviluppatori

#### Struttura di un'App

Ogni app deve avere questa struttura:

```
app-name/
├── aideas.json          # Manifest dell'app
├── index.html           # File principale HTML
├── style.css            # Stili CSS (opzionale)
├── script.js            # Script JavaScript (opzionale)
└── assets/              # Risorse aggiuntive (opzionale)
    ├── images/
    └── fonts/
```

#### Manifest (aideas.json)

```json
{
  "name": "Nome dell'App",
  "description": "Descrizione dell'app",
  "author": "Nome Autore",
  "version": "1.0.0",
  "category": "utility",
  "tags": ["produttività", "strumenti"],
  "icon": "🚀",
  "githubUrl": "https://github.com/username/repo",
  "permissions": ["local-storage", "external-scripts"],
  "metadata": {
    "minAideasVersion": "1.0.0"
  }
}
```

#### Categorie Disponibili

- `utility`: Strumenti e utilità
- `productivity`: App per la produttività
- `game`: Giochi e intrattenimento
- `social`: App social e comunicazione
- `altro`: Altre categorie

#### Permessi

- `local-storage`: Accesso al localStorage
- `external-scripts`: Script esterni
- `external-styles`: Stili esterni
- `external-images`: Immagini esterne
- `api-access`: Accesso a API esterne
- `geolocation`: Accesso alla posizione
- `media-devices`: Accesso a camera/microfono
- `notifications`: Notifiche del browser
- `iframe-access`: Accesso a iframe esterni

### Sottomissione di un'App

#### Metodo 1: Tramite l'Interfaccia

1. **Prepara la tua app** con tutti i file necessari
2. **Installa l'app** in AIdeas
3. **Apri le informazioni dell'app** (clicca sull'icona info)
4. **Clicca "Sottometti allo Store"**
5. **Completa la pull request** su GitHub

#### Metodo 2: Pull Request Diretta

1. **Fai un fork** del repository [aideas.store](https://github.com/aideas-run/aideas.store)
2. **Crea una cartella** per la tua app in `apps/app-name/`
3. **Aggiungi tutti i file** dell'app
4. **Crea una pull request** con:
   - Titolo: `Add app: Nome App`
   - Descrizione dettagliata dell'app
   - Screenshot se possibile

### Requisiti per l'Approvazione

- ✅ App funzionante senza errori
- ✅ File HTML/CSS/JS inclusi
- ✅ Manifest aideas.json presente e valido
- ✅ Nessun contenuto dannoso o malware
- ✅ Descrizione chiara e completa
- ✅ Icona appropriata
- ✅ Categoria corretta
- ✅ Tag rilevanti

### Best Practices

#### Design
- Usa design responsive
- Segui le linee guida Material Design
- Assicurati che funzioni su mobile

#### Codice
- Codice pulito e ben commentato
- Gestione errori appropriata
- Performance ottimizzate
- Accessibilità (ARIA labels, keyboard navigation)

#### Sicurezza
- Non includere API keys nel codice
- Valida tutti gli input utente
- Usa HTTPS per risorse esterne
- Evita eval() e innerHTML non sicuri

#### File
- Mantieni dimensioni file ragionevoli (< 5MB totali)
- Comprimi immagini quando possibile
- Usa formati moderni (WebP, SVG)
- Organizza file in cartelle logiche

### Repository Structure

```
aideas.store/
├── apps/
│   ├── app-1/
│   │   ├── aideas.json
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   ├── app-2/
│   │   └── ...
│   └── ...
├── README.md
└── CONTRIBUTING.md
```

### Workflow di Approvazione

1. **Pull Request** creata
2. **Review automatica** per controlli di base
3. **Review manuale** da parte del team
4. **Test funzionale** dell'app
5. **Approvazione** e merge
6. **Pubblicazione** nello store

### Supporto

- **Issues**: [GitHub Issues](https://github.com/aideas-run/aideas.store/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aideas-run/aideas.store/discussions)
- **Wiki**: [Documentazione completa](https://github.com/aideas-run/aideas.store/wiki)

### Licenza

Tutte le app nello store devono essere rilasciate sotto licenza open source compatibile con MIT o simile.

---

**Nota**: Lo store è in fase di sviluppo. Alcune funzionalità potrebbero cambiare. 