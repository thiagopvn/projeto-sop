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
            showLoading();
            const { success } = await signOut();
            hideLoading();
            
            if (success) {
                showToast('Logout realizado com sucesso!', 'success');
                window.location.reload();
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, inicializando aplicação...');
    setupLoginForm();
    setupAuthObserver();
});

// Setup login form handler
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showToast('Preencha email e senha', 'error');
                return;
            }
            
            showLoading();
            try {
                console.log('Tentando login com:', email);
                const { success, error, user } = await signIn(email, password);
                console.log('Resultado login:', { success, error, user });
                hideLoading();
                
                if (success) {
                    showToast('Login realizado com sucesso!', 'success');
                    console.log('Login bem-sucedido, aguardando redirecionamento...');
                } else {
                    console.error('Erro no login:', error);
                    showToast(error || 'Erro ao fazer login', 'error');
                }
            } catch (err) {
                hideLoading();
                console.error('Erro no login (catch):', err);
                showToast('Erro ao conectar com o servidor', 'error');
            }
        });
        console.log('Login form handler configurado');
    } else {
        console.error('Login form não encontrado');
    }
}

// Setup auth state observer
function setupAuthObserver() {
    onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
        
        if (user) {
            currentUser = user;
            console.log('Usuário logado:', user.email);
            
            // Hide login, show app
            const loginContainer = document.getElementById('loginPage');
            const appContainer = document.querySelector('.app-container');
            
            if (loginContainer) {
                loginContainer.style.display = 'none';
                console.log('Tela de login ocultada');
            }
            if (appContainer) {
                appContainer.style.display = 'flex';
                console.log('App container exibido');
            }
            
            // Initialize app
            initApp();
        } else {
            console.log('Usuário não está logado, exibindo tela de login');
            const loginContainer = document.getElementById('loginPage');
            const appContainer = document.querySelector('.app-container');
            
            if (loginContainer) {
                loginContainer.style.display = 'flex';
            }
            if (appContainer) {
                appContainer.style.display = 'none';
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