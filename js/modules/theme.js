// js/modules/theme.js

export const initializeTheme = () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Set initial state based on localStorage
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    themeToggle.checked = isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);

    // Add event listener for changes
    themeToggle.addEventListener('change', () => {
      const newMode = themeToggle.checked;
      document.body.classList.toggle('dark-mode', newMode);
      localStorage.setItem('dark-mode', newMode);
    });
  }
};
