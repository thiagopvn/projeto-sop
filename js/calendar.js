let calendar = null;
let currentEventId = null;

// Removed DOMContentLoaded listener from here. initCalendar will be called from app.js

function initCalendar() {
  console.log('initCalendar called');
  const calendarEl = document.getElementById('calendar');
  console.log('calendarEl:', calendarEl);
  if (!calendarEl) {
    console.error('Calendar element #calendar not found!');
    return;
  }

  // Check element dimensions
  const rect = calendarEl.getBoundingClientRect();
  console.log('calendarEl dimensions:', { width: rect.width, height: rect.height });

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
      loadEvents(info.start, info.end)
        .then(events => successCallback(events))
        .catch(error => {
          console.error('Erro ao carregar eventos:', error);
          failureCallback(error);
        });
    },
    select: function(info) {
      openEventModal(null, info.startStr);
    },
    eventClick: function(info) {
      openEventModal(info.event);
    },
    eventDrop: function(info) {
      updateEventDate(info.event);
    },
    eventResize: function(info) {
      updateEventDate(info.event);
    },
    eventDidMount: function(info) {
      const eventType = info.event.extendedProps.type || 'outro';
      info.el.classList.add('event-' + eventType);
      info.el.setAttribute('title', info.event.title);
    }
  });

  calendar.render();
  addCalendarLegend();
}

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

function openEventModal(event, defaultDate = null) {
  const modalTitle = document.getElementById('event-modal-title');
  const titleInput = document.getElementById('event-title');
  const dateInput = document.getElementById('event-date');
  const timeInput = document.getElementById('event-time');
  const descriptionInput = document.getElementById('event-description');
  const typeInput = document.getElementById('event-type');
  const deleteBtn = document.getElementById('delete-event');

  titleInput.value = '';
  dateInput.value = '';
  timeInput.value = '';
  descriptionInput.value = '';
  typeInput.value = 'visita';
  deleteBtn.style.display = 'none';

  if (event) {
    modalTitle.textContent = 'Editar Evento';
    titleInput.value = event.title;
    
    const eventDate = event.start ? new Date(event.start) : new Date();
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    
    if (!event.allDay && eventDate.getHours() + eventDate.getMinutes() > 0) {
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const minutes = String(eventDate.getMinutes()).padStart(2, '0');
      timeInput.value = `${hours}:${minutes}`;
    }
    
    descriptionInput.value = event.extendedProps.description || '';
    typeInput.value = event.extendedProps.type || 'outro';
    
    deleteBtn.style.display = 'block';
    currentEventId = event.id;
  } else {
    modalTitle.textContent = 'Novo Evento';
    currentEventId = null;
    
    if (defaultDate) {
      dateInput.value = defaultDate.split('T')[0];
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      dateInput.value = `${year}-${month}-${day}`;
    }
  }
  
  document.getElementById('event-modal').style.display = 'block';
}

function closeEventModal() {
  document.getElementById('event-modal').style.display = 'none';
}

async function saveEvent() {
  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const description = document.getElementById('event-description').value.trim();
  const type = document.getElementById('event-type').value;
  
  if (!title || !date) {
    if (window.showNotification) {
      window.showNotification('Por favor, preencha o título e a data do evento.', 'error');
    } else {
      alert('Por favor, preencha o título e a data do evento.');
    }
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
      await db.collection('events').doc(currentEventId).update({
        ...eventData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('events').add(eventData);
    }
    
    closeEventModal();
    calendar.refetchEvents();
    
    if (window.showNotification) {
      window.showNotification('Evento salvo com sucesso!', 'success');
    }
    
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao salvar o evento.', 'error');
    } else {
      alert('Erro ao salvar o evento. Por favor, tente novamente.');
    }
  }
}

async function deleteEvent() {
  if (!currentEventId) return;
  
  const confirmDelete = confirm('Tem certeza que deseja excluir este evento?');
  if (!confirmDelete) return;
  
  try {
    await db.collection('events').doc(currentEventId).delete();
    
    closeEventModal();
    calendar.refetchEvents();
    
    if (window.showNotification) {
      window.showNotification('Evento excluído com sucesso!', 'success');
    }
    
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    if (window.showNotification) {
      window.showNotification('Erro ao excluir o evento.', 'error');
    } else {
      alert('Erro ao excluir o evento. Por favor, tente novamente.');
    }
  }
}

async function updateEventDate(event) {
  if (!event.id) return;
  
  try {
    const startDate = event.start;
    
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    let timeStr = '';
    if (!event.allDay && startDate.getHours() + startDate.getMinutes() > 0) {
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');
      timeStr = `${hours}:${minutes}`;
    }
    
    await db.collection('events').doc(event.id).update({
      date: dateStr,
      time: timeStr,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('Erro ao atualizar data do evento:', error);
    calendar.refetchEvents();
  }
}

function addCalendarLegend() {
  const container = document.getElementById('calendar-container');
  if (!container) return;
  
  const existingLegend = container.querySelector('.calendar-legend');
  if (existingLegend) return;
  
  const legend = document.createElement('div');
  legend.className = 'flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-lg';
  
  const eventTypes = [
    { type: 'visita', label: 'Visita', color: 'bg-green-500' },
    { type: 'formatura', label: 'Formatura', color: 'bg-blue-500' },
    { type: 'instrucao', label: 'Instrução', color: 'bg-yellow-500' },
    { type: 'reuniao', label: 'Reunião', color: 'bg-purple-500' },
    { type: 'outro', label: 'Outro', color: 'bg-gray-500' }
  ];
  
  eventTypes.forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.className = 'flex items-center';
    legendItem.innerHTML = `
      <div class="w-4 h-4 ${item.color} rounded mr-2"></div>
      <span class="text-sm text-gray-700">${item.label}</span>
    `;
    legend.appendChild(legendItem);
  });
  
  const calendarEl = document.getElementById('calendar');
  container.insertBefore(legend, calendarEl);
}

document.addEventListener('DOMContentLoaded', function() {
  const addEventBtn = document.getElementById('add-event-btn');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => openEventModal());
  }
  
  const closeBtn = document.querySelector('.close-event-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEventModal);
  }
  
  const cancelBtn = document.getElementById('cancel-event');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEventModal);
  }
  
  const saveBtn = document.getElementById('save-event');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveEvent);
  }
  
  const deleteBtn = document.getElementById('delete-event');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteEvent);
  }
});
