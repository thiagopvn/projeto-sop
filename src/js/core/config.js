export class Config {
  constructor() {
    this.app = {
      name: 'Sistema de Ordens Policiais',
      version: '3.0.0',
      description: 'Sistema de gestão de ordens policiais'
    };

    this.api = {
      baseUrl: window.location.origin,
      timeout: 30000
    };

    this.firebase = {
      config: {
        apiKey: "AIzaSyC5H8zGgX7OpFKkHaIKJQb8lW_ZqLjJhoo",
        authDomain: "projeto-sop.firebaseapp.com",
        databaseURL: "https://projeto-sop-default-rtdb.firebaseio.com",
        projectId: "projeto-sop",
        storageBucket: "projeto-sop.firebasestorage.app",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abc123def456"
      },
      collections: {
        livroOrdens: 'livro-ordens',
        qta: 'qta',
        qtm: 'qtm',
        usuarios: 'usuarios',
        eventos: 'eventos'
      },
      storage: {
        bucket: 'gs://projeto-sop.firebasestorage.app/'
      }
    };

    this.ui = {
      theme: {
        default: 'light',
        storageKey: 'sop-theme'
      },
      sidebar: {
        storageKey: 'sop-sidebar-collapsed'
      },
      pagination: {
        defaultLimit: 20,
        limits: [10, 20, 50, 100]
      }
    };

    this.routes = {
      '/': 'dashboard',
      '/dashboard': 'dashboard',
      '/qta': 'qta',
      '/qtm': 'qtm',
      '/livro-ordens': 'livro-ordens',
      '/calendario': 'calendario'
    };

    this.navigation = [
      {
        title: 'Dashboard',
        icon: 'layout-dashboard',
        href: '/dashboard',
        active: true
      },
      {
        title: 'QTA',
        icon: 'file-text',
        href: '/qta'
      },
      {
        title: 'QTM',
        icon: 'upload',
        href: '/qtm'
      },
      {
        title: 'Livro de Ordens',
        icon: 'book-open',
        href: '/livro-ordens'
      },
      {
        title: 'Calendário',
        icon: 'calendar',
        href: '/calendario'
      }
    ];
  }

  get(key) {
    const keys = key.split('.');
    let value = this;
    
    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        return null;
      }
    }
    
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in obj)) {
        obj[k] = {};
      }
      obj = obj[k];
    }
    
    obj[keys[keys.length - 1]] = value;
  }
}