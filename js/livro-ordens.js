// livro-ordens.js - Script for managing the Livro de Ordens (Order Book)

// Global variables
let currentOrdemId = null;
let isEditMode = false;
let isLoadingOrdens = false; // Flag to prevent multiple simultaneous loads

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Set up modal event handlers only
  setupOrdemModalEvents();
});

// Set up event handlers for the modal
function setupOrdemModalEvents() {
  // Modal close button
  const closeOrdemModalBtn = document.querySelector('.close-ordem-modal');
  if (closeOrdemModalBtn) {
    closeOrdemModalBtn.addEventListener('click', closeOrdemModal);
  }
  
  // Cancel button
  const cancelOrdemBtn = document.getElementById('cancel-ordem');
  if (cancelOrdemBtn) {
    cancelOrdemBtn.addEventListener('click', closeOrdemModal);
  }
  
  // Save button
  const saveOrdemBtn = document.getElementById('save-ordem');
  if (saveOrdemBtn) {
    saveOrdemBtn.addEventListener('click', saveOrdem);
  }
  
  // Upload button (now managed centrally in app.js)
  const uploadOrdemBtn = document.getElementById('upload-ordem-btn');
  if (uploadOrdemBtn) {
    uploadOrdemBtn.addEventListener('click', () => openOrdemModal());
  }
}

// Function to load Livro de Ordens documents
async function loadOrdens() {
  // Prevent multiple simultaneous loads
  if (isLoadingOrdens) {
    console.log('Already loading documents, request ignored');
    return;
  }
  
  isLoadingOrdens = true;
  
  // Get reference to the document list
  const livroOrdensList = document.getElementById('livro-ordens-list');
  
  if (!livroOrdensList) {
    console.error('Error: Element livro-ordens-list not found.');
    isLoadingOrdens = false;
    return;
  }
  
  // Clear current list completely
  livroOrdensList.innerHTML = '';
  
  try {
    // Check if Firebase is available
    if (typeof db === 'undefined') {
      console.error('Error: Firebase is not available.');
      livroOrdensList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            Error loading documents. Firebase is not available.
          </td>
        </tr>
      `;
      isLoadingOrdens = false;
      return;
    }
    
    // Query Livro de Ordens documents
    const snapshot = await db.collection('livro-ordens')
      .orderBy('data', 'desc')
      .get();
    
    // Check if there are results
    if (snapshot.empty) {
      livroOrdensList.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            No documents found.
          </td>
        </tr>
      `;
      isLoadingOrdens = false;
      return;
    }
    
    // Create a document fragment to improve performance
    const fragment = document.createDocumentFragment();
    
    // Add each document to the table
    snapshot.forEach(doc => {
      const data = doc.data();
      const tr = createOrdemRow(doc.id, data);
      fragment.appendChild(tr);
    });
    
    // Append all rows at once
    livroOrdensList.appendChild(fragment);
    
  } catch (error) {
    console.error('Error loading documents:', error);
    livroOrdensList.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 20px;">
          Error loading documents: ${error.message}
        </td>
      </tr>
    `;
  } finally {
    // Always reset the loading flag
    isLoadingOrdens = false;
  }
}

// Function to create table row
function createOrdemRow(id, ordem) {
  const tr = document.createElement('tr');
  
  // Format date
  let dataFormatada = '-';
  if (ordem.data) {
    try {
      let dataObj;
      if (typeof ordem.data === 'string') {
        dataObj = new Date(ordem.data);
      } else if (ordem.data instanceof Date) {
        dataObj = ordem.data;
      } else if (ordem.data.toDate && typeof ordem.data.toDate === 'function') {
        // For Firestore Timestamp
        dataObj = ordem.data.toDate();
      } else {
        throw new Error('Unknown date format');
      }
      
      const dia = dataObj.getDate().toString().padStart(2, '0');
      const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
      const ano = dataObj.getFullYear();
      dataFormatada = `${dia}/${mes}/${ano}`;
    } catch (e) {
      console.error('Error formatting date:', e);
    }
  }
  
  // Check if fileUrl is a valid string
  const fileUrl = ordem.fileUrl && typeof ordem.fileUrl === 'string' ? ordem.fileUrl : '';
  
  // Set row content
  tr.innerHTML = `
    <td>${ordem.nome || 'Unnamed document'}</td>
    <td>${dataFormatada}</td>
    <td class="table-actions">
      ${fileUrl ? `<button class="action-btn view-btn" title="View" data-id="${id}" data-url="${fileUrl}">
        <i class="fas fa-eye"></i>
      </button>` : ''}
      <button class="action-btn edit-btn" title="Edit" data-id="${id}">
        <i class="fas fa-edit"></i>
      </button>
      ${fileUrl ? `<button class="action-btn download-btn" title="Download" data-id="${id}" data-url="${fileUrl}">
        <i class="fas fa-download"></i>
      </button>` : ''}
      <button class="action-btn delete-btn" title="Delete" data-id="${id}">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  // Add events to buttons
  const viewBtn = tr.querySelector('.view-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', function() {
      const url = this.getAttribute('data-url');
      if (url && url.trim() !== '') {
        window.open(url, '_blank');
      } else {
        alert('Document URL not available.');
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
        downloadOrdem(url, ordem.nome || 'document');
      } else {
        alert('Document URL not available for download.');
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

// Function to open upload/edit modal
async function openOrdemModal(ordemId = null) {
  // Get modal element references
  const modal = document.getElementById('ordem-modal');
  const title = document.getElementById('ordem-modal-title');
  const nomeInput = document.getElementById('ordem-nome');
  const dataInput = document.getElementById('ordem-data');
  const fileContainer = document.getElementById('ordem-file-container');
  const fileInput = document.getElementById('ordem-file');
  
  if (!modal || !title || !nomeInput || !dataInput || !fileContainer) {
    console.error('Error: Modal elements not found.');
    return;
  }
  
  // Clear fields
  nomeInput.value = '';
  dataInput.value = '';
  if (fileInput) fileInput.value = '';
  
  // Set initial values
  currentOrdemId = null;
  isEditMode = false;
  
  // Set current date as default
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  dataInput.value = `${year}-${month}-${day}`;
  
  if (ordemId) {
    // Edit mode
    isEditMode = true;
    currentOrdemId = ordemId;
    title.textContent = 'Edit Document';
    fileContainer.style.display = 'none';
    
    try {
      // Fetch document data
      const docRef = db.collection('livro-ordens').doc(ordemId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        
        // Fill form fields
        nomeInput.value = data.nome || '';
        
        // Format date for input
        if (data.data) {
          try {
            let dataObj;
            if (typeof data.data === 'string') {
              dataObj = new Date(data.data);
            } else if (data.data instanceof Date) {
              dataObj = data.data;
            } else if (data.data.toDate && typeof data.data.toDate === 'function') {
              // For Firestore Timestamp
              dataObj = data.data.toDate();
            } else {
              throw new Error('Unknown date format');
            }
            
            const year = dataObj.getFullYear();
            const month = String(dataObj.getMonth() + 1).padStart(2, '0');
            const day = String(dataObj.getDate()).padStart(2, '0');
            dataInput.value = `${year}-${month}-${day}`;
          } catch (error) {
            console.error('Error processing date:', error);
            // Use current date as fallback
            dataInput.value = `${year}-${month}-${day}`;
          }
        }
      } else {
        console.warn('Document not found:', ordemId);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      alert('Error fetching document information.');
    }
  } else {
    // New document mode
    title.textContent = 'Upload Document';
    fileContainer.style.display = 'block';
  }
  
  // Display modal
  modal.style.display = 'block';
}

// Function to close modal
function closeOrdemModal() {
  const modal = document.getElementById('ordem-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Function to save document
async function saveOrdem() {
  // Get form data
  const nomeInput = document.getElementById('ordem-nome');
  const dataInput = document.getElementById('ordem-data');
  const fileInput = document.getElementById('ordem-file');
  
  if (!nomeInput || !dataInput) {
    console.error('Error: Form elements not found.');
    return;
  }
  
  const nome = nomeInput.value.trim();
  const data = dataInput.value;
  
  // Validate fields
  if (!nome) {
    alert('Please enter the document name.');
    return;
  }
  
  if (!data) {
    alert('Please select the document date.');
    return;
  }
  
  // Check authentication
  if (!auth || !auth.currentUser) {
    alert('User not authenticated. Please log in again.');
    return;
  }
  
  try {
    // Update existing document
    if (isEditMode && currentOrdemId) {
      // Get current document to preserve fileUrl
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
        fileUrl: fileUrl // Ensure file URL is preserved
      });
      
      alert('Document updated successfully!');
      closeOrdemModal();
      loadOrdens();
      return;
    }
    
    // Upload new document
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please select a file.');
      return;
    }
    
    const file = fileInput.files[0];
    
    // Create safe filename
    const safeNome = nome.replace(/[^a-z0-9]/gi, '_');
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const storagePath = `livro-ordens/${timestamp}_${safeNome}.${fileExt}`;
    
    // Check if storage is available
    if (!storage) {
      alert('Error: Firebase Storage is not available.');
      return;
    }
    
    // Create storage reference
    const storageRef = storage.ref(storagePath);
    
    // Start upload
    const uploadTask = storageRef.put(file);
    
    // Monitor progress
    uploadTask.on('state_changed',
      // Progress
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        console.log(`Upload: ${progress}%`);
      },
      // Error
      (error) => {
        console.error('Upload error:', error);
        
        let errorMessage = 'Error uploading file.';
        if (error.code === 'storage/unauthorized') {
          errorMessage = 'Permission error: You do not have authorization to upload.';
        } else if (error.code === 'storage/canceled') {
          errorMessage = 'Upload canceled.';
        } else if (error.code) {
          errorMessage = `Error (${error.code}): ${error.message}`;
        }
        
        alert(errorMessage);
      },
      // Success
      async () => {
        try {
          // Get download URL
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          
          // Check if download URL is valid
          if (!downloadURL || typeof downloadURL !== 'string') {
            throw new Error('Invalid download URL.');
          }
          
          // Save to Firestore
          await db.collection('livro-ordens').add({
            nome: nome,
            data: data,
            fileName: file.name,
            fileUrl: downloadURL,
            uploadedBy: auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          alert('Document saved successfully!');
          closeOrdemModal();
          loadOrdens();
        } catch (error) {
          console.error('Error saving document:', error);
          alert(`Error saving document: ${error.message}`);
        }
      }
    );
  } catch (error) {
    console.error('Error processing document:', error);
    alert(`Error: ${error.message}`);
  }
}

// Function to download document
function downloadOrdem(url, name) {
  // Check if URL is valid before download
  if (!url || typeof url !== 'string' || url.trim() === '') {
    alert('Document URL not available.');
    return;
  }
  
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener noreferrer'; // Add security
    document.body.appendChild(a);
    a.click();
    
    // Remove element after a short delay
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Error downloading the document.');
  }
}

// Function to delete document
async function deleteOrdem(id) {
  if (!id) {
    console.error('Document ID not provided.');
    return;
  }
  
  const confirmDelete = confirm('Are you sure you want to delete this document?');
  if (!confirmDelete) {
    return;
  }
  
  try {
    // Check authentication
    if (!auth || !auth.currentUser) {
      alert('User not authenticated. Please log in again.');
      return;
    }
    
    // Get document reference
    const docRef = db.collection('livro-ordens').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      
      // Delete file from Storage
      if (data.fileUrl && typeof data.fileUrl === 'string' && data.fileUrl.trim() !== '') {
        try {
          const fileRef = storage.refFromURL(data.fileUrl);
          await fileRef.delete();
        } catch (storageError) {
          console.warn('Warning: Could not delete file from Storage:', storageError);
          // Continue even if file deletion fails
        }
      }
      
      // Delete document from Firestore
      await docRef.delete();
      
      alert('Document deleted successfully!');
      loadOrdens();
    } else {
      alert('Document not found.');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    alert(`Error deleting document: ${error.message}`);
  }
}
