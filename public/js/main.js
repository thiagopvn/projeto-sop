import { auth, onAuthStateChanged, signIn, signOut } from './firebase-config.js';
import { initUI, showToast, showLoading, hideLoading } from './ui.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderLivroOrdens } from './pages/livro-ordens.js';
import { renderQTA } from './pages/qta.js';
import { renderQTM } from './pages/qtm.js';
import { renderCalendar } from './pages/calendario.js';

// Initialize Notyf
window.notyf = new Notyf({
    duration: 4000,
    position: { x: 'right', y: 'top' },
    types: [
        {
            type: 'success',
            background: '#3CC47C',
            icon: false
        },
        {
            type: 'error',
            background: '#F44336',
            icon: false
        },
        {
            type: 'warning',
            background: '#FFC107',
            icon: false
        }
    ]
});

// App State
let currentUser = null;
let currentRoute = 'dashboard';
let unsubscribers = [];

// Routes Configuration
const routes = {
    'dashboard': {
        title: 'Dashboard',
        render: renderDashboard
    },
    'livro-ordens': {
        title: 'Livro de Ordens',
        render: renderLivroOrdens
    },
    'qta': {
        title: 'QTA',
        render: renderQTA
    },
    'qtm': {
        title: 'QTM',
        render: renderQTM
    },
    'calendario': {
        title: 'Calendário',
        render: renderCalendar
    }
};

// Router Function
function navigateTo(route) {
    if (!routes[route]) {
        route = 'dashboard';
    }
    
    currentRoute = route;
    
    // Update URL without causing page reload
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `#${route}`);
    } else {
        window.location.hash = route;
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.nav-item[href="#${route}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Update page title
    document.getElementById('pageTitle').textContent = routes[route].title;
    document.title = `${routes[route].title} - Projeto SOP`;
    
    // Clear previous subscriptions
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
    
    // Render new content
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = '<div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>';
    
    // Call route render function
    routes[route].render(viewContainer, { 
        currentUser,
        addUnsubscriber: (unsub) => unsubscribers.push(unsub)
    });
}

// Handle hash changes (only when app is initialized)
window.addEventListener('hashchange', () => {
    if (currentUser && document.querySelector('.app-container').style.display !== 'none') {
        const route = window.location.hash.slice(1) || 'dashboard';
        console.log('🔄 Hash changed to:', route);
        navigateTo(route);
    }
});

// Initialize App
function initApp() {
    // Initialize UI components
    initUI();
    
    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.getAttribute('href').slice(1);
            navigateTo(route);
        });
    });
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        const result = await Swal.fire({
            title: 'Sair do sistema?',
            text: 'Você será desconectado do sistema.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F44336',
            cancelButtonColor: '#6C757D',
            confirmButtonText: 'Sim, sair',
            cancelButtonText: 'Cancelar'
        });
        
        if (result.isConfirmed) {
            console.log('🚪 Fazendo logout...');
            try {
                await auth.signOut();
                console.log('✅ Logout realizado');
                showToast('Logout realizado com sucesso!', 'success');
                // Don't reload - let onAuthStateChanged handle the transition
            } catch (error) {
                console.error('❌ Erro no logout:', error);
                showToast('Erro ao fazer logout', 'error');
            }
        }
    });
    
    // Setup user info
    if (currentUser) {
        const userName = currentUser.email.split('@')[0];
        document.getElementById('userMenuToggle').querySelector('img').src = 
            `https://ui-avatars.com/api/?name=${userName}&background=0057B8&color=fff`;
    }
    
    // Navigate to initial route
    const initialRoute = window.location.hash.slice(1) || 'dashboard';
    navigateTo(initialRoute);
}

// Prevent multiple initializations
let isAppInitialized = false;

// Prevent page reloads during login process
window.addEventListener('beforeunload', (e) => {
    if (currentUser) {
        console.log('⚠️ Tentativa de reload detectada - prevenindo...');
        e.preventDefault();
        e.returnValue = '';
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (isAppInitialized) {
        console.log('⚠️ App já foi inicializado, ignorando...');
        return;
    }
    
    console.log('🚀 DOM loaded, inicializando aplicação...');
    isAppInitialized = true;
    
    // Clear any query parameters from URL
    if (window.location.search) {
        console.log('🧹 Removendo query parameters da URL');
        window.history.replaceState(null, '', window.location.pathname);
    }
    
    setupLoginForm();
    setupAuthObserver();
});

// Setup login form handler
function setupLoginForm() {
    console.log('🔧 Iniciando setupLoginForm...');
    console.log('🔍 Verificando disponibilidade do Firebase:');
    console.log('  - typeof firebase:', typeof firebase);
    console.log('  - auth object:', auth);
    console.log('  - auth available:', !!auth);
    
    if (!auth) {
        console.error('❌ Firebase auth não disponível durante setup do form!');
        // Tentar novamente em 500ms
        setTimeout(setupLoginForm, 500);
        return;
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('📝 Form de login encontrado');
        console.log('📝 Form ID:', loginForm.id);
        console.log('📝 Form class:', loginForm.className);
        
        // Check if form already has listeners
        const existingListeners = loginForm.hasAttribute('data-listener-added');
        if (existingListeners) {
            console.log('⚠️ Form já possui listener configurado');
            return;
        }
        
        // Mark form as having listener
        loginForm.setAttribute('data-listener-added', 'true');
        console.log('✅ Marcando form como configurado');
        
        // Add listener to button directly as well
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        console.log('🔘 Submit button:', submitBtn);
        
        const handleLogin = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔐 LOGIN FORM SUBMITTED - Evento capturado!');
            console.log('🔍 Event type:', e.type);
            console.log('🔍 Event target:', e.target);
            console.log('🔍 Current target:', e.currentTarget);
            
            // Debug Firebase availability
            console.log('🔍 Estado atual do Firebase:');
            console.log('  - typeof firebase:', typeof firebase);
            console.log('  - auth object:', auth);
            console.log('  - auth type:', typeof auth);
            console.log('  - auth.currentUser:', auth?.currentUser);
            
            // Check if Firebase auth is available
            if (!auth) {
                console.error('❌ Firebase auth não está disponível no momento do login');
                showToast('Erro: Firebase não inicializado', 'error');
                return;
            }
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            console.log('📧 Email:', email);
            console.log('🔑 Password length:', password.length);
            
            if (!email || !password) {
                console.error('❌ Email ou senha vazios');
                alert('Preencha email e senha');
                return;
            }
            
            // Disable form to prevent multiple submissions
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Entrando...';
            
            try {
                console.log('🔍 Tentando login com:', email);
                console.log('🔑 Auth object:', auth);
                
                // Call Firebase auth directly
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                console.log('✅ Login Firebase bem-sucedido:', userCredential.user.email);
                
                showToast('Login realizado com sucesso!', 'success');
                
                // Prevent any navigation or reload
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
                
                // Don't manually redirect - let onAuthStateChanged handle it
                console.log('⏳ Aguardando onAuthStateChanged...');
                
            } catch (error) {
                console.error('❌ Erro no login:', error);
                
                let errorMessage = 'Erro ao fazer login';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Usuário não encontrado';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Senha incorreta';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                        break;
                    default:
                        errorMessage = error.message || 'Erro desconhecido';
                }
                
                showToast(errorMessage, 'error');
            } finally {
                // Re-enable form
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        };
        
        // Add listeners to both form and button
        console.log('🔗 Adicionando event listeners...');
        
        loginForm.addEventListener('submit', handleLogin, false);
        console.log('✅ Listener de submit adicionado ao form');
        
        if (submitBtn) {
            submitBtn.addEventListener('click', handleLogin, false);
            console.log('✅ Listener de click adicionado ao botão');
        }
        
        // Test if button is clickable
        console.log('🧪 Testando clique no botão...');
        submitBtn?.addEventListener('click', () => {
            console.log('🖱️ BOTÃO CLICADO - Teste básico funcionando!');
        });
        
        console.log('✅ Login form handler configurado completamente');
    } else {
        console.error('❌ Login form não encontrado');
    }
}

// Setup auth state observer
function setupAuthObserver() {
    let isInitialized = false;
    
    onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? `Logged in: ${user.email}` : 'Logged out');
        console.log('Is initialized:', isInitialized);
        
        if (user) {
            currentUser = user;
            console.log('Usuário autenticado:', user.email);
            
            // Hide login, show app
            const loginContainer = document.getElementById('loginPage');
            const appContainer = document.querySelector('.app-container');
            
            if (loginContainer) {
                loginContainer.style.display = 'none';
                console.log('✅ Tela de login ocultada');
            }
            if (appContainer) {
                appContainer.style.display = 'flex';
                console.log('✅ App container exibido');
            }
            
            // Initialize app only once
            if (!isInitialized) {
                console.log('🚀 Inicializando app pela primeira vez');
                
                // Prevent any form submissions or page reloads
                window.addEventListener('beforeunload', (e) => {
                    console.log('⚠️ Página tentando recarregar!');
                });
                
                // Add a small delay to ensure DOM is stable
                setTimeout(() => {
                    initApp();
                    isInitialized = true;
                    console.log('✅ App inicializado com sucesso');
                }, 100);
            }
        } else {
            console.log('❌ Usuário não está logado');
            currentUser = null;
            isInitialized = false;
            
            const loginContainer = document.getElementById('loginPage');
            const appContainer = document.querySelector('.app-container');
            
            if (loginContainer) {
                loginContainer.style.display = 'flex';
                console.log('📱 Exibindo tela de login');
            }
            if (appContainer) {
                appContainer.style.display = 'none';
                console.log('🚫 Ocultando app container');
            }
        }
    });
}


// Export functions for external use
window.app = {
    navigateTo,
    showToast,
    currentUser: () => currentUser
};