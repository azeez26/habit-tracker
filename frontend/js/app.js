/**
 * Habit Pulse - Main Application Controller
 * Handles UI interactions, Calendar Strip, Form Modals, and Backend API integrations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Current app state
  const state = {
    selectedDate: new Date(),
    currentFilter: 'all',
    activeTimerInterval: null
  };

  // DOM Elements
  const serverStatusBadge = document.getElementById('serverStatusBadge');
  const serverStatusText = document.getElementById('serverStatusText');
  const userActionArea = document.getElementById('userActionArea');
  const motivationText = document.getElementById('motivationText');

  // Modals & Forms
  const authModal = document.getElementById('authModal');
  const openAuthModalBtn = document.getElementById('openAuthModalBtn');
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  const habitModal = document.getElementById('habitModal');
  const addNewHabitBtn = document.getElementById('addNewHabitBtn');
  const closeHabitModalBtn = document.getElementById('closeHabitModalBtn');
  const cancelHabitBtn = document.getElementById('cancelHabitBtn');
  const habitForm = document.getElementById('habitForm');

  const profileModal = document.getElementById('profileModal');
  const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
  const profileForm = document.getElementById('profileForm');
  const logoutBtn = document.getElementById('logoutBtn');

  // Habit Form Controls
  const typeCountRadio = document.getElementById('typeCountRadio');
  const typeDurationRadio = document.getElementById('typeDurationRadio');
  const countTargetGroup = document.getElementById('countTargetGroup');
  const durationTargetGroup = document.getElementById('durationTargetGroup');
  const weekdaysPicker = document.getElementById('weekdaysPicker');
  const colorPicker = document.getElementById('colorPicker');
  const iconPicker = document.getElementById('iconPicker');

  // Calendar Strip Controls
  const calendarStrip = document.getElementById('calendarStrip');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedDateSubtitle = document.getElementById('selectedDateSubtitle');
  const prevDaysBtn = document.getElementById('prevDaysBtn');
  const nextDaysBtn = document.getElementById('nextDaysBtn');
  const todayBtn = document.getElementById('todayBtn');

  // Dashboard & Grid
  const habitsGrid = document.getElementById('habitsGrid');
  const statCompleted = document.getElementById('statCompleted');
  const statProgressBar = document.getElementById('statProgressBar');
  const statBestStreak = document.getElementById('statBestStreak');
  const statActiveHabits = document.getElementById('statActiveHabits');

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');

  // ==================== 1. Initialization ====================
  initApp();

  async function initApp() {
    setupEventListeners();
    renderCalendarStrip();
    renderHabits();
    updateStatsOverview();
    await checkBackendConnection();
    await checkAuthSession();

    // Auto-poll server health every 4 seconds to reconnect smoothly
    setInterval(async () => {
      await checkBackendConnection();
    }, 4000);
  }

  // ==================== 2. Backend Health & Auth ====================
  async function checkBackendConnection() {
    serverStatusBadge.className = 'server-status';
    serverStatusText.textContent = 'جارِ فحص السيرفر...';

    const health = await window.api.checkServerHealth();
    if (health.isOnline) {
      serverStatusBadge.className = 'server-status online';
      serverStatusText.textContent = `متصل بالباك إند (${health.message || '8000'})`;
    } else {
      serverStatusBadge.className = 'server-status offline';
      serverStatusText.textContent = 'الباك إند غير متصل';
    }
  }

  async function checkAuthSession() {
    if (window.api.isAuthenticated()) {
      const user = await window.api.getMe();
      if (user) {
        renderUserProfile(user);
        if (user.morningMotivation) {
          motivationText.textContent = `"${user.morningMotivation}"`;
        }
      } else {
        renderLoggedOutState();
      }
    } else {
      renderLoggedOutState();
    }
  }

  function renderUserProfile(user) {
    const avatarLetter = (user.name || 'U').charAt(0).toUpperCase();
    userActionArea.innerHTML = `
      <div class="user-profile-badge" id="openProfileBtn" title="إعدادات الحساب">
        <div class="avatar-circle">${avatarLetter}</div>
        <div class="user-meta">
          <span class="name">${escapeHtml(user.name)}</span>
          <span class="role">${escapeHtml(user.email)}</span>
        </div>
      </div>
    `;

    document.getElementById('openProfileBtn')?.addEventListener('click', () => {
      openProfileModal(user);
    });
  }

  function renderLoggedOutState() {
    userActionArea.innerHTML = `
      <button class="btn btn-outline" id="openAuthModalBtn">
        <i class="fa-solid fa-right-to-bracket"></i> تسجيل الدخول
      </button>
    `;
    document.getElementById('openAuthModalBtn')?.addEventListener('click', () => {
      openModal(authModal);
    });
  }

  // ==================== 3. Calendar Strip Flow ====================
  function renderCalendarStrip() {
    calendarStrip.innerHTML = '';
    const arabicDayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const currentCenter = new Date(state.selectedDate);
    const today = new Date();

    // Render 7 days surrounding selected date (-3 to +3)
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(currentCenter);
      d.setDate(d.getDate() + offset);

      const dayIndex = toBackendDayOfWeek(d);
      const isSelected = formatDateKey(d) === formatDateKey(state.selectedDate);
      const isToday = formatDateKey(d) === formatDateKey(today);

      const dayCard = document.createElement('div');
      dayCard.className = `day-card ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`;
      dayCard.innerHTML = `
        <span class="day-name">${isToday ? 'اليوم' : arabicDayNames[dayIndex]}</span>
        <span class="day-number">${d.getDate()}</span>
        <span class="day-dot"></span>
      `;

      dayCard.addEventListener('click', () => {
        state.selectedDate = new Date(d);
        renderCalendarStrip();
        updateDateHeaders();
        renderHabits();
        updateStatsOverview();
      });

      calendarStrip.appendChild(dayCard);
    }

    updateDateHeaders();
  }

  function updateDateHeaders() {
    const arabicDayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const isToday = formatDateKey(state.selectedDate) === formatDateKey(new Date());
    const dayOfWeek = toBackendDayOfWeek(state.selectedDate);
    const dayNum = state.selectedDate.getDate();
    const monthName = arabicMonths[state.selectedDate.getMonth()];
    const year = state.selectedDate.getFullYear();

    selectedDateTitle.textContent = isToday ? 'اليوم' : arabicDayNames[dayOfWeek];
    selectedDateSubtitle.textContent = `${arabicDayNames[dayOfWeek]}، ${dayNum} ${monthName} ${year}`;
  }

  // ==================== 4. Habits List & Operations ====================
  function renderHabits() {
    habitsGrid.innerHTML = '';
    const habitsWithOcc = window.storageManager.getHabitsForDate(state.selectedDate);

    // Update filter counts
    const counts = {
      all: habitsWithOcc.length,
      pending: habitsWithOcc.filter(h => h.occurrence.status === 'pending').length,
      done: habitsWithOcc.filter(h => h.occurrence.status === 'done').length,
      skipped: habitsWithOcc.filter(h => h.occurrence.status === 'skipped').length
    };

    document.getElementById('countAll').textContent = counts.all;
    document.getElementById('countPending').textContent = counts.pending;
    document.getElementById('countDone').textContent = counts.done;
    document.getElementById('countSkipped').textContent = counts.skipped;

    // Filter items
    const filtered = habitsWithOcc.filter(item => {
      if (state.currentFilter === 'all') return true;
      return item.occurrence.status === state.currentFilter;
    });

    if (filtered.length === 0) {
      habitsGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-clipboard-list"></i>
          <h3>لا توجد عادات لعرضها في هذا اليوم</h3>
          <p>أضف عادات جديدة أو اختر يوماً آخر من شريط التقويم بالأعلى للبدء.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = createHabitCard(item);
      habitsGrid.appendChild(card);
    });
  }

  function createHabitCard(item) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.style.setProperty('--habit-color', item.color || '#6366F1');

    const occ = item.occurrence;
    const isDuration = item.goal_type === 'duration';
    const target = isDuration 
      ? Math.round((occ.goal_progress?.target || item.goal_duration_seconds || 1800) / 60)
      : (occ.goal_progress?.target || item.goal_count_target || 1);
    
    const completed = isDuration
      ? Math.round((occ.goal_progress?.completed || 0) / 60)
      : (occ.goal_progress?.completed || 0);

    const percent = Math.min(100, Math.round((completed / target) * 100));

    const statusTranslations = {
      pending: 'قيد الانتظار',
      done: 'مكتملة ✨',
      skipped: 'تم التخطي',
      missed: 'فائتة'
    };

    card.innerHTML = `
      <div class="habit-card-header">
        <div class="habit-brand">
          <div class="habit-icon-box">
            <i class="fa-solid ${item.icon || 'fa-star'}"></i>
          </div>
          <div class="habit-info">
            <h3>${escapeHtml(item.name)}</h3>
            <div class="habit-meta-tags">
              <span class="meta-tag"><i class="fa-regular fa-clock"></i> ${item.schedule?.default_time || '08:00'}</span>
              <span class="meta-tag"><i class="fa-solid ${isDuration ? 'fa-stopwatch' : 'fa-hashtag'}"></i> ${target} ${isDuration ? 'دقيقة' : 'مرات'}</span>
            </div>
          </div>
        </div>
        <span class="status-pill ${occ.status}">${statusTranslations[occ.status] || occ.status}</span>
      </div>

      <div class="habit-progress-section">
        <div class="progress-labels">
          <span class="target-text">التقدم:</span>
          <span class="current-val">${completed} / ${target} ${isDuration ? 'دقيقة' : 'مرات'} (${percent}%)</span>
        </div>
        <div class="habit-progress-bar">
          <div class="bar-inner" style="width: ${percent}%;"></div>
        </div>
      </div>

      <div class="habit-actions-row">
        <div class="action-buttons-group">
          ${occ.status !== 'done' ? `
            <button class="btn-action btn-increment" data-action="increment">
              <i class="fa-solid fa-plus"></i> ${isDuration ? '+5 د' : '+1'}
            </button>
            <button class="btn-action btn-done" data-action="done">
              <i class="fa-solid fa-check"></i> إكمال
            </button>
            <button class="btn-action btn-skipped" data-action="skip">
              <i class="fa-solid fa-forward-step"></i> تخطي
            </button>
          ` : `
            <button class="btn-action btn-done" data-action="undo">
              <i class="fa-solid fa-rotate-left"></i> تراجع
            </button>
          `}
          <button class="btn-action btn-delete-habit" data-action="delete" title="حذف العادة">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;

    // Action handlers
    card.querySelector('[data-action="increment"]')?.addEventListener('click', () => {
      handleIncrement(item);
    });

    card.querySelector('[data-action="done"]')?.addEventListener('click', () => {
      handleStatusChange(item, 'done');
    });

    card.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
      handleStatusChange(item, 'skipped');
    });

    card.querySelector('[data-action="undo"]')?.addEventListener('click', () => {
      handleStatusChange(item, 'pending');
    });

    card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      if (confirm(`هل أنت متأكد من حذف عادة "${item.name}"؟`)) {
        window.storageManager.deleteHabit(item._id);
        showToast('تم حذف العادة بنجاح', 'info');
        renderHabits();
        updateStatsOverview();
      }
    });

    return card;
  }

  function handleIncrement(item) {
    const isDuration = item.goal_type === 'duration';
    const dateStr = formatDateKey(state.selectedDate);
    const step = isDuration ? 300 : 1; // 5 minutes or 1 count
    const target = isDuration ? item.goal_duration_seconds : item.goal_count_target;

    let currentCompleted = item.occurrence.goal_progress?.completed || 0;
    let nextCompleted = Math.min(target, currentCompleted + step);

    const isNowDone = nextCompleted >= target;

    window.storageManager.updateOccurrence(item._id, dateStr, {
      status: isNowDone ? 'done' : 'pending',
      goal_progress: {
        type: item.goal_type,
        target: target,
        completed: nextCompleted
      },
      completed_at: isNowDone ? new Date().toISOString() : null
    });

    if (isNowDone) {
      showToast(`رائع! أكملت عادة "${item.name}" بالكامل 🌟`, 'success');
    }

    renderHabits();
    updateStatsOverview();
  }

  function handleStatusChange(item, newStatus) {
    const dateStr = formatDateKey(state.selectedDate);
    const isDuration = item.goal_type === 'duration';
    const target = isDuration ? item.goal_duration_seconds : item.goal_count_target;

    let completedVal = 0;
    if (newStatus === 'done') {
      completedVal = target;
    }

    window.storageManager.updateOccurrence(item._id, dateStr, {
      status: newStatus,
      goal_progress: {
        type: item.goal_type,
        target: target,
        completed: completedVal
      },
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    });

    if (newStatus === 'done') {
      showToast(`أحسنت! تم تسجيل إنجاز "${item.name}" ✅`, 'success');
    } else if (newStatus === 'skipped') {
      showToast(`تم تخطي "${item.name}" لهذا اليوم`, 'info');
    }

    renderHabits();
    updateStatsOverview();
  }

  function updateStatsOverview() {
    const habitsWithOcc = window.storageManager.getHabitsForDate(state.selectedDate);
    const total = habitsWithOcc.length;
    const doneCount = habitsWithOcc.filter(h => h.occurrence.status === 'done').length;

    statCompleted.textContent = `${doneCount}/${total}`;
    const percent = total > 0 ? (doneCount / total) * 100 : 0;
    statProgressBar.style.width = `${percent}%`;
    statActiveHabits.textContent = total;

    const stats = window.storageManager.calculateStreaks();
    statBestStreak.textContent = `${stats.bestStreak} أيام`;
  }

  // ==================== 5. Modals & Event Listeners ====================
  function setupEventListeners() {
    // Top Date controls
    prevDaysBtn.addEventListener('click', () => {
      state.selectedDate.setDate(state.selectedDate.getDate() - 1);
      renderCalendarStrip();
      renderHabits();
      updateStatsOverview();
    });

    nextDaysBtn.addEventListener('click', () => {
      state.selectedDate.setDate(state.selectedDate.getDate() + 1);
      renderCalendarStrip();
      renderHabits();
      updateStatsOverview();
    });

    todayBtn.addEventListener('click', () => {
      state.selectedDate = new Date();
      renderCalendarStrip();
      renderHabits();
      updateStatsOverview();
    });

    // Filters
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.filter;
        renderHabits();
      });
    });

    // Auth Modal tab switching
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    });

    closeAuthModalBtn.addEventListener('click', () => closeModal(authModal));
    closeHabitModalBtn.addEventListener('click', () => closeModal(habitModal));
    cancelHabitBtn.addEventListener('click', () => closeModal(habitModal));
    closeProfileModalBtn.addEventListener('click', () => closeModal(profileModal));

    // Habit Modal Open
    addNewHabitBtn.addEventListener('click', () => {
      openModal(habitModal);
    });

    // Goal type toggle
    typeCountRadio.addEventListener('change', () => {
      countTargetGroup.classList.remove('hidden');
      durationTargetGroup.classList.add('hidden');
    });

    typeDurationRadio.addEventListener('change', () => {
      durationTargetGroup.classList.remove('hidden');
      countTargetGroup.classList.add('hidden');
    });

    // Weekdays chips
    weekdaysPicker.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
      });
    });

    // Color picker
    colorPicker.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });

    // Icon picker
    iconPicker.querySelectorAll('.icon-option').forEach(opt => {
      opt.addEventListener('click', () => {
        iconPicker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });

    // Forms Submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    habitForm.addEventListener('submit', handleCreateHabit);
    profileForm.addEventListener('submit', handleUpdateProfile);

    logoutBtn.addEventListener('click', () => {
      window.api.logout();
      closeModal(profileModal);
      renderLoggedOutState();
      showToast('تم تسجيل الخروج', 'info');
    });

    // Close modal on outside click
    [authModal, habitModal, profileModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });
  }

  // ==================== 6. Handlers ====================
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const submitBtn = document.getElementById('loginSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارِ التحقق...';

    try {
      const data = await window.api.login(email, password);
      showToast(`مرحباً بعودتك يا ${data.user.name}! 👋`, 'success');
      closeModal(authModal);
      loginForm.reset();
      renderUserProfile(data.user);
      if (data.user.morningMotivation) {
        motivationText.textContent = `"${data.user.morningMotivation}"`;
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>دخول</span> <i class="fa-solid fa-arrow-left"></i>';
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    const submitBtn = document.getElementById('registerSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارِ التسجيل...';

    try {
      const data = await window.api.register(name, email, password);
      showToast(`تم إنشاء حسابك بنجاح يا ${data.user.name}! 🎉`, 'success');
      closeModal(authModal);
      registerForm.reset();
      renderUserProfile(data.user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>إنشاء الحساب</span> <i class="fa-solid fa-user-plus"></i>';
    }
  }

  function handleCreateHabit(e) {
    e.preventDefault();
    const name = document.getElementById('habitName').value.trim();
    const goalType = document.querySelector('input[name="goal_type"]:checked').value;
    const defaultTime = document.getElementById('defaultTime').value || '08:00';

    let countTarget = null;
    let durationSeconds = null;

    if (goalType === 'count') {
      countTarget = parseInt(document.getElementById('goalCountTarget').value, 10) || 1;
    } else {
      const minutes = parseInt(document.getElementById('goalDurationMinutes').value, 10) || 30;
      durationSeconds = minutes * 60;
    }

    // Schedule days (0 to 6)
    const selectedDays = [];
    weekdaysPicker.querySelectorAll('.day-chip').forEach(chip => {
      const dayNum = parseInt(chip.dataset.day, 10);
      selectedDays.push({
        day_of_week: dayNum,
        is_checked: chip.classList.contains('active'),
        time: defaultTime
      });
    });

    // Check if at least one day is checked
    if (!selectedDays.some(d => d.is_checked)) {
      showToast('يرجى اختيار يوم واحد على الأقل للتكرار', 'error');
      return;
    }

    const activeColorDot = colorPicker.querySelector('.color-dot.active');
    const color = activeColorDot ? activeColorDot.dataset.color : '#6366F1';

    const activeIconOpt = iconPicker.querySelector('.icon-option.active');
    const icon = activeIconOpt ? activeIconOpt.dataset.icon : 'fa-star';

    // Build habit object adhering strictly to Habit.model.js
    const habitData = {
      name,
      goal_type: goalType,
      goal_count_target: countTarget,
      goal_duration_seconds: durationSeconds,
      color,
      icon,
      schedule: {
        fixed_time_for_all_days: true,
        default_time: defaultTime,
        days: selectedDays
      }
    };

    window.storageManager.addHabit(habitData);
    showToast(`تمت إضافة عادة "${name}" بنجاح! 🚀`, 'success');
    
    closeModal(habitModal);
    habitForm.reset();
    typeCountRadio.checked = true;
    countTargetGroup.classList.remove('hidden');
    durationTargetGroup.classList.add('hidden');

    renderHabits();
    updateStatsOverview();
  }

  function openProfileModal(user) {
    document.getElementById('modalUserAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
    document.getElementById('modalUserName').textContent = user.name || 'المستخدم';
    document.getElementById('modalUserEmail').textContent = user.email || '';
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileMotivation').checked = user.morningMotivation !== false;
    openModal(profileModal);
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const morningMotivation = document.getElementById('profileMotivation').checked;

    const saveBtn = document.getElementById('saveProfileBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارِ الحفظ...';

    try {
      const updatedUser = await window.api.updateProfile({ name, morningMotivation });
      showToast('تم تحديث البيانات بنجاح ✨', 'success');
      renderUserProfile(updatedUser);
      
      const motivationPill = document.getElementById('motivationPill');
      if (updatedUser.morningMotivation === false) {
        motivationPill.style.display = 'none';
      } else {
        motivationPill.style.display = 'flex';
      }
      closeModal(profileModal);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'حفظ التعديلات';
    }
  }

  // ==================== 7. UI Helpers ====================
  function openModal(modal) {
    modal.classList.add('open');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
  }

  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      info: 'fa-circle-info'
    };

    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || 'fa-bell'}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
