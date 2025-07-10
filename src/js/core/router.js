import { Config } from './config.js';

export class Router {
  constructor() {
    this.config = new Config();
    this.currentRoute = null;
    this.routes = this.config.get('routes');
    this.pageModules = new Map();
  }

  init() {
    // Handle initial route
    this.handleRoute();
    
    // Listen for popstate events (back/forward buttons)
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && this.isInternalLink(link.href)) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });
  }

  isInternalLink(href) {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin && this.routes[url.pathname];
    } catch {
      return false;
    }
  }

  async handleRoute() {
    const path = window.location.pathname;
    const pageName = this.routes[path] || 'dashboard';
    
    // Update navigation active state
    this.updateNavigation(path);
    
    // Load and render page
    await this.loadPage(pageName);
    
    this.currentRoute = path;
  }

  updateNavigation(currentPath) {
    // Update sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href === currentPath || (currentPath === '/' && href === '/dashboard')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update breadcrumb
    this.updateBreadcrumb(currentPath);
  }

  updateBreadcrumb(path) {
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    if (!breadcrumbContainer) return;

    const pathSegments = path.split('/').filter(segment => segment);
    const breadcrumbItems = [];

    if (pathSegments.length === 0 || path === '/dashboard') {
      breadcrumbItems.push('<li class="breadcrumb-item active">Dashboard</li>');
    } else {
      breadcrumbItems.push('<li class="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>');
      
      pathSegments.forEach((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const segmentPath = '/' + pathSegments.slice(0, index + 1).join('/');
        const segmentName = this.getPageTitle(segment);
        
        if (isLast) {
          breadcrumbItems.push(`<li class="breadcrumb-item active">${segmentName}</li>`);
        } else {
          breadcrumbItems.push(`<li class="breadcrumb-item"><a href="${segmentPath}">${segmentName}</a></li>`);
        }
      });
    }

    breadcrumbContainer.innerHTML = breadcrumbItems.join('');
  }

  getPageTitle(segment) {
    const titles = {
      'qta': 'QTA',
      'qtm': 'QTM', 
      'livro-ordens': 'Livro de Ordens',
      'calendario': 'Calendário'
    };
    return titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  async loadPage(pageName) {
    try {
      // Check if page module is already loaded
      if (this.pageModules.has(pageName)) {
        const pageModule = this.pageModules.get(pageName);
        if (pageModule.render) {
          pageModule.render();
        }
        return;
      }

      // Load page module dynamically
      const module = await import(`../pages/${pageName}.js`);
      const PageClass = module[this.capitalizeFirst(pageName) + 'Page'];
      
      if (PageClass) {
        const pageInstance = new PageClass();
        this.pageModules.set(pageName, pageInstance);
        
        if (pageInstance.render) {
          pageInstance.render();
        }
      }
    } catch (error) {
      console.error(`Erro ao carregar página ${pageName}:`, error);
      this.loadErrorPage();
    }
  }

  loadErrorPage() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="error-page">
          <div class="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2>Página não encontrada</h2>
          <p>A página que você está procurando não existe.</p>
          <a href="/dashboard" class="btn btn-primary">Voltar ao Dashboard</a>
        </div>
      `;
    }
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  navigate(path) {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
      this.handleRoute();
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getPageName() {
    return this.routes[this.currentRoute] || 'dashboard';
  }
}