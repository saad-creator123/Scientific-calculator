/**
 * Calculation History Manager
 * Manages persisting and retrieving calculation history with localStorage
 */

class HistoryManager {
  constructor(storageKey = 'scientific_calc_history_v1', maxItems = 50) {
    this.storageKey = storageKey;
    this.maxItems = maxItems;
    this.items = this.load();
    this.listeners = [];
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not load history from localStorage:', e);
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }

  add(expression, result, mode = 'DEG') {
    if (!expression || result === undefined || result === null || result === 'Error') {
      return null;
    }

    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      expression: expression.trim(),
      result: result.toString(),
      mode: mode,
      timestamp: Date.now()
    };

    // Prepend to list
    this.items.unshift(item);

    // Limit maximum items
    if (this.items.length > this.maxItems) {
      this.items = this.items.slice(0, this.maxItems);
    }

    this.save();
    this.notify();
    return item;
  }

  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.save();
    this.notify();
  }

  clear() {
    this.items = [];
    this.save();
    this.notify();
  }

  getAll() {
    return [...this.items];
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  notify() {
    const list = this.getAll();
    for (const listener of this.listeners) {
      listener(list);
    }
  }

  formatDate(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HistoryManager;
} else if (typeof window !== 'undefined') {
  window.HistoryManager = HistoryManager;
}
