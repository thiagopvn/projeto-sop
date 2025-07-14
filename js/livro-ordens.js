let currentOrdemId = null;
let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
  setupLivroOrdensEvents();
});

let livroOrdensEventsSetup = false; // Flag to prevent multiple event listener setups

function setupLivroOrdensEvents() {
  if (livroOrdensEventsSetup) return; // Prevent re-setup

  const livroOrdensItem = document.querySelector('li[data-category="livro-de-ordens"]');
  
  if (livroOrdensItem) {
    livroOrdensItem.addEventListener('click', function() {
      const allCategoryItems = document.querySelectorAll('.category-list li');
      allCategoryItems.forEach(item => item.classList.remove('active'));
      livroOrdensItem.classList.add('active');
      
      const categoryTitle = document.getElementById('category-title');
      if (categoryTitle) {
        categoryTitle.textContent = 'LIVRO DE ORDENS';
      }
      
      hideAllContainers();
      
      const livroOrdensContainer = document.getElementById('livro-ordens-container');
      if (livroOrdensContainer) {
        livroOrdensContainer.style.display = 'block';
      }
      
      const uploadOrdemBtn = document.getElementById('upload-ordem-btn');
      if (uploadOrdemBtn) {
        uploadOrdemBtn.style.display = 'inline-flex';
      }
      
      // Removed loadOrdens() call from here to prevent duplication
    });
  }
  
  const uploadOrdemBtn = document.getElementById('upload-ordem-btn');
  if (uploadOrdemBtn) {
    uploadOrdemBtn.addEventListener('click', () => openOrdemModal());
  }
  
  const closeOrdemModalBtn = document.querySelector('.close-ordem-modal');
  if (closeOrdemModalBtn) {
    closeOrdemModalBtn.addEventListener('click', closeOrdemModal);
  }
  
  const cancelOrdemBtn = document.getElementById('cancel-ordem');
  if (cancelOrdemBtn) {
    cancelOrdemBtn.addEventListener('click', closeOrdemModal);
  }
  
  const saveOrdemBtn = document.getElementById('save-ordem');
  if (saveOrdemBtn) {
    saveOrdemBtn.addEventListener('click', saveOrdem);
  }

  livroOrdensEventsSetup = true; // Set flag to true after setup
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

async function loadOrdens() {
  console.log('loadOrdens called');
  console.trace(); // Add trace to see call stack
  const livroOrdensList = document.getElementById('livro-ordens-list');
  
  if (!livroOrdensList) {
    console.error('Erro: Elemento livro-ordens-list não encontrado.');
    return;
  }
  
  livroOrdensList.innerHTML = ''; // Clear existing content
  
  try {
    if (typeof db === 'undefined') {
      console.error('Erro: Firebase não está disponível.');
      livroOrdensList.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-8 text-gray-500">
            Erro ao carregar documentos. Firebase não está disponível.
          </td>
        </tr>
      `;
      return;
    }
    
    const snapshot = await db.collection('livro-ordens')
      .orderBy('data', 'desc')
      .get();
    
    if (snapshot.empty) {
      livroOrdensList.innerHTML = `
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
      const tr = createOrdemRow(doc.id, data);
      livroOrdensList.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar documentos:', error);
    livroOrdensList.innerHTML = `
      <tr>
        <td colspan="3" class="text-center py-8 text-red-500">
          Erro ao carregar documentos: ${error.message}
        </td>
      </tr>
    `;
  }
}

function createOrdemRow(id, ordem) {
  const tr = document.createElement('tr');
  tr.className = 'hover:bg-gray-50 transition-colors duration-150';
  
  let dataFormatada = '-';
  if (ordem.data) {
    try {
      let dataObj;
      if (typeof ordem.data === 'string') {
        dataObj = new Date(ordem.data);
      } else if (ordem.data instanceof Date) {
        dataObj = ordem.data;
      } else if (ordem.data.toDate && typeof ordem.data.toDate === 'function') {
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
  
  const fileUrl = ordem.fileUrl && typeof ordem.fileUrl === 'string' ? ordem.fileUrl : '';
  
  tr.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${ordem.nome || 'Documento sem nome'}</td>
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
        openOrdemModal(docId);
      }
    });
  }
  
  const downloadBtn = tr.querySelector('.action-download');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (url && url.trim() !== '') {
        downloadOrdem(url, ordem.nome || 'documento');
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
        deleteOrdem(docId);
      }
    });
  }
  
  return tr;
}

async function openOrdemModal(ordemId = null) {
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
  
  nomeInput.value = '';
  dataInput.value = '';
  if (fileInput) fileInput.value = '';
  
  currentOrdemId = null;
  isEditMode = false;
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  dataInput.value = `${year}-${month}-${day}`;
  
  if (ordemId) {
    isEditMode = true;
    currentOrdemId = ordemId;
    title.textContent = 'Editar Documento';
    fileContainer.style.display = 'none';
    
    try {
      const docRef = db.collection('livro-ordens').doc(ordemId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        
        nomeInput.value = data.nome || '';
        
        if (data.data) {
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
        console.warn('Documento não encontrado:', ordemId);
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
    fileContainer.style.display = 'block';
  }
  
  modal.style.display = 'block';
}

function closeOrdemModal() {
  const modal = document.getElementById('ordem-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function saveOrdem() {
  const nomeInput = document.getElementById('ordem-nome');
  const dataInput = document.getElementById('ordem-data');
  const fileInput = document.getElementById('ordem-file');
  
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
    if (isEditMode && currentOrdemId) {
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
        fileUrl: fileUrl
      });
      
      if (window.showNotification) {
        window.showNotification('Documento atualizado com sucesso!', 'success');
      } else {
        alert('Documento atualizado com sucesso!');
      }
      closeOrdemModal();
      loadOrdens();
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
    const storagePath = `livro-ordens/${timestamp}_${safeNome}.${fileExt}`;
    
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
          
          await db.collection('livro-ordens').add({
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
          closeOrdemModal();
          loadOrdens();
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

function downloadOrdem(url, name) {
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
    a.download = name;
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
    if (!auth || !auth.currentUser) {
      if (window.showNotification) {
        window.showNotification('Usuário não autenticado. Por favor, faça login novamente.', 'error');
      } else {
        alert('Usuário não autenticado. Por favor, faça login novamente.');
      }
      return;
    }
    
    const docRef = db.collection('livro-ordens').doc(id);
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
      loadOrdens();
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

window.loadOrdens = loadOrdens;
