// Firebase Configuration (Замените на свои данные из Firebase Console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Переключение темы
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Загрузка сохраненной темы
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
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

window.addEventListener('hashchange', handleHash);
window.addEventListener('load', handleHash);

// Аутентификация
auth.onAuthStateChanged(user => {
  if (!user) {
    // Перенаправление на страницу входа (в реальном проекте добавить login.html)
    window.location.hash = 'login';
  } else {
    handleHash();
  }
});

// Функции для работы с данными

// Загрузка профиля текущего пользователя
function loadProfile() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  const userRef = db.ref(`users/${currentUser.uid}`);
  userRef.once('value').then(snapshot => {
    const userData = snapshot.val();
    if (!userData) return;
    
    document.getElementById('profile-avatar').src = userData.avatarUrl || 'https://via.placeholder.com/150';
    document.getElementById('profile-name').textContent = userData.name || 'Имя не указано';
    document.getElementById('profile-id').textContent = currentUser.uid;
    document.getElementById('completed-tasks').textContent = userData.completedTasks || 0;
    document.getElementById('overdue-tasks').textContent = userData.overdueTasks || 0;
    document.getElementById('pending-tasks').textContent = userData.pendingTasks || 0;
    document.getElementById('experience-level').textContent = userData.experienceLevel || 1;
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
      contactElement.onclick = () => openChat(user.uid, user.name);
      contactsList.appendChild(contactElement);
    });
  });
}

function openChat(uid, name) {
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
  const chatTitle = document.getElementById('chat-title').textContent;
  const targetUid = getCurrentChatUid(); // Реализуйте логику получения UID собеседника
  
  if (!messageInput.value.trim() || !targetUid) return;
  
  const messageRef = db.ref(`chats/${currentUser.uid}_${targetUid}`).push();
  messageRef.set({
    text: messageInput.value,
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
              <input type="radio" id="option-${index}" name="poll-${poll.id}">
              <label for="option-${index}">${option.text} (${option.votes} голосов)</label>
            </div>
          `).join('')}
        </div>
        <button onclick="vote('${poll.id}', ${currentOption})">Проголосовать</button>
      `;
      pollsList.appendChild(pollElement);
    });
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
    const userData = snapshot.val();
    if (userData.role !== 'admin') {
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
          <p>${user.name} (${user.email})</p>
          <button onclick="resetUserPassword('${user.uid}')">Сбросить пароль</button>
          <button onclick="logoutUserSessions('${user.uid}')">Разлогинить все сессии</button>
        `;
        usersList.appendChild(userElement);
      });
    });
  });
}

// Функция загрузки файла на noikcloud.xyz
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

// Примеры других функций (заглушки)
function registerUser() {
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
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
        points: 0
      });
      alert("Сотрудник добавлен!");
    })
    .catch(error => {
      alert("Ошибка: " + error.message);
    });
}

function resetPassword() {
  // Реализуйте логику сброса пароля через Firebase Auth
  alert("Функция сброса пароля реализована в Firebase Auth");
}

function buyItem(itemId) {
  // Логика покупки товара
  alert(`Куплено: ${itemId}`);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Загрузка профиля при старте
  if (auth.currentUser) {
    loadProfile();
  }
});