require('dotenv').config();

const pool = require('../src/shared/database/pool');
const { createEmailReminderService } = require('../src/modules/favorites/service/emailReminder.service');

const run = async () => {
  try {
    const service = createEmailReminderService(process.env);
    const result = await service.processDueReminders();
    console.log(JSON.stringify(result));
    if (result.failed > 0) process.exitCode = 1;
  } catch (error) {
    console.error('Tournament email reminder run failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

void run();
