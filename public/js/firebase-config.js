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

// Initialize Firebase only once
let firebaseApp = null;
let auth = null;
let db = null;
let storage = null;

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase não carregado!');
        return false;
    }
    
    try {
        // Initialize Firebase app if not already initialized
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase app inicializado');
        } else {
            firebaseApp = firebase.apps[0];
            console.log('✅ Firebase app já estava inicializado');
        }
        
        // Initialize services
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        
        console.log('✅ Serviços Firebase inicializados');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// Initialize immediately if Firebase is available
if (typeof firebase !== 'undefined') {
    initializeFirebase();
} else {
    // Wait for Firebase to load
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined') {
            console.log('🔄 Firebase detectado, inicializando...');
            initializeFirebase();
            clearInterval(checkFirebase);
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkFirebase);
        console.error('❌ Timeout: Firebase não carregou em 10 segundos');
    }, 10000);
}

// Export services (will be null until Firebase is initialized)
export { auth, db, storage };

// Storage reference getter (to avoid null reference)
export const getStorageRef = () => {
    if (!storage) {
        console.error('❌ Storage não inicializado');
        return null;
    }
    return storage.refFromURL('gs://projeto-sop.firebasestorage.app/');
};

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
        const storageRef = getStorageRef();
        if (!storageRef) {
            throw new Error('Storage não inicializado');
        }
        
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
        const storageRef = getStorageRef();
        if (!storageRef) {
            throw new Error('Storage não inicializado');
        }
        
        const fileRef = storageRef.child(path);
        await fileRef.delete();
        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar arquivo:", error);
        return { success: false, error: error.message };
    }
};