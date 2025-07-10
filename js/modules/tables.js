// js/modules/tables.js

import { firestoreService } from './firebase-service.js';
import * as ui from './ui.js';

export const renderLivroOrdens = async () => {
  const appContent = document.getElementById('app-content');
  appContent.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <h2>Livro de Ordens</h2>
        <div class="filter-group">
          <input type="text" class="search-input" placeholder="Buscar...">
          <select>
            <option value="">Mês</option>
          </select>
          <select>
            <option value="">Ano</option>
          </select>
          <select>
            <option value="">Status</option>
          </select>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Data</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="livro-ordens-table-body">
          <!-- Data will be loaded here -->
        </tbody>
      </table>
    </div>
    <div id="drawer" class="drawer">
      <div class="drawer-header">
        <h3>Detalhes do Documento</h3>
        <button class="close-btn"><i class="ph-fill ph-x"></i></button>
      </div>
      <div class="drawer-content">
        <p>Nome: <span id="drawer-name"></span></p>
        <p>Data: <span id="drawer-date"></span></p>
        <p>Upload por: <span id="drawer-uploader"></span></p>
        <p>Link: <a id="drawer-link" href="#" target="_blank"></a></p>
        <div id="drawer-preview"></div>
      </div>
    </div>
  `;

  const tableBody = document.getElementById('livro-ordens-table-body');
  const drawer = document.getElementById('drawer');
  const closeDrawerBtn = drawer.querySelector('.close-btn');

  closeDrawerBtn.addEventListener('click', () => {
    drawer.classList.remove('open');
  });

  // Placeholder for fetching and rendering data
  try {
    const docs = await firestoreService.getCollection('livro-ordens');
    tableBody.innerHTML = docs.map(doc => `
      <tr data-id="${doc.id}">
        <td data-label="Título">${doc.title}</td>
        <td data-label="Data">${doc.date}</td>
        <td data-label="Status">${doc.status}</td>
        <td data-label="Ações">
          <button class="btn-icon view-btn" data-id="${doc.id}" title="Visualizar"><i class="ph-fill ph-eye"></i></button>
          <button class="btn-icon edit-btn" data-id="${doc.id}" title="Editar"><i class="ph-fill ph-pencil"></i></button>
          <button class="btn-icon download-btn" data-id="${doc.id}" title="Download"><i class="ph-fill ph-download"></i></button>
          <button class="btn-icon delete-btn" data-id="${doc.id}" title="Excluir"><i class="ph-fill ph-trash"></i></button>
        </td>
      </tr>
    `).join('');

    tableBody.addEventListener('click', async (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const docId = row.dataset.id;
        const doc = await firestoreService.getDocument('livro-ordens', docId);
        if (doc) {
          document.getElementById('drawer-name').textContent = doc.title;
          document.getElementById('drawer-date').textContent = doc.date;
          document.getElementById('drawer-uploader').textContent = doc.uploader;
          document.getElementById('drawer-link').href = doc.downloadURL;
          document.getElementById('drawer-link').textContent = 'Abrir Documento';
          // Placeholder for PDF preview
          document.getElementById('drawer-preview').innerHTML = '<p>Preview do PDF aqui</p>';
          drawer.classList.add('open');
        }
      }

      if (e.target.closest('.delete-btn')) {
        const confirmed = await ui.showConfirm('Confirmar Exclusão', 'Tem certeza que deseja excluir este documento?');
        if (confirmed) {
          const idToDelete = e.target.closest('.delete-btn').dataset.id;
          await firestoreService.deleteDocument('livro-ordens', idToDelete);
          ui.showNotification('success', 'Documento excluído com sucesso!');
          renderLivroOrdens(); // Re-render table
        }
      }
    });

  } catch (error) {
    ui.showNotification('error', 'Erro ao carregar Livro de Ordens.');
    console.error('Error rendering Livro de Ordens:', error);
  }
};