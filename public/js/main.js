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

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    setupLogin();
});

// Setup login form handler
function setupLogin() {
    // Add login page if not exists
    if (!document.querySelector('.login-page')) {
        addLoginPage();
    }
    
    // Setup login form handler
    setTimeout(() => {
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
        }
    }, 100);
}

// Authentication State Observer
onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
    
    if (user) {
        currentUser = user;
        
        // Hide login, show app
        const loginContainer = document.querySelector('.login-page');
        const appContainer = document.querySelector('.app-container');
        
        if (loginContainer) loginContainer.style.display = 'none';
        if (appContainer) {
            appContainer.style.display = 'flex';
            appContainer.classList.remove('hidden');
        }
        
        // Initialize app
        initApp();
    } else {
        // Show login, hide app
        const loginContainer = document.querySelector('.login-page');
        const appContainer = document.querySelector('.app-container');
        
        if (loginContainer) {
            loginContainer.style.display = 'flex';
            loginContainer.classList.remove('hidden');
        }
        if (appContainer) {
            appContainer.style.display = 'none';
        }
    }
});

// Add login page function
function addLoginPage() {
    const loginHTML = `
        <div class="login-page">
            <div class="login-card">
                <div class="login-header">
                    <svg class="login-logo" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    <h1>Projeto SOP</h1>
                    <p>Sistema de Organização de Documentos</p>
                </div>
                
                <form class="login-form" id="login-form">
                    <div class="form-group">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" id="email" class="form-control" placeholder="seu@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password" class="form-label">Senha</label>
                        <input type="password" id="password" class="form-control" placeholder="••••••••" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    `;
    
    // Add login styles
    const loginStyles = `
        <style>
            .login-page {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--color-bg);
                z-index: 9999;
            }
            
            .login-card {
                background-color: var(--color-card);
                border-radius: var(--radius);
                box-shadow: var(--shadow-lg);
                padding: 2rem;
                width: 100%;
                max-width: 400px;
                margin: 1rem;
            }
            
            .login-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .login-logo {
                width: 64px;
                height: 64px;
                color: var(--color-primary);
                margin-bottom: 1rem;
            }
            
            .login-header h1 {
                margin-bottom: 0.5rem;
            }
            
            .login-header p {
                color: var(--color-text-muted);
                font-size: 0.875rem;
            }
            
            .login-form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .btn-block {
                width: 100%;
                justify-content: center;
            }
            
            .hidden {
                display: none !important;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', loginStyles);
    document.body.insertAdjacentHTML('afterbegin', loginHTML);
}

// Export functions for external use
window.app = {
    navigateTo,
    showToast,
    currentUser: () => currentUser
};