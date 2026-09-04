const test = require('node:test');
const assert = require('node:assert/strict');
const { SPORT_RULES } = require('../src/modules/tournament/config/sportRules.config');
const { getLobbyPreset, LOBBY_TOURNAMENT_SIZES } = require('../src/modules/tournament/dto/formatConfig.dto');
const { buildSystemPrompt, SYSTEM_PROMPT } = require('../src/modules/admin/service/chat.prompt');

function allowedSection(prompt) {
  const idx = prompt.indexOf('\nSUGGESTED');
  assert.ok(idx > 0, 'prompt must contain SUGGESTED after ALLOWED');
  return prompt.slice(0, idx);
}

function allowedSportLine(prompt, sportName) {
  const line = allowedSection(prompt)
    .split('\n')
    .find((row) => row.startsWith(`${sportName}:`));
  assert.ok(line, `missing ALLOWED line for ${sportName}`);
  return line;
}

test('SYSTEM_PROMPT is built once at module load', () => {
  assert.equal(SYSTEM_PROMPT, buildSystemPrompt());
});

test('prompt has ALLOWED and SUGGESTED headers and required instructions', () => {
  const prompt = buildSystemPrompt();
  assert.match(prompt, /^ALLOWED \(enforced by the app\)/m);
  assert.match(prompt, /^SUGGESTED \(guidance, not enforced\)/m);
  assert.match(prompt, /You advise on sports, formats, participant counts, hybrid settings, and the four wizard steps/);
  assert.match(prompt, /You cannot fill in or submit the form\. Never say you have set, selected, or saved anything\./);
  assert.match(prompt, /If a specific value isn't in ALLOWED or SUGGESTED above, say you're not certain rather than guessing\./);
  assert.match(prompt, /When recommending from SUGGESTED, say it is a suggestion\./);
  assert.match(
    prompt,
    /if the count is not 8, 16, 32, or 64, say the lobby presets don't cover that number/
  );
});

test('each sport ALLOWED line lists only that sport\'s formats, score_mode, and lobby_size', () => {
  const prompt = buildSystemPrompt();
  for (const rules of Object.values(SPORT_RULES)) {
    const line = allowedSportLine(prompt, rules.sport_name);
    for (const format of rules.formats) {
      assert.ok(line.includes(format), `${rules.sport_name} line missing format ${format}: ${line}`);
    }
    for (const other of Object.values(SPORT_RULES)) {
      if (other.sport_name === rules.sport_name) continue;
      for (const format of other.formats) {
        if (rules.formats.includes(format)) continue;
        assert.equal(
          line.includes(format),
          false,
          `${rules.sport_name} line must not include ${other.sport_name} format ${format}: ${line}`
        );
      }
    }
    if (rules.score_mode) {
      assert.ok(line.includes(`score_mode=${rules.score_mode}`), `${rules.sport_name} missing score_mode`);
    }
    if (rules.lobby_size) {
      assert.ok(line.includes(`lobby_size=${rules.lobby_size}`), `${rules.sport_name} missing lobby_size`);
    }
  }
});

test('lobby preset rows sit under ALLOWED and match getLobbyPreset', () => {
  const prompt = buildSystemPrompt();
  const allowed = allowedSection(prompt);
  const suggested = prompt.slice(prompt.indexOf('\nSUGGESTED'));

  for (const rules of Object.values(SPORT_RULES)) {
    if (!rules.lobby_size) continue;
    assert.ok(allowed.includes(`Lobby presets for ${rules.sport_name}`));
    for (const n of LOBBY_TOURNAMENT_SIZES) {
      if (n === rules.lobby_size) {
        const row = `${n} → round_scoring`;
        assert.ok(allowed.includes(row), `missing ALLOWED row ${row}`);
        assert.equal(suggested.includes(row), false, `${row} must not appear only as SUGGESTED`);
        continue;
      }
      const preset = getLobbyPreset(n, rules.lobby_size);
      assert.ok(preset, `expected preset for ${n}`);
      const top = preset.advance_per_group === 1
        ? 'top 1 advances'
        : `top ${preset.advance_per_group} advance`;
      const row = `${n} → hybrid, ${preset.group_count} groups, ${top}`;
      assert.ok(allowed.includes(row), `missing ALLOWED row ${row}`);
    }
  }
});
