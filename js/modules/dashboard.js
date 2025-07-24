// js/modules/dashboard.js

import { firestoreService } from './firebase-service.js';

export const renderDashboard = async () => {
  const appContent = document.getElementById('app-content');
  appContent.innerHTML = `
    <div class="dashboard-grid">
      <div class="summary-card">
        <h3>Total de Documentos</h3>
        <p id="total-docs">...</p>
        <div class="progress-bar"><div style="width: 70%;"></div></div>
      </div>
      <div class="summary-card">
        <h3>Documentos Completos</h3>
        <p id="completed-docs">...</p>
        <div class="progress-bar"><div style="width: 90%;"></div></div>
      </div>
      <div class="summary-card">
        <h3>Documentos Pendentes</h3>
        <p id="pending-docs">...</p>
        <div class="progress-bar"><div style="width: 40%;"></div></div>
      </div>
      <div class="summary-card">
        <h3>Documentos Atrasados</h3>
        <p id="overdue-docs">...</p>
        <div class="progress-bar"><div style="width: 10%;"></div></div>
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
        <ul id="upcoming-events-list" class="dense-list">
          <li><i class="ph-fill ph-calendar-blank"></i> Evento 1 <span class="badge">Hoje</span></li>
          <li><i class="ph-fill ph-calendar-blank"></i> Evento 2 <span class="badge">Amanhã</span></li>
        </ul>
      </div>
    </div>
  `;

  // Placeholder for fetching data and rendering charts
  // const docs = await firestoreService.getCollection('documents');
  // console.log('Documents:', docs);

  // Example Chart.js setup
  const categoryCtx = document.getElementById('category-chart').getContext('2d');
  new Chart(categoryCtx, {
    type: 'bar',
    data: {
      labels: ['QTA', 'QTM', 'QTS', 'Aulas'],
      datasets: [{
        label: 'Documentos',
        data: [12, 19, 3, 5],
        backgroundColor: [
          'rgba(0, 87, 184, 0.6)',
          'rgba(227, 6, 19, 0.6)',
          'rgba(60, 196, 124, 0.6)',
          'rgba(255, 193, 7, 0.6)'
        ],
        borderColor: [
          'rgba(0, 87, 184, 1)',
          'rgba(227, 6, 19, 1)',
          'rgba(60, 196, 124, 1)',
          'rgba(255, 193, 7, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  const monthlyCtx = document.getElementById('monthly-trend-chart').getContext('2d');
  new Chart(monthlyCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Novos Documentos',
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};