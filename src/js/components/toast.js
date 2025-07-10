export class Toast {
  constructor() {
    // Notyf is loaded via CDN script tag
    this.notyf = new window.Notyf({
      duration: 4000,
      position: {
        x: 'right',
        y: 'top'
      },
      types: [
        {
          type: 'success',
          background: '#22C55E',
          icon: {
            className: 'toast-icon',
            tagName: 'span',
            text: '✓'
          }
        },
        {
          type: 'error',
          background: '#EF4444',
          icon: {
            className: 'toast-icon',
            tagName: 'span', 
            text: '✕'
          }
        },
        {
          type: 'warning',
          background: '#FACC15',
          icon: {
            className: 'toast-icon',
            tagName: 'span',
            text: '⚠'
          }
        },
        {
          type: 'info',
          background: '#0057B8',
          icon: {
            className: 'toast-icon',
            tagName: 'span',
            text: 'ℹ'
          }
        }
      ]
    });
  }

  show(message, type = 'info', options = {}) {
    const config = {
      type,
      message,
      ...options
    };

    switch (type) {
      case 'success':
        this.notyf.success(config);
        break;
      case 'error':
        this.notyf.error(config);
        break;
      case 'warning':
        this.notyf.open({
          type: 'warning',
          message
        });
        break;
      case 'info':
      default:
        this.notyf.open({
          type: 'info',
          message
        });
        break;
    }
  }

  success(message, options = {}) {
    this.show(message, 'success', options);
  }

  error(message, options = {}) {
    this.show(message, 'error', options);
  }

  warning(message, options = {}) {
    this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    this.show(message, 'info', options);
  }

  // Dismiss all notifications
  dismissAll() {
    this.notyf.dismissAll();
  }

  // Static methods for quick access
  static show(message, type = 'info') {
    if (!Toast.instance) {
      Toast.instance = new Toast();
    }
    Toast.instance.show(message, type);
  }

  static success(message) {
    Toast.show(message, 'success');
  }

  static error(message) {
    Toast.show(message, 'error');
  }

  static warning(message) {
    Toast.show(message, 'warning');
  }

  static info(message) {
    Toast.show(message, 'info');
  }
}