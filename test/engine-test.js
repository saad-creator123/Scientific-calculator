const CalculatorEngine = require('../js/engine.js');
const assert = require('assert');

const engine = new CalculatorEngine();
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

function approxEqual(a, b, eps = 1e-9) {
  assert(Math.abs(a - b) < eps, `Expected ${b}, got ${a}`);
}

console.log('--- RUNNING CALCULATOR ENGINE TESTS ---');

// 1. Basic Arithmetic
test('Basic addition: 2 + 3 = 5', () => {
  assert.strictEqual(engine.calculate('2 + 3'), 5);
});

test('Basic subtraction: 10 - 4 = 6', () => {
  assert.strictEqual(engine.calculate('10 - 4'), 6);
});

test('Basic multiplication: 6 * 7 = 42', () => {
  assert.strictEqual(engine.calculate('6 * 7'), 42);
  assert.strictEqual(engine.calculate('6 × 7'), 42);
});

test('Basic division: 20 / 4 = 5', () => {
  assert.strictEqual(engine.calculate('20 / 4'), 5);
  assert.strictEqual(engine.calculate('20 ÷ 4'), 5);
});

test('Order of operations: 2 + 3 * 4 = 14', () => {
  assert.strictEqual(engine.calculate('2 + 3 * 4'), 14);
});

test('Parentheses override: (2 + 3) * 4 = 20', () => {
  assert.strictEqual(engine.calculate('(2 + 3) * 4'), 20);
});

test('Nested parentheses: ((2 + 3) * (4 - 1)) / 5 = 3', () => {
  assert.strictEqual(engine.calculate('((2 + 3) * (4 - 1)) / 5'), 3);
});

test('Auto-closing parentheses: (2 + 3 * (4 + 1 = 17', () => {
  assert.strictEqual(engine.calculate('(2 + 3 * (4 + 1'), 17);
});

// 2. Precision & Floating Point
test('Float precision: 0.1 + 0.2 = 0.3', () => {
  assert.strictEqual(engine.calculate('0.1 + 0.2'), 0.3);
});

// 3. Trigonometry in DEG mode
test('DEG: sin(30) = 0.5', () => {
  assert.strictEqual(engine.calculate('sin(30)', 'DEG'), 0.5);
});

test('DEG: sin(90) = 1', () => {
  assert.strictEqual(engine.calculate('sin(90)', 'DEG'), 1);
});

test('DEG: sin(180) = 0', () => {
  assert.strictEqual(engine.calculate('sin(180)', 'DEG'), 0);
});

test('DEG: cos(0) = 1', () => {
  assert.strictEqual(engine.calculate('cos(0)', 'DEG'), 1);
});

test('DEG: cos(60) = 0.5', () => {
  assert.strictEqual(engine.calculate('cos(60)', 'DEG'), 0.5);
});

test('DEG: cos(90) = 0', () => {
  assert.strictEqual(engine.calculate('cos(90)', 'DEG'), 0);
});

test('DEG: cos(180) = -1', () => {
  assert.strictEqual(engine.calculate('cos(180)', 'DEG'), -1);
});

test('DEG: tan(45) = 1', () => {
  assert.strictEqual(engine.calculate('tan(45)', 'DEG'), 1);
});

test('DEG: tan(90) throws asymptote error', () => {
  assert.throws(() => engine.calculate('tan(90)', 'DEG'), /Undefined/);
});

// 4. Trigonometry in RAD mode
test('RAD: sin(pi / 2) = 1', () => {
  approxEqual(engine.calculate('sin(pi / 2)', 'RAD'), 1);
});

test('RAD: cos(pi) = -1', () => {
  approxEqual(engine.calculate('cos(pi)', 'RAD'), -1);
});

test('RAD: tan(pi / 4) = 1', () => {
  approxEqual(engine.calculate('tan(pi / 4)', 'RAD'), 1);
});

// 5. Inverse Trig
test('DEG: asin(0.5) = 30', () => {
  approxEqual(engine.calculate('asin(0.5)', 'DEG'), 30);
});

test('DEG: acos(0.5) = 60', () => {
  approxEqual(engine.calculate('acos(0.5)', 'DEG'), 60);
});

test('DEG: atan(1) = 45', () => {
  approxEqual(engine.calculate('atan(1)', 'DEG'), 45);
});

// 6. Square Roots & Powers
test('Square root: sqrt(16) = 4', () => {
  assert.strictEqual(engine.calculate('sqrt(16)'), 4);
  assert.strictEqual(engine.calculate('√(16)'), 4);
});

test('Powers: 2^3 = 8', () => {
  assert.strictEqual(engine.calculate('2^3'), 8);
});

test('Right-associative power: 2^3^2 = 512', () => {
  assert.strictEqual(engine.calculate('2^3^2'), 512);
});

test('Square root inside power: sqrt(16)^2 = 16', () => {
  assert.strictEqual(engine.calculate('sqrt(16)^2'), 16);
});

// 7. Logarithms & Exponentials
test('Log base 10: log(100) = 2', () => {
  assert.strictEqual(engine.calculate('log(100)'), 2);
});

test('10^x power: 10^(3) = 1000', () => {
  assert.strictEqual(engine.calculate('10^(3)'), 1000);
});

test('Natural log: ln(e) = 1', () => {
  assert.strictEqual(engine.calculate('ln(e)'), 1);
});

test('Exponential function: e^(2)', () => {
  approxEqual(engine.calculate('e^(2)'), Math.E * Math.E);
});

test('Cube root: ∛(27) = 3', () => {
  assert.strictEqual(engine.calculate('∛(27)'), 3);
});

test('Absolute value: abs(-25) = 25', () => {
  assert.strictEqual(engine.calculate('abs(-25)'), 25);
});

// 8. Implicit multiplication
test('Implicit multiplication: 2(3) = 6', () => {
  assert.strictEqual(engine.calculate('2(3)'), 6);
});

test('Implicit multiplication: (2+3)(4) = 20', () => {
  assert.strictEqual(engine.calculate('(2+3)(4)'), 20);
});

test('Implicit multiplication: 2pi = 2 * PI', () => {
  approxEqual(engine.calculate('2pi'), 2 * Math.PI);
});

test('Implicit multiplication: 3sin(30) = 1.5', () => {
  assert.strictEqual(engine.calculate('3sin(30)', 'DEG'), 1.5);
});

// 9. Factorials & Percentage
test('Factorial: 5! = 120', () => {
  assert.strictEqual(engine.calculate('5!'), 120);
});

test('Factorial: 0! = 1', () => {
  assert.strictEqual(engine.calculate('0!'), 1);
});

test('Factorial in expression: 3! + 4 = 10', () => {
  assert.strictEqual(engine.calculate('3! + 4'), 10);
});

test('Percentage: 50% = 0.5', () => {
  assert.strictEqual(engine.calculate('50%'), 0.5);
});

test('Percentage in multiplication: 200 * 15% = 30', () => {
  assert.strictEqual(engine.calculate('200 * 15%'), 30);
});

// 10. Negation & Edge Cases
test('Unary minus: -5 + 3 = -2', () => {
  assert.strictEqual(engine.calculate('-5 + 3'), -2);
});

test('Negative in parentheses: (-4)^2 = 16', () => {
  assert.strictEqual(engine.calculate('(-4)^2'), 16);
});

test('Division by zero throws error', () => {
  assert.throws(() => engine.calculate('5 / 0'), /Cannot divide by zero/);
});

test('Negative sqrt throws error', () => {
  assert.throws(() => engine.calculate('sqrt(-4)'), /negative number/);
});

test('Negative log throws error', () => {
  assert.throws(() => engine.calculate('log(-5)'), /log\(x\) requires x > 0/);
});

console.log(`\nTEST SUMMARY: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
