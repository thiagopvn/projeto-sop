import { Config } from './config.js';

export class ThemeManager {
  constructor() {
    this.config = new Config();
    this.currentTheme = null;
    this.storageKey = this.config.get('ui.theme.storageKey');
    this.defaultTheme = this.config.get('ui.theme.default');
  }

  init() {
    // Get saved theme or use default
    this.currentTheme = this.getSavedTheme() || this.defaultTheme;
    
    // Apply theme
    this.applyTheme(this.currentTheme);
    
    // Listen for system theme changes
    this.listenForSystemThemeChange();
  }

  getSavedTheme() {
    return localStorage.getItem(this.storageKey);
  }

  saveTheme(theme) {
    localStorage.setItem(this.storageKey, theme);
  }

  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.saveTheme(theme);
    
    // Update theme toggle icons
    this.updateThemeToggles();
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme }
    }));
  }

  updateThemeToggles() {
    const toggles = document.querySelectorAll('[data-theme-toggle]');
    toggles.forEach(toggle => {
      const lightIcon = toggle.querySelector('[data-theme-icon="light"]');
      const darkIcon = toggle.querySelector('[data-theme-icon="dark"]');
      
      if (lightIcon && darkIcon) {
        if (this.currentTheme === 'dark') {
          lightIcon.style.display = 'block';
          darkIcon.style.display = 'none';
        } else {
          lightIcon.style.display = 'none';
          darkIcon.style.display = 'block';
        }
      }
    });
  }

  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  setTheme(theme) {
    if (['light', 'dark'].includes(theme)) {
      this.applyTheme(theme);
    }
  }

  getTheme() {
    return this.currentTheme;
  }

  isSystemDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  listenForSystemThemeChange() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a theme
        if (!this.getSavedTheme()) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  // CSS custom properties management
  setCSSVariable(property, value) {
    document.documentElement.style.setProperty(`--${property}`, value);
  }

  getCSSVariable(property) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${property}`);
  }

  // Theme customization
  setCustomColors(colors) {
    Object.entries(colors).forEach(([key, value]) => {
      this.setCSSVariable(key, value);
    });
  }

  resetCustomColors() {
    const customProperties = [
      'primary-color',
      'secondary-color',
      'accent-color',
      'background-color',
      'text-color'
    ];
    
    customProperties.forEach(property => {
      document.documentElement.style.removeProperty(`--${property}`);
    });
  }
}