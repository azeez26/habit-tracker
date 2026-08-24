export const getLocalDayOfWeek = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  const jsDay = new Date(y, m - 1, d).getDay(); // Local midnight
  return (jsDay + 1) % 7; // Shift so Saturday = 0, Sunday = 1
};
