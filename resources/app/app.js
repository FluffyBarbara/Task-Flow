// Глобальные переменные для хранения данных
let tasks = [];
let events = [];
let goals = [];
let goalPayments = [];
let selectedDate = new Date();

// Ключи для localStorage
const STORAGE_KEYS = {
  TASKS: 'taskflow_tasks',
  EVENTS: 'taskflow_events',
  GOALS: 'taskflow_goals',
  PAYMENTS: 'taskflow_payments',
  NEXT_IDS: 'taskflow_next_ids'
};

// Генераторы ID для новых объектов
let nextIds = {
  task: 1,
  event: 1,
  goal: 1,
  payment: 1
};

// Логирование для отладки
function logDebug(message) {
  console.log(`[DEBUG] ${message}`);
}

// Инициализация данных
function initializeData() {
  logDebug('Инициализация данных...');
  
  // Загрузка данных из localStorage
  tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]');
  goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS) || '[]');
  goalPayments = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
  nextIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.NEXT_IDS) || JSON.stringify(nextIds));
  
  // Если данных нет, создаем тестовые данные
  if (tasks.length === 0 && events.length === 0 && goals.length === 0) {
    addTestData();
  }
}

// Сохранение данных в localStorage
function saveData() {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(goalPayments));
  localStorage.setItem(STORAGE_KEYS.NEXT_IDS, JSON.stringify(nextIds));
  
  logDebug('Данные сохранены в localStorage');
}

// Форматирование даты в строку для API (YYYY-MM-DD)
function formatDateForAPI(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Форматирование даты для отображения
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Форматирование времени
function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

// Форматирование валюты
function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

// Форматирование срока достижения цели
function formatDeadline(deadline, noDeadline) {
  if (noDeadline) return 'Без срока';
  return `До ${formatDateForDisplay(deadline)}`;
}

// Расчет прогресса для финансовой цели
function calculateProgress(current, target) {
  if (target === 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(progress, 100);
}

// Получение сегодняшней даты в формате YYYY-MM-DD
function getTodayString() {
  return formatDateForAPI(new Date());
}

// Получение первого дня месяца
function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1);
}

// Получение последнего дня месяца
function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0);
}

// Получение дней для календаря
function getCalendarDays(year, month) {
  const firstDay = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);
  const daysInMonth = lastDay.getDate();
  
  // Получаем день недели первого дня месяца (0 - воскресенье, 1 - понедельник, и т.д.)
  let startDay = firstDay.getDay();
  // В России неделя начинается с понедельника, поэтому корректируем
  startDay = startDay === 0 ? 6 : startDay - 1;
  
  const calendarDays = [];
  
  // Добавляем дни из предыдущего месяца
  const prevLastDay = getLastDayOfMonth(year, month - 1);
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevLastDay.getDate() - i;
    const date = new Date(year, month - 2, day);
    calendarDays.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: false,
      dateString: formatDateForAPI(date)
    });
  }
  
  // Добавляем дни текущего месяца
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    calendarDays.push({
      date,
      day: i,
      isCurrentMonth: true,
      isToday: today.getFullYear() === year && today.getMonth() === month - 1 && today.getDate() === i,
      dateString: formatDateForAPI(date)
    });
  }
  
  // Добавляем дни следующего месяца
  const remainingDays = 42 - calendarDays.length; // 6 строк по 7 дней
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month, i);
    calendarDays.push({
      date,
      day: i,
      isCurrentMonth: false,
      isToday: false,
      dateString: formatDateForAPI(date)
    });
  }
  
  return calendarDays;
}

// Функция для синхронизации выбранной даты между вкладками и обновления UI
function syncSelectedDate(newDate) {
  logDebug(`Синхронизация выбранной даты: ${newDate}`);
  
  // Обновляем глобальную переменную selectedDate
  selectedDate = newDate instanceof Date ? newDate : new Date(newDate);
  
  updateAllDateHeaders(selectedDate);
  updateCalendarSelection(formatDateForAPI(selectedDate));
}

// Новая функция для обновления всех заголовков с датами
function updateAllDateHeaders(date) {
  logDebug(`Обновление всех заголовков с датой: ${date}`);
  
  // Форматируем дату для отображения в заголовках событий
  const formattedDate = formatDateForDisplay(formatDateForAPI(date));
  const shortFormattedDate = formattedDate.split(' ').slice(0, 2).join(' '); // "3 мая" вместо "3 мая 2023"
  
  // Обновляем все элементы, которые отображают выбранную дату
  updateDateElement('selected-date', shortFormattedDate);
  updateDateElement('page-selected-date', shortFormattedDate);
  
  // Обновляем сегодняшнюю дату (если нужно)
  const todayFormattedDate = formatDateForDisplay(getTodayString());
  updateDateElement('today-date', todayFormattedDate);
}

// Функция для обновления конкретного элемента с датой
function updateDateElement(elementId, dateText) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = dateText;
    logDebug(`Обновлен элемент даты: ${elementId} -> ${dateText}`);
  }
}

// Функция для обновления выделения в календарях
function updateCalendarSelection(dateString) {
  logDebug(`Обновление выделения в календарях для даты: ${dateString}`);
  
  // Обновляем выделение в обоих календарях
  document.querySelectorAll('.calendar-day').forEach(day => {
    if (day.getAttribute('data-date') === dateString) {
      day.classList.add('selected');
    } else {
      day.classList.remove('selected');
    }
  });
}

// Функция для обновления всех страниц
function updateAllPages() {
  logDebug('Обновление всех страниц...');
  
  // Обновляем статистику
  updateStats();
  
  // Обновляем календари на всех страницах
  updateCalendar(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  updatePageCalendar(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  
  // Обновляем списки событий на всех страницах
  updateEventsList();
  updatePageEventsList();
  
  // Обновляем списки задач на всех страницах
  updateTasksList();
  
  // Обновляем финансовые цели на всех страницах
  updateGoalsList();
  
  // Синхронизируем отображение выбранной даты
  syncSelectedDate(selectedDate);
}

// Функции CRUD для задач
function getTasks(date) {
  if (date) {
    return tasks.filter(task => task.dueDate === date);
  }
  return tasks;
}

function getTaskById(id) {
  return tasks.find(task => task.id === id);
}

function createTask(taskData) {
  const newTask = {
    id: nextIds.task++,
    ...taskData,
    dueTime: taskData.dueTime || null,
    description: taskData.description || null,
    completed: taskData.completed || false
  };
  
  tasks.push(newTask);
  saveData();
  updateAllPages();
  return newTask;
}

function updateTask(id, taskData) {
  const taskIndex = tasks.findIndex(task => task.id === id);
  
  if (taskIndex === -1) {
    throw new Error('Задача не найдена');
  }
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...taskData
  };
  
  saveData();
  updateAllPages();
  return tasks[taskIndex];
}

function deleteTask(id) {
  const taskIndex = tasks.findIndex(task => task.id === id);
  
  if (taskIndex === -1) {
    throw new Error('Задача не найдена');
  }
  
  tasks.splice(taskIndex, 1);
  saveData();
  updateAllPages();
  return true;
}

// Функции CRUD для событий
function getEvents(date, year, month) {
  if (date) {
    return events.filter(event => event.date === date);
  }
  
  if (year && month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = formatDateForAPI(startDate);
    const endDateStr = formatDateForAPI(endDate);
    
    return events.filter(event => {
      return event.date >= startDateStr && event.date <= endDateStr;
    });
  }
  
  return events;
}

function getEventById(id) {
  return events.find(event => event.id === id);
}

function createEvent(eventData) {
  const newEvent = {
    id: nextIds.event++,
    ...eventData,
    description: eventData.description || null
  };
  
  events.push(newEvent);
  saveData();
  updateAllPages();
  return newEvent;
}

function updateEvent(id, eventData) {
  const eventIndex = events.findIndex(event => event.id === id);
  
  if (eventIndex === -1) {
    throw new Error('Событие не найдено');
  }
  
  events[eventIndex] = {
    ...events[eventIndex],
    ...eventData
  };
  
  saveData();
  updateAllPages();
  return events[eventIndex];
}

function deleteEvent(id) {
  const eventIndex = events.findIndex(event => event.id === id);
  
  if (eventIndex === -1) {
    throw new Error('Событие не найдено');
  }
  
  events.splice(eventIndex, 1);
  saveData();
  updateAllPages();
  return true;
}

// Функции CRUD для финансовых целей
function getGoals() {
  return goals;
}

function getGoalById(id) {
  return goals.find(goal => goal.id === id);
}

function createGoal(goalData) {
  const newGoal = {
    id: nextIds.goal++,
    ...goalData,
    currentAmount: 0,
    description: goalData.description || null
  };
  
  goals.push(newGoal);
  saveData();
  updateAllPages();
  return newGoal;
}

function updateGoal(id, goalData) {
  const goalIndex = goals.findIndex(goal => goal.id === id);
  
  if (goalIndex === -1) {
    throw new Error('Финансовая цель не найдена');
  }
  
  goals[goalIndex] = {
    ...goals[goalIndex],
    ...goalData
  };
  
  saveData();
  updateAllPages();
  return goals[goalIndex];
}

function deleteGoal(id) {
  const goalIndex = goals.findIndex(goal => goal.id === id);
  
  if (goalIndex === -1) {
    throw new Error('Финансовая цель не найдена');
  }
  
  // Удаляем цель
  goals.splice(goalIndex, 1);
  
  // Удаляем все платежи, связанные с этой целью
  goalPayments = goalPayments.filter(payment => payment.goalId !== id);
  
  saveData();
  updateAllPages();
  return true;
}

// Функции CRUD для платежей
function getPaymentsByGoalId(goalId) {
  return goalPayments.filter(payment => payment.goalId === goalId);
}

function createPayment(paymentData) {
  const { goalId, amount, date, note } = paymentData;
  const goalIndex = goals.findIndex(goal => goal.id === goalId);
  
  if (goalIndex === -1) {
    throw new Error('Финансовая цель не найдена');
  }
  
  const newPayment = {
    id: nextIds.payment++,
    goalId,
    amount: parseFloat(amount),
    date,
    note: note || null
  };
  
  goalPayments.push(newPayment);
  
  // Обновляем текущую сумму цели
  goals[goalIndex].currentAmount += parseFloat(amount);
  
  saveData();
  updateAllPages();
  return newPayment;
}

function deletePayment(id) {
  const paymentIndex = goalPayments.findIndex(payment => payment.id === id);
  
  if (paymentIndex === -1) {
    throw new Error('Платеж не найден');
  }
  
  const payment = goalPayments[paymentIndex];
  const goalIndex = goals.findIndex(goal => goal.id === payment.goalId);
  
  if (goalIndex !== -1) {
    // Вычитаем сумму платежа из текущей суммы цели
    goals[goalIndex].currentAmount -= payment.amount;
  }
  
  goalPayments.splice(paymentIndex, 1);
  
  saveData();
  updateAllPages();
  return true;
}

// Функция для обновления календаря
function updateCalendar(year, month) {
  logDebug(`Обновление календаря: ${year}-${month}`);
  
  const calendarContainer = document.getElementById('calendar-container');
  if (!calendarContainer) return;
  
  calendarContainer.innerHTML = '';
  
  // Добавляем заголовки дней недели
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekdays.forEach(day => {
    const weekdayEl = document.createElement('div');
    weekdayEl.className = 'calendar-weekday';
    weekdayEl.textContent = day;
    calendarContainer.appendChild(weekdayEl);
  });
  
  // Получаем дни для календаря
  const days = getCalendarDays(year, month);
  
  // Получаем события для этого месяца
  const monthEvents = getEvents(null, year, month);
  
  // Обновляем заголовок с текущим месяцем
  const currentMonthEl = document.getElementById('current-month');
  if (currentMonthEl) {
    const date = new Date(year, month - 1, 1);
    currentMonthEl.textContent = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }
  
  // Добавляем дни в календарь
  days.forEach(dayInfo => {
    const { day, isCurrentMonth, isToday, dateString } = dayInfo;
    
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (!isCurrentMonth) dayEl.classList.add('outside-month');
    if (isToday) dayEl.classList.add('today');
    
    // Проверяем, есть ли события в этот день
    const hasEvents = monthEvents.some(event => event.date === dateString);
    if (hasEvents) dayEl.classList.add('has-event');
    
    // Проверяем, это выбранная дата?
    const isSelected = dateString === formatDateForAPI(selectedDate);
    if (isSelected) dayEl.classList.add('selected');
    
    // Добавляем data-атрибут с датой
    dayEl.setAttribute('data-date', dateString);
    
    // Добавляем содержимое дня
    const dayContent = document.createElement('div');
    dayContent.className = 'calendar-day-content';
    dayContent.textContent = day;
    dayEl.appendChild(dayContent);
    
    // Добавляем обработчик клика
    dayEl.addEventListener('click', handleCalendarDayClick);
    
    calendarContainer.appendChild(dayEl);
  });
}

// Функция для обновления календаря на странице календаря
function updatePageCalendar(year, month) {
  logDebug(`Обновление страничного календаря: ${year}-${month}`);
  
  const calendarContainer = document.getElementById('page-calendar-container');
  if (!calendarContainer) return;
  
  calendarContainer.innerHTML = '';
  
  // Добавляем заголовки дней недели
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  weekdays.forEach(day => {
    const weekdayEl = document.createElement('div');
    weekdayEl.className = 'calendar-weekday';
    weekdayEl.textContent = day;
    calendarContainer.appendChild(weekdayEl);
  });
  
  // Получаем дни для календаря
  const days = getCalendarDays(year, month);
  
  // Получаем события для этого месяца
  const monthEvents = getEvents(null, year, month);
  
  // Обновляем заголовок с текущим месяцем
  const currentMonthEl = document.getElementById('page-current-month');
  if (currentMonthEl) {
    const date = new Date(year, month - 1, 1);
    currentMonthEl.textContent = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }
  
  // Добавляем дни в календарь
  days.forEach(dayInfo => {
    const { day, isCurrentMonth, isToday, dateString } = dayInfo;
    
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (!isCurrentMonth) dayEl.classList.add('outside-month');
    if (isToday) dayEl.classList.add('today');
    
    // Проверяем, есть ли события в этот день
    const hasEvents = monthEvents.some(event => event.date === dateString);
    if (hasEvents) dayEl.classList.add('has-event');
    
    // Проверяем, это выбранная дата?
    const isSelected = dateString === formatDateForAPI(selectedDate);
    if (isSelected) dayEl.classList.add('selected');
    
    // Добавляем data-атрибут с датой
    dayEl.setAttribute('data-date', dateString);
    
    // Добавляем содержимое дня
    const dayContent = document.createElement('div');
    dayContent.className = 'calendar-day-content';
    dayContent.textContent = day;
    dayEl.appendChild(dayContent);
    
    // Добавляем обработчик клика
    dayEl.addEventListener('click', handleCalendarDayClick);
    
    calendarContainer.appendChild(dayEl);
  });
}

// Обработчик клика по дню календаря
function handleCalendarDayClick(event) {
  // Получаем элемент дня
  const dayEl = event.currentTarget;
  if (!dayEl) return;
  
  // Получаем дату из data-атрибута
  const dateString = dayEl.getAttribute('data-date');
  if (!dateString) return;
  
  logDebug(`Клик по дню календаря: ${dateString}`);
  
  // Преобразуем строку в объект Date
  const clickedDate = new Date(dateString);
  
  // Синхронизируем выбранную дату
  syncSelectedDate(clickedDate);
  
  // Обновляем списки событий
  updateEventsList();
  updatePageEventsList();
}

// Функция для обновления списка событий
function updateEventsList() {
  logDebug('Обновление списка событий...');
  
  const eventsListContainer = document.getElementById('events-list');
  if (!eventsListContainer) return;
  
  // Получаем события на выбранную дату
  const dateString = formatDateForAPI(selectedDate);
  const dayEvents = getEvents(dateString);
  
  // Если нет событий, показываем пустое состояние
  if (dayEvents.length === 0) {
    eventsListContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar"></i>
        <p>На этот день нет событий</p>
        <button class="btn btn-outline" id="add-event-empty-btn">
          Добавить событие
        </button>
      </div>
    `;
    
    // Добавляем обработчик для кнопки добавления
    const addButton = document.getElementById('add-event-empty-btn');
    if (addButton) {
      addButton.addEventListener('click', () => openEventModal());
    }
    
    return;
  }
  
  // Сортируем события по времени
  dayEvents.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    return 0;
  });
  
  // Очищаем контейнер
  eventsListContainer.innerHTML = '';
  
  // Добавляем события в список
  dayEvents.forEach(event => {
    const eventEl = document.createElement('div');
    eventEl.className = `event-item event-${event.type}`;
    
    eventEl.innerHTML = `
      <div class="event-header">
        <h4 class="event-title">${event.title}</h4>
        <div class="event-actions">
          <button class="btn-icon event-edit" data-id="${event.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon event-delete" data-id="${event.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p class="event-time">${formatTime(event.time)}</p>
      ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
    `;
    
    eventsListContainer.appendChild(eventEl);
    
    // Добавляем обработчики событий для кнопок
    const editButton = eventEl.querySelector('.event-edit');
    if (editButton) {
      editButton.addEventListener('click', () => {
        const eventId = parseInt(editButton.getAttribute('data-id'));
        const event = getEventById(eventId);
        if (event) {
          openEventModal(event);
        }
      });
    }
    
    const deleteButton = eventEl.querySelector('.event-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        const eventId = parseInt(deleteButton.getAttribute('data-id'));
        openConfirmModal(
          'Вы уверены, что хотите удалить это событие?',
          () => {
            deleteEvent(eventId);
            showToast('Успешно', 'Событие удалено');
          }
        );
      });
    }
  });
}

// Функция для обновления списка событий на странице календаря
function updatePageEventsList() {
  logDebug('Обновление списка событий на странице календаря...');
  
  const eventsListContainer = document.getElementById('page-events-list');
  if (!eventsListContainer) return;
  
  // Получаем события на выбранную дату
  const dateString = formatDateForAPI(selectedDate);
  const dayEvents = getEvents(dateString);
  
  // Если нет событий, показываем пустое состояние
  if (dayEvents.length === 0) {
    eventsListContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar"></i>
        <p>На этот день нет событий</p>
        <button class="btn btn-outline" id="page-add-event-empty-btn">
          Добавить событие
        </button>
      </div>
    `;
    
    // Добавляем обработчик для кнопки добавления
    const addButton = document.getElementById('page-add-event-empty-btn');
    if (addButton) {
      addButton.addEventListener('click', () => openEventModal());
    }
    
    return;
  }
  
  // Сортируем события по времени
  dayEvents.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    return 0;
  });
  
  // Очищаем контейнер
  eventsListContainer.innerHTML = '';
  
  // Добавляем события в список
  dayEvents.forEach(event => {
    const eventEl = document.createElement('div');
    eventEl.className = `event-item event-${event.type}`;
    
    eventEl.innerHTML = `
      <div class="event-header">
        <h4 class="event-title">${event.title}</h4>
        <div class="event-actions">
          <button class="btn-icon event-edit" data-id="${event.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon event-delete" data-id="${event.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p class="event-time">${formatTime(event.time)}</p>
      ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
    `;
    
    eventsListContainer.appendChild(eventEl);
    
    // Добавляем обработчики событий для кнопок
    const editButton = eventEl.querySelector('.event-edit');
    if (editButton) {
      editButton.addEventListener('click', () => {
        const eventId = parseInt(editButton.getAttribute('data-id'));
        const event = getEventById(eventId);
        if (event) {
          openEventModal(event);
        }
      });
    }
    
    const deleteButton = eventEl.querySelector('.event-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        const eventId = parseInt(deleteButton.getAttribute('data-id'));
        openConfirmModal(
          'Вы уверены, что хотите удалить это событие?',
          () => {
            deleteEvent(eventId);
            showToast('Успешно', 'Событие удалено');
          }
        );
      });
    }
  });
}

// Функция для обновления списка финансовых целей
function updateGoalsList() {
  logDebug('Обновление списка финансовых целей...');
  
  const goalsListContainer = document.getElementById('goals-list');
  if (!goalsListContainer) return;
  
  // Получаем все финансовые цели
  const allGoals = getGoals();
  
  // Если нет целей, показываем пустое состояние
  if (allGoals.length === 0) {
    goalsListContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-piggy-bank"></i>
        <p>У вас пока нет финансовых целей</p>
        <button class="btn btn-outline" id="add-goal-empty-btn">
          Создать новую цель
        </button>
      </div>
    `;
    
    // Добавляем обработчик для кнопки добавления
    const addButton = document.getElementById('add-goal-empty-btn');
    if (addButton) {
      addButton.addEventListener('click', () => openGoalModal());
    }
    
    return;
  }
  
  // Сортируем цели по прогрессу (сначала незавершенные)
  allGoals.sort((a, b) => {
    const progressA = calculateProgress(a.currentAmount, a.targetAmount);
    const progressB = calculateProgress(b.currentAmount, b.targetAmount);
    
    if (progressA === 100 && progressB !== 100) return 1;
    if (progressA !== 100 && progressB === 100) return -1;
    
    return progressB - progressA;
  });
  
  // Очищаем контейнер
  goalsListContainer.innerHTML = '';
  
  // Добавляем цели в список
  allGoals.forEach(goal => {
    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
    const isCompleted = progress >= 100;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    
    const goalEl = document.createElement('div');
    goalEl.className = 'goal-item';
    if (isCompleted) goalEl.classList.add('goal-completed');
    
    goalEl.innerHTML = `
      <div class="goal-header">
        <h4 class="goal-title">${goal.title}</h4>
        <div class="goal-actions">
          <button class="btn-icon goal-add-payment" data-id="${goal.id}" ${isCompleted ? 'disabled' : ''}>
            <i class="fas fa-plus"></i>
          </button>
          <button class="btn-icon goal-edit" data-id="${goal.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon goal-delete" data-id="${goal.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="goal-info">
        <div class="goal-progress-info">
          <div class="goal-amounts">
            <span class="current-amount">${formatCurrency(goal.currentAmount)}</span>
            <span class="target-amount">из ${formatCurrency(goal.targetAmount)}</span>
          </div>
          <div class="goal-deadline">${formatDeadline(goal.deadline, goal.noDeadline)}</div>
        </div>
        <div class="goal-progress">
          <div class="goal-progress-bar" style="width: ${progress}%"></div>
        </div>
        ${isCompleted 
          ? `<div class="goal-completed-status">Цель выполнена! <i class="fas fa-check-circle"></i></div>` 
          : `<div class="goal-remaining">Осталось: ${formatCurrency(remaining)}</div>`
        }
      </div>
      ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
    `;
    
    goalsListContainer.appendChild(goalEl);
    
    // Добавляем обработчики событий для кнопок
    const addPaymentButton = goalEl.querySelector('.goal-add-payment');
    if (addPaymentButton) {
      addPaymentButton.addEventListener('click', () => {
        const goalId = parseInt(addPaymentButton.getAttribute('data-id'));
        const goal = getGoalById(goalId);
        if (goal) {
          openPaymentModal(goal);
        }
      });
    }
    
    const editButton = goalEl.querySelector('.goal-edit');
    if (editButton) {
      editButton.addEventListener('click', () => {
        const goalId = parseInt(editButton.getAttribute('data-id'));
        const goal = getGoalById(goalId);
        if (goal) {
          openGoalModal(goal);
        }
      });
    }
    
    const deleteButton = goalEl.querySelector('.goal-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        const goalId = parseInt(deleteButton.getAttribute('data-id'));
        openConfirmModal(
          'Вы уверены, что хотите удалить эту финансовую цель? Все платежи также будут удалены.',
          () => {
            deleteGoal(goalId);
            showToast('Успешно', 'Финансовая цель удалена');
          }
        );
      });
    }
  });
}

// Функция для обновления списка задач
function updateTasksList() {
  logDebug('Обновление списка задач...');
  
  const tasksListContainer = document.getElementById('tasks-list');
  if (!tasksListContainer) return;
  
  // Получаем задачи на сегодня
  const today = getTodayString();
  const todayTasks = getTasks(today);
  
  // Если нет задач, показываем пустое состояние
  if (todayTasks.length === 0) {
    tasksListContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check"></i>
        <p>На сегодня нет задач</p>
        <button class="btn btn-outline" id="add-task-empty-btn">
          Добавить задачу
        </button>
      </div>
    `;
    
    // Добавляем обработчик для кнопки добавления
    const addButton = document.getElementById('add-task-empty-btn');
    if (addButton) {
      addButton.addEventListener('click', () => openTaskModal());
    }
    
    return;
  }
  
  // Сортируем задачи: сначала невыполненные, потом по времени
  todayTasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    if (!a.dueTime && !b.dueTime) return 0;
    if (!a.dueTime) return 1;
    if (!b.dueTime) return -1;
    
    return a.dueTime.localeCompare(b.dueTime);
  });
  
  // Очищаем контейнер
  tasksListContainer.innerHTML = '';
  
  // Добавляем задачи в список
  todayTasks.forEach(task => {
    const taskEl = document.createElement('div');
    taskEl.className = 'task-item';
    if (task.completed) taskEl.classList.add('task-completed');
    
    taskEl.innerHTML = `
      <div class="task-checkbox">
        <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
        <label for="task-${task.id}"></label>
      </div>
      <div class="task-content">
        <div class="task-header">
          <h4 class="task-title">${task.title}</h4>
          <div class="task-actions">
            <button class="btn-icon task-edit" data-id="${task.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon task-delete" data-id="${task.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        ${task.dueTime ? `<p class="task-time">${formatTime(task.dueTime)}</p>` : ''}
      </div>
    `;
    
    tasksListContainer.appendChild(taskEl);
    
    // Добавляем обработчик для чекбокса
    const checkbox = taskEl.querySelector(`#task-${task.id}`);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        updateTask(task.id, { completed: checkbox.checked });
      });
    }
    
    // Добавляем обработчики для кнопок
    const editButton = taskEl.querySelector('.task-edit');
    if (editButton) {
      editButton.addEventListener('click', () => {
        const taskId = parseInt(editButton.getAttribute('data-id'));
        const task = getTaskById(taskId);
        if (task) {
          openTaskModal(task);
        }
      });
    }
    
    const deleteButton = taskEl.querySelector('.task-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        const taskId = parseInt(deleteButton.getAttribute('data-id'));
        openConfirmModal(
          'Вы уверены, что хотите удалить эту задачу?',
          () => {
            deleteTask(taskId);
            showToast('Успешно', 'Задача удалена');
          }
        );
      });
    }
  });
}

// Функция для обновления статистики
function updateStats() {
  logDebug('Обновление статистики...');
  
  // Получаем все необходимые данные
  const today = getTodayString();
  const todayTasks = getTasks(today);
  const allGoals = getGoals();
  
  // Получаем дату начала и конца текущей недели
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Понедельник
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Воскресенье
  
  const startOfWeekStr = formatDateForAPI(startOfWeek);
  const endOfWeekStr = formatDateForAPI(endOfWeek);
  
  // События на текущую неделю
  const weekEvents = events.filter(event => {
    return event.date >= startOfWeekStr && event.date <= endOfWeekStr;
  });
  
  // События на сегодня
  const todayEvents = events.filter(event => event.date === today);
  
  // Завершенные задачи за месяц
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const startOfMonthStr = formatDateForAPI(startOfMonth);
  const endOfMonthStr = formatDateForAPI(endOfMonth);
  
  const completedTasksThisMonth = tasks.filter(task => {
    return task.completed && task.dueDate >= startOfMonthStr && task.dueDate <= endOfMonthStr;
  });
  
  // Обновляем счетчики
  updateStatValue('today-tasks-count', todayTasks.length);
  updateStatValue('week-events-count', weekEvents.length);
  updateStatValue('goals-count', allGoals.length);
  updateStatValue('completed-count', completedTasksThisMonth.length);
  
  // Обновляем счетчики на странице календаря
  updateStatValue('today-events-count', todayEvents.length);
  updateStatValue('page-week-events-count', weekEvents.length);
  updateStatValue('meetings-count', events.filter(event => event.type === 'meeting').length);
  updateStatValue('total-events-count', events.length);
}

// Функция для обновления значения статистики
function updateStatValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

// Функция для обновления даты
function updateDate() {
  const todayDateEl = document.getElementById('today-date');
  if (todayDateEl) {
    const today = getTodayString();
    todayDateEl.textContent = formatDateForDisplay(today);
  }
}

// Функция для открытия модального окна с задачей
function openTaskModal(task = null) {
  const modal = document.getElementById('task-modal');
  const titleEl = document.getElementById('task-modal-title');
  const form = document.getElementById('task-form');
  const idInput = document.getElementById('task-id');
  const titleInput = document.getElementById('task-title');
  const descriptionInput = document.getElementById('task-description');
  const dueDateInput = document.getElementById('task-due-date');
  const dueTimeInput = document.getElementById('task-due-time');
  const completedInput = document.getElementById('task-completed');
  
  if (!modal || !form) return;
  
  // Устанавливаем заголовок и значения полей
  if (task) {
    titleEl.textContent = 'Редактировать задачу';
    idInput.value = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    dueDateInput.value = task.dueDate;
    dueTimeInput.value = task.dueTime || '';
    completedInput.checked = task.completed;
  } else {
    titleEl.textContent = 'Создать задачу';
    form.reset();
    idInput.value = '';
    dueDateInput.value = getTodayString();
    completedInput.checked = false;
  }
  
  // Показываем модальное окно
  modal.classList.add('show');
  
  // Добавляем обработчик отправки формы
  form.onsubmit = function(e) {
    e.preventDefault();
    
    const taskData = {
      title: titleInput.value,
      description: descriptionInput.value || null,
      dueDate: dueDateInput.value,
      dueTime: dueTimeInput.value || null,
      completed: completedInput.checked
    };
    
    try {
      if (idInput.value) {
        // Обновляем существующую задачу
        updateTask(parseInt(idInput.value), taskData);
        showToast('Успешно', 'Задача обновлена');
      } else {
        // Создаем новую задачу
        createTask(taskData);
        showToast('Успешно', 'Задача создана');
      }
      
      // Закрываем модальное окно
      closeModal('task-modal');
    } catch (error) {
      showToast('Ошибка', error.message, 'error');
    }
  };
}

// Функция для открытия модального окна с событием
function openEventModal(event = null) {
  const modal = document.getElementById('event-modal');
  const titleEl = document.getElementById('event-modal-title');
  const form = document.getElementById('event-form');
  const idInput = document.getElementById('event-id');
  const titleInput = document.getElementById('event-title');
  const descriptionInput = document.getElementById('event-description');
  const dateInput = document.getElementById('event-date');
  const timeInput = document.getElementById('event-time');
  const typeInput = document.getElementById('event-type');
  
  if (!modal || !form) return;
  
  // Устанавливаем заголовок и значения полей
  if (event) {
    titleEl.textContent = 'Редактировать событие';
    idInput.value = event.id;
    titleInput.value = event.title;
    descriptionInput.value = event.description || '';
    dateInput.value = event.date;
    timeInput.value = event.time;
    typeInput.value = event.type;
  } else {
    titleEl.textContent = 'Создать событие';
    form.reset();
    idInput.value = '';
    dateInput.value = formatDateForAPI(selectedDate);
    timeInput.value = '12:00';
    typeInput.value = 'meeting';
  }
  
  // Показываем модальное окно
  modal.classList.add('show');
  
  // Добавляем обработчик отправки формы
  form.onsubmit = function(e) {
    e.preventDefault();
    
    const eventData = {
      title: titleInput.value,
      description: descriptionInput.value || null,
      date: dateInput.value,
      time: timeInput.value,
      type: typeInput.value
    };
    
    try {
      if (idInput.value) {
        // Обновляем существующее событие
        updateEvent(parseInt(idInput.value), eventData);
        showToast('Успешно', 'Событие обновлено');
      } else {
        // Создаем новое событие
        createEvent(eventData);
        showToast('Успешно', 'Событие создано');
      }
      
      // Закрываем модальное окно
      closeModal('event-modal');
    } catch (error) {
      showToast('Ошибка', error.message, 'error');
    }
  };
}

// Функция для открытия модального окна с финансовой целью
function openGoalModal(goal = null) {
  const modal = document.getElementById('goal-modal');
  const titleEl = document.getElementById('goal-modal-title');
  const form = document.getElementById('goal-form');
  const idInput = document.getElementById('goal-id');
  const titleInput = document.getElementById('goal-title');
  const descriptionInput = document.getElementById('goal-description');
  const targetAmountInput = document.getElementById('goal-target-amount');
  const deadlineInput = document.getElementById('goal-deadline');
  const noDeadlineInput = document.getElementById('goal-no-deadline');
  
  if (!modal || !form) return;
  
  // Устанавливаем заголовок и значения полей
  if (goal) {
    titleEl.textContent = 'Редактировать финансовую цель';
    idInput.value = goal.id;
    titleInput.value = goal.title;
    descriptionInput.value = goal.description || '';
    targetAmountInput.value = goal.targetAmount;
    deadlineInput.value = goal.deadline || '';
    noDeadlineInput.checked = goal.noDeadline;
    deadlineInput.disabled = goal.noDeadline;
  } else {
    titleEl.textContent = 'Создать финансовую цель';
    form.reset();
    idInput.value = '';
    targetAmountInput.value = '10000';
    
    // Устанавливаем дату через месяц как дедлайн по умолчанию
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    deadlineInput.value = formatDateForAPI(nextMonth);
    
    noDeadlineInput.checked = false;
    deadlineInput.disabled = false;
  }
  
  // Добавляем обработчик для чекбокса "Без срока"
  noDeadlineInput.addEventListener('change', function() {
    deadlineInput.disabled = this.checked;
  });
  
  // Показываем модальное окно
  modal.classList.add('show');
  
  // Добавляем обработчик отправки формы
  form.onsubmit = function(e) {
    e.preventDefault();
    
    const goalData = {
      title: titleInput.value,
      description: descriptionInput.value || null,
      targetAmount: parseFloat(targetAmountInput.value),
      deadline: noDeadlineInput.checked ? null : deadlineInput.value,
      noDeadline: noDeadlineInput.checked
    };
    
    try {
      if (idInput.value) {
        // Обновляем существующую цель
        updateGoal(parseInt(idInput.value), goalData);
        showToast('Успешно', 'Финансовая цель обновлена');
      } else {
        // Создаем новую цель
        createGoal(goalData);
        showToast('Успешно', 'Финансовая цель создана');
      }
      
      // Закрываем модальное окно
      closeModal('goal-modal');
    } catch (error) {
      showToast('Ошибка', error.message, 'error');
    }
  };
}

// Функция для открытия модального окна с платежом
function openPaymentModal(goal) {
  const modal = document.getElementById('payment-modal');
  const form = document.getElementById('payment-form');
  const goalIdInput = document.getElementById('payment-goal-id');
  const amountInput = document.getElementById('payment-amount');
  const dateInput = document.getElementById('payment-date');
  const noteInput = document.getElementById('payment-note');
  
  if (!modal || !form || !goal) return;
  
  // Устанавливаем значения полей
  form.reset();
  goalIdInput.value = goal.id;
  dateInput.value = getTodayString();
  
  // Рассчитываем оставшуюся сумму для достижения цели
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  amountInput.value = remainingAmount;
  
  // Добавляем имя цели в заголовок
  const titleEl = document.getElementById('payment-modal-title');
  if (titleEl) {
    titleEl.textContent = `Добавить платеж для "${goal.title}"`;
  }
  
  // Показываем модальное окно
  modal.classList.add('show');
  
  // Добавляем обработчик отправки формы
  form.onsubmit = function(e) {
    e.preventDefault();
    
    const paymentData = {
      goalId: parseInt(goalIdInput.value),
      amount: parseFloat(amountInput.value),
      date: dateInput.value,
      note: noteInput.value || null
    };
    
    try {
      createPayment(paymentData);
      showToast('Успешно', 'Платеж добавлен');
      
      // Закрываем модальное окно
      closeModal('payment-modal');
    } catch (error) {
      showToast('Ошибка', error.message, 'error');
    }
  };
}

// Функция для открытия модального окна с подтверждением
function openConfirmModal(message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const messageEl = document.getElementById('confirm-message');
  const confirmButton = document.getElementById('confirm-button');
  
  if (!modal || !messageEl || !confirmButton) return;
  
  // Устанавливаем сообщение
  messageEl.textContent = message;
  
  // Показываем модальное окно
  modal.classList.add('show');
  
  // Добавляем обработчик для кнопки подтверждения
  const oldConfirmHandler = confirmButton.onclick;
  confirmButton.onclick = function() {
    onConfirm();
    closeModal('confirm-modal');
    
    // Восстанавливаем старый обработчик
    confirmButton.onclick = oldConfirmHandler;
  };
}

// Функция для закрытия модального окна
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

// Функция для показа уведомления
function showToast(title, message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  toast.innerHTML = `
    <div class="toast-header">
      <h4>${title}</h4>
      <button class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="toast-body">
      <p>${message}</p>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Добавляем обработчик для кнопки закрытия
  const closeButton = toast.querySelector('.toast-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      toast.classList.add('hiding');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    });
  }
  
  // Автоматически скрываем уведомление через 5 секунд
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 5000);
  
  // Добавляем класс show с небольшой задержкой для анимации
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
}

// Функция для настройки навигации
function setupNavigation() {
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  const pages = document.querySelectorAll('.page');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetPage = this.getAttribute('data-page');
      
      // Удаляем активный класс со всех ссылок
      navLinks.forEach(navLink => {
        navLink.parentElement.classList.remove('active');
      });
      
      // Добавляем активный класс текущей ссылке
      this.parentElement.classList.add('active');
      
      // Скрываем все страницы
      pages.forEach(page => {
        page.classList.add('hidden');
      });
      
      // Показываем целевую страницу
      const targetPageEl = document.getElementById(`${targetPage}-page`);
      if (targetPageEl) {
        targetPageEl.classList.remove('hidden');
        
        // Обновляем данные на странице, если она видима
        if (targetPage === 'calendar') {
          updatePageCalendar(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
          updatePageEventsList();
        }
      }
      
      // Закрываем мобильное меню
      const sidebarNav = document.getElementById('sidebar-nav');
      if (sidebarNav) {
        sidebarNav.classList.remove('show');
      }
      
      // Синхронизируем выбранную дату после переключения
      syncSelectedDate(selectedDate);
    });
  });
}

// Функция для настройки мобильного меню
function setupMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebarNav = document.getElementById('sidebar-nav');
  
  if (menuToggle && sidebarNav) {
    menuToggle.addEventListener('click', function() {
      sidebarNav.classList.toggle('show');
    });
  }
}

// Функция для настройки формы быстрого добавления задачи
function setupNewTaskForm() {
  const form = document.getElementById('new-task-form');
  const input = document.getElementById('new-task-input');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  
  if (!form || !input || !submitButton) return;
  
  // Активируем/деактивируем кнопку в зависимости от наличия текста
  input.addEventListener('input', function() {
    submitButton.disabled = !this.value.trim();
  });
  
  // Обрабатываем отправку формы
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = input.value.trim();
    if (!title) return;
    
    try {
      createTask({
        title,
        dueDate: getTodayString()
      });
      
      // Очищаем поле ввода и деактивируем кнопку
      input.value = '';
      submitButton.disabled = true;
      
      showToast('Успешно', 'Задача создана');
    } catch (error) {
      showToast('Ошибка', error.message, 'error');
    }
  });
}

// Функция для настройки кнопок добавления
function setupAddButtons() {
  // Кнопки добавления задач
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => openTaskModal());
  }
  
  // Кнопки добавления событий
  const addEventBtns = [
    document.getElementById('add-event-btn'),
    document.getElementById('add-event-page-btn'),
    document.getElementById('add-selected-day-event-btn')
  ];
  
  addEventBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => openEventModal());
    }
  });
  
  // Кнопки добавления финансовых целей
  const addGoalBtn = document.getElementById('add-goal-btn');
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', () => openGoalModal());
  }
}

// Функция для настройки навигации по календарю
function setupCalendarNavigation() {
  // Кнопки навигации для основного календаря
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  
  // Кнопки навигации для календаря на странице календаря
  const pageNextMonthBtn = document.getElementById('page-next-month');
  const pagePrevMonthBtn = document.getElementById('page-prev-month');
  
  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener('click', function() {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      
      let newMonth = month;
      let newYear = year;
      
      if (month === 0) {
        newMonth = 11;
        newYear = year - 1;
      } else {
        newMonth = month - 1;
      }
      
      selectedDate.setFullYear(newYear);
      selectedDate.setMonth(newMonth);
      
      updateCalendar(newYear, newMonth + 1);
      updatePageCalendar(newYear, newMonth + 1);
    });
    
    nextMonthBtn.addEventListener('click', function() {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      
      let newMonth = month;
      let newYear = year;
      
      if (month === 11) {
        newMonth = 0;
        newYear = year + 1;
      } else {
        newMonth = month + 1;
      }
      
      selectedDate.setFullYear(newYear);
      selectedDate.setMonth(newMonth);
      
      updateCalendar(newYear, newMonth + 1);
      updatePageCalendar(newYear, newMonth + 1);
    });
  }
  
  if (pageNextMonthBtn && pagePrevMonthBtn) {
    pagePrevMonthBtn.addEventListener('click', function() {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      
      let newMonth = month;
      let newYear = year;
      
      if (month === 0) {
        newMonth = 11;
        newYear = year - 1;
      } else {
        newMonth = month - 1;
      }
      
      selectedDate.setFullYear(newYear);
      selectedDate.setMonth(newMonth);
      
      updateCalendar(newYear, newMonth + 1);
      updatePageCalendar(newYear, newMonth + 1);
    });
    
    pageNextMonthBtn.addEventListener('click', function() {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      
      let newMonth = month;
      let newYear = year;
      
      if (month === 11) {
        newMonth = 0;
        newYear = year + 1;
      } else {
        newMonth = month + 1;
      }
      
      selectedDate.setFullYear(newYear);
      selectedDate.setMonth(newMonth);
      
      updateCalendar(newYear, newMonth + 1);
      updatePageCalendar(newYear, newMonth + 1);
    });
  }
}

// Функция для настройки обработчиков модальных окон
function setupModalHandlers() {
  // Кнопки закрытия модальных окон
  const closeButtons = document.querySelectorAll('.modal-close, .modal .btn-outline[data-modal]');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      closeModal(modalId);
    });
  });
  
  // Закрытие модального окна при клике вне него
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
      }
    });
  });
}

// Функция для настройки переключения темы
function setupThemeSwitch() {
  // Проверяем, сохранена ли тема в localStorage
  const savedTheme = localStorage.getItem('taskflow_theme');
  
  // Применяем сохраненную тему, если она есть
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    const darkThemeRadio = document.getElementById('dark-theme-radio');
    if (darkThemeRadio) {
      darkThemeRadio.checked = true;
    }
  }
  
  // Находим переключатели темы
  const lightThemeOption = document.getElementById('theme-light');
  const darkThemeOption = document.getElementById('theme-dark');
  const lightThemeRadio = document.getElementById('light-theme-radio');
  const darkThemeRadio = document.getElementById('dark-theme-radio');
  
  // Добавляем обработчики клика для опций темы
  if (lightThemeOption) {
    lightThemeOption.addEventListener('click', function() {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('taskflow_theme', 'light');
      lightThemeRadio.checked = true;
      showToast('Информация', 'Применена светлая тема');
    });
  }
  
  if (darkThemeOption) {
    darkThemeOption.addEventListener('click', function() {
      document.body.classList.add('dark-mode');
      localStorage.setItem('taskflow_theme', 'dark');
      darkThemeRadio.checked = true;
      showToast('Информация', 'Применена темная тема');
    });
  }
  
  // Добавляем обработчики для радио-кнопок
  if (lightThemeRadio) {
    lightThemeRadio.addEventListener('change', function() {
      if (this.checked) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('taskflow_theme', 'light');
        showToast('Информация', 'Применена светлая тема');
      }
    });
  }
  
  if (darkThemeRadio) {
    darkThemeRadio.addEventListener('change', function() {
      if (this.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('taskflow_theme', 'dark');
        showToast('Информация', 'Применена темная тема');
      }
    });
  }
}

// Функция для настройки управления данными
function setupDataManagement() {
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const resetBtn = document.getElementById('reset-data-btn');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      const data = {
        tasks,
        events,
        goals,
        goalPayments,
        nextIds
      };
      
      const dataStr = JSON.stringify(data);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileName = `taskflow_export_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      showToast('Успешно', 'Данные экспортированы');
    });
  }
  
  if (importBtn) {
    importBtn.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            const data = JSON.parse(e.target.result);
            
            // Валидируем данные
            if (!data.tasks || !data.events || !data.goals || !data.goalPayments || !data.nextIds) {
              throw new Error('Неверный формат файла');
            }
            
            // Загружаем данные
            tasks = data.tasks;
            events = data.events;
            goals = data.goals;
            goalPayments = data.goalPayments;
            nextIds = data.nextIds;
            
            // Сохраняем данные и обновляем UI
            saveData();
            updateAllPages();
            
            showToast('Успешно', 'Данные импортированы');
          } catch (error) {
            showToast('Ошибка', 'Не удалось импортировать данные: ' + error.message, 'error');
          }
        };
        
        reader.readAsText(file);
      });
      
      input.click();
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      openConfirmModal(
        'Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.',
        () => {
          // Очищаем данные
          tasks = [];
          events = [];
          goals = [];
          goalPayments = [];
          nextIds = { task: 1, event: 1, goal: 1, payment: 1 };
          
          // Сохраняем данные и обновляем UI
          saveData();
          updateAllPages();
          
          showToast('Успешно', 'Данные сброшены');
        }
      );
    });
  }
}

// Добавление тестовых данных
function addTestData() {
  logDebug('Добавление тестовых данных...');
  
  // Сегодняшняя дата
  const today = getTodayString();
  
  // Завтрашняя дата
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateForAPI(tomorrow);
  
  // Вчерашняя дата
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateForAPI(yesterday);
  
  // Текущий месяц и год
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Добавляем задачи
  tasks = [
    {
      id: nextIds.task++,
      title: 'Купить продукты',
      description: 'Молоко, хлеб, яйца, овощи',
      dueDate: today,
      dueTime: '18:00',
      completed: false
    },
    {
      id: nextIds.task++,
      title: 'Созвониться с клиентом',
      description: 'Обсудить детали проекта',
      dueDate: today,
      dueTime: '14:30',
      completed: true
    },
    {
      id: nextIds.task++,
      title: 'Подготовить отчет',
      description: 'Финансовый отчет за прошлый месяц',
      dueDate: tomorrow,
      dueTime: '12:00',
      completed: false
    },
    {
      id: nextIds.task++,
      title: 'Оплатить счета',
      description: 'Интернет, телефон, коммунальные услуги',
      dueDate: yesterday,
      dueTime: null,
      completed: true
    }
  ];
  
  // Добавляем события
  events = [
    {
      id: nextIds.event++,
      title: 'Встреча с командой',
      description: 'Обсуждение спринта',
      date: today,
      time: '10:00',
      type: 'meeting'
    },
    {
      id: nextIds.event++,
      title: 'Поход в кино',
      description: 'Новый фильм в кинотеатре',
      date: tomorrowStr,
      time: '19:30',
      type: 'personal'
    },
    {
      id: nextIds.event++,
      title: 'Платеж по кредиту',
      description: null,
      date: today,
      time: '12:00',
      type: 'finance'
    }
  ];
  
  // Добавляем еще события на текущий месяц
  for (let i = 5; i <= 25; i += 5) {
    const date = new Date(currentYear, currentMonth - 1, i);
    if (date > new Date()) { // Только будущие даты
      const dateStr = formatDateForAPI(date);
      events.push({
        id: nextIds.event++,
        title: `Событие ${i} числа`,
        description: `Описание события ${i} числа`,
        date: dateStr,
        time: '15:00',
        type: i % 2 === 0 ? 'meeting' : 'personal'
      });
    }
  }
  
  // Добавляем финансовые цели
  goals = [
    {
      id: nextIds.goal++,
      title: 'Новый ноутбук',
      description: 'Для работы и игр',
      targetAmount: 80000,
      currentAmount: 35000,
      deadline: null,
      noDeadline: true
    },
    {
      id: nextIds.goal++,
      title: 'Отпуск на море',
      description: 'Двухнедельная поездка летом',
      targetAmount: 150000,
      currentAmount: 75000,
      deadline: new Date(currentYear, 6, 1).toISOString().split('T')[0],
      noDeadline: false
    },
    {
      id: nextIds.goal++,
      title: 'Резервный фонд',
      description: 'На случай непредвиденных расходов',
      targetAmount: 300000,
      currentAmount: 100000,
      deadline: null,
      noDeadline: true
    }
  ];
  
  // Добавляем платежи
  goalPayments = [
    {
      id: nextIds.payment++,
      goalId: 1,
      amount: 10000,
      date: yesterdayStr,
      note: 'Зарплата'
    },
    {
      id: nextIds.payment++,
      goalId: 1,
      amount: 15000,
      date: new Date(currentYear, currentMonth - 2, 15).toISOString().split('T')[0],
      note: 'Премия'
    },
    {
      id: nextIds.payment++,
      goalId: 1,
      amount: 10000,
      date: new Date(currentYear, currentMonth - 3, 10).toISOString().split('T')[0],
      note: 'Зарплата'
    },
    {
      id: nextIds.payment++,
      goalId: 2,
      amount: 25000,
      date: yesterdayStr,
      note: 'Зарплата'
    },
    {
      id: nextIds.payment++,
      goalId: 2,
      amount: 50000,
      date: new Date(currentYear, currentMonth - 2, 15).toISOString().split('T')[0],
      note: 'Годовая премия'
    },
    {
      id: nextIds.payment++,
      goalId: 3,
      amount: 50000,
      date: yesterdayStr,
      note: 'Часть зарплаты'
    },
    {
      id: nextIds.payment++,
      goalId: 3,
      amount: 50000,
      date: new Date(currentYear, currentMonth - 3, 10).toISOString().split('T')[0],
      note: 'Часть зарплаты'
    }
  ];
  
  // Сохраняем данные
  saveData();
  
  logDebug('Тестовые данные добавлены');
}

// Инициализация приложения
function init() {
  logDebug('Инициализация приложения...');
  
  // Инициализируем данные
  initializeData();
  
  // Настраиваем UI
  setupNavigation();
  setupMobileMenu();
  setupNewTaskForm();
  setupAddButtons();
  setupCalendarNavigation();
  setupModalHandlers();
  setupDataManagement();
  setupThemeSwitch();
  
  // Обновляем UI
  updateAllPages();
  
  // Логируем завершение инициализации
  logDebug('Приложение инициализировано');
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', init);