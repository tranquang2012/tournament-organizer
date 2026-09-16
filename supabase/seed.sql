-- Seed sports catalog for Tournament Organizer
-- Aligns with backend/src/modules/tournament/config/sportRules.config.js and frontend/src/constants/sports.js

INSERT INTO public.sport (sport_id, sport_name, sport_type, sport_banner, sport_format)
VALUES
    (1, 'Football', ARRAY['team'], NULL, 'single_elimination'),
    (2, 'Basketball', ARRAY['team'], NULL, 'single_elimination'),
    (3, 'Badminton', ARRAY['individual', 'team'], NULL, 'single_elimination'),
    (4, 'Ping Pong', ARRAY['individual', 'team'], NULL, 'single_elimination'),
    (5, 'Running', ARRAY['individual'], NULL, 'round_scoring'),
    (6, 'Bowling', ARRAY['individual'], NULL, 'round_scoring'),
    (7, 'League of Legends', ARRAY['individual', 'team'], NULL, 'single_elimination'),
    (8, 'Valorant', ARRAY['individual', 'team'], NULL, 'single_elimination'),
    (9, 'Dota 2', ARRAY['individual', 'team'], NULL, 'single_elimination'),
    (10, 'Counter Strike 2', ARRAY['individual', 'team'], NULL, 'single_elimination'),
    (11, 'Teamfight Tactics', ARRAY['individual'], NULL, 'round_scoring'),
    (12, 'Programming', ARRAY['individual'], NULL, 'round_scoring')
ON CONFLICT (sport_id) DO UPDATE SET
    sport_name = EXCLUDED.sport_name,
    sport_type = EXCLUDED.sport_type,
    sport_banner = COALESCE(EXCLUDED.sport_banner, public.sport.sport_banner),
    sport_format = EXCLUDED.sport_format,
    updated_at = now();
