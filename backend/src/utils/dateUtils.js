import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { parseISO, startOfDay } from 'date-fns';


export const getLocalDayOfWeek = (dateString, timezone) => {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, timezone); 
  const jsDay = zonedDate.getDay();
  return (jsDay + 1) % 7;
};

export const localDateToUTC = (localDateString, timezone) => {
  const date = parseISO(localDateString); 
  return fromZonedTime(date, timezone);
};


export const getTodayInTimezone = (timezone) => {
  const now = new Date();
  const zonedDate = toZonedTime(now, timezone);
  return format(zonedDate, 'yyyy-MM-dd');
};


export const isDateInPast = (dateString, timezone) => {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, timezone);
  const today = toZonedTime(new Date(), timezone);
  return startOfDay(zonedDate) < startOfDay(today);
};


export const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};