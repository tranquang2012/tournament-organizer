const { SPORT_RULES } = require('../../tournament/config/sportRules.config');
const { getLobbyPreset, LOBBY_TOURNAMENT_SIZES } = require('../../tournament/dto/formatConfig.dto');

function sportAllowedLine(rules) {
  const parts = [
    `${rules.sport_name}: formats=${rules.formats.join(', ')}`,
    `participants=${rules.participant_types.join(', ')}`,
  ];
  if (rules.score_mode) parts.push(`score_mode=${rules.score_mode}`);
  if (rules.lobby_size) parts.push(`lobby_size=${rules.lobby_size}`);
  return parts.join('; ');
}

function lobbyPresetRows(lobbySize) {
  return LOBBY_TOURNAMENT_SIZES.map((n) => {
    if (n === lobbySize) return `${n} → round_scoring`;
    const preset = getLobbyPreset(n, lobbySize);
    if (!preset) return `${n} → hybrid`;
    const top = preset.advance_per_group === 1
      ? 'top 1 advances'
      : `top ${preset.advance_per_group} advance`;
    return `${n} → hybrid, ${preset.group_count} groups, ${top}`;
  });
}

function buildSystemPrompt() {
  const sportLines = Object.values(SPORT_RULES).map(sportAllowedLine);

  const lobbyBlocks = [];
  for (const rules of Object.values(SPORT_RULES)) {
    if (!rules.lobby_size) continue;
    lobbyBlocks.push(
      `Lobby presets for ${rules.sport_name} (lobby_size ${rules.lobby_size}):`,
      ...lobbyPresetRows(rules.lobby_size)
    );
  }

  return [
    'ALLOWED (enforced by the app)',
    ...sportLines,
    ...lobbyBlocks,
    'For sports with lobby_size: if the count is not 8, 16, 32, or 64, say the lobby presets don\'t cover that number and the admin should choose the nearest supported size.',
    '',
    'SUGGESTED (guidance, not enforced)',
    'For team/bracket sports: 4–8 sides → round robin if the schedule allows; 9–16 → single or double elimination; 17+ → hybrid. Only recommend a format listed for that sport in ALLOWED.',
    '',
    'You advise on sports, formats, participant counts, hybrid settings, and the four wizard steps (General Details, Sport & Participants, Format Config, Review & Publish). Politely decline anything outside that.',
    'You cannot fill in or submit the form. Never say you have set, selected, or saved anything.',
    'If a specific value isn\'t in ALLOWED or SUGGESTED above, say you\'re not certain rather than guessing.',
    'When recommending from SUGGESTED, say it is a suggestion.',
  ].join('\n');
}

const SYSTEM_PROMPT = buildSystemPrompt();

module.exports = {
  buildSystemPrompt,
  SYSTEM_PROMPT,
};
