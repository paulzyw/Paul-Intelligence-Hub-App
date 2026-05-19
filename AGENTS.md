# Project Rules and Guidelines

## Supabase Data API Access (Post-May 2026)

To ensure compatibility with Supabase's updated Data API access policies, any SQL script that creates a new table or function in the `public` schema MUST include explicit `GRANT` statements. This ensures that the `anon`, `authenticated`, and `service_role` roles have the necessary permissions to access these objects via `supabase-js`, PostgREST, or GraphQL.

### Rule for Table Creation
When creating a new table (e.g., `public.my_table`), always append the following grants:

```sql
-- Grant access for Data API
GRANT SELECT ON public.my_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_table TO service_role;

-- Enable RLS (as per project standard)
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
```

### Rule for Function Creation
When creating a new function accessible via RPC, append:

```sql
-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.my_function(arg_type) TO anon, authenticated, service_role;
```

---

## Model Selection

- Prefer GA models over preview models.
- As of May 2026, use `gemini-3.1-flash-lite` for high-throughput, low-latency tasks.
