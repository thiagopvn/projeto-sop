import { db, getDocuments, addDocument, updateDocument, deleteDocument } from '../firebase-config.js';
import { showToast, showLoading, hideLoading, createModal } from '../ui.js';

let calendar = null;
let allEvents = [];

export async function renderCalendar(container, context) {
    container.innerHTML = `
        <div class="page-header">
            <h1>Calendário</h1>
            <button class="btn btn-primary" id="addEventBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Novo Evento
            </button>
        </div>
        
        <div class="calendar-container">
            <div id="calendar"></div>
        </div>
        
        <div class="calendar-legend">
            <h3>Legenda</h3>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #0057B8;"></div>
                    <span>QTA</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #3CC47C;"></div>
                    <span>QTM</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FFC107;"></div>
                    <span>Reunião</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #E30613;"></div>
                    <span>Prazo</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #6C757D;"></div>
                    <span>Outros</span>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners
    document.getElementById('addEventBtn').addEventListener('click', () => showAddEventModal());
    
    // Initialize calendar
    initializeCalendar();
    
    // Load events
    loadEvents();
    
    // Setup realtime listener for events
    const unsubscribe = db.collection('eventos')
        .onSnapshot(() => {
            loadEvents();
        });
    
    context.addUnsubscriber(unsubscribe);
}

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            list: 'Lista'
        },
        height: 'auto',
        eventDisplay: 'block',
        dayMaxEvents: 3,
        moreLinkText: (num) => `+${num} mais`,
        eventClick: handleEventClick,
        dateClick: handleDateClick,
        events: [],
        eventDidMount: function(info) {
            // Add tooltip
            info.el.setAttribute('title', info.event.extendedProps.description || info.event.title);
        }
    });
    
    calendar.render();
}

async function loadEvents() {
    showLoading();
    
    try {
        // Load calendar events
        const events = await getDocuments('eventos');
        
        // Load document deadlines from livro-ordens
        const documents = await getDocuments('livro-ordens');
        
        // Combine and format events
        allEvents = [];
        
        // Add calendar events
        events.forEach(event => {
            allEvents.push({
                id: event.id,
                title: event.titulo,
                start: event.dataInicio,
                end: event.dataFim || event.dataInicio,
                backgroundColor: getCategoryColor(event.categoria),
                borderColor: getCategoryColor(event.categoria),
                textColor: '#ffffff',
                extendedProps: {
                    description: event.descricao,
                    categoria: event.categoria,
                    type: 'event'
                }
            });
        });
        
        // Add document deadlines
        documents.forEach(doc => {
            if (doc.prazo) {
                allEvents.push({
                    id: `doc-${doc.id}`,
                    title: `Prazo: ${doc.titulo || doc.fileName}`,
                    start: doc.prazo,
                    backgroundColor: '#E30613',
                    borderColor: '#E30613',
                    textColor: '#ffffff',
                    extendedProps: {
                        description: `Prazo para ${doc.titulo || doc.fileName}`,
                        categoria: 'prazo',
                        type: 'deadline',
                        documentId: doc.id
                    }
                });
            }
        });
        
        // Update calendar
        calendar.removeAllEvents();
        calendar.addEventSource(allEvents);
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showToast('Erro ao carregar eventos', 'error');
    } finally {
        hideLoading();
    }
}

function getCategoryColor(categoria) {
    const colors = {
        'qta': '#0057B8',
        'qtm': '#3CC47C', 
        'reuniao': '#FFC107',
        'prazo': '#E30613',
        'outros': '#6C757D'
    };
    
    return colors[categoria] || colors.outros;
}

function handleEventClick(info) {
    const event = info.event;
    const props = event.extendedProps;
    
    if (props.type === 'deadline') {
        // Show document details
        showDocumentDeadlineDetails(event);
    } else {
        // Show event details
        showEventDetails(event);
    }
}

function handleDateClick(info) {
    showAddEventModal(info.dateStr);
}

function showEventDetails(event) {
    const props = event.extendedProps;
    
    const content = `
        <div class="event-details">
            <div class="detail-group">
                <label>Título</label>
                <p>${event.title}</p>
            </div>
            
            <div class="detail-group">
                <label>Data de Início</label>
                <p>${new Date(event.start).toLocaleDateString('pt-BR')}</p>
            </div>
            
            ${event.end && event.end !== event.start ? `
                <div class="detail-group">
                    <label>Data de Término</label>
                    <p>${new Date(event.end).toLocaleDateString('pt-BR')}</p>
                </div>
            ` : ''}
            
            <div class="detail-group">
                <label>Categoria</label>
                <p>
                    <span class="category-badge" style="background-color: ${event.backgroundColor};">
                        ${getCategoryLabel(props.categoria)}
                    </span>
                </p>
            </div>
            
            ${props.description ? `
                <div class="detail-group">
                    <label>Descrição</label>
                    <p>${props.description}</p>
                </div>
            ` : ''}
            
            <div class="event-actions">
                <button class="btn btn-secondary" onclick="window.editEvent('${event.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                </button>
                <button class="btn btn-danger" onclick="window.deleteEvent('${event.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Excluir
                </button>
            </div>
        </div>
    `;
    
    createModal({
        title: 'Detalhes do Evento',
        content,
        onClose: () => {
            delete window.editEvent;
            delete window.deleteEvent;
        }
    });
    
    // Global functions for actions
    window.editEvent = (id) => showEditEventModal(id);
    window.deleteEvent = (id) => deleteEventAction(id);
}

function showDocumentDeadlineDetails(event) {
    const content = `
        <div class="event-details">
            <div class="detail-group">
                <label>Documento</label>
                <p>${event.title.replace('Prazo: ', '')}</p>
            </div>
            
            <div class="detail-group">
                <label>Prazo</label>
                <p>${new Date(event.start).toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div class="detail-group">
                <label>Tipo</label>
                <p><span class="category-badge" style="background-color: #E30613;">Prazo de Documento</span></p>
            </div>
            
            <div class="event-actions">
                <button class="btn btn-primary" onclick="window.viewDocument('${event.extendedProps.documentId}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Ver Documento
                </button>
            </div>
        </div>
    `;
    
    createModal({
        title: 'Prazo de Documento',
        content,
        onClose: () => {
            delete window.viewDocument;
        }
    });
    
    window.viewDocument = (id) => {
        // Navigate to document details (implement based on your routing)
        window.app.navigateTo('livro-ordens');
    };
}

function showAddEventModal(selectedDate = null) {
    const today = new Date().toISOString().split('T')[0];
    const defaultDate = selectedDate || today;
    
    const content = `
        <form id="eventForm">
            <div class="form-group">
                <label class="form-label">Título *</label>
                <input type="text" class="form-control" name="titulo" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Data de Início *</label>
                <input type="date" class="form-control" name="dataInicio" value="${defaultDate}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Data de Término</label>
                <input type="date" class="form-control" name="dataFim">
            </div>
            
            <div class="form-group">
                <label class="form-label">Categoria *</label>
                <select class="form-control" name="categoria" required>
                    <option value="">Selecione uma categoria</option>
                    <option value="qta">QTA</option>
                    <option value="qtm">QTM</option>
                    <option value="reuniao">Reunião</option>
                    <option value="prazo">Prazo</option>
                    <option value="outros">Outros</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" name="descricao" rows="3"></textarea>
            </div>
        </form>
    `;
    
    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.saveEvent()">Salvar</button>
    `;
    
    const modalId = createModal({
        title: 'Novo Evento',
        content,
        footer
    });
    
    window.closeModal = () => {
        document.getElementById(modalId).remove();
    };
    
    window.saveEvent = async () => {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        if (!data.titulo || !data.dataInicio || !data.categoria) {
            showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        showLoading();
        
        const { success } = await addDocument('eventos', data);
        
        hideLoading();
        
        if (success) {
            showToast('Evento criado com sucesso!', 'success');
            window.closeModal();
            loadEvents();
        } else {
            showToast('Erro ao criar evento', 'error');
        }
    };
}

function showEditEventModal(eventId) {
    // Find event in allEvents
    const eventData = allEvents.find(e => e.id === eventId);
    if (!eventData) return;
    
    const content = `
        <form id="editEventForm">
            <div class="form-group">
                <label class="form-label">Título *</label>
                <input type="text" class="form-control" name="titulo" value="${eventData.title}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Data de Início *</label>
                <input type="date" class="form-control" name="dataInicio" value="${eventData.start.split('T')[0]}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Data de Término</label>
                <input type="date" class="form-control" name="dataFim" value="${eventData.end ? eventData.end.split('T')[0] : ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Categoria *</label>
                <select class="form-control" name="categoria" required>
                    <option value="">Selecione uma categoria</option>
                    <option value="qta" ${eventData.extendedProps.categoria === 'qta' ? 'selected' : ''}>QTA</option>
                    <option value="qtm" ${eventData.extendedProps.categoria === 'qtm' ? 'selected' : ''}>QTM</option>
                    <option value="reuniao" ${eventData.extendedProps.categoria === 'reuniao' ? 'selected' : ''}>Reunião</option>
                    <option value="prazo" ${eventData.extendedProps.categoria === 'prazo' ? 'selected' : ''}>Prazo</option>
                    <option value="outros" ${eventData.extendedProps.categoria === 'outros' ? 'selected' : ''}>Outros</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-control" name="descricao" rows="3">${eventData.extendedProps.description || ''}</textarea>
            </div>
        </form>
    `;
    
    const footer = `
        <button class="btn btn-secondary" onclick="window.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.updateEvent('${eventId}')">Atualizar</button>
    `;
    
    const modalId = createModal({
        title: 'Editar Evento',
        content,
        footer
    });
    
    window.updateEvent = async (id) => {
        const form = document.getElementById('editEventForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        if (!data.titulo || !data.dataInicio || !data.categoria) {
            showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        showLoading();
        
        const { success } = await updateDocument('eventos', id, data);
        
        hideLoading();
        
        if (success) {
            showToast('Evento atualizado com sucesso!', 'success');
            window.closeModal();
            loadEvents();
        } else {
            showToast('Erro ao atualizar evento', 'error');
        }
    };
}

async function deleteEventAction(eventId) {
    const result = await Swal.fire({
        title: 'Excluir evento?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#F44336',
        cancelButtonColor: '#6C757D',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        showLoading();
        
        const { success } = await deleteDocument('eventos', eventId);
        
        hideLoading();
        
        if (success) {
            showToast('Evento excluído com sucesso!', 'success');
            loadEvents();
            
            // Close any open modals
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
        } else {
            showToast('Erro ao excluir evento', 'error');
        }
    }
}

function getCategoryLabel(categoria) {
    const labels = {
        'qta': 'QTA',
        'qtm': 'QTM',
        'reuniao': 'Reunião',
        'prazo': 'Prazo',
        'outros': 'Outros'
    };
    
    return labels[categoria] || 'Outros';
}

// Add calendar-specific styles
const calendarStyles = `
<style>
    .calendar-container {
        background-color: var(--color-card);
        border-radius: var(--radius);
        padding: 1.5rem;
        box-shadow: var(--shadow-sm);
        margin-bottom: 2rem;
    }
    
    .calendar-legend {
        background-color: var(--color-card);
        border-radius: var(--radius);
        padding: 1.5rem;
        box-shadow: var(--shadow-sm);
    }
    
    .calendar-legend h3 {
        margin-bottom: 1rem;
        font-size: 1rem;
        font-weight: 600;
    }
    
    .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.2);
    }
    
    .event-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .event-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border);
    }
    
    .category-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
    }
    
    /* FullCalendar custom styles */
    .fc {
        font-family: inherit;
    }
    
    .fc-theme-standard td,
    .fc-theme-standard th {
        border-color: var(--color-border);
    }
    
    .fc-button-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        font-family: inherit;
    }
    
    .fc-button-primary:hover {
        background-color: #003d82;
        border-color: #003d82;
    }
    
    .fc-button-primary:disabled {
        background-color: var(--color-text-muted);
        border-color: var(--color-text-muted);
    }
    
    .fc-event {
        border: none;
        padding: 2px 4px;
        font-size: 0.875rem;
        cursor: pointer;
    }
    
    .fc-daygrid-event {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .fc-day-today {
        background-color: rgba(0, 87, 184, 0.04) !important;
    }
    
    @media (max-width: 768px) {
        .calendar-container {
            padding: 1rem;
        }
        
        .legend-items {
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .event-actions {
            flex-direction: column;
        }
        
        .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
        }
    }
</style>
`;

document.head.insertAdjacentHTML('beforeend', calendarStyles);