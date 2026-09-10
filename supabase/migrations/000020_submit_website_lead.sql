-- Public website lead capture.
-- Does NOT weaken table RLS on public.leads.
-- Anonymous visitors insert only through this SECURITY DEFINER RPC.
-- source and stage are forced server-side and cannot be supplied by the client.

CREATE OR REPLACE FUNCTION public.submit_website_lead(
  p_name     text,
  p_phone    text,
  p_email    text,
  p_goal     text,
  p_interest text,
  p_message  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name     text;
  v_phone    text;
  v_digits   text;
  v_email    text;
  v_goal     text;
  v_interest text;
  v_goal_label text;
  v_interest_label text;
  v_message  text;
  v_notes    text;
  v_id       uuid;
  v_existing uuid;
  v_recent   int;
  v_duplicate boolean := false;
BEGIN
  v_name := nullif(btrim(p_name), '');
  IF v_name IS NULL OR char_length(v_name) < 2 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = '22023';
  END IF;

  v_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  IF v_digits LIKE '91%' AND char_length(v_digits) = 12 THEN
    v_digits := substr(v_digits, 3);
  END IF;
  IF char_length(v_digits) <> 10 OR v_digits !~ '^[6-9]' THEN
    RAISE EXCEPTION 'invalid_phone' USING ERRCODE = '22023';
  END IF;
  v_phone := v_digits;

  v_email := nullif(lower(btrim(coalesce(p_email, ''))), '');
  IF v_email IS NOT NULL AND (
       char_length(v_email) > 120
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  v_goal := btrim(coalesce(p_goal, ''));
  IF v_goal NOT IN (
    'weight-loss', 'muscle-gain', 'general-fitness',
    'strength', 'endurance', 'personal-training', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_goal' USING ERRCODE = '22023';
  END IF;

  v_interest := btrim(coalesce(p_interest, ''));
  IF v_interest NOT IN (
    'early-access', 'membership', 'personal-training', 'strength', 'general'
  ) THEN
    RAISE EXCEPTION 'invalid_interest' USING ERRCODE = '22023';
  END IF;

  v_goal_label := CASE v_goal
    WHEN 'weight-loss' THEN 'Weight Loss'
    WHEN 'muscle-gain' THEN 'Muscle Gain'
    WHEN 'general-fitness' THEN 'General Fitness'
    WHEN 'strength' THEN 'Strength'
    WHEN 'endurance' THEN 'Endurance'
    WHEN 'personal-training' THEN 'Personal Training'
    ELSE 'Other'
  END;

  v_interest_label := CASE v_interest
    WHEN 'early-access' THEN 'Early Access'
    WHEN 'membership' THEN 'Membership Information'
    WHEN 'personal-training' THEN 'Personal Training'
    WHEN 'strength' THEN 'Strength Training'
    ELSE 'General Enquiry'
  END;

  v_message := nullif(btrim(coalesce(p_message, '')), '');
  IF v_message IS NOT NULL AND char_length(v_message) > 1000 THEN
    v_message := left(v_message, 1000);
  END IF;

  v_notes :=
    'Goal: ' || v_goal_label || E'\n' ||
    'Interest: ' || v_interest_label ||
    CASE WHEN v_message IS NOT NULL THEN E'\nMessage: ' || v_message ELSE '' END;

  SELECT count(*) INTO v_recent
  FROM public.leads
  WHERE source = 'Website'
    AND phone = v_phone
    AND created_at > now() - interval '10 minutes';

  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = '54000';
  END IF;

  -- Re-use an open website enquiry. Closed/won leads stay historical.
  SELECT id INTO v_existing
  FROM public.leads
  WHERE source = 'Website'
    AND (
      phone = v_phone
      OR (v_email IS NOT NULL AND email IS NOT NULL AND lower(email) = v_email)
    )
    AND coalesce(lower(stage), '') NOT IN ('lost', 'won', 'converted')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    UPDATE public.leads
    SET
      name = v_name,
      phone = v_phone,
      email = coalesce(v_email, email),
      notes = CASE
        WHEN notes IS NULL OR btrim(notes) = '' THEN v_notes
        ELSE notes || E'\n---\n' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') || E'\n' || v_notes
      END,
      updated_at = now()
    WHERE id = v_existing;
    v_id := v_existing;
    v_duplicate := true;
  ELSE
    INSERT INTO public.leads (
      name, phone, email, source, language, stage, notes
    ) VALUES (
      v_name, v_phone, v_email, 'Website', 'en', 'new', v_notes
    )
    RETURNING id INTO v_id;
  END IF;

  BEGIN
    PERFORM public.insert_audit_log(
      CASE WHEN v_duplicate THEN 'WEBSITE_LEAD_UPDATE' ELSE 'WEBSITE_LEAD' END,
      'lead',
      v_id,
      NULL,
      jsonb_build_object(
        'source', 'Website',
        'stage', 'new',
        'duplicate', v_duplicate
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'id', v_id,
    'duplicate', v_duplicate
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_website_lead(text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_website_lead(text, text, text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.submit_website_lead(text, text, text, text, text, text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.submit_website_lead(text, text, text, text, text, text)
  TO anon, authenticated;

COMMENT ON FUNCTION public.submit_website_lead(text, text, text, text, text, text) IS
  'Public website early-access capture. Forces source=Website and stage=new. Does not create a member account.';
