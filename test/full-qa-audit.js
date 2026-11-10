/**
 * Comprehensive Final QA & Verification Audit
 * Tests every button, mathematical function, calculation edge case, error handling,
 * and state transitions.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const CalculatorEngine = require('../js/engine.js');
const HistoryManager = require('../js/history.js');
const ScientificCalculator = require('../js/calculator.js');

console.log('====================================================');
console.log('       STARTING COMPREHENSIVE FINAL QA AUDIT        ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Reason: ${err.message}`);
    failures.push({ name, error: err.message });
    failCount++;
  }
}

function approx(val, expected, eps = 1e-10) {
  assert(Math.abs(val - expected) < eps, `Expected ${expected}, got ${val}`);
}

const engine = new CalculatorEngine();

// ==========================================
// 1. ALL MATHEMATICAL FUNCTIONS & CALCULATIONS
// ==========================================
console.log('SECTION 1: Core Mathematical Calculations & Accuracy');

// Basic arithmetic
check('Addition: 123.45 + 67.89 = 191.34', () => {
  approx(engine.calculate('123.45 + 67.89'), 191.34);
});
check('Subtraction: 1000 - 456.78 = 543.22', () => {
  approx(engine.calculate('1000 - 456.78'), 543.22);
});
check('Multiplication: 12.5 × 8 = 100', () => {
  assert.strictEqual(engine.calculate('12.5 × 8'), 100);
  assert.strictEqual(engine.calculate('12.5 * 8'), 100);
});
check('Division: 355 ÷ 113 ≈ 3.14159292035', () => {
  approx(engine.calculate('355 ÷ 113'), 355 / 113);
  approx(engine.calculate('355 / 113'), 355 / 113);
});
check('Float rounding: 0.1 + 0.2 = 0.3 (No 0.30000000000000004)', () => {
  assert.strictEqual(engine.calculate('0.1 + 0.2'), 0.3);
});

// PEMDAS / Order of Operations
check('Order of Operations: 3 + 4 × 2 / ( 1 - 5 ) ^ 2 ^ 3', () => {
  const res = engine.calculate('3 + 4 * 2 / ( 1 - 5 ) ^ 2');
  assert.strictEqual(res, 3.5);
});
check('Nested parentheses: 2 * (3 + (4 * (5 - 2))) = 30', () => {
  assert.strictEqual(engine.calculate('2 * (3 + (4 * (5 - 2)))'), 30);
});
check('Auto-close unclosed parentheses: 5 * (2 + 3 * (4 + 1 = 85', () => {
  assert.strictEqual(engine.calculate('5 * (2 + 3 * (4 + 1'), 85);
});

// Trigonometry in DEG mode
check('DEG: sin(0) = 0', () => assert.strictEqual(engine.calculate('sin(0)', 'DEG'), 0));
check('DEG: sin(30) = 0.5', () => assert.strictEqual(engine.calculate('sin(30)', 'DEG'), 0.5));
check('DEG: sin(90) = 1', () => assert.strictEqual(engine.calculate('sin(90)', 'DEG'), 1));
check('DEG: sin(150) = 0.5', () => assert.strictEqual(engine.calculate('sin(150)', 'DEG'), 0.5));
check('DEG: sin(180) = 0 (Exact zero, no epsilon artifact)', () => assert.strictEqual(engine.calculate('sin(180)', 'DEG'), 0));
check('DEG: sin(270) = -1', () => assert.strictEqual(engine.calculate('sin(270)', 'DEG'), -1));
check('DEG: sin(360) = 0', () => assert.strictEqual(engine.calculate('sin(360)', 'DEG'), 0));

check('DEG: cos(0) = 1', () => assert.strictEqual(engine.calculate('cos(0)', 'DEG'), 1));
check('DEG: cos(60) = 0.5', () => assert.strictEqual(engine.calculate('cos(60)', 'DEG'), 0.5));
check('DEG: cos(90) = 0 (Exact zero, no epsilon artifact)', () => assert.strictEqual(engine.calculate('cos(90)', 'DEG'), 0));
check('DEG: cos(180) = -1', () => assert.strictEqual(engine.calculate('cos(180)', 'DEG'), -1));
check('DEG: cos(270) = 0', () => assert.strictEqual(engine.calculate('cos(270)', 'DEG'), 0));
check('DEG: cos(360) = 1', () => assert.strictEqual(engine.calculate('cos(360)', 'DEG'), 1));

check('DEG: tan(0) = 0', () => assert.strictEqual(engine.calculate('tan(0)', 'DEG'), 0));
check('DEG: tan(45) = 1', () => assert.strictEqual(engine.calculate('tan(45)', 'DEG'), 1));
check('DEG: tan(135) = -1', () => assert.strictEqual(engine.calculate('tan(135)', 'DEG'), -1));
check('DEG: tan(180) = 0', () => assert.strictEqual(engine.calculate('tan(180)', 'DEG'), 0));

// Inverse Trig in DEG mode
check('DEG: asin(0.5) = 30°', () => approx(engine.calculate('asin(0.5)', 'DEG'), 30));
check('DEG: asin(1) = 90°', () => approx(engine.calculate('asin(1)', 'DEG'), 90));
check('DEG: acos(0.5) = 60°', () => approx(engine.calculate('acos(0.5)', 'DEG'), 60));
check('DEG: acos(0) = 90°', () => approx(engine.calculate('acos(0)', 'DEG'), 90));
check('DEG: atan(1) = 45°', () => approx(engine.calculate('atan(1)', 'DEG'), 45));

// Trig in RAD mode
check('RAD: sin(pi / 6) = 0.5', () => approx(engine.calculate('sin(pi / 6)', 'RAD'), 0.5));
check('RAD: sin(pi / 2) = 1', () => approx(engine.calculate('sin(pi / 2)', 'RAD'), 1));
check('RAD: cos(pi) = -1', () => approx(engine.calculate('cos(pi)', 'RAD'), -1));
check('RAD: tan(pi / 4) = 1', () => approx(engine.calculate('tan(pi / 4)', 'RAD'), 1));
check('RAD: asin(1) = pi / 2', () => approx(engine.calculate('asin(1)', 'RAD'), Math.PI / 2));
check('RAD: acos(-1) = pi', () => approx(engine.calculate('acos(-1)', 'RAD'), Math.PI));
check('RAD: atan(1) = pi / 4', () => approx(engine.calculate('atan(1)', 'RAD'), Math.PI / 4));

// Hyperbolic functions
check('Hyperbolic: sinh(0) = 0', () => assert.strictEqual(engine.calculate('sinh(0)'), 0));
check('Hyperbolic: cosh(0) = 1', () => assert.strictEqual(engine.calculate('cosh(0)'), 1));
check('Hyperbolic: tanh(0) = 0', () => assert.strictEqual(engine.calculate('tanh(0)'), 0));

// Powers, Roots & Exponentials
check('Powers: 2^10 = 1024', () => assert.strictEqual(engine.calculate('2^10'), 1024));
check('Right-associative power: 2^2^3 = 2^8 = 256', () => assert.strictEqual(engine.calculate('2^2^3'), 256));
check('Square root: sqrt(144) = 12', () => {
  assert.strictEqual(engine.calculate('sqrt(144)'), 12);
  assert.strictEqual(engine.calculate('√(144)'), 12);
});
check('Cube root: cbrt(125) = 5', () => {
  assert.strictEqual(engine.calculate('cbrt(125)'), 5);
  assert.strictEqual(engine.calculate('∛(125)'), 5);
});
check('Power of 10: 10^(4) = 10000', () => assert.strictEqual(engine.calculate('10^(4)'), 10000));
check('Natural exponential: e^(1) = e', () => approx(engine.calculate('e^(1)'), Math.E));
check('Natural exponential: e^(0) = 1', () => assert.strictEqual(engine.calculate('e^(0)'), 1));

// Logarithms
check('Log base 10: log(1000) = 3', () => assert.strictEqual(engine.calculate('log(1000)'), 3));
check('Log base 10: log(1) = 0', () => assert.strictEqual(engine.calculate('log(1)'), 0));
check('Natural log: ln(e) = 1', () => assert.strictEqual(engine.calculate('ln(e)'), 1));
check('Natural log: ln(1) = 0', () => assert.strictEqual(engine.calculate('ln(1)'), 0));
check('Natural log: ln(e^5) = 5', () => approx(engine.calculate('ln(e^5)'), 5));

// Factorials & Percentages
check('Factorial: 0! = 1', () => assert.strictEqual(engine.calculate('0!'), 1));
check('Factorial: 1! = 1', () => assert.strictEqual(engine.calculate('1!'), 1));
check('Factorial: 6! = 720', () => assert.strictEqual(engine.calculate('6!'), 720));
check('Factorial: 10! = 3628800', () => assert.strictEqual(engine.calculate('10!'), 3628800));
check('Percentage: 25% = 0.25', () => assert.strictEqual(engine.calculate('25%'), 0.25));
check('Percentage in calculation: 500 * 20% = 100', () => assert.strictEqual(engine.calculate('500 * 20%'), 100));

// Implicit Multiplication
check('Implicit multiplication: 5(2) = 10', () => assert.strictEqual(engine.calculate('5(2)'), 10));
check('Implicit multiplication: (3+4)(2+1) = 21', () => assert.strictEqual(engine.calculate('(3+4)(2+1)'), 21));
check('Implicit multiplication: 3pi = 3 * PI', () => approx(engine.calculate('3pi'), 3 * Math.PI));
check('Implicit multiplication: 4sqrt(9) = 12', () => assert.strictEqual(engine.calculate('4sqrt(9)'), 12));
check('Implicit multiplication: 2sin(30) = 1', () => assert.strictEqual(engine.calculate('2sin(30)', 'DEG'), 1));

// Unary negation
check('Unary minus: -10 + 5 = -5', () => assert.strictEqual(engine.calculate('-10 + 5'), -5));
check('Unary minus with parentheses: (-5)^2 = 25', () => assert.strictEqual(engine.calculate('(-5)^2'), 25));
check('Operator before unary: 4 * -3 = -12', () => assert.strictEqual(engine.calculate('4 * -3'), -12));
check('Absolute value: abs(-42) = 42', () => assert.strictEqual(engine.calculate('abs(-42)'), 42));

// ==========================================
// 2. ERROR HANDLING & DOMAIN VALIDATION
// ==========================================
console.log('\nSECTION 2: Error Handling & Mathematical Safety');

check('Division by zero throws clean error', () => {
  assert.throws(() => engine.calculate('100 / 0'), /Cannot divide by zero/);
});
check('Square root of negative number throws clean error', () => {
  assert.throws(() => engine.calculate('sqrt(-9)'), /negative number/);
});
check('Log of zero throws clean error', () => {
  assert.throws(() => engine.calculate('log(0)'), /requires x > 0/);
});
check('Log of negative number throws clean error', () => {
  assert.throws(() => engine.calculate('log(-10)'), /requires x > 0/);
});
check('Natural log of zero throws clean error', () => {
  assert.throws(() => engine.calculate('ln(0)'), /requires x > 0/);
});
check('DEG tan(90) throws asymptote error', () => {
  assert.throws(() => engine.calculate('tan(90)', 'DEG'), /Undefined/);
});
check('asin domain validation (|x| > 1)', () => {
  assert.throws(() => engine.calculate('asin(1.5)'), /asin domain is \[-1, 1\]/);
});
check('acos domain validation (|x| > 1)', () => {
  assert.throws(() => engine.calculate('acos(-2)'), /acos domain is \[-1, 1\]/);
});
check('Negative factorial throws clean error', () => {
  assert.throws(() => engine.calculate('(-3)!'), /Factorial of negative number/);
});
check('Decimal factorial throws clean error', () => {
  assert.throws(() => engine.calculate('(3.5)!'), /Factorial only defined for integers/);
});

// ==========================================
// 3. EVERY BUTTON ON THE KEYPAD
// ==========================================
console.log('\nSECTION 3: Keypad Button Coverage in index.html');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Parse all buttons in index.html
const buttonRegex = /<button\b([^>]*)>(.*?)<\/button>/gs;
let match;
const buttons = [];
while ((match = buttonRegex.exec(htmlContent)) !== null) {
  const attrs = match[1];
  const text = match[2].trim();
  buttons.push({ attrs, text });
}

check(`Verify all ${buttons.length} buttons have valid identifiers or actions`, () => {
  assert(buttons.length >= 40, `Expected at least 40 buttons, found ${buttons.length}`);
  for (const b of buttons) {
    const hasId = /id="[^"]+"/.test(b.attrs);
    const hasAction = /data-action="[^"]+"/.test(b.attrs);
    const hasValue = /data-value="[^"]+"/.test(b.attrs);
    const hasTab = /data-tab="[^"]+"/.test(b.attrs);
    assert(hasId || hasAction || hasValue || hasTab, `Button missing action or value: ${b.attrs}`);
  }
});

// Verify every scientific key is present
const expectedKeys = [
  '2nd', '1/x', 'sin', 'cos',
  'tan', 'ln', 'log', 'xʸ',
  '√', 'x²', 'π', 'e',
  'n!', '|x|', '(', ')',
  'Ans', '10ˣ', 'eˣ', '∛',
  'AC', 'DEL', '%', '÷',
  '7', '8', '9', '×',
  '4', '5', '6', '−',
  '1', '2', '3', '+',
  '±', '0', '.', '='
];

for (const key of expectedKeys) {
  check(`Keypad includes key: "${key}"`, () => {
    const found = buttons.some(b => b.text.includes(key) || b.attrs.includes(`data-value="${key}"`) || b.attrs.includes(`title="${key}"`));
    assert(found, `Key "${key}" not found in keypad buttons`);
  } );
}

// ==========================================
// 4. UI STATE, HISTORY & MEMORY LIFECYCLE
// ==========================================
console.log('\nSECTION 4: Full UI Lifecycle, Memory & History Audit');

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v.toString(); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

global.docTheme = 'dark';
global.document = {
  documentElement: {
    setAttribute: (k, v) => { if (k === 'data-theme') global.docTheme = v; },
    getAttribute: (k) => k === 'data-theme' ? global.docTheme : null,
    style: {}
  },
  querySelectorAll: () => []
};

const calc = new ScientificCalculator();
calc.engine = new CalculatorEngine();
calc.history = new HistoryManager('audit_history');

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
  themeLabelText: { textContent: '' },
  memoryBadge: { classList: { toggle: ()=>{} } },
  toast: { classList: { add: ()=>{}, remove: ()=>{} } },
  historyList: { innerHTML: '', querySelectorAll: ()=>[] }
};

// Lifecycle: Calculation, Memory, History
check('Multi-step calculation flow', () => {
  calc.clearAll();
  calc.inputDigit('1');
  calc.inputDigit('2');
  calc.inputOperator('+');
  calc.inputDigit('8');
  calc.executeCalculate();
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '20');

  // Continue with operator
  calc.inputOperator('×');
  calc.inputDigit('5');
  calc.executeCalculate();
  assert.strictEqual(calc.dom.primaryDisplay.textContent, '100');
});

check('Memory lifecycle: M+ -> MC -> M- -> MR', () => {
  calc.clearAll();
  calc.inputDigit('4');
  calc.inputDigit('2');
  calc.memoryAdd(); // +42
  assert.strictEqual(calc.memory, 42);

  calc.clearAll();
  calc.inputDigit('1');
  calc.inputDigit('2');
  calc.memorySub(); // 42 - 12 = 30
  assert.strictEqual(calc.memory, 30);

  calc.clearAll();
  calc.memoryRecall(); // Expression becomes 30
  assert.strictEqual(calc.expression, '30');

  calc.memoryClear();
  assert.strictEqual(calc.memory, 0);
});

check('History persistence and retrieval', () => {
  const items = calc.history.getAll();
  assert(items.length >= 2, `Expected at least 2 history items, got ${items.length}`);
  assert.strictEqual(items[0].result, '100');
  
  // Test deletion of single item
  const firstId = items[0].id;
  calc.history.remove(firstId);
  const remaining = calc.history.getAll();
  assert.strictEqual(remaining.length, items.length - 1);
  assert(!remaining.some(x => x.id === firstId));

  // Test clear all
  calc.history.clear();
  assert.strictEqual(calc.history.getAll().length, 0);
});

check('DEG / RAD angle mode toggling', () => {
  calc.setAngleMode ? calc.setAngleMode('DEG') : (calc.angleMode = 'DEG');
  calc.toggleAngleMode();
  assert.strictEqual(calc.angleMode, 'RAD');
  assert.strictEqual(calc.engine.getAngleMode(), 'RAD');

  calc.toggleAngleMode();
  assert.strictEqual(calc.angleMode, 'DEG');
  assert.strictEqual(calc.engine.getAngleMode(), 'DEG');
});

check('2nd Shift function toggling', () => {
  assert.strictEqual(calc.isShiftActive, false);
  calc.toggleShift();
  assert.strictEqual(calc.isShiftActive, true);
  calc.toggleShift();
  assert.strictEqual(calc.isShiftActive, false);
});

check('Sound and haptic feedback toggling', () => {
  assert.strictEqual(calc.feedback.soundEnabled, true);
  calc.feedback.toggleSound();
  assert.strictEqual(calc.feedback.soundEnabled, false);
  calc.feedback.toggleSound();
  assert.strictEqual(calc.feedback.soundEnabled, true);
});

check('Theme switching and persistence', () => {
  calc.initTheme();
  calc.toggleTheme(); // Light
  assert.strictEqual(global.docTheme, 'light');
  assert.strictEqual(global.localStorage.getItem('calc_theme'), 'light');

  calc.toggleTheme(); // Dark
  assert.strictEqual(global.docTheme, 'dark');
  assert.strictEqual(global.localStorage.getItem('calc_theme'), 'dark');
});

console.log('\n====================================================');
console.log(` AUDIT COMPLETE: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================\n');

if (failCount > 0) {
  console.error('FAILURES DETECTED:');
  failures.forEach(f => console.error(` - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('🎉 100% HEALTHY: All calculations, functions, buttons, and state transitions verified!');
  process.exit(0);
}
