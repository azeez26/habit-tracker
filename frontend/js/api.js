// Redirect IPv6 loopback [::1] to localhost to comply with backend CORS rules
if (window.location.hostname === '[::1]' || window.location.hostname === '::1') {
  window.location.href = window.location.href.replace('[::1]', 'localhost').replace('::1', 'localhost');
}

const host = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
const API_BASE_URL = `http://${host}:8000`;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('habit_tracker_token') || null;
    this.user = JSON.parse(localStorage.getItem('habit_tracker_user') || 'null');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Health check: Check if server is running
  async checkServerHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'text/plain' }
      });
      if (response.ok) {
        const text = await response.text();
        return { isOnline: true, message: text.trim() };
      }
      return { isOnline: false, message: 'Server returned error status' };
    } catch (err) {
      return { isOnline: false, error: err.message };
    }
  }

  // User Registration: POST /api/v1/auth/register
  async register(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'فشل إنشاء الحساب');
    }

    this.saveAuth(data.user, data.token);
    return data;
  }

  // User Login: POST /api/v1/auth/login
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'بيانات الدخول غير صحيحة');
    }

    this.saveAuth(data.user, data.token);
    return data;
  }

  // Get Current User Info: GET /api/v1/auth/me
  async getMe() {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return null;
      }

      const userData = await response.json();
      this.user = userData;
      localStorage.setItem('habit_tracker_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
      return this.user;
    }
  }

  // Update User Profile: PUT /api/v1/auth/update
  async updateProfile(updates) {
    if (!this.token) throw new Error('يرجى تسجيل الدخول أولاً');

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/update`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'فشل تحديث البيانات الشخصية');
    }

    this.user = data;
    localStorage.setItem('habit_tracker_user', JSON.stringify(data));
    return data;
  }

  // Habit Endpoints (Ready to fetch directly from backend whenever mounted)
  async fetchHabitsForDate(dateStr) {
    if (!this.token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/habits/date/${dateStr}`, {
        headers: this.getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return null;
  }

  async createHabit(habitData) {
    if (!this.token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/habits`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(habitData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  }

  async logHabit(logData) {
    if (!this.token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/habits/log`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(logData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  }

  saveAuth(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('habit_tracker_user', JSON.stringify(user));
    localStorage.setItem('habit_tracker_token', token);
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('habit_tracker_user');
    localStorage.removeItem('habit_tracker_token');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

window.api = new ApiClient();
