import { db, storage, getDocuments, addDocument, updateDocument, deleteDocument, uploadFile, deleteFile, getCurrentUser } from '../firebase-config.js';
import { createTable, createSearchBar, createFileUpload, showToast, openDrawer, closeDrawer, showLoading, hideLoading, createModal } from '../ui.js';

let allDocuments = [];
let filteredDocuments = [];
let currentFilter = { search: '', month: '' };

export async function renderQTA(container, context) {
    container.innerHTML = `
        <div class="page-header">
            <h1>QTA - Quadro de Trabalho Adicional</h1>
            <button class="btn btn-primary" id="uploadBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Upload QTA
            </button>
        </div>
        
        ${createSearchBar({
            placeholder: 'Pesquisar QTA...',
            onSearch: 'window.qtaSearch',
            filters: [
                {
                    onChange: 'window.qtaFilterMonth',
                    options: [
                        { value: '', label: 'Todos os meses' },
                        { value: '1', label: 'Janeiro' },
                        { value: '2', label: 'Fevereiro' },
                        { value: '3', label: 'Março' },
                        { value: '4', label: 'Abril' },
                        { value: '5', label: 'Maio' },
                        { value: '6', label: 'Junho' },
                        { value: '7', label: 'Julho' },
                        { value: '8', label: 'Agosto' },
                        { value: '9', label: 'Setembro' },
                        { value: '10', label: 'Outubro' },
                        { value: '11', label: 'Novembro' },
                        { value: '12', label: 'Dezembro' }
                    ]
                }
            ]
        })}
        
        <div id="qtaTable">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
    `;
    
    // Setup event listeners
    document.getElementById('uploadBtn').addEventListener('click', () => showUploadModal());
    
    // Setup search functions
    window.qtaSearch = (value) => {
        currentFilter.search = value.toLowerCase();
        applyFilters();
    };
    
    window.qtaFilterMonth = (value) => {
        currentFilter.month = value;
        applyFilters();
    };
    
    // Setup global functions for actions
    window.viewQTA = (index) => {
        const doc = filteredDocuments[index];
        showQTADetails(doc);
    };
    
    window.downloadQTA = (index) => {
        const doc = filteredDocuments[index];
        if (doc.fileUrl) {
            window.open(doc.fileUrl, '_blank');
        }
    };
    
    window.deleteQTAAction = async (index) => {
        const doc = filteredDocuments[index];
        
        const result = await Swal.fire({
            title: 'Excluir QTA?',
            text: `Deseja excluir o arquivo "${doc.fileName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F44336',
            cancelButtonColor: '#6C757D',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            showLoading();
            
            // Delete file from storage
            if (doc.storagePath) {
                await deleteFile(doc.storagePath);
            }
            
            // Delete document from Firestore
            const { success } = await deleteDocument('livro-ordens', doc.id);
            hideLoading();
            
            if (success) {
                showToast('QTA excluído com sucesso!', 'success');
                loadDocuments();
            } else {
                showToast('Erro ao excluir QTA', 'error');
            }
        }
    };
    
    // Load documents
    loadDocuments();
    
    // Setup realtime listener
    const unsubscribe = db.collection('livro-ordens')
        .where('tipo', '==', 'qta')
        .orderBy('createdAt', 'desc')
        .onSnapshot(() => {
            loadDocuments();
        });
    
    context.addUnsubscriber(unsubscribe);
}

async function loadDocuments() {
    const allDocs = await getDocuments('livro-ordens');
    allDocuments = allDocs.filter(doc => doc.tipo === 'qta');
    
    // Remove duplicates by ID
    const uniqueIds = new Set();
    allDocuments = allDocuments.filter(doc => {
        if (uniqueIds.has(doc.id)) {
            return false;
        }
        uniqueIds.add(doc.id);
        return true;
    });
    
    applyFilters();
}

function applyFilters() {
    filteredDocuments = allDocuments.filter(doc => {
        // Search filter
        if (currentFilter.search) {
            const searchTerm = currentFilter.search;
            const matchesSearch = 
                doc.fileName?.toLowerCase().includes(searchTerm) ||
                doc.mes?.toLowerCase().includes(searchTerm);
            
            if (!matchesSearch) return false;
        }
        
        // Month filter
        if (currentFilter.month && doc.mesNumero !== parseInt(currentFilter.month)) {
            return false;
        }
        
        return true;
    });
    
    renderQTATable();
}

function renderQTATable() {
    const tableContainer = document.getElementById('qtaTable');
    
    const columns = [
        { key: 'fileName', label: 'Arquivo' },
        { key: 'mes', label: 'Mês' },
        { 
            key: 'uploadedAt', 
            label: 'Data Upload',
            render: (row) => row.createdAt ? new Date(row.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '-'
        },
        { key: 'uploadedBy', label: 'Enviado por' }
    ];
    
    const actions = [
        {
            label: 'Visualizar',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
            onClick: 'viewQTA'
        },
        {
            label: 'Download',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
            onClick: 'downloadQTA'
        },
        {
            label: 'Excluir',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
            onClick: 'deleteQTAAction'
        }
    ];
    
    tableContainer.innerHTML = createTable(columns, filteredDocuments, {
        actions,
        emptyMessage: 'Nenhum QTA encontrado',
        responsive: true
    });
}

function showQTADetails(doc) {
    const content = `
        <div class="document-details">
            <div class="detail-group">
                <label>Arquivo</label>
                <p>${doc.fileName || '-'}</p>
            </div>
            
            <div class="detail-group">
                <label>Mês</label>
                <p>${doc.mes || '-'}</p>
            </div>
            
            <div class="detail-group">
                <label>Enviado por</label>
                <p>${doc.uploadedBy || '-'}</p>
            </div>
            
            <div class="detail-group">
                <label>Data de Upload</label>
                <p>${doc.createdAt ? new Date(doc.createdAt.seconds * 1000).toLocaleString('pt-BR') : '-'}</p>
            </div>
            
            ${doc.fileUrl ? `
                <div class="pdf-preview">
                    <embed src="${doc.fileUrl}" type="application/pdf" width="100%" height="500px" />
                </div>
                
                <div class="detail-group">
                    <a href="${doc.fileUrl}" target="_blank" class="btn btn-primary btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download PDF
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    openDrawer(content);
}

function showUploadModal() {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const currentMonth = new Date().getMonth();
    
    const content = `
        <form id="uploadForm">
            <div class="form-group">
                <label class="form-label">Mês *</label>
                <select class="form-control" name="month" required>
                    ${months.map((month, index) => 
                        `<option value="${index + 1}" ${index === currentMonth ? 'selected' : ''}>${month}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Arquivo QTA *</label>
                ${createFileUpload({
                    accept: '.pdf',
                    onFileSelect: 'window.handleFileSelect'
                })}
                <div id="selectedFile" class="selected-file"></div>
            </div>
        </form>
    `;
    
    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.uploadQTA()">Upload</button>
    `;
    
    const modalId = createModal({
        title: 'Upload QTA',
        content,
        footer
    });
    
    let selectedFile = null;
    
    // Global functions
    window.handleFileSelect = (file) => {
        selectedFile = file;
        document.getElementById('selectedFile').innerHTML = `
            <div class="file-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>${file.name}</span>
                <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
        `;
    };
    
    window.closeModal = () => {
        document.getElementById(modalId).remove();
    };
    
    window.uploadQTA = async () => {
        const form = document.getElementById('uploadForm');
        const monthSelect = form.querySelector('[name="month"]');
        const monthIndex = parseInt(monthSelect.value) - 1;
        const monthName = months[monthIndex];
        
        if (!selectedFile) {
            showToast('Por favor, selecione um arquivo', 'error');
            return;
        }
        
        showLoading();
        
        try {
            // Upload file to Firebase Storage
            const fileName = `qta_${monthName.toLowerCase()}_${Date.now()}.pdf`;
            const storagePath = `qta/${new Date().getFullYear()}/${fileName}`;
            
            const { success: uploadSuccess, url } = await uploadFile(selectedFile, storagePath);
            
            if (!uploadSuccess) {
                throw new Error('Erro ao fazer upload do arquivo');
            }
            
            // Save document to Firestore
            const docData = {
                tipo: 'qta',
                fileName: selectedFile.name,
                fileUrl: url,
                storagePath,
                mes: monthName,
                mesNumero: parseInt(monthSelect.value),
                ano: new Date().getFullYear(),
                uploadedBy: getCurrentUser().email
            };
            
            const { success } = await addDocument('livro-ordens', docData);
            
            hideLoading();
            
            if (success) {
                showToast('QTA enviado com sucesso!', 'success');
                window.closeModal();
                loadDocuments();
            } else {
                throw new Error('Erro ao salvar documento');
            }
        } catch (error) {
            hideLoading();
            showToast(error.message || 'Erro ao enviar QTA', 'error');
        }
    };
}

// Add styles
const styles = `
<style>
    .pdf-preview {
        margin: 1rem 0;
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        overflow: hidden;
    }
    
    .selected-file {
        margin-top: 1rem;
    }
    
    .file-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: var(--color-bg);
        border-radius: var(--radius);
        font-size: 0.875rem;
    }
    
    .file-size {
        color: var(--color-text-muted);
        margin-left: auto;
    }
    
    .btn-block {
        width: 100%;
        justify-content: center;
    }
</style>
`;

document.head.insertAdjacentHTML('beforeend', styles);