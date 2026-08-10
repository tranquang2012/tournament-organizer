ALTER TABLE public.tournament
ADD COLUMN IF NOT EXISTS participant_type text;

UPDATE public.tournament AS t
SET participant_type = CASE
  WHEN EXISTS (
    SELECT 1
    FROM public.competitors AS c
    WHERE c.tour_id = t.tour_id
      AND (
        COALESCE(c.comp_size, 1) > 1
        OR (
          SELECT COUNT(*)
          FROM public.teammember AS tm
          WHERE tm.comp_id = c.comp_id
        ) > 1
      )
  ) THEN 'team'
  WHEN (
    SELECT cardinality(s.sport_type)
    FROM public.sport AS s
    WHERE s.sport_id = t.sp_id
  ) = 1 THEN (
    SELECT s.sport_type[1]
    FROM public.sport AS s
    WHERE s.sport_id = t.sp_id
  )
  ELSE 'individual'
END
WHERE participant_type IS NULL
  AND t.sp_id IS NOT NULL;

ALTER TABLE public.tournament
DROP CONSTRAINT IF EXISTS tournament_participant_type_check;

ALTER TABLE public.tournament
ADD CONSTRAINT tournament_participant_type_check
CHECK (
  participant_type IS NULL
  OR participant_type IN ('individual', 'team')
);
