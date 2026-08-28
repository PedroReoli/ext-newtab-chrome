/**
 * Clock, Date & Personalized Greeting Module
 */

function initClockModule() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greetingEl = document.getElementById('greeting');

  if (!clockEl || !dateEl) return;

  const now = new Date();
  const hoursNum = now.getHours();

  // Time format (HH:MM)
  const hours = String(hoursNum).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = `${hours}:${minutes}`;

  // Date format in Portuguese
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  let dateStr = now.toLocaleDateString('pt-BR', options);
  dateStr = dateStr.replace('.', '');
  dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  dateEl.textContent = dateStr;

  // Time-based Greeting
  if (greetingEl) {
    if (hoursNum >= 5 && hoursNum < 12) {
      greetingEl.textContent = 'Bom dia';
    } else if (hoursNum >= 12 && hoursNum < 18) {
      greetingEl.textContent = 'Boa tarde';
    } else {
      greetingEl.textContent = 'Boa noite';
    }
  }
}
