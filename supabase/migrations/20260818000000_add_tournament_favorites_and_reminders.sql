CREATE TABLE IF NOT EXISTS public.tournament_favorites (
  favorite_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tour_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reminder_claimed_for_startdate date,
  reminder_claimed_at timestamptz,
  reminder_sent_for_startdate date,
  reminder_sent_at timestamptz,
  CONSTRAINT tournament_favorites_user_tournament_key UNIQUE (user_id, tour_id),
  CONSTRAINT tournament_favorites_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.user_roles(id) ON DELETE CASCADE,
  CONSTRAINT tournament_favorites_tour_id_fkey
    FOREIGN KEY (tour_id) REFERENCES public.tournament(tour_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tournament_favorites_user_id_idx
ON public.tournament_favorites(user_id);

CREATE INDEX IF NOT EXISTS tournament_favorites_tour_id_idx
ON public.tournament_favorites(tour_id);

CREATE INDEX IF NOT EXISTS tournament_favorites_reminder_lookup_idx
ON public.tournament_favorites(reminder_sent_for_startdate, reminder_claimed_at);

-- Favorites are managed through authenticated backend endpoints. With no direct
-- client policies, RLS prevents the public Supabase API from exposing this table.
ALTER TABLE public.tournament_favorites ENABLE ROW LEVEL SECURITY;
