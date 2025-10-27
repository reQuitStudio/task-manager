// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD515FOTmwOsB32a-uC1bHAvvq6A0KnvEg",
  authDomain: "requit-tasks.firebaseapp.com",
  databaseURL: "https://requit-tasks-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "requit-tasks",
  storageBucket: "requit-tasks.firebasestorage.app",
  messagingSenderId: "358068993646",
  appId: "1:358068993646:web:f1e5d2bf7d15a13eecb07f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
let allContacts = [];

// Переключение темы
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Загрузка сохраненной темы
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
  document.body.classList.remove('dark-theme');
  themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

// Обработка хэша при загрузке и изменении
function handleHash() {
  const user = auth.currentUser;
  const hash = window.location.hash.substring(1);
  
  // Если пользователь не авторизован, но пытается открыть защищенную секцию
  if (!user && hash && hash !== 'login' && hash !== 'register') {
    window.location.hash = 'login';
    return;
  }
  
  // Очищаем все секции
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Если хэш пустой или пользователь авторизован и пытается открыть защищенную секцию
  if (!hash || (user && hash !== 'login' && hash !== 'register')) {
    const sectionId = hash || 'profile';
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add('active');
      
      // Загрузка данных для текущей секции
      if (sectionId === 'profile') loadProfile();
      if (sectionId === 'tasks') loadTasks();
      if (sectionId === 'messenger') loadMessenger();
      if (sectionId === 'top') loadTop();
      if (sectionId === 'polls') loadPolls();
      if (sectionId === 'shop') loadShop();
      if (sectionId === 'admin') loadAdmin();
    }
  } else {
    // Показываем форму входа/регистрации
    document.getElementById(hash).classList.add('active');
  }
}

// Показать форму входа
function showLoginForm() {
  document.getElementById('login').classList.add('active');
  document.getElementById('register').classList.remove('active');
  window.location.hash = 'login';
}

// Показать форму регистрации
function showRegisterForm() {
  document.getElementById('register').classList.add('active');
  document.getElementById('login').classList.remove('active');
  window.location.hash = 'register';
}

// Аутентификация
auth.onAuthStateChanged(user => {
  const currentHash = window.location.hash.substring(1) || 'login';
  
  if (!user) {
    // Показать форму входа
    document.getElementById('login').classList.add('active');
    document.getElementById('logout-btn').style.display = 'none';
    
    // Если пользователь пытается перейти в защищенную зону, перенаправить на login
    if (currentHash !== 'login' && currentHash !== 'register') {
      window.location.hash = 'login';
    }
  } else {
    document.getElementById('logout-btn').style.display = 'inline-flex';
    handleHash();
    updateStreak();
  }
});

// Улучшите функцию handleHash для дополнительной проверки
function handleHash() {
  const user = auth.currentUser;
  const hash = window.location.hash.substring(1);
  
  // Если пользователь не авторизован, но пытается открыть защищенную секцию
  if (!user && hash && hash !== 'login' && hash !== 'register') {
    window.location.hash = 'login';
    return;
  }
  
  // Очищаем все секции
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Если хэш пустой или пользователь авторизован и пытается открыть защищенную секцию
  if (!hash || (user && hash !== 'login' && hash !== 'register')) {
    const sectionId = hash || 'profile';
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add('active');
      
      // Загрузка данных для текущей секции
      if (sectionId === 'profile') loadProfile();
      if (sectionId === 'tasks') loadTasks();
      if (sectionId === 'messenger') loadMessenger();
      if (sectionId === 'top') loadTop();
      if (sectionId === 'polls') loadPolls();
      if (sectionId === 'shop') loadShop();
      if (sectionId === 'admin') loadAdmin();
      if (sectionId === 'global-chat') loadGlobalChat(); // Для нового глобального чата
    }
  } else {
    // Показываем форму входа/регистрации
    document.getElementById(hash).classList.add('active');
  }
}

// Выход из системы
document.getElementById('logout-btn').addEventListener('click', () => {
  auth.signOut().then(() => {
    document.getElementById('login').classList.add('active');
    document.querySelectorAll('.section').forEach(section => {
      if (section.id !== 'login' && section.id !== 'register') {
        section.classList.remove('active');
      }
    });
    window.location.hash = 'login';
  }).catch(error => {
    console.error("Ошибка выхода: ", error);
  });
});

// Функции для работы с данными

// Загрузка профиля текущего пользователя
// Загрузка профиля текущего пользователя
function loadProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  const userRef = db.ref(`users/${currentUser.uid}`);
  const tasksRef = db.ref(`tasks/${currentUser.uid}`);
  
  Promise.all([
    userRef.once('value'),
    tasksRef.once('value')
  ]).then(([userSnapshot, tasksSnapshot]) => {
    const userData = userSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};
    
    // Подсчитываем задачи
    let completedTasks = 0;
    let overdueTasks = 0;
    let pendingTasks = 0;
    
    Object.values(tasks).forEach(task => {
      if (task.status === 'completed') completedTasks++;
      else if (task.status === 'overdue') overdueTasks++;
      else if (task.status === 'pending') pendingTasks++;
    });
    
    // Обновляем данные пользователя, если они изменились
    const updates = {};
    if (userData.completedTasks !== completedTasks) updates.completedTasks = completedTasks;
    if (userData.overdueTasks !== overdueTasks) updates.overdueTasks = overdueTasks;
    if (userData.pendingTasks !== pendingTasks) updates.pendingTasks = pendingTasks;
    
    if (Object.keys(updates).length > 0) {
      userRef.update(updates);
    }
    
    if (!(userData.role && userData.role === 'admin')) {
      document.getElementById('admin-panel-tab').style.display = "none";
    }
    document.getElementById('profile-avatar').src = userData.avatarUrl || 'images/default-avatar.webp';
    document.getElementById('profile-name').textContent = userData.name || 'Имя не указано';
    document.getElementById('profile-id').textContent = currentUser.uid;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('overdue-tasks').textContent = overdueTasks;
    document.getElementById('pending-tasks').textContent = pendingTasks;
    document.getElementById('experience-level').style.width = `${userData.experienceLevel % 100}%`;
    document.getElementById('experience-level-value').textContent = `${userData.experienceLevel % 100} опыта / ${Math.floor(userData.experienceLevel / 100)} уровень`;
    document.getElementById('streak').textContent = `${userData.streak || 0} дней`;
    document.getElementById('points').textContent = userData.points || 0;
    document.getElementById('description').textContent = userData.description || 'Описание не указано';
    document.getElementById('professions').textContent = userData.professions?.join(', ') || 'Не указаны';
  });
}

// Загрузка задач
function loadTasks() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  const tasksRef = db.ref(`tasks/${currentUser.uid}`);
  tasksRef.on('value', snapshot => {
    const tasks = snapshot.val() || {};
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    // Получаем текущий тип сортировки
    const sortType = document.getElementById('task-sort').value;
    // Проверяем, нужно ли скрывать выполненные задачи
    const hideCompleted = document.getElementById('hide-completed').checked;
    let tasksArray = Object.values(tasks);
    
    // Проверяем и обновляем статусы задач
    const now = Date.now();
    const updates = {};
    
    Object.entries(tasks).forEach(([taskId, task]) => {
      if (task.status !== 'completed' && task.deadline < now) {
        updates[`tasks/${currentUser.uid}/${taskId}/status`] = 'overdue';
      }
    });
    
    if (Object.keys(updates).length > 0) {
      db.ref().update(updates);
    }
    
    // Фильтруем выполненные задачи, если нужно
    if (hideCompleted) {
      tasksArray = tasksArray.filter(task => task.status !== 'completed');
    }
    
    // Сортируем задачи
    if (sortType === 'newest') {
      tasksArray.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortType === 'oldest') {
      tasksArray.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortType === 'deadline') {
      tasksArray.sort((a, b) => a.deadline - b.deadline);
    }
    
    // Выводим отсортированные задачи
    tasksArray.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'task-item';
      taskElement.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-details">Описание: ${task.description || 'Без описания'}</div>
        <div class="task-details">Срок: ${new Date(task.deadline).toLocaleDateString()}</div>
        <div class="task-details">Сложность: ${getDifficultyText(task.difficulty)}</div>
        <span class="task-status ${task.status}">${task.status}</span>
      `;
      tasksList.appendChild(taskElement);
    });
  });
}

// Функция для отображения текста сложности
function getDifficultyText(difficulty) {
  switch(difficulty) {
    case 'easy': return 'Легко';
    case 'medium': return 'Средне';
    case 'hard': return 'Сложно';
    default: return 'Не указано';
  }
}

// Загрузка мессенджера
function loadMessenger() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  const contactsList = document.getElementById('contacts-list');
  contactsList.innerHTML = '<div class="loading">Загрузка контактов...</div>';
  
  // Получаем всех пользователей из базы данных
  const usersRef = db.ref('users');
  usersRef.once('value').then(snapshot => {
    const users = snapshot.val() || {};
    allContacts = Object.entries(users);
    filterContacts(); // Отображаем контакты с фильтрацией
  }).catch(error => {
    console.error("Error loading users:", error);
    contactsList.innerHTML = '<div class="error">Ошибка загрузки контактов</div>';
  });
}

function filterContacts() {
  const searchTerm = document.getElementById('search-contact').value.toLowerCase();
  const filteredContacts = allContacts.filter(([key, contact]) => 
    contact.name && contact.name.toLowerCase().includes(searchTerm)
  );
  const contactsList = document.getElementById('contacts-list');
  contactsList.innerHTML = '';
  
  // Для каждого контакта получаем последнее сообщение
  filteredContacts.forEach(([key, user]) => {
    if (key === auth.currentUser?.uid) return;
    
    const userName = user.name || 'Пользователь';
    const contactElement = document.createElement('div');
    contactElement.className = 'contact';
    
    // Получаем последнее сообщение из чата
    const chatId = [auth.currentUser.uid, key].sort().join('_');
    const chatRef = db.ref(`chats/${chatId}`);
    chatRef.orderByChild('timestamp').limitToLast(1).once('value').then(snapshot => {
      let lastMessage = '';
      if (snapshot.exists()) {
        const lastMsg = Object.values(snapshot.val())[0];
        if (lastMsg.isFile) {
          lastMessage = '[Файл]';
        } else {
          lastMessage = lastMsg.text;
          if (lastMessage.length > 30) {
            lastMessage = lastMessage.substring(0, 30) + '...';
          }
        }
      }
      
      contactElement.innerHTML = `
        <img src="${user.avatarUrl || 'images/default-avatar.webp'}" alt="${userName}">
        <div class="contact-info">
          <span class="contact-name">${userName}</span>
          <span class="last-message">${lastMessage}</span>
        </div>
        ${user.online ? '<div class="status online"></div>' : '<div class="status offline"></div>'}
      `;
      contactElement.dataset.uid = key;
      contactElement.onclick = () => openChat(key, user);
      contactsList.appendChild(contactElement);
    });
  });
  
  // Если контактов нет
  if (contactsList.children.length === 0) {
    contactsList.innerHTML = '<div class="no-contacts">Нет доступных контактов</div>';
  }
}

let currentChatUid = null;

function openChat(uid, udata) {
  currentChatUid = uid;
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  const userName = udata.name || 'Пользователь';
  const userAvatar = udata.avatarUrl || 'images/default-avatar.webp';
  document.getElementById('chat-title').textContent = userName;
  document.getElementById('chat-avatar').src = userAvatar;
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.innerHTML = '';
  
  // Отмечаем все сообщения как прочитанные
  const chatId = [currentUser.uid, currentChatUid].sort().join('_');
  const readStatusRef = db.ref(`readStatus/${currentUser.uid}/${chatId}`);
  readStatusRef.set(Date.now());
  
  // Получаем сообщения
  const chatRef = db.ref(`chats/${chatId}`);
  chatRef.on('value', snapshot => {
    const messages = snapshot.val() || {};
    const lastReadTime = snapshot.val() || 0;
    messagesContainer.innerHTML = '';
    let lastDate = null;
    
    Object.entries(messages).forEach(([msgId, msg]) => {
      const messageDate = new Date(msg.timestamp);
      const currentDate = messageDate.toDateString();
      
      // Если дата изменилась, добавляем заголовок с датой
      if (currentDate !== lastDate) {
        const dateElement = document.createElement('div');
        dateElement.className = 'message-date';
        dateElement.textContent = messageDate.toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        messagesContainer.appendChild(dateElement);
        lastDate = currentDate;
      }
      
      const messageElement = document.createElement('div');
      messageElement.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
      
      if (msg.isFile) {
        let fileContent = '';
        
        if (msg.fileType.startsWith('image/')) {
          fileContent = `<img src="${msg.text}" alt="Фото">`;
        } else if (msg.fileType.startsWith('video/')) {
          fileContent = `<video controls><source src="${msg.text}" type="${msg.fileType}"></video>`;
        } else {
          fileContent = `
            <div class="file-preview">
              <i class="fas fa-file"></i>
              <span>${msg.fileName}</span>
              <span>${formatFileSize(msg.fileSize)}</span>
              <button class="download-btn" onclick="downloadFile('${msg.text}')">Скачать</button>
            </div>
          `;
        }
        
        messageElement.innerHTML = `
          ${fileContent}
          <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
        `;
      } else {
        let messageContent = msg.text;
        
        if (msg.edited) {
          messageContent += ' <span class="edited">[изменено]</span>';
        }
        
        messageElement.innerHTML = `
          <div>${messageContent}</div>
          <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
        `;
      }
      
      // Добавляем кнопки для удаления и редактирования только для своих сообщений
      if (msg.senderId === currentUser.uid) {
        messageElement.innerHTML += `
          <div class="message-actions">
            <button class="edit-btn" onclick="editMessage('${msgId}')">✏️</button>
            <button class="delete-btn" onclick="deleteMessage('${msgId}')">🗑️</button>
          </div>
        `;
      }
      
      if (msg.senderId !== currentUser.uid && msg.timestamp <= lastReadTime) {
        messageElement.classList.add('read');
      }

      messagesContainer.appendChild(messageElement);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function editMessage(msgId) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  const chatId = [currentUser.uid, currentChatUid].sort().join('_');
  const chatRef = db.ref(`chats/${chatId}`);
  
  chatRef.child(msgId).once('value').then(snapshot => {
    const msg = snapshot.val();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Редактировать сообщение</h2>
        <div class="form-group">
          <textarea id="edit-message-text">${msg.text}</textarea>
        </div>
        <button id="save-edited-message" class="btn btn-primary">Сохранить</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    document.getElementById('save-edited-message').addEventListener('click', () => {
      const newText = document.getElementById('edit-message-text').value;
      chatRef.child(msgId).update({
        text: newText,
        edited: true,
        editedAt: Date.now()
      });
      document.body.removeChild(modal);
    });
  });
}

function deleteMessage(msgId) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  const chatId = [currentUser.uid, currentChatUid].sort().join('_');
  const chatRef = db.ref(`chats/${chatId}`);
  
  chatRef.child(msgId).remove();
}

function downloadFile(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function sendMessage() {
  const currentUser = auth.currentUser;
  const messageInput = document.getElementById('message-input');
  const messageText = messageInput.value.trim();
  
  if (!messageText || !currentChatUid) return;
  
  const chatId = [currentUser.uid, currentChatUid].sort().join('_');
  const messageRef = db.ref(`chats/${chatId}`).push();
  messageRef.set({
    text: messageText,
    senderId: currentUser.uid,
    timestamp: Date.now()
  });
  
  messageInput.value = '';
}

// Загрузка топа
function loadTop() {
  const tabs = document.querySelectorAll('.top-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.top-table').forEach(table => {
        table.style.display = 'none';
      });
      document.getElementById(`top-${tabId}`).style.display = 'block';
      
      // Загрузить данные для таба
      loadTopData(tabId);
    });
  });
  
  // Загружаем первый таб по умолчанию
  loadTopData('completed');
}

function loadTopData(tabId) {
  const usersRef = db.ref('users');
  usersRef.once('value').then(snapshot => {
    const users = snapshot.val() || {};
    let sortedUsers = Object.values(users);
    
    switch (tabId) {
      case 'completed':
        sortedUsers.sort((a, b) => (b.completedTasks || 0) - (a.completedTasks || 0));
        break;
      case 'streak':
        sortedUsers.sort((a, b) => (b.streak || 0) - (a.streak || 0));
        break;
      case 'experience':
        sortedUsers.sort((a, b) => (b.experienceLevel || 0) - (a.experienceLevel || 0));
        break;
      case 'points':
        sortedUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
        break;
    }
    
    const table = document.getElementById(`top-${tabId}`);
    table.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Место</th>
            <th>Пользователь</th>
            <th>Значение</th>
          </tr>
        </thead>
        <tbody>
          ${sortedUsers.slice(0, 10).map((user, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${user.name}</td>
              <td>${user[tabId === 'completed' ? 'completedTasks' : tabId === 'streak' ? 'streak' : tabId === 'experience' ? 'experienceLevel' : 'points'] || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }).catch(error => {
    console.error("Error loading top data:", error);
  });
}

// Загрузка голосований
function loadPolls() {
  const pollsRef = db.ref('polls');
  pollsRef.on('value', snapshot => {
    const polls = snapshot.val() || {};
    const pollsList = document.getElementById('polls-list');
    pollsList.innerHTML = '';
    
    Object.entries(polls).forEach(([key, poll]) => {
      const pollElement = document.createElement('div');
      pollElement.className = 'poll-item';
      pollElement.innerHTML = `
        <h3>${poll.title}</h3>
        <p>${poll.description}</p>
        <div class="poll-options">
          ${poll.options.map((option, index) => `
            <div class="poll-option">
              <input type="radio" id="option-${key}-${index}" name="poll-${key}" value="${index}">
              <label for="option-${key}-${index}">${option.text} (${option.votes} голосов)</label>
            </div>
          `).join('')}
        </div>
        <button class="btn" onclick="vote('${key}')">Проголосовать</button>
      `;
      pollsList.appendChild(pollElement);
    });
  });
}

function vote(pollId) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Вы должны быть авторизованы для голосования");
    return;
  }
  
  const selectedOption = document.querySelector(`input[name="poll-${pollId}"]:checked`);
  if (!selectedOption) {
    alert("Выберите вариант голосования");
    return;
  }
  
  const optionIndex = parseInt(selectedOption.value);
  const pollRef = db.ref(`polls/${pollId}`);
  
  pollRef.transaction(poll => {
    if (!poll) return;
    
    // Инициализация votedUsers, если не существует
    if (!poll.votedUsers) {
      poll.votedUsers = [];
    }
    
    // Проверка, голосовал ли пользователь ранее
    if (poll.votedUsers.includes(currentUser.uid)) {
      alert("Вы уже проголосовали в этом голосовании");
      return; // не обновляем
    }
    
    // Обновление голосов
    if (!poll.options || !poll.options[optionIndex]) {
      return; // invalid option
    }
    poll.options[optionIndex].votes = (poll.options[optionIndex].votes || 0) + 1;
    
    // Добавление пользователя в проголосовавших
    poll.votedUsers.push(currentUser.uid);
    
    return poll;
  }, (error, committed) => {
    if (error) {
      console.error("Transaction failed:", error);
      alert("Ошибка при голосовании");
    } else if (!committed) {
      // уже проголосовали
    } else {
      alert("Ваш голос учтен!");
    }
  });
}

// Загрузка магазина
function loadShop() {
  const shopRef = db.ref('shop');
  shopRef.on('value', snapshot => {
    const items = snapshot.val() || {};
    const shopItems = document.getElementById('shop-items');
    shopItems.innerHTML = '';
    
    Object.entries(items).forEach(([key, item]) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'shop-item';
      itemElement.innerHTML = `
        <img src="${item.image || ''}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p class="price">${item.price} поинтов</p>
        <button class="btn" onclick="buyItem('${key}', ${item.price})">Купить</button>
      `;
      shopItems.appendChild(itemElement);
    });
  });
}

function buyItem(itemId, price) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Вы должны быть авторизованы");
    return;
  }

  const userRef = db.ref(`users/${currentUser.uid}`);
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val() || {};
    
    if (userData.points < price) {
      alert("Недостаточно поинтов");
      return;
    }
    
    // Списываем поинты
    const newPoints = userData.points - price;
    userRef.update({ points: newPoints });
    
    // Добавляем в инвентарь
    const inventoryRef = db.ref(`inventory/${currentUser.uid}/${itemId}`);
    inventoryRef.set({
      purchasedAt: Date.now()
    });
    
    alert("Покупка успешно совершена!");
  });
}

// Загрузка админ панели
function loadAdmin() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  // Проверка роли админа
  const userRef = db.ref(`users/${currentUser.uid}`);
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val() || {};
    const role = userData.role || 'user';
    
    if (role !== 'admin') {
      document.getElementById('admin').innerHTML = '<h2>У вас нет доступа к админ панели</h2>';
      return;
    }
    
    // Показываем кнопки управления
    document.getElementById('create-poll-btn').style.display = 'inline-block';
    
    // Загрузка сотрудников
    const usersRef = db.ref('users');
    usersRef.on('value', snapshot => {
      const users = snapshot.val() || {};
      const usersList = document.getElementById('users-list');
      usersList.innerHTML = '';
      
      Object.values(users).forEach(user => {
        if (user.role === 'admin') return;
        
        const userElement = document.createElement('div');
        userElement.className = 'admin-user';
        userElement.innerHTML = `
          <p>${user.name} <span style="color: var(--on-surface-variant);">(${user.email})</span></p>
          <div>
            <button class="btn btn-secondary" onclick="resetUserPassword('${user.uid}')">Сбросить пароль</button>
          </div>
        `;
        usersList.appendChild(userElement);
      });
    });
    
    // Загрузка пользователей в селект для задач
    const taskUserSelect = document.getElementById('task-user');
    taskUserSelect.innerHTML = '<option value="">Выберите пользователя</option>';
    
    usersRef.once('value').then(snapshot => {
      const users = snapshot.val() || {};
      Object.entries(users).forEach(([key, user]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${user.name} (ID: ${key})`;
        taskUserSelect.appendChild(option);
      });
    });
    
    // Загрузка задач для админ-панели
    loadAdminTasks();
    
    // Загрузка голосований для админ-панели
    loadAdminPolls();
    
    // Загрузка товаров для магазина
    loadAdminShopItems();
  });
}

function loadAdminTasks() {
  const tasksRef = db.ref('tasks');
  tasksRef.once('value').then(snapshot => {
    const tasks = snapshot.val() || {};
    const tasksList = document.getElementById('admin-tasks-list');
    tasksList.innerHTML = '';
    
    Object.keys(tasks).forEach(userId => {
      const userRef = db.ref(`users/${userId}`);
      userRef.once('value').then(userSnapshot => {
        const userData = userSnapshot.val() || {};
        const userName = userData.name || userId;
        
        Object.entries(tasks[userId]).forEach(([key, task]) => {
          const taskElement = document.createElement('div');
          taskElement.className = 'admin-task-item';
          taskElement.innerHTML = `
            <p>Пользователь: ${userName} (ID: ${userId})</p>
            <p>Задача: ${task.title}</p>
            <p>Статус: ${task.status}</p>
            <div class="task-actions">
              <button class="btn btn-success" onclick="updateTaskStatus('${userId}', '${key}', 'completed')">Выполнено</button>
              <button class="btn btn-warning" onclick="updateTaskStatus('${userId}', '${key}', 'overdue')">Просрочено</button>
              <button class="btn btn-info" onclick="updateTaskStatus('${userId}', '${key}', 'pending')">В ожидании</button>
              <button class="btn btn-danger" onclick="deleteTask('${userId}', '${key}')">Удалить</button>
            </div>
          `;
          tasksList.appendChild(taskElement);
        });
      });
    });
  });
}

function loadAdminPolls() {
  const pollsRef = db.ref('polls');
  pollsRef.on('value', snapshot => {
    const polls = snapshot.val() || {};
    const pollsList = document.getElementById('admin-polls-list');
    pollsList.innerHTML = '';
    
    Object.entries(polls).forEach(([key, poll]) => {
      const pollElement = document.createElement('div');
      pollElement.className = 'admin-poll-item';
      pollElement.innerHTML = `
        <h3>${poll.title}</h3>
        <p>${poll.description}</p>
        <div class="poll-options">
          ${poll.options.map(option => `
            <div>${option.text}: ${option.votes} голосов</div>
          `).join('')}
        </div>
        <button class="btn btn-danger" onclick="deletePoll('${key}')">Удалить</button>
      `;
      pollsList.appendChild(pollElement);
    });
  });
}

function loadAdminShopItems() {
  const shopRef = db.ref('shop');
  shopRef.on('value', snapshot => {
    const items = snapshot.val() || {};
    const shopItems = document.getElementById('admin-shop-items');
    shopItems.innerHTML = '';
    
    Object.entries(items).forEach(([key, item]) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'admin-shop-item';
      itemElement.innerHTML = `
        <img src="${item.image || ''}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>Цена: ${item.price} поинтов</p>
        <button class="btn btn-danger" onclick="deleteShopItem('${key}')">Удалить</button>
      `;
      shopItems.appendChild(itemElement);
    });
  });
}

function deleteTask(userId, taskId) {
  const taskRef = db.ref(`tasks/${userId}/${taskId}`);
  taskRef.remove();
  alert("Задача удалена");
}

function updateTaskStatus(userId, taskId, status) {
  const taskRef = db.ref(`tasks/${userId}/${taskId}`);
  taskRef.update({ status });
  alert(`Статус задачи изменен на "${status}"`);
}

function deletePoll(pollId) {
  const pollRef = db.ref(`polls/${pollId}`);
  pollRef.remove();
  alert("Голосование удалено");
}

function deleteShopItem(itemId) {
  const itemRef = db.ref(`shop/${itemId}`);
  itemRef.remove();
  alert("Товар удален");
}

function addShopItem() {
  const name = document.getElementById('item-name').value;
  const price = parseInt(document.getElementById('item-price').value);
  const fileInput = document.getElementById('item-image-file');
  const file = fileInput.files[0];
  
  if (!name || !price || !file) {
    alert("Пожалуйста, заполните все поля и выберите изображение");
    return;
  }
  
  uploadFile(file).then(url => {
    if (url) {
      const shopRef = db.ref('shop');
      const newItemRef = shopRef.push();
      newItemRef.set({
        name,
        price,
        image: url
      });
      alert("Товар добавлен");
      document.getElementById('item-name').value = '';
      document.getElementById('item-price').value = '';
      fileInput.value = '';
    }
  });
}

// Функция загрузки файла
async function uploadFile(file) {
  if (file.size > 1024 * 1024 * 100) {
    alert("Файл больше 100 МБ!");
    return null;
  }
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch('https://noikcloud.xyz/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error.message);
    }
    return {
      url: result.url,
      name: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error("Ошибка загрузки файла:", error);
    alert("Ошибка при загрузке файла");
    return null;
  }
}

// Примеры других функций
function registerUser() {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  
  if (!email || !password) {
    alert("Пожалуйста, заполните все поля");
    return;
  }
  
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      db.ref(`users/${user.uid}`).set({
        name: "Новый сотрудник",
        email: email,
        role: "user",
        completedTasks: 0,
        overdueTasks: 0,
        pendingTasks: 0,
        experienceLevel: 1,
        streak: 0,
        points: 0,
        avatarUrl: "",
        description: "Описание не указано",
        professions: []
      });
      alert("Сотрудник добавлен!");
    })
    .catch(error => {
      alert("Ошибка: " + error.message);
    });
}

function resetPassword() {
  const email = document.getElementById('admin-email').value;
  if (!email) {
    alert("Введите email пользователя");
    return;
  }
  
  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert("Письмо для сброса пароля отправлено");
    })
    .catch(error => {
      alert("Ошибка: " + error.message);
    });
}

function resetUserPassword(uid) {
  const userRef = db.ref(`users/${uid}`);
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val();
    if (userData && userData.email) {
      auth.sendPasswordResetEmail(userData.email)
        .then(() => {
          alert("Письмо для сброса пароля отправлено на " + userData.email);
        })
        .catch(error => {
          alert("Ошибка: " + error.message);
        });
    } else {
      alert("Email пользователя не найден");
    }
  });
}

// Редактирование профиля
function editProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  // Получаем текущие данные пользователя
  const userRef = db.ref(`users/${currentUser.uid}`);
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val() || {};
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Редактировать профиль</h2>
        <div class="form-group">
          <label>Имя</label>
          <input type="text" id="edit-name" value="${userData.name || ''}">
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea id="edit-description" rows="4">${userData.description || ''}</textarea>
        </div>
        <button id="save-profile" class="btn btn-primary">Сохранить</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие модального окна
    modal.querySelector('.close-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Сохранение изменений
    document.getElementById('save-profile').addEventListener('click', () => {
      const newName = document.getElementById('edit-name').value.trim();
      const newDescription = document.getElementById('edit-description').value.trim();
      
      if (!newName) {
        alert("Имя не может быть пустым");
        return;
      }
      
      // Обновляем данные в базе
      userRef.update({
        name: newName,
        description: newDescription
      }).then(() => {
        alert("Профиль успешно обновлен");
        document.body.removeChild(modal);
        loadProfile(); // Обновляем профиль на странице
      }).catch(error => {
        console.error("Ошибка обновления профиля:", error);
        alert("Ошибка при обновлении профиля");
      });
    });
  });
}

// Смена пароля
function changePassword() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h2>Сменить пароль</h2>
      <div class="form-group">
        <label>Старый пароль</label>
        <input type="password" id="old-password">
      </div>
      <div class="form-group">
        <label>Новый пароль</label>
        <input type="password" id="new-password">
      </div>
      <div class="form-group">
        <label>Подтвердите новый пароль</label>
        <input type="password" id="confirm-password">
      </div>
      <button id="change-password-btn" class="btn btn-primary">Изменить пароль</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Закрытие модального окна
  modal.querySelector('.close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Смена пароля
  document.getElementById('change-password-btn').addEventListener('click', () => {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
      alert("Новые пароли не совпадают");
      return;
    }
    
    if (newPassword.length < 6) {
      alert("Новый пароль должен быть не менее 6 символов");
      return;
    }
    
    // Создаем учетные данные с текущим паролем
    const credential = firebase.auth.EmailAuthProvider.credential(
      currentUser.email, 
      oldPassword
    );
    
    // Перезапускаем аутентификацию с текущим паролем
    currentUser.reauthenticateWithCredential(credential).then(() => {
      // Меняем пароль
      currentUser.updatePassword(newPassword).then(() => {
        alert("Пароль успешно изменен");
        document.body.removeChild(modal);
      }).catch(error => {
        console.error("Ошибка изменения пароля:", error);
        alert("Ошибка при изменении пароля: " + error.message);
      });
    }).catch(error => {
      console.error("Ошибка аутентификации:", error);
      alert("Неверный старый пароль: " + error.message);
    });
  });
}

// Обновление функции создания задачи для добавления сложности
function createTask() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Вы должны быть авторизованы");
    return;
  }
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;
  const deadline = document.getElementById('task-deadline').value;
  const difficulty = document.getElementById('task-difficulty').value || 'easy';
  const userId = document.getElementById('task-user').value;
  if (!title || !userId || !deadline) {
    alert("Заполните все обязательные поля");
    return;
  }
  const date = new Date(deadline);
  if (isNaN(date)) {
    alert("Неверный формат даты");
    return;
  }
  const taskData = {
    title,
    description,
    deadline: date.getTime(),
    status: 'pending',
    timestamp: Date.now(),
    author: currentUser.uid,
    difficulty: difficulty
  };
  const tasksRef = db.ref(`tasks/${userId}`);
  tasksRef.push().set(taskData);
  alert("Задача добавлена!");
  // Сброс формы
  document.getElementById('task-title').value = '';
  document.getElementById('task-description').value = '';
  document.getElementById('task-deadline').value = '';
}

// Обновление статуса задачи с начислением опыта и поинтов
function updateTaskStatus(userId, taskId, status) {
  const taskRef = db.ref(`tasks/${userId}/${taskId}`);
  taskRef.once('value').then(snapshot => {
    const task = snapshot.val();
    if (!task) return;
    
    // Если задача уже завершена, не делаем ничего
    if (task.status === 'completed' && status === 'completed') {
      alert("Задача уже завершена");
      return;
    }
    
    // Если задача переводится в статус "completed"
    if (status === 'completed' && task.status !== 'completed') {
      const userRef = db.ref(`users/${userId}`);
      userRef.once('value').then(snapshot => {
        const userData = snapshot.val() || {};
        
        // Начисляем опыт и поинты в зависимости от сложности
        let experience = 0;
        let points = 0;
        
        switch(task.difficulty) {
          case 'hard':
            experience = 25;
            points = 10;
            break;
          case 'medium':
            experience = 15;
            points = 6;
            break;
          case 'easy':
            experience = 5;
            points = 3;
            break;
          default:
            experience = 5;
            points = 3;
        }
        
        // Обновляем данные пользователя
        const newExperience = (userData.experienceLevel || 0) + experience;
        const newPoints = (userData.points || 0) + points;
        
        userRef.update({
          experienceLevel: newExperience,
          points: newPoints
        });
      });
    }
    
    // Обновляем статус задачи
    taskRef.update({ status })
      .then(() => {
        alert(`Статус задачи изменен на "${status}"`);
      })
      .catch(error => {
        console.error("Ошибка обновления статуса:", error);
      });
  });
}

function createPoll() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Вы должны быть авторизованы для создания голосования");
    return;
  }

  const title = prompt("Введите заголовок голосования");
  if (!title) return;
  const description = prompt("Введите описание");
  const options = [];
  let option;
  do {
    option = prompt("Введите вариант (оставьте пустым для завершения)");
    if (option) options.push({ text: option, votes: 0 });
  } while (option);

  if (options.length < 2) {
    alert("Нужно минимум два варианта");
    return;
  }

  const pollData = {
    title,
    description,
    options,
    votedUsers: []
  };

  const pollsRef = db.ref('polls');
  pollsRef.push().set(pollData);

  alert("Голосование создано!");
}

// Обновление streak при загрузке
function updateStreak() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  const userRef = db.ref(`users/${currentUser.uid}`);
  const today = new Date().toISOString().split('T')[0]; // Формат YYYY-MM-DD
  
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val() || {};
    const streakDates = userData.streakDates || [];
    
    // Если сегодняшняя дата уже есть, ничего не делаем
    if (streakDates.includes(today)) {
      return;
    }
    
    // Добавляем сегодняшнюю дату
    const newStreakDates = [...streakDates, today];
    
    // Подсчитываем текущий streak
    let newStreak = 0;
    const sortedDates = [...newStreakDates].sort().reverse();
    let currentDate = new Date(today);
    
    // Проверяем последовательность дней
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const diffTime = Math.abs(currentDate - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 0) {
        newStreak++;
        // Переходим к предыдущему дню
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays === 1) {
        newStreak++;
        currentDate = date;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Обновляем данные в базе
    userRef.update({
      streakDates: newStreakDates,
      streak: newStreak
    });
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Обработчики для форм
  document.getElementById('task-sort').addEventListener('change', loadTasks);
  document.getElementById('search-contact').addEventListener('input', filterContacts);
  document.getElementById('hide-completed').addEventListener('change', loadTasks);

  document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        document.getElementById('login-error').textContent = '';
        handleHash();
        updateStreak();
      })
      .catch(error => {
        document.getElementById('login-error').textContent = error.message;
      });
  });
  
  // Обработчик для загрузки аватара
  document.getElementById('avatar-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    uploadFile(file).then(url => {
      if (url) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          db.ref(`users/${currentUser.uid}`).update({ avatarUrl: url });
        }
      }
    });
  });
  
  // Обработчик для файлов в чате
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  uploadFile(file).then(fileInfo => {
    if (fileInfo) {
      const currentUser = auth.currentUser;
      if (currentUser && currentChatUid) {
        const chatId = [currentUser.uid, currentChatUid].sort().join('_');
        const messageRef = db.ref(`chats/${chatId}`).push();
        messageRef.set({
          text: fileInfo.url,
          senderId: currentUser.uid,
          timestamp: Date.now(),
          isFile: true,
          fileName: fileInfo.name,
          fileSize: fileInfo.size,
          fileType: fileInfo.type
        });
      }
    }
  });
});
  
  // Обработка переключения вкладок админа
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`admin-${tabId}`).style.display = 'block';
    });
  });
  
  // Добавляем обработчик для мобильного меню
  document.getElementById('mobile-menu-btn').addEventListener('click', function() {
    document.querySelector('nav').classList.toggle('active');
  });

  // Закрывать меню при клике на ссылки
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function() {
      document.querySelector('nav').classList.remove('active');
    });
  });

  document.addEventListener('click', function(e) {
    const nav = document.querySelector('nav');
    const menuBtn = document.getElementById('mobile-menu-btn');
  
    if (!nav.contains(e.target) && !menuBtn.contains(e.target) && nav.classList.contains('active')) {
      nav.classList.remove('active');
    }
  });

  // Загрузка профиля при старте
  if (auth.currentUser) {
    loadProfile();
  }
  
  // Обработка хэша
  window.addEventListener('hashchange', handleHash);
  handleHash();
});