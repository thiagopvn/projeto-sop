export class Modal {
  constructor(options = {}) {
    this.options = {
      backdrop: true,
      keyboard: true,
      focus: true,
      ...options
    };
    
    this.element = null;
    this.backdrop = null;
    this.isShown = false;
    this.originalBodyOverflow = null;
  }

  static create(options = {}) {
    return new Modal(options);
  }

  show(content, title = '') {
    if (this.isShown) return;

    this.element = this.createElement(content, title);
    document.body.appendChild(this.element);

    // Force reflow
    this.element.offsetHeight;

    this.element.classList.add('show');
    this.isShown = true;

    this.handleBodyOverflow();
    this.bindEvents();

    if (this.options.focus) {
      this.enforceFocus();
    }

    // Dispatch show event
    this.element.dispatchEvent(new CustomEvent('modal:show'));
  }

  hide() {
    if (!this.isShown) return;

    this.element.classList.remove('show');
    this.isShown = false;

    setTimeout(() => {
      if (this.element) {
        document.body.removeChild(this.element);
        this.element = null;
      }
      this.restoreBodyOverflow();
    }, 300);

    // Dispatch hide event
    if (this.element) {
      this.element.dispatchEvent(new CustomEvent('modal:hide'));
    }
  }

  createElement(content, title) {
    const modalHtml = `
      <div class="modal-backdrop">
        <div class="modal ${this.options.size ? `modal-${this.options.size}` : ''}">
          ${title ? `
            <div class="modal-header">
              <h3 class="modal-title">${title}</h3>
              <button type="button" class="modal-close" aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ` : ''}
          <div class="modal-body">
            ${content}
          </div>
          ${this.options.footer ? `
            <div class="modal-footer">
              ${this.options.footer}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    return wrapper.firstElementChild;
  }

  bindEvents() {
    // Close button
    const closeBtn = this.element.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Backdrop click
    if (this.options.backdrop) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.hide();
        }
      });
    }

    // Keyboard events
    if (this.options.keyboard) {
      document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.isShown) {
      this.hide();
    }
  }

  handleBodyOverflow() {
    this.originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  restoreBodyOverflow() {
    document.body.style.overflow = this.originalBodyOverflow || '';
  }

  enforceFocus() {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  // Static methods for common modal types
  static alert(message, title = 'Atenção') {
    const modal = new Modal({
      footer: '<button type="button" class="btn btn-primary modal-close">OK</button>'
    });
    
    const content = `
      <div class="modal-alert">
        <div class="alert-icon alert-icon-info">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
      </div>
    `;
    
    modal.show(content);
    return modal;
  }

  static confirm(message, title = 'Confirmar') {
    return new Promise((resolve) => {
      const modal = new Modal({
        footer: `
          <button type="button" class="btn btn-outline modal-cancel">Cancelar</button>
          <button type="button" class="btn btn-primary modal-confirm">Confirmar</button>
        `
      });
      
      const content = `
        <div class="modal-alert">
          <div class="alert-icon alert-icon-warning">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="alert-title">${title}</div>
          <div class="alert-message">${message}</div>
        </div>
      `;
      
      modal.show(content);
      
      // Handle button clicks
      modal.element.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-confirm')) {
          resolve(true);
          modal.hide();
        } else if (e.target.classList.contains('modal-cancel')) {
          resolve(false);
          modal.hide();
        }
      });
    });
  }

  static success(message, title = 'Sucesso') {
    const modal = new Modal({
      footer: '<button type="button" class="btn btn-success modal-close">OK</button>'
    });
    
    const content = `
      <div class="modal-alert">
        <div class="alert-icon alert-icon-success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        </div>
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
      </div>
    `;
    
    modal.show(content);
    return modal;
  }

  static error(message, title = 'Erro') {
    const modal = new Modal({
      footer: '<button type="button" class="btn btn-danger modal-close">OK</button>'
    });
    
    const content = `
      <div class="modal-alert">
        <div class="alert-icon alert-icon-danger">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
      </div>
    `;
    
    modal.show(content);
    return modal;
  }
}