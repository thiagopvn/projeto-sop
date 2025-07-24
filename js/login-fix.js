// login-fix.js - Garantir que a tela de login permaneça centralizada
document.addEventListener('DOMContentLoaded', function() {
    // Referência para o container de login
    const loginContainer = document.getElementById('login-container');
    const loginCard = document.querySelector('.login-card');
    
    if (loginContainer && loginCard) {
      // Função para garantir que o card de login permaneça centralizado
      function ensureCentered() {
        // Forçar centralização com estilo inline (prioridade mais alta)
        loginCard.style.position = "static";
        loginCard.style.top = "auto";
        loginCard.style.left = "auto";
        loginCard.style.transform = "none";
        loginCard.style.margin = "0 auto";
        
        // Garantir que o container esteja usando flex
        loginContainer.style.display = "flex";
        loginContainer.style.justifyContent = "center";
        loginContainer.style.alignItems = "center";
      }
      
      // Aplicar imediatamente
      ensureCentered();
      
      // Aplicar novamente após um breve atraso para sobrescrever quaisquer mudanças assíncronas
      setTimeout(ensureCentered, 100);
      setTimeout(ensureCentered, 500);
      
      // Observar mudanças no DOM que possam afetar o posicionamento
      const observer = new MutationObserver(ensureCentered);
      observer.observe(document.body, { 
        attributes: true, 
        childList: true, 
        subtree: true 
      });
    }
  });