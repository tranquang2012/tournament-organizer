const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validatePauseDto,
  validateResumeDto,
} = require('../src/modules/tournament/dto/pauseTournament.dto');

test('validatePauseDto rejects missing pause_date', () => {
  const result = validatePauseDto({});
  assert.ok(result.errors);
  assert.equal(result.errors.includes('pause_date is required.'), true);
  assert.equal(result.data, null);
});

test('validatePauseDto rejects invalid pause_date', () => {
  const result = validatePauseDto({ pause_date: 'not-a-date' });
  assert.ok(result.errors);
  assert.match(result.errors[0], /valid ISO 8601 date/);
  assert.equal(result.data, null);
});

test('validatePauseDto accepts a valid date without shifting its calendar day', () => {
  const result = validatePauseDto({ pause_date: '2026-08-24' });
  assert.equal(result.errors, null);
  assert.equal(result.data.pause_date, '2026-08-24');
});

test('validatePauseDto rejects impossible calendar dates', () => {
  const result = validatePauseDto({ pause_date: '2026-02-30' });
  assert.ok(result.errors);
  assert.equal(result.data, null);
});

test('validatePauseDto ignores extra fields like days or pauseUntilDate', () => {
  const result = validatePauseDto({
    pause_date: '2026-08-24',
    days: 7,
    pauseUntilDate: '2026-08-31',
  });
  assert.equal(result.errors, null);
  assert.deepEqual(Object.keys(result.data), ['pause_date']);
});

test('validateResumeDto rejects missing resume_date', () => {
  const result = validateResumeDto({});
  assert.ok(result.errors);
  assert.equal(result.errors.includes('resume_date is required.'), true);
  assert.equal(result.data, null);
});

test('validateResumeDto rejects invalid resume_date', () => {
  const result = validateResumeDto({ resume_date: 'invalid' });
  assert.ok(result.errors);
  assert.match(result.errors[0], /valid ISO 8601 date/);
  assert.equal(result.data, null);
});

test('validateResumeDto accepts a valid date without shifting its calendar day', () => {
  const result = validateResumeDto({ resume_date: '2026-08-26' });
  assert.equal(result.errors, null);
  assert.equal(result.data.resume_date, '2026-08-26');
});

test('validateResumeDto ignores extra fields like days', () => {
  const result = validateResumeDto({
    resume_date: '2026-08-26',
    days: 2,
  });
  assert.equal(result.errors, null);
  assert.deepEqual(Object.keys(result.data), ['resume_date']);
});
