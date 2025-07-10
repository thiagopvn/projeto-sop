// js/modules/dashboard.js

import { getDashboardData } from './firebase-service.js';
import { showNotification, showConfirmation } from './ui.js';

const appContent = document.getElementById('app-content');

export async function renderDashboard() {
  appContent.innerHTML = `
    <div class="dashboard-grid">
      <div class="summary-card">
        <h3>Total de Documentos</h3>
        <p id="total-docs">-</p>
        <div class="progress-bar"><div id="total-progress"></div></div>
      </div>
      <div class="summary-card">
        <h3>Completos</h3>
        <p id="complete-docs">-</p>
        <div class="progress-bar"><div id="complete-progress"></div></div>
      </div>
      <div class="summary-card">
        <h3>Pendentes</h3>
        <p id="pending-docs">-</p>
        <div class="progress-bar"><div id="pending-progress"></div></div>
      </div>
      <div class="summary-card">
        <h3>Atrasados</h3>
        <p id="overdue-docs">-</p>
        <div class="progress-bar"><div id="overdue-progress"></div></div>
      </div>
      <div class="chart-card">
        <h3>Progresso por Categoria</h3>
        <canvas id="category-chart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Tendência Mensal</h3>
        <canvas id="monthly-trend-chart"></canvas>
      </div>
      <div class="list-card">
        <h3>Próximos Eventos</h3>
        <ul id="events-list"></ul>
      </div>
    </div>
  `;

  const data = await getDashboardData();
  // Lógica para processar os dados e atualizar o DOM
}
