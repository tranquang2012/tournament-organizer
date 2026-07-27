ALTER TABLE public.tournament
DROP CONSTRAINT IF EXISTS tournament_tour_format_check;

ALTER TABLE public.tournament
ADD CONSTRAINT tournament_tour_format_check
CHECK (
  tour_format IS NULL
  OR tour_format IN (
    'single_elimination',
    'double_elimination',
    'round_robin',
    'round_scoring',
    'hybrid'
  )
);
