// js/main.js

import { auth } from './firebase-config.js';
import * as ui from './modules/ui.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderLivroOrdens } from './modules/tables.js';
import { renderCalendar } from './modules/calendar.js';
import { initializeTheme } from './modules/theme.js';

// Function to handle routing and content rendering
const navigateTo = (category) => {
  const appContent = document.getElementById('app-content');
  switch (category) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'livro-ordens':
      renderLivroOrdens();
      break;
    case 'calendario':
      renderCalendar();
      break;
    // Add cases for other categories as they are implemented
    default:
      appContent.innerHTML = `<h2>${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}</h2><p>Conteúdo da página ${category} será carregado aqui.</p>`;
      break;
  }
};

// Main application initialization function
function initApp() {
  auth.onAuthStateChanged(user => {
    if (user) {
      // If user is logged in, render the main UI
      ui.renderAuthenticatedUI(user);
      initializeTheme(); // Initialize theme after UI is rendered

      // Attach event listeners for sidebar navigation
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.addEventListener('click', e => {
          const link = e.target.closest('.sidebar-link');
          if (link) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-link').forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            const category = link.getAttribute('data-category');
            navigateTo(category);
          }
        });
      }

      // Initial content load (e.g., dashboard)
      navigateTo('dashboard');

    } else {
      // If not logged in, render the login screen
      ui.renderLoginUI();
    }
  });
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
