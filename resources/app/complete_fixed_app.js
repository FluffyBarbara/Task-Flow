// Подключаем оригинальный app.js
document.write('<script src="app.js"></script>');

// Подключаем файл с исправлениями синхронизации календаря
document.write('<script src="direct_fix.js"></script>');

// Подключаем файл с обновлениями финансовых целей
document.write('<script src="sync_financial_goals.js"></script>');

// Запускаем инициализацию, когда все скрипты загружены
document.addEventListener('DOMContentLoaded', function() {
  // Если оригинальная инициализация уже выполнена, выполняем только нашу
  if (typeof extendInit === 'function') {
    extendInit();
  }
  
  
  // Применяем исправления календаря
  if (typeof syncSelectedDayInCalendars === 'function') {
    // Синхронизируем календари
    syncSelectedDayInCalendars(getTodayString());
  }
  
  // Обновляем все страницы
  if (typeof updateAllPages === 'function') {
    updateAllPages();
  }
  
  console.log('Все исправления успешно применены!');
});