import { writable, derived } from 'svelte/store';

const browser = typeof window !== 'undefined';

// Theme preference: 'light', 'dark', or 'system'
export const themePreference = writable<'light' | 'dark' | 'system'>('system');

// System theme detection
export const systemTheme = writable<'light' | 'dark'>('light');

// Actual theme to use
export const currentTheme = derived(
  [themePreference, systemTheme],
  ([$themePreference, $systemTheme]) => {
    if ($themePreference === 'system') {
      return $systemTheme;
    }
    return $themePreference;
  }
);

// Initialize theme detection
export function initializeTheme() {
  if (!browser) return;

  // Detect initial system theme
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  systemTheme.set(mediaQuery.matches ? 'dark' : 'light');

  // Listen for system theme changes
  mediaQuery.addEventListener('change', (e) => {
    systemTheme.set(e.matches ? 'dark' : 'light');
  });

  // Load saved preference
  const saved = localStorage.getItem('theme-preference');
  if (saved && ['light', 'dark', 'system'].includes(saved)) {
    themePreference.set(saved as 'light' | 'dark' | 'system');
  }

  // Save preference changes
  themePreference.subscribe((value) => {
    localStorage.setItem('theme-preference', value);
  });

  // Apply theme to document
  currentTheme.subscribe((theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  });
}