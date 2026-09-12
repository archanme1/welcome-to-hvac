ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_manual_user_idx
  ON public.subscriptions (user_id)
  WHERE provider = 'manual';

CREATE OR REPLACE FUNCTION public.is_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        (status IN ('active','trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status IN ('canceled','past_due') AND current_period_end IS NOT NULL AND current_period_end > now())
      )
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor')
  );
$function$;
