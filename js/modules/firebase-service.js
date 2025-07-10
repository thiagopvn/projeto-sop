// js/modules/firebase-service.js

import { db } from '../firebase-config.js';

export async function getDashboardData() {
  const snapshot = await db.collection('documents').get();
  const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Lógica para processar os documentos e retornar os dados do dashboard
  return { documents };
}

export async function getLivroOrdens() {
  const snapshot = await db.collection('livro-ordens').orderBy('data', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Adicionar outras funções de serviço aqui (getQTA, getQTM, etc.)