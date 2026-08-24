const { createEmailReminderService, parseInteger } = require('./emailReminder.service');

const isEnabled = value => String(value).toLowerCase() === 'true';

const startReminderScheduler = ({
  env = process.env,
  reminderService,
  logger = console,
} = {}) => {
  if (!isEnabled(env.EMAIL_REMINDERS_ENABLED)) {
    logger.info('Tournament email reminders are disabled.');
    return null;
  }

  const service = reminderService || createEmailReminderService(env);
  const intervalMs = parseInteger(
    env.EMAIL_REMINDER_INTERVAL_MS,
    15 * 60 * 1000,
    { min: 60 * 1000, max: 24 * 60 * 60 * 1000 }
  );
  let running = false;

  const runNow = async () => {
    if (running) {
      logger.info('Tournament email reminder run skipped because the previous run is active.');
      return null;
    }

    running = true;
    try {
      const result = await service.processDueReminders();
      logger.info(
        `Tournament email reminders processed: ${result.sent} sent, ${result.failed} failed, ${result.claimed} claimed.`
      );
      return result;
    } catch (error) {
      logger.error('Tournament email reminder run failed:', error);
      return null;
    } finally {
      running = false;
    }
  };

  void runNow();
  const timer = setInterval(runNow, intervalMs);
  timer.unref?.();

  logger.info(`Tournament email reminder scheduler started (every ${intervalMs} ms).`);
  return { runNow, stop: () => clearInterval(timer) };
};

module.exports = { startReminderScheduler };
