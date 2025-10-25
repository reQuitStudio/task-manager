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
  const hash = window.location.hash.substring(1);
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  if (hash) {
    const section = document.getElementById(hash);
    if (section) section.classList.add('active');
  } else {
    document.getElementById('profile').classList.add('active');
  }
  
  // Загрузка данных для текущей секции
  if (hash === 'profile' || !hash) loadProfile();
  if (hash === 'tasks') loadTasks();
  if (hash === 'messenger') loadMessenger();
  if (hash === 'top') loadTop();
  if (hash === 'top-week') loadTopWeek();
  if (hash === 'polls') loadPolls();
  if (hash === 'shop') loadShop();
  if (hash === 'admin') loadAdmin();
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
  if (!user) {
    // Перенаправление на страницу входа
    document.getElementById('login').classList.add('active');
    document.getElementById('logout-btn').style.display = 'none';
    document.querySelectorAll('.section').forEach(section => {
      if (section.id !== 'login' && section.id !== 'register') {
        section.classList.remove('active');
      }
    });
    window.location.hash = 'login';
  } else {
    document.getElementById('logout-btn').style.display = 'inline-flex';
    handleHash();
  }
});

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
function loadProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  const userRef = db.ref(`users/${currentUser.uid}`);
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val() || {};
    if (!userData) return;
    
    document.getElementById('profile-avatar').src = userData.avatarUrl || 'https://via.placeholder.com/150';
    document.getElementById('profile-name').textContent = userData.name || 'Имя не указано';
    document.getElementById('profile-id').textContent = currentUser.uid;
    document.getElementById('completed-tasks').textContent = userData.completedTasks || 0;
    document.getElementById('overdue-tasks').textContent = userData.overdueTasks || 0;
    document.getElementById('pending-tasks').textContent = userData.pendingTasks || 0;
    document.getElementById('experience-level').style.width = `${Math.min(userData.experienceLevel * 20, 100)}%`;
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
    
    Object.values(tasks).forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'task-item';
      taskElement.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-details">Описание: ${task.description || 'Без описания'}</div>
        <div class="task-details">Срок: ${new Date(task.deadline).toLocaleDateString()}</div>
        <span class="task-status ${task.status}">${task.status}</span>
      `;
      tasksList.appendChild(taskElement);
    });
  });
}

// Загрузка мессенджера
function loadMessenger() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  // Загрузка контактов
  const contactsRef = db.ref('users');
  contactsRef.once('value').then(snapshot => {
    const contacts = snapshot.val() || {};
    const contactsList = document.getElementById('contacts-list');
    contactsList.innerHTML = '';
    
    Object.values(contacts).forEach(user => {
      if (user.uid === currentUser.uid) return;
      
      const contactElement = document.createElement('div');
      contactElement.className = 'contact';
      contactElement.innerHTML = `
        <img src="${user.avatarUrl || 'https://via.placeholder.com/40'}" alt="${user.name}">
        <span>${user.name}</span>
      `;
      contactElement.dataset.uid = user.uid;
      contactElement.onclick = () => openChat(user.uid, user.name);
      contactsList.appendChild(contactElement);
    });
  });
}

let currentChatUid = null;

function openChat(uid, name) {
  currentChatUid = uid;
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  document.getElementById('chat-title').textContent = name;
  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.innerHTML = '';
  
  const chatRef = db.ref(`chats/${currentUser.uid}_${uid}`);
  chatRef.on('value', snapshot => {
    const messages = snapshot.val() || {};
    messagesContainer.innerHTML = '';
    
    Object.values(messages).forEach(msg => {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`;
      messageElement.innerHTML = `
        <div>${msg.text || '[Файл]'}</div>
        <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
      `;
      messagesContainer.appendChild(messageElement);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function sendMessage() {
  const currentUser = auth.currentUser;
  const messageInput = document.getElementById('message-input');
  const messageText = messageInput.value.trim();
  
  if (!messageText || !currentChatUid) return;
  
  const messageRef = db.ref(`chats/${currentUser.uid}_${currentChatUid}`).push();
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
}

function loadTopData(tabId) {
  const topRef = db.ref('top');
  topRef.once('value').then(snapshot => {
    const topData = snapshot.val() || {};
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
          ${Object.values(topData[tabId] || {}).map((user, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${user.name}</td>
              <td>${user.value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });
}

// Загрузка топа недели
function loadTopWeek() {
  const topWeekRef = db.ref('top-week');
  topWeekRef.once('value').then(snapshot => {
    const topData = snapshot.val() || {};
    const table = document.getElementById('top-week-table');
    table.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Место</th>
            <th>Пользователь</th>
            <th>Очки</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(topData).map((user, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${user.name}</td>
              <td>${user.points}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });
}

// Загрузка голосований
function loadPolls() {
  const pollsRef = db.ref('polls');
  pollsRef.on('value', snapshot => {
    const polls = snapshot.val() || {};
    const pollsList = document.getElementById('polls-list');
    pollsList.innerHTML = '';
    
    Object.values(polls).forEach(poll => {
      const pollElement = document.createElement('div');
      pollElement.className = 'poll-item';
      pollElement.innerHTML = `
        <h3>${poll.title}</h3>
        <p>${poll.description}</p>
        <div class="poll-options">
          ${poll.options.map((option, index) => `
            <div class="poll-option">
              <input type="radio" id="option-${poll.id}-${index}" name="poll-${poll.id}" value="${index}">
              <label for="option-${poll.id}-${index}">${option.text} (${option.votes} голосов)</label>
            </div>
          `).join('')}
        </div>
        <button onclick="vote('${poll.id}')">Проголосовать</button>
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
  
  pollRef.once('value').then(snapshot => {
    const poll = snapshot.val();
    if (!poll) return;
    
    // Проверка, голосовал ли пользователь ранее
    if (poll.votedUsers && poll.votedUsers.includes(currentUser.uid)) {
      alert("Вы уже проголосовали в этом голосовании");
      return;
    }
    
    // Обновление голосов
    const updatedOptions = [...poll.options];
    updatedOptions[optionIndex].votes++;
    
    // Добавление пользователя в проголосовавших
    const votedUsers = poll.votedUsers ? [...poll.votedUsers, currentUser.uid] : [currentUser.uid];
    
    pollRef.update({
      options: updatedOptions,
      votedUsers: votedUsers
    });
    
    alert("Ваш голос учтен!");
  });
}

// Загрузка магазина
function loadShop() {
  const shopRef = db.ref('shop');
  shopRef.on('value', snapshot => {
    const items = snapshot.val() || {};
    const shopItems = document.getElementById('shop-items');
    shopItems.innerHTML = '';
    
    Object.values(items).forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'shop-item';
      itemElement.innerHTML = `
        <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p class="price">${item.price} поинтов</p>
        <button class="buy-btn" onclick="buyItem('${item.id}')">Купить</button>
      `;
      shopItems.appendChild(itemElement);
    });
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
  tasksRef.on('value', snapshot => {
    const tasks = snapshot.val() || {};
    const tasksList = document.getElementById('admin-tasks-list');
    tasksList.innerHTML = '';
    
    Object.keys(tasks).forEach(userId => {
      Object.values(tasks[userId]).forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'admin-task-item';
        taskElement.innerHTML = `
          <p>Пользователь: ${userId}</p>
          <p>Задача: ${task.title}</p>
          <p>Статус: ${task.status}</p>
          <button class="btn btn-secondary" onclick="deleteTask('${userId}', '${task.id}')">Удалить</button>
        `;
        tasksList.appendChild(taskElement);
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
    
    Object.values(polls).forEach(poll => {
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
        <button class="btn btn-secondary" onclick="deletePoll('${poll.id}')">Удалить</button>
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
    
    Object.values(items).forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'admin-shop-item';
      itemElement.innerHTML = `
        <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>Цена: ${item.price} поинтов</p>
        <button class="btn btn-secondary" onclick="deleteShopItem('${item.id}')">Удалить</button>
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
  const image = document.getElementById('item-image').value;
  
  if (!name || !price || !image) {
    alert("Пожалуйста, заполните все поля");
    return;
  }
  
  const shopRef = db.ref('shop');
  const newItemRef = shopRef.push();
  newItemRef.set({
    name,
    price,
    image
  });
  
  alert("Товар добавлен");
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
    return result.url;
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
        avatarUrl: "https://via.placeholder.com/150",
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

function buyItem(itemId) {
  // Логика покупки товара
  alert(`Куплено: ${itemId}`);
}

function editProfile() {
  alert("Редактирование профиля будет реализовано в следующей версии");
}

function changePassword() {
  alert("Смена пароля будет реализована в следующей версии");
}

function addTask() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Вы должны быть авторизованы для добавления задачи");
    return;
  }

  const title = prompt("Введите название задачи");
  if (!title) return;
  const description = prompt("Введите описание задачи");
  const deadline = prompt("Введите срок выполнения (дд.мм.гггг)");
  const date = new Date(deadline);
  if (isNaN(date)) {
    alert("Неверный формат даты");
    return;
  }

  const taskData = {
    title,
    description,
    deadline: date.getTime(),
    status: 'pending'
  };

  const tasksRef = db.ref(`tasks/${currentUser.uid}`);
  tasksRef.push().set(taskData);

  alert("Задача добавлена!");
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Обработчики для форм
  document.getElementById('show-register').addEventListener('click', showRegisterForm);
  document.getElementById('show-login').addEventListener('click', showLoginForm);
  
  document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        document.getElementById('login-error').textContent = '';
        handleHash();
      })
      .catch(error => {
        document.getElementById('login-error').textContent = error.message;
      });
  });
  
  document.getElementById('register-btn').addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        const user = userCredential.user;
        db.ref(`users/${user.uid}`).set({
          name: "Новый пользователь",
          email: email,
          role: "user",
          completedTasks: 0,
          overdueTasks: 0,
          pendingTasks: 0,
          experienceLevel: 1,
          streak: 0,
          points: 0,
          avatarUrl: "https://via.placeholder.com/150",
          description: "Описание не указано",
          professions: []
        });
        document.getElementById('register-error').textContent = '';
        handleHash();
      })
      .catch(error => {
        document.getElementById('register-error').textContent = error.message;
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
    
    uploadFile(file).then(url => {
      if (url) {
        const currentUser = auth.currentUser;
        if (currentUser && currentChatUid) {
          const messageRef = db.ref(`chats/${currentUser.uid}_${currentChatUid}`).push();
          messageRef.set({
            text: url,
            senderId: currentUser.uid,
            timestamp: Date.now(),
            isFile: true
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
  
  // Загрузка профиля при старте
  if (auth.currentUser) {
    loadProfile();
  }
});