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
  
  // Meses válidos para a aplicação (sem janeiro e fevereiro)
  const VALID_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // Inicializar dashboard quando a página carregar
  document.addEventListener('DOMContentLoaded', function() {
    // Inicializar seletor de mês no dashboard com o mês atual
    const dashboardMonthFilter = document.getElementById('dashboard-month-filter');
    if (dashboardMonthFilter) {
      // Verificar se o mês atual é válido (março a dezembro)
      let currentDateMonth = new Date().getMonth() + 1;
      if (currentDateMonth < 3) {
        currentDateMonth = 3; // Definir março como padrão se for janeiro ou fevereiro
      }
      
      dashboardMonthFilter.value = currentDateMonth;
      dashboardMonthFilter.addEventListener('change', updateDashboard);
    }
  
    // Inicializar gráficos quando scripts Chart.js estiverem carregados
    if (typeof Chart !== 'undefined') {
      initializeCharts();
    }
  
    // Adicionar eventos aos links "Ver Todos"
    document.getElementById('view-all-events')?.addEventListener('click', function(e) {
      e.preventDefault();
      navigateToCategory('calendario');
    });
  
    document.getElementById('view-all-pending')?.addEventListener('click', function(e) {
      e.preventDefault();
      // Manter o mês atual selecionado
      const month = dashboardMonthFilter.value;
      appElements.monthFilter.value = month;
      currentMonth = parseInt(month);
      // Navegar para a categoria "AULAS" por padrão
      navigateToCategory('aulas');
    });
    
    // Adicionar manipulador para o item de menu do dashboard (não necessário se já configurado no app.js)
    setupDashboardNav();
  });
  
  // Configurar navegação do dashboard (caso não esteja configurado no app.js)
  function setupDashboardNav() {
    const dashboardItem = document.querySelector('li[data-category="dashboard"]');
    if (dashboardItem && !dashboardItem.hasEventListeners) {
      dashboardItem.hasEventListeners = true; // Marcar para evitar múltiplos event listeners
      
      // O evento de clique agora é gerenciado em app.js
      
      // Ao carregar a página, clique no dashboard automaticamente
      auth.onAuthStateChanged((user) => {
        if (user) {
          setTimeout(() => {
            // Verificar se a navegação para o dashboard não é tratada no app.js
            if (!document.getElementById('dashboard-container').style.display === 'block') {
              dashboardItem.click();
            }
          }, 500);
        }
      });
    }
  }
  
  // Função para navegar para outra categoria
  function navigateToCategory(categoryId) {
    const categoryItem = document.querySelector(`.category-list li[data-category="${categoryId}"]`);
    if (categoryItem) {
      categoryItem.click();
    }
  }
  
  // Função para inicializar os gráficos
  function initializeCharts() {
    // Inicializar gráfico de categorias
    const categoryCtx = document.getElementById('category-chart')?.getContext('2d');
    if (categoryCtx) {
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
              grid: {
                display: false
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  
    // Inicializar gráfico de tendência mensal
    const trendCtx = document.getElementById('monthly-trend-chart')?.getContext('2d');
    if (trendCtx) {
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
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }
  
  // Função para atualizar o dashboard
  async function updateDashboard() {
    try {
      const dashboardMonthFilter = document.getElementById('dashboard-month-filter');
      if (!dashboardMonthFilter) return;
      
      const month = parseInt(dashboardMonthFilter.value);
      
      // Verificar se o mês é válido (3-12)
      if (!VALID_MONTHS.includes(month)) {
        console.warn('Mês inválido selecionado. Usando março como padrão.');
        dashboardMonthFilter.value = 3;
        return updateDashboard(); // Chamar novamente com mês válido
      }
      
      // Mostrar spinner ou indicador de carregamento aqui se necessário
      
      // Aguardar a carga de dados
      await loadDashboardData(month);
      
      // Atualizar cartões de resumo
      updateSummaryCards();
      
      // Atualizar gráficos
      updateCharts();
      
      // Atualizar listas
      updateUpcomingEventsList();
      updatePendingDocumentsList();
      
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
    }
  }
  
  // Função para carregar dados para o dashboard
  async function loadDashboardData(month) {
    try {
      // Limpar dados anteriores
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
  
      // 1. Carregar documentos do Firestore
      const documentsSnapshot = await db.collection('documents').get();
      
      // Contagem total de documentos
      let totalDocuments = 0;
      let completeDocuments = 0;
      
      // Inicializar categorias
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
      
      // Processar documentos
      documentsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Se for documento do mês atual ou anual
        if (data.month === month || (data.year === 2025 && !data.month)) {
          totalDocuments++;
          completeDocuments++;
          
          // Incrementar contagem por categoria
          if (categories[data.category]) {
            categories[data.category].total++;
            categories[data.category].complete++;
          }
        }
      });
      
      // 2. Calcular documentos esperados para o mês
      let expectedDocuments = 0;
      let pendingDocuments = [];
      let overdueDocuments = [];
      
      // Percorrer categorias
      Object.keys(DOCUMENT_TYPES).forEach(key => {
        if (key !== 'CALENDARIO') {
          const categoryInfo = DOCUMENT_TYPES[key];
          const categoryId = categoryInfo.id;
          
          // Verificar se a categoria está disponível para o mês atual
          let isAvailable = true;
          if (categoryInfo.annual && categoryInfo.visibleMonths) {
            isAvailable = categoryInfo.visibleMonths.includes(month);
          }
          
          if (isAvailable) {
            // Calcular quantidade esperada
            let expectedCount = categoryInfo.monthlyCount || 0;
            
            // Para categorias que usam semanas, limitar ao número de semanas configurado
            if (categoryInfo.needsWeek) {
              expectedCount = Math.min(expectedCount, weeksPerMonth[month]);
            }
            
            // Adicionar ao total esperado
            expectedDocuments += expectedCount;
            
            // Adicionar à categoria
            categories[categoryId].expected = expectedCount;
            
            // Calcular pendentes e atrasados
            const pendingCount = Math.max(0, expectedCount - categories[categoryId].complete);
            
            // Verificar se está atrasado ou apenas pendente
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            
            let isOverdue = false;
            if (categoryInfo.annual) {
              isOverdue = 2025 < currentYear;
            } else {
              isOverdue = 2025 < currentYear || (2025 === currentYear && month < currentMonth);
            }
            
            // Atualizar contagens
            if (isOverdue) {
              categories[categoryId].overdue = pendingCount;
            } else {
              categories[categoryId].pending = pendingCount;
            }
            
            // Adicionar à lista de documentos pendentes/atrasados
            for (let i = 1; i <= pendingCount; i++) {
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
        }
      });
      
      // 3. Carregar eventos do calendário
      const currentDate = new Date();
      const formattedDate = formatDateForQuery(currentDate);
      
      const eventsSnapshot = await db.collection('events')
        .where('date', '>=', formattedDate)
        .orderBy('date')
        .limit(5)
        .get();
      
      const upcomingEvents = [];
      eventsSnapshot.forEach(doc => {
        const eventData = doc.data();
        upcomingEvents.push({
          id: doc.id,
          title: eventData.title,
          date: eventData.date,
          time: eventData.time,
          type: eventData.type,
          description: eventData.description
        });
      });
      
      // 4. Gerar dados de tendência mensal (usando apenas meses válidos 3-12)
      const monthlyTrend = [];
      
      // Verificar o mês atual para determinar o intervalo de meses (recuar até 6 meses, mas não antes de março)
      const startMonth = Math.max(3, month - 5);
      
      // Adicionar dados dos últimos meses (no máximo 6, começando em março)
      for (let i = 0; i < 6 && (startMonth + i) <= 12; i++) {
        const m = startMonth + i;
        
        // Simular dados com tendência crescente
        const completionRate = 0.5 + (i * 0.07) + (Math.random() * 0.15);
        const monthExpected = getExpectedDocumentsForMonth(m);
        const monthComplete = Math.round(monthExpected * completionRate);
        
        monthlyTrend.push({
          month: m,
          monthName: MONTH_NAMES[m - 1],
          value: monthComplete
        });
      }
      
      // Atualizar objeto de dados do dashboard
      dashboardData = {
        documents: {
          total: totalDocuments,
          complete: completeDocuments,
          pending: pendingDocuments.length,
          overdue: overdueDocuments.length,
          expected: expectedDocuments
        },
        categories: categories,
        monthlyTrend: monthlyTrend,
        pendingDocuments: [...overdueDocuments, ...pendingDocuments.slice(0, 5)], // Limitar a 5 itens, priorizando atrasados
        upcomingEvents: upcomingEvents
      };
  
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      throw error;
    }
  }
  
  // Função para calcular documentos esperados para um mês
  function getExpectedDocumentsForMonth(month) {
    // Verificar se é um mês válido (3-12)
    if (!VALID_MONTHS.includes(month)) {
      return 0;
    }
    
    let expectedCount = 0;
    
    Object.keys(DOCUMENT_TYPES).forEach(key => {
      if (key !== 'CALENDARIO') {
        const categoryInfo = DOCUMENT_TYPES[key];
        
        // Verificar se a categoria está disponível para o mês
        let isAvailable = true;
        if (categoryInfo.annual && categoryInfo.visibleMonths) {
          isAvailable = categoryInfo.visibleMonths.includes(month);
        }
        
        if (isAvailable) {
          // Calcular quantidade esperada
          let categoryExpected = categoryInfo.monthlyCount || 0;
          
          // Para categorias que usam semanas, limitar ao número de semanas configurado
          if (categoryInfo.needsWeek) {
            categoryExpected = Math.min(categoryExpected, weeksPerMonth[month]);
          }
          
          // Adicionar ao total esperado
          expectedCount += categoryExpected;
        }
      }
    });
    
    return expectedCount;
  }
  
  // Função para atualizar os cartões de resumo
  function updateSummaryCards() {
    // Atualizar valores nos cartões
    document.getElementById('total-documents-value').textContent = dashboardData.documents.complete;
    document.getElementById('expected-documents-value').textContent = dashboardData.documents.expected;
    document.getElementById('complete-documents-value').textContent = dashboardData.documents.complete;
    document.getElementById('pending-documents-value').textContent = dashboardData.documents.pending;
    document.getElementById('overdue-documents-value').textContent = dashboardData.documents.overdue;
    
    // Calcular percentuais
    const completePercent = dashboardData.documents.expected > 0 ? 
      Math.round((dashboardData.documents.complete / dashboardData.documents.expected) * 100) : 0;
    
    const pendingPercent = dashboardData.documents.expected > 0 ? 
      Math.round((dashboardData.documents.pending / dashboardData.documents.expected) * 100) : 0;
    
    const overduePercent = dashboardData.documents.expected > 0 ? 
      Math.round((dashboardData.documents.overdue / dashboardData.documents.expected) * 100) : 0;
    
    // Atualizar barras de progresso
    document.getElementById('complete-progress').style.width = `${completePercent}%`;
    document.getElementById('pending-progress').style.width = `${pendingPercent}%`;
    document.getElementById('overdue-progress').style.width = `${overduePercent}%`;
    
    // Atualizar rótulos de percentual
    document.getElementById('complete-percentage').textContent = `${completePercent}%`;
    document.getElementById('pending-percentage').textContent = `${pendingPercent}%`;
    document.getElementById('overdue-percentage').textContent = `${overduePercent}%`;
  }
  
  // Função para atualizar os gráficos
  function updateCharts() {
    // Verificar se os gráficos foram inicializados
    if (!categoryChart || !monthlyTrendChart) {
      console.warn('Gráficos não inicializados');
      return;
    }
    
    // 1. Atualizar gráfico de categorias
    const categories = Object.values(dashboardData.categories);
    
    // Filtrar categorias sem documentos esperados
    const validCategories = categories.filter(cat => cat.expected > 0);
    
    // Preparar dados para o gráfico
    const labels = validCategories.map(cat => cat.name);
    const completeData = validCategories.map(cat => cat.complete);
    const pendingData = validCategories.map(cat => cat.pending);
    const overdueData = validCategories.map(cat => cat.overdue);
    
    // Atualizar datasets
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
      const eventDate = new Date(event.date + (event.time ? 'T' + event.time : 'T00:00:00'));
      const formattedDate = formatDateForDisplay(eventDate);
      
      // Tipo de evento
      const eventType = event.type || 'outro';
      
      listItem.innerHTML = `
        <div class="item-icon ${eventType}-icon">
          <i class="${getEventIcon(eventType)}"></i>
        </div>
        <div class="item-content">
          <div class="item-title">${event.title} <span class="badge badge-${eventType}">${capitalizeFirstLetter(eventType)}</span></div>
          <div class="item-subtitle">${event.description ? truncateText(event.description, 40) : ''}</div>
        </div>
        <div class="item-date">${formattedDate}</div>
      `;
      
      // Adicionar evento de clique para abrir o calendário
      listItem.addEventListener('click', function() {
        navigateToCategory('calendario');
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
      const isAnnual = DOCUMENT_TYPES[getCategoryKey(doc.category)].annual;
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
      
      // Adicionar evento de clique para navegar para a categoria
      listItem.addEventListener('click', function() {
        // Configurar o mês
        appElements.monthFilter.value = doc.month;
        currentMonth = doc.month;
        
        // Navegar para a categoria
        navigateToCategory(doc.category);
      });
      
      documentsListEl.appendChild(listItem);
    });
  }
  
  // Funções auxiliares
  
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