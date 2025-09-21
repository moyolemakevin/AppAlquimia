export function getTimeGreeting(now: Date = new Date()): string {
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Buenos dias';
  }

  if (hour >= 12 && hour < 19) {
    return 'Buenas tardes';
  }

  return 'Buenas noches';
}