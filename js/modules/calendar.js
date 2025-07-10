// js/modules/calendar.js

import { db } from '../firebase-config.js';
import { showNotification, showConfirmation } from './ui.js';

const appContent = document.getElementById('app-content');

export function renderCalendar() {
  appContent.innerHTML = `
    <div class="calendar-container">
      <div id="calendar"></div>
    </div>
  `;

  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: async function() {
      const snapshot = await db.collection('events').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        start: doc.data().date,
        allDay: !doc.data().time,
        backgroundColor: getEventColor(doc.data().type),
        borderColor: getEventColor(doc.data().type)
      }));
    },
    // Placeholder for event interaction
    eventClick: function(info) {
      // openEventModal(info.event);
      showNotification('Evento clicado: ' + info.event.title, 'info');
    },
    select: function(info) {
      // openEventModal(null, info.startStr);
      showNotification('Data selecionada: ' + info.startStr, 'info');
    }
  });

  calendar.render();
}

function getEventColor(type) {
  switch (type) {
    case 'visita': return '#3CC47C';
    case 'formatura': return '#0057B8';
    case 'instrucao': return '#FFC107';
    case 'reuniao': return '#9C27B0';
    default: return '#6C757D';
  }
}

// Placeholder for saveEvent and deleteEvent functions
async function saveEvent(eventData) {
  try {
    // Actual save logic here
    showNotification('Evento salvo com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    showNotification('Erro ao salvar o evento.', 'error');
  }
}

async function deleteEvent(eventId) {
  const confirmed = await showConfirmation('Confirmar Exclusão', 'Tem certeza que deseja excluir este evento?');
  if (confirmed) {
    try {
      // Actual delete logic here
      showNotification('Evento excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      showNotification('Erro ao excluir o evento.', 'error');
    }
  }
}
