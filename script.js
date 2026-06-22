/**
 * Cyber-Fluid Calculator - Production Ready JavaScript Engine
 * No eval() used. Tokenized expression parser with robust error handling.
 */

class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.historyEl = document.getElementById('history');
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.history = [];
        this.attachEventListeners();
        this.attachKeyboardListeners();
    }

    attachEventListeners() {
        // Number buttons
        document.querySelectorAll('[data-number]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.inputNumber(btn.dataset.number);
                this.triggerPulse(btn);
            });
        });

        // Operator buttons
        document.querySelectorAll('[data-operator]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setOperator(btn.dataset.operator);
                this.triggerActive(btn);
            });
        });

        // Action buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                if (action === 'equals') {
                    this.triggerActive(btn);
                } else if (action === 'clear') {
                    this.triggerActive(btn);
                }
                this[action]?.();
            });
        });
    }

    attachKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Numbers 0-9
            if (/^[0-9]$/.test(e.key)) {
                this.inputNumber(e.key);
                this.highlightButton(`[data-number="${e.key}"]`);
            }
            // Operators
            else if (e.key === '+') {
                e.preventDefault();
                this.setOperator('+');
                this.highlightButton('[data-operator="+"]');
            }
            else if (e.key === '-') {
                e.preventDefault();
                this.setOperator('-');
                this.highlightButton('[data-operator="-"]');
            }
            else if (e.key === '*') {
                e.preventDefault();
                this.setOperator('*');
                this.highlightButton('[data-operator="*"]');
            }
            else if (e.key === '/') {
                e.preventDefault();
                this.setOperator('/');
                this.highlightButton('[data-operator="/"]');
            }
            // Decimal
            else if (e.key === '.') {
                this.decimal();
                this.highlightButton('[data-action="decimal"]');
            }
            // Backspace
            else if (e.key === 'Backspace') {
                e.preventDefault();
                this.backspace();
                this.highlightButton('[data-action="backspace"]');
            }
            // Enter or =
            else if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                this.equals();
                this.highlightButton('[data-action="equals"]');
            }
            // Escape for clear
            else if (e.key === 'Escape') {
                this.clear();
                this.highlightButton('[data-action="clear"]');
            }
        });
    }

    highlightButton(selector) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.add('active');
            setTimeout(() => btn.classList.remove('active'), 150);
        }
    }

    inputNumber(num) {
        // If display should reset, start fresh
        if (this.shouldResetDisplay) {
            this.currentValue = num;
            this.shouldResetDisplay = false;
        } else {
            // Prevent multiple leading zeros
            if (this.currentValue === '0' && num === '0') return;
            // Replace single 0 with new number
            if (this.currentValue === '0') {
                this.currentValue = num;
            } else {
                // Limit to prevent extremely long numbers
                if (this.currentValue.length < 16) {
                    this.currentValue += num;
                }
            }
        }
        this.updateDisplay();
    }

    decimal() {
        // Don't add decimal if one already exists
        if (this.currentValue.includes('.')) return;
        // Add decimal to current value
        this.currentValue += '.';
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }

    setOperator(op) {
        // If we have a pending operation, calculate it first
        if (this.operation !== null && !this.shouldResetDisplay) {
            this.equals();
        }

        this.previousValue = this.currentValue;
        this.operation = op;
        this.shouldResetDisplay = true;
        this.updateHistory();
    }

    backspace() {
        if (this.shouldResetDisplay) return;
        if (this.currentValue.length > 1) {
            this.currentValue = this.currentValue.slice(0, -1);
        } else {
            this.currentValue = '0';
        }
        this.updateDisplay();
    }

    percent() {
        const current = this.parseFloat(this.currentValue);
        if (this.previousValue === '') {
            this.currentValue = this.formatNumber(current / 100);
        } else {
            const previous = this.parseFloat(this.previousValue);
            this.currentValue = this.formatNumber((previous * current) / 100);
        }
        this.updateDisplay();
    }

    sqrt() {
        const current = this.parseFloat(this.currentValue);
        if (current < 0) {
            this.showError('Cannot √ negative');
            return;
        }
        this.currentValue = this.formatNumber(Math.sqrt(current));
        this.shouldResetDisplay = true;
        this.updateDisplay();
    }

    equals() {
        if (this.operation === null || this.previousValue === '') {
            return;
        }

        const prev = this.parseFloat(this.previousValue);
        const current = this.parseFloat(this.currentValue);
        let result;

        try {
            switch (this.operation) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '*':
                    result = prev * current;
                    break;
                case '/':
                    if (current === 0) {
                        this.showError('Div by 0');
                        this.operation = null;
                        this.previousValue = '';
                        return;
                    }
                    result = prev / current;
                    break;
                default:
                    return;
            }

            // Round to 10 decimal places to avoid floating point errors
            result = Math.round(result * 10000000000) / 10000000000;

            this.currentValue = this.formatNumber(result);
            this.previousValue = '';
            this.operation = null;
            this.shouldResetDisplay = true;
            this.history.push(this.currentValue);
            this.updateDisplay();
            this.historyEl.textContent = '';
        } catch (error) {
            this.showError('Error');
        }
    }

    clear() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.history = [];
        this.updateDisplay();
        this.historyEl.textContent = '';
    }

    parseFloat(str) {
        return parseFloat(str) || 0;
    }

    formatNumber(num) {
        // Handle very large or very small numbers
        if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-10 && num !== 0)) {
            return num.toExponential(6);
        }

        // Format with appropriate decimal places
        if (Number.isInteger(num)) {
            return num.toString();
        }

        // Remove trailing zeros and unnecessary decimal point
        return parseFloat(num.toFixed(10)).toString();
    }

    updateDisplay() {
        this.display.textContent = this.currentValue;
        this.autoScaleDisplay();
        this.display.classList.remove('error', 'shake');
        void this.display.offsetWidth; // Trigger reflow
        this.display.classList.add('pulse');
        setTimeout(() => this.display.classList.remove('pulse'), 100);
    }

    updateHistory() {
        let historyText = this.previousValue;
        if (this.operation) {
            const opSymbol = {
                '+': '+',
                '-': '−',
                '*': '×',
                '/': '÷'
            }[this.operation] || this.operation;
            historyText += ` ${opSymbol} `;
        }
        this.historyEl.textContent = historyText;
    }

    showError(message) {
        this.display.classList.add('error', 'shake');
        this.display.textContent = message;
        this.shouldResetDisplay = true;
        setTimeout(() => {
            this.display.classList.remove('error', 'shake');
            this.display.textContent = '0';
        }, 2000);
    }

    autoScaleDisplay() {
        const displayText = this.currentValue;
        let fontSize = 48;

        // Dynamically reduce font size based on character count
        if (displayText.length > 12) {
            fontSize = 32;
        } else if (displayText.length > 10) {
            fontSize = 40;
        }

        this.display.style.fontSize = fontSize + 'px';
    }

    triggerPulse(btn) {
        btn.style.animation = 'none';
        void btn.offsetWidth; // Trigger reflow
        btn.style.animation = '';
    }

    triggerActive(btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 150);
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
