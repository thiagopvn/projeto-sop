// firebase-config.js
// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDWeThpt6h1Y3zxNenpGf7eTYPsUhVlgXI",
    authDomain: "projeto-sop.firebaseapp.com",
    projectId: "projeto-sop",
    storageBucket: "projeto-sop.appspot.com",
    messagingSenderId: "509243342498",
    appId: "1:509243342498:web:29e941f3e16e7eea7721fb",
    measurementId: "G-H0D0G5SD3V"
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Referências para os serviços Firebase
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  // Funções auxiliares para autenticação
  const signIn = async (email, password) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      return true;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return false;
    }
  };
  
  const signOut = async () => {
    try {
      await auth.signOut();
      return true;
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      return false;
    }
  };
  
  // Verificar estado da autenticação
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("Usuário logado:", user.email);
      document.getElementById("login-container").style.display = "none";
      document.getElementById("app-container").style.display = "block";
      loadDocuments();
    } else {
      console.log("Usuário não logado");
      document.getElementById("login-container").style.display = "block";
      document.getElementById("app-container").style.display = "none";
    }
  });
