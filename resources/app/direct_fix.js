// Простое и прямое исправление календаря
// Этот скрипт полностью заменяет обработчики кликов для дней календаря
// и обеспечивает правильное обновление всех элементов с датами

document.addEventListener('DOMContentLoaded', function() {
  console.log("[DIRECT-FIX] Применяю исправление календаря...");
  
  // Функция обработки клика по дню календаря
  function onCalendarDayClick(event) {
    // Получаем элемент дня календаря
    const dayElement = event.target.closest('.calendar-day');
    if (!dayElement) return; // Если клик не по дню, игнорируем
    
    // Получаем дату из атрибута
    const dateString = dayElement.getAttribute('data-date');
    if (!dateString) return;
    console.log("[DIRECT-FIX] Клик по дате:", dateString);
    
    // Преобразуем в объект Date
    const clickedDate = new Date(dateString);
    
    // Сначала обновляем все заголовки с выбранной датой
    updateDateHeaders(clickedDate);
    
    // Затем обновляем списки событий
    updateEventsForDate(dateString);
  }
  
  // Функция обновления всех заголовков с датой
  function updateDateHeaders(date) {
    // Форматируем дату для отображения
    const dateForDisplay = formatDateForDisplay(formatDateForAPI(date));
    const shortDate = dateForDisplay.split(' ').slice(0, 2).join(' ');
    
    console.log("[DIRECT-FIX] Форматированная дата:", shortDate);
    
    // Обновляем все возможные элементы с датой
    const dateElements = [
      document.getElementById('selected-date'),
      document.getElementById('page-selected-date')
    ];
    
    // Обновляем элементы, которые существуют
    dateElements.forEach(element => {
      if (element) {
        element.textContent = shortDate;
        console.log("[DIRECT-FIX] Обновлен элемент с id:", element.id);
      }
    });
    
    // Также обновляем глобальную переменную
    if (typeof selectedDate !== 'undefined') {
      selectedDate = date;
    }
    
    // Синхронизируем выделение в календарях
    const dateStr = formatDateForAPI(date);
    document.querySelectorAll('.calendar-day').forEach(dayEl => {
      if (dayEl.getAttribute('data-date') === dateStr) {
        dayEl.classList.add('selected');
      } else {
        dayEl.classList.remove('selected');
      }
    });
  }
  
  // Функция обновления списков событий
  function updateEventsForDate(dateString) {
    // Обновляем списки событий, если функции существуют
    if (typeof updateEventsList === 'function') {
      updateEventsList();
      console.log("[DIRECT-FIX] Вызвана функция updateEventsList()");
    }
    
    if (typeof updatePageEventsList === 'function') {
      updatePageEventsList();
      console.log("[DIRECT-FIX] Вызвана функция updatePageEventsList()");
    }
  }
  
  // Находим все календари и добавляем новые обработчики
  const calendars = document.querySelectorAll('#calendar-container, #page-calendar-container');
  if (calendars.length === 0) {
    console.warn("[DIRECT-FIX] Календари не найдены на странице!");
  } else {
    console.log("[DIRECT-FIX] Найдено календарей:", calendars.length);
    
    // Добавляем обработчики к каждому календарю
    calendars.forEach(calendar => {
      // Удаляем существующие обработчики, клонируя элемент
      const newCalendar = calendar.cloneNode(true);
      if (calendar.parentNode) {
        calendar.parentNode.replaceChild(newCalendar, calendar);
      }
      
      // Добавляем новый обработчик
      newCalendar.addEventListener('click', onCalendarDayClick);
      console.log("[DIRECT-FIX] Обработчик добавлен к календарю:", newCalendar.id);
    });
  }
  
  // Добавляем обработчики на навигационные ссылки для обновления при переключении вкладок
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function() {
      // Даем время для переключения страницы
      setTimeout(() => {
        if (typeof selectedDate !== 'undefined') {
          updateDateHeaders(selectedDate);
          console.log("[DIRECT-FIX] Синхронизирована дата после переключения вкладки");
        }
      }, 100);
    });
  });
  
  // Вызываем обновление заголовков при загрузке страницы
  if (typeof selectedDate !== 'undefined') {
    updateDateHeaders(selectedDate);
    console.log("[DIRECT-FIX] Первоначальное обновление заголовков завершено");
  }
  
  console.log("[DIRECT-FIX] Исправление календаря успешно применено!");
});