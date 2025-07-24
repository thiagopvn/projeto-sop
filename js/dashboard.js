let dashboardState = {
  data: {
    documents: { total: 0, complete: 0, pending: 0, overdue: 0, expected: 0 },
    categories: {},
    monthlyTrend: [],
    pendingDocuments: [],
    upcomingEvents: [],
    tasks: { weekly: [], biweekly: [], monthly: [] }
  },
  charts: { category: null, monthlyTrend: null },
  isLoading: false
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof auth !== 'undefined' && auth.currentUser) {
      initializeDashboard();
    }
  }, 1000);
});

function initializeDashboard() {
  setupDashboardNavigation();
  setupTasksEventHandlers();
}

function setupDashboardNavigation() {
  const viewAllEvents = document.getElementById('view-all-events');
  if (viewAllEvents) {
    viewAllEvents.addEventListener('click', (e) => {
      e.preventDefault();
      const calendarTab = document.querySelector('li[data-category="calendario"]');
      if (calendarTab) calendarTab.click();
    });
  }
  
  const viewAllPending = document.getElementById('view-all-pending');
  if (viewAllPending) {
    viewAllPending.addEventListener('click', (e) => {
      e.preventDefault();
      const aulasTab = document.querySelector('li[data-category="aulas"]');
      if (aulasTab) aulasTab.click();
    });
  }
}

function setupTasksEventHandlers() {
  const addTaskButtons = document.querySelectorAll('.add-task-btn');
  addTaskButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskType = e.currentTarget.getAttribute('data-type');
      showAddTaskPrompt(taskType);
    });
  });
}

function showAddTaskPrompt(taskType) {
  const taskText = prompt(`Digite o texto da nova tarefa ${getTaskTypeLabel(taskType)}:`);
  if (taskText && taskText.trim()) {
    addNewTask(taskType, taskText.trim());
  }
}

function getTaskTypeLabel(type) {
  const labels = {
    'weekly': 'semanal',
    'biweekly': 'quinzenal',
    'monthly': 'mensal'
  };
  return labels[type] || 'semanal';
}

async function addNewTask(type, text) {
  try {
    const taskData = {
      text: text,
      type: type,
      isChecked: false,
      lastCheckedAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.currentUser.uid
    };

    await db.collection('tasks').add(taskData);
    await loadTasks();
    if (window.showNotification) {
      window.showNotification('Tarefa adicionada com sucesso!', 'success');
    }
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao adicionar tarefa', 'error');
    }
  }
}

function destroyDashboardCharts() {
  if (dashboardState.charts.category) {
    dashboardState.charts.category.destroy();
    dashboardState.charts.category = null;
  }
  
  if (dashboardState.charts.monthlyTrend) {
    dashboardState.charts.monthlyTrend.destroy();
    dashboardState.charts.monthlyTrend = null;
  }
}

async function updateDashboard(isInitialLoad) {
  if (dashboardState.isLoading) return;
  
  try {
    dashboardState.isLoading = true;
    
    const monthFilter = document.getElementById('month-filter');
    if (!monthFilter) return;
    
    const month = parseInt(monthFilter.value);
    
    await loadDashboardData(month);
    await loadTasks();
    
    if (window.appState && window.appState.currentCategory !== 'dashboard') {
      return;
    }
    
    if (isInitialLoad || !dashboardState.charts.category || !dashboardState.charts.monthlyTrend) {
      destroyDashboardCharts();
      initializeCharts();
    } else {
      updateCharts();
    }
    
    updateSummaryCards();
    updateUpcomingEventsList();
    updatePendingDocumentsList();
    renderTasks();
    
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  } finally {
    dashboardState.isLoading = false;
  }
}

async function loadTasks() {
  try {
    if (!db || !auth || !auth.currentUser) {
      console.error('Firebase não disponível ou usuário não autenticado');
      return;
    }

    const tasksSnapshot = await db.collection('tasks')
      .orderBy('createdAt', 'asc')
      .get();

    const allTasks = [];
    tasksSnapshot.forEach(doc => {
      allTasks.push({ id: doc.id, ...doc.data() });
    });

    await processTasksReset(allTasks);

    const updatedTasksSnapshot = await db.collection('tasks')
      .orderBy('createdAt', 'asc')
      .get();

    const tasks = { weekly: [], biweekly: [], monthly: [] };
    updatedTasksSnapshot.forEach(doc => {
      const taskData = { id: doc.id, ...doc.data() };
      if (tasks[taskData.type]) {
        tasks[taskData.type].push(taskData);
      }
    });

    dashboardState.data.tasks = tasks;
  } catch (error) {
    console.error('Erro ao carregar tarefas:', error);
    dashboardState.data.tasks = { weekly: [], biweekly: [], monthly: [] };
  }
}

async function processTasksReset(tasks) {
  const now = new Date();
  const batch = db.batch();
  let hasUpdates = false;

  for (const task of tasks) {
    if (!task.isChecked || !task.lastCheckedAt) continue;

    const lastChecked = task.lastCheckedAt.toDate();
    let shouldReset = false;

    switch (task.type) {
      case 'weekly':
        const daysDiff = Math.floor((now - lastChecked) / (1000 * 60 * 60 * 24));
        shouldReset = daysDiff >= 7;
        break;

      case 'biweekly':
        const daysDiffBiweekly = Math.floor((now - lastChecked) / (1000 * 60 * 60 * 24));
        shouldReset = daysDiffBiweekly >= 15;
        break;

      case 'monthly':
        const lastCheckedMonth = lastChecked.getMonth();
        const lastCheckedYear = lastChecked.getFullYear();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        shouldReset = (currentYear > lastCheckedYear) || 
                     (currentYear === lastCheckedYear && currentMonth > lastCheckedMonth);
        break;
    }

    if (shouldReset) {
      const taskRef = db.collection('tasks').doc(task.id);
      batch.update(taskRef, {
        isChecked: false,
        lastCheckedAt: null
      });
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await batch.commit();
  }
}

async function toggleTask(taskId, isChecked) {
  try {
    const updateData = {
      isChecked: isChecked,
      lastCheckedAt: isChecked ? firebase.firestore.FieldValue.serverTimestamp() : null
    };

    await db.collection('tasks').doc(taskId).update(updateData);
    await loadTasks();
    renderTasks();
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao atualizar tarefa', 'error');
    }
  }
}

function renderTasks() {
  renderTaskColumn('weekly', 'weekly-tasks');
  renderTaskColumn('biweekly', 'biweekly-tasks');
  renderTaskColumn('monthly', 'monthly-tasks');
}

function renderTaskColumn(taskType, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tasks = dashboardState.data.tasks[taskType] || [];
  
  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="text-center text-neutral-400 py-4">
        <i class="fas fa-list text-2xl mb-2"></i>
        <p class="text-sm">Nenhuma tarefa encontrada</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map(task => createTaskHTML(task)).join('');

  tasks.forEach(task => {
    const taskElement = container.querySelector(`[data-task-id="${task.id}"]`);
    if (taskElement) {
      const checkbox = taskElement.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          toggleTask(task.id, e.target.checked);
          taskElement.classList.toggle('completed', e.target.checked);
        });
      }
    }
  });
}

function createTaskHTML(task) {
  return `
    <div class="task-item ${task.isChecked ? 'completed' : ''}" data-task-id="${task.id}">
      <div class="task-checkbox">
        <input type="checkbox" ${task.isChecked ? 'checked' : ''}>
      </div>
      <div class="task-text">${task.text}</div>
    </div>
  `;
}

async function loadDashboardData(month) {
  try {
    dashboardState.data = {
      documents: { total: 0, complete: 0, pending: 0, overdue: 0, expected: 0 },
      categories: {},
      monthlyTrend: [],
      pendingDocuments: [],
      upcomingEvents: [],
      tasks: dashboardState.data.tasks
    };
    
    if (!db || !window.DOCUMENT_TYPES) {
      console.error('Dependências não encontradas');
      return;
    }
    
    const categories = {};
    Object.keys(window.DOCUMENT_TYPES).forEach(key => {
      if (!['CALENDARIO', 'DASHBOARD', 'LIVRO_DE_ORDENS', 'OPERACAO_SIMULADA'].includes(key)) {
        const categoryId = window.DOCUMENT_TYPES[key].id;
        categories[categoryId] = {
          name: window.DOCUMENT_TYPES[key].name,
          total: 0,
          complete: 0,
          pending: 0,
          overdue: 0,
          expected: 0
        };
      }
    });
    
    const weeksConfig = typeof weeksPerMonth !== 'undefined' ? weeksPerMonth : 
                        {3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4};
    
    let expectedDocuments = 0;
    Object.keys(window.DOCUMENT_TYPES).forEach(key => {
      if (!['CALENDARIO', 'DASHBOARD', 'LIVRO_DE_ORDENS', 'OPERACAO_SIMULADA'].includes(key)) {
        const categoryInfo = window.DOCUMENT_TYPES[key];
        const categoryId = categoryInfo.id;
        
        let isAvailable = true;
        if (categoryInfo.annual && categoryInfo.visibleMonths) {
          isAvailable = categoryInfo.visibleMonths.includes(month);
        }
        
        if (isAvailable) {
          let expectedCount = categoryInfo.monthlyCount || 0;
          
          if (categoryInfo.needsWeek) {
            expectedCount = Math.min(expectedCount, weeksConfig[month] || 4);
          }
          
          expectedDocuments += expectedCount;
          categories[categoryId].expected = expectedCount;
        }
      }
    });
    
    const documentsSnapshot = await db.collection('documents').get();
    
    const processedDocs = new Set();
    let completeDocuments = 0;
    
    documentsSnapshot.forEach(doc => {
      const data = doc.data();
      
      const docKey = `${data.category}-${data.month || 'annual'}-${data.week || '0'}`;
      
      if (processedDocs.has(docKey)) return;
      processedDocs.add(docKey);
      
      if (data.month === month || (data.year === 2025 && !data.month)) {
        completeDocuments++;
        
        if (categories[data.category]) {
          categories[data.category].total++;
          categories[data.category].complete++;
        }
      }
    });
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const pendingDocuments = [];
    const overdueDocuments = [];
    
    Object.keys(categories).forEach(categoryId => {
      const category = categories[categoryId];
      const categoryKey = window.getCategoryKey(categoryId);
      
      if (!categoryKey) return;
      
      const categoryInfo = window.DOCUMENT_TYPES[categoryKey];
      const pendingCount = Math.max(0, category.expected - category.complete);
      
      let isOverdue = false;
      if (categoryInfo.annual) {
        isOverdue = 2025 < currentYear;
      } else {
        isOverdue = 2025 < currentYear || (2025 === currentYear && month < currentMonth);
      }
      
      if (isOverdue) {
        category.overdue = pendingCount;
      } else {
        category.pending = pendingCount;
      }
      
      if (pendingCount > 0) {
        for (let i = 1; i <= pendingCount; i++) {
          if (categoryInfo.needsWeek) {
            const docKey = `${categoryId}-${month}-${i}`;
            if (processedDocs.has(docKey)) continue;
          }
          
          const docItem = {
            category: categoryId,
            categoryName: categoryInfo.name,
            month: month,
            monthName: window.MONTH_NAMES[month - 1],
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
    
    await loadUpcomingEvents();
    
    const monthlyTrend = generateMonthlyTrend(month, weeksConfig);
    
    dashboardState.data.documents = {
      total: completeDocuments,
      complete: completeDocuments,
      pending: pendingDocuments.length,
      overdue: overdueDocuments.length,
      expected: expectedDocuments
    };
    dashboardState.data.categories = categories;
    dashboardState.data.monthlyTrend = monthlyTrend;
    dashboardState.data.pendingDocuments = [...overdueDocuments, ...pendingDocuments].slice(0, 10);
    
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  }
}

async function initializeDefaultTasks() {
  try {
    const tasksSnapshot = await db.collection('tasks').limit(1).get();
    
    if (tasksSnapshot.empty) {
      const defaultTasks = [
        { text: 'Verificar pendências de e-mail', type: 'weekly' },
        { text: 'Revisar documentos da semana', type: 'weekly' },
        { text: 'Backup de arquivos importantes', type: 'weekly' },
        { text: 'Reunião de alinhamento da equipe', type: 'biweekly' },
        { text: 'Revisão de processos operacionais', type: 'biweekly' },
        { text: 'Relatório mensal de atividades', type: 'monthly' },
        { text: 'Atualização de sistemas e softwares', type: 'monthly' },
        { text: 'Reunião de planejamento mensal', type: 'monthly' }
      ];

      const batch = db.batch();
      defaultTasks.forEach(taskData => {
        const newTaskRef = db.collection('tasks').doc();
        batch.set(newTaskRef, {
          ...taskData,
          isChecked: false,
          lastCheckedAt: null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: auth.currentUser.uid
        });
      });

      await batch.commit();
      console.log('Tarefas padrão criadas com sucesso');
    }
  } catch (error) {
    console.error('Erro ao inicializar tarefas padrão:', error);
  }
}

async function loadUpcomingEvents() {
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
    
    dashboardState.data.upcomingEvents = upcomingEvents;
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    dashboardState.data.upcomingEvents = [];
  }
}

function generateMonthlyTrend(currentMonth, weeksConfig) {
  const monthlyTrend = [];
  
  for (let i = 5; i >= 0; i--) {
    const month = currentMonth - i;
    if (month >= 3) {
      const monthExpected = getExpectedDocumentsForMonth(month, weeksConfig);
      const completionRate = 0.7 + (Math.random() * 0.3);
      
      monthlyTrend.push({
        month: month,
        monthName: window.MONTH_NAMES[month - 1],
        value: Math.round(monthExpected * completionRate)
      });
    }
  }
  
  return monthlyTrend;
}

function getExpectedDocumentsForMonth(month, weeksConfig) {
  let expectedCount = 0;
  
  Object.keys(window.DOCUMENT_TYPES).forEach(key => {
    if (!['CALENDARIO', 'DASHBOARD', 'LIVRO_DE_ORDENS', 'OPERACAO_SIMULADA'].includes(key)) {
      const categoryInfo = window.DOCUMENT_TYPES[key];
      
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

function initializeCharts() {
  const categoryCtx = document.getElementById('category-chart');
  if (categoryCtx && typeof Chart !== 'undefined') {
    dashboardState.charts.category = new Chart(categoryCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Completos',
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            data: []
          },
          {
            label: 'Pendentes',
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
            borderColor: 'rgba(251, 191, 36, 1)',
            borderWidth: 1,
            data: []
          },
          {
            label: 'Atrasados',
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
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
          legend: { 
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        }
      }
    });
  }
  
  updateCharts();
}

function updateCharts() {
  if (!dashboardState.charts.category) return;

  const categories = Object.values(dashboardState.data.categories);
  const validCategories = categories.filter(cat => cat.expected > 0);
  
  const labels = validCategories.map(cat => cat.name);
  const completeData = validCategories.map(cat => cat.complete);
  const pendingData = validCategories.map(cat => cat.pending);
  const overdueData = validCategories.map(cat => cat.overdue);
  
  dashboardState.charts.category.data.labels = labels;
  dashboardState.charts.category.data.datasets[0].data = completeData;
  dashboardState.charts.category.data.datasets[1].data = pendingData;
  dashboardState.charts.category.data.datasets[2].data = overdueData;
  dashboardState.charts.category.update();
}

function updateSummaryCards() {
  const data = dashboardState.data.documents;
  
  updateElementText('total-documents-value', data.complete);
  updateElementText('expected-documents-value', data.expected);
  updateElementText('complete-documents-value', data.complete);
  updateElementText('pending-documents-value', data.pending);
  updateElementText('overdue-documents-value', data.overdue);
  
  const total = data.expected || 1;
  const completePercent = Math.round((data.complete / total) * 100);
  const pendingPercent = Math.round((data.pending / total) * 100);
  const overduePercent = Math.round((data.overdue / total) * 100);
  
  updateProgressBar('complete-progress', completePercent);
  updateProgressBar('pending-progress', pendingPercent);
  updateProgressBar('overdue-progress', overduePercent);
  
  updateElementText('complete-percentage', `${completePercent}%`);
  updateElementText('pending-percentage', `${pendingPercent}%`);
  updateElementText('overdue-percentage', `${overduePercent}%`);
}

function updateUpcomingEventsList() {
  const container = document.getElementById('upcoming-events-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (dashboardState.data.upcomingEvents.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <i class="fas fa-calendar-times text-4xl mb-2"></i>
        <p>Nenhum evento próximo encontrado</p>
      </div>
    `;
    return;
  }
  
  dashboardState.data.upcomingEvents.forEach(event => {
    const eventEl = createEventElement(event);
    container.appendChild(eventEl);
  });
}

function createEventElement(event) {
  const div = document.createElement('div');
  div.className = 'p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer';
  
  const eventDate = event.date ? new Date(event.date + (event.time ? 'T' + event.time : 'T00:00:00')) : new Date();
  const formattedDate = formatDateForDisplay(eventDate);
  
  const typeColors = {
    'visita': 'text-green-600 bg-green-100',
    'formatura': 'text-blue-600 bg-blue-100',
    'instrucao': 'text-yellow-600 bg-yellow-100',
    'reuniao': 'text-purple-600 bg-purple-100',
    'outro': 'text-gray-600 bg-gray-100'
  };
  
  const typeClass = typeColors[event.type] || typeColors.outro;
  
  div.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center flex-1">
        <div class="w-10 h-10 rounded-full ${typeClass.split(' ')[1]} flex items-center justify-center mr-3">
          <i class="${getEventIcon(event.type)} ${typeClass.split(' ')[0]}"></i>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900">${event.title}</h4>
          <p class="text-sm text-gray-500">${truncateText(event.description, 40)}</p>
        </div>
      </div>
      <div class="text-sm text-gray-500 ml-4">
        ${formattedDate}
      </div>
    </div>
  `;
  
  div.addEventListener('click', () => {
    const calendarTab = document.querySelector('li[data-category="calendario"]');
    if (calendarTab) calendarTab.click();
  });
  
  return div;
}

function updatePendingDocumentsList() {
  const container = document.getElementById('pending-documents-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (dashboardState.data.pendingDocuments.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-500 py-8">
        <i class="fas fa-check-circle text-4xl mb-2"></i>
        <p>Nenhum documento pendente encontrado</p>
      </div>
    `;
    return;
  }
  
  dashboardState.data.pendingDocuments.forEach(doc => {
    const docEl = createPendingDocumentElement(doc);
    container.appendChild(docEl);
  });
}

function createPendingDocumentElement(doc) {
  const div = document.createElement('div');
  div.className = 'p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer';
  
  let documentName = doc.categoryName;
  if (doc.week) {
    documentName += ` - ${doc.week}ª SEMANA`;
  }
  
  const categoryKey = window.getCategoryKey(doc.category);
  const isAnnual = categoryKey ? window.DOCUMENT_TYPES[categoryKey].annual : false;
  
  documentName += isAnnual ? ' - 2025' : ` - ${doc.monthName}`;
  
  const statusColors = {
    'pending': 'text-yellow-600 bg-yellow-100',
    'overdue': 'text-red-600 bg-red-100'
  };
  
  const statusClass = statusColors[doc.status];
  const statusText = doc.status === 'overdue' ? 'Atrasado' : 'Pendente';
  const statusIcon = doc.status === 'overdue' ? 'fa-exclamation-triangle' : 'fa-clock';
  
  div.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center flex-1">
        <div class="w-10 h-10 rounded-full ${statusClass.split(' ')[1]} flex items-center justify-center mr-3">
          <i class="fas ${statusIcon} ${statusClass.split(' ')[0]}"></i>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900">${documentName}</h4>
          <p class="text-sm text-gray-500">${doc.categoryName}</p>
        </div>
      </div>
      <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
        ${statusText}
      </span>
    </div>
  `;
  
  div.addEventListener('click', () => {
    if (window.appState) {
      window.appState.currentMonth = doc.month;
    }
    
    const monthFilter = document.getElementById('month-filter');
    if (monthFilter) monthFilter.value = doc.month;
    
    const categoryTab = document.querySelector(`li[data-category="${doc.category}"]`);
    if (categoryTab) categoryTab.click();
  });
  
  return div;
}

function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function updateProgressBar(id, percent) {
  const element = document.getElementById(id);
  if (element) element.style.width = `${percent}%`;
}

function formatDateForQuery(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

setTimeout(() => {
  if (typeof auth !== 'undefined' && auth.currentUser) {
    initializeDefaultTasks();
  }
}, 2000);

window.updateDashboard = updateDashboard;
window.destroyDashboardCharts = destroyDashboardCharts;