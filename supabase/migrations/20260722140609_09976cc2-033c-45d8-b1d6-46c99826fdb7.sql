
CREATE OR REPLACE FUNCTION public.apply_attribute_rename(
  old_keys text[],
  new_key text,
  value_map jsonb
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  updated_count integer := 0;
  oz jsonb;
  k text;
  cur_val text;
  new_val text;
  found_key text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR r IN
    SELECT id, COALESCE(ozellikler, '{}'::jsonb) AS ozellikler
    FROM public.products
    WHERE ozellikler ?| old_keys
  LOOP
    oz := r.ozellikler;
    found_key := NULL;
    -- find first matching old key present
    FOREACH k IN ARRAY old_keys LOOP
      IF oz ? k THEN
        found_key := k;
        EXIT;
      END IF;
    END LOOP;
    IF found_key IS NULL THEN CONTINUE; END IF;

    cur_val := oz ->> found_key;
    new_val := COALESCE(value_map ->> cur_val, cur_val);

    -- remove old key(s) then set new key with (possibly remapped) value
    FOREACH k IN ARRAY old_keys LOOP
      oz := oz - k;
    END LOOP;
    oz := jsonb_set(oz, ARRAY[new_key], to_jsonb(new_val), true);

    UPDATE public.products SET ozellikler = oz, updated_at = now() WHERE id = r.id;
    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_attribute_rename(text[], text, jsonb) TO authenticated;
