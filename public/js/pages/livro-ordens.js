import { db, getDocuments, addDocument, updateDocument, deleteDocument } from '../firebase-config.js';
import { createTable, createSearchBar, showToast, openDrawer, closeDrawer, showLoading, hideLoading } from '../ui.js';

let allDocuments = [];
let filteredDocuments = [];
let currentFilter = { search: '', month: '', status: '' };

export async function renderLivroOrdens(container, context) {
    container.innerHTML = `
        <div class="page-header">
            <h1>Livro de Ordens</h1>
            <button class="btn btn-primary" id="addDocumentBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Novo Documento
            </button>
        </div>
        
        ${createSearchBar({
            placeholder: 'Pesquisar documentos...',
            onSearch: 'window.livroOrdensSearch',
            filters: [
                {
                    onChange: 'window.livroOrdensFilterMonth',
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
                },
                {
                    onChange: 'window.livroOrdensFilterStatus',
                    options: [
                        { value: '', label: 'Todos os status' },
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'pendente', label: 'Pendente' },
                        { value: 'completo', label: 'Completo' },
                        { value: 'cancelado', label: 'Cancelado' }
                    ]
                }
            ]
        })}
        
        <div id="documentsTable">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
    `;
    
    // Setup event listeners
    document.getElementById('addDocumentBtn').addEventListener('click', () => showAddDocumentForm());
    
    // Setup search functions
    window.livroOrdensSearch = (value) => {
        currentFilter.search = value.toLowerCase();
        applyFilters();
    };
    
    window.livroOrdensFilterMonth = (value) => {
        currentFilter.month = value;
        applyFilters();
    };
    
    window.livroOrdensFilterStatus = (value) => {
        currentFilter.status = value;
        applyFilters();
    };
    
    // Setup global functions for actions
    window.viewDocument = (index) => {
        const doc = filteredDocuments[index];
        showDocumentDetails(doc);
    };
    
    window.editDocument = (index) => {
        const doc = filteredDocuments[index];
        showEditDocumentForm(doc);
    };
    
    window.deleteDocumentAction = async (index) => {
        const doc = filteredDocuments[index];
        
        const result = await Swal.fire({
            title: 'Excluir documento?',
            text: `Deseja excluir o documento "${doc.titulo}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F44336',
            cancelButtonColor: '#6C757D',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            showLoading();
            const { success } = await deleteDocument('livro-ordens', doc.id);
            hideLoading();
            
            if (success) {
                showToast('Documento excluído com sucesso!', 'success');
                loadDocuments();
            } else {
                showToast('Erro ao excluir documento', 'error');
            }
        }
    };
    
    // Load documents
    loadDocuments();
    
    // Setup realtime listener
    const unsubscribe = db.collection('livro-ordens')
        .orderBy('createdAt', 'desc')
        .onSnapshot(() => {
            loadDocuments();
        });
    
    context.addUnsubscriber(unsubscribe);
}

async function loadDocuments() {
    allDocuments = await getDocuments('livro-ordens');
    
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
                doc.titulo?.toLowerCase().includes(searchTerm) ||
                doc.numero?.toLowerCase().includes(searchTerm) ||
                doc.descricao?.toLowerCase().includes(searchTerm);
            
            if (!matchesSearch) return false;
        }
        
        // Month filter
        if (currentFilter.month) {
            const docDate = doc.data ? new Date(doc.data) : null;
            if (!docDate || docDate.getMonth() + 1 !== parseInt(currentFilter.month)) {
                return false;
            }
        }
        
        // Status filter
        if (currentFilter.status && doc.status !== currentFilter.status) {
            return false;
        }
        
        return true;
    });
    
    renderDocumentsTable();
}

function renderDocumentsTable() {
    const tableContainer = document.getElementById('documentsTable');
    
    const columns = [
        { key: 'numero', label: 'Número' },
        { key: 'titulo', label: 'Título' },
        { 
            key: 'data', 
            label: 'Data',
            render: (row) => row.data ? new Date(row.data).toLocaleDateString('pt-BR') : '-'
        },
        { 
            key: 'status', 
            label: 'Status',
            render: (row) => `<span class="badge badge-${getStatusClass(row.status)}">${row.status || 'pendente'}</span>`
        }
    ];
    
    const actions = [
        {
            label: 'Visualizar',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
            onClick: 'viewDocument'
        },
        {
            label: 'Editar',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
            onClick: 'editDocument'
        },
        {
            label: 'Excluir',
            icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
            onClick: 'deleteDocumentAction'
        }
    ];
    
    tableContainer.innerHTML = createTable(columns, filteredDocuments, {
        actions,
        emptyMessage: 'Nenhum documento encontrado',
        responsive: true
    });
}

function getStatusClass(status) {
    const statusMap = {
        'ativo': 'success',
        'completo': 'success',
        'pendente': 'warning',
        'cancelado': 'error'
    };
    
    return statusMap[status?.toLowerCase()] || 'warning';
}

function showDocumentDetails(doc) {
    const content = `
        <div class="document-details">
            <div class="detail-group">
                <label>Número</label>
                <p>${doc.numero || '-'}</p>
            </div>
            
            <div class="detail-group">
                <label>Título</label>
                <p>${doc.titulo || '-'}</p>
            </div>
            
            <div class="detail-group">
                <label>Data</label>
                <p>${doc.data ? new Date(doc.data).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            
            <div class="detail-group">
                <label>Status</label>
                <p><span class="badge badge-${getStatusClass(doc.status)}">${doc.status || 'pendente'}</span></p>
            </div>
            
            <div class="detail-group">
                <label>Descrição</label>
                <p>${doc.descricao || '-'}</p>
            </div>
            
            ${doc.fileUrl ? `
                <div class="detail-group">
                    <label>Arquivo</label>
                    <a href="${doc.fileUrl}" target="_blank" class="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        Abrir PDF
                    </a>
                </div>
            ` : ''}
            
            <div class="detail-group">
                <label>Criado em</label>
                <p>${doc.createdAt ? new Date(doc.createdAt.seconds * 1000).toLocaleString('pt-BR') : '-'}</p>
            </div>
            
            <div class="detail-group">
                <label>Atualizado em</label>
                <p>${doc.updatedAt ? new Date(doc.updatedAt.seconds * 1000).toLocaleString('pt-BR') : '-'}</p>
            </div>
        </div>
    `;
    
    openDrawer(content);
}

function showAddDocumentForm() {
    const content = `
        <form id="documentForm">
            <div class="form-group">
                <label class="form-label">Número *</label>
                <input type="text" class="form-control" name="numero" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Título *</label>
                <input type="text" class="form-control" name="titulo" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Data</label>
                <input type="date" class="form-control" name="data">
            </div>
            
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" name="status">
                    <option value="pendente">Pendente</option>
                    <option value="ativo">Ativo</option>
                    <option value="completo">Completo</option>
                    <option value="cancelado">Cancelado</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" name="descricao" rows="4"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="window.closeDrawer()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
        </form>
    `;
    
    openDrawer(content);
    
    // Make closeDrawer available globally
    window.closeDrawer = closeDrawer;
    
    document.getElementById('documentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        showLoading();
        const { success } = await addDocument('livro-ordens', {
            ...data,
            uploadedBy: context.currentUser.email
        });
        hideLoading();
        
        if (success) {
            showToast('Documento adicionado com sucesso!', 'success');
            closeDrawer();
            loadDocuments();
        } else {
            showToast('Erro ao adicionar documento', 'error');
        }
    });
}

function showEditDocumentForm(doc) {
    const content = `
        <form id="editDocumentForm">
            <div class="form-group">
                <label class="form-label">Número *</label>
                <input type="text" class="form-control" name="numero" value="${doc.numero || ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Título *</label>
                <input type="text" class="form-control" name="titulo" value="${doc.titulo || ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Data</label>
                <input type="date" class="form-control" name="data" value="${doc.data || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" name="status">
                    <option value="pendente" ${doc.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="ativo" ${doc.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                    <option value="completo" ${doc.status === 'completo' ? 'selected' : ''}>Completo</option>
                    <option value="cancelado" ${doc.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" name="descricao" rows="4">${doc.descricao || ''}</textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="window.closeDrawer()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Atualizar</button>
            </div>
        </form>
    `;
    
    openDrawer(content);
    
    // Make closeDrawer available globally
    window.closeDrawer = closeDrawer;
    
    document.getElementById('editDocumentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        showLoading();
        const { success } = await updateDocument('livro-ordens', doc.id, data);
        hideLoading();
        
        if (success) {
            showToast('Documento atualizado com sucesso!', 'success');
            closeDrawer();
            loadDocuments();
        } else {
            showToast('Erro ao atualizar documento', 'error');
        }
    });
}

// Add styles for document details
const styles = `
<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }
    
    .document-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .detail-group {
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--color-border);
    }
    
    .detail-group:last-child {
        border-bottom: none;
    }
    
    .detail-group label {
        font-weight: 600;
        color: var(--color-text-muted);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        display: block;
    }
    
    .detail-group p {
        margin: 0;
        color: var(--color-text);
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
    }
    
    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }
        
        .page-header h1 {
            margin: 0;
        }
    }
</style>
`;

document.head.insertAdjacentHTML('beforeend', styles);