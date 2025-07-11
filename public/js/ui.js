// UI Helper Functions

// Loading State
let loadingElement = null;

export function showLoading() {
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.innerHTML = `
            <div class="loading-spinner">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
            </div>
        `;
        document.body.appendChild(loadingElement);
    }
    loadingElement.classList.add('show');
}

export function hideLoading() {
    if (loadingElement) {
        loadingElement.classList.remove('show');
    }
}

// Toast Notifications
export function showToast(message, type = 'success') {
    window.notyf.open({
        type,
        message
    });
}

// Initialize UI Components
export function initUI() {
    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
        
        // Restore sidebar state
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    }
    
    // Mobile Menu
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            toggleOverlay();
        });
    }
    
    // User Dropdown
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
        
        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Drawer
    const drawer = document.getElementById('drawer');
    const drawerClose = document.getElementById('drawerClose');
    
    if (drawerClose) {
        drawerClose.addEventListener('click', () => {
            closeDrawer();
        });
    }
}

// Drawer Functions
export function openDrawer(content) {
    const drawer = document.getElementById('drawer');
    const drawerContent = document.getElementById('drawerContent');
    
    if (drawer && drawerContent) {
        drawerContent.innerHTML = content;
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

export function closeDrawer() {
    const drawer = document.getElementById('drawer');
    if (drawer) {
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Mobile Overlay
function toggleOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('mobile-open');
            overlay.classList.remove('show');
        });
        document.body.appendChild(overlay);
    }
    
    overlay.classList.toggle('show');
}

// Create Table
export function createTable(columns, data, options = {}) {
    const { 
        onRowClick,
        actions,
        emptyMessage = 'Nenhum dado encontrado',
        responsive = true
    } = options;
    
    if (data.length === 0) {
        return `<div class="empty-state">${emptyMessage}</div>`;
    }
    
    // Desktop Table
    let tableHTML = `
        <div class="table-container ${responsive ? 'desktop-only' : ''}">
            <table class="table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col.label}</th>`).join('')}
                        ${actions ? '<th>Ações</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.forEach((row, index) => {
        tableHTML += `<tr ${onRowClick ? 'class="clickable" onclick="' + onRowClick + '(' + index + ')"' : ''}>`;
        
        columns.forEach(col => {
            const value = col.render ? col.render(row) : row[col.key] || '';
            tableHTML += `<td>${value}</td>`;
        });
        
        if (actions) {
            tableHTML += '<td class="actions">';
            actions.forEach(action => {
                tableHTML += `
                    <button class="icon-button" title="${action.label}" onclick="${action.onClick}(${index})">
                        ${action.icon}
                    </button>
                `;
            });
            tableHTML += '</td>';
        }
        
        tableHTML += '</tr>';
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    // Mobile Cards
    if (responsive) {
        tableHTML += '<div class="mobile-cards mobile-only">';
        
        data.forEach((row, index) => {
            tableHTML += `
                <div class="mobile-card" ${onRowClick ? 'onclick="' + onRowClick + '(' + index + ')"' : ''}>
                    <div class="mobile-card-header">
                        <span class="mobile-card-title">${row[columns[0].key]}</span>
                        ${row.status ? `<span class="badge badge-${getStatusClass(row.status)}">${row.status}</span>` : ''}
                    </div>
                    <div class="mobile-card-body">
            `;
            
            columns.slice(1).forEach(col => {
                if (col.key !== 'status') {
                    const value = col.render ? col.render(row) : row[col.key] || '';
                    tableHTML += `<div><strong>${col.label}:</strong> ${value}</div>`;
                }
            });
            
            if (actions) {
                tableHTML += '<div class="mobile-card-actions">';
                actions.forEach(action => {
                    tableHTML += `
                        <button class="icon-button" title="${action.label}" onclick="${action.onClick}(${index})">
                            ${action.icon}
                        </button>
                    `;
                });
                tableHTML += '</div>';
            }
            
            tableHTML += `
                    </div>
                </div>
            `;
        });
        
        tableHTML += '</div>';
    }
    
    return tableHTML;
}

// Status Helper
function getStatusClass(status) {
    const statusMap = {
        'ativo': 'success',
        'completo': 'success',
        'pendente': 'warning',
        'em andamento': 'warning',
        'cancelado': 'error',
        'inativo': 'error'
    };
    
    return statusMap[status.toLowerCase()] || 'secondary';
}

// Search and Filter Bar
export function createSearchBar(options = {}) {
    const {
        placeholder = 'Pesquisar...',
        onSearch,
        filters = []
    } = options;
    
    let html = '<div class="search-bar">';
    
    // Search Input
    html += `
        <div class="search-input">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input type="text" class="form-control" placeholder="${placeholder}" ${onSearch ? `oninput="${onSearch}(this.value)"` : ''}>
        </div>
    `;
    
    // Filters
    filters.forEach(filter => {
        html += `
            <select class="form-control" ${filter.onChange ? `onchange="${filter.onChange}(this.value)"` : ''}>
                ${filter.options.map(opt => 
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('')}
            </select>
        `;
    });
    
    html += '</div>';
    
    return html;
}

// File Upload Component
export function createFileUpload(options = {}) {
    const {
        accept = '.pdf,.doc,.docx',
        onFileSelect,
        dragDrop = true
    } = options;
    
    const uploadId = 'upload-' + Date.now();
    
    let html = `
        <div class="upload-area ${dragDrop ? 'drag-drop' : ''}" id="${uploadId}">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <p>Clique para selecionar ou arraste arquivos aqui</p>
            <p class="text-muted">Formatos aceitos: ${accept}</p>
            <input type="file" accept="${accept}" style="display: none;">
        </div>
    `;
    
    // Setup event listeners after rendering
    setTimeout(() => {
        const uploadArea = document.getElementById(uploadId);
        const fileInput = uploadArea.querySelector('input[type="file"]');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && onFileSelect) {
                onFileSelect(e.target.files[0]);
            }
        });
        
        if (dragDrop) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragging');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragging');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragging');
                
                if (e.dataTransfer.files.length > 0 && onFileSelect) {
                    onFileSelect(e.dataTransfer.files[0]);
                }
            });
        }
    }, 0);
    
    return html;
}

// Modal Component
export function createModal(options = {}) {
    const {
        title = 'Modal',
        content = '',
        footer = '',
        onClose
    } = options;
    
    const modalId = 'modal-' + Date.now();
    
    const modalHTML = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                    <button class="icon-button modal-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector('.modal-close');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
        if (onClose) onClose();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onClose) onClose();
        }
    });
    
    return modalId;
}

// Add required styles
const uiStyles = `
<style>
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease;
    }
    
    .loading-overlay.show {
        opacity: 1;
        visibility: visible;
    }
    
    .loading-spinner svg {
        animation: spin 1s linear infinite;
        color: var(--color-primary);
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--color-text-muted);
    }
    
    .clickable {
        cursor: pointer;
    }
    
    .clickable:hover {
        background-color: rgba(0, 87, 184, 0.04);
    }
    
    .search-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    
    .search-bar .search-input {
        flex: 1;
        min-width: 250px;
    }
    
    .text-muted {
        color: var(--color-text-muted);
        font-size: 0.875rem;
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }
    
    .modal {
        background-color: var(--color-card);
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
    }
    
    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .modal-title {
        margin: 0;
        font-size: 1.25rem;
    }
    
    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
    }
    
    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid var(--color-border);
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    .desktop-only {
        display: block;
    }
    
    .mobile-only {
        display: none;
    }
    
    @media (max-width: 768px) {
        .desktop-only {
            display: none;
        }
        
        .mobile-only {
            display: block;
        }
    }
</style>
`;

document.head.insertAdjacentHTML('beforeend', uiStyles);