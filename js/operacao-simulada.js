// operacao-simulada.js - Script para gerenciar a Operação Simulada

// Variáveis globais
let currentOperacaoId = null;
let isOperacaoEditMode = false; // Renomeada para evitar conflitos

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Adicionar evento para a categoria Operação Simulada
  setupOperacaoSimuladaEvents();
});

// Configurar os eventos da aba Operação Simulada
function setupOperacaoSimuladaEvents() {
  // Obter referência ao item da barra lateral
  const operacaoSimuladaItem = document.querySelector('li[data-category="operacao-simulada"]');
  
  if (operacaoSimuladaItem) {
    // Adicionar evento de clique ao item da barra lateral
    operacaoSimuladaItem.addEventListener('click', function() {
      // Atualizar a categoria ativa no menu
      const allCategoryItems = document.querySelectorAll('.category-list li');
      allCategoryItems.forEach(item => item.classList.remove('active'));
      operacaoSimuladaItem.classList.add('active');
      
      // Atualizar o título da página
      const categoryTitle = document.getElementById('category-title');
      if (categoryTitle) {
        categoryTitle.textContent = 'OPERAÇÃO SIMULADA';
      }
      
      // Ocultar outros containers
      hideAllContainers();
      
      // Mostrar o container da operação simulada
      const operacaoContainer = document.getElementById('operacao-simulada-container');
      if (operacaoContainer) {
        operacaoContainer.style.display = 'block';
      }
      
      // Mostrar o botão de upload específico
      const uploadOperacaoBtn = document.getElementById('upload-operacao-btn');
      if (uploadOperacaoBtn) {
        uploadOperacaoBtn.style.display = 'inline-flex';
      }
      
      // Carregar documentos da operação simulada
      loadOperacoes();
    });
  }
  
  // Evento para o botão de upload
  const uploadOperacaoBtn = document.getElementById('upload-operacao-btn');
  if (uploadOperacaoBtn) {
    uploadOperacaoBtn.addEventListener('click', openOperacaoModal);
  }
  
  // Eventos para o modal
  const closeOperacaoModalBtn = document.querySelector('.close-operacao-modal');
  if (closeOperacaoModalBtn) {
    closeOperacaoModalBtn.addEventListener('click', closeOperacaoModal);
  }
  
  const cancelOperacaoBtn = document.getElementById('cancel-operacao');
  if (cancelOperacaoBtn) {
    cancelOperacaoBtn.addEventListener('click', closeOperacaoModal);
  }
  
  const saveOperacaoBtn = document.getElementById('save-operacao');
  if (saveOperacaoBtn) {
    saveOperacaoBtn.addEventListener('click', saveOperacao);
  }
  
  // Adicionar eventos para outros itens da navegação para ocultar o container da operação simulada
  const otherCategories = document.querySelectorAll('.category-list li:not([data-category="operacao-simulada"])');
  otherCategories.forEach(item => {
    item.addEventListener('click', function() {
      // Ocultar o container da operação simulada
      const operacaoContainer = document.getElementById('operacao-simulada-container');
      if (operacaoContainer) {
        operacaoContainer.style.display = 'none';
      }
      
      // Ocultar o botão de upload específico
      const uploadOperacaoBtn = document.getElementById('upload-operacao-btn');
      if (uploadOperacaoBtn) {
        uploadOperacaoBtn.style.display = 'none';
      }
    });
  });
}

// Função para carregar documentos da Operação Simulada
async function loadOperacoes() {
  // Obter referência à lista de documentos
  const operacaoList = document.getElementById('operacao-simulada-list');
  
  if (!operacaoList) {
    console.error('Erro: Elemento operacao-simulada-list não encontrado.');
    return;
  }
  
  // Limpar lista atual
  operacaoList.innerHTML = '';
  
  try {
    // Verificar se o Firestore está disponível
    if (typeof db === 'undefined') {
      console.error('Erro: Firebase não está disponível.');
      operacaoList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            Erro ao carregar documentos. Firebase não está disponível.
          </td>
        </tr>
      `;
      return;
    }
    
    // Consultar documentos da Operação Simulada
    const snapshot = await db.collection('operacao-simulada')
      .orderBy('data', 'desc')
      .get();
    
    // Verificar se há resultados
    if (snapshot.empty) {
      operacaoList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            Nenhum documento encontrado.
          </td>
        </tr>
      `;
      return;
    }
    
    // Adicionar cada documento à tabela
    snapshot.forEach(doc => {
      const data = doc.data();
      const tr = createOperacaoRow(doc.id, data);
      operacaoList.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar documentos:', error);
    operacaoList.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 20px;">
          Erro ao carregar documentos: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Função para criar linha da tabela
function createOperacaoRow(id, operacao) {
  const tr = document.createElement('tr');
  
  // Formatar data
  let dataFormatada = '-';
  if (operacao.data) {
    const data = new Date(operacao.data);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    dataFormatada = `${dia}/${mes}/${ano}`;
  }
  
  tr.innerHTML = `
    <td>${operacao.nome || 'Documento sem nome'}</td>
    <td>${dataFormatada}</td>
    <td class="table-actions">
      <button class="action-btn view-btn" title="Visualizar">
        <i class="fas fa-eye"></i>
      </button>
      <button class="action-btn edit-btn" title="Editar">
        <i class="fas fa-edit"></i>
      </button>
      <button class="action-btn download-btn" title="Baixar">
        <i class="fas fa-download"></i>
      </button>
      <button class="action-btn delete-btn" title="Excluir">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  // Adicionar eventos aos botões
  const viewBtn = tr.querySelector('.view-btn');
  viewBtn.setAttribute('data-id', id);
  viewBtn.setAttribute('data-url', operacao.fileUrl || '');
  viewBtn.addEventListener('click', function() {
    const url = this.getAttribute('data-url');
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('URL do documento não disponível.');
    }
  });
  
  const editBtn = tr.querySelector('.edit-btn');
  editBtn.setAttribute('data-id', id);
  editBtn.addEventListener('click', function() {
    const docId = this.getAttribute('data-id');
    openOperacaoModal(docId);
  });
  
  const downloadBtn = tr.querySelector('.download-btn');
  downloadBtn.setAttribute('data-id', id);
  downloadBtn.setAttribute('data-url', operacao.fileUrl || '');
  downloadBtn.addEventListener('click', function() {
    const url = this.getAttribute('data-url');
    if (url) {
      downloadOperacao(url, operacao.nome || 'documento');
    } else {
      alert('URL do documento não disponível para download.');
    }
  });
  
  const deleteBtn = tr.querySelector('.delete-btn');
  deleteBtn.setAttribute('data-id', id);
  deleteBtn.addEventListener('click', function() {
    const docId = this.getAttribute('data-id');
    deleteOperacao(docId);
  });
  
  return tr;
}

// Função para abrir o modal de upload/edição
async function openOperacaoModal(operacaoId = null) {
  // Obter referências aos elementos do modal
  const modal = document.getElementById('operacao-modal');
  const title = document.getElementById('operacao-modal-title');
  const nomeInput = document.getElementById('operacao-nome');
  const dataInput = document.getElementById('operacao-data');
  const fileContainer = document.getElementById('operacao-file-container');
  const fileInput = document.getElementById('operacao-file');
  
  if (!modal || !title || !nomeInput || !dataInput || !fileContainer) {
    console.error('Erro: Elementos do modal não encontrados.');
    return;
  }
  
  // Limpar campos
  nomeInput.value = '';
  dataInput.value = '';
  if (fileInput) fileInput.value = '';
  
  // Definir valores iniciais
  currentOperacaoId = null;
  isOperacaoEditMode = false; // Usando a variável renomeada
  
  // Definir data atual como padrão
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  dataInput.value = `${year}-${month}-${day}`;
  
  if (operacaoId) {
    // Modo de edição
    isOperacaoEditMode = true; // Usando a variável renomeada
    currentOperacaoId = operacaoId;
    title.textContent = 'Editar Documento';
    fileContainer.style.display = 'none';
    
    try {
      // Buscar dados do documento
      const docRef = db.collection('operacao-simulada').doc(operacaoId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        
        // Preencher campos
        nomeInput.value = data.nome || '';
        
        // Formatar data para o input
        if (data.data) {
          const dataObj = new Date(data.data);
          const year = dataObj.getFullYear();
          const month = String(dataObj.getMonth() + 1).padStart(2, '0');
          const day = String(dataObj.getDate()).padStart(2, '0');
          dataInput.value = `${year}-${month}-${day}`;
        }
      } else {
        console.warn('Documento não encontrado:', operacaoId);
      }
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      alert('Erro ao buscar informações do documento.');
    }
  } else {
    // Modo de novo documento
    title.textContent = 'Upload de Documento';
    fileContainer.style.display = 'block';
  }
  
  // Exibir modal
  modal.style.display = 'block';
}

// Função para fechar o modal
function closeOperacaoModal() {
  const modal = document.getElementById('operacao-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Função para salvar documento
async function saveOperacao() {
  // Obter dados do formulário
  const nomeInput = document.getElementById('operacao-nome');
  const dataInput = document.getElementById('operacao-data');
  const fileInput = document.getElementById('operacao-file');
  
  if (!nomeInput || !dataInput) {
    console.error('Erro: Elementos do formulário não encontrados.');
    return;
  }
  
  const nome = nomeInput.value.trim();
  const data = dataInput.value;
  
  // Validar campos
  if (!nome) {
    alert('Por favor, informe o nome do documento.');
    return;
  }
  
  if (!data) {
    alert('Por favor, selecione a data do documento.');
    return;
  }
  
  // Verificar autenticação
  if (!auth.currentUser) {
    alert('Usuário não autenticado. Por favor, faça login novamente.');
    return;
  }
  
  try {
    // Atualizar documento existente
    if (isOperacaoEditMode && currentOperacaoId) {
      await db.collection('operacao-simulada').doc(currentOperacaoId).update({
        nome: nome,
        data: data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      alert('Documento atualizado com sucesso!');
      closeOperacaoModal();
      loadOperacoes();
      return;
    }
    
    // Upload de novo documento
    const file = fileInput.files[0];
    if (!file) {
      alert('Por favor, selecione um arquivo.');
      return;
    }
    
    // Criar nome de arquivo seguro
    const safeNome = nome.replace(/[^a-z0-9]/gi, '_');
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const storagePath = `operacao-simulada/${timestamp}_${safeNome}.${fileExt}`;
    
    // Verificar se o storage está disponível
    if (!storage) {
      alert('Erro: Firebase Storage não está disponível.');
      return;
    }
    
    // Criar referência no storage
    const storageRef = storage.ref(storagePath);
    
    // Iniciar upload
    const uploadTask = storageRef.put(file);
    
    // Monitorar progresso
    uploadTask.on('state_changed',
      // Progresso
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(`Upload: ${progress}%`);
      },
      // Erro
      (error) => {
        console.error('Erro no upload:', error);
        
        let errorMessage = 'Erro ao fazer upload do arquivo.';
        if (error.code === 'storage/unauthorized') {
          errorMessage = 'Erro de permissão: Você não tem autorização para fazer upload.';
        } else if (error.code === 'storage/canceled') {
          errorMessage = 'Upload cancelado.';
        } else if (error.code) {
          errorMessage = `Erro (${error.code}): ${error.message}`;
        }
        
        alert(errorMessage);
      },
      // Sucesso
      async () => {
        try {
          // Obter URL de download
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          
          // Salvar no Firestore
          await db.collection('operacao-simulada').add({
            nome: nome,
            data: data,
            fileName: file.name,
            fileUrl: downloadURL,
            uploadedBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          alert('Documento salvo com sucesso!');
          closeOperacaoModal();
          loadOperacoes();
        } catch (error) {
          console.error('Erro ao salvar documento:', error);
          alert(`Erro ao salvar documento: ${error.message}`);
        }
      }
    );
  } catch (error) {
    console.error('Erro ao processar documento:', error);
    alert(`Erro: ${error.message}`);
  }
}

// Função para baixar documento
function downloadOperacao(url, name) {
  if (!url) {
    alert('URL do documento não disponível.');
    return;
  }
  
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    alert('Erro ao baixar o documento.');
  }
}

// Função para excluir documento
async function deleteOperacao(id) {
  if (!id) {
    console.error('ID do documento não fornecido.');
    return;
  }
  
  const confirmDelete = confirm('Tem certeza que deseja excluir este documento?');
  if (!confirmDelete) {
    return;
  }
  
  try {
    // Verificar autenticação
    if (!auth.currentUser) {
      alert('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }
    
    // Obter referência do documento
    const docRef = db.collection('operacao-simulada').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      
      // Excluir arquivo do Storage
      if (data.fileUrl) {
        try {
          const fileRef = storage.refFromURL(data.fileUrl);
          await fileRef.delete();
        } catch (storageError) {
          console.warn('Aviso: Não foi possível excluir o arquivo do Storage:', storageError);
          // Continuar mesmo se falhar a exclusão do arquivo
        }
      }
      
      // Excluir documento do Firestore
      await docRef.delete();
      
      alert('Documento excluído com sucesso!');
      loadOperacoes();
    } else {
      alert('Documento não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    alert(`Erro ao excluir documento: ${error.message}`);
  }
}