// Core imports
import { App } from './core/app.js';
import { Config } from './core/config.js';
import { Firebase } from './core/firebase.js';
import { Router } from './core/router.js';
import { ThemeManager } from './core/theme.js';

// Component imports
import { Sidebar } from './components/sidebar.js';
import { Navbar } from './components/navbar.js';
import { Modal } from './components/modal.js';
import { Toast } from './components/toast.js';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});