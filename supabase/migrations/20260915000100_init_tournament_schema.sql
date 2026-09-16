BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'superadmin')),
    is_disable boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sport (
    sport_id integer PRIMARY KEY,
    sport_name text NOT NULL,
    sport_type text[] NOT NULL DEFAULT '{}',
    sport_banner text,
    sport_format text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament (
    tour_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_name text,
    tour_descrip text,
    tour_locat text,
    tour_startdate date,
    tour_enddate date,
    tour_banner text,
    tour_status text NOT NULL DEFAULT 'draft' CHECK (tour_status IN ('draft', 'ongoing', 'paused', 'ended', 'completed', 'cancelled', 'canceled', 'archived')),
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sp_id integer REFERENCES public.sport(sport_id) ON DELETE SET NULL,
    participant_type text CHECK (participant_type IN ('individual', 'team')),
    tour_format text,
    group_count integer,
    advance_per_group integer,
    first_stage_format text,
    second_stage_format text,
    sets_per_match integer NOT NULL DEFAULT 1,
    tour_pausedate timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competitors (
    comp_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id uuid NOT NULL REFERENCES public.tournament(tour_id) ON DELETE CASCADE,
    comp_name text NOT NULL,
    comp_logo text,
    comp_size integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teammember (
    mem_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comp_id uuid NOT NULL REFERENCES public.competitors(comp_id) ON DELETE CASCADE,
    mem_name text NOT NULL,
    mem_expe integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matches (
    match_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id uuid NOT NULL REFERENCES public.tournament(tour_id) ON DELETE CASCADE,
    round integer,
    stage text,
    group_name text,
    status text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'ready', 'waiting', 'running', 'paused', 'completed', 'resolved', 'archived', 'bye')),
    scheduled_start timestamptz,
    scheduled_end timestamptz,
    elapsed_ms bigint NOT NULL DEFAULT 0,
    running_since timestamptz,
    tour_pausedate timestamptz,
    competitor1_id uuid REFERENCES public.competitors(comp_id) ON DELETE SET NULL,
    competitor2_id uuid REFERENCES public.competitors(comp_id) ON DELETE SET NULL,
    score1 numeric,
    score2 numeric,
    winning_competitor_id uuid REFERENCES public.competitors(comp_id) ON DELETE SET NULL,
    result1 text,
    result2 text,
    is_draw boolean NOT NULL DEFAULT false,
    next_winner_match_id uuid REFERENCES public.matches(match_id) ON DELETE SET NULL,
    next_loser_match_id uuid REFERENCES public.matches(match_id) ON DELETE SET NULL,
    round_scores jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_stat_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES public.tournament(tour_id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('INTEGER', 'PERCENTAGE', 'TEXT', 'DURATION', 'BOOLEAN')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tournament_id, name)
);

CREATE TABLE IF NOT EXISTS public.match_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
    name text NOT NULL,
    type text CHECK (type IN ('INTEGER', 'PERCENTAGE', 'TEXT', 'DURATION', 'BOOLEAN')),
    value text,
    comp_id uuid REFERENCES public.competitors(comp_id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_favorites (
    favorite_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id uuid NOT NULL REFERENCES public.tournament(tour_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    reminder_sent_for_startdate date,
    reminder_claimed_for_startdate date,
    reminder_claimed_at timestamptz,
    reminder_sent_at timestamptz,
    UNIQUE (user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles (role);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles (email);
CREATE INDEX IF NOT EXISTS idx_tournament_created_by ON public.tournament (created_by);
CREATE INDEX IF NOT EXISTS idx_tournament_sp_id ON public.tournament (sp_id);
CREATE INDEX IF NOT EXISTS idx_tournament_status ON public.tournament (tour_status);
CREATE INDEX IF NOT EXISTS idx_tournament_startdate ON public.tournament (tour_startdate);
CREATE INDEX IF NOT EXISTS idx_competitors_tour_id ON public.competitors (tour_id);
CREATE INDEX IF NOT EXISTS idx_teammember_comp_id ON public.teammember (comp_id);
CREATE INDEX IF NOT EXISTS idx_matches_tour_id ON public.matches (tour_id);
CREATE INDEX IF NOT EXISTS idx_matches_competitor1 ON public.matches (competitor1_id);
CREATE INDEX IF NOT EXISTS idx_matches_competitor2 ON public.matches (competitor2_id);
CREATE INDEX IF NOT EXISTS idx_matches_winner ON public.matches (winning_competitor_id);
CREATE INDEX IF NOT EXISTS idx_matches_stage_round ON public.matches (stage, round);
CREATE INDEX IF NOT EXISTS idx_tournament_stat_templates_tournament_id ON public.tournament_stat_templates (tournament_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_match_id ON public.match_stats (match_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_comp_id ON public.match_stats (comp_id);
CREATE INDEX IF NOT EXISTS idx_tournament_favorites_tour_id ON public.tournament_favorites (tour_id);
CREATE INDEX IF NOT EXISTS idx_tournament_favorites_user_id ON public.tournament_favorites (user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teammember ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_stat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_favorites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.user_roles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.id = auth.uid() AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.is_disable IS DISTINCT FROM OLD.is_disable) THEN
            RAISE EXCEPTION 'Users cannot change their own role or disable flag.';
        END IF;
    END IF;

    IF TG_OP = 'INSERT' AND NEW.id IS DISTINCT FROM auth.uid() THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.user_roles AS actor
            WHERE actor.id = auth.uid()
              AND lower(actor.role) IN ('super_admin', 'superadmin')
        ) THEN
            RAISE EXCEPTION 'Only a super admin can create a user role row directly.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_role_abuse ON public.user_roles;
CREATE TRIGGER prevent_user_role_abuse
BEFORE INSERT OR UPDATE OF role, is_disable ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_roles();

CREATE OR REPLACE FUNCTION public.guard_tournament_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'INSERT') THEN
        IF NEW.created_by IS DISTINCT FROM auth.uid() AND NOT EXISTS (
            SELECT 1
            FROM public.user_roles AS actor
            WHERE actor.id = auth.uid()
              AND lower(actor.role) IN ('super_admin', 'superadmin')
        ) THEN
            RAISE EXCEPTION 'Only the tournament owner or a super admin may alter ownership.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_tournament_ownership_forgery ON public.tournament;
CREATE TRIGGER prevent_tournament_ownership_forgery
BEFORE INSERT OR UPDATE OF created_by ON public.tournament
FOR EACH ROW
EXECUTE FUNCTION public.guard_tournament_ownership();

DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin"
ON public.user_roles
FOR SELECT
USING (
    id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "user_roles_update_own_profile_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_update_own_profile_or_admin"
ON public.user_roles
FOR UPDATE
USING (
    id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
)
WITH CHECK (
    id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "user_roles_insert_super_admin_only" ON public.user_roles;
CREATE POLICY "user_roles_insert_super_admin_only"
ON public.user_roles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "sport_read_public" ON public.sport;
CREATE POLICY "sport_read_public"
ON public.sport
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "tournament_select_public_or_owned" ON public.tournament;
CREATE POLICY "tournament_select_public_or_owned"
ON public.tournament
FOR SELECT
USING (
    COALESCE(tour_status, 'draft') <> 'draft'
    OR created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "tournament_insert_owned_or_admin" ON public.tournament;
CREATE POLICY "tournament_insert_owned_or_admin"
ON public.tournament
FOR INSERT
WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "tournament_update_owned_or_admin" ON public.tournament;
CREATE POLICY "tournament_update_owned_or_admin"
ON public.tournament
FOR UPDATE
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
)
WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "tournament_delete_owned_or_admin" ON public.tournament;
CREATE POLICY "tournament_delete_owned_or_admin"
ON public.tournament
FOR DELETE
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "competitors_select_tour_access" ON public.competitors;
CREATE POLICY "competitors_select_tour_access"
ON public.competitors
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = competitors.tour_id
          AND (
              COALESCE(t.tour_status, 'draft') <> 'draft'
              OR t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "competitors_manage_tour_access" ON public.competitors;
CREATE POLICY "competitors_manage_tour_access"
ON public.competitors
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = competitors.tour_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "competitors_update_tour_access" ON public.competitors;
CREATE POLICY "competitors_update_tour_access"
ON public.competitors
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = competitors.tour_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = competitors.tour_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "teammember_select_access" ON public.teammember;
CREATE POLICY "teammember_select_access"
ON public.teammember
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.competitors AS c
        JOIN public.tournament AS t ON t.tour_id = c.tour_id
        WHERE c.comp_id = teammember.comp_id
          AND (
              COALESCE(t.tour_status, 'draft') <> 'draft'
              OR t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "teammember_manage_access" ON public.teammember;
CREATE POLICY "teammember_manage_access"
ON public.teammember
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.competitors AS c
        JOIN public.tournament AS t ON t.tour_id = c.tour_id
        WHERE c.comp_id = teammember.comp_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "matches_select_public_or_owned" ON public.matches;
CREATE POLICY "matches_select_public_or_owned"
ON public.matches
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = matches.tour_id
          AND (
              COALESCE(t.tour_status, 'draft') <> 'draft'
              OR t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "matches_manage_access" ON public.matches;
CREATE POLICY "matches_manage_access"
ON public.matches
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = matches.tour_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "matches_update_access" ON public.matches;
CREATE POLICY "matches_update_access"
ON public.matches
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = matches.tour_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = matches.tour_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "tournament_stat_templates_all_access" ON public.tournament_stat_templates;
CREATE POLICY "tournament_stat_templates_all_access"
ON public.tournament_stat_templates
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = tournament_stat_templates.tournament_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.tournament AS t
        WHERE t.tour_id = tournament_stat_templates.tournament_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "match_stats_all_access" ON public.match_stats;
CREATE POLICY "match_stats_all_access"
ON public.match_stats
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.matches AS m
        JOIN public.tournament AS t ON t.tour_id = m.tour_id
        WHERE m.match_id = match_stats.match_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.matches AS m
        JOIN public.tournament AS t ON t.tour_id = m.tour_id
        WHERE m.match_id = match_stats.match_id
          AND (
              t.created_by = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.user_roles AS actor
                  WHERE actor.id = auth.uid()
                    AND lower(actor.role) IN ('super_admin', 'superadmin')
              )
          )
    )
);

DROP POLICY IF EXISTS "tournament_favorites_select_own" ON public.tournament_favorites;
CREATE POLICY "tournament_favorites_select_own"
ON public.tournament_favorites
FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "tournament_favorites_manage_own" ON public.tournament_favorites;
CREATE POLICY "tournament_favorites_manage_own"
ON public.tournament_favorites
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "tournament_favorites_update_own" ON public.tournament_favorites;
CREATE POLICY "tournament_favorites_update_own"
ON public.tournament_favorites
FOR UPDATE
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "tournament_favorites_delete_own" ON public.tournament_favorites;
CREATE POLICY "tournament_favorites_delete_own"
ON public.tournament_favorites
FOR DELETE
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.user_roles AS actor
        WHERE actor.id = auth.uid()
          AND lower(actor.role) IN ('super_admin', 'superadmin')
    )
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('tournament-banners', 'tournament-banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_authenticated_write" ON storage.objects;
CREATE POLICY "avatars_authenticated_write"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "tournament_banners_public_read" ON storage.objects;
CREATE POLICY "tournament_banners_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tournament-banners');

DROP POLICY IF EXISTS "tournament_banners_authenticated_upload" ON storage.objects;
CREATE POLICY "tournament_banners_authenticated_upload"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'tournament-banners'
    AND auth.role() = 'authenticated'
    AND (storage.extension(name) IN ('jpg','jpeg','png','webp','gif'))
);

DROP POLICY IF EXISTS "tournament_banners_authenticated_update" ON storage.objects;
CREATE POLICY "tournament_banners_authenticated_update"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'tournament-banners'
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'tournament-banners'
    AND auth.role() = 'authenticated'
    AND (storage.extension(name) IN ('jpg','jpeg','png','webp','gif'))
);

DROP POLICY IF EXISTS "tournament_banners_authenticated_delete" ON storage.objects;
CREATE POLICY "tournament_banners_authenticated_delete"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'tournament-banners'
    AND auth.role() = 'authenticated'
);

COMMIT;
