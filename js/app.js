// app.js
// Constantes para categorias de documentos
const DOCUMENT_TYPES = {
    AULAS: {
      id: 'aulas',
      name: 'AULAS',
      icon: 'fas fa-chalkboard-teacher',
      monthlyCount: 5,  // Alterado de 1 para 5
      needsWeek: true   // Alterado de false para true
    },
    PLANO_DE_SESSAO: {
      id: 'plano-de-sessao',
      name: 'PLANO DE SESSÃO',
      icon: 'fas fa-clipboard-list',
      monthlyCount: 5,  // Alterado de 4 para 5
      needsWeek: true
    },
    QTA: {
      id: 'qta',
      name: 'QTA',
      icon: 'fas fa-file-alt',
      monthlyCount: 0, // anual - 1 por ano
      needsWeek: false
    },
    QTM: {
      id: 'qtm',
      name: 'QTM',
      icon: 'fas fa-calendar-alt',
      monthlyCount: 1,
      needsWeek: false
    },
    QTS: {
      id: 'qts',
      name: 'QTS',
      icon: 'fas fa-tasks',
      monthlyCount: 5,  // Alterado de 4 para 5
      needsWeek: true
    },
    RELATORIO_MENSAL: {
      id: 'relatorio-mensal',
      name: 'RELATÓRIO MENSAL',
      icon: 'fas fa-chart-bar',
      monthlyCount: 1,
      needsWeek: false
    }
  };
  
  // Nomes dos meses
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Estado da aplicação
  let currentUser = null;
  let currentCategory = DOCUMENT_TYPES.AULAS.id;
  let currentMonth = new Date().getMonth() + 1; // Mês atual (1-12)
  
  // Elementos DOM
  const loginForm = {
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn')
  };
  
  const appElements = {
    userName: document.getElementById('user-name'),
    logoutBtn: document.getElementById('logout-btn'),
    categoryTitle: document.getElementById('category-title'),
    monthFilter: document.getElementById('month-filter'),
    uploadBtn: document.getElementById('upload-btn'),
    documentList: document.getElementById('document-list'),
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
      appElements.categoryTitle.textContent = DOCUMENT_TYPES[getCategoryKey(currentCategory)].name;
      
      // Carregar documentos da categoria
      loadDocumentsByCategory(currentCategory, currentMonth);
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
  
  // Alternar exibição da seleção de semana
  modalElements.category.addEventListener('change', () => {
    const categoryKey = getCategoryKey(modalElements.category.value);
    modalElements.weekContainer.style.display = 
      DOCUMENT_TYPES[categoryKey].needsWeek ? 'block' : 'none';
  });
  
  // Função para carregar todos os documentos
  async function loadDocuments() {
    try {
      // Definir mês atual no filtro
      appElements.monthFilter.value = currentMonth;
      
      // Carregar documentos da categoria atual
      loadDocumentsByCategory(currentCategory, currentMonth);
      
      // Atualizar nome do usuário
      if (auth.currentUser) {
        appElements.userName.textContent = auth.currentUser.email;
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
      
      // Obter documentos existentes
      const snapshot = await db.collection('documents')
        .where('category', '==', category)
        .where('month', '==', month)
        .get();
      
      const documents = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (categoryInfo.needsWeek) {
          documents[data.week] = { ...data, id: doc.id };
        } else {
          documents[1] = { ...data, id: doc.id };
        }
      });
      
      // Verificar quantidade esperada de documentos
      let expectedCount = categoryInfo.monthlyCount;
      
      // Para QTA, só verificamos uma vez por ano, no mês de Janeiro
      if (categoryKey === 'QTA') {
        expectedCount = month === 1 ? 1 : 0;
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
          // Documentos sem semana (QTM, Relatório Mensal)
          createDocumentRow(category, month, null, documents[1]);
        }
      } else if (categoryKey === 'QTA' && month === 1) {
        // QTA é anual, só mostramos em Janeiro
        createDocumentRow(category, month, null, documents[1]);
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
    documentName += ` - ${MONTH_NAMES[doc.month - 1]}`;
    
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
    documentName += ` - ${MONTH_NAMES[month - 1]}`;
    
    // Determinar status (pendente ou atrasado)
    const currentDate = new Date();
    const documentMonth = month - 1; // Mês no JavaScript é 0-11
    const documentYear = 2025; // Ano fixo para este exemplo
    
    let status = 'pending';
    let statusText = 'Pendente';
    
    // Se o mês/ano do documento for anterior ao atual, está atrasado
    if (documentYear < currentDate.getFullYear() || 
        (documentYear === currentDate.getFullYear() && documentMonth < currentDate.getMonth())) {
      status = 'overdue';
      statusText = 'Atrasado';
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
  
  // Função para abrir modal de upload
  function openUploadModal(category, month, week) {
    if (typeof category === 'object') {
      // Se for chamado como evento de clique
      category = currentCategory;
      month = currentMonth;
      week = null;
    }
    
    // Configurar valores do modal
    modalElements.category.value = category;
    modalElements.month.value = month;
    
    // Verificar se a categoria precisa de semana
    const categoryKey = getCategoryKey(category);
    const needsWeek = DOCUMENT_TYPES[categoryKey].needsWeek;
    modalElements.weekContainer.style.display = needsWeek ? 'block' : 'none';
    
    if (needsWeek && week) {
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
      const needsWeek = DOCUMENT_TYPES[categoryKey].needsWeek;
      const week = needsWeek ? parseInt(modalElements.week.value) : null;
      
      // Verificar se já existe documento para esta categoria/mês/semana
      const querySnapshot = await db.collection('documents')
        .where('category', '==', category)
        .where('month', '==', month)
        .where('week', '==', week)
        .get();
      
      if (!querySnapshot.empty) {
        const confirmOverwrite = confirm('Já existe um documento para esta categoria/mês/semana. Deseja substituí-lo?');
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
      fileName += `_${MONTH_NAMES[month - 1]}_2025`;
      
      // Caminho no Storage
      const storagePath = `documents/${category}/${month}/${fileName}.${file.name.split('.').pop()}`;
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
          
          // Salvar informações no Firestore
          const docData = {
            category,
            month,
            week,
            fileUrl: downloadURL,
            fileName: file.name,
            uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
            uploadedBy: auth.currentUser.uid
          };
          
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
  
  // Inicializar o mês atual no filtro
  document.addEventListener('DOMContentLoaded', () => {
    appElements.monthFilter.value = currentMonth;
  });