/**
 * Robust Scientific Calculator Engine
 * Handles tokenization, parsing, and evaluation of mathematical expressions.
 * Supports DEG/RAD modes, implicit multiplication, unary negation, postfix operators,
 * floating-point cleanup, and comprehensive error handling.
 */

class CalculatorEngine {
  constructor() {
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
  }

  setAngleMode(mode) {
    if (mode === 'DEG' || mode === 'RAD') {
      this.angleMode = mode;
    }
  }

  getAngleMode() {
    return this.angleMode;
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    return this.angleMode;
  }

  /**
   * Cleans floating point inaccuracies such as 0.30000000000000004 or 1.22e-16
   */
  cleanFloat(num, precision = 12) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      return num;
    }
    if (Math.abs(num) < 1e-13) {
      return 0;
    }
    // Convert to fixed precision and parse back to strip trailing zeros
    const rounded = parseFloat(num.toPrecision(precision));
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  /**
   * Factorial helper
   */
  factorial(n) {
    if (n < 0) throw new Error("Factorial of negative number is undefined");
    if (!Number.isInteger(n)) throw new Error("Factorial only defined for integers");
    if (n > 170) throw new Error("Overflow: factorial too large");
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  /**
   * Accurate Degree Trigonometry
   */
  trigSin(val, isDeg) {
    if (!isDeg) {
      const s = Math.sin(val);
      return Math.abs(s) < 1e-14 ? 0 : this.cleanFloat(s);
    }
    let d = val % 360;
    if (d < 0) d += 360;
    if (d === 0 || d === 180 || d === 360) return 0;
    if (d === 90) return 1;
    if (d === 270) return -1;
    if (d === 30 || d === 150) return 0.5;
    if (d === 210 || d === 330) return -0.5;
    const rad = (d * Math.PI) / 180;
    return this.cleanFloat(Math.sin(rad));
  }

  trigCos(val, isDeg) {
    if (!isDeg) {
      const c = Math.cos(val);
      return Math.abs(c) < 1e-14 ? 0 : this.cleanFloat(c);
    }
    let d = val % 360;
    if (d < 0) d += 360;
    if (d === 0 || d === 360) return 1;
    if (d === 180) return -1;
    if (d === 90 || d === 270) return 0;
    if (d === 60 || d === 300) return 0.5;
    if (d === 120 || d === 240) return -0.5;
    const rad = (d * Math.PI) / 180;
    return this.cleanFloat(Math.cos(rad));
  }

  trigTan(val, isDeg) {
    if (!isDeg) {
      // Check for asymptote (cos ≈ 0)
      if (Math.abs(Math.cos(val)) < 1e-14) {
        throw new Error("Undefined (tan asymptote)");
      }
      const t = Math.tan(val);
      return Math.abs(t) < 1e-14 ? 0 : this.cleanFloat(t);
    }
    let d = val % 180;
    if (d < 0) d += 180;
    if (d === 90) throw new Error("Undefined (tan of 90°)");
    if (d === 0 || d === 180) return 0;
    if (d === 45) return 1;
    if (d === 135) return -1;
    const rad = (d * Math.PI) / 180;
    return this.cleanFloat(Math.tan(rad));
  }

  trigAsin(val, isDeg) {
    if (val < -1 || val > 1) {
      throw new Error("Invalid Input: asin domain is [-1, 1]");
    }
    const rad = Math.asin(val);
    if (!isDeg) return this.cleanFloat(rad);
    return this.cleanFloat((rad * 180) / Math.PI);
  }

  trigAcos(val, isDeg) {
    if (val < -1 || val > 1) {
      throw new Error("Invalid Input: acos domain is [-1, 1]");
    }
    const rad = Math.acos(val);
    if (!isDeg) return this.cleanFloat(rad);
    return this.cleanFloat((rad * 180) / Math.PI);
  }

  trigAtan(val, isDeg) {
    const rad = Math.atan(val);
    if (!isDeg) return this.cleanFloat(rad);
    return this.cleanFloat((rad * 180) / Math.PI);
  }

  /**
   * Tokenize expression string into array of tokens
   */
  tokenize(rawExpr) {
    if (!rawExpr || typeof rawExpr !== 'string') return [];

    // Normalize characters
    let expr = rawExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt')
      .replace(/∛/g, 'cbrt')
      .replace(/log₁₀/g, 'log')
      .replace(/\s+/g, '');

    const tokens = [];
    let i = 0;
    const len = expr.length;

    const functions = [
      'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
      'sin', 'cos', 'tan', 'sqrt', 'cbrt', 'log', 'ln', 'abs'
    ];

    while (i < len) {
      const ch = expr[i];

      // Check numbers
      if ((ch >= '0' && ch <= '9') || (ch === '.' && i + 1 < len && expr[i + 1] >= '0' && expr[i + 1] <= '9')) {
        let numStr = '';
        let hasDot = false;
        while (i < len && ((expr[i] >= '0' && expr[i] <= '9') || (!hasDot && expr[i] === '.'))) {
          if (expr[i] === '.') hasDot = true;
          numStr += expr[i];
          i++;
        }
        // Scientific notation like 1e5 or 2.5e-3
        if (i < len && (expr[i] === 'e' || expr[i] === 'E') && i + 1 < len &&
            ((expr[i + 1] >= '0' && expr[i + 1] <= '9') || ((expr[i + 1] === '+' || expr[i + 1] === '-') && i + 2 < len && expr[i + 2] >= '0' && expr[i + 2] <= '9'))) {
          numStr += expr[i];
          i++;
          if (expr[i] === '+' || expr[i] === '-') {
            numStr += expr[i];
            i++;
          }
          while (i < len && (expr[i] >= '0' && expr[i] <= '9')) {
            numStr += expr[i];
            i++;
          }
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // Check constants 'pi' or 'e'
      if (expr.startsWith('pi', i)) {
        tokens.push({ type: 'CONSTANT', name: 'pi', value: Math.PI });
        i += 2;
        continue;
      }
      // 'e' can be constant e if not part of function or number
      if (ch === 'e') {
        tokens.push({ type: 'CONSTANT', name: 'e', value: Math.E });
        i++;
        continue;
      }

      // Check functions
      let matchedFunc = null;
      for (const fn of functions) {
        if (expr.startsWith(fn, i)) {
          matchedFunc = fn;
          break;
        }
      }
      if (matchedFunc) {
        tokens.push({ type: 'FUNCTION', name: matchedFunc });
        i += matchedFunc.length;
        continue;
      }

      // Check operators and symbols
      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }
      if (ch === '+') {
        tokens.push({ type: 'OPERATOR', value: '+' });
        i++;
        continue;
      }
      if (ch === '-') {
        // Distinguish unary minus from binary minus
        // Unary if at start, or preceded by LPAREN, or preceded by OPERATOR
        const prev = tokens.length > 0 ? tokens[tokens.length - 1] : null;
        if (!prev || prev.type === 'LPAREN' || prev.type === 'OPERATOR') {
          tokens.push({ type: 'OPERATOR', value: 'NEG' }); // Unary negation
        } else {
          tokens.push({ type: 'OPERATOR', value: '-' });
        }
        i++;
        continue;
      }
      if (ch === '*' || ch === '/' || ch === '^') {
        tokens.push({ type: 'OPERATOR', value: ch });
        i++;
        continue;
      }
      if (ch === '!') {
        tokens.push({ type: 'POSTFIX', value: '!' });
        i++;
        continue;
      }
      if (ch === '%') {
        tokens.push({ type: 'POSTFIX', value: '%' });
        i++;
        continue;
      }

      // Unknown character
      throw new Error(`Unexpected character: "${ch}"`);
    }

    // Apply implicit multiplication rules:
    // e.g., 2(3) -> 2*(3), 2pi -> 2*pi, (2)(3) -> (2)*(3), 3sin(30) -> 3*sin(30), 5! 2 -> 5! * 2
    const expanded = [];
    for (let k = 0; k < tokens.length; k++) {
      const current = tokens[k];
      const prev = k > 0 ? tokens[k - 1] : null;

      if (prev) {
        const prevCanMultiply =
          prev.type === 'NUMBER' ||
          prev.type === 'CONSTANT' ||
          prev.type === 'RPAREN' ||
          prev.type === 'POSTFIX';

        const currNeedsMultiply =
          current.type === 'NUMBER' ||
          current.type === 'CONSTANT' ||
          current.type === 'LPAREN' ||
          current.type === 'FUNCTION';

        if (prevCanMultiply && currNeedsMultiply) {
          // If prev is RPAREN or POSTFIX and curr is NUMBER/CONSTANT/LPAREN/FUNCTION, insert *
          // If prev is NUMBER/CONSTANT and curr is LPAREN/FUNCTION/CONSTANT, insert *
          if (
            !(prev.type === 'NUMBER' && current.type === 'NUMBER') // already handled as single number
          ) {
            expanded.push({ type: 'OPERATOR', value: '*' });
          }
        }
      }
      expanded.push(current);
    }

    return expanded;
  }

  /**
   * Shunting-Yard Algorithm to evaluate tokens with operator precedence
   */
  evaluateTokens(tokens, isDegree = true) {
    if (!tokens || tokens.length === 0) return 0;

    // Auto-close missing parentheses if any
    let openCount = 0;
    for (const t of tokens) {
      if (t.type === 'LPAREN') openCount++;
      if (t.type === 'RPAREN') openCount--;
    }
    if (openCount < 0) {
      throw new Error("Mismatched parentheses: extra closing ')'");
    }
    while (openCount > 0) {
      tokens.push({ type: 'RPAREN', value: ')' });
      openCount--;
    }

    const outputQueue = [];
    const opStack = [];

    const precedence = {
      '+': 2,
      '-': 2,
      '*': 3,
      '/': 3,
      'NEG': 4, // Unary minus
      '^': 5
    };

    const associativity = {
      '+': 'L',
      '-': 'L',
      '*': 'L',
      '/': 'L',
      'NEG': 'R',
      '^': 'R'
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'NUMBER' || token.type === 'CONSTANT') {
        outputQueue.push(token);
      } else if (token.type === 'FUNCTION') {
        opStack.push(token);
      } else if (token.type === 'POSTFIX') {
        // Postfix operators (! and %) have immediate high precedence on the top value
        outputQueue.push(token);
      } else if (token.type === 'OPERATOR') {
        const o1 = token.value;
        while (opStack.length > 0) {
          const top = opStack[opStack.length - 1];
          if (top.type === 'OPERATOR') {
            const o2 = top.value;
            const p1 = precedence[o1];
            const p2 = precedence[o2];
            const assoc = associativity[o1];

            if ((assoc === 'L' && p1 <= p2) || (assoc === 'R' && p1 < p2)) {
              outputQueue.push(opStack.pop());
            } else {
              break;
            }
          } else if (top.type === 'FUNCTION') {
            outputQueue.push(opStack.pop());
          } else {
            break;
          }
        }
        opStack.push(token);
      } else if (token.type === 'LPAREN') {
        opStack.push(token);
      } else if (token.type === 'RPAREN') {
        let foundLparen = false;
        while (opStack.length > 0) {
          const top = opStack.pop();
          if (top.type === 'LPAREN') {
            foundLparen = true;
            break;
          } else {
            outputQueue.push(top);
          }
        }
        if (!foundLparen) {
          throw new Error("Mismatched parentheses");
        }
        // If top of stack now is a function, pop it to outputQueue
        if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNCTION') {
          outputQueue.push(opStack.pop());
        }
      }
    }

    while (opStack.length > 0) {
      const top = opStack.pop();
      if (top.type === 'LPAREN' || top.type === 'RPAREN') {
        throw new Error("Mismatched parentheses");
      }
      outputQueue.push(top);
    }

    // Now evaluate RPN queue
    const evalStack = [];

    for (const token of outputQueue) {
      if (token.type === 'NUMBER' || token.type === 'CONSTANT') {
        evalStack.push(token.value);
      } else if (token.type === 'POSTFIX') {
        if (evalStack.length < 1) throw new Error("Invalid syntax: missing operand for " + token.value);
        const val = evalStack.pop();
        if (token.value === '!') {
          evalStack.push(this.factorial(val));
        } else if (token.value === '%') {
          evalStack.push(val / 100);
        }
      } else if (token.type === 'OPERATOR') {
        if (token.value === 'NEG') {
          if (evalStack.length < 1) throw new Error("Invalid syntax: missing operand for negation");
          const a = evalStack.pop();
          evalStack.push(-a);
        } else {
          if (evalStack.length < 2) throw new Error("Invalid syntax: missing operand for operator " + token.value);
          const b = evalStack.pop();
          const a = evalStack.pop();
          let res;
          switch (token.value) {
            case '+':
              res = a + b;
              break;
            case '-':
              res = a - b;
              break;
            case '*':
              res = a * b;
              break;
            case '/':
              if (b === 0) throw new Error("Cannot divide by zero");
              res = a / b;
              break;
            case '^':
              if (a < 0 && !Number.isInteger(b)) {
                throw new Error("Invalid Input: negative base with fractional exponent");
              }
              res = Math.pow(a, b);
              break;
            default:
              throw new Error("Unknown operator: " + token.value);
          }
          evalStack.push(res);
        }
      } else if (token.type === 'FUNCTION') {
        if (evalStack.length < 1) throw new Error("Invalid syntax: missing argument for function " + token.name);
        const arg = evalStack.pop();
        let res;
        switch (token.name) {
          case 'sin':
            res = this.trigSin(arg, isDegree);
            break;
          case 'cos':
            res = this.trigCos(arg, isDegree);
            break;
          case 'tan':
            res = this.trigTan(arg, isDegree);
            break;
          case 'asin':
            res = this.trigAsin(arg, isDegree);
            break;
          case 'acos':
            res = this.trigAcos(arg, isDegree);
            break;
          case 'atan':
            res = this.trigAtan(arg, isDegree);
            break;
          case 'sinh':
            res = this.cleanFloat(Math.sinh(arg));
            break;
          case 'cosh':
            res = this.cleanFloat(Math.cosh(arg));
            break;
          case 'tanh':
            res = this.cleanFloat(Math.tanh(arg));
            break;
          case 'sqrt':
            if (arg < 0) throw new Error("Invalid Input: square root of negative number");
            res = this.cleanFloat(Math.sqrt(arg));
            break;
          case 'cbrt':
            res = this.cleanFloat(Math.cbrt(arg));
            break;
          case 'log':
            if (arg <= 0) throw new Error("Invalid Input: log(x) requires x > 0");
            res = this.cleanFloat(Math.log10(arg));
            break;
          case 'ln':
            if (arg <= 0) throw new Error("Invalid Input: ln(x) requires x > 0");
            res = this.cleanFloat(Math.log(arg));
            break;
          case 'abs':
            res = Math.abs(arg);
            break;
          default:
            throw new Error("Unknown function: " + token.name);
        }
        evalStack.push(res);
      }
    }

    if (evalStack.length !== 1) {
      throw new Error("Invalid expression syntax");
    }

    const finalVal = evalStack[0];
    return this.cleanFloat(finalVal);
  }

  /**
   * Main evaluate method
   * @param {string} expr 
   * @param {string} [mode] Optional 'DEG' or 'RAD', defaults to current angleMode
   * @returns {number}
   */
  calculate(expr, mode = this.angleMode) {
    if (!expr || expr.trim() === '') return 0;
    const isDegree = mode === 'DEG';
    const tokens = this.tokenize(expr);
    return this.evaluateTokens(tokens, isDegree);
  }

  /**
   * Format numbers cleanly for display
   */
  formatResult(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'Error';
    if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';
    
    // Clean small precision issues
    const cleaned = this.cleanFloat(num, 12);
    
    // If integer, or within safe integer bounds
    if (Math.abs(cleaned) >= 1e12 || (Math.abs(cleaned) < 1e-6 && cleaned !== 0)) {
      return cleaned.toExponential(6).replace('e+', 'e');
    }
    
    // Format regular float nicely
    const str = cleaned.toString();
    return str;
  }
}

// Export for Node test environment or browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalculatorEngine;
} else if (typeof window !== 'undefined') {
  window.CalculatorEngine = CalculatorEngine;
}
