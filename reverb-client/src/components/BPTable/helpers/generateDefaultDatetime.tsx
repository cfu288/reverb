export function generateDefaultDatetime() {
  const now = new Date();
  now.setHours(9, 0, 0, 0);
  return now.toISOString();
}
