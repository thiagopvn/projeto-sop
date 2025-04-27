// dashboard.js - Script para o dashboard da aplicação

// Variáveis globais
let dashboardData = {
    documents: {
      total: 0,
      complete: 0,
      pending: 0,
      overdue: 0,
      expected: 0
    },
    categories: {},
    monthlyTrend: [],
    pendingDocuments: [],
    upcomingEvents: []
  };
  
  let categoryChart = null;
  let monthlyTrendChart = null;
  
  // Usar VALID_MONTHS já definido em app.js, não redeclarar
  // Se não existir, cria uma versão local (não deve acontecer em uso normal)
  if (typeof VALID_MONTHS === 'undefined') {
    console.warn("VALID_MONTHS não encontrado no escopo global, criando localmente");
    var VALID_MONTHS_LOCAL = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
  
  // Inicializar dashboard quando a página carregar
  document.addEventListener('DOMContentLoaded', function() {
    // Verificar estado de autenticação apenas após carregamento completo da página
    setTimeout(function() {
      if (typeof auth !== 'undefined' && auth.currentUser) {
        initializeDashboard();
      } else {
        // Fallback - verificar novamente após um intervalo curto
        setTimeout(function() {
          if (typeof auth !== 'undefined' && auth.currentUser) {
            initializeDashboard();
          } else {
            console.warn("Usuário não autenticado ou auth não disponível.");
          }
        }, 1000);
      }
    }, 500);
  });
  
  // Função para inicializar o dashboard
  function initializeDashboard() {
    console.log("Inicializando dashboard...");
    
    // Configurar seletor de mês
    setupMonthSelector();
    
    // Configurar navegação
    setupNavigation();
    
    // Carregar dados iniciais e inicializar gráficos
    updateDashboard(true);
  }
  
  // Configurar seletor de mês
  function setupMonthSelector() {
    const dashboardMonthFilter = document.getElementById('dashboard-month-filter');
    if (dashboardMonthFilter) {
      // Definir mês atual (ou março se atual for janeiro/fevereiro)
      let currentDateMonth = new Date().getMonth() + 1;
      if (currentDateMonth < 3) {
        currentDateMonth = 3;
      }
      
      dashboardMonthFilter.value = currentDateMonth;
      
      // Adicionar evento para atualizar dashboard quando o mês mudar
      dashboardMonthFilter.addEventListener('change', function() {
        updateDashboard(false);
      });
    }
  }
  
  // Configurar navegação
  function setupNavigation() {
    // Configurar link "Ver Todos" para eventos
    const viewAllEvents = document.getElementById('view-all-events');
    if (viewAllEvents) {
      viewAllEvents.addEventListener('click', function(e) {
        e.preventDefault();
        const calendarTab = document.querySelector('li[data-category="calendario"]');
        if (calendarTab) calendarTab.click();
      });
    }
    
    // Configurar link "Ver Todos" para documentos pendentes
    const viewAllPending = document.getElementById('view-all-pending');
    if (viewAllPending) {
      viewAllPending.addEventListener('click', function(e) {
        e.preventDefault();
        const dashboardMonth = document.getElementById('dashboard-month-filter')?.value || '3';
        const appMonthFilter = document.getElementById('month-filter');
        if (appMonthFilter) appMonthFilter.value = dashboardMonth;
        
        // Navegar para a aba de aulas
        const aulasTab = document.querySelector('li[data-category="aulas"]');
        if (aulasTab) aulasTab.click();
      });
    }
  }
  
  // Função principal para atualizar o dashboard
  async function updateDashboard(isInitialLoad) {
    try {
      // Obter mês selecionado
      const dashboardMonthFilter = document.getElementById('dashboard-month-filter');
      if (!dashboardMonthFilter) return;
      
      const month = parseInt(dashboardMonthFilter.value);
      
      // Verificar se o mês é válido usando a variável global ou a local
      const validMonths = typeof VALID_MONTHS !== 'undefined' ? VALID_MONTHS : VALID_MONTHS_LOCAL;
      
      if (!validMonths.includes(month)) {
        dashboardMonthFilter.value = '3';
        return updateDashboard(isInitialLoad);
      }
      
      // Verificar se o Firebase está disponível
      if (typeof db === 'undefined') {
        console.error("Firebase não está disponível");
        return;
      }
      
      // Carregar dados
      await loadDashboardData(month);
      
      // Inicializar ou atualizar gráficos
      if (isInitialLoad) {
        initializeCharts();
      } else {
        updateCharts();
      }
      
      // Atualizar cards e listas
      updateSummaryCards();
      updateUpcomingEventsList();
      updatePendingDocumentsList();
      
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
    }
  }
  
  // Função para carregar dados do dashboard
  async function loadDashboardData(month) {
    try {
      // Reinicializar dados
      dashboardData = {
        documents: {
          total: 0,
          complete: 0,
          pending: 0,
          overdue: 0,
          expected: 0
        },
        categories: {},
        monthlyTrend: [],
        pendingDocuments: [],
        upcomingEvents: []
      };
      
      // Verificar dependências necessárias
      if (!db || !DOCUMENT_TYPES) {
        console.error("Dependências necessárias não encontradas");
        return;
      }
      
      // 1. Inicializar categorias
      const categories = {};
      Object.keys(DOCUMENT_TYPES).forEach(key => {
        if (key !== 'CALENDARIO') {
          const categoryId = DOCUMENT_TYPES[key].id;
          categories[categoryId] = {
            name: DOCUMENT_TYPES[key].name,
            total: 0,
            complete: 0,
            pending: 0,
            overdue: 0,
            expected: 0
          };
        }
      });
      
      // 2. Calcular documentos esperados
      const weeksConfig = typeof weeksPerMonth !== 'undefined' ? weeksPerMonth : 
                          {3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4};
      
      let expectedDocuments = 0;
      Object.keys(DOCUMENT_TYPES).forEach(key => {
        if (key !== 'CALENDARIO') {
          const categoryInfo = DOCUMENT_TYPES[key];
          const categoryId = categoryInfo.id;
          
          // Verificar disponibilidade para o mês
          let isAvailable = true;
          if (categoryInfo.annual && categoryInfo.visibleMonths) {
            isAvailable = categoryInfo.visibleMonths.includes(month);
          }
          
          if (isAvailable) {
            // Calcular quantidade esperada
            let expectedCount = categoryInfo.monthlyCount || 0;
            
            // Para categorias com semanas, ajustar pelo número configurado
            if (categoryInfo.needsWeek) {
              expectedCount = Math.min(expectedCount, weeksConfig[month] || 4);
            }
            
            // Atualizar totais
            expectedDocuments += expectedCount;
            categories[categoryId].expected = expectedCount;
          }
        }
      });
      
      // 3. Carregar documentos reais do Firestore
      const documentsSnapshot = await db.collection('documents').get();
      
      let completeDocuments = 0;
      documentsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Contar apenas documentos do mês selecionado ou anuais
        if (data.month === month || (data.year === 2025 && !data.month)) {
          completeDocuments++;
          
          // Incrementar categoria
          if (categories[data.category]) {
            categories[data.category].total++;
            categories[data.category].complete++;
          }
        }
      });
      
      // 4. Calcular pendentes e atrasados
      let pendingDocuments = [];
      let overdueDocuments = [];
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      Object.keys(categories).forEach(categoryId => {
        const category = categories[categoryId];
        const categoryKey = getCategoryKey(categoryId);
        
        if (!categoryKey) return;
        
        const categoryInfo = DOCUMENT_TYPES[categoryKey];
        const pendingCount = Math.max(0, category.expected - category.complete);
        
        // Verificar se está atrasado
        let isOverdue = false;
        if (categoryInfo.annual) {
          isOverdue = 2025 < currentYear;
        } else {
          isOverdue = 2025 < currentYear || (2025 === currentYear && month < currentMonth);
        }
        
        // Atualizar contagens
        if (isOverdue) {
          category.overdue = pendingCount;
        } else {
          category.pending = pendingCount;
        }
        
        // Adicionar à lista de documentos pendentes/atrasados
        for (let i = 1; i <= pendingCount; i++) {
          // Para documentos que usam semana, verificar se já existe um documento para esta semana
          let skip = false;
          if (categoryInfo.needsWeek) {
            documentsSnapshot.forEach(doc => {
              const data = doc.data();
              if (data.category === categoryId && data.month === month && data.week === i) {
                skip = true;
              }
            });
          }
          
          if (!skip) {
            const docItem = {
              category: categoryId,
              categoryName: categoryInfo.name,
              month: month,
              monthName: MONTH_NAMES[month - 1],
              status: isOverdue ? 'overdue' : 'pending',
              week: categoryInfo.needsWeek ? i : null
            };
            
            if (isOverdue) {
              overdueDocuments.push(docItem);
            } else {
              pendingDocuments.push(docItem);
            }
          }
        }
      });
      
      // 5. Carregar eventos próximos
      try {
        const today = new Date();
        const formattedDate = formatDateForQuery(today);
        
        const eventsSnapshot = await db.collection('events')
          .where('date', '>=', formattedDate)
          .orderBy('date')
          .limit(5)
          .get();
        
        const upcomingEvents = [];
        eventsSnapshot.forEach(doc => {
          const data = doc.data();
          upcomingEvents.push({
            id: doc.id,
            title: data.title,
            date: data.date,
            time: data.time,
            type: data.type || 'outro',
            description: data.description || ''
          });
        });
        
        dashboardData.upcomingEvents = upcomingEvents;
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
      }
      
      // 6. Gerar dados de tendência mensal
      const monthlyTrend = [];
      const validMonths = typeof VALID_MONTHS !== 'undefined' ? VALID_MONTHS : VALID_MONTHS_LOCAL;
      const startMonth = Math.max(validMonths[0], month - 5);
      
      for (let i = 0; i < 6 && (startMonth + i) <= validMonths[validMonths.length - 1]; i++) {
        const m = startMonth + i;
        
        // Simplificando: usar dados simulados consistentes
        const completionRate = 0.5 + (i * 0.1);
        const monthExpected = getExpectedDocumentsForMonth(m, weeksConfig);
        const monthComplete = Math.round(monthExpected * completionRate);
        
        monthlyTrend.push({
          month: m,
          monthName: MONTH_NAMES[m - 1],
          value: monthComplete
        });
      }
      
      // 7. Atualizar objeto de dados do dashboard
      dashboardData = {
        documents: {
          total: completeDocuments,
          complete: completeDocuments,
          pending: pendingDocuments.length,
          overdue: overdueDocuments.length,
          expected: expectedDocuments
        },
        categories: categories,
        monthlyTrend: monthlyTrend,
        pendingDocuments: [...overdueDocuments, ...pendingDocuments.slice(0, 5)],
        upcomingEvents: dashboardData.upcomingEvents
      };
      
      console.log("Dados carregados:", dashboardData);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }
  
  // Função para calcular documentos esperados para um mês
  function getExpectedDocumentsForMonth(month, weeksConfig) {
    // Usar a constante global ou local
    const validMonths = typeof VALID_MONTHS !== 'undefined' ? VALID_MONTHS : VALID_MONTHS_LOCAL;
    
    if (!validMonths.includes(month)) return 0;
    
    let expectedCount = 0;
    Object.keys(DOCUMENT_TYPES).forEach(key => {
      if (key !== 'CALENDARIO') {
        const categoryInfo = DOCUMENT_TYPES[key];
        
        let isAvailable = true;
        if (categoryInfo.annual && categoryInfo.visibleMonths) {
          isAvailable = categoryInfo.visibleMonths.includes(month);
        }
        
        if (isAvailable) {
          let categoryExpected = categoryInfo.monthlyCount || 0;
          if (categoryInfo.needsWeek) {
            categoryExpected = Math.min(categoryExpected, weeksConfig[month] || 4);
          }
          expectedCount += categoryExpected;
        }
      }
    });
    
    return expectedCount;
  }
  
  // Função para inicializar os gráficos
  function initializeCharts() {
    // 1. Inicializar gráfico de categorias
    const categoryCtx = document.getElementById('category-chart');
    if (categoryCtx && typeof Chart !== 'undefined') {
      categoryChart = new Chart(categoryCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Completos',
              backgroundColor: 'rgba(76, 175, 80, 0.6)',
              borderColor: 'rgba(76, 175, 80, 1)',
              borderWidth: 1,
              data: []
            },
            {
              label: 'Pendentes',
              backgroundColor: 'rgba(255, 152, 0, 0.6)',
              borderColor: 'rgba(255, 152, 0, 1)',
              borderWidth: 1,
              data: []
            },
            {
              label: 'Atrasados',
              backgroundColor: 'rgba(244, 67, 54, 0.6)',
              borderColor: 'rgba(244, 67, 54, 1)',
              borderWidth: 1,
              data: []
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: { display: false }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          },
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
    
    // 2. Inicializar gráfico de tendência mensal
    const trendCtx = document.getElementById('monthly-trend-chart');
    if (trendCtx && typeof Chart !== 'undefined') {
      monthlyTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Documentos Completos',
              data: [],
              borderColor: 'rgba(13, 71, 161, 1)',
              backgroundColor: 'rgba(13, 71, 161, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          },
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
    
    // Atualizar dados dos gráficos
    updateCharts();
  }
  
  // Função para atualizar os gráficos
  function updateCharts() {
    // Verificar se os gráficos foram inicializados
    if (!categoryChart || !monthlyTrendChart) {
      console.warn("Gráficos não inicializados");
      return;
    }
    
    // 1. Atualizar gráfico de categorias
    const categories = Object.values(dashboardData.categories);
    const validCategories = categories.filter(cat => cat.expected > 0);
    
    const labels = validCategories.map(cat => cat.name);
    const completeData = validCategories.map(cat => cat.complete);
    const pendingData = validCategories.map(cat => cat.pending);
    const overdueData = validCategories.map(cat => cat.overdue);
    
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = completeData;
    categoryChart.data.datasets[1].data = pendingData;
    categoryChart.data.datasets[2].data = overdueData;
    categoryChart.update();
    
    // 2. Atualizar gráfico de tendência mensal
    const trendLabels = dashboardData.monthlyTrend.map(item => item.monthName);
    const trendData = dashboardData.monthlyTrend.map(item => item.value);
    
    monthlyTrendChart.data.labels = trendLabels;
    monthlyTrendChart.data.datasets[0].data = trendData;
    monthlyTrendChart.update();
  }
  
  // Função para atualizar os cartões de resumo
  function updateSummaryCards() {
    // Atualizar valores de contagem
    document.getElementById('total-documents-value').textContent = dashboardData.documents.complete;
    document.getElementById('expected-documents-value').textContent = dashboardData.documents.expected;
    document.getElementById('complete-documents-value').textContent = dashboardData.documents.complete;
    document.getElementById('pending-documents-value').textContent = dashboardData.documents.pending;
    document.getElementById('overdue-documents-value').textContent = dashboardData.documents.overdue;
    
    // Calcular percentuais
    const total = dashboardData.documents.expected;
    const completePercent = total > 0 ? Math.round((dashboardData.documents.complete / total) * 100) : 0;
    const pendingPercent = total > 0 ? Math.round((dashboardData.documents.pending / total) * 100) : 0;
    const overduePercent = total > 0 ? Math.round((dashboardData.documents.overdue / total) * 100) : 0;
    
    // Atualizar barras de progresso
    document.getElementById('complete-progress').style.width = `${completePercent}%`;
    document.getElementById('pending-progress').style.width = `${pendingPercent}%`;
    document.getElementById('overdue-progress').style.width = `${overduePercent}%`;
    
    // Atualizar rótulos de percentual
    document.getElementById('complete-percentage').textContent = `${completePercent}%`;
    document.getElementById('pending-percentage').textContent = `${pendingPercent}%`;
    document.getElementById('overdue-percentage').textContent = `${overduePercent}%`;
  }
  
  // Função para atualizar a lista de eventos próximos
  function updateUpcomingEventsList() {
    const eventsListEl = document.getElementById('upcoming-events-list');
    if (!eventsListEl) return;
    
    eventsListEl.innerHTML = '';
    
    if (dashboardData.upcomingEvents.length === 0) {
      eventsListEl.innerHTML = '<div class="empty-list-message">Nenhum evento próximo encontrado</div>';
      return;
    }
    
    // Adicionar cada evento à lista
    dashboardData.upcomingEvents.forEach(event => {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      
      // Formatar data
      const eventDate = event.date ? new Date(event.date + (event.time ? 'T' + event.time : 'T00:00:00')) : new Date();
      const formattedDate = formatDateForDisplay(eventDate);
      
      listItem.innerHTML = `
        <div class="item-icon ${event.type}-icon">
          <i class="${getEventIcon(event.type)}"></i>
        </div>
        <div class="item-content">
          <div class="item-title">${event.title} <span class="badge badge-${event.type}">${capitalizeFirstLetter(event.type)}</span></div>
          <div class="item-subtitle">${truncateText(event.description, 40)}</div>
        </div>
        <div class="item-date">${formattedDate}</div>
      `;
      
      listItem.addEventListener('click', function() {
        const calendarTab = document.querySelector('li[data-category="calendario"]');
        if (calendarTab) calendarTab.click();
      });
      
      eventsListEl.appendChild(listItem);
    });
  }
  
  // Função para atualizar a lista de documentos pendentes
  function updatePendingDocumentsList() {
    const documentsListEl = document.getElementById('pending-documents-list');
    if (!documentsListEl) return;
    
    documentsListEl.innerHTML = '';
    
    if (dashboardData.pendingDocuments.length === 0) {
      documentsListEl.innerHTML = '<div class="empty-list-message">Nenhum documento pendente encontrado</div>';
      return;
    }
    
    // Adicionar cada documento à lista
    dashboardData.pendingDocuments.forEach(doc => {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      
      // Nome do documento
      let documentName = doc.categoryName;
      if (doc.week) {
        documentName += ` - ${doc.week}ª SEMANA`;
      }
      
      // Verificar se é anual
      const categoryKey = getCategoryKey(doc.category);
      const isAnnual = categoryKey ? DOCUMENT_TYPES[categoryKey].annual : false;
      
      if (isAnnual) {
        documentName += ` - 2025`;
      } else {
        documentName += ` - ${doc.monthName}`;
      }
      
      listItem.innerHTML = `
        <div class="item-icon ${doc.status}-icon">
          <i class="${doc.status === 'overdue' ? 'fas fa-exclamation-triangle' : 'fas fa-clock'}"></i>
        </div>
        <div class="item-content">
          <div class="item-title">${documentName} <span class="badge badge-${doc.status}">${doc.status === 'overdue' ? 'Atrasado' : 'Pendente'}</span></div>
          <div class="item-subtitle">${doc.categoryName}</div>
        </div>
      `;
      
      listItem.addEventListener('click', function() {
        // Configurar mês e navegar para a categoria
        const monthFilter = document.getElementById('month-filter');
        if (monthFilter) monthFilter.value = doc.month;
        
        if (typeof currentMonth !== 'undefined') {
          currentMonth = doc.month;
        }
        
        const categoryTab = document.querySelector(`li[data-category="${doc.category}"]`);
        if (categoryTab) categoryTab.click();
      });
      
      documentsListEl.appendChild(listItem);
    });
  }
  
  // Funções auxiliares
  
  // Obter a chave da categoria
  function getCategoryKey(categoryId) {
    const keys = Object.keys(DOCUMENT_TYPES);
    for (const key of keys) {
      if (DOCUMENT_TYPES[key].id === categoryId) {
        return key;
      }
    }
    return null;
  }
  
  // Formatar data para exibição
  function formatDateForDisplay(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    let timeStr = '';
    if (date.getHours() + date.getMinutes() > 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      timeStr = ` ${hours}:${minutes}`;
    }
    
    return `${day}/${month}${timeStr}`;
  }
  
  // Formatar data para consulta
  function formatDateForQuery(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // Obter ícone para tipo de evento
  function getEventIcon(eventType) {
    const icons = {
      'visita': 'fas fa-building',
      'formatura': 'fas fa-graduation-cap',
      'instrucao': 'fas fa-book',
      'reuniao': 'fas fa-users',
      'outro': 'fas fa-calendar-day'
    };
    
    return icons[eventType] || icons.outro;
  }
  
  // Truncar texto
  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  // Capitalizar primeira letra
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }