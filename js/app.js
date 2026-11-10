/**
 * App Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  const calculator = new ScientificCalculator();
  calculator.init();
  window.calculatorInstance = calculator;
});
