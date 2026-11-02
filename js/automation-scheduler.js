(function exposeScheduler(global) {
  const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const WEEKDAYS = [1, 2, 3, 4, 5];
  const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

  function normalizeUrl(value) {
    const input = String(value || '').trim();
    const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    try {
      const parsed = new URL(withProtocol);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      return parsed.href;
    } catch (_error) {
      return null;
    }
  }

  function daysFor(automation) {
    if (automation.recurrence === 'daily') return EVERY_DAY;
    if (automation.recurrence === 'weekdays') return WEEKDAYS;
    if (automation.recurrence === 'once') return EVERY_DAY;
    return Array.isArray(automation.daysOfWeek) ? automation.daysOfWeek.map(Number) : [];
  }

  function computeNextOccurrence(automation, from = new Date()) {
    if (!automation || !automation.enabled || !/^\d{2}:\d{2}$/.test(automation.time || '')) return null;
    const [hours, minutes] = automation.time.split(':').map(Number);
    if (hours > 23 || minutes > 59) return null;
    const allowedDays = daysFor(automation);
    if (!allowedDays.length) return null;

    for (let offset = 0; offset <= 8; offset += 1) {
      const candidate = new Date(from);
      candidate.setDate(from.getDate() + offset);
      candidate.setHours(hours, minutes, 0, 0);
      if (candidate <= from || !allowedDays.includes(candidate.getDay())) continue;
      return candidate;
    }
    return null;
  }

  function recurrenceLabel(automation) {
    if (automation.recurrence === 'once') return 'Uma vez';
    if (automation.recurrence === 'daily') return 'Todos os dias';
    if (automation.recurrence === 'weekdays') return 'Seg a sex';
    const days = daysFor(automation).sort().map(day => DAY_LABELS[day]);
    return days.length ? days.join(', ') : 'Sem dias';
  }

  function formatNext(date) {
    if (!date) return 'Sem próxima execução';
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  global.AutomationScheduler = { DAY_LABELS, WEEKDAYS, EVERY_DAY, normalizeUrl, daysFor, computeNextOccurrence, recurrenceLabel, formatNext };
})(globalThis);
