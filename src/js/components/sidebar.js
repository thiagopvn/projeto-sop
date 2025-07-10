import { Config } from '../core/config.js';

export class Sidebar {
  constructor() {
    this.config = new Config();
    this.isCollapsed = false;
    this.isMobileOpen = false;
    this.storageKey = this.config.get('ui.sidebar.storageKey');
    
    this.init();
  }

  init() {
    this.createSidebar();
    this.loadState();
    this.bindEvents();
  }

  createSidebar() {
    const sidebarHtml = `
      <aside class="sidebar ${this.isCollapsed ? 'collapsed' : ''}" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-header-logo">
            <img src="/assets/images/brasao.png" alt="Logo" onerror="this.style.display='none'">
          </div>
          <h1 class="sidebar-header-title">${this.config.get('app.name')}</h1>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <ul class="nav-list">
              ${this.renderNavItems()}
            </ul>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="user-details">
              <div class="user-name">Usuário Sistema</div>
              <div class="user-role">Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);
  }

  renderNavItems() {
    const navigation = this.config.get('navigation');
    return navigation.map(item => `
      <li>
        <a href="${item.href}" class="nav-item ${item.active ? 'active' : ''}">
          <span class="nav-item-icon">
            ${this.getIcon(item.icon)}
          </span>
          <span class="nav-item-text">${item.title}</span>
          ${item.badge ? `<span class="nav-item-badge">${item.badge}</span>` : ''}
        </a>
      </li>
    `).join('');
  }

  getIcon(iconName) {
    const icons = {
      'layout-dashboard': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="9"/>
        <rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/>
        <rect x="3" y="16" width="7" height="5"/>
      </svg>`,
      'file-text': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>`,
      'upload': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,5 17,10"/>
        <line x1="12" y1="5" x2="12" y2="15"/>
      </svg>`,
      'book-open': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>`,
      'calendar': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>`
    };

    return icons[iconName] || icons['file-text'];
  }

  bindEvents() {
    // Collapse toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-collapse-toggle')) {
        this.toggleCollapse();
      }
    });

    // Mobile toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.navbar-toggle')) {
        this.toggleMobile();
      }
    });

    // Overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('sidebar-overlay')) {
        this.closeMobile();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        this.closeMobile();
      }
    });
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.updateSidebarState();
    this.saveState();
  }

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
    this.updateMobileState();
  }

  closeMobile() {
    this.isMobileOpen = false;
    this.updateMobileState();
  }

  close() {
    this.closeMobile();
  }

  toggle() {
    this.toggleMobile();
  }

  updateSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.querySelector('.main-wrapper');
    
    if (sidebar) {
      sidebar.classList.toggle('collapsed', this.isCollapsed);
    }
    
    if (mainWrapper) {
      mainWrapper.classList.toggle('sidebar-collapsed', this.isCollapsed);
    }
  }

  updateMobileState() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) {
      sidebar.classList.toggle('mobile-open', this.isMobileOpen);
    }
    
    if (overlay) {
      overlay.classList.toggle('active', this.isMobileOpen);
    }
    
    // Prevent body scroll when sidebar is open on mobile
    document.body.style.overflow = this.isMobileOpen ? 'hidden' : '';
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'true') {
      this.isCollapsed = true;
      this.updateSidebarState();
    }
  }

  saveState() {
    localStorage.setItem(this.storageKey, this.isCollapsed.toString());
  }

  // Public API
  collapse() {
    this.isCollapsed = true;
    this.updateSidebarState();
    this.saveState();
  }

  expand() {
    this.isCollapsed = false;
    this.updateSidebarState();
    this.saveState();
  }

  setActiveItem(href) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.nav-item[href="${href}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  updateUserInfo(user) {
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    
    if (userName) userName.textContent = user.name || 'Usuário Sistema';
    if (userRole) userRole.textContent = user.role || 'Administrador';
  }
}