const VALID_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

let weeksPerMonth = {
  3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4,
  9: 4, 10: 4, 11: 4, 12: 4
};

let appState = {
  currentUser: null,
  currentCategory: 'dashboard',
  currentMonth: 3,
  isLoading: false,
  loadedDocuments: new Set()
};

const DOCUMENT_TYPES = {
  DASHBOARD: {
    id: 'dashboard',
    name: 'DASHBOARD',
    icon: 'fas fa-tachometer-alt'
  },
  AULAS: {
    id: 'aulas',
    name: 'AULAS',
    icon: 'fas fa-chalkboard-teacher',
    monthlyCount: 5,
    needsWeek: true,
    annual: false
  },
  PLANO_DE_SESSAO: {
    id: 'plano-de-sessao',
    name: 'PLANO DE SESSÃO',
    icon: 'fas fa-clipboard-list',
    monthlyCount: 5,
    needsWeek: true,
    annual: false
  },
  QTA: {
    id: 'qta',
    name: 'QTA',
    icon: 'fas fa-file-alt',
    monthlyCount: 1,
    needsWeek: false,
    annual: true,
    visibleMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  QTM: {
    id: 'qtm',
    name: 'QTM',
    icon: 'fas fa-calendar-alt',
    monthlyCount: 1,
    needsWeek: false,
    annual: false
  },
  QTS: {
    id: 'qts',
    name: 'QTS',
    icon: 'fas fa-tasks',
    monthlyCount: 5,
    needsWeek: true,
    annual: false
  },
  RELATORIO_MENSAL: {
    id: 'relatorio-mensal',
    name: 'RELATÓRIO MENSAL',
    icon: 'fas fa-chart-bar',
    monthlyCount: 1,
    needsWeek: false,
    annual: false
  },
  LIVRO_DE_ORDENS: {
    id: 'livro-de-ordens',
    name: 'LIVRO DE ORDENS',
    icon: 'fas fa-book'
  },
  OPERACAO_SIMULADA: {
    id: 'operacao-simulada',
    name: 'OPERAÇÃO SIMULADA',
    icon: 'fas fa-shield-alt'
  },
  PTO: {
    id: 'pto',
    name: 'PTO',
    icon: 'fas fa-file-shield'
  },
  CONTROLE_INSPECAO: {
  id: 'controle-inspecao',
  name: 'CONTROLE DE INSPEÇÃO',
  icon: 'fas fa-clipboard-check'
  },
  CALENDARIO: {
    id: 'calendario',
    name: 'CALENDÁRIO',
    icon: 'fas fa-calendar-day'
  }
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const elements = {
  loginContainer: document.getElementById('login-container'),
  appContainer: document.getElementById('app-container'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  loginBtn: document.getElementById('login-btn'),
  userName: document.getElementById('user-name'),
  logoutBtn: document.getElementById('logout-btn'),
  configBtn: document.getElementById('config-btn'),
  categoryTitle: document.getElementById('category-title'),
  monthFilter: document.getElementById('month-filter'),
  uploadBtn: document.getElementById('upload-btn'),
  addEventBtn: document.getElementById('add-event-btn'),
  documentList: document.getElementById('document-list'),
  documentContainer: document.getElementById('document-container'),
  calendarContainer: document.getElementById('calendar-container'),
  uploadOrdemBtn: document.getElementById('upload-ordem-btn'),
  uploadOperacaoBtn: document.getElementById('upload-operacao-btn'),
  uploadPtoBtn: document.getElementById('upload-pto-btn'),
  categoryItems: document.querySelectorAll('.category-list li')
};

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  setupAuthListeners();
  setupNavigation();
  setupModals();
  
  const currentDate = new Date();
  appState.currentMonth = Math.max(3, currentDate.getMonth() + 1);
  if (elements.monthFilter) {
    elements.monthFilter.value = appState.currentMonth;
  }
}

function setupAuthListeners() {
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', handleLogin);
  }
  
  if (elements.password) {
    elements.password.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }
  
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }
  
  auth.onAuthStateChanged(handleAuthStateChange);
}

async function handleLogin() {
  const email = elements.email?.value;
  const password = elements.password?.value;
  
  if (!email || !password) {
    showNotification('Por favor, preencha todos os campos.', 'error');
    return;
  }
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error('Erro no login:', error);
    showNotification('Erro ao fazer login. Verifique suas credenciais.', 'error');
  }
}

async function handleLogout() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Erro no logout:', error);
    showNotification('Erro ao fazer logout.', 'error');
  }
}

function handleAuthStateChange(user) {
  if (user) {
    appState.currentUser = user;
    elements.loginContainer.style.display = 'none';
    elements.appContainer.style.display = 'block';
    if (elements.userName) {
      elements.userName.textContent = user.email;
    }
    loadInitialData();
  } else {
    appState.currentUser = null;
    elements.loginContainer.style.display = 'flex';
    elements.appContainer.style.display = 'none';
  }
}

async function loadInitialData() {
  try {
    await initializeConfig();
    
    appState.currentCategory = 'dashboard';
    updateActiveCategory('dashboard');
    
    if (typeof updateDashboard === 'function') {
      updateDashboard(true);
    }
  } catch (error) {
    console.error('Erro ao carregar dados iniciais:', error);
  }
}

function setupNavigation() {
  elements.categoryItems.forEach(item => {
    item.addEventListener('click', handleCategoryClick);
  });
  
  if (elements.monthFilter) {
    elements.monthFilter.addEventListener('change', handleMonthChange);
  }
  
  if (elements.configBtn) {
    elements.configBtn.addEventListener('click', openConfigModal);
  }
}

async function handleCategoryClick(e) {
  e.preventDefault();
  
  const item = e.currentTarget;
  const newCategory = item.getAttribute('data-category');
  
  if (newCategory === appState.currentCategory) return;
  
  try {
    if (appState.currentCategory === 'dashboard' && newCategory !== 'dashboard') {
      if (typeof destroyDashboardCharts === 'function') {
        destroyDashboardCharts();
      }
    }
    
    appState.currentCategory = newCategory;
    updateActiveCategory(newCategory);
    
    appState.loadedDocuments.clear();
    
    hideAllContainers();
    
    switch (newCategory) {
      case 'dashboard':
        showDashboard();
        break;
      case 'calendario':
        showCalendar();
        break;
      case 'livro-de-ordens':
        showLivroOrdens();
        break;
      case 'operacao-simulada':
        showOperacaoSimulada();
        break;
      case 'pto':
        showPto();
        break;
      case 'controle-inspecao':
      showControleInspecao();
      break;
      default:
        showDocuments(newCategory);
    }
  } catch (error) {
    console.error('Erro ao mudar categoria:', error);
  }
}

function updateActiveCategory(category) {
  elements.categoryItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-category') === category) {
      item.classList.add('active');
    }
  });
  
  const categoryKey = getCategoryKey(category);
  const categoryName = categoryKey ? DOCUMENT_TYPES[categoryKey].name : 'Dashboard';
  if (elements.categoryTitle) {
    elements.categoryTitle.textContent = categoryName;
  }
}

function handleMonthChange() {
  const newMonth = parseInt(elements.monthFilter.value);
  appState.currentMonth = newMonth;
  
  if (appState.currentCategory === 'dashboard' && typeof updateDashboard === 'function') {
    updateDashboard(false);
  } else if (!['calendario', 'livro-de-ordens', 'operacao-simulada', 'pto'].includes(appState.currentCategory)) {
    appState.loadedDocuments.clear();
    loadDocumentsByCategory(appState.currentCategory, appState.currentMonth);
  }
}

function showDashboard() {
  document.getElementById('dashboard-container').style.display = 'block';
  elements.monthFilter.style.display = 'block';
  
  if (typeof updateDashboard === 'function') {
    updateDashboard(true);
  }
}

function showCalendar() {
  elements.calendarContainer.style.display = 'block';
  elements.addEventBtn.style.display = 'flex';
  
  if (typeof calendar === 'undefined' || !calendar) {
    if (typeof initCalendar === 'function') {
      initCalendar();
    }
  } else {
    calendar.render();
  }
}

function showLivroOrdens() {
  document.getElementById('livro-ordens-container').style.display = 'block';
  elements.uploadOrdemBtn.style.display = 'flex';
  
  if (typeof loadOrdens === 'function') {
    loadOrdens();
  }
}

function showOperacaoSimulada() {
  document.getElementById('operacao-simulada-container').style.display = 'block';
  elements.uploadOperacaoBtn.style.display = 'flex';
  
  if (typeof loadOperacoes === 'function') {
    loadOperacoes();
  }
}

function showPto() {
  document.getElementById('pto-container').style.display = 'block';
  elements.uploadPtoBtn.style.display = 'flex';
  
  if (typeof loadPto === 'function') {
    loadPto();
  }
}

function showDocuments(category) {
  elements.documentContainer.style.display = 'block';
  elements.monthFilter.style.display = 'block';
  elements.uploadBtn.style.display = 'flex';
  document.querySelector('.status-info').style.display = 'flex';
  
  if (elements.monthFilter) {
    appState.currentMonth = parseInt(elements.monthFilter.value);
  }
  
  setTimeout(() => {
    loadDocumentsByCategory(category, appState.currentMonth);
  }, 100);
}

function hideAllContainers() {
  const containers = [
    'dashboard-container',
    'document-container',
    'calendar-container',
    'livro-ordens-container',
    'operacao-simulada-container',
    'pto-container',
    'controle-inspecao-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) container.style.display = 'none';
  });
  
  ['month-filter', 'upload-btn', 'add-event-btn', 'upload-ordem-btn', 'upload-operacao-btn', 'upload-pto-btn'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = 'none';
  });
  
  const statusInfo = document.querySelector('.status-info');
  if (statusInfo) statusInfo.style.display = 'none';
}

async function loadDocumentsByCategory(category, month) {
  if (!elements.documentList || appState.isLoading) return;
  
  try {
    appState.isLoading = true;
    
    elements.documentList.innerHTML = '<tr><td colspan="4" class="text-center py-8">Carregando...</td></tr>';
    appState.loadedDocuments.clear();
    
    const categoryKey = getCategoryKey(category);
    const categoryInfo = DOCUMENT_TYPES[categoryKey];
    
    if (!categoryInfo || ['calendario', 'dashboard', 'livro-de-ordens', 'operacao-simulada', 'pto'].includes(category)) {
      elements.documentList.innerHTML = '';
      return;
    }
    
    if (categoryInfo.annual && categoryInfo.visibleMonths && !categoryInfo.visibleMonths.includes(month)) {
      elements.documentList.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">Categoria não disponível para este mês</td></tr>';
      return;
    }
    
    let query = db.collection('documents').where('category', '==', category);
    
    if (!categoryInfo.annual) {
      query = query.where('month', '==', month);
    }
    
    const snapshot = await query.get();
    const documents = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (categoryInfo.annual && data.year !== 2025) return;
      
      const key = categoryInfo.needsWeek ? `${category}-${month}-${data.week}` : `${category}-${month}`;
      
      if (!appState.loadedDocuments.has(key)) {
        appState.loadedDocuments.add(key);
        
        if (categoryInfo.needsWeek) {
          documents.set(data.week, { ...data, id: doc.id });
        } else {
          documents.set(1, { ...data, id: doc.id });
        }
      }
    });
    
    elements.documentList.innerHTML = '';
    
    const expectedCount = categoryInfo.needsWeek ? 
      Math.min(categoryInfo.monthlyCount, weeksPerMonth[month]) : 
      categoryInfo.monthlyCount;
    
    if (expectedCount > 0) {
      if (categoryInfo.needsWeek) {
        for (let week = 1; week <= expectedCount; week++) {
          const doc = documents.get(week);
          createDocumentRow(category, month, week, doc);
        }
      } else {
        createDocumentRow(category, month, null, documents.get(1));
      }
    }
    
    if (elements.documentList.children.length === 0) {
      elements.documentList.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-500">Nenhum documento encontrado</td></tr>';
    }
    
  } catch (error) {
    console.error('Erro ao carregar documentos:', error);
    elements.documentList.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-red-500">Erro ao carregar documentos</td></tr>';
    showNotification('Erro ao carregar documentos', 'error');
  } finally {
    appState.isLoading = false;
  }
}

function createDocumentRow(category, month, week, doc) {
  if (!elements.documentList) return;
  
  const tr = document.createElement('tr');
  tr.className = 'hover:bg-gray-50 transition-colors duration-150';
  
  if (doc) {
    tr.innerHTML = createExistingDocumentRowHTML(doc, category, month, week);
    setupDocumentActions(tr, doc);
  } else {
    tr.innerHTML = createEmptyDocumentRowHTML(category, month, week);
    setupUploadAction(tr, category, month, week);
  }
  
  elements.documentList.appendChild(tr);
}

function createExistingDocumentRowHTML(doc, category, month, week) {
  const categoryKey = getCategoryKey(category);
  const categoryInfo = DOCUMENT_TYPES[categoryKey];
  
  let documentName = categoryInfo.name;
  if (categoryInfo.needsWeek && week) {
    documentName += ` - ${week}ª SEMANA`;
  }
  
  documentName += categoryInfo.annual ? ' - 2025' : ` - ${MONTH_NAMES[month - 1]}`;
  
  return `
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${documentName}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(doc.uploadDate)}</td>
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full status-complete">
        Completo
      </span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
      <button class="action-view text-primary-600 hover:text-primary-900 mr-3" title="Visualizar">
        <i class="fas fa-eye"></i>
      </button>
      <button class="action-download text-green-600 hover:text-green-900 mr-3" title="Baixar">
        <i class="fas fa-download"></i>
      </button>
      <button class="action-delete text-red-600 hover:text-red-900" title="Excluir">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
}

function createEmptyDocumentRowHTML(category, month, week) {
  const categoryKey = getCategoryKey(category);
  const categoryInfo = DOCUMENT_TYPES[categoryKey];
  
  let documentName = categoryInfo.name;
  if (categoryInfo.needsWeek && week) {
    documentName += ` - ${week}ª SEMANA`;
  }
  
  documentName += categoryInfo.annual ? ' - 2025' : ` - ${MONTH_NAMES[month - 1]}`;
  
  const currentDate = new Date();
  const isOverdue = 2025 < currentDate.getFullYear() || 
    (2025 === currentDate.getFullYear() && month < currentDate.getMonth() + 1);
  
  const status = isOverdue ? 'overdue' : 'pending';
  const statusText = isOverdue ? 'Atrasado' : 'Pendente';
  
  return `
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${documentName}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full status-${status}">
        ${statusText}
      </span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
      <button class="upload-missing px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors duration-200">
        <i class="fas fa-upload mr-1"></i>
        Upload
      </button>
    </td>
  `;
}

function setupDocumentActions(tr, doc) {
  const viewBtn = tr.querySelector('.action-view');
  const downloadBtn = tr.querySelector('.action-download');
  const deleteBtn = tr.querySelector('.action-delete');
  
  if (viewBtn) viewBtn.addEventListener('click', () => viewDocument(doc.fileUrl));
  if (downloadBtn) downloadBtn.addEventListener('click', () => downloadDocument(doc.fileUrl, doc.fileName));
  if (deleteBtn) deleteBtn.addEventListener('click', () => deleteDocument(doc.id));
}

function setupUploadAction(tr, category, month, week) {
  const uploadBtn = tr.querySelector('.upload-missing');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => openUploadModal(category, month, week));
  }
}

function viewDocument(url) {
  if (url) window.open(url, '_blank');
}

function downloadDocument(url, name) {
  if (!url) return;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = name || 'documento';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function deleteDocument(id) {
  if (!confirm('Tem certeza que deseja excluir este documento?')) return;
  
  try {
    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      
      if (data.fileUrl) {
        try {
          const fileRef = storage.refFromURL(data.fileUrl);
          await fileRef.delete();
        } catch (error) {
          console.warn('Arquivo não encontrado no Storage:', error);
        }
      }
      
      await docRef.delete();
      
      appState.loadedDocuments.clear();
      await loadDocumentsByCategory(appState.currentCategory, appState.currentMonth);
      
      showNotification('Documento excluído com sucesso!', 'success');
    }
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    showNotification('Erro ao excluir documento', 'error');
  }
}

function setupModals() {
  setupUploadModal();
  setupConfigModal();
}

const uploadModal = {
  modal: document.getElementById('upload-modal'),
  category: document.getElementById('document-category'),
  month: document.getElementById('document-month'),
  weekContainer: document.getElementById('week-container'),
  week: document.getElementById('document-week'),
  file: document.getElementById('document-file'),
  cancelBtn: document.getElementById('cancel-upload'),
  confirmBtn: document.getElementById('confirm-upload'),
  closeBtn: document.querySelector('.close-modal')
};

function setupUploadModal() {
  if (elements.uploadBtn) {
    elements.uploadBtn.addEventListener('click', () => openUploadModal());
  }
  
  if (uploadModal.cancelBtn) uploadModal.cancelBtn.addEventListener('click', closeUploadModal);
  if (uploadModal.closeBtn) uploadModal.closeBtn.addEventListener('click', closeUploadModal);
  if (uploadModal.confirmBtn) uploadModal.confirmBtn.addEventListener('click', handleUpload);
  
  if (uploadModal.category) uploadModal.category.addEventListener('change', updateWeekOptions);
  if (uploadModal.month) uploadModal.month.addEventListener('change', updateWeekOptions);
}

function openUploadModal(category = null, month = null, week = null) {
  if (!uploadModal.modal) return;
  
  const categoryToUse = category || appState.currentCategory;
  uploadModal.category.value = categoryToUse;
  
  const monthToUse = month || appState.currentMonth;
  uploadModal.month.value = monthToUse;
  
  const categoryKey = getCategoryKey(categoryToUse);
  const categoryInfo = DOCUMENT_TYPES[categoryKey];
  
  if (!categoryInfo) {
    console.error('Categoria inválida:', categoryToUse);
    return;
  }
  
  if (categoryInfo.needsWeek) {
    uploadModal.weekContainer.style.display = 'block';
    uploadModal.weekContainer.classList.remove('hidden');
  } else {
    uploadModal.weekContainer.style.display = 'none';
    uploadModal.weekContainer.classList.add('hidden');
  }
  
  if (categoryInfo.annual) {
    uploadModal.month.disabled = true;
    uploadModal.month.classList.add('bg-neutral-100');
    
    if (categoryInfo.visibleMonths && categoryInfo.visibleMonths.length > 0) {
      uploadModal.month.value = categoryInfo.visibleMonths[0];
    }
  } else {
    uploadModal.month.disabled = false;
    uploadModal.month.classList.remove('bg-neutral-100');
  }
  
  if (categoryInfo.needsWeek && uploadModal.week) {
    uploadModal.week.innerHTML = '';
    const numWeeks = weeksPerMonth[monthToUse] || 4;
    
    for (let i = 1; i <= numWeeks; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}ª Semana`;
      uploadModal.week.appendChild(option);
    }
    
    if (week && week <= numWeeks) {
      uploadModal.week.value = week;
    } else {
      uploadModal.week.value = 1;
    }
  }
  
  if (uploadModal.file) {
    uploadModal.file.value = '';
  }
  
  uploadModal.modal.classList.remove('hidden');
  uploadModal.modal.style.display = 'flex';
  
  uploadModal.modal.classList.add('show');
  
  document.body.style.overflow = 'hidden';
  
  uploadModal.modal.addEventListener('click', handleModalBackdropClick);
  
  document.addEventListener('keydown', handleModalEscKey);
  
  setTimeout(() => {
    if (uploadModal.category && !uploadModal.category.disabled) {
      uploadModal.category.focus();
    } else if (uploadModal.month && !uploadModal.month.disabled) {
      uploadModal.month.focus();
    } else if (uploadModal.week && uploadModal.weekContainer.style.display !== 'none') {
      uploadModal.week.focus();
    } else if (uploadModal.file) {
      uploadModal.file.focus();
    }
  }, 100);
}

function handleModalBackdropClick(e) {
  if (e.target === uploadModal.modal) {
    closeUploadModal();
  }
}

function handleModalEscKey(e) {
  if (e.key === 'Escape' && uploadModal.modal.style.display === 'flex') {
    closeUploadModal();
  }
}

function closeUploadModal() {
  if (uploadModal.modal) {
    uploadModal.modal.classList.remove('show');
    
    setTimeout(() => {
      uploadModal.modal.style.display = 'none';
      uploadModal.modal.classList.add('hidden');
    }, 200);
    
    if (uploadModal.file) {
      uploadModal.file.value = '';
    }
    
    document.body.style.overflow = '';
    
    uploadModal.modal.removeEventListener('click', handleModalBackdropClick);
    document.removeEventListener('keydown', handleModalEscKey);
  }
}

function updateWeekOptions() {
  const category = uploadModal.category.value;
  const month = parseInt(uploadModal.month.value);
  const categoryKey = getCategoryKey(category);
  const categoryInfo = DOCUMENT_TYPES[categoryKey];
  
  if (!categoryInfo) return;
  
  if (categoryInfo.needsWeek) {
    uploadModal.weekContainer.style.display = 'block';
    uploadModal.weekContainer.classList.remove('hidden');
  } else {
    uploadModal.weekContainer.style.display = 'none';
    uploadModal.weekContainer.classList.add('hidden');
  }
  
  if (categoryInfo.annual) {
    uploadModal.month.disabled = true;
    uploadModal.month.classList.add('bg-neutral-100');
    
    if (categoryInfo.visibleMonths && categoryInfo.visibleMonths.length > 0) {
      uploadModal.month.value = categoryInfo.visibleMonths[0];
    }
  } else {
    uploadModal.month.disabled = false;
    uploadModal.month.classList.remove('bg-neutral-100');
  }
  
  if (categoryInfo.needsWeek && uploadModal.week) {
    const currentWeek = uploadModal.week.value;
    uploadModal.week.innerHTML = '';
    const numWeeks = weeksPerMonth[month] || 4;
    
    for (let i = 1; i <= numWeeks; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}ª Semana`;
      uploadModal.week.appendChild(option);
    }
    
    if (currentWeek && currentWeek <= numWeeks) {
      uploadModal.week.value = currentWeek;
    } else {
      uploadModal.week.value = 1;
    }
  }
}

async function handleUpload() {
  const file = uploadModal.file?.files[0];
  if (!file) {
    showNotification('Por favor, selecione um arquivo.', 'error');
    return;
  }
  
  const category = uploadModal.category.value;
  const month = parseInt(uploadModal.month.value);
  const categoryKey = getCategoryKey(category);
  const categoryInfo = DOCUMENT_TYPES[categoryKey];
  const week = categoryInfo.needsWeek ? parseInt(uploadModal.week.value) : null;
  
  try {
    let query = db.collection('documents').where('category', '==', category);
    
    if (categoryInfo.annual) {
      query = query.where('year', '==', 2025);
    } else {
      query = query.where('month', '==', month);
      if (categoryInfo.needsWeek) {
        query = query.where('week', '==', week);
      }
    }
    
    const snapshot = await query.get();
    
    if (!snapshot.empty) {
      if (!confirm('Já existe um documento. Deseja substituí-lo?')) return;
      
      const existingDoc = snapshot.docs[0];
      const existingData = existingDoc.data();
      
      if (existingData.fileUrl) {
        try {
          const fileRef = storage.refFromURL(existingData.fileUrl);
          await fileRef.delete();
        } catch (error) {
          console.warn('Arquivo anterior não encontrado:', error);
        }
      }
      
      await db.collection('documents').doc(existingDoc.id).delete();
    }
    
    const fileName = createFileName(categoryInfo, month, week, file.name);
    const storagePath = createStoragePath(category, month, fileName);
    
    const uploadTask = storage.ref(storagePath).put(file);
    
    showUploadProgress(uploadTask);
    
    uploadTask.on('state_changed',
      (snapshot) => updateUploadProgress(snapshot),
      (error) => handleUploadError(error),
      async () => {
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        await saveDocument(category, month, week, file.name, downloadURL);
        
        closeUploadModal();
        appState.loadedDocuments.clear();
        await loadDocumentsByCategory(appState.currentCategory, appState.currentMonth);
        showNotification('Documento enviado com sucesso!', 'success');
      }
    );
  } catch (error) {
    console.error('Erro no upload:', error);
    showNotification('Erro ao fazer upload do documento', 'error');
  }
}

function createFileName(categoryInfo, month, week, originalName) {
  let fileName = categoryInfo.name;
  
  if (categoryInfo.needsWeek && week) {
    fileName += `_${week}a_SEMANA`;
  }
  
  fileName += categoryInfo.annual ? '_2025' : `_${MONTH_NAMES[month - 1]}_2025`;
  
  const extension = originalName.split('.').pop();
  return `${fileName}.${extension}`;
}

function createStoragePath(category, month, fileName) {
  const categoryKey = getCategoryKey(category);
  const categoryInfo = DOCUMENT_TYPES[categoryKey];
  
  if (categoryInfo.annual) {
    return `documents/${category}/2025/${fileName}`;
  }
  
  return `documents/${category}/${month}/${fileName}`;
}

async function saveDocument(category, month, week, fileName, fileUrl) {
  const categoryKey = getCategoryKey(category);
  const categoryInfo = DOCUMENT_TYPES[categoryKey];
  
  const docData = {
    category,
    fileUrl,
    fileName,
    uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
    uploadedBy: auth.currentUser.uid
  };
  
  if (categoryInfo.annual) {
    docData.year = 2025;
  } else {
    docData.month = month;
    if (week) docData.week = week;
  }
  
  await db.collection('documents').add(docData);
}

const configModal = {
  modal: document.getElementById('config-modal'),
  month: document.getElementById('config-month'),
  weeks: document.getElementById('config-weeks'),
  saveBtn: document.getElementById('save-config'),
  closeBtn: document.querySelector('.close-config-modal')
};

function setupConfigModal() {
  if (configModal.closeBtn) configModal.closeBtn.addEventListener('click', closeConfigModal);
  if (configModal.saveBtn) configModal.saveBtn.addEventListener('click', saveConfig);
}

function openConfigModal() {
  if (!configModal.modal) return;
  
  configModal.month.value = appState.currentMonth;
  configModal.weeks.value = weeksPerMonth[appState.currentMonth];
  configModal.modal.style.display = 'flex';
}

function closeConfigModal() {
  if (configModal.modal) {
    configModal.modal.style.display = 'none';
  }
}

async function saveConfig() {
  try {
    const month = parseInt(configModal.month.value);
    const weeks = parseInt(configModal.weeks.value);
    
    weeksPerMonth[month] = weeks;
    
    await db.collection('config').doc('weeksPerMonth').set(weeksPerMonth);
    
    closeConfigModal();
    showNotification(`${MONTH_NAMES[month - 1]} agora tem ${weeks} semanas.`, 'success');
    
    if (month === appState.currentMonth && !['calendario', 'dashboard', 'livro-de-ordens', 'operacao-simulada', 'pto'].includes(appState.currentCategory)) {
      appState.loadedDocuments.clear();
      await loadDocumentsByCategory(appState.currentCategory, appState.currentMonth);
    }
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    showNotification('Erro ao salvar configuração', 'error');
  }
}

async function initializeConfig() {
  try {
    const configDoc = await db.collection('config').doc('weeksPerMonth').get();
    
    if (configDoc.exists) {
      const savedConfig = configDoc.data();
      VALID_MONTHS.forEach(month => {
        weeksPerMonth[month] = savedConfig[month] || 4;
      });
    } else {
      await db.collection('config').doc('weeksPerMonth').set(weeksPerMonth);
    }
  } catch (error) {
    console.error('Erro ao inicializar configurações:', error);
  }
}

function getCategoryKey(categoryId) {
  return Object.keys(DOCUMENT_TYPES).find(key => DOCUMENT_TYPES[key].id === categoryId);
}

function formatDate(timestamp) {
  if (!timestamp) return '-';
  
  const date = timestamp.toDate();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-20 right-4 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full z-50`;
  
  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-white'
  };
  
  notification.classList.add(...colors[type].split(' '));
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-3"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showUploadProgress(uploadTask) {
  console.log('Upload iniciado...');
}

function updateUploadProgress(snapshot) {
  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  console.log(`Progresso: ${progress.toFixed(0)}%`);
}

function handleUploadError(error) {
  console.error('Erro no upload:', error);
  showNotification('Erro ao fazer upload do arquivo', 'error');
}
function showControleInspecao() {
  document.getElementById('controle-inspecao-container').style.display = 'block';
  
  if (typeof loadInspectionItems === 'function') {
    loadInspectionItems();
  }
}
window.appState = appState;
window.DOCUMENT_TYPES = DOCUMENT_TYPES;
window.MONTH_NAMES = MONTH_NAMES;
window.getCategoryKey = getCategoryKey;
window.showNotification = showNotification;

