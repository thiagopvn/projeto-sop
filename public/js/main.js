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
    
    // Update URL
    window.location.hash = route;
    
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

// Handle hash changes
window.addEventListener('hashchange', () => {
    const route = window.location.hash.slice(1) || 'dashboard';
    navigateTo(route);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (isAppInitialized) {
        console.log('⚠️ App já foi inicializado, ignorando...');
        return;
    }
    
    console.log('🚀 DOM loaded, inicializando aplicação...');
    isAppInitialized = true;
    
    setupLoginForm();
    setupAuthObserver();
});

// Setup login form handler
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🔐 Login form submitted');
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showToast('Preencha email e senha', 'error');
                return;
            }
            
            // Disable form to prevent multiple submissions
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Entrando...';
            
            try {
                console.log('🔍 Tentando login com:', email);
                
                // Call Firebase auth directly
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                console.log('✅ Login Firebase bem-sucedido:', userCredential.user.email);
                
                showToast('Login realizado com sucesso!', 'success');
                
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
        });
        console.log('✅ Login form handler configurado');
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
                initApp();
                isInitialized = true;
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