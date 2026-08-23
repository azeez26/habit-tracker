export const getLocalDayOfWeek = (dateString) => {
  const jsDate = new Date(dateString);
  return (jsDate.getDay() + 1) % 7;
};
