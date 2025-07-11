// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDWeThpt6h1Y3zxNenpGf7eTYPsUhVlgXI",
    authDomain: "projeto-sop.firebaseapp.com",
    projectId: "projeto-sop",
    storageBucket: "projeto-sop.appspot.com",
    messagingSenderId: "509243342498",
    appId: "1:509243342498:web:29e941f3e16e7eea7721fb",
    measurementId: "G-H0D0G5SD3V"
};

// Wait for Firebase to load
if (typeof firebase === 'undefined') {
    console.error('Firebase não carregado!');
} else {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
}

// Firebase Services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

// Storage reference
export const storageRef = storage.refFromURL('gs://projeto-sop.firebasestorage.app/');

// Auth helpers
export const signIn = async (email, password) => {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        return { success: false, error: error.message };
    }
};

export const signOut = async () => {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        return { success: false, error: error.message };
    }
};

// Get current user
export const getCurrentUser = () => {
    return auth.currentUser;
};

// Auth state observer
export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};

// Firestore helpers
export const getDocuments = async (collection, orderBy = 'createdAt', order = 'desc') => {
    try {
        const snapshot = await db.collection(collection)
            .orderBy(orderBy, order)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Erro ao buscar documentos:", error);
        return [];
    }
};

export const addDocument = async (collection, data) => {
    try {
        const docRef = await db.collection(collection).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao adicionar documento:", error);
        return { success: false, error: error.message };
    }
};

export const updateDocument = async (collection, docId, data) => {
    try {
        await db.collection(collection).doc(docId).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar documento:", error);
        return { success: false, error: error.message };
    }
};

export const deleteDocument = async (collection, docId) => {
    try {
        await db.collection(collection).doc(docId).delete();
        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar documento:", error);
        return { success: false, error: error.message };
    }
};

// Storage helpers
export const uploadFile = async (file, path) => {
    try {
        const fileRef = storageRef.child(path);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return { success: true, url: downloadURL };
    } catch (error) {
        console.error("Erro ao fazer upload:", error);
        return { success: false, error: error.message };
    }
};

export const deleteFile = async (path) => {
    try {
        const fileRef = storageRef.child(path);
        await fileRef.delete();
        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar arquivo:", error);
        return { success: false, error: error.message };
    }
};