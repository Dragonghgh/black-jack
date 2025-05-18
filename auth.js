document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
      });
      
      document.getElementById(`${tab.dataset.tab}-form`).classList.remove('hidden');
    });
  });

  // Login functionality
  document.getElementById('login-btn').addEventListener('click', login);
  
  // Register functionality
  document.getElementById('register-btn').addEventListener('click', register);
  
  // Allow form submission with Enter key
  document.getElementById('login-password').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') login();
  });
  
  document.getElementById('confirm-password').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') register();
  });
});

function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');
  
  errorElement.textContent = '';
  
  if (!username || !password) {
    errorElement.textContent = 'Please fill in all fields';
    return;
  }
  
  const users = JSON.parse(localStorage.getItem('blackjack_users') || '[]');
  const user = users.find(u => u.username === username);
  
  if (!user || user.password !== password) {
    errorElement.textContent = 'Invalid username or password';
    return;
  }
  
  // Store current user session
  localStorage.setItem('current_user', JSON.stringify({
    username: user.username,
    chips: user.chips
  }));
  
  // Redirect to lobby
  window.location.href = 'lobby.html';
}

function register() {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const errorElement = document.getElementById('register-error');
  
  errorElement.textContent = '';
  
  if (!username || !password || !confirmPassword) {
    errorElement.textContent = 'Please fill in all fields';
    return;
  }
  
  if (password !== confirmPassword) {
    errorElement.textContent = 'Passwords do not match';
    return;
  }
  
  if (password.length < 6) {
    errorElement.textContent = 'Password must be at least 6 characters';
    return;
  }
  
  const users = JSON.parse(localStorage.getItem('blackjack_users') || '[]');
  
  if (users.some(u => u.username === username)) {
    errorElement.textContent = 'Username already taken';
    return;
  }
  
  // Add new user
  users.push({
    username,
    password, // Note: In a real app, you would hash the password
    chips: 1000, // Starting chips
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem('blackjack_users', JSON.stringify(users));
  
  // Auto-login the new user
  localStorage.setItem('current_user', JSON.stringify({
    username,
    chips: 1000
  }));
  
  // Redirect to lobby
  window.location.href = 'lobby.html';
}
