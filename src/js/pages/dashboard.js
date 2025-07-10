import { Firebase } from '../core/firebase.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export class DashboardPage {
  constructor() {
    this.firebase = new Firebase();
    this.toast = new Toast();
    this.charts = {};
  }

  async render() {
    const mainContent = document.getElementById('mainContent');
    
    const dashboardHtml = `
      <div class="dashboard-page">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Dashboard</h1>
          <p class="dashboard-subtitle">Visão geral do sistema</p>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card">
            <div class="stat-icon stat-icon-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <div class="stat-value" id="totalOrdens">0</div>
            <div class="stat-label">Total de Ordens</div>
            <div class="stat-change stat-change-positive">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              +12% este mês
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
            <div class="stat-value" id="qtaProcessadas">0</div>
            <div class="stat-label">QTA Processadas</div>
            <div class="stat-change stat-change-positive">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              +8% este mês
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,5 17,10"/>
                <line x1="12" y1="5" x2="12" y2="15"/>
              </svg>
            </div>
            <div class="stat-value" id="qtmPendentes">0</div>
            <div class="stat-label">QTM Pendentes</div>
            <div class="stat-change stat-change-negative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
              -3% este mês
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon stat-icon-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div class="stat-value" id="eventosHoje">0</div>
            <div class="stat-label">Eventos Hoje</div>
            <div class="stat-change stat-change-positive">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              +5% esta semana
            </div>
          </div>
        </div>

        <div class="dashboard-charts">
          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Ordens por Mês</h3>
              <div class="chart-actions">
                <button class="btn btn-ghost btn-sm" title="Atualizar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="chart-wrapper">
              <canvas id="ordensChart"></canvas>
            </div>
          </div>

          <div class="chart-container">
            <div class="chart-header">
              <h3 class="chart-title">Distribuição por Tipo</h3>
              <div class="chart-actions">
                <button class="btn btn-ghost btn-sm" title="Atualizar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="chart-wrapper">
              <canvas id="tiposChart"></canvas>
            </div>
          </div>
        </div>

        <div class="dashboard-recent">
          <div class="recent-header">
            <h3 class="recent-title">Atividades Recentes</h3>
            <a href="/livro-ordens" class="btn btn-ghost btn-sm">Ver todas</a>
          </div>
          <div class="recent-list" id="recentActivities">
            <!-- Activities will be loaded here -->
          </div>
        </div>
      </div>
    `;

    mainContent.innerHTML = dashboardHtml;
    
    // Load data and initialize charts
    await this.loadDashboardData();
    this.initializeCharts();
  }

  async loadDashboardData() {
    try {
      // Load statistics
      await this.loadStatistics();
      
      // Load recent activities
      await this.loadRecentActivities();
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      this.toast.error('Erro ao carregar dados do dashboard');
    }
  }

  async loadStatistics() {
    // Mock data for demonstration
    // In a real application, these would come from Firebase
    const stats = {
      totalOrdens: 1247,
      qtaProcessadas: 856,
      qtmPendentes: 23,
      eventosHoje: 5
    };

    // Update stat cards
    document.getElementById('totalOrdens').textContent = stats.totalOrdens.toLocaleString();
    document.getElementById('qtaProcessadas').textContent = stats.qtaProcessadas.toLocaleString();
    document.getElementById('qtmPendentes').textContent = stats.qtmPendentes.toLocaleString();
    document.getElementById('eventosHoje').textContent = stats.eventosHoje.toLocaleString();
  }

  async loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    
    // Mock recent activities
    const activities = [
      {
        id: 1,
        type: 'ordem',
        title: 'Nova ordem #2024-001',
        description: 'Ordem criada por João Silva',
        time: '2 minutos atrás',
        status: 'success'
      },
      {
        id: 2,
        type: 'qta',
        title: 'QTA processada',
        description: 'QTA #2024-045 processada com sucesso',
        time: '15 minutos atrás',
        status: 'info'
      },
      {
        id: 3,
        type: 'qtm',
        title: 'Novo documento QTM',
        description: 'Documento enviado para análise',
        time: '1 hora atrás',
        status: 'warning'
      },
      {
        id: 4,
        type: 'evento',
        title: 'Evento agendado',
        description: 'Reunião marcada para amanhã',
        time: '2 horas atrás',
        status: 'primary'
      }
    ];

    const activitiesHtml = activities.map(activity => `
      <div class="recent-item">
        <div class="recent-icon">
          ${this.getActivityIcon(activity.type)}
        </div>
        <div class="recent-content">
          <div class="recent-name">${activity.title}</div>
          <div class="recent-meta">${activity.description} • ${activity.time}</div>
        </div>
        <div class="recent-status">
          <span class="badge badge-${activity.status}">${this.getStatusText(activity.status)}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = activitiesHtml;
  }

  getActivityIcon(type) {
    const icons = {
      ordem: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>`,
      qta: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22,4 12,14.01 9,11.01"/>
      </svg>`,
      qtm: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,5 17,10"/>
        <line x1="12" y1="5" x2="12" y2="15"/>
      </svg>`,
      evento: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>`
    };
    return icons[type] || icons.ordem;
  }

  getStatusText(status) {
    const texts = {
      success: 'Concluído',
      info: 'Processado',
      warning: 'Pendente',
      primary: 'Agendado'
    };
    return texts[status] || 'Desconhecido';
  }

  async initializeCharts() {
    try {
      // Import Chart.js dynamically
      const { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } = await import('chart.js');
      
      // Register Chart.js components
      Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);
      
      // Initialize charts
      this.initOrdensChart(Chart);
      this.initTiposChart(Chart);
      
    } catch (error) {
      console.error('Erro ao carregar Chart.js:', error);
    }
  }

  initOrdensChart(Chart) {
    const ctx = document.getElementById('ordensChart');
    if (!ctx) return;

    this.charts.ordens = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Ordens',
          data: [65, 59, 80, 81, 56, 55],
          borderColor: '#0057B8',
          backgroundColor: 'rgba(0, 87, 184, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  initTiposChart(Chart) {
    const ctx = document.getElementById('tiposChart');
    if (!ctx) return;

    this.charts.tipos = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['QTA', 'QTM', 'Eventos', 'Outros'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: [
            '#0057B8',
            '#22C55E',
            '#FACC15',
            '#EF4444'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  // Cleanup method
  destroy() {
    // Destroy charts
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }
}