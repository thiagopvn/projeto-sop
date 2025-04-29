// livro-ordens.js - Script para gerenciar o Livro de Ordens

// Variáveis globais
let currentOrdemId = null;
let isEditMode = false;
let isLoadingOrdens = false; // Flag para evitar carregamentos simultâneos

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Configurar apenas eventos do modal
  setupOrdemModalEvents();
  
  // Configurar evento para o botão de upload
  const uploadOrdemBtn = document.getElementById('upload-ordem-btn');
  if (uploadOrdemBtn) {
    uploadOrdemBtn.addEventListener('click', () => openOrdemModal());
  }
});

// Configurar eventos do modal
function setupOrdemModalEvents() {
  // Botão de fechar o modal
  const closeOrdemModalBtn = document.querySelector('.close-ordem-modal');
  if (closeOrdemModalBtn) {
    closeOrdemModalBtn.addEventListener('click', closeOrdemModal);
  }
  
  // Botão de cancelar
  const cancelOrdemBtn = document.getElementById('cancel-ordem');
  if (cancelOrdemBtn) {
    cancelOrdemBtn.addEventListener('click', closeOrdemModal);
  }
  
  // Botão de salvar
  const saveOrdemBtn = document.getElementById('save-ordem');
  if (saveOrdemBtn) {
    saveOrdemBtn.addEventListener('click', saveOrdem);
  }
}

// Função para carregar documentos do Livro de Ordens
async function loadOrdens() {
  // Evitar carregamentos simultâneos
  if (isLoadingOrdens) {
    console.log('Já está carregando documentos, requisição ignorada');
    return;
  }
  
  isLoadingOrdens = true;
  
  try {
    // Garantir que o container do Livro de Ordens seja exibido
    const container = document.getElementById('livro-ordens-container');
    if (container) {
      container.style.display = 'block';
    }
    
    // Recria a estrutura da tabela do zero para evitar duplicações
    recreateOrdemTable();
    
    // Obter nova referência à lista de documentos após recriar a tabela
    const livroOrdensList = document.getElementById('livro-ordens-list');
    
    if (!livroOrdensList) {
      console.error('Erro: Elemento livro-ordens-list não encontrado após recriar a tabela.');
      isLoadingOrdens = false;
      return;
    }
    
    // Verificar se o Firestore está disponível
    if (typeof db === 'undefined') {
      console.error('Erro: Firebase não está disponível.');
      livroOrdensList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            Erro ao carregar documentos. Firebase não está disponível.
          </td>
        </tr>
      `;
      isLoadingOrdens = false;
      return;
    }
    
    // Consultar documentos do Livro de Ordens
    const snapshot = await db.collection('livro-ordens')
      .orderBy('data', 'desc')
      .get();
    
    // Verificar se há resultados
    if (snapshot.empty) {
      livroOrdensList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            Nenhum documento encontrado.
          </td>
        </tr>
      `;
      isLoadingOrdens = false;
      return;
    }
    
    // Criar um fragmento de documento para melhorar o desempenho
    const fragment = document.createDocumentFragment();
    
    // Adicionar cada documento à tabela
    snapshot.forEach(doc => {
      const data = doc.data();
      const tr = createOrdemRow(doc.id, data);
      fragment.appendChild(tr);
    });
    
    // Anexar todas as linhas de uma vez
    livroOrdensList.appendChild(fragment);
    
  } catch (error) {
    console.error('Erro ao carregar documentos:', error);
    const livroOrdensList = document.getElementById('livro-ordens-list');
    if (livroOrdensList) {
      livroOrdensList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            Erro ao carregar documentos: ${error.message}
          </td>
        </tr>
      `;
    }
  } finally {
    // Sempre resetar a flag de carregamento
    isLoadingOrdens = false;
  }
}

// Função para recriar a tabela do Livro de Ordens do zero
function recreateOrdemTable() {
  const container = document.getElementById('livro-ordens-container');
  if (!container) return;
  
  // Limpar o conteúdo atual do container
  container.innerHTML = '';
  
  // Criar nova tabela com estrutura limpa
  const tableHTML = `
    <table class="document-table">
      <thead>
        <tr>
          <th>Nome do Documento</th>
          <th>Data</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody id="livro-ordens-list">
        <!-- Os itens da tabela serão inseridos dinamicamente -->
      </tbody>
    </table>
  `;
  
  // Inserir a nova tabela no container
  container.innerHTML = tableHTML;
}

// Função para criar linha da tabela
function createOrdemRow(id, ordem) {
  const tr = document.createElement('tr');
  
  // Formatar data
  let dataFormatada = '-';
  if (ordem.data) {
    try {
      let dataObj;
      if (typeof ordem.data === 'string') {
        dataObj = new Date(ordem.data);
      } else if (ordem.data instanceof Date) {
        dataObj = ordem.data;
      } else if (ordem.data.toDate && typeof ordem.data.toDate === 'function') {
        // Para Timestamp do Firestore
        dataObj = ordem.data.toDate();
      } else {
        throw new Error('Formato de data desconhecido');
      }
      
      const dia = dataObj.getDate().toString().padStart(2, '0');
      const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
      const ano = dataObj.getFullYear();
      dataFormatada = `${dia}/${mes}/${ano}`;
    } catch (e) {
      console.error('Erro ao formatar data:', e);
    }
  }
  
  // Verificar se fileUrl é uma string válida
  const fileUrl = ordem.fileUrl && typeof ordem.fileUrl === 'string' ? ordem.fileUrl : '';
  
  // Definir conteúdo da linha
  tr.innerHTML = `
    <td>${ordem.nome || 'Documento sem nome'}</td>
    <td>${dataFormatada}</td>
    <td class="table-actions">
      ${fileUrl ? `<button class="action-btn view-btn" title="Visualizar" data-id="${id}" data-url="${fileUrl}">
        <i class="fas fa-eye"></i>
      </button>` : ''}
      <button class="action-btn edit-btn" title="Editar" data-id="${id}">
        <i class="fas fa-edit"></i>
      </button>
      ${fileUrl ? `<button class="action-btn download-btn" title="Baixar" data-id="${id}" data-url="${fileUrl}">
        <i class="fas fa-download"></i>
      </button>` : ''}
      <button class="action-btn delete-btn" title="Excluir" data-id="${id}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  // Adicionar eventos aos botões
  const viewBtn = tr.querySelector('.view-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (url && url.trim() !== '') {
        window.open(url, '_blank');
      } else {
        alert('URL do documento não disponível.');
      }
    });
  }
  
  const editBtn = tr.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      if (docId) {
        openOrdemModal(docId);
      }
    });
  }
  
  const downloadBtn = tr.querySelector('.download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (url && url.trim() !== '') {
        downloadOrdem(url, ordem.nome || 'documento');
      } else {
        alert('URL do documento não disponível para download.');
      }
    });
  }
  
  const deleteBtn = tr.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      if (docId) {
        deleteOrdem(docId);
      }
    });
  }
  
  return tr;
}

// Função para abrir o modal de upload/edição
async function openOrdemModal(ordemId = null) {
  // Obter referências aos elementos do modal
  const modal = document.getElementById('ordem-modal');
  const title = document.getElementById('ordem-modal-title');
  const nomeInput = document.getElementById('ordem-nome');
  const dataInput = document.getElementById('ordem-data');
  const fileContainer = document.getElementById('ordem-file-container');
  const fileInput = document.getElementById('ordem-file');
  
  if (!modal || !title || !nomeInput || !dataInput || !fileContainer) {
    console.error('Erro: Elementos do modal não encontrados.');
    return;
  }
  
  // Limpar campos
  nomeInput.value = '';
  dataInput.value = '';
  if (fileInput) fileInput.value = '';
  
  // Definir valores iniciais
  currentOrdemId = null;
  isEditMode = false;
  
  // Definir data atual como padrão
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  dataInput.value = `${year}-${month}-${day}`;
  
  if (ordemId) {
    // Modo de edição
    isEditMode = true;
    currentOrdemId = ordemId;
    title.textContent = 'Editar Documento';
    fileContainer.style.display = 'none';
    
    try {
      // Buscar dados do documento
      const docRef = db.collection('livro-ordens').doc(ordemId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        
        // Preencher campos
        nomeInput.value = data.nome || '';
        
        // Formatar data para o input
        if (data.data) {
          try {
            let dataObj;
            if (typeof data.data === 'string') {
              dataObj = new Date(data.data);
            } else if (data.data instanceof Date) {
              dataObj = data.data;
            } else if (data.data.toDate && typeof data.data.toDate === 'function') {
              // Para Timestamp do Firestore
              dataObj = data.data.toDate();
            } else {
              throw new Error('Formato de data desconhecido');
            }
            
            const year = dataObj.getFullYear();
            const month = String(dataObj.getMonth() + 1).padStart(2, '0');
            const day = String(dataObj.getDate()).padStart(2, '0');
            dataInput.value = `${year}-${month}-${day}`;
          } catch (error) {
            console.error('Erro ao processar data:', error);
            // Usar a data atual como fallback
            dataInput.value = `${year}-${month}-${day}`;
          }
        }
      } else {
        console.warn('Documento não encontrado:', ordemId);
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
function closeOrdemModal() {
  const modal = document.getElementById('ordem-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Função para salvar documento
async function saveOrdem() {
  // Obter dados do formulário
  const nomeInput = document.getElementById('ordem-nome');
  const dataInput = document.getElementById('ordem-data');
  const fileInput = document.getElementById('ordem-file');
  
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
  if (!auth || !auth.currentUser) {
    alert('Usuário não autenticado. Por favor, faça login novamente.');
    return;
  }
  
  try {
    // Atualizar documento existente
    if (isEditMode && currentOrdemId) {
      // Obter documento atual para preservar fileUrl
      const docRef = db.collection('livro-ordens').doc(currentOrdemId);
      const docSnap = await docRef.get();
      let fileUrl = '';
      
      if (docSnap.exists) {
        const docData = docSnap.data();
        fileUrl = docData.fileUrl || '';
      }
      
      await docRef.update({
        nome: nome,
        data: data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        fileUrl: fileUrl // Garantir que a URL do arquivo seja preservada
      });
      
      alert('Documento atualizado com sucesso!');
      closeOrdemModal();
      loadOrdens();
      return;
    }
    
    // Upload de novo documento
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Por favor, selecione um arquivo.');
      return;
    }
    
    const file = fileInput.files[0];
    
    // Criar nome de arquivo seguro
    const safeNome = nome.replace(/[^a-z0-9]/gi, '_');
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const storagePath = `livro-ordens/${timestamp}_${safeNome}.${fileExt}`;
    
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
          
          // Verificar se a URL de download é válida
          if (!downloadURL || typeof downloadURL !== 'string') {
            throw new Error('URL de download inválida.');
          }
          
          // Salvar no Firestore
          await db.collection('livro-ordens').add({
            nome: nome,
            data: data,
            fileName: file.name,
            fileUrl: downloadURL,
            uploadedBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          alert('Documento salvo com sucesso!');
          closeOrdemModal();
          loadOrdens();
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
function downloadOrdem(url, name) {
  // Verificar se a URL é válida antes de tentar o download
  if (!url || typeof url !== 'string' || url.trim() === '') {
    alert('URL do documento não disponível.');
    return;
  }
  
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener noreferrer'; // Adicionar segurança
    document.body.appendChild(a);
    a.click();
    
    // Remover o elemento após um breve atraso
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    alert('Erro ao baixar o documento.');
  }
}

// Função para excluir documento
async function deleteOrdem(id) {
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
    if (!auth || !auth.currentUser) {
      alert('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }
    
    // Obter referência do documento
    const docRef = db.collection('livro-ordens').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      
      // Excluir arquivo do Storage
      if (data.fileUrl && typeof data.fileUrl === 'string' && data.fileUrl.trim() !== '') {
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
      loadOrdens();
    } else {
      alert('Documento não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    alert(`Erro ao excluir documento: ${error.message}`);
  }
}
