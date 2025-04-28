// livro-ordens.js - Script para gerenciar o Livro de Ordens

// Variáveis globais
let currentOrdemId = null;
let isEditMode = false;

// Elementos DOM
const ordemElements = {
  container: document.getElementById('livro-ordens-container'),
  list: document.getElementById('livro-ordens-list'),
  uploadBtn: document.getElementById('upload-ordem-btn')
};

const ordemModalElements = {
  modal: document.getElementById('ordem-modal'),
  title: document.getElementById('ordem-modal-title'),
  nome: document.getElementById('ordem-nome'),
  data: document.getElementById('ordem-data'),
  fileContainer: document.getElementById('ordem-file-container'),
  file: document.getElementById('ordem-file'),
  cancelBtn: document.getElementById('cancel-ordem'),
  saveBtn: document.getElementById('save-ordem'),
  closeBtn: document.querySelector('.close-ordem-modal')
};

// Inicializar eventos quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se os elementos existem
  if (!ordemElements.uploadBtn || !ordemModalElements.modal) return;

  // Botão de upload
  ordemElements.uploadBtn.addEventListener('click', openOrdemModal);

  // Fechar modal
  if (ordemModalElements.closeBtn) {
    ordemModalElements.closeBtn.addEventListener('click', closeOrdemModal);
  }

  // Botão de cancelar
  if (ordemModalElements.cancelBtn) {
    ordemModalElements.cancelBtn.addEventListener('click', closeOrdemModal);
  }

  // Botão de salvar
  if (ordemModalElements.saveBtn) {
    ordemModalElements.saveBtn.addEventListener('click', saveOrdem);
  }

  // Adicionar evento para a categoria de Livro de Ordens
  const livroOrdensCategory = document.querySelector('li[data-category="livro-de-ordens"]');
  if (livroOrdensCategory) {
    livroOrdensCategory.addEventListener('click', function() {
      // Atualizar o título da página
      const categoryTitle = document.getElementById('category-title');
      if (categoryTitle) {
        categoryTitle.textContent = 'LIVRO DE ORDENS';
      }

      // Ocultar outros containers
      const dashboardContainer = document.getElementById('dashboard-container');
      const documentContainer = document.getElementById('document-container');
      const calendarContainer = document.getElementById('calendar-container');

      if (dashboardContainer) dashboardContainer.style.display = 'none';
      if (documentContainer) documentContainer.style.display = 'none';
      if (calendarContainer) calendarContainer.style.display = 'none';

      // Exibir container do Livro de Ordens
      if (ordemElements.container) ordemElements.container.style.display = 'block';

      // Ocultar filtro de mês e botões não relacionados
      const monthFilter = document.getElementById('month-filter');
      const uploadBtn = document.getElementById('upload-btn');
      const addEventBtn = document.getElementById('add-event-btn');

      if (monthFilter) monthFilter.style.display = 'none';
      if (uploadBtn) uploadBtn.style.display = 'none';
      if (addEventBtn) addEventBtn.style.display = 'none';

      // Exibir botão de upload específico para Livro de Ordens
      if (ordemElements.uploadBtn) ordemElements.uploadBtn.style.display = 'inline-flex';

      // Carregar documentos do Livro de Ordens
      loadOrdens();
    });
  }
});

// Função para carregar documentos do Livro de Ordens
async function loadOrdens() {
  try {
    if (!ordemElements.list) return;
    
    // Limpar lista atual
    ordemElements.list.innerHTML = '';
    
    // Consultar documentos do tipo "livro-de-ordens"
    const snapshot = await db.collection('livro-ordens')
      .orderBy('data', 'desc')
      .get();
    
    if (snapshot.empty) {
      // Sem documentos para exibir
      ordemElements.list.innerHTML = `
        <tr>
          <td colspan="3" class="empty-list-message">
            Nenhum documento encontrado no Livro de Ordens.
          </td>
        </tr>
      `;
      return;
    }
    
    // Adicionar cada documento à tabela
    snapshot.forEach(doc => {
      const data = doc.data();
      const tr = createOrdemRow(doc.id, data);
      ordemElements.list.appendChild(tr);
    });
    
  } catch (error) {
    console.error('Erro ao carregar Livro de Ordens:', error);
    alert('Erro ao carregar documentos do Livro de Ordens.');
  }
}

// Função para criar linha na tabela de ordens
function createOrdemRow(id, ordem) {
  const tr = document.createElement('tr');
  
  // Formatar data
  let dataFormatada = '-';
  if (ordem.data) {
    const data = new Date(ordem.data);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    dataFormatada = `${dia}/${mes}/${ano}`;
  }
  
  tr.innerHTML = `
    <td>${ordem.nome || 'Documento sem nome'}</td>
    <td>${dataFormatada}</td>
    <td class="table-actions">
      <button class="action-btn view-btn" data-id="${id}" data-url="${ordem.fileUrl}">
        <i class="fas fa-eye"></i>
      </button>
      <button class="action-btn edit-btn" data-id="${id}">
        <i class="fas fa-edit"></i>
      </button>
      <button class="action-btn download-btn" data-id="${id}" data-url="${ordem.fileUrl}">
        <i class="fas fa-download"></i>
      </button>
      <button class="action-btn delete-btn" data-id="${id}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  // Adicionar eventos aos botões
  tr.querySelector('.view-btn').addEventListener('click', (e) => {
    const url = e.currentTarget.getAttribute('data-url');
    if (url) window.open(url, '_blank');
  });
  
  tr.querySelector('.edit-btn').addEventListener('click', (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    openOrdemModal(id);
  });
  
  tr.querySelector('.download-btn').addEventListener('click', (e) => {
    const url = e.currentTarget.getAttribute('data-url');
    const nome = ordem.nome || 'documento';
    if (url) downloadOrdem(url, nome);
  });
  
  tr.querySelector('.delete-btn').addEventListener('click', (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    if (id) deleteOrdem(id);
  });
  
  return tr;
}

// Função para abrir o modal de upload/edição
async function openOrdemModal(ordemId) {
  if (!ordemModalElements.modal) return;
  
  // Resetar valores
  ordemModalElements.nome.value = '';
  ordemModalElements.data.value = '';
  ordemModalElements.file.value = '';
  currentOrdemId = null;
  isEditMode = false;
  
  // Definir data atual como valor padrão
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  ordemModalElements.data.value = `${year}-${month}-${day}`;
  
  // Verificar se é edição
  if (typeof ordemId === 'string') {
    isEditMode = true;
    currentOrdemId = ordemId;
    ordemModalElements.title.textContent = 'Editar Documento';
    ordemModalElements.fileContainer.style.display = 'none'; // Esconder campo de arquivo na edição
    
    try {
      // Buscar informações do documento
      const doc = await db.collection('livro-ordens').doc(ordemId).get();
      
      if (doc.exists) {
        const data = doc.data();
        
        // Preencher campos
        ordemModalElements.nome.value = data.nome || '';
        
        // Converter data para formato do input
        if (data.data) {
          const dataObj = new Date(data.data);
          const year = dataObj.getFullYear();
          const month = String(dataObj.getMonth() + 1).padStart(2, '0');
          const day = String(dataObj.getDate()).padStart(2, '0');
          ordemModalElements.data.value = `${year}-${month}-${day}`;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
    }
  } else {
    // Novo documento
    ordemModalElements.title.textContent = 'Upload de Documento';
    ordemModalElements.fileContainer.style.display = 'block'; // Mostrar campo de arquivo
  }
  
  // Exibir modal
  ordemModalElements.modal.style.display = 'block';
}

// Função para fechar o modal
function closeOrdemModal() {
  if (!ordemModalElements.modal) return;
  ordemModalElements.modal.style.display = 'none';
}

// Função para salvar documento
async function saveOrdem() {
  try {
    const nome = ordemModalElements.nome.value.trim();
    const data = ordemModalElements.data.value;
    
    if (!nome) {
      alert('Por favor, informe o nome do documento.');
      return;
    }
    
    if (!data) {
      alert('Por favor, selecione a data do documento.');
      return;
    }
    
    // Se for edição
    if (isEditMode && currentOrdemId) {
      await db.collection('livro-ordens').doc(currentOrdemId).update({
        nome,
        data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      closeOrdemModal();
      loadOrdens();
      return;
    }
    
    // Se for novo documento
    const file = ordemModalElements.file.files[0];
    if (!file) {
      alert('Por favor, selecione um arquivo.');
      return;
    }
    
    // Criar nome de arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `livro-ordens/${Date.now()}_${nome.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`;
    
    // Upload do arquivo
    const storageRef = storage.ref(fileName);
    const uploadTask = storageRef.put(file);
    
    // Monitorar progresso
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
        // Upload concluído com sucesso
        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
        
        // Salvar no Firestore
        await db.collection('livro-ordens').add({
          nome,
          data,
          fileName: file.name,
          fileUrl: downloadURL,
          uploadedBy: auth.currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeOrdemModal();
        loadOrdens();
      }
    );
    
  } catch (error) {
    console.error('Erro ao salvar documento:', error);
    alert('Erro ao salvar o documento.');
  }
}

// Função para baixar documento
function downloadOrdem(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Função para excluir documento
async function deleteOrdem(id) {
  try {
    const confirmDelete = confirm('Tem certeza que deseja excluir este documento?');
    if (!confirmDelete) return;
    
    // Obter referência do documento
    const docRef = db.collection('livro-ordens').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const fileUrl = doc.data().fileUrl;
      
      // Excluir arquivo do Storage
      if (fileUrl) {
        const fileRef = storage.refFromURL(fileUrl);
        await fileRef.delete();
      }
      
      // Excluir documento do Firestore
      await docRef.delete();
      
      // Recarregar lista
      loadOrdens();
    }
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    alert('Erro ao excluir o documento.');
  }
}