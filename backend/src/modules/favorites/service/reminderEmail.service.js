const nodemailer = require('nodemailer');
const { toDateOnly } = require('./dateOnly');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const formatDate = (value) => {
  if (!value) return 'Date to be announced';

  const dateOnly = toDateOnly(value);
  if (!dateOnly) return String(value);
  const [year, month, day] = dateOnly.split('-').map(Number);

  if (!year || !month || !day) return String(value);

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const getTimingLabel = (daysBefore) => {
  if (daysBefore === 0) return 'today';
  if (daysBefore === 1) return 'tomorrow';
  return `in ${daysBefore} days`;
};

const singleLine = value => String(value).replace(/[\r\n]+/g, ' ').trim();

class TournamentReminderEmailService {
  constructor(transporter, { from, frontendUrl, daysBefore = 1 }) {
    this.transporter = transporter;
    this.from = from;
    this.frontendUrl = frontendUrl.replace(/\/$/, '');
    this.daysBefore = daysBefore;
  }

  async sendTournamentReminder(reminder) {
    const timing = getTimingLabel(this.daysBefore);
    const tournamentUrl = `${this.frontendUrl}/tournaments/${encodeURIComponent(reminder.tour_id)}`;
    const tournamentName = singleLine(reminder.tour_name || 'Your tournament');
    const startDate = formatDate(reminder.tour_startdate);
    const recipientName = reminder.full_name?.trim();
    const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
    const details = [
      reminder.sport_name && `Sport: ${reminder.sport_name}`,
      `Start date: ${startDate}`,
      reminder.tour_locat && `Location: ${reminder.tour_locat}`,
    ].filter(Boolean);

    const text = [
      greeting,
      '',
      `${tournamentName} starts ${timing}. You are receiving this reminder because you marked it as a favorite.`,
      '',
      ...details,
      '',
      `View tournament: ${tournamentUrl}`,
      '',
      'Unfavorite the tournament in Tournament Organizer to stop future reminders.',
    ].join('\n');

    const htmlDetails = details
      .map(detail => `<li>${escapeHtml(detail)}</li>`)
      .join('');

    const html = `
      <p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(tournamentName)}</strong> starts ${escapeHtml(timing)}. You are receiving this reminder because you marked it as a favorite.</p>
      <ul>${htmlDetails}</ul>
      <p><a href="${escapeHtml(tournamentUrl)}">View tournament</a></p>
      <p>Unfavorite the tournament in Tournament Organizer to stop future reminders.</p>
    `.trim();

    return this.transporter.sendMail({
      from: this.from,
      to: reminder.email,
      subject: `Reminder: ${tournamentName} starts ${timing}`,
      text,
      html,
    });
  }
}

const createReminderEmailService = (env = process.env) => {
  if (!env.SMTP_SERVICE && !env.SMTP_HOST) {
    throw new Error('SMTP_HOST or SMTP_SERVICE is required when email reminders are enabled.');
  }

  const port = Number.parseInt(env.SMTP_PORT || '587', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be an integer between 1 and 65535.');
  }

  const from = env.SMTP_FROM || env.SMTP_USER;
  if (!from) {
    throw new Error('SMTP_FROM or SMTP_USER is required when email reminders are enabled.');
  }

  const transportOptions = env.SMTP_SERVICE
    ? { service: env.SMTP_SERVICE }
    : {
      host: env.SMTP_HOST,
      port,
      secure: parseBoolean(env.SMTP_SECURE, port === 465),
    };

  if (env.SMTP_USER || env.SMTP_PASS) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error('SMTP_USER and SMTP_PASS must be provided together.');
    }
    transportOptions.auth = { user: env.SMTP_USER, pass: env.SMTP_PASS };
  }

  const daysBefore = Number.parseInt(env.REMINDER_DAYS_BEFORE || '1', 10);
  const transporter = nodemailer.createTransport(transportOptions);

  return new TournamentReminderEmailService(transporter, {
    from,
    frontendUrl: env.FRONTEND_URL || 'http://localhost:5173',
    daysBefore: Number.isInteger(daysBefore) ? daysBefore : 1,
  });
};

module.exports = {
  TournamentReminderEmailService,
  createReminderEmailService,
  escapeHtml,
  formatDate,
};
