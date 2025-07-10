// js/modules/ui.js

import { auth } from '../firebase-config.js';

import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11';

const appContent = document.getElementById('app-content');
const sidebar = document.querySelector('.sidebar');
const navbar = document.querySelector('.navbar');

const notyf = new Notyf({
  duration: 3000,
  position: { x: 'right', y: 'top' },
  types: [
    { type: 'success', background: '#3CC47C' },
    { type: 'error', background: '#F44336' },
    { type: 'warning', background: '#FFC107' }
  ]
});

export const showNotification = (type, message) => {
  notyf.open({ type, message });
};

export const showConfirm = async (title, text, icon = 'warning') => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#0057B8',
    cancelButtonColor: '#E30613',
    confirmButtonText: 'Sim',
    cancelButtonText: 'Não'
  });
  return result.isConfirmed;
};

export const renderAuthenticatedUI = (user) => {
  document.body.classList.remove('login-page');
  const appContainer = document.getElementById('app-container');
  if (!appContainer) {
    console.error('#app-container not found!');
    return;
  }

  appContainer.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="assets/brasao.png" alt="Logo CBMERJ" class="sidebar-logo">
        <span class="sidebar-title">SOP</span>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li><a href="#dashboard" class="sidebar-link active" data-category="dashboard"><i class="ph-fill ph-gauge"></i> <span class="sidebar-label">Dashboard</span></a></li>
          <li><a href="#aulas" class="sidebar-link" data-category="aulas"><i class="ph-fill ph-chalkboard-teacher"></i> <span class="sidebar-label">Aulas</span></a></li>
          <li><a href="#plano-sessao" class="sidebar-link" data-category="plano-sessao"><i class="ph-fill ph-clipboard-text"></i> <span class="sidebar-label">Plano de Sessão</span></a></li>
          <li><a href="#qta" class="sidebar-link" data-category="qta"><i class="ph-fill ph-file-text"></i> <span class="sidebar-label">QTA</span></a></li>
          <li><a href="#qtm" class="sidebar-link" data-category="qtm"><i class="ph-fill ph-file-text"></i> <span class="sidebar-label">QTM</span></a></li>
          <li><a href="#qts" class="sidebar-link" data-category="qts"><i class="ph-fill ph-file-text"></i> <span class="sidebar-label">QTS</span></a></li>
          <li><a href="#relatorio-mensal" class="sidebar-link" data-category="relatorio-mensal"><i class="ph-fill ph-chart-line"></i> <span class="sidebar-label">Relatório Mensal</span></a></li>
          <li><a href="#livro-ordens" class="sidebar-link" data-category="livro-ordens"><i class="ph-fill ph-book-open"></i> <span class="sidebar-label">Livro de Ordens</span></a></li>
          <li><a href="#operacao-simulada" class="sidebar-link" data-category="operacao-simulada"><i class="ph-fill ph-rocket-launch"></i> <span class="sidebar-label">Operação Simulada</span></a></li>
          <li><a href="#calendario" class="sidebar-link" data-category="calendario"><i class="ph-fill ph-calendar-blank"></i> <span class="sidebar-label">Calendário</span></a></li>
        </ul>
      </nav>
    </aside>

    <div class="main-wrapper">
      <header class="navbar">
        <button id="sidebar-toggle" class="btn-icon"><i class="ph-fill ph-list"></i></button>
        <div class="navbar-right">
          <div class="theme-switcher">
            <input type="checkbox" id="theme-toggle" class="theme-toggle-checkbox">
            <label for="theme-toggle" class="theme-toggle-label"></label>
          </div>
          <div class="user-menu">
            <img src="https://via.placeholder.com/40" alt="User Avatar" class="user-avatar">
            <div class="user-dropdown">
              <a href="#profile">${user.email}</a>
              <a href="#settings">Configurações</a>
              <a href="#logout" id="logout-btn">Sair</a>
            </div>
          </div>
        </div>
      </header>

      <main id="app-content" class="content-area">
        <!-- Dynamic content will be rendered here -->
      </main>
    </div>
  `;

  // Re-attach event listeners after re-rendering HTML
  attachEventListeners();
};

export const renderLoginUI = () => {
  document.body.classList.add('login-page');
  const appContainer = document.getElementById('app-container');
  if (!appContainer) {
    console.error('#app-container not found!');
    return;
  }

  appContainer.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <img src="assets/brasao.png" alt="Logo CBMERJ" class="login-logo">
        <h2>Bem-vindo ao SOP</h2>
        <p>Faça login para continuar</p>
        <form id="login-form">
          <div class="input-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="seu@email.com" required>
          </div>
          <div class="input-group">
            <label for="password">Senha</label>
            <input type="password" id="password" placeholder="********" required>
          </div>
          <button type="submit" class="btn btn-primary">Entrar</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showNotification('success', 'Login realizado com sucesso!');
    } catch (error) {
      showNotification('error', `Erro ao fazer login: ${error.message}`);
      console.error("Login error:", error);
    }
  });
};

const attachEventListeners = () => {
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const logoutBtn = document.getElementById('logout-btn');
  const themeToggle = document.getElementById('theme-toggle');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const confirmed = await showConfirm('Sair', 'Tem certeza que deseja sair?');
      if (confirmed) {
        await auth.signOut();
        showNotification('success', 'Desconectado com sucesso!');
      }
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-mode', themeToggle.checked);
      localStorage.setItem('dark-mode', themeToggle.checked);
    });
    // Set initial state
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    themeToggle.checked = isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
  }

  // Handle sidebar navigation clicks
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      sidebarLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');
      const category = link.getAttribute('data-category');
      // This will be handled by main.js or a router in the future
      console.log(`Navigated to: ${category}`);
      // For now, we'll just update the content area with a placeholder
      appContent.innerHTML = `<h2>${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}</h2><p>Conteúdo da página ${category} será carregado aqui.</p>`;
    });
  });
};

// Initial call to attach event listeners if UI is already rendered (e.g., on page load for authenticated users)
// This will be called by main.js after renderAuthenticatedUI
// attachEventListeners();
