let currentOperacaoId = null;
let isOperacaoEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
  setupOperacaoSimuladaEvents();
});

let operacaoSimuladaEventsSetup = false; // Flag to prevent multiple event listener setups

function setupOperacaoSimuladaEvents() {
  if (operacaoSimuladaEventsSetup) return; // Prevent re-setup

  const operacaoSimuladaItem = document.querySelector('li[data-category="operacao-simulada"]');
  
  if (operacaoSimuladaItem) {
    operacaoSimuladaItem.addEventListener('click', function() {
      const allCategoryItems = document.querySelectorAll('.category-list li');
      allCategoryItems.forEach(item => item.classList.remove('active'));
      operacaoSimuladaItem.classList.add('active');
      
      const categoryTitle = document.getElementById('category-title');
      if (categoryTitle) {
        categoryTitle.textContent = 'OPERAÇÃO SIMULADA';
      }
      
      hideAllContainers();
      
      const operacaoSimuladaContainer = document.getElementById('operacao-simulada-container');
      if (operacaoSimuladaContainer) {
        operacaoSimuladaContainer.style.display = 'block';
      }
      
      const uploadOperacaoBtn = document.getElementById('upload-operacao-btn');
      if (uploadOperacaoBtn) {
        uploadOperacaoBtn.style.display = 'inline-flex';
      }
      
      // Removed loadOperacoes() call from here to prevent duplication
    });
  }
  
  const uploadOperacaoBtn = document.getElementById('upload-operacao-btn');
  if (uploadOperacaoBtn) {
    uploadOperacaoBtn.addEventListener('click', () => openOperacaoModal());
  }
  
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

  operacaoSimuladaEventsSetup = true; // Set flag to true after setup
}

function hideAllContainers() {
  const containers = [
    'dashboard-container',
    'document-container',
    'calendar-container',
    'livro-ordens-container',
    'operacao-simulada-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.style.display = 'none';
    }
  });
  
  const elementsToHide = [
    'month-filter',
    'upload-btn',
    'add-event-btn',
    'upload-ordem-btn',
    'upload-operacao-btn'
  ];
  
  elementsToHide.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  });
}

async function loadOperacoes() {
  console.log('loadOperacoes called'); // Debug log
  const operacaoList = document.getElementById('operacao-simulada-list');
  
  if (!operacaoList) {
    console.error('Erro: Elemento operacao-simulada-list não encontrado.');
    return;
  }
  
  operacaoList.innerHTML = ''; // Clear existing content
  
  try {
    if (typeof db === 'undefined') {
      console.error('Erro: Firebase não está disponível.');
      operacaoList.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-8 text-gray-500">
            Erro ao carregar documentos. Firebase não está disponível.
          </td>
        </tr>
      `;
      return;
    }
    
    const snapshot = await db.collection('operacao-simulada')
      .orderBy('data', 'desc')
      .get();
    
    if (snapshot.empty) {
      operacaoList.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-8 text-gray-500">
            Nenhum documento encontrado.
          </td>
        </tr>
      `;
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const tr = createOperacaoRow(doc.id, data);
      operacaoList.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar documentos:', error);
    operacaoList.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-8 text-red-500">
          Erro ao carregar documentos: ${error.message}
        </td>
      </tr>
    `;
  }
}

function createOperacaoRow(id, operacao) {
  const tr = document.createElement('tr');
  tr.className = 'hover:bg-gray-50 transition-colors duration-150';
  
  let dataFormatada = '-';
  if (operacao.data) {
    try {
      let dataObj;
      if (typeof operacao.data === 'string') {
        dataObj = new Date(operacao.data);
      } else if (operacao.data instanceof Date) {
        dataObj = operacao.data;
      } else if (operacao.data.toDate && typeof operacao.data.toDate === 'function') {
        dataObj = operacao.data.toDate();
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
  
  const fileUrl = operacao.fileUrl && typeof operacao.fileUrl === 'string' ? operacao.fileUrl : '';
  
  tr.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${operacao.nome || 'Documento sem nome'}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dataFormatada}</td>
    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
      ${fileUrl ? `<button class="action-view text-primary-600 hover:text-primary-900 mr-3" title="Visualizar" data-id="${id}" data-url="${fileUrl}">
        <i class="fas fa-eye"></i>
      </button>` : ''}
      <button class="action-edit text-blue-600 hover:text-blue-900 mr-3" title="Editar" data-id="${id}">
        <i class="fas fa-edit"></i>
      </button>
      ${fileUrl ? `<button class="action-download text-green-600 hover:text-green-900 mr-3" title="Baixar" data-id="${id}" data-url="${fileUrl}">
        <i class="fas fa-download"></i>
      </button>` : ''}
      <button class="action-delete text-red-600 hover:text-red-900" title="Excluir" data-id="${id}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  const viewBtn = tr.querySelector('.action-view');
  if (viewBtn) {
    viewBtn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (url && url.trim() !== '') {
        window.open(url, '_blank');
      } else {
        if (window.showNotification) {
          window.showNotification('URL do documento não disponível.', 'error');
        } else {
          alert('URL do documento não disponível.');
        }
      }
    });
  }
  
  const editBtn = tr.querySelector('.action-edit');
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      if (docId) {
        openOperacaoModal(docId);
      }
    });
  }
  
  const downloadBtn = tr.querySelector('.action-download');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (url && url.trim() !== '') {
        downloadOperacao(url, operacao.nome || 'documento');
      } else {
        if (window.showNotification) {
          window.showNotification('URL do documento não disponível para download.', 'error');
        } else {
          alert('URL do documento não disponível para download.');
        }
      }
    });
  }
  
  const deleteBtn = tr.querySelector('.action-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      if (docId) {
        deleteOperacao(docId);
      }
    });
  }
  
  return tr;
}

async function openOperacaoModal(operacaoId = null) {
  const modal = document.getElementById('operacao-modal');
  const title = document.getElementById('operacao-modal-title');
  const nomeInput = document.getElementById('operacao-nome');
  const dataInput = document.getElementById('operacao-data');
  const fileContainer = document.getElementById('operacao-file-container');
  const fileInput = document.getElementById('operacao-file');
  
  if (!modal || !title || !nomeInput || !dataInput) {
    console.error('Erro: Elementos do modal não encontrados.');
    return;
  }
  
  nomeInput.value = '';
  if (dataInput) dataInput.value = '';
  if (fileInput) fileInput.value = '';
  
  currentOperacaoId = null;
  isOperacaoEditMode = false;
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  if (dataInput) dataInput.value = `${year}-${month}-${day}`;
  
  if (operacaoId) {
    isOperacaoEditMode = true;
    currentOperacaoId = operacaoId;
    title.textContent = 'Editar Documento';
    if (fileContainer) fileContainer.style.display = 'none';
    
    try {
      const docRef = db.collection('operacao-simulada').doc(operacaoId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        
        if (nomeInput) nomeInput.value = data.nome || '';
        
        if (dataInput && data.data) {
          try {
            let dataObj;
            if (typeof data.data === 'string') {
              dataObj = new Date(data.data);
            } else if (data.data instanceof Date) {
              dataObj = data.data;
            } else if (data.data.toDate && typeof data.data.toDate === 'function') {
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
            dataInput.value = `${year}-${month}-${day}`;
          }
        }
      } else {
        console.warn('Documento não encontrado:', operacaoId);
      }
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      if (window.showNotification) {
        window.showNotification('Erro ao buscar informações do documento.', 'error');
      } else {
        alert('Erro ao buscar informações do documento.');
      }
    }
  } else {
    title.textContent = 'Upload de Documento';
    if (fileContainer) fileContainer.style.display = 'block';
  }
  
  if (modal) modal.style.display = 'block';
}

function closeOperacaoModal() {
  const modal = document.getElementById('operacao-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function saveOperacao() {
  const nomeInput = document.getElementById('operacao-nome');
  const dataInput = document.getElementById('operacao-data');
  const fileInput = document.getElementById('operacao-file');
  
  if (!nomeInput || !dataInput) {
    console.error('Erro: Elementos do formulário não encontrados.');
    return;
  }
  
  const nome = nomeInput.value.trim();
  const data = dataInput.value;
  
  if (!nome) {
    if (window.showNotification) {
      window.showNotification('Por favor, informe o nome do documento.', 'error');
    } else {
      alert('Por favor, informe o nome do documento.');
    }
    return;
  }
  
  if (!data) {
    if (window.showNotification) {
      window.showNotification('Por favor, selecione a data do documento.', 'error');
    } else {
      alert('Por favor, selecione a data do documento.');
    }
    return;
  }
  
  if (!auth || !auth.currentUser) {
    if (window.showNotification) {
      window.showNotification('Usuário não autenticado. Por favor, faça login novamente.', 'error');
    } else {
      alert('Usuário não autenticado. Por favor, faça login novamente.');
    }
    return;
  }
  
  try {
    if (isOperacaoEditMode && currentOperacaoId) {
      const docRef = db.collection('operacao-simulada').doc(currentOperacaoId);
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
        fileUrl: fileUrl
      });
      
      if (window.showNotification) {
        window.showNotification('Documento atualizado com sucesso!', 'success');
      } else {
        alert('Documento atualizado com sucesso!');
      }
      closeOperacaoModal();
      loadOperacoes();
      return;
    }
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      if (window.showNotification) {
        window.showNotification('Por favor, selecione um arquivo.', 'error');
      } else {
        alert('Por favor, selecione um arquivo.');
      }
      return;
    }
    
    const file = fileInput.files[0];
    
    const safeNome = nome.replace(/[^a-z0-9]/gi, '_');
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const storagePath = `operacao-simulada/${timestamp}_${safeNome}.${fileExt}`;
    
    if (!storage) {
      if (window.showNotification) {
        window.showNotification('Erro: Firebase Storage não está disponível.', 'error');
      } else {
        alert('Erro: Firebase Storage não está disponível.');
      }
      return;
    }
    
    const storageRef = storage.ref(storagePath);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(`Upload: ${progress}%`);
      },
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
        
        if (window.showNotification) {
          window.showNotification(errorMessage, 'error');
        } else {
          alert(errorMessage);
        }
      },
      async () => {
        try {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          
          if (!downloadURL || typeof downloadURL !== 'string') {
            throw new Error('URL de download inválida.');
          }
          
          await db.collection('operacao-simulada').add({
            nome: nome,
            data: data,
            fileName: file.name,
            fileUrl: downloadURL,
            uploadedBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          if (window.showNotification) {
            window.showNotification('Documento salvo com sucesso!', 'success');
          } else {
            alert('Documento salvo com sucesso!');
          }
          closeOperacaoModal();
          loadOperacoes();
        } catch (error) {
          console.error('Erro ao salvar documento:', error);
          if (window.showNotification) {
            window.showNotification(`Erro ao salvar documento: ${error.message}`, 'error');
          } else {
            alert(`Erro ao salvar documento: ${error.message}`);
          }
        }
      }
    );
  } catch (error) {
    console.error('Erro ao processar documento:', error);
    if (window.showNotification) {
      window.showNotification(`Erro: ${error.message}`, 'error');
    } else {
      alert(`Erro: ${error.message}`);
    }
  }
}

function downloadOperacao(url, name) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    if (window.showNotification) {
      window.showNotification('URL do documento não disponível.', 'error');
    } else {
      alert('URL do documento não disponível.');
    }
    return;
  }
  
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'documento';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao baixar o documento.', 'error');
    } else {
      alert('Erro ao baixar o documento.');
    }
  }
}

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
    if (!auth || !auth.currentUser) {
      if (window.showNotification) {
        window.showNotification('Usuário não autenticado. Por favor, faça login novamente.', 'error');
      } else {
        alert('Usuário não autenticado. Por favor, faça login novamente.');
      }
      return;
    }
    
    const docRef = db.collection('operacao-simulada').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      
      if (data.fileUrl && typeof data.fileUrl === 'string' && data.fileUrl.trim() !== '') {
        try {
          const fileRef = storage.refFromURL(data.fileUrl);
          await fileRef.delete();
        } catch (storageError) {
          console.warn('Aviso: Não foi possível excluir o arquivo do Storage:', storageError);
        }
      }
      
      await docRef.delete();
      
      if (window.showNotification) {
        window.showNotification('Documento excluído com sucesso!', 'success');
      } else {
        alert('Documento excluído com sucesso!');
      }
      loadOperacoes();
    } else {
      if (window.showNotification) {
        window.showNotification('Documento não encontrado.', 'error');
      } else {
        alert('Documento não encontrado.');
      }
    }
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    if (window.showNotification) {
      window.showNotification(`Erro ao excluir documento: ${error.message}`, 'error');
    } else {
      alert(`Erro ao excluir documento: ${error.message}`);
    }
  }
}

window.loadOperacoes = loadOperacoes;
