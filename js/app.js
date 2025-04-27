// app.js
// Constantes para categorias de documentos
const DOCUMENT_TYPES = {
    AULAS: {
      id: 'aulas',
      name: 'AULAS',
      icon: 'fas fa-chalkboard-teacher',
      monthlyCount: 5,  // Máximo de 5 documentos por mês
      needsWeek: true,  // Usa semanas para identificar documentos
      annual: false
    },
    PLANO_DE_SESSAO: {
      id: 'plano-de-sessao',
      name: 'PLANO DE SESSÃO',
      icon: 'fas fa-clipboard-list',
      monthlyCount: 5,  // Máximo de 5 documentos por mês
      needsWeek: true,
      annual: false
    },
    QTA: {
      id: 'qta',
      name: 'QTA',
      icon: 'fas fa-file-alt',
      monthlyCount: 1, // 1 documento por ano
      needsWeek: false,
      annual: true,     // Documento anual, não mensal
      // Definir meses em que o QTA deve aparecer (todos exceto Janeiro e Fevereiro)
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
      monthlyCount: 5,  // Máximo de 5 documentos por mês
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
    CALENDARIO: {
      id: 'calendario',
      name: 'CALENDÁRIO',
      icon: 'fas fa-calendar-day'
    }
  };
  
  // Nomes dos meses
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Estado da aplicação
  let currentUser = null;
  let currentCategory = DOCUMENT_TYPES.DASHBOARD.id || 'dashboard'; // Alterado para dashboard como padrão
  let currentMonth = 3; // Alterado para começar em março (mês 3)
  
  // Meses válidos para a aplicação (sem janeiro e fevereiro)
  const VALID_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // Configuração padrão de semanas por mês
  let weeksPerMonth = {
    3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4,
    9: 4, 10: 4, 11: 4, 12: 4
  };
  
  // Elementos DOM
  const loginForm = {
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn')
  };
  
  const appElements = {
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
    categoryItems: document.querySelectorAll('.category-list li')
  };
  
  const modalElements = {
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
  
  const configModalElements = {
    modal: document.getElementById('config-modal'),
    month: document.getElementById('config-month'),
    weeks: document.getElementById('config-weeks'),
    saveBtn: document.getElementById('save-config'),
    closeBtn: document.querySelector('.close-config-modal')
  };
  
  // Eventos de login e logout
  loginForm.loginBtn.addEventListener('click', () => {
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    
    if (email && password) {
      signIn(email, password);
    } else {
      alert('Por favor, preencha os campos de email e senha.');
    }
  });
  
  appElements.logoutBtn.addEventListener('click', () => {
    signOut();
  });
  
  // Eventos de navegação
  appElements.categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      // Atualizar categoria ativa
      appElements.categoryItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Atualizar categoria atual
      currentCategory = item.getAttribute('data-category');
      appElements.categoryTitle.textContent = currentCategory === 'dashboard' ? 'DASHBOARD' : 
                                             DOCUMENT_TYPES[getCategoryKey(currentCategory)].name;
      
      // Verificar se é a categoria de calendário
      if (currentCategory === 'calendario') {
        // Ocultar elementos de documentos
        appElements.documentContainer.style.display = 'none';
        appElements.monthFilter.style.display = 'none';
        appElements.uploadBtn.style.display = 'none';
        
        // Exibir elementos de calendário
        appElements.calendarContainer.style.display = 'block';
        appElements.addEventBtn.style.display = 'inline-flex';
        return;
      } 
      // Verificar se é a categoria de dashboard
      else if (currentCategory === 'dashboard') {
        // Ocultar elementos de documentos e calendário
        appElements.documentContainer.style.display = 'none';
        appElements.calendarContainer.style.display = 'none';
        appElements.monthFilter.style.display = 'none';
        appElements.uploadBtn.style.display = 'none';
        appElements.addEventBtn.style.display = 'none';
        
        // Ocultar informações de status
        document.querySelector('.status-info').style.display = 'none';
        
        // Exibir dashboard
        document.getElementById('dashboard-container').style.display = 'block';
        
        // Atualizar dashboard
        if (typeof updateDashboard === 'function') {
          updateDashboard();
        }
        
        return;
      } else {
        // Ocultar elementos de calendário e dashboard
        appElements.calendarContainer.style.display = 'none';
        appElements.addEventBtn.style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'none';
        
        // Exibir elementos de documentos
        appElements.documentContainer.style.display = 'block';
        appElements.monthFilter.style.display = 'inline-flex';
        appElements.uploadBtn.style.display = 'inline-flex';
        
        // Exibir informações de status
        document.querySelector('.status-info').style.display = 'flex';
        
        // Carregar documentos da categoria
        loadDocumentsByCategory(currentCategory, currentMonth);
      }
    });
  });
  
  appElements.monthFilter.addEventListener('change', () => {
    currentMonth = parseInt(appElements.monthFilter.value);
    loadDocumentsByCategory(currentCategory, currentMonth);
  });
  
  // Eventos de modal
  appElements.uploadBtn.addEventListener('click', openUploadModal);
  modalElements.cancelBtn.addEventListener('click', closeUploadModal);
  modalElements.closeBtn.addEventListener('click', closeUploadModal);
  modalElements.confirmBtn.addEventListener('click', uploadDocument);
  
  // Evento para abrir modal de configuração
  appElements.configBtn.addEventListener('click', openConfigModal);
  configModalElements.closeBtn.addEventListener('click', closeConfigModal);
  configModalElements.saveBtn.addEventListener('click', saveConfig);
  
  // Alternar exibição da seleção de semana e atualizar as opções
  modalElements.category.addEventListener('change', updateWeekOptions);
  modalElements.month.addEventListener('change', updateWeekOptions);
  
  // Inicializar configurações
  async function initializeConfig() {
    try {
      // Verificar se existem configurações salvas no Firestore
      const configDoc = await db.collection('config').doc('weeksPerMonth').get();
      
      if (configDoc.exists) {
        // Garantir que apenas os meses válidos estejam nas configurações
        const savedConfig = configDoc.data();
        weeksPerMonth = {};
        
        // Usar apenas os meses válidos (3-12)
        VALID_MONTHS.forEach(month => {
          weeksPerMonth[month] = savedConfig[month] || 4; // Valor padrão é 4 semanas
        });
      } else {
        // Se não existir, criar configuração padrão apenas com meses válidos
        await db.collection('config').doc('weeksPerMonth').set(weeksPerMonth);
      }
    } catch (error) {
      console.error('Erro ao inicializar configurações:', error);
    }
  }
  
  // Função para carregar todos os documentos
  async function loadDocuments() {
    try {
      // Inicializar configurações
      await initializeConfig();
      
      // Definir mês atual no filtro (certificando que é um mês válido)
      const currentDate = new Date();
      let currentMonthFromDate = currentDate.getMonth() + 1;
      
      // Se o mês atual for janeiro ou fevereiro, usar março como padrão
      if (currentMonthFromDate < 3) {
        currentMonthFromDate = 3;
      }
      
      // Atualizar o mês atual e o filtro
      currentMonth = currentMonthFromDate;
      appElements.monthFilter.value = currentMonth;
      
      // Atualizar nome do usuário
      if (auth.currentUser) {
        appElements.userName.textContent = auth.currentUser.email;
      }
      
      // Definir dashboard como categoria inicial
      currentCategory = 'dashboard';
      
      // Atualizar classes na navegação
      appElements.categoryItems.forEach(item => {
        item.classList.remove('active');
      });
      
      const dashboardItem = document.querySelector('li[data-category="dashboard"]');
      if (dashboardItem) {
        dashboardItem.classList.add('active');
      }
      
      // Esconder elementos de documentos
      appElements.documentContainer.style.display = 'none';
      appElements.monthFilter.style.display = 'none';
      appElements.uploadBtn.style.display = 'none';
      appElements.calendarContainer.style.display = 'none';
      appElements.addEventBtn.style.display = 'none';
      
      // Mostrar dashboard
      document.getElementById('dashboard-container').style.display = 'block';
      
      // Ocultar informações de status
      document.querySelector('.status-info').style.display = 'none';
      
      // Atualizar título
      appElements.categoryTitle.textContent = 'DASHBOARD';
      
      // Atualizar dashboard
      if (typeof updateDashboard === 'function') {
        updateDashboard(true);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  }
  
  // Função para carregar documentos por categoria e mês
  async function loadDocumentsByCategory(category, month) {
    try {
      appElements.documentList.innerHTML = '';
      const categoryKey = getCategoryKey(category);
      const categoryInfo = DOCUMENT_TYPES[categoryKey];
      
      // Se for a categoria de calendário ou dashboard, não fazer nada
      if (category === 'calendario' || category === 'dashboard') {
        return;
      }
      
      // Verificar se é um documento anual (QTA) e se deve ser exibido no mês atual
      if (categoryInfo.annual && categoryInfo.visibleMonths && !categoryInfo.visibleMonths.includes(month)) {
        // Se for QTA e o mês atual não for visível, não exibir nada
        return;
      }
      
      // Criar a consulta base
      let query = db.collection('documents').where('category', '==', category);
      
      // Para documentos anuais como QTA, não filtrar por mês
      if (!categoryInfo.annual) {
        query = query.where('month', '==', month);
      }
      
      // Executar a consulta
      const snapshot = await query.get();
      
      const documents = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Para documentos anuais, considerar apenas um documento para o ano atual
        if (categoryInfo.annual && data.year !== 2025) {
          return;
        }
        
        if (categoryInfo.needsWeek) {
          documents[data.week] = { ...data, id: doc.id };
        } else {
          documents[1] = { ...data, id: doc.id };
        }
      });
      
      // Verificar quantidade esperada de documentos
      let expectedCount = categoryInfo.monthlyCount;
      
      // Para categorias que usam semanas, limitar ao número de semanas configurado para o mês
      if (categoryInfo.needsWeek) {
        expectedCount = Math.min(expectedCount, weeksPerMonth[month]);
      }
      
      // Criar linhas da tabela
      if (expectedCount > 0) {
        if (categoryInfo.needsWeek) {
          // Documentos que precisam de semana (AULAS, QTS, Plano de Sessão)
          for (let week = 1; week <= expectedCount; week++) {
            const doc = documents[week];
            createDocumentRow(category, month, week, doc);
          }
        } else {
          // Documentos sem semana (QTM, QTA, Relatório Mensal)
          createDocumentRow(category, month, null, documents[1]);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar documentos por categoria:', error);
    }
  }
  
  // Função para criar linha de documento na tabela
  function createDocumentRow(category, month, week, doc) {
    const row = doc ? createExistingDocumentRow(doc) : createEmptyDocumentRow(category, month, week);
    appElements.documentList.appendChild(row);
  }
  
  // Função para criar linha de documento existente
  function createExistingDocumentRow(doc) {
    const tr = document.createElement('tr');
    
    const categoryKey = getCategoryKey(doc.category);
    const categoryInfo = DOCUMENT_TYPES[categoryKey];
    
    // Criar nome do documento
    let documentName = categoryInfo.name;
    if (categoryInfo.needsWeek && doc.week) {
      documentName += ` - ${doc.week}ª SEMANA`;
    }
    
    // Para documentos anuais, não incluir o mês no nome
    if (categoryInfo.annual) {
      documentName += ` - ${doc.year || '2025'}`;
    } else {
      documentName += ` - ${MONTH_NAMES[doc.month - 1]}`;
    }
    
    tr.innerHTML = `
      <td>${documentName}</td>
      <td>${formatDate(doc.uploadDate)}</td>
      <td><span class="status-badge complete">Completo</span></td>
      <td class="table-actions">
        <button class="action-btn view-btn" data-id="${doc.id}" data-url="${doc.fileUrl}">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn download-btn" data-id="${doc.id}" data-url="${doc.fileUrl}">
          <i class="fas fa-download"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${doc.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    // Adicionar eventos aos botões
    tr.querySelector('.view-btn').addEventListener('click', () => viewDocument(doc.fileUrl));
    tr.querySelector('.download-btn').addEventListener('click', () => downloadDocument(doc.fileUrl, documentName));
    tr.querySelector('.delete-btn').addEventListener('click', () => deleteDocument(doc.id));
    
    return tr;
  }
  
  // Função para criar linha de documento vazio
  function createEmptyDocumentRow(category, month, week) {
    const tr = document.createElement('tr');
    
    const categoryKey = getCategoryKey(category);
    const categoryInfo = DOCUMENT_TYPES[categoryKey];
    
    // Criar nome do documento
    let documentName = categoryInfo.name;
    if (categoryInfo.needsWeek && week) {
      documentName += ` - ${week}ª SEMANA`;
    }
    
    // Para documentos anuais, não incluir o mês no nome
    if (categoryInfo.annual) {
      documentName += ` - 2025`;
    } else {
      documentName += ` - ${MONTH_NAMES[month - 1]}`;
    }
    
    // Determinar status (pendente ou atrasado)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    let status = 'pending';
    let statusText = 'Pendente';
    
    // Verificar se está atrasado
    if (categoryInfo.annual) {
      // Para documentos anuais, verificar se o ano é anterior ao atual
      if (2025 < currentYear) {
        status = 'overdue';
        statusText = 'Atrasado';
      }
    } else {
      // Para documentos mensais, verificar se o mês/ano é anterior ao atual
      if (2025 < currentYear || (2025 === currentYear && month < currentMonth)) {
        status = 'overdue';
        statusText = 'Atrasado';
      }
    }
    
    tr.innerHTML = `
      <td>${documentName}</td>
      <td>-</td>
      <td><span class="status-badge ${status}">${statusText}</span></td>
      <td class="table-actions">
        <button class="btn btn-outline upload-missing-btn" data-category="${category}" data-month="${month}" data-week="${week || ''}">
          <i class="fas fa-upload"></i> Upload
        </button>
      </td>
    `;
    
    // Adicionar evento ao botão de upload
    tr.querySelector('.upload-missing-btn').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const category = btn.getAttribute('data-category');
      const month = parseInt(btn.getAttribute('data-month'));
      const week = btn.getAttribute('data-week') ? parseInt(btn.getAttribute('data-week')) : null;
      
      openUploadModal(category, month, week);
    });
    
    return tr;
  }
  
  // Função para atualizar as opções de semana no modal de upload
  function updateWeekOptions() {
    const category = modalElements.category.value;
    const month = parseInt(modalElements.month.value);
    const categoryKey = getCategoryKey(category);
    const categoryInfo = DOCUMENT_TYPES[categoryKey];
    
    // Verificar se a categoria precisa de semana
    modalElements.weekContainer.style.display = categoryInfo.needsWeek ? 'block' : 'none';
    
    // Habilitar/desabilitar o seletor de mês para documentos anuais
    modalElements.month.disabled = categoryInfo.annual;
    
    // Se for documento anual, definir um mês visível padrão (Março)
    if (categoryInfo.annual && categoryInfo.visibleMonths) {
      modalElements.month.value = categoryInfo.visibleMonths[0]; // Usar o primeiro mês visível (Março)
    }
    
    if (categoryInfo.needsWeek) {
      // Limpar opções atuais
      modalElements.week.innerHTML = '';
      
      // Adicionar opções baseadas no número de semanas configurado para o mês
      const numWeeks = weeksPerMonth[month];
      for (let i = 1; i <= numWeeks; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i}ª Semana`;
        modalElements.week.appendChild(option);
      }
    }
  }
  
  // Função para abrir modal de upload
  function openUploadModal(category, month, week) {
    if (typeof category === 'object') {
      // Se for chamado como evento de clique
      category = currentCategory;
      month = currentMonth;
      week = null;
    }
    
    const categoryKey = getCategoryKey(category);
    const categoryInfo = DOCUMENT_TYPES[categoryKey];
    
    // Se for um documento anual (QTA) e o mês atual não for visível
    if (categoryInfo.annual && categoryInfo.visibleMonths && !categoryInfo.visibleMonths.includes(month)) {
      // Definir um mês visível padrão (Março)
      month = categoryInfo.visibleMonths[0];
    }
    
    // Configurar valores do modal
    modalElements.category.value = category;
    modalElements.month.value = month;
    
    // Atualizar opções de semana
    updateWeekOptions();
    
    // Se uma semana específica foi solicitada
    if (week) {
      modalElements.week.value = week;
    }
    
    // Exibir modal
    modalElements.modal.style.display = 'block';
  }
  
  // Função para fechar modal de upload
  function closeUploadModal() {
    modalElements.modal.style.display = 'none';
    modalElements.file.value = '';
  }
  
  // Função para abrir modal de configuração
  function openConfigModal() {
    // Atualizar campos com a configuração atual
    configModalElements.month.value = currentMonth;
    configModalElements.weeks.value = weeksPerMonth[currentMonth];
    
    // Exibir modal
    configModalElements.modal.style.display = 'block';
  }
  
  // Função para fechar modal de configuração
  function closeConfigModal() {
    configModalElements.modal.style.display = 'none';
  }
  
  // Função para salvar configurações
  async function saveConfig() {
    try {
      const month = parseInt(configModalElements.month.value);
      const weeks = parseInt(configModalElements.weeks.value);
      
      // Garantir que é um mês válido (3-12)
      if (!VALID_MONTHS.includes(month)) {
        alert('Mês inválido. Selecione um mês de março a dezembro.');
        return;
      }
      
      // Atualizar configuração local
      weeksPerMonth[month] = weeks;
      
      // Salvar no Firestore
      await db.collection('config').doc('weeksPerMonth').set(weeksPerMonth);
      
      // Fechar modal e recarregar se necessário
      closeConfigModal();
      
      // Se o mês configurado for o mês atual exibido, recarregar documentos
      if (month === currentMonth) {
        loadDocumentsByCategory(currentCategory, currentMonth);
      }
      
      alert(`Configuração salva: ${MONTH_NAMES[month - 1]} agora tem ${weeks} semanas.`);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração.');
    }
  }
  
  // Função para fazer upload de documento
  async function uploadDocument() {
    try {
      const file = modalElements.file.files[0];
      if (!file) {
        alert('Por favor, selecione um arquivo.');
        return;
      }
      
      const category = modalElements.category.value;
      const month = parseInt(modalElements.month.value);
      const categoryKey = getCategoryKey(category);
      const categoryInfo = DOCUMENT_TYPES[categoryKey];
      const needsWeek = categoryInfo.needsWeek;
      const isAnnual = categoryInfo.annual;
      const week = needsWeek ? parseInt(modalElements.week.value) : null;
      
      // Verificar se o mês é válido (3-12)
      if (!VALID_MONTHS.includes(month)) {
        alert('Mês inválido. Selecione um mês de março a dezembro.');
        return;
      }
      
      // Verificar se o mês é válido para documentos anuais (QTA)
      if (isAnnual && categoryInfo.visibleMonths && !categoryInfo.visibleMonths.includes(month)) {
        alert('Este documento não está disponível para o mês selecionado.');
        return;
      }
      
      // Consulta base para verificar documentos existentes
      let queryRef = db.collection('documents')
        .where('category', '==', category);
      
      // Adicionar filtros adicionais dependendo do tipo de documento
      if (isAnnual) {
        // Para documentos anuais, filtrar apenas pelo ano
        queryRef = queryRef.where('year', '==', 2025);
      } else {
        // Para documentos mensais, filtrar pelo mês
        queryRef = queryRef.where('month', '==', month);
        
        // Se precisar de semana, filtrar por semana também
        if (needsWeek) {
          queryRef = queryRef.where('week', '==', week);
        }
      }
      
      const querySnapshot = await queryRef.get();
      
      if (!querySnapshot.empty) {
        const confirmOverwrite = confirm('Já existe um documento para esta categoria' + 
                                        (isAnnual ? '/ano' : '/mês' + 
                                        (needsWeek ? '/semana' : '')) + 
                                        '. Deseja substituí-lo?');
        if (!confirmOverwrite) return;
        
        // Excluir documento existente
        const docId = querySnapshot.docs[0].id;
        const fileUrl = querySnapshot.docs[0].data().fileUrl;
        
        // Remover do Storage
        const fileRef = storage.refFromURL(fileUrl);
        await fileRef.delete();
        
        // Remover do Firestore
        await db.collection('documents').doc(docId).delete();
      }
      
      // Criar nome do arquivo
      let fileName = DOCUMENT_TYPES[categoryKey].name;
      if (needsWeek) {
        fileName += `_${week}a_SEMANA`;
      }
      
      if (isAnnual) {
        fileName += `_2025`;
      } else {
        fileName += `_${MONTH_NAMES[month - 1]}_2025`;
      }
      
      // Caminho no Storage baseado no tipo de documento
      let storagePath;
      if (isAnnual) {
        storagePath = `documents/${category}/2025/${fileName}.${file.name.split('.').pop()}`;
      } else {
        storagePath = `documents/${category}/${month}/${fileName}.${file.name.split('.').pop()}`;
      }
      
      const storageRef = storage.ref(storagePath);
      
      // Upload do arquivo
      const uploadTask = storageRef.put(file);
      
      // Monitorar progresso do upload
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress}%`);
        },
        (error) => {
          console.error('Erro no upload:', error);
          alert('Erro ao fazer upload do arquivo.');
        },
        async () => {
          // Upload completado com sucesso
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          
          // Preparar dados para o Firestore
          const docData = {
            category,
            fileUrl: downloadURL,
            fileName: file.name,
            uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
            uploadedBy: auth.currentUser.uid
          };
          
          // Adicionar campos específicos por tipo
          if (isAnnual) {
            docData.year = 2025;
          } else {
            docData.month = month;
            if (needsWeek) {
              docData.week = week;
            }
          }
          
          // Salvar no Firestore
          await db.collection('documents').add(docData);
          
          // Fechar modal e recarregar documentos
          closeUploadModal();
          loadDocumentsByCategory(currentCategory, currentMonth);
        }
      );
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao processar o upload.');
    }
  }
  
  // Função para visualizar documento
  function viewDocument(url) {
    window.open(url, '_blank');
  }
  
  // Função para baixar documento
  function downloadDocument(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  // Função para excluir documento
  async function deleteDocument(id) {
    try {
      const confirmDelete = confirm('Tem certeza que deseja excluir este documento?');
      if (!confirmDelete) return;
      
      // Obter referência do documento
      const docRef = db.collection('documents').doc(id);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const fileUrl = doc.data().fileUrl;
        
        // Excluir arquivo do Storage
        const fileRef = storage.refFromURL(fileUrl);
        await fileRef.delete();
        
        // Excluir documento do Firestore
        await docRef.delete();
        
        // Recarregar documentos
        loadDocumentsByCategory(currentCategory, currentMonth);
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro ao excluir o documento.');
    }
  }
  
  // Função auxiliar para obter a chave da categoria
  function getCategoryKey(categoryId) {
    const keys = Object.keys(DOCUMENT_TYPES);
    for (const key of keys) {
      if (DOCUMENT_TYPES[key].id === categoryId) {
        return key;
      }
    }
    return null;
  }
  
  // Função auxiliar para formatar data
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
  
  // Inicializar o mês atual no filtro (garantindo que seja um mês válido)
  document.addEventListener('DOMContentLoaded', () => {
    let currentDateMonth = new Date().getMonth() + 1;
    if (currentDateMonth < 3) {
      currentDateMonth = 3; // Definir março como padrão se for janeiro ou fevereiro
    }
    
    currentMonth = currentDateMonth;
    appElements.monthFilter.value = currentMonth;
  });