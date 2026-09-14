REVOKE EXECUTE ON FUNCTION public.ai_tutor_consume(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_tutor_consume(uuid) TO service_role;