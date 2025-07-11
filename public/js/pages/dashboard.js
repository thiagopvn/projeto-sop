import { db, getDocuments } from '../firebase-config.js';
import { showLoading, hideLoading } from '../ui.js';

let chartInstances = {};

export async function renderDashboard(container, context) {
    container.innerHTML = `
        <div class="page-header">
            <h1>Dashboard</h1>
            <div class="dashboard-filters">
                <select class="form-control" id="yearFilter">
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                </select>
            </div>
        </div>
        
        <!-- Metrics Cards -->
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3>Total de Documentos</h3>
                    <div class="metric-value" id="totalDocuments">-</div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3>QTA Enviados</h3>
                    <div class="metric-value" id="qtaCount">-</div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-icon warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3>QTM Enviados</h3>
                    <div class="metric-value" id="qtmCount">-</div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-icon error">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="metric-content">
                    <h3>Documentos Pendentes</h3>
                    <div class="metric-value" id="pendingCount">-</div>
                </div>
            </div>
        </div>
        
        <!-- Charts Section -->
        <div class="charts-grid">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Documentos por Mês</h2>
                </div>
                <div class="chart-container">
                    <canvas id="monthlyChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Status dos Documentos</h2>
                </div>
                <div class="chart-container">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Progress Section -->
        <div class="progress-section">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Progresso Mensal</h2>
                </div>
                <div class="progress-grid" id="progressGrid">
                    <!-- Progress bars will be generated here -->
                </div>
            </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Atividades Recentes</h2>
            </div>
            <div class="activity-list" id="activityList">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
            </div>
        </div>
    `;
    
    // Setup year filter
    document.getElementById('yearFilter').addEventListener('change', (e) => {
        loadDashboardData(parseInt(e.target.value));
    });
    
    // Load initial data
    loadDashboardData(2025);
    
    // Setup realtime listener
    const unsubscribe = db.collection('livro-ordens')
        .onSnapshot(() => {
            const currentYear = parseInt(document.getElementById('yearFilter').value);
            loadDashboardData(currentYear);
        });
    
    context.addUnsubscriber(unsubscribe);
}

async function loadDashboardData(year = 2025) {
    showLoading();
    
    try {
        // Load all documents
        const allDocuments = await getDocuments('livro-ordens');
        
        // Filter by year and remove duplicates
        const uniqueIds = new Set();
        const yearDocuments = allDocuments.filter(doc => {
            if (uniqueIds.has(doc.id)) return false;
            uniqueIds.add(doc.id);
            
            const docYear = doc.ano || (doc.createdAt ? new Date(doc.createdAt.seconds * 1000).getFullYear() : year);
            return docYear === year;
        });
        
        // Calculate metrics
        const totalDocuments = yearDocuments.length;
        const qtaDocuments = yearDocuments.filter(doc => doc.tipo === 'qta');
        const qtmDocuments = yearDocuments.filter(doc => doc.tipo === 'qtm');
        const pendingDocuments = yearDocuments.filter(doc => doc.status === 'pendente' || !doc.status);
        
        // Update metrics
        document.getElementById('totalDocuments').textContent = totalDocuments;
        document.getElementById('qtaCount').textContent = qtaDocuments.length;
        document.getElementById('qtmCount').textContent = qtmDocuments.length;
        document.getElementById('pendingCount').textContent = pendingDocuments.length;
        
        // Generate charts
        generateMonthlyChart(yearDocuments);
        generateStatusChart(yearDocuments);
        generateProgressBars(year);
        generateActivityList(yearDocuments.slice(0, 10));
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    } finally {
        hideLoading();
    }
}

function generateMonthlyChart(documents) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Destroy existing chart
    if (chartInstances.monthly) {
        chartInstances.monthly.destroy();
    }
    
    // Process data by month
    const monthlyData = new Array(12).fill(0);
    const qtaMonthlyData = new Array(12).fill(0);
    const qtmMonthlyData = new Array(12).fill(0);
    
    documents.forEach(doc => {
        const month = doc.mesNumero ? doc.mesNumero - 1 : 
                     (doc.createdAt ? new Date(doc.createdAt.seconds * 1000).getMonth() : 0);
        
        if (month >= 0 && month < 12) {
            monthlyData[month]++;
            
            if (doc.tipo === 'qta') {
                qtaMonthlyData[month]++;
            } else if (doc.tipo === 'qtm') {
                qtmMonthlyData[month]++;
            }
        }
    });
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    chartInstances.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'QTA',
                    data: qtaMonthlyData,
                    backgroundColor: 'rgba(0, 87, 184, 0.8)',
                    borderColor: 'rgba(0, 87, 184, 1)',
                    borderWidth: 1
                },
                {
                    label: 'QTM',
                    data: qtmMonthlyData,
                    backgroundColor: 'rgba(60, 196, 124, 0.8)',
                    borderColor: 'rgba(60, 196, 124, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function generateStatusChart(documents) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    // Destroy existing chart
    if (chartInstances.status) {
        chartInstances.status.destroy();
    }
    
    // Process status data
    const statusCounts = {
        'ativo': 0,
        'completo': 0,
        'pendente': 0,
        'cancelado': 0
    };
    
    documents.forEach(doc => {
        const status = doc.status || 'pendente';
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        }
    });
    
    chartInstances.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ativo', 'Completo', 'Pendente', 'Cancelado'],
            datasets: [{
                data: [
                    statusCounts.ativo,
                    statusCounts.completo,
                    statusCounts.pendente,
                    statusCounts.cancelado
                ],
                backgroundColor: [
                    'rgba(0, 87, 184, 0.8)',
                    'rgba(60, 196, 124, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(244, 67, 54, 0.8)'
                ],
                borderColor: [
                    'rgba(0, 87, 184, 1)',
                    'rgba(60, 196, 124, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function generateProgressBars(year) {
    const progressGrid = document.getElementById('progressGrid');
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const currentMonth = new Date().getMonth();
    
    let progressHTML = '';
    
    months.forEach((month, index) => {
        const isCurrentMonth = index === currentMonth && year === new Date().getFullYear();
        const isPastMonth = index < currentMonth || year < new Date().getFullYear();
        const isFutureMonth = index > currentMonth && year >= new Date().getFullYear();
        
        // Calculate random progress for demo (in real app, use actual data)
        let qtaProgress = 0;
        let qtmProgress = 0;
        
        if (isPastMonth) {
            qtaProgress = 100;
            qtmProgress = 100;
        } else if (isCurrentMonth) {
            qtaProgress = Math.floor(Math.random() * 100);
            qtmProgress = Math.floor(Math.random() * 100);
        }
        
        progressHTML += `
            <div class="progress-item ${isCurrentMonth ? 'current' : ''}">
                <h4>${month}</h4>
                <div class="progress-row">
                    <span class="progress-label">QTA</span>
                    <div class="progress-bar">
                        <div class="progress-fill qta" style="width: ${qtaProgress}%"></div>
                    </div>
                    <span class="progress-value">${qtaProgress}%</span>
                </div>
                <div class="progress-row">
                    <span class="progress-label">QTM</span>
                    <div class="progress-bar">
                        <div class="progress-fill qtm" style="width: ${qtmProgress}%"></div>
                    </div>
                    <span class="progress-value">${qtmProgress}%</span>
                </div>
            </div>
        `;
    });
    
    progressGrid.innerHTML = progressHTML;
}

function generateActivityList(recentDocuments) {
    const activityList = document.getElementById('activityList');
    
    if (recentDocuments.length === 0) {
        activityList.innerHTML = '<p class="empty-state">Nenhuma atividade recente</p>';
        return;
    }
    
    let activityHTML = '';
    
    recentDocuments.forEach(doc => {
        const date = doc.createdAt ? new Date(doc.createdAt.seconds * 1000) : new Date();
        const timeAgo = getTimeAgo(date);
        const icon = getDocumentIcon(doc.tipo);
        
        activityHTML += `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <p class="activity-title">${doc.fileName || doc.titulo || 'Documento'}</p>
                    <p class="activity-subtitle">${doc.tipo?.toUpperCase() || 'Documento'} • ${timeAgo}</p>
                </div>
            </div>
        `;
    });
    
    activityList.innerHTML = activityHTML;
}

function getDocumentIcon(tipo) {
    switch (tipo) {
        case 'qta':
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        case 'qtm':
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
        default:
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} dia${days > 1 ? 's' : ''} atrás`;
    } else if (hours > 0) {
        return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else if (minutes > 0) {
        return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else {
        return 'Agora mesmo';
    }
}

// Add dashboard-specific styles
const dashboardStyles = `
<style>
    .dashboard-filters {
        display: flex;
        gap: 1rem;
    }
    
    .dashboard-filters .form-control {
        width: auto;
        min-width: 120px;
    }
    
    .charts-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .progress-section {
        margin-bottom: 2rem;
    }
    
    .progress-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem 0;
    }
    
    .progress-item {
        padding: 1rem;
        border-radius: var(--radius);
        background-color: var(--color-bg);
        border: 2px solid transparent;
        transition: var(--transition);
    }
    
    .progress-item.current {
        border-color: var(--color-primary);
        background-color: rgba(0, 87, 184, 0.04);
    }
    
    .progress-item h4 {
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text);
    }
    
    .progress-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }
    
    .progress-row:last-child {
        margin-bottom: 0;
    }
    
    .progress-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--color-text-muted);
        min-width: 30px;
    }
    
    .progress-bar {
        flex: 1;
        height: 6px;
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
    }
    
    .progress-fill.qta {
        background-color: var(--color-primary);
    }
    
    .progress-fill.qtm {
        background-color: var(--color-success);
    }
    
    .progress-value {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text);
        min-width: 35px;
    }
    
    .activity-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: var(--radius);
        background-color: var(--color-bg);
        transition: var(--transition);
    }
    
    .activity-item:hover {
        background-color: var(--color-border);
    }
    
    .activity-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-card);
        border-radius: var(--radius);
        color: var(--color-primary);
        flex-shrink: 0;
    }
    
    .activity-content {
        flex: 1;
        min-width: 0;
    }
    
    .activity-title {
        font-weight: 500;
        margin: 0 0 0.25rem 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .activity-subtitle {
        font-size: 0.75rem;
        color: var(--color-text-muted);
        margin: 0;
    }
    
    @media (max-width: 1024px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }
        
        .progress-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
    }
    
    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }
        
        .dashboard-filters {
            justify-content: stretch;
        }
        
        .dashboard-filters .form-control {
            width: 100%;
        }
        
        .progress-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
`;

document.head.insertAdjacentHTML('beforeend', dashboardStyles);