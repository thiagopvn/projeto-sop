import { Config } from '../core/config.js';

export class Navbar {
  constructor() {
    this.config = new Config();
    this.init();
  }

  init() {
    this.createNavbar();
    this.bindEvents();
  }

  createNavbar() {
    const navbarHtml = `
      <header class="navbar">
        <button class="navbar-toggle" type="button" aria-label="Toggle sidebar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div class="navbar-breadcrumb">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item active">Dashboard</li>
            </ol>
          </nav>
        </div>

        <div class="navbar-search">
          <div class="navbar-search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <input type="text" class="navbar-search-input" placeholder="Buscar...">
        </div>

        <div class="navbar-menu">
          <div class="navbar-actions">
            <button class="navbar-action" type="button" title="Notificações">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="navbar-action-badge"></span>
            </button>

            <button class="navbar-action" type="button" title="Alternar tema" data-theme-toggle>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-theme-icon="dark">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-theme-icon="light" style="display: none;">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </button>

            <button class="navbar-action" type="button" title="Configurações">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>

          <div class="navbar-user">
            <button class="navbar-user-toggle" type="button">
              <div class="user-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span class="user-name">Usuário Sistema</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
    `;

    // Insert navbar after sidebar or at the beginning of main wrapper
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
      mainWrapper.insertAdjacentHTML('afterbegin', navbarHtml);
    } else {
      document.body.insertAdjacentHTML('afterbegin', navbarHtml);
    }
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.querySelector('.navbar-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(e.target.value);
        }
      });
    }

    // User menu toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.navbar-user-toggle')) {
        this.toggleUserMenu();
      }
    });

    // Notifications
    document.addEventListener('click', (e) => {
      if (e.target.closest('.navbar-action[title="Notificações"]')) {
        this.showNotifications();
      }
    });

    // Settings
    document.addEventListener('click', (e) => {
      if (e.target.closest('.navbar-action[title="Configurações"]')) {
        this.showSettings();
      }
    });
  }

  handleSearch(query) {
    // Debounce search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        this.performSearch(query);
      }
    }, 300);
  }

  performSearch(query) {
    console.log('Searching for:', query);
    // Implement search functionality
    // This could search through orders, documents, etc.
  }

  toggleUserMenu() {
    // Create or toggle user dropdown menu
    let userMenu = document.querySelector('.navbar-user-menu');
    
    if (!userMenu) {
      userMenu = this.createUserMenu();
      document.querySelector('.navbar-user').appendChild(userMenu);
    }
    
    userMenu.classList.toggle('show');
  }

  createUserMenu() {
    const menuHtml = `
      <div class="navbar-user-menu">
        <div class="user-menu-header">
          <div class="user-info">
            <div class="user-name">Usuário Sistema</div>
            <div class="user-email">usuario@sistema.gov.br</div>
          </div>
        </div>
        <div class="user-menu-items">
          <a href="#" class="user-menu-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Perfil
          </a>
          <a href="#" class="user-menu-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Configurações
          </a>
          <div class="user-menu-divider"></div>
          <a href="#" class="user-menu-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </a>
        </div>
      </div>
    `;
    
    const menu = document.createElement('div');
    menu.innerHTML = menuHtml;
    return menu.firstElementChild;
  }

  showNotifications() {
    console.log('Show notifications');
    // Implement notifications panel
  }

  showSettings() {
    console.log('Show settings');
    // Implement settings modal
  }

  updateBreadcrumb(items) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;

    const breadcrumbHtml = items.map((item, index) => {
      const isLast = index === items.length - 1;
      if (isLast) {
        return `<li class="breadcrumb-item active">${item.text}</li>`;
      } else {
        return `<li class="breadcrumb-item"><a href="${item.href}">${item.text}</a></li>`;
      }
    }).join('');

    breadcrumb.innerHTML = breadcrumbHtml;
  }

  setNotificationCount(count) {
    const badge = document.querySelector('.navbar-action-badge');
    if (badge) {
      if (count > 0) {
        badge.style.display = 'block';
        badge.textContent = count > 99 ? '99+' : count;
      } else {
        badge.style.display = 'none';
      }
    }
  }

  updateUserInfo(user) {
    const userName = document.querySelector('.navbar-user .user-name');
    if (userName) {
      userName.textContent = user.name || 'Usuário Sistema';
    }

    const menuUserName = document.querySelector('.user-menu-header .user-name');
    const menuUserEmail = document.querySelector('.user-menu-header .user-email');
    
    if (menuUserName) menuUserName.textContent = user.name || 'Usuário Sistema';
    if (menuUserEmail) menuUserEmail.textContent = user.email || 'usuario@sistema.gov.br';
  }
}