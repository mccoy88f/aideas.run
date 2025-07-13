# Calcolatrice Semplice - Esempio App AIdeas Store

Questo è un esempio di app per l'AIdeas Store che mostra come strutturare correttamente un'applicazione.

## Caratteristiche

- 🧮 Calcoli matematici base (addizione, sottrazione, moltiplicazione, divisione)
- 📱 Design responsive con glassmorphism
- ⌨️ Supporto per tastiera
- 💾 Salvataggio automatico della cronologia
- 🎨 Animazioni fluide
- 🌙 Design moderno con effetti glass

## Struttura File

```
calculator/
├── aideas.json          # Manifest dell'app
├── index.html           # File principale HTML
├── style.css            # Stili CSS
├── script.js            # Logica JavaScript
└── README.md            # Questo file
```

## Funzionalità

### Operazioni Supportate
- Addizione (+)
- Sottrazione (-)
- Moltiplicazione (×)
- Divisione (÷)
- Modulo (%)

### Controlli
- **Mouse**: Clic sui pulsanti
- **Tastiera**: 
  - Numeri (0-9)
  - Operatori (+, -, *, /, %)
  - Enter/= per calcolare
  - Escape per cancellare
  - Backspace per cancellare ultimo carattere

### Caratteristiche Avanzate
- Gestione errori (divisione per zero)
- Formattazione numeri grandi
- Cronologia calcoli nel localStorage
- Design glassmorphism moderno
- Animazioni CSS

## Come Usare

1. Apri l'app in AIdeas
2. Usa i pulsanti o la tastiera per inserire numeri
3. Seleziona un operatore
4. Inserisci il secondo numero
5. Premi = o Enter per calcolare
6. Il risultato viene salvato automaticamente

## Tecnologie Utilizzate

- **HTML5**: Struttura semantica
- **CSS3**: 
  - Grid Layout
  - Flexbox
  - CSS Variables
  - Animazioni
  - Glassmorphism
- **JavaScript ES6+**:
  - Arrow functions
  - Template literals
  - LocalStorage API
  - Event handling

## Best Practices Implementate

### Design
- ✅ Design responsive
- ✅ Accessibilità (ARIA labels)
- ✅ Contrasto appropriato
- ✅ Feedback visivo per interazioni

### Codice
- ✅ Codice pulito e commentato
- ✅ Gestione errori
- ✅ Performance ottimizzate
- ✅ Separazione logica (HTML/CSS/JS)

### Sicurezza
- ✅ Validazione input
- ✅ Sanitizzazione dati
- ✅ Gestione errori robusta

## Installazione

1. Copia tutti i file in una cartella
2. Assicurati che `aideas.json` sia configurato correttamente
3. Testa l'app localmente aprendo `index.html`
4. Se tutto funziona, sottometti allo store

## Personalizzazione

### Cambiare Colori
Modifica le variabili CSS in `style.css`:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #ffc107;
}
```

### Aggiungere Operazioni
Aggiungi nuovi operatori in `script.js`:

```javascript
case '^':
    result = Math.pow(previousNumber, current);
    break;
```

## Licenza

MIT License - Libero per uso personale e commerciale.

---

**Nota**: Questo è un esempio educativo. Per app reali, assicurati di seguire tutte le best practices e i requisiti dello store. 