// js/main.js

import { auth } from './firebase-config.js';
import * as ui from './modules/ui.js';

// Função principal de inicialização
import { renderDashboard } from './modules/dashboard.js';

function initApp() {
  auth.onAuthStateChanged(user => {
    if (user) {
      // Se o usuário estiver logado, renderiza a UI principal
      ui.renderAuthenticatedUI(user);
      initializeTheme();
      import { renderLivroOrdens } from './modules/tables.js';

// ... (código existente)

  const sidebar = document.querySelector('.sidebar');
  sidebar.addEventListener('click', e => {
    if (e.target.matches('[data-category]')) {
      const category = e.target.getAttribute('data-category');
      if (category === 'livro-de-ordens') {
        renderLivroOrdens();
      } else if (category === 'dashboard') {
        renderDashboard();
      }
      import { renderCalendar } from './modules/calendar.js';

// ... (código existente)

      if (category === 'calendario') {
        renderCalendar();
      }
    }
  });
    } else {
      // Se não, renderiza a tela de login
      ui.renderLoginUI();
    }
  });
}

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);