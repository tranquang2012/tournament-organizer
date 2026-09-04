const FORMATS = {
  SINGLE_ELIM:  'single_elimination',
  DOUBLE_ELIM:  'double_elimination',
  ROUND_ROBIN:  'round_robin',
  ROUND_SCORING: 'round_scoring',
  HYBRID:        'hybrid',
};

const ALL_EXCEPT_ROUND_SCORING = [
  FORMATS.SINGLE_ELIM,
  FORMATS.DOUBLE_ELIM,
  FORMATS.ROUND_ROBIN,
  FORMATS.HYBRID,
];

const ROUND_SCORING_ONLY = [FORMATS.ROUND_SCORING, FORMATS.HYBRID];


const SPORT_RULES = {
  //Common Sports
  1: {
    sport_name:        'Football',
    participant_types: ['team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  2: {
    sport_name:        'Basketball',
    participant_types: ['team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  3: {
    sport_name:        'Badminton',
    participant_types: ['individual', 'team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  4: {
    sport_name:        'Ping Pong',
    participant_types: ['individual', 'team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  5: {
    sport_name:        'Running',
    participant_types: ['individual'],
    formats:           ROUND_SCORING_ONLY,
    score_mode:        'time',
  },
  6: {
    sport_name:        'Bowling',
    participant_types: ['individual'],
    formats:           ROUND_SCORING_ONLY,
    score_mode:        'points',
  },

  //E-Sports
  7: {
    sport_name:        'League of Legends',
    participant_types: ['individual', 'team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  8: {
    sport_name:        'Valorant',
    participant_types: ['individual', 'team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  9: {
    sport_name:        'Dota 2',
    participant_types: ['individual', 'team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  10: {
    sport_name:        'Counter Strike 2',
    participant_types: ['individual', 'team'],
    formats:           ALL_EXCEPT_ROUND_SCORING,
  },
  11: {
    sport_name:        'Teamfight Tactics',
    participant_types: ['individual'],
    formats:           ROUND_SCORING_ONLY,
    lobby_size:        8,
  },
  12: {
    sport_name:        'Programming',
    participant_types: ['individual'],
    formats:           ROUND_SCORING_ONLY,
    score_mode:        'points',
  },
};

function getSportRules(sp_id) {
  const rules = SPORT_RULES[Number(sp_id)];
  if (!rules) return null;
  return rules;
}

module.exports = { SPORT_RULES, getSportRules };
