/**
 * Calculator Controller
 * Manages user interactions, keypad inputs, display updates, keyboard shortcuts, and state.
 */

const EngineRef = typeof CalculatorEngine !== 'undefined'
  ? CalculatorEngine
  : (typeof require !== 'undefined' ? require('./engine.js') : null);

const HistoryRef = typeof HistoryManager !== 'undefined'
  ? HistoryManager
  : (typeof require !== 'undefined' ? require('./history.js') : null);

/**
 * Audio Synthesizer and Haptics Manager
 * Uses Web Audio API for zero-latency synthesized tactile clicks & navigator.vibrate for haptics.
 */
class FeedbackManager {
  constructor() {
    this.soundEnabled = typeof localStorage !== 'undefined' ? (localStorage.getItem('calc_sound') !== 'false') : true;
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  play(type = 'default') {
    // 1. Haptic Vibration Feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (type === 'equals') {
          navigator.vibrate([14, 25, 18]);
        } else if (type === 'clear') {
          navigator.vibrate(22);
        } else if (type === 'op') {
          navigator.vibrate(12);
        } else {
          navigator.vibrate(8);
        }
      } catch (e) {}
    }

    // 2. Synthesized Click Sound Feedback
    if (!this.soundEnabled) return;

    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'equals') {
        // Pleasant harmonic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'clear') {
        // Soft bass pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'op') {
        // Crisp high-mid tactile snap
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.035);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else {
        // Subtle mechanical click for digits and functions
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.025);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (e) {}
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calc_sound', this.soundEnabled.toString());
    }
    return this.soundEnabled;
  }
}

class ScientificCalculator {
  constructor() {
    this.engine = new EngineRef();
    this.history = new HistoryRef();
    this.feedback = new FeedbackManager();

    // State
    this.expression = '';
    this.lastResult = null;
    this.ans = 0;
    this.isEvaluated = false;
    this.isShiftActive = false; // 2nd function toggle
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.memory = 0; // Memory storage (M+, M-, MR, MC)

    // DOM Elements cache
    this.dom = {};
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.bindKeyboard();
    this.initHistory();
    this.initTheme();
    this.updateDisplay();
    this.updateAngleModeUI();
    this.updateSoundUI();
  }

  cacheDom() {
    this.dom = {
      calculator: document.querySelector('.calculator-container'),
      primaryDisplay: document.getElementById('primaryDisplay'),
      secondaryDisplay: document.getElementById('secondaryDisplay'),
      evalPreview: document.getElementById('evalPreview'),
      angleModeBtn: document.getElementById('btnAngleMode'),
      angleModeBadge: document.getElementById('angleModeBadge'),
      shiftBtn: document.getElementById('btnShift'),
      soundToggleBtn: document.getElementById('btnSoundToggle'),
      soundIcon: document.getElementById('soundIcon'),
      keypad: document.querySelector('.calc-keypad'),
      historyPanel: document.getElementById('historyPanel'),
      historyList: document.getElementById('historyList'),
      historyToggleBtn: document.getElementById('btnHistoryToggle'),
      historyCloseBtn: document.getElementById('btnHistoryClose'),
      historyClearBtn: document.getElementById('btnHistoryClear'),
      themeToggleBtn: document.getElementById('btnThemeToggle'),
      themeIcon: document.getElementById('themeIcon'),
      themeLabelText: document.getElementById('themeLabelText'),
      memoryBadge: document.getElementById('memoryBadge'),
      toast: document.getElementById('calcToast'),
      infoBtn: document.getElementById('btnInfoModal'),
      infoModal: document.getElementById('infoModal'),
      infoCloseBtn: document.getElementById('btnInfoClose'),
      mobileTabs: document.getElementById('mobileTabs'),
      keypadSci: document.getElementById('keypadSci'),
      keypadBasic: document.getElementById('keypadBasic')
    };
  }

  bindEvents() {
    // Keypad button click delegation
    if (this.dom.keypad) {
      this.dom.keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action], button[data-value]');
        if (!btn) return;
        this.handleButtonPress(btn);
      });
    }

    // Angle mode switch
    if (this.dom.angleModeBtn) {
      this.dom.angleModeBtn.addEventListener('click', () => {
        this.toggleAngleMode();
      });
    }

    // Shift (2nd) toggle
    if (this.dom.shiftBtn) {
      this.dom.shiftBtn.addEventListener('click', () => {
        this.toggleShift();
      });
    }

    // History controls
    if (this.dom.historyToggleBtn) {
      this.dom.historyToggleBtn.addEventListener('click', () => {
        this.toggleHistoryPanel();
      });
    }
    if (this.dom.historyCloseBtn) {
      this.dom.historyCloseBtn.addEventListener('click', () => {
        this.closeHistoryPanel();
      });
    }
    if (this.dom.historyClearBtn) {
      this.dom.historyClearBtn.addEventListener('click', () => {
        this.history.clear();
        this.showToast('Calculation history cleared');
      });
    }

    // Theme toggle
    if (this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Sound and haptics toggle
    if (this.dom.soundToggleBtn) {
      this.dom.soundToggleBtn.addEventListener('click', () => {
        const enabled = this.feedback.toggleSound();
        this.updateSoundUI();
        this.showToast(enabled ? 'Sound & haptics enabled' : 'Sound muted');
      });
    }

    // Primary display copy on click
    if (this.dom.primaryDisplay) {
      this.dom.primaryDisplay.addEventListener('click', () => {
        this.copyDisplayToClipboard();
      });
    }

    // Keyboard Shortcuts Info Modal
    if (this.dom.infoBtn && this.dom.infoModal) {
      this.dom.infoBtn.addEventListener('click', () => {
        this.dom.infoModal.classList.add('active');
      });
    }
    if (this.dom.infoCloseBtn && this.dom.infoModal) {
      this.dom.infoCloseBtn.addEventListener('click', () => {
        this.dom.infoModal.classList.remove('active');
      });
    }
    if (this.dom.infoModal) {
      this.dom.infoModal.addEventListener('click', (e) => {
        if (e.target === this.dom.infoModal) {
          this.dom.infoModal.classList.remove('active');
        }
      });
    }

    // Mobile View Tabs (All / Basic / Sci)
    if (this.dom.mobileTabs) {
      this.dom.mobileTabs.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.view-tab-btn');
        if (!tabBtn) return;
        const tab = tabBtn.dataset.tab;
        
        this.dom.mobileTabs.querySelectorAll('.view-tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn === tabBtn);
        });

        if (this.dom.keypadSci && this.dom.keypadBasic) {
          if (tab === 'basic') {
            this.dom.keypadSci.style.display = 'none';
            this.dom.keypadBasic.style.display = 'grid';
          } else if (tab === 'sci') {
            this.dom.keypadSci.style.display = 'grid';
            this.dom.keypadBasic.style.display = 'none';
          } else {
            this.dom.keypadSci.style.display = 'grid';
            this.dom.keypadBasic.style.display = 'grid';
          }
        }
      });
    }

    // Reset keypad inline display styles on desktop resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 600 && this.dom.keypadSci && this.dom.keypadBasic) {
        this.dom.keypadSci.style.display = '';
        this.dom.keypadBasic.style.display = '';
      }
    });
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if focus is inside modal or input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key;

      // Digits & basic symbols
      if (key >= '0' && key <= '9') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputDigit(key);
        this.highlightButton(`[data-value="${key}"]`);
      } else if (key === '.') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputDot();
        this.highlightButton('[data-value="."]');
      } else if (key === '+' || key === '-') {
        e.preventDefault();
        this.feedback.play('op');
        this.inputOperator(key === '+' ? '+' : '−');
        this.highlightButton(`[data-value="${key === '+' ? '+' : '−'}"]`);
      } else if (key === '*') {
        e.preventDefault();
        this.feedback.play('op');
        this.inputOperator('×');
        this.highlightButton('[data-value="×"]');
      } else if (key === '/') {
        e.preventDefault();
        this.feedback.play('op');
        this.inputOperator('÷');
        this.highlightButton('[data-value="÷"]');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputParenthesis(key);
        this.highlightButton(`[data-value="${key}"]`);
      } else if (key === '^') {
        e.preventDefault();
        this.feedback.play('op');
        this.inputOperator('^');
        this.highlightButton('[data-value="^"]');
      } else if (key === '!') {
        e.preventDefault();
        this.feedback.play('op');
        this.inputPostfix('!');
        this.highlightButton('[data-value="!"]');
      } else if (key === '%') {
        e.preventDefault();
        this.feedback.play('op');
        this.inputPostfix('%');
        this.highlightButton('[data-value="%"]');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        this.feedback.play('equals');
        this.executeCalculate();
        this.highlightButton('[data-action="calculate"]');
      } else if (key === 'Backspace') {
        e.preventDefault();
        this.feedback.play('clear');
        this.deleteLast();
        this.highlightButton('[data-action="delete"]');
      } else if (key === 'Escape') {
        e.preventDefault();
        this.feedback.play('clear');
        this.clearAll();
        this.highlightButton('[data-action="clear"]');
      } else if (key.toLowerCase() === 's') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputFunction(this.isShiftActive ? 'asin(' : 'sin(');
      } else if (key.toLowerCase() === 'c') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputFunction(this.isShiftActive ? 'acos(' : 'cos(');
      } else if (key.toLowerCase() === 't') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputFunction(this.isShiftActive ? 'atan(' : 'tan(');
      } else if (key.toLowerCase() === 'l') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputFunction(this.isShiftActive ? '10^(' : 'log(');
      } else if (key.toLowerCase() === 'n') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputFunction(this.isShiftActive ? 'e^(' : 'ln(');
      } else if (key.toLowerCase() === 'p') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputConstant('π');
      } else if (key.toLowerCase() === 'e') {
        e.preventDefault();
        this.feedback.play('default');
        this.inputConstant('e');
      } else if (key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.toggleAngleMode();
      } else if (key.toLowerCase() === 'h') {
        e.preventDefault();
        this.toggleHistoryPanel();
      }
    });
  }

  highlightButton(selector) {
    try {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.classList.add('keyboard-active');
        setTimeout(() => btn.classList.remove('keyboard-active'), 150);
      }
    } catch (e) {}
  }

  handleButtonPress(btn) {
    const action = btn.dataset.action;
    const value = btn.dataset.value;
    const shiftValue = btn.dataset.shiftValue;

    // Trigger haptics and synthesized sound feedback
    if (action === 'calculate') {
      this.feedback.play('equals');
    } else if (action === 'clear' || action === 'delete') {
      this.feedback.play('clear');
    } else if (btn.classList.contains('btn-op') || ['+', '−', '×', '÷', '^', '%'].includes(value)) {
      this.feedback.play('op');
    } else {
      this.feedback.play('default');
    }

    // Determine actual value if shift is active
    const actualVal = (this.isShiftActive && shiftValue) ? shiftValue : value;

    if (action) {
      switch (action) {
        case 'clear':
          this.clearAll();
          break;
        case 'delete':
          this.deleteLast();
          break;
        case 'calculate':
          this.executeCalculate();
          break;
        case 'toggle-sign':
          this.toggleSign();
          break;
        case 'ans':
          this.insertAns();
          break;
        case 'reciprocal':
          this.inputReciprocal();
          break;
        case 'square':
          this.inputPower('^2');
          break;
        case 'cube':
          this.inputPower('^3');
          break;
        case 'mem-add':
          this.memoryAdd();
          break;
        case 'mem-sub':
          this.memorySub();
          break;
        case 'mem-recall':
          this.memoryRecall();
          break;
        case 'mem-clear':
          this.memoryClear();
          break;
        default:
          break;
      }
    } else if (actualVal !== undefined) {
      this.handleInput(actualVal);
    }
  }

  handleInput(val) {
    // Check if it's a digit
    if (/^[0-9]$/.test(val)) {
      this.inputDigit(val);
      return;
    }

    // Dot
    if (val === '.') {
      this.inputDot();
      return;
    }

    // Constants
    if (val === 'π' || val === 'e') {
      this.inputConstant(val);
      return;
    }

    // Power exponents
    if (val.startsWith('^') && val.length > 1) {
      this.inputPower(val);
      return;
    }

    // Operators
    if (['+', '−', '×', '÷', '^'].includes(val)) {
      this.inputOperator(val);
      return;
    }

    // Postfix operators
    if (val === '!' || val === '%') {
      this.inputPostfix(val);
      return;
    }

    // Parentheses
    if (val === '(' || val === ')') {
      this.inputParenthesis(val);
      return;
    }

    // Functions with open parenthesis: sin(, cos(, tan(, etc.
    if (val.endsWith('(')) {
      this.inputFunction(val);
      return;
    }

    // Otherwise append
    this.appendExpression(val);
  }

  inputDigit(digit) {
    if (this.isEvaluated) {
      // Start fresh
      this.expression = digit;
      this.isEvaluated = false;
    } else {
      if (this.expression === '0') {
        this.expression = digit;
      } else {
        this.expression += digit;
      }
    }
    this.updateDisplay();
  }

  inputDot() {
    if (this.isEvaluated) {
      this.expression = '0.';
      this.isEvaluated = false;
      this.updateDisplay();
      return;
    }

    // Find the current number token being typed
    const match = this.expression.match(/([0-9.]+)$/);
    if (match) {
      if (!match[1].includes('.')) {
        this.expression += '.';
      }
    } else {
      // If preceded by an operator or function parenthesis, e.g. "5 + ." -> "5 + 0."
      this.expression += '0.';
    }
    this.updateDisplay();
  }

  inputOperator(op) {
    if (this.isEvaluated) {
      // Continue from previous result
      this.expression = (this.lastResult !== null ? this.lastResult : '0') + ` ${op} `;
      this.isEvaluated = false;
      this.updateDisplay();
      return;
    }

    if (!this.expression || this.expression.trim() === '') {
      if (op === '−') {
        this.expression = '-';
        this.updateDisplay();
      } else {
        this.expression = `0 ${op} `;
        this.updateDisplay();
      }
      return;
    }

    const trimmed = this.expression.trimEnd();

    // If expression ends with an opening parenthesis and user presses minus, treat as unary negative: "(-"
    if (trimmed.endsWith('(') && op === '−') {
      this.expression = trimmed + '-';
      this.updateDisplay();
      return;
    }

    // If expression ends with an operator, replace it
    const endsWithOp = /[+−×÷^]$/.test(trimmed);
    if (endsWithOp) {
      this.expression = trimmed.slice(0, -1).trimEnd() + ` ${op} `;
    } else {
      this.expression += ` ${op} `;
    }
    this.updateDisplay();
  }

  inputPostfix(op) {
    if (this.isEvaluated) {
      this.expression = (this.lastResult !== null ? this.lastResult : '0') + op;
      this.isEvaluated = false;
      this.updateDisplay();
      return;
    }

    if (!this.expression) return;
    this.expression += op;
    this.updateDisplay();
  }

  inputParenthesis(p) {
    if (this.isEvaluated) {
      if (p === '(') {
        this.expression = '(';
        this.isEvaluated = false;
        this.updateDisplay();
        return;
      }
    }

    if (p === ')') {
      // Only allow closing parenthesis if there is an unmatched opening
      const openCount = (this.expression.match(/\(/g) || []).length;
      const closeCount = (this.expression.match(/\)/g) || []).length;
      if (closeCount < openCount) {
        this.expression += ')';
      }
    } else {
      this.expression += '(';
    }
    this.updateDisplay();
  }

  inputFunction(fnStr) {
    if (this.isEvaluated) {
      this.expression = fnStr;
      this.isEvaluated = false;
    } else {
      // Implicit multiplication handled by engine, e.g. 5sin(30)
      this.expression += fnStr;
    }
    this.updateDisplay();
  }

  inputConstant(c) {
    if (this.isEvaluated) {
      this.expression = c;
      this.isEvaluated = false;
    } else {
      this.expression += c;
    }
    this.updateDisplay();
  }

  inputPower(powStr) {
    if (this.isEvaluated) {
      this.expression = (this.lastResult !== null ? this.lastResult : '0') + powStr;
      this.isEvaluated = false;
    } else {
      if (!this.expression) {
        this.expression = '0' + powStr;
      } else {
        this.expression += powStr;
      }
    }
    this.updateDisplay();
  }

  inputReciprocal() {
    if (this.isEvaluated && this.lastResult !== null) {
      this.expression = `1 / (${this.lastResult})`;
      this.isEvaluated = false;
    } else if (this.expression) {
      this.expression = `1 / (${this.expression})`;
    } else {
      this.expression = '1 / (';
    }
    this.updateDisplay();
  }

  insertAns() {
    if (this.ans === undefined || this.ans === null) return;
    if (this.isEvaluated) {
      this.expression = `${this.ans}`;
      this.isEvaluated = false;
    } else {
      this.expression += `${this.ans}`;
    }
    this.updateDisplay();
  }

  toggleSign() {
    if (this.isEvaluated && this.lastResult !== null) {
      const num = -parseFloat(this.lastResult);
      this.expression = num.toString();
      this.lastResult = num;
      this.updateDisplay();
      return;
    }

    if (!this.expression) {
      this.expression = '-';
      this.updateDisplay();
      return;
    }

    // If starts with negative sign, strip it, or wrap in -()
    if (this.expression.startsWith('-(') && this.expression.endsWith(')')) {
      this.expression = this.expression.slice(2, -1);
    } else if (this.expression.startsWith('-') && !this.expression.includes(' ')) {
      this.expression = this.expression.slice(1);
    } else {
      this.expression = `-(${this.expression})`;
    }
    this.updateDisplay();
  }

  clearAll() {
    this.expression = '';
    this.lastResult = null;
    this.isEvaluated = false;
    this.setSecondary('');
    this.setPreview('');
    this.updateDisplay();
  }

  deleteLast() {
    if (this.isEvaluated) {
      // Clear if just calculated
      this.clearAll();
      return;
    }

    if (!this.expression) return;

    let expr = this.expression;

    // Check for multi-character functions at end: e.g. 'sin(', 'asin(', 'sqrt(', '10^('
    const funcPatterns = [
      /asin\($/, /acos\($/, /atan\($/,
      /sinh\($/, /cosh\($/, /tanh\($/,
      /sin\($/, /cos\($/, /tan\($/,
      /sqrt\($/, /cbrt\($/, /log\($/, /ln\($/, /abs\($/,
      /10\^\($/, /e\^\($/,
      /√\($/, /∛\($/
    ];

    for (const pat of funcPatterns) {
      if (pat.test(expr)) {
        this.expression = expr.replace(pat, '');
        this.updateDisplay();
        return;
      }
    }

    // Check for spaced operators like ' + ', ' − '
    if (/\s[+−×÷^]\s$/.test(expr)) {
      this.expression = expr.slice(0, -3);
      this.updateDisplay();
      return;
    }

    // Default: remove last single character
    this.expression = expr.slice(0, -1);
    this.updateDisplay();
  }

  executeCalculate() {
    if (!this.expression || this.expression.trim() === '') return;

    try {
      const res = this.engine.calculate(this.expression, this.angleMode);
      const formatted = this.engine.formatResult(res);

      // Save to history
      this.history.add(this.expression, formatted, this.angleMode);

      // Update secondary display with evaluated expression
      this.setSecondary(`${this.expression} =`);

      // Set answer
      this.ans = res;
      this.lastResult = formatted;
      this.expression = formatted.toString();
      this.isEvaluated = true;
      this.setPreview('');

      this.updateDisplay();
    } catch (err) {
      console.warn('Calculation error:', err.message);
      this.setSecondary(this.expression);
      this.showError(err.message || 'Error');
    }
  }

  showError(message) {
    if (this.dom.primaryDisplay) {
      this.dom.primaryDisplay.textContent = message;
      this.dom.primaryDisplay.classList.add('error-state');
      setTimeout(() => {
        if (this.dom.primaryDisplay) {
          this.dom.primaryDisplay.classList.remove('error-state');
        }
      }, 2000);
    }
  }

  updateDisplay() {
    if (!this.dom.primaryDisplay) return;

    const text = this.expression || '0';
    this.dom.primaryDisplay.textContent = text;

    // Adjust font size dynamically if long expression
    const len = text.length;
    if (len > 18) {
      this.dom.primaryDisplay.style.fontSize = '1.35rem';
    } else if (len > 12) {
      this.dom.primaryDisplay.style.fontSize = '1.8rem';
    } else {
      this.dom.primaryDisplay.style.fontSize = '';
    }

    // Live preview evaluation (subtle preview of answer as user types)
    if (!this.isEvaluated && this.expression && this.expression.length > 1) {
      try {
        const previewVal = this.engine.calculate(this.expression, this.angleMode);
        if (typeof previewVal === 'number' && !isNaN(previewVal) && isFinite(previewVal)) {
          this.setPreview(`= ${this.engine.formatResult(previewVal)}`);
        } else {
          this.setPreview('');
        }
      } catch (e) {
        this.setPreview('');
      }
    } else {
      this.setPreview('');
    }
  }

  setSecondary(text) {
    if (this.dom.secondaryDisplay) {
      this.dom.secondaryDisplay.textContent = text;
    }
  }

  setPreview(text) {
    if (this.dom.evalPreview) {
      this.dom.evalPreview.textContent = text;
    }
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    this.engine.setAngleMode(this.angleMode);
    this.updateAngleModeUI();
    this.showToast(`Angle mode: ${this.angleMode}`);

    // If expression is present and user changed mode, recalculate live preview
    this.updateDisplay();
  }

  updateAngleModeUI() {
    if (this.dom.angleModeBtn) {
      this.dom.angleModeBtn.setAttribute('data-mode', this.angleMode);
      const radSpan = this.dom.angleModeBtn.querySelector('.mode-rad');
      const degSpan = this.dom.angleModeBtn.querySelector('.mode-deg');
      if (radSpan && degSpan) {
        radSpan.classList.toggle('active', this.angleMode === 'RAD');
        degSpan.classList.toggle('active', this.angleMode === 'DEG');
      }
    }
    if (this.dom.angleModeBadge) {
      this.dom.angleModeBadge.textContent = this.angleMode;
    }
  }

  updateSoundUI() {
    if (this.dom.soundToggleBtn) {
      this.dom.soundToggleBtn.classList.toggle('active', this.feedback.soundEnabled);
      this.dom.soundToggleBtn.title = this.feedback.soundEnabled ? 'Mute Sound & Haptics' : 'Enable Sound & Haptics';
    }
    if (this.dom.soundIcon) {
      if (this.feedback.soundEnabled) {
        // Speaker with waves
        this.dom.soundIcon.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        `;
      } else {
        // Speaker muted with slash
        this.dom.soundIcon.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        `;
      }
    }
  }

  toggleShift() {
    this.isShiftActive = !this.isShiftActive;
    if (this.dom.shiftBtn) {
      this.dom.shiftBtn.classList.toggle('active', this.isShiftActive);
    }

    // Toggle shift button labels on keypad
    if (typeof document !== 'undefined' && document.querySelectorAll) {
      const shiftButtons = document.querySelectorAll('button[data-shift-label]');
      for (const btn of shiftButtons) {
        const normalLabel = btn.dataset.normalLabel;
        const shiftLabel = btn.dataset.shiftLabel;
        btn.innerHTML = this.isShiftActive ? shiftLabel : normalLabel;
      }
    }
  }

  // Memory functions
  memoryAdd() {
    try {
      const val = this.getCurrentValue();
      this.memory += val;
      this.updateMemoryUI();
      this.showToast(`M+ (${this.engine.formatResult(this.memory)})`);
    } catch (e) {}
  }

  memorySub() {
    try {
      const val = this.getCurrentValue();
      this.memory -= val;
      this.updateMemoryUI();
      this.showToast(`M- (${this.engine.formatResult(this.memory)})`);
    } catch (e) {}
  }

  memoryRecall() {
    if (this.isEvaluated) {
      this.expression = this.memory.toString();
      this.isEvaluated = false;
    } else {
      this.expression += this.memory.toString();
    }
    this.updateDisplay();
    this.showToast('MR: Memory recalled');
  }

  memoryClear() {
    this.memory = 0;
    this.updateMemoryUI();
    this.showToast('MC: Memory cleared');
  }

  updateMemoryUI() {
    if (this.dom.memoryBadge) {
      this.dom.memoryBadge.classList.toggle('visible', this.memory !== 0);
    }
  }

  getCurrentValue() {
    if (this.lastResult !== null && this.isEvaluated) {
      return parseFloat(this.lastResult);
    }
    if (this.expression) {
      return this.engine.calculate(this.expression, this.angleMode);
    }
    return 0;
  }

  // History Panel UI
  initHistory() {
    this.renderHistoryList();
    this.history.subscribe(() => {
      this.renderHistoryList();
    });
  }

  renderHistoryList() {
    if (!this.dom.historyList) return;
    const items = this.history.getAll();

    if (items.length === 0) {
      this.dom.historyList.innerHTML = `
        <div class="history-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>No calculations yet</p>
          <span>Calculations you perform will appear here</span>
        </div>
      `;
      return;
    }

    let html = '';
    for (const item of items) {
      html += `
        <div class="history-item" data-id="${item.id}">
          <div class="history-item-header">
            <span class="history-mode-tag">${item.mode || 'DEG'}</span>
            <span class="history-time">${this.history.formatDate(item.timestamp)}</span>
            <button class="history-delete-item-btn" title="Delete calculation" data-delete-id="${item.id}">
              &times;
            </button>
          </div>
          <div class="history-item-expr" title="Click to use expression" data-expr="${item.expression}">
            ${item.expression}
          </div>
          <div class="history-item-res" title="Click to insert result" data-res="${item.result}">
            = ${item.result}
          </div>
        </div>
      `;
    }
    this.dom.historyList.innerHTML = html;

    // Delegate clicks inside history
    this.dom.historyList.querySelectorAll('.history-item').forEach(el => {
      const deleteBtn = el.querySelector('[data-delete-id]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = deleteBtn.dataset.deleteId;
          this.history.remove(id);
        });
      }

      const exprEl = el.querySelector('.history-item-expr');
      if (exprEl) {
        exprEl.addEventListener('click', () => {
          this.expression = exprEl.dataset.expr;
          this.isEvaluated = false;
          this.updateDisplay();
          this.showToast('Expression loaded');
          if (window.innerWidth <= 768) {
            this.closeHistoryPanel();
          }
        });
      }

      const resEl = el.querySelector('.history-item-res');
      if (resEl) {
        resEl.addEventListener('click', () => {
          const val = resEl.dataset.res;
          if (this.isEvaluated) {
            this.expression = val;
            this.isEvaluated = false;
          } else {
            this.expression += val;
          }
          this.updateDisplay();
          this.showToast('Result inserted');
          if (window.innerWidth <= 768) {
            this.closeHistoryPanel();
          }
        });
      }
    });
  }

  toggleHistoryPanel() {
    if (!this.dom.historyPanel) return;
    this.dom.historyPanel.classList.toggle('open');
    if (this.dom.historyToggleBtn) {
      this.dom.historyToggleBtn.classList.toggle('active', this.dom.historyPanel.classList.contains('open'));
    }
  }

  closeHistoryPanel() {
    if (!this.dom.historyPanel) return;
    this.dom.historyPanel.classList.remove('open');
    if (this.dom.historyToggleBtn) {
      this.dom.historyToggleBtn.classList.remove('active');
    }
  }

  // Theme Management
  initTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('calc_theme');
    } catch (e) {}

    // Fall back to system preference if no user preference was saved
    if (!savedTheme) {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        savedTheme = 'light';
      } else {
        savedTheme = 'dark';
      }
    }

    this.applyTheme(savedTheme, false);

    // Auto-update if system preference changes and user has not set an explicit override
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        try {
          if (!localStorage.getItem('calc_theme')) {
            this.applyTheme(e.matches ? 'light' : 'dark', true);
          }
        } catch (err) {}
      });
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme, true);
    try {
      localStorage.setItem('calc_theme', nextTheme);
    } catch (e) {}
    this.showToast(`${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} mode active`);
  }

  applyTheme(theme, animate = true) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;

    // Trigger icon spin animation
    if (animate && this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.classList.add('theme-switching');
      setTimeout(() => {
        if (this.dom.themeToggleBtn) {
          this.dom.themeToggleBtn.classList.remove('theme-switching');
        }
      }, 400);
    }

    if (this.dom.themeToggleBtn) {
      const isDark = theme === 'dark';
      this.dom.themeToggleBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      this.dom.themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }

    if (this.dom.themeIcon) {
      if (theme === 'light') {
        // Moon icon for switching to dark mode
        this.dom.themeIcon.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
      } else {
        // Sun icon with rays for switching to light mode
        this.dom.themeIcon.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
      }
    }
  }

  copyDisplayToClipboard() {
    const text = this.expression || '0';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied to clipboard: ' + text);
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.showToast('Copied to clipboard: ' + text);
    } catch (err) {}
    document.body.removeChild(textArea);
  }

  showToast(message) {
    if (!this.dom.toast) return;
    this.dom.toast.textContent = message;
    this.dom.toast.classList.add('visible');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.dom.toast) {
        this.dom.toast.classList.remove('visible');
      }
    }, 2200);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScientificCalculator;
} else if (typeof window !== 'undefined') {
  window.ScientificCalculator = ScientificCalculator;
}
