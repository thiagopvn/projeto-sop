const notyf = new Notyf();

export function showNotification(message, type = 'success') {
  notyf.open({ type, message });
}

export async function showConfirmation(title, text, icon = 'warning') {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: icon,
    showCancelButton: true,
    confirmButtonColor: '#0057B8',
    cancelButtonColor: '#E30613',
    confirmButtonText: 'Sim',
    cancelButtonText: 'Não'
  });
  return result.isConfirmed;
}

// ... (código existente)

import { auth } from '../firebase-config.js';

const appContainer = document.getElementById('app-container');

export function renderLoginUI() {
  appContainer.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <img src="assets/brasao.png" alt="Brasão CBMERJ" class="login-logo">
        <h2>SOP - 2025</h2>
        <p>Sistema de Organização de Documentos</p>
        <div class="input-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="seu@email.com">
        </div>
        <div class="input-group">
          <label for="password">Senha</label>
          <input type="password" id="password" placeholder="********">
        </div>
        <button id="login-btn" class="btn btn-primary">Entrar</button>
      </div>
    </div>
  `;

  const loginBtn = document.getElementById('login-btn');
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showNotification('Login realizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro no login:', error);
      showNotification('Erro ao fazer login. Verifique suas credenciais.', 'error');
    }
  });
}

export function renderAuthenticatedUI(user) {
  appContainer.innerHTML = `
    <aside class="sidebar">
      <!-- Conteúdo da Sidebar -->
    </aside>
    <div class="main-wrapper">
      <header class="navbar">
        <!-- Conteúdo da Navbar -->
      </header>
      <main id="app-content" class="content-area">
        <!-- Conteúdo dinâmico -->
      </main>
    </div>
  `;

  renderSidebar();
  renderNavbar(user);
  // Carregar o conteúdo do dashboard por padrão
}

function renderSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const menuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'aulas', icon: 'school', label: 'Aulas' },
    { id: 'plano-de-sessao', icon: 'assignment', label: 'Plano de Sessão' },
    { id: 'qta', icon: 'description', label: 'QTA' },
    { id: 'qtm', icon: 'event', label: 'QTM' },
    { id: 'qts', icon: 'task', label: 'QTS' },
    { id: 'relatorio-mensal', icon: 'bar_chart', label: 'Relatório Mensal' },
    { id: 'livro-de-ordens', icon: 'book', label: 'Livro de Ordens' },
    { id: 'operacao-simulada', icon: 'security', label: 'Operação Simulada' },
    { id: 'calendario', icon: 'calendar_today', label: 'Calendário' },
  ];

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <img src="assets/brasao.png" alt="Brasão" class="sidebar-logo">
      <span class="sidebar-title">SOP</span>
    </div>
    <nav class="sidebar-nav">
      <ul>
        ${menuItems.map(item => `
          <li>
            <a href="#" data-category="${item.id}" class="sidebar-link">
              <span class="material-icons">${item.icon}</span>
              <span class="sidebar-label">${item.label}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </nav>
  `;
}

function renderNavbar(user) {
  const navbar = document.querySelector('.navbar');
  navbar.innerHTML = `
    <div class="navbar-left">
      <button id="sidebar-toggle" class="sidebar-toggle-btn" aria-label="Toggle Sidebar">
            <span class="material-icons">menu</span>
          </button>
    </div>
    <div class="navbar-right">
      <div class="theme-switcher">
        <input type="checkbox" id="theme-toggle" class="theme-toggle-checkbox">
        <label for="theme-toggle" class="theme-toggle-label"></label>
      </div>
      <div class="user-menu">
        <img src="https://i.pravatar.cc/40?u=${user.uid}" alt="Avatar" class="user-avatar">
        <span class="user-name">${user.email.split('@')[0]}</span>
        <div class="user-dropdown">
          <a href="#" id="logout-btn">Sair</a>
        </div>
      </div>
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', () => auth.signOut());

  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
  });
}