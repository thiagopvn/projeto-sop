// js/modules/tables.js

import { getLivroOrdens } from './firebase-service.js';
import { showNotification, showConfirmation } from './ui.js';

const appContent = document.getElementById('app-content');

export async function renderLivroOrdens() {
  appContent.innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <h2>Livro de Ordens</h2>
        <div class="table-filters">
          <input type="text" id="search" placeholder="Buscar...">
          <button class="btn btn-primary">Upload</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome do Documento</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="table-body">
          <!-- Skeleton loader -->
          <tr><td colspan="3">Carregando...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="drawer" class="drawer"></div>
  `;

  const data = await getLivroOrdens();
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.nome}</td>
      <td>${new Date(item.data).toLocaleDateString()}</td>
      <td>
        <button class="action-btn view-btn" data-id="${item.id}" aria-label="View Document"><i class="fas fa-eye"></i></button>
        <button class="action-btn edit-btn" data-id="${item.id}" aria-label="Edit Document"><i class="fas fa-edit"></i></button>
        <button class="action-btn download-btn" data-id="${item.id}" aria-label="Download Document"><i class="fas fa-download"></i></button>
        <button class="action-btn delete-btn" data-id="${item.id}" aria-label="Delete Document"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tableBody.appendChild(row);

    // Attach event listener for delete button
    row.querySelector('.delete-btn').addEventListener('click', () => deleteLivroOrdem(item.id));
  });
}

async function deleteLivroOrdem(id) {
  const confirmed = await showConfirmation('Confirmar Exclusão', 'Tem certeza que deseja excluir este documento?');
  if (confirmed) {
    try {
      // Placeholder for actual delete logic
      console.log('Deleting document with ID:', id);
      showNotification('Documento excluído com sucesso!', 'success');
      // Re-render the table after deletion
      renderLivroOrdens();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      showNotification('Erro ao excluir documento.', 'error');
    }
  }
}
