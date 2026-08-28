/**
 * Habit Tracker Storage & Business Logic Manager
 * 0 = SAT, 1 = SUN, 2 = MON, 3 = TUE, 4 = WED, 5 = THU, 6 = FRI
 * Clean state with NO pre-filled dummy habits.
 */

function toBackendDayOfWeek(jsDate) {
  return (jsDate.getDay() + 1) % 7;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

class HabitStorageManager {
  constructor() {
    this.habitsKey = 'habit_tracker_habits';
    this.occurrencesKey = 'habit_tracker_occurrences';
    this.cleanLegacyDummyData();
    this.init();
  }

  // Clear any old dummy habits if they were stored
  cleanLegacyDummyData() {
    const raw = localStorage.getItem(this.habitsKey);
    if (raw) {
      try {
        const habits = JSON.parse(raw);
        // Remove dummy habits from earlier version
        const realHabits = habits.filter(h => !['habit_1', 'habit_2', 'habit_3'].includes(h._id));
        localStorage.setItem(this.habitsKey, JSON.stringify(realHabits));
      } catch (e) {
        localStorage.setItem(this.habitsKey, JSON.stringify([]));
      }
    }
  }

  init() {
    if (!localStorage.getItem(this.habitsKey)) {
      localStorage.setItem(this.habitsKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.occurrencesKey)) {
      localStorage.setItem(this.occurrencesKey, JSON.stringify({}));
    }
  }

  // Get all active habits (No default mock data)
  getHabits() {
    const raw = localStorage.getItem(this.habitsKey);
    const habits = raw ? JSON.parse(raw) : [];
    return habits.filter(h => h.is_active !== false);
  }

  // Save new habit
  addHabit(habitData) {
    const habits = this.getHabits();
    const newHabit = {
      _id: 'habit_' + Date.now(),
      created_at: new Date().toISOString(),
      is_active: true,
      ...habitData
    };
    habits.push(newHabit);
    localStorage.setItem(this.habitsKey, JSON.stringify(habits));
    return newHabit;
  }

  // Delete habit
  deleteHabit(habitId) {
    const raw = localStorage.getItem(this.habitsKey);
    let habits = raw ? JSON.parse(raw) : [];
    habits = habits.filter(h => h._id !== habitId);
    localStorage.setItem(this.habitsKey, JSON.stringify(habits));
  }

  getOccurrencesMap() {
    const raw = localStorage.getItem(this.occurrencesKey);
    return raw ? JSON.parse(raw) : {};
  }

  saveOccurrencesMap(map) {
    localStorage.setItem(this.occurrencesKey, JSON.stringify(map));
  }

  // Get habits for a specific date
  getHabitsForDate(date) {
    const dateKey = formatDateKey(date);
    const dayOfWeek = toBackendDayOfWeek(date);
    const activeHabits = this.getHabits();
    const occurrences = this.getOccurrencesMap();

    const todayKey = formatDateKey(new Date());
    const isPast = dateKey < todayKey;

    const list = [];

    for (const habit of activeHabits) {
      const isDayChecked = habit.schedule?.days?.some(
        d => d.day_of_week === dayOfWeek && d.is_checked
      );

      if (!isDayChecked) continue;

      const occKey = `${habit._id}_${dateKey}`;
      let occ = occurrences[occKey];

      const target = habit.goal_type === 'duration' 
        ? (habit.goal_duration_seconds || 1800)
        : (habit.goal_count_target || 1);

      if (!occ) {
        occ = {
          habit_id: habit._id,
          scheduled_date: dateKey,
          scheduled_time: habit.schedule?.default_time || '08:00',
          status: isPast ? 'missed' : 'pending',
          goal_progress: {
            type: habit.goal_type,
            target: target,
            completed: 0
          },
          completed_at: null
        };
      }

      list.push({
        ...habit,
        occurrence: occ
      });
    }

    return list;
  }

  updateOccurrence(habitId, dateStr, updates) {
    const map = this.getOccurrencesMap();
    const key = `${habitId}_${dateStr}`;
    const existing = map[key] || {
      habit_id: habitId,
      scheduled_date: dateStr,
      status: 'pending',
      goal_progress: { completed: 0, target: 1, type: 'count' }
    };

    map[key] = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveOccurrencesMap(map);
    return map[key];
  }

  calculateStreaks() {
    const habits = this.getHabits();
    const map = this.getOccurrencesMap();

    let totalDone = 0;
    let maxStreak = 0;

    habits.forEach(habit => {
      let tempStreak = 0;

      const dates = Object.keys(map)
        .filter(k => k.startsWith(habit._id))
        .map(k => map[k])
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

      dates.forEach(occ => {
        if (occ.status === 'done') {
          totalDone++;
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else if (occ.status === 'missed') {
          tempStreak = 0;
        }
      });
    });

    return {
      bestStreak: maxStreak,
      totalCompletions: totalDone
    };
  }
}

window.storageManager = new HabitStorageManager();
