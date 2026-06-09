
-- 1. Tighten user_roles: explicit INSERT/UPDATE/DELETE policies admin-only, scoped to authenticated
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;

CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Scope "Admins view all profiles" to authenticated only
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Remove client INSERT on audit_logs; provide SECURITY DEFINER RPC instead
DROP POLICY IF EXISTS "Authenticated can insert own audit logs" ON public.audit_logs;

CREATE OR REPLACE FUNCTION public.log_audit(
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL,
  _actor_role text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Only privileged roles may write audit entries
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'vendor'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized to write audit logs';
  END IF;
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), _actor_role, _action, _entity_type, _entity_id, _metadata);
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit(text, text, text, jsonb, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, text, jsonb, text) TO authenticated;
