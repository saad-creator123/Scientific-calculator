# Scientific Calculator

A clean, modern, and responsive scientific calculator web application with audio click feedback, mobile haptics, accurate trigonometry, calculation history, and keyboard shortcuts.

![Scientific Calculator](https://img.shields.io/badge/status-active-brightgreen)
![Tests](https://img.shields.io/badge/tests-48%20passed-success)
![No Dependencies](https://img.shields.io/badge/dependencies-none-blue)

---

## ✨ Features

### 1. Basic Arithmetic
- Addition (`+`), subtraction (`−`), multiplication (`×`), and division (`÷`)
- Order of operations (PEMDAS / BODMAS) strictly respected
- Floating point correction: avoids floating point artifacts like `0.1 + 0.2 = 0.30000000000000004`
- Percentage (`%`), positive/negative toggle (`±`), and reciprocal (`1/x`)

### 2. Trigonometry & Accurate Angle Modes
- **Trigonometric Functions**: `sin`, `cos`, `tan`
- **Inverse Trigonometric Functions** (`2nd` shift): `sin⁻¹` (`asin`), `cos⁻¹` (`acos`), `tan⁻¹` (`atan`)
- **Degree (DEG) & Radian (RAD) Mode**:
  - Instant toggle switch with clear visual badge in the header and on the display.
  - **High-Precision DEG Calculations**: Prevents IEEE 754 precision errors on critical angles:
    - $\sin(30^\circ) = 0.5$
    - $\sin(180^\circ) = 0$ (avoiding naive floating-point errors like $1.22 \times 10^{-16}$)
    - $\cos(90^\circ) = 0$
    - $\cos(180^\circ) = -1$
    - $\tan(45^\circ) = 1$
    - $\tan(90^\circ) \to \text{Undefined}$ (asymptote detection)

### 3. Powers, Roots & Exponentials
- Square root ($\sqrt{x}$) and cube root ($\sqrt[3]{x}$)
- Power ($x^y$ / `^`), right-associative (e.g. $2^{3^2} = 512$)
- Square ($x^2$) and Cube ($x^3$)
- Powers of 10 ($10^x$) and natural exponential ($e^x$)

### 4. Logarithms
- Base-10 Logarithm: $\log_{10}(x)$
- Natural Logarithm: $\ln(x)$
- Domain validation ($x > 0$) with friendly error messages

### 5. Parentheses & Implicit Multiplication
- Nested parentheses `(` and `)`
- Smart matching: prevents superfluous closing parentheses
- Auto-closes unclosed parentheses upon calculation
- Full support for implicit multiplication:
  - $2(3 + 4) \to 2 \times (3 + 4) = 14$
  - $2\pi \to 2 \times \pi$
  - $3\sin(30^\circ) \to 3 \times \sin(30^\circ) = 1.5$
  - $(2 + 3)(4 + 1) \to 5 \times 5 = 25$

### 6. Calculation History & Memory
- Persistent calculation history stored in `localStorage` across sessions.
- Displays formula expression, result, DEG/RAD mode tag, and timestamp.
- **Interactive**:
  - Click on any previous expression to reload it.
  - Click on any previous result to insert it into your active calculation.
  - Individual item deletion and "Clear All" option.
- Full Memory functions: `MC` (Clear), `MR` (Recall), `M+` (Add), `M−` (Subtract).

### 7. Modern Responsive Design & Dynamic Theme Switcher
- **Dynamic Light / Dark Themes**:
  - One-click toggle in the header with animated icon transitions.
  - High-contrast, WCAG AA/AAA compliant color palettes for high readability in both modes.
  - Smooth 280ms UI transitions across all surfaces, buttons, text, and display elements.
  - Automatic system preference detection (`prefers-color-scheme`) with persistent `localStorage` saving.
- **Copy to Clipboard**: One-click copy for the current result or formula with toast feedback.
- **Dynamic Display Scaling**: Numerals automatically shrink to prevent text overflow.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `0` - `9`, `.` | Enter numbers & decimal point |
| `+`, `-`, `*`, `/` | Arithmetic operators (`+`, `−`, `×`, `÷`) |
| `Enter` or `=` | Calculate result |
| `Backspace` | Token-aware delete (deletes whole functions like `sin(` in 1 tap) |
| `Escape` | All Clear (`AC`) |
| `(`, `)` | Parentheses |
| `^` | Power ($x^y$) |
| `!` | Factorial ($n!$) |
| `%` | Percentage |
| `s`, `c`, `t` | `sin(`, `cos(`, `tan(` (or shifted inverses when `2nd` is active) |
| `l`, `n` | `log(`, `ln(` |
| `p`, `e` | Constants $\pi$, $e$ |
| `d` | Toggle DEG / RAD mode |
| `h` | Toggle History drawer |

---

## 📂 File Architecture

```
├── index.html                 # Semantic HTML5 markup
├── css/
│   └── style.css              # Modern CSS variables, Glassmorphism, Responsive Grid
├── js/
│   ├── engine.js              # Tokenizer, Shunting-Yard evaluator & trig precision
│   ├── history.js             # LocalStorage calculation history manager
│   ├── calculator.js          # UI controller, display updater & keyboard bindings
│   └── app.js                 # Application bootstrap
├── test/
│   ├── engine-test.js         # 48 unit tests verifying math & precision
│   ├── ui-simulation-test.js  # 11 integration tests verifying state & user flows
│   └── validate-dom.js        # DOM and file integrity validation
└── package.json               # Test script configuration
```

---

## 🧪 Testing

Run the automated test suite with Node.js:

```bash
npm test
```

All 59 unit, integration, and DOM validation tests execute and verify:
- Order of operations & nested parentheses
- Floating-point accuracy & rounding
- Degree vs Radian trigonometry and exact asymptote detection
- Powers, square roots, logarithms, exponentials, and factorials
- Implicit multiplication rules
- History persistence & memory operations
