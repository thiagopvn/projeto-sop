let inspectionState = {
  items: [],
  isLoading: false
};

document.addEventListener('DOMContentLoaded', () => {
  setupInspectionEvents();
});

function setupInspectionEvents() {
  const controleInspecaoItem = document.querySelector('li[data-category="controle-inspecao"]');
  
  if (controleInspecaoItem) {
    controleInspecaoItem.addEventListener('click', function() {
      const allCategoryItems = document.querySelectorAll('.category-list li');
      allCategoryItems.forEach(item => item.classList.remove('active'));
      controleInspecaoItem.classList.add('active');
      
      const categoryTitle = document.getElementById('category-title');
      if (categoryTitle) {
        categoryTitle.textContent = 'CONTROLE DE INSPEÇÃO';
      }
      
      hideAllContainers();
      
      const controleInspecaoContainer = document.getElementById('controle-inspecao-container');
      if (controleInspecaoContainer) {
        controleInspecaoContainer.style.display = 'block';
      }
      
      loadInspectionItems();
    });
  }
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
    if (container) {
      container.style.display = 'none';
    }
  });
  
  const elementsToHide = [
    'month-filter',
    'upload-btn',
    'add-event-btn',
    'upload-ordem-btn',
    'upload-operacao-btn',
    'upload-pto-btn'
  ];
  
  elementsToHide.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  });
}

async function loadInspectionItems() {
  if (inspectionState.isLoading) return;
  
  try {
    inspectionState.isLoading = true;
    
    const container = document.getElementById('inspection-content');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-8"><div class="loader"></div><p>Carregando checklist...</p></div>';
    
    const snapshot = await db.collection('inspection_items')
      .orderBy('order', 'asc')
      .get();
    
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    inspectionState.items = items;
    renderInspectionItems();
    
  } catch (error) {
    console.error('Erro ao carregar itens de inspeção:', error);
    const container = document.getElementById('inspection-content');
    if (container) {
      container.innerHTML = '<div class="text-center py-8 text-red-500">Erro ao carregar checklist</div>';
    }
  } finally {
    inspectionState.isLoading = false;
  }
}

function renderInspectionItems() {
  const container = document.getElementById('inspection-content');
  if (!container) return;
  
  const groupedItems = groupItemsBySection(inspectionState.items);
  
  let html = '';
  
  for (const [sectionName, items] of Object.entries(groupedItems)) {
    html += createSectionHTML(sectionName, items);
  }
  
  container.innerHTML = html;
  setupInspectionEventListeners();
}

function groupItemsBySection(items) {
  const grouped = {};
  
  items.forEach(item => {
    if (!grouped[item.sectionName]) {
      grouped[item.sectionName] = [];
    }
    grouped[item.sectionName].push(item);
  });
  
  return grouped;
}

function createSectionHTML(sectionName, items) {
  const sectionId = `section-${sectionName.replace(/\s+/g, '-').toLowerCase()}`;
  
  return `
    <div class="inspection-section">
      <div class="section-header" data-target="${sectionId}">
        <h3 class="section-title">${sectionName}</h3>
        <i class="fas fa-chevron-down section-toggle"></i>
      </div>
      <div class="section-content" id="${sectionId}">
        ${items.map(item => createTaskHTML(item)).join('')}
      </div>
    </div>
  `;
}

function createTaskHTML(item) {
  const statusClass = getStatusClass(item.status || 'Pendente');
  const hasAttachment = item.attachmentUrl && item.attachmentUrl.trim() !== '';
  
  return `
    <div class="inspection-task" data-task-id="${item.id}">
      <div class="task-content">
        <div class="task-description">
          <p>${item.taskDescription}</p>
        </div>
        
        <div class="task-controls">
          <div class="status-selector">
            <label>Status:</label>
            <select class="status-dropdown ${statusClass}" data-field="status">
              <option value="Pendente" ${item.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
              <option value="Conforme" ${item.status === 'Conforme' ? 'selected' : ''}>Conforme</option>
              <option value="Não Conforme" ${item.status === 'Não Conforme' ? 'selected' : ''}>Não Conforme</option>
              <option value="Não se Aplica" ${item.status === 'Não se Aplica' ? 'selected' : ''}>Não se Aplica</option>
            </select>
          </div>
          
          <div class="observations-field">
            <label>Observações:</label>
            <textarea class="observations-input" data-field="observations" placeholder="Adicione suas observações aqui...">${item.observations || ''}</textarea>
          </div>
          
          <div class="attachment-controls">
            ${hasAttachment ? 
              `<button class="btn btn-secondary view-attachment-btn" data-url="${item.attachmentUrl}">
                <i class="fas fa-eye"></i> Ver Anexo
              </button>
              <button class="btn btn-danger remove-attachment-btn">
                <i class="fas fa-trash"></i> Remover
              </button>` :
              `<button class="btn btn-primary attach-evidence-btn">
                <i class="fas fa-paperclip"></i> Anexar documento
              </button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function getStatusClass(status) {
  switch (status) {
    case 'Conforme': return 'status-conforme';
    case 'Não Conforme': return 'status-nao-conforme';
    case 'Não se Aplica': return 'status-nao-aplica';
    default: return 'status-pendente';
  }
}

function setupInspectionEventListeners() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', toggleSection);
  });
  
  document.querySelectorAll('.status-dropdown').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
  
  document.querySelectorAll('.observations-input').forEach(textarea => {
    textarea.addEventListener('blur', handleObservationsChange);
  });
  
  document.querySelectorAll('.attach-evidence-btn').forEach(btn => {
    btn.addEventListener('click', handleAttachEvidence);
  });
  
  document.querySelectorAll('.view-attachment-btn').forEach(btn => {
    btn.addEventListener('click', handleViewAttachment);
  });
  
  document.querySelectorAll('.remove-attachment-btn').forEach(btn => {
    btn.addEventListener('click', handleRemoveAttachment);
  });
}

function toggleSection(e) {
  const header = e.currentTarget;
  const targetId = header.getAttribute('data-target');
  const content = document.getElementById(targetId);
  const toggle = header.querySelector('.section-toggle');
  
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    toggle.style.transform = 'rotate(180deg)';
  } else {
    content.style.display = 'none';
    toggle.style.transform = 'rotate(0deg)';
  }
}

async function handleStatusChange(e) {
  const select = e.target;
  const taskElement = select.closest('.inspection-task');
  const taskId = taskElement.getAttribute('data-task-id');
  const newStatus = select.value;
  
  try {
    await db.collection('inspection_items').doc(taskId).update({
      status: newStatus
    });
    
    select.className = `status-dropdown ${getStatusClass(newStatus)}`;
    
    if (window.showNotification) {
      window.showNotification('Status atualizado com sucesso!', 'success');
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao atualizar status', 'error');
    }
  }
}

async function handleObservationsChange(e) {
  const textarea = e.target;
  const taskElement = textarea.closest('.inspection-task');
  const taskId = taskElement.getAttribute('data-task-id');
  const observations = textarea.value.trim();
  
  try {
    await db.collection('inspection_items').doc(taskId).update({
      observations: observations
    });
    
    if (window.showNotification) {
      window.showNotification('Observações salvas!', 'success');
    }
  } catch (error) {
    console.error('Erro ao salvar observações:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao salvar observações', 'error');
    }
  }
}

function handleAttachEvidence(e) {
  const btn = e.target.closest('button');
  const taskElement = btn.closest('.inspection-task');
  const taskId = taskElement.getAttribute('data-task-id');
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
  
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadAttachment(taskId, file);
    }
  });
  
  input.click();
}

async function uploadAttachment(taskId, file) {
  try {
    const safeFileName = file.name.replace(/[^a-z0-9.-]/gi, '_');
    const timestamp = Date.now();
    const storagePath = `documents/inspection_control/${timestamp}_${safeFileName}`;
    
    const storageRef = storage.ref(storagePath);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(`Upload: ${progress}%`);
      },
      (error) => {
        console.error('Erro no upload:', error);
        if (window.showNotification) {
          window.showNotification('Erro ao fazer upload do arquivo', 'error');
        }
      },
      async () => {
        try {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          
          await db.collection('inspection_items').doc(taskId).update({
            attachmentUrl: downloadURL,
            attachmentName: file.name
          });
          
          if (window.showNotification) {
            window.showNotification('Evidência anexada com sucesso!', 'success');
          }
          
          loadInspectionItems();
        } catch (error) {
          console.error('Erro ao salvar anexo:', error);
          if (window.showNotification) {
            window.showNotification('Erro ao salvar anexo', 'error');
          }
        }
      }
    );
  } catch (error) {
    console.error('Erro no upload:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao fazer upload', 'error');
    }
  }
}

function handleViewAttachment(e) {
  const btn = e.target.closest('button');
  const url = btn.getAttribute('data-url');
  
  if (url) {
    window.open(url, '_blank');
  }
}

async function handleRemoveAttachment(e) {
  const btn = e.target.closest('button');
  const taskElement = btn.closest('.inspection-task');
  const taskId = taskElement.getAttribute('data-task-id');
  
  if (!confirm('Tem certeza que deseja remover o anexo?')) return;
  
  try {
    const docRef = db.collection('inspection_items').doc(taskId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      
      if (data.attachmentUrl) {
        try {
          const fileRef = storage.refFromURL(data.attachmentUrl);
          await fileRef.delete();
        } catch (error) {
          console.warn('Arquivo não encontrado no storage:', error);
        }
      }
      
      await docRef.update({
        attachmentUrl: firebase.firestore.FieldValue.delete(),
        attachmentName: firebase.firestore.FieldValue.delete()
      });
      
      if (window.showNotification) {
        window.showNotification('Anexo removido com sucesso!', 'success');
      }
      
      loadInspectionItems();
    }
  } catch (error) {
    console.error('Erro ao remover anexo:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao remover anexo', 'error');
    }
  }
}

window.loadInspectionItems = loadInspectionItems;