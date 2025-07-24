// js/modules/firebase-service.js

import { db, storage } from '../firebase-config.js';

// Firestore Services
export const firestoreService = {
  async getCollection(collectionName) {
    try {
      const snapshot = await db.collection(collectionName).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting collection:", error);
      throw error;
    }
  },

  async getDocument(collectionName, docId) {
    try {
      const doc = await db.collection(collectionName).doc(docId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error("Error getting document:", error);
      throw error;
    }
  },

  async addDocument(collectionName, data) {
    try {
      const docRef = await db.collection(collectionName).add(data);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  },

  async updateDocument(collectionName, docId, data) {
    try {
      await db.collection(collectionName).doc(docId).update(data);
      return true;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  },

  async deleteDocument(collectionName, docId) {
    try {
      await db.collection(collectionName).doc(docId).delete();
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },

  // Real-time listener for a collection
  onCollectionSnapshot(collectionName, callback) {
    return db.collection(collectionName).onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, error => {
      console.error("Error listening to collection:", error);
    });
  },

  // Real-time listener for a document
  onDocumentSnapshot(collectionName, docId, callback) {
    return db.collection(collectionName).doc(docId).onSnapshot(doc => {
      const data = doc.exists ? { id: doc.id, ...doc.data() } : null;
      callback(data);
    }, error => {
      console.error("Error listening to document:", error);
    });
  }
};

// Storage Services
export const storageService = {
  async uploadFile(path, file) {
    try {
      const storageRef = storage.ref(path + '/' + file.name);
      const snapshot = await storageRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  },

  async deleteFile(url) {
    try {
      const storageRef = storage.refFromURL(url);
      await storageRef.delete();
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }
};
