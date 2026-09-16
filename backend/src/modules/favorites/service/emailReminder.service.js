const favoriteRepository = require('../repository/favorite.repository');
const { createReminderEmailService } = require('./reminderEmail.service');
const { toDateOnly } = require('./dateOnly');

const parseInteger = (value, fallback, { min, max }) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
};

const getDateInTimeZone = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

class EmailReminderService {
  constructor(repository, emailService, options = {}) {
    this.repository = repository;
    this.emailService = emailService;
    this.daysBefore = options.daysBefore ?? 1;
    this.batchSize = options.batchSize ?? 100;
    this.staleClaimMinutes = options.staleClaimMinutes ?? 30;
    this.timeZone = options.timeZone || 'Asia/Ho_Chi_Minh';
    this.logger = options.logger || console;
  }

  async processDueReminders({ now = new Date(), today } = {}) {
    const reminderDate = today || getDateInTimeZone(now, this.timeZone);
    const reminders = await this.repository.claimDueReminders({
      today: reminderDate,
      daysBefore: this.daysBefore,
      batchSize: this.batchSize,
      staleClaimMinutes: this.staleClaimMinutes,
    });

    const result = { date: reminderDate, claimed: reminders.length, sent: 0, failed: 0 };

    for (const reminder of reminders) {
      const startDate = toDateOnly(reminder.tour_startdate);
      try {
        await this.emailService.sendTournamentReminder(reminder);
        const marked = await this.repository.markReminderSent(reminder.favorite_id, startDate);
        if (!marked) throw new Error('The reminder claim was no longer active after sending.');
        result.sent += 1;
      } catch (error) {
        result.failed += 1;
        try {
          await this.repository.releaseReminderClaim(reminder.favorite_id, startDate);
        } catch (releaseError) {
          this.logger.error('Failed to release tournament reminder claim:', releaseError.message);
        }
        this.logger.error(`Failed to send tournament reminder ${reminder.favorite_id}:`, error.message);
      }
    }

    return result;
  }
}

const createEmailReminderService = (env = process.env) => {
  const options = {
    daysBefore: parseInteger(env.REMINDER_DAYS_BEFORE, 1, { min: 0, max: 365 }),
    batchSize: parseInteger(env.EMAIL_REMINDER_BATCH_SIZE, 100, { min: 1, max: 500 }),
    staleClaimMinutes: parseInteger(env.REMINDER_CLAIM_STALE_MINUTES, 30, { min: 1, max: 1440 }),
    timeZone: env.REMINDER_TIME_ZONE || 'Asia/Ho_Chi_Minh',
  };

  // Validate the IANA timezone during startup instead of failing inside a scheduled run.
  getDateInTimeZone(new Date(), options.timeZone);

  return new EmailReminderService(
    favoriteRepository,
    createReminderEmailService(env),
    options
  );
};

module.exports = {
  EmailReminderService,
  createEmailReminderService,
  getDateInTimeZone,
  parseInteger,
};
