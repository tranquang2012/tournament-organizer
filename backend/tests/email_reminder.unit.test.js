const test = require('node:test');
const assert = require('node:assert/strict');
const { FavoriteService } = require('../src/modules/favorites/service/favorite.service');
const {
  EmailReminderService,
  getDateInTimeZone,
  parseInteger,
} = require('../src/modules/favorites/service/emailReminder.service');
const {
  TournamentReminderEmailService,
  formatDate,
} = require('../src/modules/favorites/service/reminderEmail.service');
const { toDateOnly } = require('../src/modules/favorites/service/dateOnly');
const { startReminderScheduler } = require('../src/modules/favorites/service/reminderScheduler');

const TOUR_ID = '10000000-0000-4000-8000-000000000001';
const USER_ID = '10000000-0000-4000-8000-000000000002';
const FAVORITE_ID = '10000000-0000-4000-8000-000000000003';

const reminder = (overrides = {}) => ({
  favorite_id: FAVORITE_ID,
  user_id: USER_ID,
  tour_id: TOUR_ID,
  email: 'player@example.com',
  full_name: 'Test Player',
  tour_name: 'Summer Championship',
  tour_startdate: '2026-08-19',
  tour_enddate: '2026-08-20',
  tour_locat: 'Ho Chi Minh City',
  tour_descrip: null,
  sport_name: 'Valorant',
  ...overrides,
});

const silentLogger = { info() {}, error() {} };

test('favorite service rejects malformed tournament ids without querying the repository', async () => {
  let called = false;
  const service = new FavoriteService({
    addFavorite: async () => {
      called = true;
    },
  });

  await assert.rejects(
    service.addFavorite(USER_ID, 'not-a-uuid'),
    error => error.statusCode === 400 && error.message === 'A valid tournament id is required.'
  );
  assert.equal(called, false);
});

test('adding a favorite is idempotent and reports unavailable tournaments', async () => {
  const favorite = {
    favorite_id: FAVORITE_ID,
    user_id: USER_ID,
    tour_id: TOUR_ID,
    created_at: '2026-08-18T00:00:00.000Z',
  };
  const service = new FavoriteService({ addFavorite: async () => favorite });

  assert.deepEqual(await service.addFavorite(USER_ID, TOUR_ID), {
    is_favorite: true,
    ...favorite,
  });

  const unavailableService = new FavoriteService({ addFavorite: async () => null });
  await assert.rejects(
    unavailableService.addFavorite(USER_ID, TOUR_ID),
    error => error.statusCode === 404
  );
});

test('removing a missing favorite remains a successful idempotent operation', async () => {
  const service = new FavoriteService({ removeFavorite: async () => false });
  assert.deepEqual(await service.removeFavorite(USER_ID, TOUR_ID), {
    is_favorite: false,
    removed: false,
  });
});

test('reminder processor marks successful messages as sent', async () => {
  const claims = [reminder({ tour_startdate: new Date(2026, 7, 20) })];
  const sent = [];
  const marked = [];
  const repository = {
    claimDueReminders: async options => {
      assert.deepEqual(options, {
        today: '2026-08-19',
        daysBefore: 1,
        batchSize: 25,
        staleClaimMinutes: 20,
      });
      return claims;
    },
    markReminderSent: async (...args) => {
      marked.push(args);
      return true;
    },
    releaseReminderClaim: async () => assert.fail('successful reminders must not be released'),
  };
  const emailService = {
    sendTournamentReminder: async value => sent.push(value),
  };
  const service = new EmailReminderService(repository, emailService, {
    daysBefore: 1,
    batchSize: 25,
    staleClaimMinutes: 20,
    logger: silentLogger,
  });

  const result = await service.processDueReminders({ today: '2026-08-19' });

  assert.deepEqual(result, { date: '2026-08-19', claimed: 1, sent: 1, failed: 0 });
  assert.deepEqual(sent, claims);
  assert.deepEqual(marked, [[FAVORITE_ID, '2026-08-20']]);
});

test('reminder processor releases a failed claim and continues with later reminders', async () => {
  const secondFavoriteId = '10000000-0000-4000-8000-000000000004';
  const released = [];
  const marked = [];
  const repository = {
    claimDueReminders: async () => [
      reminder(),
      reminder({ favorite_id: secondFavoriteId, email: 'second@example.com' }),
    ],
    markReminderSent: async (...args) => {
      marked.push(args);
      return true;
    },
    releaseReminderClaim: async (...args) => released.push(args),
  };
  let attempt = 0;
  const emailService = {
    sendTournamentReminder: async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('SMTP unavailable');
    },
  };
  const service = new EmailReminderService(repository, emailService, { logger: silentLogger });

  const result = await service.processDueReminders({ today: '2026-08-18' });

  assert.deepEqual(result, { date: '2026-08-18', claimed: 2, sent: 1, failed: 1 });
  assert.deepEqual(released, [[FAVORITE_ID, '2026-08-19']]);
  assert.deepEqual(marked, [[secondFavoriteId, '2026-08-19']]);
});

test('reminder processor handles an empty due batch', async () => {
  const service = new EmailReminderService(
    { claimDueReminders: async () => [] },
    { sendTournamentReminder: async () => assert.fail('nothing should be sent') },
    { logger: silentLogger }
  );

  assert.deepEqual(
    await service.processDueReminders({ today: '2026-08-18' }),
    { date: '2026-08-18', claimed: 0, sent: 0, failed: 0 }
  );
});

test('reminder email includes the tournament link and escapes database text in HTML', async () => {
  let message;
  const transporter = {
    sendMail: async value => {
      message = value;
      return { messageId: 'test-message' };
    },
  };
  const service = new TournamentReminderEmailService(transporter, {
    from: 'Tournament Organizer <no-reply@example.com>',
    frontendUrl: 'https://tournaments.example.com/',
    daysBefore: 1,
  });

  await service.sendTournamentReminder(reminder({
    full_name: '<Admin>',
    tour_name: 'Valorant <Final>\r\nBcc: attacker@example.com',
  }));

  assert.equal(message.to, 'player@example.com');
  assert.equal(message.subject, 'Reminder: Valorant <Final> Bcc: attacker@example.com starts tomorrow');
  assert.match(message.text, new RegExp(`https://tournaments\\.example\\.com/tournaments/${TOUR_ID}`));
  assert.match(message.html, /Hi &lt;Admin&gt;/);
  assert.match(message.html, /Valorant &lt;Final&gt; Bcc: attacker@example\.com/);
  assert.doesNotMatch(message.html, /<Admin>/);
});

test('timezone date helper uses the configured calendar day', () => {
  const instant = new Date('2026-08-18T17:30:00.000Z');
  assert.equal(getDateInTimeZone(instant, 'Asia/Ho_Chi_Minh'), '2026-08-19');
  assert.equal(getDateInTimeZone(instant, 'UTC'), '2026-08-18');
});

test('PostgreSQL date objects retain their local calendar date in reminders', () => {
  const databaseDate = new Date(2026, 7, 20);

  assert.equal(toDateOnly(databaseDate), '2026-08-20');
  assert.equal(formatDate(databaseDate), 'August 20, 2026');
});

test('numeric reminder configuration falls back for unsafe values', () => {
  assert.equal(parseInteger('15', 10, { min: 1, max: 20 }), 15);
  assert.equal(parseInteger('0', 10, { min: 1, max: 20 }), 10);
  assert.equal(parseInteger('not-a-number', 10, { min: 1, max: 20 }), 10);
});

test('scheduler stays disabled unless explicitly enabled', () => {
  const scheduler = startReminderScheduler({
    env: { EMAIL_REMINDERS_ENABLED: 'false' },
    reminderService: {
      processDueReminders: async () => assert.fail('disabled scheduler must not run'),
    },
    logger: silentLogger,
  });

  assert.equal(scheduler, null);
});
