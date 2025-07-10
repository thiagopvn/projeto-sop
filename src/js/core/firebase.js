import { Config } from './config.js';

export class Firebase {
  constructor() {
    this.config = new Config();
    this.app = null;
    this.db = null;
    this.storage = null;
    this.listeners = new Map();
  }

  async init() {
    try {
      // Import Firebase modules dynamically
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      const { getFirestore, connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const { getStorage, connectStorageEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');

      // Initialize Firebase
      this.app = initializeApp(this.config.get('firebase.config'));
      this.db = getFirestore(this.app);
      this.storage = getStorage(this.app);

      console.log('Firebase inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
      return false;
    }
  }

  // Firestore operations
  async getCollection(collectionName) {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const querySnapshot = await getDocs(collection(this.db, collectionName));
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Erro ao buscar coleção ${collectionName}:`, error);
      throw error;
    }
  }

  async getDocument(collectionName, docId) {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const docRef = doc(this.db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Erro ao buscar documento ${docId}:`, error);
      throw error;
    }
  }

  async addDocument(collectionName, data) {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(this.db, collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error(`Erro ao adicionar documento em ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument(collectionName, docId, data) {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const docRef = doc(this.db, collectionName, docId);
      const docData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, docData);
      return true;
    } catch (error) {
      console.error(`Erro ao atualizar documento ${docId}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName, docId) {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const docRef = doc(this.db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Erro ao deletar documento ${docId}:`, error);
      throw error;
    }
  }

  // Real-time listeners
  async listenToCollection(collectionName, callback) {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const { collection, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const unsubscribe = onSnapshot(collection(this.db, collectionName), (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(docs);
      });
      
      this.listeners.set(collectionName, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error(`Erro ao criar listener para ${collectionName}:`, error);
      throw error;
    }
  }

  stopListening(collectionName) {
    const unsubscribe = this.listeners.get(collectionName);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(collectionName);
    }
  }

  // Storage operations
  async uploadFile(file, path) {
    if (!this.storage) throw new Error('Firebase Storage não inicializado');
    
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
      
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        path: snapshot.ref.fullPath,
        url: downloadURL,
        size: snapshot.metadata.size,
        contentType: snapshot.metadata.contentType
      };
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      throw error;
    }
  }

  async deleteFile(path) {
    if (!this.storage) throw new Error('Firebase Storage não inicializado');
    
    try {
      const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }

  async getFileURL(path) {
    if (!this.storage) throw new Error('Firebase Storage não inicializado');
    
    try {
      const { ref, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Erro ao obter URL do arquivo:', error);
      throw error;
    }
  }
}