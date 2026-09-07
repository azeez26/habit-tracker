import { describe, it, expect } from '@jest/globals';
import {
  getLocalDayOfWeek,
  getTodayInTimezone,
  isDateInPast
} from '../../src/utils/dateUtils.js';

describe('Timezone Utilities', () => {
  it('should get correct day of week for Saturday', () => {
    const day = getLocalDayOfWeek('2026-08-22', 'Africa/Cairo'); // Saturday
    expect(day).toBe(0);
  });
  
  it('should get correct day of week for Friday', () => {
    const day = getLocalDayOfWeek('2026-08-28', 'Africa/Cairo'); // Friday
    expect(day).toBe(6);
  });
  
  it('should handle different timezones correctly', () => {
    const cairoDay = getLocalDayOfWeek('2026-08-22', 'Africa/Cairo');
    const dubaiDay = getLocalDayOfWeek('2026-08-22', 'Asia/Dubai');
    expect(cairoDay).toBe(dubaiDay); // Same date = same day of week
  });
  
  it('should identify past dates correctly', () => {
    const isPast = isDateInPast('2020-01-01', 'Africa/Cairo');
    expect(isPast).toBe(true);
  });
});