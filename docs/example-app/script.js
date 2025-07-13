// Variabili globali
let currentNumber = '0';
let previousNumber = null;
let operator = null;
let waitingForNumber = false;
let history = [];

// Elementi DOM
const currentDisplay = document.getElementById('current');
const historyDisplay = document.getElementById('history');

// Funzione per aggiornare il display
function updateDisplay() {
    currentDisplay.textContent = currentNumber;
    historyDisplay.textContent = history.join(' ');
}

// Funzione per aggiungere un numero
function appendNumber(num) {
    if (waitingForNumber) {
        currentNumber = num;
        waitingForNumber = false;
    } else {
        if (currentNumber === '0' && num !== '.') {
            currentNumber = num;
        } else {
            if (num === '.' && currentNumber.includes('.')) {
                return; // Evita doppi decimali
            }
            currentNumber += num;
        }
    }
    updateDisplay();
}

// Funzione per impostare l'operatore
function setOperator(op) {
    if (operator && !waitingForNumber) {
        calculate();
    }
    
    previousNumber = parseFloat(currentNumber);
    operator = op;
    waitingForNumber = true;
    
    // Aggiungi alla storia
    history.push(currentNumber, getOperatorSymbol(op));
    updateDisplay();
}

// Funzione per calcolare il risultato
function calculate() {
    if (operator && previousNumber !== null) {
        const current = parseFloat(currentNumber);
        let result;
        
        switch (operator) {
            case '+':
                result = previousNumber + current;
                break;
            case '-':
                result = previousNumber - current;
                break;
            case '*':
                result = previousNumber * current;
                break;
            case '/':
                if (current === 0) {
                    alert('Errore: Divisione per zero!');
                    clearAll();
                    return;
                }
                result = previousNumber / current;
                break;
            case '%':
                result = previousNumber % current;
                break;
            default:
                return;
        }
        
        // Aggiungi alla storia
        history.push(currentNumber, '=', result.toString());
        
        currentNumber = result.toString();
        operator = null;
        previousNumber = null;
        waitingForNumber = true;
        
        updateDisplay();
        
        // Salva nel localStorage
        saveToHistory();
    }
}

// Funzione per cancellare tutto
function clearAll() {
    currentNumber = '0';
    previousNumber = null;
    operator = null;
    waitingForNumber = false;
    history = [];
    updateDisplay();
}

// Funzione per cancellare l'ultimo carattere
function backspace() {
    if (currentNumber.length > 1) {
        currentNumber = currentNumber.slice(0, -1);
    } else {
        currentNumber = '0';
    }
    updateDisplay();
}

// Funzione per ottenere il simbolo dell'operatore
function getOperatorSymbol(op) {
    const symbols = {
        '+': '+',
        '-': '-',
        '*': '×',
        '/': '÷',
        '%': '%'
    };
    return symbols[op] || op;
}

// Funzione per salvare nel localStorage
function saveToHistory() {
    const calcHistory = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');
    calcHistory.push({
        expression: history.join(' '),
        result: currentNumber,
        timestamp: new Date().toISOString()
    });
    
    // Mantieni solo gli ultimi 10 calcoli
    if (calcHistory.length > 10) {
        calcHistory.splice(0, calcHistory.length - 10);
    }
    
    localStorage.setItem('calculatorHistory', JSON.stringify(calcHistory));
}

// Funzione per caricare la storia dal localStorage
function loadHistory() {
    const calcHistory = JSON.parse(localStorage.getItem('calculatorHistory') || '[]');
    if (calcHistory.length > 0) {
        const lastCalc = calcHistory[calcHistory.length - 1];
        console.log('Ultimo calcolo:', lastCalc.expression, '=', lastCalc.result);
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    updateDisplay();
    
    // Aggiungi supporto per tastiera
    document.addEventListener('keydown', function(e) {
        const key = e.key;
        
        if (key >= '0' && key <= '9' || key === '.') {
            appendNumber(key);
        } else if (key === '+' || key === '-') {
            setOperator(key);
        } else if (key === '*') {
            setOperator('*');
        } else if (key === '/') {
            setOperator('/');
        } else if (key === '%') {
            setOperator('%');
        } else if (key === 'Enter' || key === '=') {
            calculate();
        } else if (key === 'Escape') {
            clearAll();
        } else if (key === 'Backspace') {
            backspace();
        }
    });
});

// Funzione per formattare i numeri grandi
function formatNumber(num) {
    const str = num.toString();
    if (str.length > 12) {
        return parseFloat(num).toExponential(6);
    }
    return str;
}

// Aggiorna la funzione updateDisplay per usare formatNumber
function updateDisplay() {
    currentDisplay.textContent = formatNumber(currentNumber);
    historyDisplay.textContent = history.join(' ');
} 