// Простой скрипт для переключения темы
document.addEventListener('DOMContentLoaded', function() {
    // Функция для переключения темы
    function toggleTheme() {
      const isDark = document.body.classList.contains('dark-mode');
      
      if (isDark) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('taskflow_theme', 'light');
        // Обновляем иконку
        const toggleIcon = document.querySelector('#theme-toggle i');
        if (toggleIcon) toggleIcon.className = 'fas fa-moon';
      } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('taskflow_theme', 'dark');
        // Обновляем иконку
        const toggleIcon = document.querySelector('#theme-toggle i');
        if (toggleIcon) toggleIcon.className = 'fas fa-sun';
      }
    }
  
    // Применяем сохраненную тему при загрузке
    const savedTheme = localStorage.getItem('taskflow_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      // Обновляем иконку
      const toggleIcon = document.querySelector('#theme-toggle i');
      if (toggleIcon) toggleIcon.className = 'fas fa-sun';
    }
  
    // Добавляем обработчик события для кнопки переключения темы
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Добавляем обработчик для настроек темы
    document.addEventListener('click', function(e) {
      // Обработка клика по радио-кнопке темы в настройках
      if (e.target.name === 'theme') {
        const selectedTheme = e.target.value;
        if (selectedTheme === 'dark') {
          document.body.classList.add('dark-mode');
          localStorage.setItem('taskflow_theme', 'dark');
          // Обновляем иконку
          const toggleIcon = document.querySelector('#theme-toggle i');
          if (toggleIcon) toggleIcon.className = 'fas fa-sun';
        } else {
          document.body.classList.remove('dark-mode');
          localStorage.setItem('taskflow_theme', 'light');
          // Обновляем иконку
          const toggleIcon = document.querySelector('#theme-toggle i');
          if (toggleIcon) toggleIcon.className = 'fas fa-moon';
        }
        
        // Показываем уведомление о смене темы
        if (typeof showToast === 'function') {
          showToast('Информация', `Применена ${selectedTheme === 'dark' ? 'темная' : 'светлая'} тема`);
        }
      }
    });
  });