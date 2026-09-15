import '@testing-library/jest-dom';

// Polyfill fullScreen APIs for jsdom
if (!document.documentElement.requestFullscreen) {
  document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
}
if (!document.exitFullscreen) {
  document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
}

// Polyfill window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
