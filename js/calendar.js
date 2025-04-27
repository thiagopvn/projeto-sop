// calendar.js - Funcionalidades do calendário de eventos

// Variáveis globais
let calendar = null;
let currentEventId = null;

// Inicializar o calendário quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se FullCalendar está disponível
  if (typeof FullCalendar !== 'undefined') {
    initCalendar();
  }
});

// Função para inicializar o calendário
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  // Criar instância do calendário
  calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'pt-br',
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    editable: true,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    events: function(info, successCallback, failureCallback) {
      // Carregar eventos do Firestore
      loadEvents(info.start, info.end)
        .then(events => successCallback(events))
        .catch(error => {
          console.error('Erro ao carregar eventos:', error);
          failureCallback(error);
        });
    },
    // Clicar em um dia vazio para criar evento
    select: function(info) {
      openEventModal(null, info.startStr);
    },
    // Clicar em um evento para editar
    eventClick: function(info) {
      openEventModal(info.event);
    },
    // Permitir arrastar e soltar evento (mudar data)
    eventDrop: function(info) {
      updateEventDate(info.event);
    },
    // Permitir redimensionar evento
    eventResize: function(info) {
      updateEventDate(info.event);
    },
    // Personalizar a aparência do evento
    eventDidMount: function(info) {
      // Adicionar classe baseada no tipo de evento
      const eventType = info.event.extendedProps.type || 'outro';
      info.el.classList.add('event-' + eventType);

      // Adicionar tooltip ao evento
      info.el.setAttribute('title', info.event.title);
    }
  });

  // Renderizar o calendário
  calendar.render();

  // Adicionar legenda para tipos de eventos
  addCalendarLegend();
}

// Função para carregar eventos do Firestore
async function loadEvents(start, end) {
  try {
    const eventsRef = db.collection('events');
    const snapshot = await eventsRef.get();
    
    const events = [];
    snapshot.forEach(doc => {
      const eventData = doc.data();
      events.push({
        id: doc.id,
        title: eventData.title,
        start: eventData.date + (eventData.time ? 'T' + eventData.time : ''),
        allDay: !eventData.time,
        extendedProps: {
          description: eventData.description,
          type: eventData.type
        }
      });
    });
    
    return events;
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    return [];
  }
}

// Função para abrir o modal de evento
function openEventModal(event, defaultDate = null) {
  const modalTitle = document.getElementById('event-modal-title');
  const titleInput = document.getElementById('event-title');
  const dateInput = document.getElementById('event-date');
  const timeInput = document.getElementById('event-time');
  const descriptionInput = document.getElementById('event-description');
  const typeInput = document.getElementById('event-type');
  const deleteBtn = document.getElementById('delete-event');

  // Limpar campos
  titleInput.value = '';
  dateInput.value = '';
  timeInput.value = '';
  descriptionInput.value = '';
  typeInput.value = 'visita';
  deleteBtn.style.display = 'none';

  if (event) {
    // Editar evento existente
    modalTitle.textContent = 'Editar Evento';
    titleInput.value = event.title;
    
    // Extrair data
    const eventDate = event.start ? new Date(event.start) : new Date();
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    
    // Extrair hora (se não for evento de dia inteiro)
    if (!event.allDay && eventDate.getHours() + eventDate.getMinutes() > 0) {
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const minutes = String(eventDate.getMinutes()).padStart(2, '0');
      timeInput.value = `${hours}:${minutes}`;
    }
    
    // Preencher descrição e tipo
    descriptionInput.value = event.extendedProps.description || '';
    typeInput.value = event.extendedProps.type || 'outro';
    
    // Mostrar botão de excluir
    deleteBtn.style.display = 'block';
    
    // Armazenar ID do evento atual
    currentEventId = event.id;
  } else {
    // Novo evento
    modalTitle.textContent = 'Novo Evento';
    currentEventId = null;
    
    // Se uma data foi passada, preencher o campo de data
    if (defaultDate) {
      dateInput.value = defaultDate.split('T')[0];
    } else {
      // Usar data atual
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${year}-${month}-${day}`;
    }
  }
  
  // Exibir o modal
  document.getElementById('event-modal').style.display = 'block';
}

// Função para fechar o modal de evento
function closeEventModal() {
  document.getElementById('event-modal').style.display = 'none';
}

// Função para salvar um evento
async function saveEvent() {
  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const description = document.getElementById('event-description').value.trim();
  const type = document.getElementById('event-type').value;
  
  // Validar campos obrigatórios
  if (!title || !date) {
    alert('Por favor, preencha o título e a data do evento.');
    return;
  }
  
  try {
    const eventData = {
      title,
      date,
      time,
      description,
      type,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.currentUser.uid
    };
    
    if (currentEventId) {
      // Atualizar evento existente
      await db.collection('events').doc(currentEventId).update({
        ...eventData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Não atualizar a data de criação
      });
    } else {
      // Criar novo evento
      await db.collection('events').add(eventData);
    }
    
    // Fechar modal e atualizar calendário
    closeEventModal();
    calendar.refetchEvents();
    
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    alert('Erro ao salvar o evento. Por favor, tente novamente.');
  }
}

// Função para excluir um evento
async function deleteEvent() {
  if (!currentEventId) return;
  
  const confirmDelete = confirm('Tem certeza que deseja excluir este evento?');
  if (!confirmDelete) return;
  
  try {
    await db.collection('events').doc(currentEventId).delete();
    
    // Fechar modal e atualizar calendário
    closeEventModal();
    calendar.refetchEvents();
    
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    alert('Erro ao excluir o evento. Por favor, tente novamente.');
  }
}

// Função para atualizar a data de um evento após arrastar/soltar
async function updateEventDate(event) {
  if (!event.id) return;
  
  try {
    const startDate = event.start;
    
    // Extrair data
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Extrair hora (se não for evento de dia inteiro)
    let timeStr = '';
    if (!event.allDay && startDate.getHours() + startDate.getMinutes() > 0) {
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');
      timeStr = `${hours}:${minutes}`;
    }
    
    // Atualizar no Firestore
    await db.collection('events').doc(event.id).update({
      date: dateStr,
      time: timeStr,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('Erro ao atualizar data do evento:', error);
    calendar.refetchEvents(); // Reverter para data original
  }
}

// Função para adicionar legenda de cores no calendário
function addCalendarLegend() {
  const container = document.getElementById('calendar-container');
  if (!container) return;
  
  // Criar div da legenda
  const legend = document.createElement('div');
  legend.className = 'calendar-legend';
  
  // Tipos de eventos
  const eventTypes = [
    { type: 'visita', label: 'Visita' },
    { type: 'formatura', label: 'Formatura' },
    { type: 'instrucao', label: 'Instrução' },
    { type: 'reuniao', label: 'Reunião' },
    { type: 'outro', label: 'Outro' }
  ];
  
  // Adicionar itens da legenda
  eventTypes.forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    const colorBox = document.createElement('div');
    colorBox.className = `legend-color ${item.type}`;
    
    const label = document.createElement('span');
    label.textContent = item.label;
    
    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    legend.appendChild(legendItem);
  });
  
  // Inserir legenda antes do calendário
  const calendarEl = document.getElementById('calendar');
  container.insertBefore(legend, calendarEl);
}

// Eventos para modal de evento
document.addEventListener('DOMContentLoaded', function() {
  // Botão "Novo Evento"
  const addEventBtn = document.getElementById('add-event-btn');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => openEventModal());
  }
  
  // Fechar o modal
  const closeBtn = document.querySelector('.close-event-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEventModal);
  }
  
  // Botão "Cancelar"
  const cancelBtn = document.getElementById('cancel-event');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEventModal);
  }
  
  // Botão "Salvar"
  const saveBtn = document.getElementById('save-event');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveEvent);
  }
  
  // Botão "Excluir"
  const deleteBtn = document.getElementById('delete-event');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteEvent);
  }
  
  // REMOVA OU COMENTE O BLOCO ABAIXO:
  /*
  // Ao clicar na categoria "CALENDÁRIO"
  const calendarCategory = document.querySelector('li[data-category="calendario"]');
  if (calendarCategory) {
    calendarCategory.addEventListener('click', function() {
      // Ocultar elementos não relacionados ao calendário
      document.getElementById('document-container').style.display = 'none';
      document.getElementById('month-filter').style.display = 'none';
      document.getElementById('upload-btn').style.display = 'none';
      
      // Exibir elementos do calendário
      document.getElementById('calendar-container').style.display = 'block';
      document.getElementById('add-event-btn').style.display = 'inline-flex';
      
      // Atualizar eventos do calendário
      if (calendar) {
        calendar.refetchEvents();
      }
    });
    
    // Adicionar evento para todas as outras categorias
    const otherCategories = document.querySelectorAll('li[data-category]:not([data-category="calendario"])');
    otherCategories.forEach(category => {
      category.addEventListener('click', function() {
        // Ocultar calendário
        document.getElementById('calendar-container').style.display = 'none';
        document.getElementById('add-event-btn').style.display = 'none';
        
        // Exibir elementos da lista de documentos
        document.getElementById('document-container').style.display = 'block';
        document.getElementById('month-filter').style.display = 'inline-flex';
        document.getElementById('upload-btn').style.display = 'inline-flex';
      });
    });
  }
  */
});