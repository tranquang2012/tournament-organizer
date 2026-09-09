import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTournamentDate,
  formatScoringSchedule,
  parseScheduleFields,
} from '../src/utils/dateFormatter.js';

describe('dateFormatter', () => {
  it('formats tournament date as dd/mm/yyyy', () => {
    const formatted = formatTournamentDate('2026-05-15T00:00:00Z');
    // Check it produces valid day/month/year format
    assert.match(formatted, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns TBD for missing or invalid tournament date', () => {
    assert.equal(formatTournamentDate(null), 'TBD');
    assert.equal(formatTournamentDate('invalid-date'), 'TBD');
  });

  it('formats scoring schedule with date and time', () => {
    const schedule = formatScoringSchedule('2026-09-08T14:30:00Z');
    assert.ok(schedule);
    assert.match(schedule, /·/);
  });

  it('returns null for missing scoring schedule', () => {
    assert.equal(formatScoringSchedule(null), null);
    assert.equal(formatScoringSchedule(''), null);
  });

  it('parses scheduled start and end into zero-padded fields', () => {
    const result = parseScheduleFields('2026-07-20T09:05:00Z', '2026-07-20T10:45:00Z');
    assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(result.startTime, /^\d{2}:\d{2}$/);
    assert.match(result.endTime, /^\d{2}:\d{2}$/);
  });

  it('handles missing dates gracefully in parseScheduleFields', () => {
    const result = parseScheduleFields(null, null);
    assert.deepEqual(result, { date: '', startTime: '', endTime: '' });
  });
});
