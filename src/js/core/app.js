import { Config } from './config.js';
import { Firebase } from './firebase.js';
import { Router } from './router.js';
import { ThemeManager } from './theme.js';
import { Sidebar } from '../components/sidebar.js';
import { Navbar } from '../components/navbar.js';
import { Toast } from '../components/toast.js';

export class App {
  constructor() {
    this.config = new Config();
    this.firebase = new Firebase();
    this.router = new Router();
    this.themeManager = new ThemeManager();
    this.toast = new Toast();
    
    this.components = {
      sidebar: null,
      navbar: null
    };
  }

  async init() {
    try {
      // Initialize theme first
      this.themeManager.init();
      
      // Initialize Firebase
      await this.firebase.init();
      
      // Initialize core components
      this.components.sidebar = new Sidebar();
      this.components.navbar = new Navbar();
      
      // Initialize router
      this.router.init();
      
      // Setup global event listeners
      this.setupGlobalEvents();
      
      // Show success message
      this.toast.show('Sistema inicializado com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao inicializar aplicação:', error);
      this.toast.show('Erro ao inicializar sistema', 'error');
    }
  }

  setupGlobalEvents() {
    // Handle mobile sidebar toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.navbar-toggle')) {
        this.components.sidebar.toggle();
      }
    });

    // Handle sidebar overlay clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('sidebar-overlay')) {
        this.components.sidebar.close();
      }
    });

    // Handle ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close modals, drawers, etc.
        document.querySelectorAll('.modal-backdrop.show').forEach(modal => {
          modal.classList.remove('show');
        });
        
        // Close mobile sidebar
        this.components.sidebar.close();
      }
    });

    // Handle theme toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-theme-toggle]')) {
        this.themeManager.toggle();
      }
    });
  }

  // Utility methods
  getCurrentPage() {
    return this.router.getCurrentRoute();
  }

  navigate(path) {
    this.router.navigate(path);
  }

  showToast(message, type = 'info') {
    this.toast.show(message, type);
  }
}