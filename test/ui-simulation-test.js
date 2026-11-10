/**
 * Headless Simulation Test for Calculator Logic, State & History
 */
const assert = require('assert');
const CalculatorEngine = require('../js/engine.js');
const HistoryManager = require('../js/history.js');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = val.toString(); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

global.docTheme = 'dark';
global.document = {
  documentElement: {
    setAttribute: (k, v) => { if (k === 'data-theme') global.docTheme = v; },
    getAttribute: (k) => k === 'data-theme' ? global.docTheme : null,
    style: {}
  }
};

const ScientificCalculator = require('../js/calculator.js');

console.log('--- RUNNING CALCULATOR UI & LOGIC SIMULATION TESTS ---');

const calc = new ScientificCalculator();
calc.engine = new CalculatorEngine();
calc.history = new HistoryManager('test_history');

// Mock DOM elements needed
calc.dom = {
  primaryDisplay: { textContent: '0', style: {}, classList: { add: ()=>{}, remove: ()=>{} } },
  secondaryDisplay: { textContent: '' },
  evalPreview: { textContent: '' },
  angleModeBtn: { setAttribute: ()=>{}, querySelector: ()=>({ classList: { toggle: ()=>{} } }) },
  angleModeBadge: { textContent: 'DEG' },
  shiftBtn: { classList: { toggle: ()=>{} } },
  soundToggleBtn: { classList: { toggle: ()=>{} }, title: '' },
  soundIcon: { innerHTML: '' },
  themeToggleBtn: { classList: { add: ()=>{}, remove: ()=>{} }, setAttribute: ()=>{}, title: '' },
  themeIcon: { innerHTML: '' },
  memoryBadge: { classList: { toggle: ()=>{} } },
  toast: { classList: { add: ()=>{}, remove: ()=>{} } },
  historyList: { innerHTML: '', querySelectorAll: ()=>[] }
};

let testsPassed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }
}

// 1. Initial State
runTest('Initial state is clean', () => {
  assert.strictEqual(calc.expression, '');
  assert.strictEqual(calc.angleMode, 'DEG');
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '0');
});

// 2. Typing numbers and basic arithmetic
runTest('Input digits and operators: 25 + 75 = 100', () => {
  calc.inputDigit('2');
  calc.inputDigit('5');
  calc.inputOperator('+');
  calc.inputDigit('7');
  calc.inputDigit('5');
  assert.strictEqual(calc.expression, '25 + 75');
  
  calc.executeCalculate();
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '100');
  assert.strictEqual(calc.isEvaluated, true);
  assert.strictEqual(calc.ans, 100);
});

// 3. Continuing from previous answer
runTest('Continue calculation: Ans * 2 = 200', () => {
  calc.inputOperator('×');
  calc.inputDigit('2');
  assert.strictEqual(calc.expression, '100 × 2');
  
  calc.executeCalculate();
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '200');
});

// 4. Clear All
runTest('Clear All (AC)', () => {
  calc.clearAll();
  assert.strictEqual(calc.expression, '');
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '0');
});

// 5. Trigonometric Calculation in DEG
runTest('Trigonometric DEG: sin(30) = 0.5', () => {
  calc.inputFunction('sin(');
  calc.inputDigit('3');
  calc.inputDigit('0');
  calc.inputParenthesis(')');
  assert.strictEqual(calc.expression, 'sin(30)');

  calc.executeCalculate();
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '0.5');
});

// 6. DEG to RAD Toggle and Calculation
runTest('Toggle to RAD: sin(pi / 2) = 1', () => {
  calc.clearAll();
  calc.toggleAngleMode(); // DEG -> RAD
  assert.strictEqual(calc.angleMode, 'RAD');

  calc.inputFunction('sin(');
  calc.inputConstant('π');
  calc.inputOperator('÷');
  calc.inputDigit('2');
  calc.inputParenthesis(')');

  calc.executeCalculate();
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '1');
});

// 7. Delete / Backspace token handling
runTest('Token-aware backspace deletes multi-char functions', () => {
  calc.clearAll();
  calc.inputFunction('cos(');
  assert.strictEqual(calc.expression, 'cos(');
  calc.deleteLast();
  assert.strictEqual(calc.expression, ''); // Entire 'cos(' deleted cleanly

  calc.inputFunction('sqrt(');
  calc.deleteLast();
  assert.strictEqual(calc.expression, '');
});

// 8. Square Root & Powers
runTest('Square root and powers: √(16) + 2^3 = 12', () => {
  calc.clearAll();
  calc.inputFunction('√(');
  calc.inputDigit('1');
  calc.inputDigit('6');
  calc.inputParenthesis(')');
  calc.inputOperator('+');
  calc.inputDigit('2');
  calc.inputOperator('^');
  calc.inputDigit('3');
  
  calc.executeCalculate();
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '12');
});

// 9. History persistence
runTest('History records previous operations', () => {
  const historyItems = calc.history.getAll();
  assert(historyItems.length >= 4, `Expected at least 4 items, got ${historyItems.length}`);
  assert.strictEqual(historyItems[0].result, '12');
});

// 10. Memory Functions (M+, MR, MC)
runTest('Memory operations (M+, MR, MC)', () => {
  calc.clearAll();
  calc.inputDigit('5');
  calc.inputDigit('0');
  calc.memoryAdd(); // M = 50
  assert.strictEqual(calc.memory, 50);

  calc.clearAll();
  calc.memoryRecall(); // Expression becomes 50
  assert.strictEqual(calc.expression, '50');

  calc.memoryClear();
  assert.strictEqual(calc.memory, 0);
});

// 10b. Sound and Haptics Toggle
runTest('Sound and haptics feedback toggle', () => {
  assert.strictEqual(calc.feedback.soundEnabled, true);
  calc.feedback.toggleSound();
  assert.strictEqual(calc.feedback.soundEnabled, false);
  calc.feedback.toggleSound();
  assert.strictEqual(calc.feedback.soundEnabled, true);
});

// 10c. Dynamic Theme Switching & LocalStorage Persistence
runTest('Dynamic theme toggle switches between dark and light and persists', () => {
  calc.initTheme();
  assert.strictEqual(global.docTheme, 'dark');

  calc.toggleTheme(); // switch to light
  assert.strictEqual(global.docTheme, 'light');
  assert.strictEqual(global.localStorage.getItem('calc_theme'), 'light');

  calc.toggleTheme(); // switch back to dark
  assert.strictEqual(global.docTheme, 'dark');
  assert.strictEqual(global.localStorage.getItem('calc_theme'), 'dark');
});

// 11. Division by zero error handling
runTest('Error state: 10 ÷ 0', () => {
  calc.clearAll();
  calc.inputDigit('1');
  calc.inputDigit('0');
  calc.inputOperator('÷');
  calc.inputDigit('0');
  calc.executeCalculate();
  assert(calc.dom.primaryDisplay.textContent.includes('zero') || calc.dom.primaryDisplay.textContent.includes('Error'));
});

console.log(`\nALL ${testsPassed} UI SIMULATION TESTS PASSED!`);
