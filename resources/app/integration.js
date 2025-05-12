// Обновленный код для интеграции темной и светлой темы

// Модуль управления темой
const ThemeManager = (function() {
    // Константы
    const STORAGE_KEY = 'taskflow_theme';
    const THEMES = {
      LIGHT: 'light',
      DARK: 'dark'
    };
    
    // Функция для определения системных предпочтений
    function getSystemPreference() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? THEMES.DARK 
        : THEMES.LIGHT;
    }
    
    // Функция для получения сохраненной темы
    function getSavedTheme() {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      return (savedTheme === THEMES.LIGHT || savedTheme === THEMES.DARK)
        ? savedTheme
        : getSystemPreference();
    }
    
    // Функция для сохранения темы
    function saveTheme(theme) {
      localStorage.setItem(STORAGE_KEY, theme);
      console.log(`[ТЕМА] Тема '${theme}' сохранена`);
    }
    
    // Функция для применения темы
    function applyTheme(theme) {
      if (theme === THEMES.DARK) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      
      // Обновляем все переключатели темы
      updateAllToggleStates(theme);
      
      console.log(`[ТЕМА] Применена тема: ${theme}`);
      
      // Событие изменения темы
      document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
    
    // Функция для переключения темы
    function toggleTheme() {
      const currentTheme = getSavedTheme();
      const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
      
      applyTheme(newTheme);
      saveTheme(newTheme);
      
      return newTheme;
    }
    
    // Функция для обновления всех переключателей темы
    function updateAllToggleStates(theme) {
      // Обновляем радио-кнопки
      const lightThemeRadio = document.getElementById('light-theme-radio');
      const darkThemeRadio = document.getElementById('dark-theme-radio');
      
      if (lightThemeRadio) lightThemeRadio.checked = theme === THEMES.LIGHT;
      if (darkThemeRadio) darkThemeRadio.checked = theme === THEMES.DARK;
      
      // Обновляем переключатель
      const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
      if (themeToggleCheckbox) themeToggleCheckbox.checked = theme === THEMES.DARK;
      
      // Обновляем выделение опций
      const lightThemeOption = document.getElementById('theme-light');
      const darkThemeOption = document.getElementById('theme-dark');
      
      if (lightThemeOption) {
        if (theme === THEMES.LIGHT) {
          lightThemeOption.classList.add('selected');
        } else {
          lightThemeOption.classList.remove('selected');
        }
      }
      
      if (darkThemeOption) {
        if (theme === THEMES.DARK) {
          darkThemeOption.classList.add('selected');
        } else {
          darkThemeOption.classList.remove('selected');
        }
      }
      
      // Обновляем иконку быстрого переключения
      const quickToggleIcon = document.querySelector('.theme-quick-toggle i');
      if (quickToggleIcon) {
        quickToggleIcon.className = theme === THEMES.DARK ? 'fas fa-sun' : 'fas fa-moon';
      }
    }
    
    // Публичное API
    return {
      THEMES,
      getSystemPreference,
      getSavedTheme,
      saveTheme,
      applyTheme,
      toggleTheme,
      updateAllToggleStates
    };
  })();
  
  // Модуль управления UI темы
  const ThemeUI = (function() {
    // Создание селектора темы
    function createThemeSelector() {
      const settingsPage = document.getElementById('settings-page');
      if (!settingsPage) return;
      
      // Проверяем, нет ли уже карточки темы
      if (document.querySelector('.theme-card')) return;
      
      // Создаем карточку выбора темы
      const themeCard = document.createElement('div');
      themeCard.className = 'card theme-card';
      themeCard.innerHTML = `
        <div class="card-header">
          <h2>Внешний вид</h2>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>Выберите тему оформления</label>
            <div class="theme-selector">
              <div class="theme-option ${ThemeManager.getSavedTheme() === ThemeManager.THEMES.LIGHT ? 'selected' : ''}" id="theme-light">
                <div class="theme-preview light-theme">
                  <div class="theme-preview-header"></div>
                  <div class="theme-preview-content"></div>
                </div>
                <div class="theme-label">
                  <input type="radio" name="theme" id="light-theme-radio" ${ThemeManager.getSavedTheme() === ThemeManager.THEMES.LIGHT ? 'checked' : ''}>
                  <label for="light-theme-radio">Светлая</label>
                </div>
              </div>
              <div class="theme-option ${ThemeManager.getSavedTheme() === ThemeManager.THEMES.DARK ? 'selected' : ''}" id="theme-dark">
                <div class="theme-preview dark-theme">
                  <div class="theme-preview-header"></div>
                  <div class="theme-preview-content"></div>
                </div>
                <div class="theme-label">
                  <input type="radio" name="theme" id="dark-theme-radio" ${ThemeManager.getSavedTheme() === ThemeManager.THEMES.DARK ? 'checked' : ''}>
                  <label for="dark-theme-radio">Темная</label>
                </div>
              </div>
            </div>
            <p class="form-help">Выберите подходящую тему оформления для комфортной работы</p>
          </div>
          
          <!-- Добавляем быстрый переключатель темы -->
          <div class="form-group mt-4 pt-4 border-top">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <label class="mb-0">Быстрое переключение</label>
                <p class="form-help mb-0">Переключите тему одним нажатием</p>
              </div>
              <div class="theme-toggle">
                <span class="theme-toggle-icon light"><i class="fas fa-sun"></i></span>
                <label class="theme-toggle-label">
                  <input type="checkbox" id="theme-toggle-checkbox" ${ThemeManager.getSavedTheme() === ThemeManager.THEMES.DARK ? 'checked' : ''}>
                  <span class="theme-toggle-slider"></span>
                </label>
                <span class="theme-toggle-icon dark"><i class="fas fa-moon"></i></span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Добавляем карточку в начало страницы настроек
      const firstCard = settingsPage.querySelector('.card');
      if (firstCard) {
        settingsPage.insertBefore(themeCard, firstCard);
      } else {
        settingsPage.appendChild(themeCard);
      }
      
      console.log('[ТЕМА] Селектор темы создан');
      
      // Настраиваем обработчики событий
      setupThemeEventHandlers();
    }
    
    // Добавление кнопки быстрого переключения темы
    function addQuickThemeToggle() {
      const userProfile = document.querySelector('.user-profile');
      if (!userProfile) return;
      
      // Проверяем, нет ли уже кнопки
      if (document.querySelector('.theme-quick-toggle')) return;
      
      // Создаем кнопку быстрого переключения
      const toggleButton = document.createElement('button');
      toggleButton.className = 'btn-icon theme-quick-toggle';
      toggleButton.setAttribute('title', 'Переключить тему');
      toggleButton.innerHTML = `
        <i class="${ThemeManager.getSavedTheme() === ThemeManager.THEMES.DARK ? 'fas fa-sun' : 'fas fa-moon'}"></i>
      `;
      
      // Добавляем кнопку перед блоком информации о пользователе
      userProfile.insertBefore(toggleButton, userProfile.firstChild);
      
      // Добавляем обработчик
      toggleButton.addEventListener('click', function() {
        const newTheme = ThemeManager.toggleTheme();
        
        // Показываем уведомление, если функция существует
        if (typeof showToast === 'function') {
          showToast('Информация', `Применена ${newTheme === ThemeManager.THEMES.DARK ? 'темная' : 'светлая'} тема`);
        }
      });
      
      console.log('[ТЕМА] Добавлена кнопка быстрого переключения темы');
    }
    
    // Настройка обработчиков событий темы
    function setupThemeEventHandlers() {
      // Обработчики для опций темы
      const lightThemeOption = document.getElementById('theme-light');
      const darkThemeOption = document.getElementById('theme-dark');
      
      if (lightThemeOption) {
        lightThemeOption.addEventListener('click', function() {
          ThemeManager.applyTheme(ThemeManager.THEMES.LIGHT);
          ThemeManager.saveTheme(ThemeManager.THEMES.LIGHT);
          if (typeof showToast === 'function') {
            showToast('Информация', 'Применена светлая тема');
          }
        });
      }
      
      if (darkThemeOption) {
        darkThemeOption.addEventListener('click', function() {
          ThemeManager.applyTheme(ThemeManager.THEMES.DARK);
          ThemeManager.saveTheme(ThemeManager.THEMES.DARK);
          if (typeof showToast === 'function') {
            showToast('Информация', 'Применена темная тема');
          }
        });
      }
      
      // Обработчики для радио-кнопок
      const lightThemeRadio = document.getElementById('light-theme-radio');
      const darkThemeRadio = document.getElementById('dark-theme-radio');
      
      if (lightThemeRadio) {
        lightThemeRadio.addEventListener('change', function() {
          if (this.checked) {
            ThemeManager.applyTheme(ThemeManager.THEMES.LIGHT);
            ThemeManager.saveTheme(ThemeManager.THEMES.LIGHT);
            if (typeof showToast === 'function') {
              showToast('Информация', 'Применена светлая тема');
            }
          }
        });
      }
      
      if (darkThemeRadio) {
        darkThemeRadio.addEventListener('change', function() {
          if (this.checked) {
            ThemeManager.applyTheme(ThemeManager.THEMES.DARK);
            ThemeManager.saveTheme(ThemeManager.THEMES.DARK);
            if (typeof showToast === 'function') {
              showToast('Информация', 'Применена темная тема');
            }
          }
        });
      }
      
      // Обработчик для переключателя
      const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
      if (themeToggleCheckbox) {
        themeToggleCheckbox.addEventListener('change', function() {
          const newTheme = this.checked ? ThemeManager.THEMES.DARK : ThemeManager.THEMES.LIGHT;
          ThemeManager.applyTheme(newTheme);
          ThemeManager.saveTheme(newTheme);
          if (typeof showToast === 'function') {
            showToast('Информация', `Применена ${newTheme === ThemeManager.THEMES.DARK ? 'темная' : 'светлая'} тема`);
          }
        });
      }
      
      console.log('[ТЕМА] Настроены обработчики событий темы');
    }
    
    // Настройка слушателя переключения страниц
    function setupPageChangeListener() {
      const navLinks = document.querySelectorAll('.sidebar-nav a');
      
      navLinks.forEach(link => {
        link.addEventListener('click', function() {
          // Даем время для переключения страницы
          setTimeout(() => {
            // Если мы переключились на страницу настроек, создаем селектор темы
            if (this.getAttribute('data-page') === 'settings') {
              createThemeSelector();
            }
          }, 100);
        });
      });
      
      console.log('[ТЕМА] Настроен слушатель переключения страниц');
    }
    
    // Публичное API
    return {
      createThemeSelector,
      addQuickThemeToggle,
      setupPageChangeListener,
      setupThemeEventHandlers
    };
  })();
  
  // Инициализация системы тем
  function initializeThemeSystem() {
    console.log('[ТЕМА] Запуск системы тем...');
    
    // Применяем сохраненную или системную тему
    const initialTheme = ThemeManager.getSavedTheme();
    ThemeManager.applyTheme(initialTheme);
    
    // Инициализируем UI темы
    // Добавляем селектор темы на страницу настроек, если она активна
    const settingsPage = document.getElementById('settings-page');
    if (settingsPage && window.getComputedStyle(settingsPage).display !== 'none') {
      ThemeUI.createThemeSelector();
    }
    
    // Добавляем кнопку быстрого переключения темы
    ThemeUI.addQuickThemeToggle();
    
    // Настраиваем слушатель переключения страниц
    ThemeUI.setupPageChangeListener();
    
    // Настраиваем обработчик системных настроек темы
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newTheme = e.matches ? ThemeManager.THEMES.DARK : ThemeManager.THEMES.LIGHT;
        // Применяем системную тему только если пользователь не выбрал тему вручную
        if (!localStorage.getItem('taskflow_theme')) {
          ThemeManager.applyTheme(newTheme);
          console.log(`[ТЕМА] Системная тема изменилась на: ${newTheme}`);
        }
      });
    }
    
    console.log('[ТЕМА] Система тем успешно запущена');
  }
  
  // Запускаем систему темной и светлой темы при загрузке документа
  document.addEventListener('DOMContentLoaded', function() {
    initializeThemeSystem();
  });