// Node environment polyfill for Leaflet and DOM-aware components

const noop = () => {};

const mockWindow = {
  addEventListener: noop,
  removeEventListener: noop,
  dispatchEvent: () => true,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  location: { href: 'http://localhost:5173/' },
  devicePixelRatio: 1,
  screen: {
    deviceXDPI: 96,
    logicalXDPI: 96,
    width: 1920,
    height: 1080
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  CustomEvent: class CustomEvent {
    constructor(type, detail) {
      this.type = type;
      this.detail = detail?.detail || detail;
    }
  }
};

global.window = mockWindow;

global.document = {
  createElement: (tag) => ({
    tagName: String(tag).toUpperCase(),
    setAttribute: noop,
    getAttribute: () => null,
    style: {},
    appendChild: noop,
    removeChild: noop,
    classList: { add: noop, remove: noop, contains: () => false },
  }),
  createElementNS: (ns, tag) => global.document.createElement(tag),
  documentElement: { style: {} },
  body: { appendChild: noop, removeChild: noop, style: {} },
  addEventListener: noop,
  removeEventListener: noop,
};

// Polyfill geolocation on existing navigator
try {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: (cb) => cb({ coords: { latitude: 0.3536, longitude: 32.7554, accuracy: 10 } }),
      watchPosition: () => 1,
      clearWatch: noop
    },
    configurable: true
  });
} catch (e) {}

global.CustomEvent = mockWindow.CustomEvent;
global.localStorage = mockWindow.localStorage;
