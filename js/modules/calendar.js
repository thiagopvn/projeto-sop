// js/modules/calendar.js

import { firestoreService } from './firebase-service.js';
import * as ui from './ui.js';

export const renderCalendar = async () => {
  const appContent = document.getElementById('app-content');
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
    editable: true,
    selectable: true,
    events: [], // Events will be loaded from Firestore
    eventDidMount: function(info) {
      // Add tooltip for events
      info.el.title = info.event.title;
    },
    select: function(info) {
      // Handle event creation
      ui.showNotification('info', 'Criar novo evento');
      // Example: open a modal for event creation
    },
    eventClick: function(info) {
      // Handle event editing/viewing
      ui.showNotification('info', `Evento clicado: ${info.event.title}`);
      // Example: open a modal for event details
    },
    eventDrop: async function(info) {
      // Handle event drag and drop
      const confirmed = await ui.showConfirm('Mover Evento', 'Tem certeza que deseja mover este evento?');
      if (confirmed) {
        // Update event in Firestore
        ui.showNotification('success', 'Evento movido com sucesso!');
      } else {
        info.revert(); // Revert if not confirmed
      }
    },
    eventResize: async function(info) {
      // Handle event resize
      const confirmed = await ui.showConfirm('Redimensionar Evento', 'Tem certeza que deseja redimensionar este evento?');
      if (confirmed) {
        // Update event in Firestore
        ui.showNotification('success', 'Evento redimensionado com sucesso!');
      } else {
        info.revert(); // Revert if not confirmed
      }
    }
  });

  calendar.render();

  // Load events from Firestore
  try {
    const events = await firestoreService.getCollection('events');
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      color: event.color // Assuming color is stored in Firestore
    }));
    calendar.addEventSource(formattedEvents);
  } catch (error) {
    ui.showNotification('error', 'Erro ao carregar eventos do calendário.');
    console.error('Error loading calendar events:', error);
  }
};