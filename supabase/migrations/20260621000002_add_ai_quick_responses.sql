-- =========================================
-- Tabela: ai_quick_responses
-- =========================================
CREATE TABLE IF NOT EXISTS public.ai_quick_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  response TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_quick_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ai_quick_responses select" ON public.ai_quick_responses;
CREATE POLICY "Admins manage ai_quick_responses select" ON public.ai_quick_responses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage ai_quick_responses insert" ON public.ai_quick_responses;
CREATE POLICY "Admins manage ai_quick_responses insert" ON public.ai_quick_responses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage ai_quick_responses update" ON public.ai_quick_responses;
CREATE POLICY "Admins manage ai_quick_responses update" ON public.ai_quick_responses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage ai_quick_responses delete" ON public.ai_quick_responses;
CREATE POLICY "Admins manage ai_quick_responses delete" ON public.ai_quick_responses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger update_updated_at_column
DROP TRIGGER IF EXISTS update_ai_quick_responses_updated_at ON public.ai_quick_responses;
CREATE TRIGGER update_ai_quick_responses_updated_at BEFORE UPDATE ON public.ai_quick_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =========================================
-- Tabela: ai_chat_logs
-- =========================================
CREATE TABLE IF NOT EXISTS public.ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  response_source TEXT NOT NULL CHECK (response_source IN ('quick_response', 'gemini')),
  matched_quick_response_id UUID REFERENCES public.ai_quick_responses(id) ON DELETE SET NULL,
  matched_quick_response_title TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ai_chat_logs select" ON public.ai_chat_logs;
CREATE POLICY "Admins manage ai_chat_logs select" ON public.ai_chat_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Apenas service_role pode inserir via Edge Function (bypass RLS)
